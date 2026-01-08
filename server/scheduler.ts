import * as cron from "node-cron";
import { fetchAINews, clearNewsCache } from "./news";
import { invokeLLM } from "./_core/llm";
import { postTweet } from "./twitter";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users, scheduleSettings, tweetHistory } from "../drizzle/schema";

interface ScheduleJob {
  id: string;
  task: any; // ReturnType from cron.schedule
}

const activeJobs: Map<number, ScheduleJob> = new Map();
const activeAccountJobs: Map<number, ScheduleJob> = new Map();

/**
 * Generate a summary for a news item using LLM
 */
async function generateSummary(title: string, description: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `あなたはAI関連ニュースを要約してTwitter投稿用のテキストを生成するアシスタントです。
以下のルールに従ってください：
1. 280文字以内（日本語の場合は140文字程度）で要約
2. ニュースの重要なポイントを簡潔に伝える
3. 適切なハッシュタグを1-2個追加（#AI #人工知能 など）
4. URLは含めない（後で自動追加される）
5. 絵文字は控えめに使用（最大1-2個）
6. 興味を引く書き出しにする`
        },
        {
          role: "user",
          content: `以下のニュースを要約してツイート用テキストを生成してください：

タイトル: ${title}
内容: ${description}`
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : "";
  } catch (error) {
    console.error("[Scheduler] Error generating summary:", error);
    return "";
  }
}

/**
 * Execute automatic tweet posting for a user
 */
async function executeAutoPost(userId: number, schedule: any): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available");
      return;
    }

    // Get user's X credentials
    const credentialsResult = await db
      .select()
      .from(require("../drizzle/schema").xCredentials)
      .where(eq(require("../drizzle/schema").xCredentials.userId, userId))
      .limit(1);

    if (!credentialsResult || credentialsResult.length === 0) {
      console.warn(`[Scheduler] No X credentials found for user ${userId}`);
      return;
    }

    const credentials = credentialsResult[0];
    if (!credentials.isValid) {
      console.warn(`[Scheduler] X credentials invalid for user ${userId}`);
      return;
    }

    // Fetch fresh news
    clearNewsCache();
    const news = await fetchAINews();

    if (news.length === 0) {
      console.warn("[Scheduler] No news available to post");
      return;
    }

    // Select a random news item
    const selectedNews = news[Math.floor(Math.random() * news.length)];

    // Generate summary
    const summary = await generateSummary(selectedNews.title, selectedNews.description);

    if (!summary || summary.length === 0) {
      console.warn("[Scheduler] Failed to generate summary");
      return;
    }

    // Post to X
    const result = await postTweet(
      {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        accessToken: credentials.accessToken,
        accessTokenSecret: credentials.accessTokenSecret,
      },
      summary
    );

    // Record in tweet history
    const tweetHistorySchema = require("../drizzle/schema").tweetHistory;
    await db.insert(tweetHistorySchema).values({
      userId,
      content: summary,
      originalNewsTitle: selectedNews.title,
      originalNewsUrl: selectedNews.url,
      status: "posted",
      tweetId: result.tweetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[Scheduler] Successfully posted tweet for user ${userId}: ${result.tweetId}`);
  } catch (error) {
    console.error(`[Scheduler] Error executing auto post for user ${userId}:`, error);
  }
}

/**
 * Start a schedule job for a user
 */
export function startScheduleJob(userId: number, schedule: any): void {
  if (!schedule.isEnabled || !schedule.cronExpression) {
    console.warn(`[Scheduler] Schedule not properly configured for user ${userId}`);
    return;
  }

  // Stop existing job if any
  stopScheduleJob(userId);

  try {
    const task = cron.schedule(schedule.cronExpression as string, async () => {
      console.log(`[Scheduler] Executing scheduled task for user ${userId}`);
      await executeAutoPost(userId, schedule);
    });

    activeJobs.set(userId, {
      id: `job-${userId}-${Date.now()}`,
      task,
    });

    console.log(`[Scheduler] Started schedule job for user ${userId}: ${schedule.cronExpression}`);
  } catch (error) {
    console.error(`[Scheduler] Error starting schedule job for user ${userId}:`, error);
  }
}

/**
 * Stop a schedule job for a user
 */
export function stopScheduleJob(userId: number): void {
  const job = activeJobs.get(userId);
  if (job) {
    job.task.stop();
    activeJobs.delete(userId);
    console.log(`[Scheduler] Stopped schedule job for user ${userId}`);
  }
}

/**
 * Initialize all active schedules from database
 */
export async function initializeSchedules(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available for initialization");
      return;
    }

    const scheduleSettingsSchema = require("../drizzle/schema").scheduleSettings;
    const allSchedules = await db.select().from(scheduleSettingsSchema);

    for (const schedule of allSchedules) {
      if (schedule.isEnabled) {
        startScheduleJob(schedule.userId, schedule);
      }
    }

    console.log(`[Scheduler] Initialized ${allSchedules.length} schedules`);
  } catch (error) {
    console.error("[Scheduler] Error initializing schedules:", error);
  }
}

/**
 * Get all active jobs
 */
export function getActiveJobs(): ScheduleJob[] {
  return Array.from(activeJobs.values());
}

/**
 * Stop all active jobs
 */
export function stopAllJobs(): void {
  activeJobs.forEach((job) => {
    job.task.stop();
  });
  activeJobs.clear();
  console.log("[Scheduler] Stopped all schedule jobs");
}


/**
 * Execute automatic tweet posting for a specific account
 */
async function executeAccountAutoPost(accountId: number, schedule: any): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available");
      return;
    }

    // Get account credentials
    const { twitterAccounts } = require("../drizzle/schema");
    const accountResult = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.id, accountId))
      .limit(1);

    if (!accountResult || accountResult.length === 0) {
      console.warn(`[Scheduler] Account ${accountId} not found`);
      return;
    }

    const account = accountResult[0];
    if (!account.isValid || !account.isActive) {
      console.warn(`[Scheduler] Account ${accountId} is not valid or active`);
      return;
    }

    // Fetch fresh news
    clearNewsCache();
    const news = await fetchAINews();

    if (news.length === 0) {
      console.warn("[Scheduler] No news available to post");
      return;
    }

    // Select a random news item
    const selectedNews = news[Math.floor(Math.random() * news.length)];

    // Generate summary
    const summary = await generateSummary(selectedNews.title, selectedNews.description);

    if (!summary || summary.length === 0) {
      console.warn("[Scheduler] Failed to generate summary");
      return;
    }

    // Post to X
    const result = await postTweet(
      {
        apiKey: account.apiKey,
        apiSecret: account.apiSecret,
        accessToken: account.accessToken,
        accessTokenSecret: account.accessTokenSecret,
      },
      summary
    );

    // Record in tweet history
    const tweetHistorySchema = require("../drizzle/schema").tweetHistory;
    await db.insert(tweetHistorySchema).values({
      userId: account.userId,
      accountId: accountId,
      content: summary,
      originalNewsTitle: selectedNews.title,
      originalNewsUrl: selectedNews.url,
      status: "posted",
      tweetId: result.tweetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[Scheduler] Successfully posted tweet for account ${accountId}: ${result.tweetId}`);
  } catch (error) {
    console.error(`[Scheduler] Error executing auto post for account ${accountId}:`, error);
  }
}

