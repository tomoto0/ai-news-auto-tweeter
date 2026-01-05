import { ENV } from "./_core/env";

export interface AINewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

// Simple in-memory cache for news
interface NewsCache {
  data: AINewsItem[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const newsCache: NewsCache = {
  data: [],
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return Date.now() - newsCache.timestamp < newsCache.ttl;
}

/**
 * Fetch AI-related news from multiple sources
 * Uses Manus built-in API with fallback to mock data
 */
export async function fetchAINews(forceRefresh: boolean = false): Promise<AINewsItem[]> {
  console.log("[News] fetchAINews called", { forceRefresh, cacheTimestamp: newsCache.timestamp, cacheSize: newsCache.data.length });
  
  // If forceRefresh is true, skip cache and fetch fresh data
  if (!forceRefresh && newsCache.timestamp > 0 && isCacheValid() && newsCache.data.length > 0) {
    console.log("[News] Returning cached news data", { cacheSize: newsCache.data.length, age: Date.now() - newsCache.timestamp });
    return newsCache.data;
  }
  
  if (forceRefresh) {
    console.log("[News] Force refresh requested, fetching fresh data");
  }
  
  // If cache was cleared (timestamp = 0), always fetch fresh
  if (newsCache.timestamp === 0) {
    console.log("[News] Cache was cleared, fetching fresh data");
  }

  try {
    const apiUrl = ENV.forgeApiUrl;
    const apiKey = ENV.forgeApiKey;

    if (!apiUrl || !apiKey) {
      console.warn("[News] Manus API not configured, returning mock data");
      return getMockNews();
    }

    // Try to fetch from Manus Data API with multiple search queries
    const searchQueries = [
      "AI news",
      "artificial intelligence",
      "machine learning",
      "ChatGPT",
      "OpenAI",
    ];

    const allArticles: AINewsItem[] = [];

    // Fetch news for each query (limit to first 3 to avoid rate limiting)
    for (let i = 0; i < Math.min(3, searchQueries.length); i++) {
      try {
        const response = await fetch(`${apiUrl}/v1/data_api/search`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQueries[i],
            type: "news",
            limit: 5,
            language: "en",
          }),
        });

        if (response.ok) {
          const data = await response.json() as {
            results?: Array<{
              title?: string;
              description?: string;
              url?: string;
              source?: string;
              published_at?: string;
              image?: string;
            }>;
          };

          if (data.results && Array.isArray(data.results)) {
            const articles = data.results
              .filter(item => item.title && item.url)
              .map((item, index) => ({
                id: `api-${i}-${index}-${Date.now()}`,
                title: item.title || "Untitled",
                description: item.description || "",
                url: item.url || "",
                source: item.source || "AI News",
                publishedAt: item.published_at || new Date().toISOString(),
                imageUrl: item.image,
                category: searchQueries[i],
              }));

            allArticles.push(...articles);
          }
        }
      } catch (error) {
        console.warn(`[News] Failed to fetch for query "${searchQueries[i]}":`, error);
        // Continue with next query on error
        continue;
      }
    }

    // If we got some articles from API, cache and return them
    if (allArticles.length > 0) {
      // Remove duplicates based on URL
      const uniqueArticles = Array.from(
        new Map(allArticles.map(item => [item.url, item])).values()
      );

      // Sort by published date (newest first)
      uniqueArticles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Cache the results
      newsCache.data = uniqueArticles.slice(0, 15); // Keep top 15
      newsCache.timestamp = Date.now();

      console.log(`[News] Successfully fetched ${newsCache.data.length} articles from API`);
      return newsCache.data;
    }

    // Fallback to mock data if API returns nothing
    console.warn("[News] No articles from API, using mock data");
    return getMockNews();
  } catch (error) {
    console.error("[News] Error fetching news:", error);
    return getMockNews();
  }
}

/**
 * Clear the news cache (useful for manual refresh)
 */
export function clearNewsCache(): void {
  newsCache.data = [];
  newsCache.timestamp = 0;
  console.log("[News] Cache cleared");
}

/**
 * Mock news data for development/fallback
 */
function getMockNews(): AINewsItem[] {
  const now = new Date();
  // Generate unique mock data with current timestamp to ensure freshness
  const timestamp = Date.now();
  const mockData = [
    {
      id: `mock-1-${timestamp}`,
      title: "OpenAI Announces GPT-5 with Revolutionary Capabilities",
      description: "OpenAI has unveiled its latest language model, GPT-5, featuring unprecedented reasoning abilities and multimodal understanding. The new model shows significant improvements in complex problem-solving and creative tasks.",
      url: "https://example.com/news/gpt5-announcement",
      source: "AI News Daily",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      category: "OpenAI",
    },
    {
      id: `mock-2-${timestamp}`,
      title: "Google DeepMind Achieves Breakthrough in Protein Folding",
      description: "DeepMind's AlphaFold 3 has successfully predicted the structure of nearly all known proteins, opening new possibilities for drug discovery and understanding diseases at the molecular level.",
      url: "https://example.com/news/alphafold3",
      source: "Tech Chronicle",
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      category: "machine learning",
    },
    {
      id: `mock-3-${timestamp}`,
      title: "AI Regulation Framework Proposed by EU Commission",
      description: "The European Union has proposed comprehensive AI regulations that would require transparency in AI systems and establish safety standards for high-risk applications.",
      url: "https://example.com/news/eu-ai-regulation",
      source: "Policy Watch",
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      category: "AI news",
    },
    {
      id: `mock-4-${timestamp}`,
      title: "Microsoft Integrates AI Copilot Across All Products",
      description: "Microsoft announces the expansion of its AI Copilot feature to all Microsoft 365 applications, promising to revolutionize workplace productivity with intelligent assistance.",
      url: "https://example.com/news/microsoft-copilot",
      source: "Business Tech",
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      category: "artificial intelligence",
    },
    {
      id: `mock-5-${timestamp}`,
      title: "Anthropic Releases Claude 4 with Enhanced Safety Features",
      description: "Anthropic's new Claude 4 model introduces advanced safety mechanisms and improved reasoning capabilities, setting new standards for responsible AI development.",
      url: "https://example.com/news/claude4-release",
      source: "AI Insider",
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      category: "ChatGPT",
    },
    {
      id: `mock-6-${timestamp}`,
      title: "Meta Releases Llama 3 Open Source Model",
      description: "Meta has released Llama 3, a powerful open-source language model that rivals proprietary solutions. The model is available for commercial use and research.",
      url: "https://example.com/news/llama3-release",
      source: "Open Source AI",
      publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      category: "machine learning",
    },
    {
      id: `mock-7-${timestamp}`,
      title: "AI-Powered Drug Discovery Accelerates Clinical Trials",
      description: "Pharmaceutical companies are using AI to identify promising drug candidates 50% faster than traditional methods, potentially saving billions in development costs.",
      url: "https://example.com/news/ai-drug-discovery",
      source: "Medical Tech Weekly",
      publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      category: "artificial intelligence",
    },
  ];

  // Cache mock data as well
  newsCache.data = mockData;
  newsCache.timestamp = Date.now();

  return mockData;
}
