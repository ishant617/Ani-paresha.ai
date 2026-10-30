import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const executionTraces = pgTable('execution_traces', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  runId: text('run_id').notNull().unique(),
  scenarioDescription: text('scenario_description').notNull(),
  steps: jsonb('steps').notNull(), // Array of TrajectoryStep
  createdAt: timestamp('created_at').defaultNow(),
});

export const testScenarios = pgTable('test_scenarios', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt').notNull(),
  expectedOutcome: text('expected_outcome'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const evaluationScorecards = pgTable('evaluation_scorecards', {
  id: serial('id').primaryKey(),
  traceId: integer('trace_id').references(() => executionTraces.id).notNull(),
  isSuccessful: boolean('is_successful').notNull(),
  failureCategory: text('failure_category').notNull(),
  confidenceScore: real('confidence_score').notNull(),
  rootCauseAnalysis: text('root_cause_analysis').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  executionTraces: many(executionTraces),
  testScenarios: many(testScenarios),
}));

export const executionTracesRelations = relations(executionTraces, ({ one, many }) => ({
  author: one(users, {
    fields: [executionTraces.userId],
    references: [users.id],
  }),
  scorecards: many(evaluationScorecards),
}));
