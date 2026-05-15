import { db } from '../db/index.js';
import { polls, questions, options, responses } from '../db/schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';
import { newShareSlug } from '../utils/slug.js';
import { HttpError } from '../utils/httpError.js';
import { computeAnalytics } from '../services/analytics.service.js';

async function loadFullPoll(pollId) {
  const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  if (!poll) return null;

  const qRows = await db
    .select()
    .from(questions)
    .where(eq(questions.pollId, pollId))
    .orderBy(questions.orderIndex);

  const oRows = qRows.length
    ? await db
        .select()
        .from(options)
        .innerJoin(questions, eq(options.questionId, questions.id))
        .where(eq(questions.pollId, pollId))
        .orderBy(options.orderIndex)
    : [];

  const optionsByQuestion = new Map();
  for (const row of oRows) {
    const o = row.options;
    if (!optionsByQuestion.has(o.questionId)) optionsByQuestion.set(o.questionId, []);
    optionsByQuestion.get(o.questionId).push({
      id: o.id,
      text: o.text,
      orderIndex: o.orderIndex,
    });
  }

  return {
    ...poll,
    questions: qRows.map((q) => ({
      id: q.id,
      text: q.text,
      isRequired: q.isRequired,
      orderIndex: q.orderIndex,
      options: optionsByQuestion.get(q.id) ?? [],
    })),
  };
}

export async function createPoll(req, res, next) {
  try {
    const { title, description, responseMode, expiresAt, questions: qs } = req.body;
    const shareSlug = newShareSlug();

    const result = await db.transaction(async (tx) => {
      const [poll] = await tx
        .insert(polls)
        .values({
          creatorId: req.user.id,
          title,
          description: description ?? null,
          responseMode,
          expiresAt: new Date(expiresAt),
          shareSlug,
        })
        .returning();

      for (let qi = 0; qi < qs.length; qi++) {
        const q = qs[qi];
        const [question] = await tx
          .insert(questions)
          .values({
            pollId: poll.id,
            text: q.text,
            isRequired: q.isRequired,
            orderIndex: qi,
          })
          .returning();

        await tx
          .insert(options)
          .values(q.options.map((o, oi) => ({
            questionId: question.id,
            text: o.text,
            orderIndex: oi,
          })));
      }

      return poll;
    });

    const full = await loadFullPoll(result.id);
    res.status(201).json({ poll: full });
  } catch (err) {
    next(err);
  }
}

export async function listMyPolls(req, res, next) {
  try {
    const rows = await db
      .select({
        id: polls.id,
        title: polls.title,
        description: polls.description,
        shareSlug: polls.shareSlug,
        responseMode: polls.responseMode,
        expiresAt: polls.expiresAt,
        isPublished: polls.isPublished,
        createdAt: polls.createdAt,
        responseCount: sql`(select count(*) from responses where responses.poll_id = polls.id)::int`,
      })
      .from(polls)
      .where(eq(polls.creatorId, req.user.id))
      .orderBy(desc(polls.createdAt));

    res.json({ polls: rows });
  } catch (err) {
    next(err);
  }
}

export async function getMyPoll(req, res, next) {
  try {
    const poll = await loadFullPoll(req.params.id);
    if (!poll || poll.creatorId !== req.user.id) {
      throw new HttpError(404, 'Poll not found');
    }
    res.json({ poll });
  } catch (err) {
    next(err);
  }
}

export async function updatePoll(req, res, next) {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, req.params.id)).limit(1);
    if (!poll || poll.creatorId !== req.user.id) throw new HttpError(404, 'Poll not found');

    const patch = { ...req.body, updatedAt: new Date() };
    if (patch.expiresAt) patch.expiresAt = new Date(patch.expiresAt);

    const [updated] = await db
      .update(polls)
      .set(patch)
      .where(eq(polls.id, poll.id))
      .returning();

    res.json({ poll: updated });
  } catch (err) {
    next(err);
  }
}

export async function deletePoll(req, res, next) {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, req.params.id)).limit(1);
    if (!poll || poll.creatorId !== req.user.id) throw new HttpError(404, 'Poll not found');

    await db.delete(polls).where(eq(polls.id, poll.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function publishPoll(req, res, next) {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, req.params.id)).limit(1);
    if (!poll || poll.creatorId !== req.user.id) throw new HttpError(404, 'Poll not found');

    const [updated] = await db
      .update(polls)
      .set({ isPublished: true, updatedAt: new Date() })
      .where(eq(polls.id, poll.id))
      .returning();

    // Notify any clients in the poll room that results are now public.
    req.io?.to(`poll:${poll.id}`).emit('poll:published', { pollId: poll.id });

    res.json({ poll: updated });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, req.params.id)).limit(1);
    if (!poll || poll.creatorId !== req.user.id) throw new HttpError(404, 'Poll not found');

    const analytics = await computeAnalytics(poll.id);
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}
