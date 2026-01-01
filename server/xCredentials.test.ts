import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getXCredentialsByUserId: vi.fn(),
  upsertXCredentials: vi.fn(),
  deleteXCredentials: vi.fn(),
  updateXCredentialsValidity: vi.fn(),
}));

// Mock the twitter module
vi.mock("./twitter", () => ({
  verifyCredentials: vi.fn().mockResolvedValue(true),
  postTweet: vi.fn().mockResolvedValue({ tweetId: "123456789" }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("xCredentials router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("returns null when no credentials exist", async () => {
      const { getXCredentialsByUserId } = await import("./db");
      vi.mocked(getXCredentialsByUserId).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.xCredentials.get();
      expect(result).toBeNull();
    });

    it("returns masked credentials when they exist", async () => {
      const { getXCredentialsByUserId } = await import("./db");
      vi.mocked(getXCredentialsByUserId).mockResolvedValue({
        id: 1,
        userId: 1,
        apiKey: "abcdefghijklmnopqrstuvwxyz",
        apiSecret: "secret123",
        accessToken: "token123",
        accessTokenSecret: "tokensecret123",
        isValid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.xCredentials.get();
      expect(result).not.toBeNull();
      expect(result?.hasCredentials).toBe(true);
      expect(result?.isValid).toBe(true);
      expect(result?.apiKeyPreview).toBe("abcdefgh...wxyz");
    });
  });

  describe("save", () => {
    it("saves credentials and verifies them", async () => {
      const { upsertXCredentials } = await import("./db");
      const { verifyCredentials } = await import("./twitter");
      
      vi.mocked(verifyCredentials).mockResolvedValue(true);
      vi.mocked(upsertXCredentials).mockResolvedValue();

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.xCredentials.save({
        apiKey: "test-api-key",
        apiSecret: "test-api-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(upsertXCredentials).toHaveBeenCalledWith({
        userId: 1,
        apiKey: "test-api-key",
        apiSecret: "test-api-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
        isValid: true,
      });
    });

    it("saves credentials even when verification fails", async () => {
      const { upsertXCredentials } = await import("./db");
      const { verifyCredentials } = await import("./twitter");
      
      vi.mocked(verifyCredentials).mockResolvedValue(false);
      vi.mocked(upsertXCredentials).mockResolvedValue();

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.xCredentials.save({
        apiKey: "invalid-key",
        apiSecret: "invalid-secret",
        accessToken: "invalid-token",
        accessTokenSecret: "invalid-token-secret",
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes credentials successfully", async () => {
      const { deleteXCredentials } = await import("./db");
      vi.mocked(deleteXCredentials).mockResolvedValue();

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.xCredentials.delete();
      expect(result.success).toBe(true);
      expect(deleteXCredentials).toHaveBeenCalledWith(1);
    });
  });
});
