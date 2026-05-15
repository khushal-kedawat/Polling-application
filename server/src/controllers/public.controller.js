import { db } from '../db/index.js';
import { polls, questions, options, responses, answers } from '../db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';
import { HttpError } from '../utils/httpError.js';
import { computeAnalytics } from '../services/analytics.service.js';

function deriveState(poll) {
  if (poll.isPublished) return 'published';
  if (new Date(poll.expiresAt).getTime() < Date.now()) return 'expired';
  return 'open';
}

export async function getPublicPoll(req, res, next) {
  try {
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.shareSlug, req.params.slug))
      .limit(1);
    if (!poll) throw new HttpError(404, 'Poll not found');

    const qRows = await db
      .select()
      .from(questions)
      .where(eq(questions.pollId, poll.id))
      .orderBy(questions.orderIndex);

    const oRows = qRows.length
      ? await db
          .select()
          .from(options)
          .innerJoin(questions, eq(options.questionId, questions.id))
          .where(eq(questions.pollId, poll.id))
          .orderBy(options.orderIndex)
      : [];

    const optionsByQ = new Map();
    for (const row of oRows) {
      const o = row.options;
      if (!optionsByQ.has(o.questionId)) optionsByQ.set(o.questionId, []);
      optionsByQ.get(o.questionId).push({ id: o.id, text: o.text, orderIndex: o.orderIndex });
    }

    const state = deriveState(poll);

    const payload = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      responseMode: poll.responseMode,
      expiresAt: poll.expiresAt,
      isPublished: poll.isPublished,
      shareSlug: poll.shareSlug,
      state,
      questions: qRows.map((q) => ({
        id: q.id,
        text: q.text,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
        options: optionsByQ.get(q.id) ?? [],
      })),
    };

    if (state === 'published') {
      payload.analytics = await computeAnalytics(poll.id);
    }

    res.json({ poll: payload });
  } catch (err) {
    next(err);
  }
}

export async function submitResponse(req, res, next) {
  try {
    const { slug } = req.params;
    const [poll] = await db.select().from(polls).where(eq(polls.shareSlug, slug)).limit(1);
    if (!poll) throw new HttpError(404, 'Poll not found');

    if (new Date(poll.expiresAt).getTime() < Date.now()) {
      throw new HttpError(410, 'Poll has expired');
    }
    if (poll.isPublished) {
      throw new HttpError(409, 'Poll results have been published; responses are closed');
    }
    if (poll.responseMode === 'authenticated' && !req.user) {
      throw new HttpError(401, 'This poll requires authenticated responses');
    }

    const qRows = await db
      .select({
        id: questions.id,
        isRequired: questions.isRequired,
      })
      .from(questions)
      .where(eq(questions.pollId, poll.id));

    const qMap = new Map(qRows.map((q) => [q.id, q]));
    const optionRows = await db
      .select({ id: options.id, questionId: options.questionId })
      .from(options)
      .innerJoin(questions, eq(options.questionId, questions.id))
      .where(eq(questions.pollId, poll.id));
    const optionMap = new Map(optionRows.map((o) => [o.id, o]));

    const submitted = req.body.answers;
    const byQuestion = new Map();
    for (const a of submitted) {
      if (!qMap.has(a.questionId)) {
        throw new HttpError(400, 'Unknown question in submission', 'INVALID_QUESTION');
      }
      if (a.selectedOptionId) {
        const opt = optionMap.get(a.selectedOptionId);
        if (!opt || opt.questionId !== a.questionId) {
          throw new HttpError(400, 'Option does not belong to question', 'INVALID_OPTION');
        }
      }
      byQuestion.set(a.questionId, a.selectedOptionId ?? null);
    }

    for (const q of qRows) {
      if (q.isRequired && !byQuestion.get(q.id)) {
        throw new HttpError(400, 'Required question is unanswered', 'REQUIRED_MISSING', {
          questionId: q.id,
        });
      }
    }

    try {
      await db.transaction(async (tx) => {
        const [response] = await tx
          .insert(responses)
          .values({
            pollId: poll.id,
            respondentUserId: req.user?.id ?? null,
            respondentToken: req.user ? null : req.body.respondentToken ?? null,
          })
          .returning();

        const answerRows = [];
        for (const q of qRows) {
          answerRows.push({
            responseId: response.id,
            questionId: q.id,
            selectedOptionId: byQuestion.get(q.id) ?? null,
          });
        }
        if (answerRows.length) {
          await tx.insert(answers).values(answerRows);
        }
      });
    } catch (err) {
      if (err && err.code === '23505') {
        throw new HttpError(409, 'You have already responded to this poll', 'ALREADY_RESPONDED');
      }
      throw err;
    }

    // emit live analytics
    if (req.io) {
      const analytics = await computeAnalytics(poll.id);
      req.io.to(`poll:${poll.id}`).emit('poll:analytics', analytics);
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
