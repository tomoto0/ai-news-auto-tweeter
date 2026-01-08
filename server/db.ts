import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  xCredentials, InsertXCredentials, XCredentials,
  tweetHistory, InsertTweetHistory, TweetHistory,
  scheduleSettings, InsertScheduleSettings, ScheduleSettings,
  twitterAccounts, InsertTwitterAccount, TwitterAccount,
  accountSchedules, InsertAccountSchedule, AccountSchedule
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// X Credentials Operations
// ============================================

export async function getXCredentialsByUserId(userId: number): Promise<XCredentials | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(xCredentials).where(eq(xCredentials.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertXCredentials(data: InsertXCredentials): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getXCredentialsByUserId(data.userId);
  
  if (existing) {
    await db.update(xCredentials)
      .set({
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        accessToken: data.accessToken,
        accessTokenSecret: data.accessTokenSecret,
        isValid: data.isValid ?? true,
      })
      .where(eq(xCredentials.userId, data.userId));
  } else {
    await db.insert(xCredentials).values(data);
  }
}

export async function deleteXCredentials(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(xCredentials).where(eq(xCredentials.userId, userId));
}

export async function updateXCredentialsValidity(userId: number, isValid: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(xCredentials)
    .set({ isValid })
    .where(eq(xCredentials.userId, userId));
}

// ============================================
// Tweet History Operations
// ============================================

export async function createTweetHistory(data: InsertTweetHistory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tweetHistory).values(data);
  return Number(result[0].insertId);
}

export async function getTweetHistoryByUserId(userId: number, limit: number = 50): Promise<TweetHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(tweetHistory)
    .where(eq(tweetHistory.userId, userId))
    .orderBy(desc(tweetHistory.createdAt))
    .limit(limit);
}

export async function updateTweetStatus(
  id: number, 
  status: "pending" | "posted" | "failed", 
  tweetId?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<TweetHistory> = { status };
  if (tweetId) updateData.tweetId = tweetId;
  if (errorMessage) updateData.errorMessage = errorMessage;
  if (status === "posted") updateData.postedAt = new Date();

  await db.update(tweetHistory)
    .set(updateData)
    .where(eq(tweetHistory.id, id));
}

export async function deleteTweetHistory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tweetHistory)
    .where(eq(tweetHistory.id, id));
}

// ============================================
// Schedule Settings Operations
// ============================================

export async function getScheduleSettings(userId: number): Promise<ScheduleSettings | undefined> {
  return getScheduleSettingsByUserId(userId);
}

export async function getScheduleSettingsByUserId(userId: number): Promise<ScheduleSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(scheduleSettings)
    .where(eq(scheduleSettings.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertScheduleSettings(data: InsertScheduleSettings): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getScheduleSettingsByUserId(data.userId);
  
  if (existing) {
    await db.update(scheduleSettings)
      .set({
        isEnabled: data.isEnabled,
        frequency: data.frequency,
        preferredHour: data.preferredHour,
        timezone: data.timezone,
        maxTweetsPerDay: data.maxTweetsPerDay,
        cronExpression: (data as any).cronExpression,
      })
      .where(eq(scheduleSettings.userId, data.userId));
  } else {
    await db.insert(scheduleSettings).values(data);
  }
}

export async function updateLastRunAt(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scheduleSettings)
    .set({ lastRunAt: new Date() })
    .where(eq(scheduleSettings.userId, userId));
}

export async function getEnabledSchedules(): Promise<ScheduleSettings[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(scheduleSettings)
    .where(eq(scheduleSettings.isEnabled, true));
}

// ============================================
// Twitter Accounts Operations
// ============================================

export async function getTwitterAccountsByUserId(userId: number): Promise<TwitterAccount[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(twitterAccounts)
    .where(eq(twitterAccounts.userId, userId))
    .orderBy(desc(twitterAccounts.createdAt));
}

export async function getTwitterAccountById(accountId: number): Promise<TwitterAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(twitterAccounts)
    .where(eq(twitterAccounts.id, accountId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createTwitterAccount(data: InsertTwitterAccount): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(twitterAccounts).values(data);
  return Number(result[0].insertId);
}

export async function updateTwitterAccount(
  accountId: number,
  data: Partial<InsertTwitterAccount>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(twitterAccounts)
    .set(data)
    .where(eq(twitterAccounts.id, accountId));
}

export async function deleteTwitterAccount(accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(twitterAccounts)
    .where(eq(twitterAccounts.id, accountId));
}

export async function updateTwitterAccountValidity(
  accountId: number,
  isValid: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(twitterAccounts)
    .set({ isValid, lastVerifiedAt: new Date() })
    .where(eq(twitterAccounts.id, accountId));
}

// ============================================
// Account Schedules Operations
// ============================================

export async function getAccountSchedulesByAccountId(accountId: number): Promise<AccountSchedule | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(accountSchedules)
    .where(eq(accountSchedules.accountId, accountId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getEnabledAccountSchedules(): Promise<AccountSchedule[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(accountSchedules)
    .where(eq(accountSchedules.isEnabled, true));
}

export async function createAccountSchedule(data: InsertAccountSchedule): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accountSchedules).values(data);
  return Number(result[0].insertId);
}

export async function upsertAccountSchedule(data: InsertAccountSchedule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAccountSchedulesByAccountId(data.accountId);
  
  if (existing) {
    await db.update(accountSchedules)
      .set({
        isEnabled: data.isEnabled,
        frequency: data.frequency,
        preferredHour: data.preferredHour,
        timezone: data.timezone,
        maxTweetsPerDay: data.maxTweetsPerDay,
        cronExpression: (data as any).cronExpression,
      })
      .where(eq(accountSchedules.accountId, data.accountId));
  } else {
    await db.insert(accountSchedules).values(data);
  }
}

export async function updateAccountScheduleLastRunAt(accountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accountSchedules)
    .set({ lastRunAt: new Date() })
    .where(eq(accountSchedules.accountId, accountId));
}