/**
 * Start a schedule job for a specific account
 */
export function startAccountScheduleJob(accountId: number, schedule: any): void {
  if (!schedule.isEnabled || !schedule.cronExpression) {
    console.warn(`[Scheduler] Schedule not properly configured for account ${accountId}`);
    return;
  }

  // Stop existing job if any
  stopAccountScheduleJob(accountId);

  try {
    const task = cron.schedule(schedule.cronExpression as string, async () => {
      console.log(`[Scheduler] Executing scheduled task for account ${accountId}`);
      await executeAccountAutoPost(accountId, schedule);
    });

    activeAccountJobs.set(accountId, {
      id: `account-job-${accountId}-${Date.now()}`,
      task,
    });

    console.log(`[Scheduler] Started schedule job for account ${accountId}: ${schedule.cronExpression}`);
  } catch (error) {
    console.error(`[Scheduler] Error starting schedule job for account ${accountId}:`, error);
  }
}

/**
 * Stop a schedule job for a specific account
 */
export function stopAccountScheduleJob(accountId: number): void {
  const job = activeAccountJobs.get(accountId);
  if (job) {
    job.task.stop();
    activeAccountJobs.delete(accountId);
    console.log(`[Scheduler] Stopped schedule job for account ${accountId}`);
  }
}

/**
 * Initialize all active account schedules from database
 */
export async function initializeAccountSchedules(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available for account schedules initialization");
      return;
    }

    const { accountSchedules } = require("../drizzle/schema");
    const allSchedules = await db.select().from(accountSchedules);

    for (const schedule of allSchedules) {
      if (schedule.isEnabled) {
        startAccountScheduleJob(schedule.accountId, schedule);
      }
    }

    console.log(`[Scheduler] Initialized ${allSchedules.length} account schedules`);
  } catch (error) {
    console.error("[Scheduler] Error initializing account schedules:", error);
  }
}

/**
 * Stop all active account jobs
 */
export function stopAllAccountJobs(): void {
  activeAccountJobs.forEach((job) => {
    job.task.stop();
  });
  activeAccountJobs.clear();
  console.log("[Scheduler] Stopped all account schedule jobs");
}
