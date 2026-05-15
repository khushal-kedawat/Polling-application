import { db } from '../db/index.js';
import { polls, questions, options, responses, answers } from '../db/schema.js';
import { eq, sql, and, isNull, isNotNull } from 'drizzle-orm';

export async function computeAnalytics(pollId) {
  const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  if (!poll) return null;

  const [{ count: totalResponses }] = await db
    .select({ count: sql`count(*)::int` })
    .from(responses)
    .where(eq(responses.pollId, pollId));

  const qRows = await db
    .select()
    .from(questions)
    .where(eq(questions.pollId, pollId))
    .orderBy(questions.orderIndex);

  const oRows = await db
    .select({
      id: options.id,
      questionId: options.questionId,
      text: options.text,
      orderIndex: options.orderIndex,
    })
    .from(options)
    .innerJoin(questions, eq(options.questionId, questions.id))
    .where(eq(questions.pollId, pollId))
    .orderBy(options.orderIndex);

  // counts per option
  const optionCounts = await db
    .select({
      questionId: answers.questionId,
      optionId: answers.selectedOptionId,
      count: sql`count(*)::int`,
    })
    .from(answers)
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(and(eq(questions.pollId, pollId), isNotNull(answers.selectedOptionId)))
    .groupBy(answers.questionId, answers.selectedOptionId);

  // skip counts (selectedOptionId IS NULL) per question
  const skipCounts = await db
    .select({
      questionId: answers.questionId,
      count: sql`count(*)::int`,
    })
    .from(answers)
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(and(eq(questions.pollId, pollId), isNull(answers.selectedOptionId)))
    .groupBy(answers.questionId);

  const countMap = new Map();
  for (const r of optionCounts) {
    countMap.set(`${r.questionId}:${r.optionId}`, r.count);
  }
  const skipMap = new Map();
  for (const r of skipCounts) skipMap.set(r.questionId, r.count);

  const questionsOut = qRows.map((q) => {
    const opts = oRows
      .filter((o) => o.questionId === q.id)
      .map((o) => {
        const count = countMap.get(`${q.id}:${o.id}`) ?? 0;
        const pct = totalResponses ? Math.round((count / totalResponses) * 1000) / 10 : 0;
        return { id: o.id, text: o.text, count, pct };
      });
    return {
      id: q.id,
      text: q.text,
      isRequired: q.isRequired,
      orderIndex: q.orderIndex,
      options: opts,
      skipCount: skipMap.get(q.id) ?? 0,
    };
  });

  return {
    pollId,
    totalResponses,
    expired: new Date(poll.expiresAt).getTime() < Date.now(),
    isPublished: poll.isPublished,
    questions: questionsOut,
  };
}
