import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("NewsAPI.org API Key Validation", () => {
  it("should have NEWS_API_KEY configured", () => {
    expect(ENV.newsApiKey).toBeTruthy();
    expect(ENV.newsApiKey.length).toBeGreaterThan(10);
  });

  it("should successfully fetch news from NewsAPI.org", async () => {
    const apiKey = ENV.newsApiKey;
    
    if (!apiKey) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=artificial+intelligence&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
    );

    expect(response.status).toBe(200);

    const data = await response.json() as {
      status: string;
      totalResults: number;
      articles: Array<{
        title: string;
        url: string;
        source: { name: string };
      }>;
    };

    expect(data.status).toBe("ok");
    expect(data.totalResults).toBeGreaterThan(0);
    expect(data.articles).toBeInstanceOf(Array);
    expect(data.articles.length).toBeGreaterThan(0);

    // Verify article structure
    const firstArticle = data.articles[0];
    expect(firstArticle).toHaveProperty("title");
    expect(firstArticle).toHaveProperty("url");
    expect(firstArticle).toHaveProperty("source");
    expect(firstArticle.source).toHaveProperty("name");

    console.log(`[NewsAPI Test] Successfully fetched ${data.articles.length} articles`);
    console.log(`[NewsAPI Test] First article: ${firstArticle?.title}`);
  }, 30000); // 30 second timeout for API call
});
