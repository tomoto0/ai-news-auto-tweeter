import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchAINews, clearNewsCache, type AINewsItem } from "./news";

describe("News API", () => {
  beforeEach(() => {
    clearNewsCache();
    vi.clearAllMocks();
  });

  it("should return mock news when API is not configured", async () => {
    const news = await fetchAINews();
    
    expect(news).toBeDefined();
    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
  });

  it("should return news items with required fields", async () => {
    const news = await fetchAINews();
    
    news.forEach((item: AINewsItem) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("description");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("source");
      expect(item).toHaveProperty("publishedAt");
      
      expect(typeof item.id).toBe("string");
      expect(typeof item.title).toBe("string");
      expect(typeof item.url).toBe("string");
      expect(typeof item.source).toBe("string");
    });
  });

  it("should have valid URLs in news items", async () => {
    const news = await fetchAINews();
    
    news.forEach((item: AINewsItem) => {
      try {
        new URL(item.url);
      } catch {
        throw new Error(`Invalid URL: ${item.url}`);
      }
    });
  });

  it("should have valid ISO 8601 timestamps", async () => {
    const news = await fetchAINews();
    
    news.forEach((item: AINewsItem) => {
      const date = new Date(item.publishedAt);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  it("should return cached data on subsequent calls", async () => {
    const firstCall = await fetchAINews();
    const secondCall = await fetchAINews();
    
    // Should return the same data from cache
    expect(firstCall).toEqual(secondCall);
  });

  it("should clear cache when clearNewsCache is called", async () => {
    const firstCall = await fetchAINews();
    expect(firstCall.length).toBeGreaterThan(0);
    
    clearNewsCache();
    
    // After clearing, the next call should still work (returns mock data)
    const secondCall = await fetchAINews();
    expect(secondCall.length).toBeGreaterThan(0);
  });

  it("should handle empty descriptions gracefully", async () => {
    const news = await fetchAINews();
    
    news.forEach((item: AINewsItem) => {
      expect(typeof item.description).toBe("string");
      // Description can be empty but should be a string
    });
  });

  it("should sort news by published date (newest first)", async () => {
    const news = await fetchAINews();
    
    if (news.length > 1) {
      for (let i = 0; i < news.length - 1; i++) {
        const current = new Date(news[i].publishedAt).getTime();
        const next = new Date(news[i + 1].publishedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should not have duplicate URLs in results", async () => {
    const news = await fetchAINews();
    const urls = news.map(item => item.url);
    const uniqueUrls = new Set(urls);
    
    expect(urls.length).toBe(uniqueUrls.size);
  });
});
