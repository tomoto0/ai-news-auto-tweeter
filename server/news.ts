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
 * Fetch AI-related news from NewsAPI.org
 * Uses real news data with fallback to mock data
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
    const apiKey = ENV.newsApiKey;

    if (!apiKey) {
      console.warn("[News] NewsAPI key not configured, returning mock data");
      return getMockNews();
    }

    // Try to fetch from NewsAPI.org with multiple AI-related queries
    const searchQueries = [
      "artificial intelligence",
      "machine learning",
      "ChatGPT OR OpenAI",
      "AI technology",
      "deep learning",
    ];

    const allArticles: AINewsItem[] = [];

    // Fetch news for each query (limit to first 3 to avoid rate limiting)
    for (let i = 0; i < Math.min(3, searchQueries.length); i++) {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQueries[i])}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
        
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json() as NewsAPIResponse;

          if (data.status === "ok" && data.articles && Array.isArray(data.articles)) {
            const articles = data.articles
              .filter(item => item.title && item.url && !item.title.includes("[Removed]"))
              .map((item, index) => ({
                id: `newsapi-${i}-${index}-${Date.now()}`,
                title: item.title,
                description: item.description || "",
                url: item.url,
                source: item.source.name,
                publishedAt: item.publishedAt,
                imageUrl: item.urlToImage || undefined,
                category: searchQueries[i],
              }));

            allArticles.push(...articles);
            console.log(`[News] Fetched ${articles.length} articles for query "${searchQueries[i]}"`);
          }
        } else {
          console.warn(`[News] Failed to fetch for query "${searchQueries[i]}": HTTP ${response.status}`);
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

      console.log(`[News] Successfully fetched ${newsCache.data.length} articles from NewsAPI.org`);
      return newsCache.data;
    }

    // Fallback to mock data if API returns nothing
    console.warn("[News] No articles from NewsAPI.org, using mock data");
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
      description: "Researchers at Google DeepMind have developed a new AI system that can predict protein structures with 99% accuracy, potentially revolutionizing drug discovery and disease treatment.",
      url: "https://example.com/news/deepmind-protein",
      source: "Tech Science Today",
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      category: "Research",
    },
    {
      id: `mock-3-${timestamp}`,
      title: "Microsoft Integrates Advanced AI into Office Suite",
      description: "Microsoft announces comprehensive AI integration across its Office 365 suite, bringing intelligent writing assistance, data analysis, and automation features to millions of users worldwide.",
      url: "https://example.com/news/microsoft-office-ai",
      source: "Business Tech Weekly",
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      category: "Enterprise",
    },
    {
      id: `mock-4-${timestamp}`,
      title: "New AI Regulations Proposed by European Union",
      description: "The European Union has proposed comprehensive regulations for AI development and deployment, focusing on transparency, accountability, and ethical considerations in artificial intelligence systems.",
      url: "https://example.com/news/eu-ai-regulations",
      source: "Policy Watch",
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      category: "Policy",
    },
    {
      id: `mock-5-${timestamp}`,
      title: "Startup Raises $100M for AI-Powered Healthcare Platform",
      description: "A Silicon Valley startup has secured $100 million in Series B funding to develop an AI-powered platform that assists doctors in diagnosing rare diseases and personalizing treatment plans.",
      url: "https://example.com/news/healthcare-ai-funding",
      source: "Venture Beat",
      publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      category: "Healthcare",
    },
    {
      id: `mock-6-${timestamp}`,
      title: "AI-Generated Art Wins International Competition",
      description: "An artwork created entirely by artificial intelligence has won first place in a prestigious international art competition, sparking debate about creativity and the role of AI in the arts.",
      url: "https://example.com/news/ai-art-competition",
      source: "Creative Tech",
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      category: "Arts",
    },
    {
      id: `mock-7-${timestamp}`,
      title: "Autonomous Vehicles Achieve 1 Million Miles Without Incident",
      description: "A fleet of AI-powered autonomous vehicles has successfully completed over 1 million miles of real-world driving without a single accident, marking a significant milestone in self-driving technology.",
      url: "https://example.com/news/autonomous-vehicles-milestone",
      source: "Auto Tech News",
      publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      category: "Transportation",
    },
  ];

  // Cache mock data
  newsCache.data = mockData;
  newsCache.timestamp = Date.now();

  console.log(`[News] Returning ${mockData.length} mock articles`);
  return mockData;
}
