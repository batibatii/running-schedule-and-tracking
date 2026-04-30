import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  date,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// These tables are required by NextAuth Drizzle Adapter
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  distance: decimal("distance", { precision: 10, scale: 2 }), // in kilometers
  duration: integer("duration"), // in seconds
  pace: decimal("pace", { precision: 5, scale: 2 }), // minutes per km
  calories: integer("calories"),
  elevationGain: decimal("elevation_gain", { precision: 10, scale: 2 }), // in meters
  notes: text("notes"),
  runDate: timestamp("run_date").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  // Strava integration fields
  stravaActivityId: varchar("strava_activity_id", { length: 255 }).unique(),
  stravaData: jsonb("strava_data"), // Store raw Strava activity data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scheduled runs table
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  plannedDistance: decimal("planned_distance", { precision: 10, scale: 2 }),
  plannedDuration: integer("planned_duration"), // in seconds
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 10 }), // HH:MM format
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrencePattern: varchar("recurrence_pattern", { length: 50 }), // e.g., 'weekly', 'daily'
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Weekly workouts table - for the weekly schedule planner
export const weeklyWorkouts = pgTable("weekly_workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  sport: varchar("sport", { length: 50 }).default("running").notNull(),

  workoutType: varchar("workout_type", { length: 50 }).notNull(),

  heartRateZone: varchar("heart_rate_zone", { length: 10 }).notNull(),

  distance: decimal("distance", { precision: 10, scale: 2 }), // in kilometers
  duration: decimal("duration", { precision: 10, scale: 2 }), // in minutes
  pace: varchar("pace", { length: 10 }), // "MM:SS" format

  dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),

  weekStartDate: date("week_start_date").notNull(),

  title: varchar("title", { length: 255 }),
  notes: text("notes"), // Training details, comments

  completed: boolean("completed").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  runs: many(runs),
  schedules: many(schedules),
  weeklyWorkouts: many(weeklyWorkouts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const runsRelations = relations(runs, ({ one }) => ({
  user: one(users, {
    fields: [runs.userId],
    references: [users.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  user: one(users, {
    fields: [schedules.userId],
    references: [users.id],
  }),
}));

export const weeklyWorkoutsRelations = relations(weeklyWorkouts, ({ one }) => ({
  user: one(users, {
    fields: [weeklyWorkouts.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type WeeklyWorkout = typeof weeklyWorkouts.$inferSelect;
export type NewWeeklyWorkout = typeof weeklyWorkouts.$inferInsert;
