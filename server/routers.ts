import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  getXCredentialsByUserId,
  upsertXCredentials,
  deleteXCredentials,
  updateXCredentialsValidity,
  createTweetHistory,
  getTweetHistoryByUserId,
  updateTweetStatus,
  deleteTweetHistory,
  getScheduleSettingsByUserId,
  getScheduleSettings,
  upsertScheduleSettings,
} from "./db";
import { postTweet, verifyCredentials } from "./twitter";
import { fetchAINews, type AINewsItem } from "./news";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // X Credentials Management
  xCredentials: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const creds = await getXCredentialsByUserId(ctx.user.id);
      if (!creds) return null;
      // Return masked credentials for security
      return {
        id: creds.id,
        hasCredentials: true,
        isValid: creds.isValid,
        apiKeyPreview: creds.apiKey.slice(0, 8) + "..." + creds.apiKey.slice(-4),
        createdAt: creds.createdAt,
        updatedAt: creds.updatedAt,
      };
    }),

    save: protectedProcedure
      .input(z.object({
        apiKey: z.string().min(1),
        apiSecret: z.string().min(1),
        accessToken: z.string().min(1),
        accessTokenSecret: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify credentials before saving
        const isValid = await verifyCredentials(input);
        
        await upsertXCredentials({
          userId: ctx.user.id,
          ...input,
          isValid,
        });

        return { success: true, isValid };
      }),

    verify: protectedProcedure.mutation(async ({ ctx }) => {
      const creds = await getXCredentialsByUserId(ctx.user.id);
      if (!creds) {
        return { success: false, error: "No credentials found" };
      }

      const isValid = await verifyCredentials({
        apiKey: creds.apiKey,
        apiSecret: creds.apiSecret,
        accessToken: creds.accessToken,
        accessTokenSecret: creds.accessTokenSecret,
      });

      await updateXCredentialsValidity(ctx.user.id, isValid);

      return { success: true, isValid };
    }),

    delete: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteXCredentials(ctx.user.id);
      return { success: true };
    }),
  }),

  // News Operations
  news: router({
    fetch: protectedProcedure.query(async () => {
      const news = await fetchAINews();
      return news;
    }),

    refresh: protectedProcedure.mutation(async () => {
      console.log("[Router] news.refresh mutation called");
      // Clear cache and fetch fresh news
      const { clearNewsCache } = await import("./news");
      clearNewsCache();
      console.log("[Router] Cache cleared, fetching fresh news");
      const news = await fetchAINews();
      console.log("[Router] Fetched", news.length, "news items");
      return news;
    }),

    summarize: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
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

タイトル: ${input.title}
内容: ${input.description}`
            }
          ],
        });

        const summary = response.choices[0]?.message?.content || "";
        return { summary };
      }),
  }),

  // Tweet Operations
  tweets: router({
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        const history = await getTweetHistoryByUserId(ctx.user.id, input?.limit ?? 50);
        return history;
      }),

    preview: protectedProcedure
      .input(z.object({
        content: z.string(),
        newsTitle: z.string().optional(),
        newsUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create a pending tweet for preview
        const id = await createTweetHistory({
          userId: ctx.user.id,
          content: input.content,
          originalNewsTitle: input.newsTitle ?? null,
          originalNewsUrl: input.newsUrl ?? null,
          status: "pending",
        });

        return { id, content: input.content };
      }),

    post: protectedProcedure
      .input(z.object({
        content: z.string(),
        newsTitle: z.string().optional(),
        newsUrl: z.string().optional(),
        historyId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creds = await getXCredentialsByUserId(ctx.user.id);
        if (!creds) {
          throw new Error("X API credentials not configured");
        }

        // Create history entry if not exists
        let historyId = input.historyId;
        if (!historyId) {
          historyId = await createTweetHistory({
            userId: ctx.user.id,
            content: input.content,
            originalNewsTitle: input.newsTitle ?? null,
            originalNewsUrl: input.newsUrl ?? null,
            status: "pending",
          });
        }

        try {
          const result = await postTweet(
            {
              apiKey: creds.apiKey,
              apiSecret: creds.apiSecret,
              accessToken: creds.accessToken,
              accessTokenSecret: creds.accessTokenSecret,
            },
            input.content
          );

          await updateTweetStatus(historyId, "posted", result.tweetId);
          return { success: true, tweetId: result.tweetId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await updateTweetStatus(historyId, "failed", undefined, errorMessage);
          throw new Error(`Failed to post tweet: ${errorMessage}`);
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTweetHistory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Schedule Settings
  schedule: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getScheduleSettingsByUserId(ctx.user.id);
      return settings ?? {
        isEnabled: false,
        frequency: "daily" as const,
        preferredHour: 9,
        timezone: "Asia/Tokyo",
        maxTweetsPerDay: 5,
      };
    }),

    save: protectedProcedure
      .input(z.object({
        isEnabled: z.boolean(),
        frequency: z.enum(["hourly", "every_3_hours", "every_6_hours", "daily"]),
        preferredHour: z.number().min(0).max(23),
        timezone: z.string(),
        maxTweetsPerDay: z.number().min(1).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        let cronExpression = "0 0 * * *";
        if (input.frequency === "hourly") {
          cronExpression = "0 * * * *";
        } else if (input.frequency === "every_3_hours") {
          cronExpression = "0 */3 * * *";
        } else if (input.frequency === "every_6_hours") {
          cronExpression = "0 */6 * * *";
        } else if (input.frequency === "daily") {
          cronExpression = `0 ${input.preferredHour} * * *`;
        }

        await upsertScheduleSettings({
          userId: ctx.user.id,
          isEnabled: input.isEnabled,
          frequency: input.frequency,
          preferredHour: input.preferredHour,
          timezone: input.timezone,
          maxTweetsPerDay: input.maxTweetsPerDay,
          cronExpression,
        });

        const { startScheduleJob, stopScheduleJob } = await import("./scheduler");
        if (input.isEnabled) {
          const schedule = await getScheduleSettings(ctx.user.id);
          if (schedule) {
            startScheduleJob(ctx.user.id, { ...schedule, cronExpression });
          }
        } else {
          stopScheduleJob(ctx.user.id);
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
