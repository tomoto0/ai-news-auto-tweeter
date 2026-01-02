import { describe, it, expect, beforeEach, vi } from "vitest";
import { startScheduleJob, stopScheduleJob, getActiveJobs, stopAllJobs } from "./scheduler";

describe("Schedule Scheduler", () => {
  beforeEach(() => {
    stopAllJobs();
    vi.clearAllMocks();
  });

  it("should create a schedule job with valid cron expression", () => {
    const userId = 1;
    const schedule = {
      isEnabled: true,
      cronExpression: "0 * * * *", // every hour
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(userId, schedule);
    const activeJobs = getActiveJobs();

    expect(activeJobs.length).toBe(1);
    expect(activeJobs[0].id).toContain(`job-${userId}`);
  });

  it("should stop a schedule job", () => {
    const userId = 1;
    const schedule = {
      isEnabled: true,
      cronExpression: "0 * * * *",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(userId, schedule);
    expect(getActiveJobs().length).toBe(1);

    stopScheduleJob(userId);
    expect(getActiveJobs().length).toBe(0);
  });

  it("should handle multiple schedule jobs", () => {
    const schedule1 = {
      isEnabled: true,
      cronExpression: "0 * * * *",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    const schedule2 = {
      isEnabled: true,
      cronExpression: "0 0 * * *",
      frequency: "daily",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(1, schedule1);
    startScheduleJob(2, schedule2);

    expect(getActiveJobs().length).toBe(2);

    stopScheduleJob(1);
    expect(getActiveJobs().length).toBe(1);

    stopScheduleJob(2);
    expect(getActiveJobs().length).toBe(0);
  });

  it("should stop all jobs", () => {
    const schedule = {
      isEnabled: true,
      cronExpression: "0 * * * *",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(1, schedule);
    startScheduleJob(2, schedule);
    startScheduleJob(3, schedule);

    expect(getActiveJobs().length).toBe(3);

    stopAllJobs();
    expect(getActiveJobs().length).toBe(0);
  });

  it("should replace existing job when starting a new one for same user", () => {
    const userId = 1;
    const schedule = {
      isEnabled: true,
      cronExpression: "0 * * * *",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(userId, schedule);
    const firstJobId = getActiveJobs()[0].id;

    startScheduleJob(userId, schedule);
    const activeJobs = getActiveJobs();

    expect(activeJobs.length).toBe(1);
    expect(activeJobs[0].id).not.toBe(firstJobId); // Should be a new job
  });

  it("should handle invalid cron expression gracefully", () => {
    const userId = 1;
    const schedule = {
      isEnabled: true,
      cronExpression: "invalid cron",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    // Should not throw, but handle gracefully
    expect(() => {
      startScheduleJob(userId, schedule);
    }).not.toThrow();
  });

  it("should not start job if schedule is disabled", () => {
    const userId = 1;
    const schedule = {
      isEnabled: false,
      cronExpression: "0 * * * *",
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(userId, schedule);
    expect(getActiveJobs().length).toBe(0);
  });

  it("should not start job if cronExpression is missing", () => {
    const userId = 1;
    const schedule = {
      isEnabled: true,
      cronExpression: null,
      frequency: "hourly",
      preferredHour: 9,
      timezone: "Asia/Tokyo",
      maxTweetsPerDay: 5,
    };

    startScheduleJob(userId, schedule as any);
    expect(getActiveJobs().length).toBe(0);
  });
});
