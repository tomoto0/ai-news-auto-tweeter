import { ENV } from "./_core/env";

export interface AINewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
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

/**
 * Fetch AI-related news from news sources
 * Uses a combination of search queries to get relevant AI news
 */
export async function fetchAINews(): Promise<AINewsItem[]> {
  try {
    // Use Manus built-in API for news search
    const apiUrl = ENV.forgeApiUrl;
    const apiKey = ENV.forgeApiKey;

    if (!apiUrl || !apiKey) {
      console.warn("[News] Manus API not configured, returning mock data");
      return getMockNews();
    }

    // Search for AI-related news using the data API
    const searchQueries = [
      "artificial intelligence",
      "machine learning",
      "ChatGPT",
      "OpenAI",
      "AI technology",
    ];

    const response = await fetch(`${apiUrl}/v1/data_api/news`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQueries[0],
        language: "en",
        limit: 10,
      }),
    });

    if (!response.ok) {
      console.warn("[News] API request failed, using mock data");
      return getMockNews();
    }

    const data = await response.json() as { articles?: Array<{
      title: string;
      description: string;
      url: string;
      source: string;
      publishedAt: string;
      urlToImage?: string;
    }> };

    if (!data.articles || data.articles.length === 0) {
      return getMockNews();
    }

    return data.articles.map((article, index) => ({
      id: `news-${index}-${Date.now()}`,
      title: article.title,
      description: article.description || "",
      url: article.url,
      source: article.source || "Unknown",
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage,
    }));
  } catch (error) {
    console.error("[News] Error fetching news:", error);
    return getMockNews();
  }
}

/**
 * Mock news data for development/fallback
 */
function getMockNews(): AINewsItem[] {
  const now = new Date();
  return [
    {
      id: "mock-1",
      title: "OpenAI Announces GPT-5 with Revolutionary Capabilities",
      description: "OpenAI has unveiled its latest language model, GPT-5, featuring unprecedented reasoning abilities and multimodal understanding. The new model shows significant improvements in complex problem-solving and creative tasks.",
      url: "https://example.com/news/gpt5-announcement",
      source: "AI News Daily",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-2",
      title: "Google DeepMind Achieves Breakthrough in Protein Folding",
      description: "DeepMind's AlphaFold 3 has successfully predicted the structure of nearly all known proteins, opening new possibilities for drug discovery and understanding diseases at the molecular level.",
      url: "https://example.com/news/alphafold3",
      source: "Tech Chronicle",
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      title: "AI Regulation Framework Proposed by EU Commission",
      description: "The European Union has proposed comprehensive AI regulations that would require transparency in AI systems and establish safety standards for high-risk applications.",
      url: "https://example.com/news/eu-ai-regulation",
      source: "Policy Watch",
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      title: "Microsoft Integrates AI Copilot Across All Products",
      description: "Microsoft announces the expansion of its AI Copilot feature to all Microsoft 365 applications, promising to revolutionize workplace productivity with intelligent assistance.",
      url: "https://example.com/news/microsoft-copilot",
      source: "Business Tech",
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-5",
      title: "Anthropic Releases Claude 4 with Enhanced Safety Features",
      description: "Anthropic's new Claude 4 model introduces advanced safety mechanisms and improved reasoning capabilities, setting new standards for responsible AI development.",
      url: "https://example.com/news/claude4-release",
      source: "AI Insider",
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
