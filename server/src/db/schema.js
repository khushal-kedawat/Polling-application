import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const responseModeEnum = pgEnum('response_mode', ['anonymous', 'authenticated']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const polls = pgTable(
  'polls',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    shareSlug: varchar('share_slug', { length: 32 }).notNull().unique(),
    responseMode: responseModeEnum('response_mode').notNull().default('anonymous'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    creatorIdx: index('polls_creator_idx').on(t.creatorId),
  }),
);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    isRequired: boolean('is_required').notNull().default(false),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pollIdx: index('questions_poll_idx').on(t.pollId),
  }),
);

export const options = pgTable(
  'options',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    questionIdx: index('options_question_idx').on(t.questionId),
  }),
);

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    respondentUserId: uuid('respondent_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    respondentToken: varchar('respondent_token', { length: 64 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pollIdx: index('responses_poll_idx').on(t.pollId),
    uniqAuthed: uniqueIndex('responses_unique_authed')
      .on(t.pollId, t.respondentUserId)
      .where(sql`${t.respondentUserId} IS NOT NULL`),
    uniqAnon: uniqueIndex('responses_unique_anon')
      .on(t.pollId, t.respondentToken)
      .where(sql`${t.respondentToken} IS NOT NULL`),
  }),
);

export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    responseId: uuid('response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    selectedOptionId: uuid('selected_option_id').references(() => options.id, {
      onDelete: 'cascade',
    }),
  },
  (t) => ({
    responseIdx: index('answers_response_idx').on(t.responseId),
    aggIdx: index('answers_agg_idx').on(t.questionId, t.selectedOptionId),
  }),
);
