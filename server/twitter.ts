import crypto from "crypto";

interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

interface TweetResult {
  tweetId: string;
}

/**
 * Generate OAuth 1.0a signature for Twitter API
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join("&");

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");

  return signature;
}

/**
 * Generate OAuth 1.0a Authorization header
 */
function generateOAuthHeader(
  method: string,
  url: string,
  creds: XCredentials,
  additionalParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...additionalParams };
  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    creds.apiSecret,
    creds.accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(", ");

  return `OAuth ${headerParams}`;
}

/**
 * Verify X API credentials by calling the verify_credentials endpoint
 */
export async function verifyCredentials(creds: XCredentials): Promise<boolean> {
  const url = "https://api.twitter.com/1.1/account/verify_credentials.json";
  
  try {
    const authHeader = generateOAuthHeader("GET", url, creds);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("[Twitter] Verify credentials error:", error);
    return false;
  }
}

/**
 * Post a tweet using Twitter API v2
 */
export async function postTweet(creds: XCredentials, text: string): Promise<TweetResult> {
  const url = "https://api.twitter.com/2/tweets";
  
  const authHeader = generateOAuthHeader("POST", url, creds);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[Twitter] Post tweet error:", errorData);
    throw new Error(`Twitter API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json() as { data: { id: string } };
  return { tweetId: data.data.id };
}

/**
 * Delete a tweet
 */
export async function deleteTweet(creds: XCredentials, tweetId: string): Promise<boolean> {
  const url = `https://api.twitter.com/2/tweets/${tweetId}`;
  
  const authHeader = generateOAuthHeader("DELETE", url, creds);
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  return response.ok;
}
