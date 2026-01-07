import { config } from 'dotenv';
config();

const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

console.log("Testing Manus Data API for news...");
console.log("API URL:", apiUrl);
console.log("API Key:", apiKey ? "***" + apiKey.slice(-4) : "NOT SET");

async function testNewsAPI() {
  try {
    const response = await fetch(`${apiUrl}/v1/data_api/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "AI news",
        type: "news",
        limit: 5,
        language: "en",
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (data.results && Array.isArray(data.results)) {
      console.log(`\nFound ${data.results.length} news articles:`);
      data.results.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title || "Untitled"}`);
        console.log(`   URL: ${item.url || "N/A"}`);
        console.log(`   Source: ${item.source || "N/A"}`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testNewsAPI();
