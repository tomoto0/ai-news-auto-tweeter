import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * X (Twitter) API credentials per user
 * Stores encrypted API keys for each user
 */
export const xCredentials = mysqlTable("x_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: text("apiKey").notNull(),
  apiSecret: text("apiSecret").notNull(),
  accessToken: text("accessToken").notNull(),
  accessTokenSecret: text("accessTokenSecret").notNull(),
  isValid: boolean("isValid").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type XCredentials = typeof xCredentials.$inferSelect;
export type InsertXCredentials = typeof xCredentials.$inferInsert;

/**
 * Tweet history - stores all posted tweets
 */
export const tweetHistory = mysqlTable("tweet_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  content: text("content").notNull(),
  originalNewsTitle: text("originalNewsTitle"),
  originalNewsUrl: text("originalNewsUrl"),
  tweetId: varchar("tweetId", { length: 64 }),
  status: mysqlEnum("status", ["pending", "posted", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  postedAt: timestamp("postedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TweetHistory = typeof tweetHistory.$inferSelect;
export type InsertTweetHistory = typeof tweetHistory.$inferInsert;

/**
 * Auto-tweet schedule settings per user
 */
export const scheduleSettings = mysqlTable("schedule_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  frequency: mysqlEnum("frequency", ["hourly", "every_3_hours", "every_6_hours", "daily"]).default("daily").notNull(),
  preferredHour: int("preferredHour").default(9),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Tokyo"),
  maxTweetsPerDay: int("maxTweetsPerDay").default(5),
  cronExpression: varchar("cronExpression", { length: 255 }).default("0 0 * * *"),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleSettings = typeof scheduleSettings.$inferSelect;
export type InsertScheduleSettings = typeof scheduleSettings.$inferInsert;

/**
 * Twitter accounts - stores multiple X (Twitter) accounts per user
 */
export const twitterAccounts = mysqlTable("twitter_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountHandle: varchar("accountHandle", { length: 255 }),
  apiKey: text("apiKey").notNull(),
  apiSecret: text("apiSecret").notNull(),
  accessToken: text("accessToken").notNull(),
  accessTokenSecret: text("accessTokenSecret").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isValid: boolean("isValid").default(true).notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwitterAccount = typeof twitterAccounts.$inferSelect;
export type InsertTwitterAccount = typeof twitterAccounts.$inferInsert;

/**
 * Account schedules - stores schedule settings per Twitter account
 */
export const accountSchedules = mysqlTable("account_schedules", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  userId: int("userId").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  frequency: mysqlEnum("frequency", ["hourly", "every_3_hours", "every_6_hours", "daily"]).default("daily").notNull(),
  preferredHour: int("preferredHour").default(9),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Tokyo"),
  maxTweetsPerDay: int("maxTweetsPerDay").default(5),
  cronExpression: varchar("cronExpression", { length: 255 }).default("0 0 * * *"),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountSchedule = typeof accountSchedules.$inferSelect;
export type InsertAccountSchedule = typeof accountSchedules.$inferInsert;
