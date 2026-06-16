/* eslint-disable import/first */
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  getReminderSettings,
} from "@/lib/notify";

const mockGetPerms = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPerms = Notifications.requestPermissionsAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("requestNotificationPermission", () => {
  it("returns true immediately when already granted", async () => {
    mockGetPerms.mockResolvedValue({ status: "granted" });
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(mockRequestPerms).not.toHaveBeenCalled();
  });

  it("requests permission and returns true when granted", async () => {
    mockGetPerms.mockResolvedValue({ status: "undetermined" });
    mockRequestPerms.mockResolvedValue({ status: "granted" });
    await expect(requestNotificationPermission()).resolves.toBe(true);
  });

  it("requests permission and returns false when denied", async () => {
    mockGetPerms.mockResolvedValue({ status: "undetermined" });
    mockRequestPerms.mockResolvedValue({ status: "denied" });
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });
});

describe("scheduleDailyReminder", () => {
  beforeEach(() => {
    mockCancel.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue("daily-study-reminder");
    mockSetItem.mockResolvedValue(undefined);
  });

  it("cancels any existing reminder before scheduling a new one", async () => {
    await scheduleDailyReminder(8, 0);
    expect(mockCancel).toHaveBeenCalledWith("daily-study-reminder");
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("schedules with the correct hour and minute", async () => {
    await scheduleDailyReminder(14, 30);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 14, minute: 30 }),
      })
    );
  });

  it("persists the enabled flag and hour to SecureStore", async () => {
    await scheduleDailyReminder(9, 0);
    expect(mockSetItem).toHaveBeenCalledWith("reminder_enabled", "true");
    expect(mockSetItem).toHaveBeenCalledWith("reminder_hour", "9");
  });
});

describe("cancelDailyReminder", () => {
  it("cancels the scheduled notification and saves disabled flag", async () => {
    mockCancel.mockResolvedValue(undefined);
    mockSetItem.mockResolvedValue(undefined);
    await cancelDailyReminder();
    expect(mockCancel).toHaveBeenCalledWith("daily-study-reminder");
    expect(mockSetItem).toHaveBeenCalledWith("reminder_enabled", "false");
  });
});

describe("getReminderSettings", () => {
  it("returns defaults when nothing is stored", async () => {
    mockGetItem.mockResolvedValue(null);
    const settings = await getReminderSettings();
    expect(settings).toEqual({ enabled: false, hour: 8 });
  });

  it("returns stored values when present", async () => {
    mockGetItem
      .mockResolvedValueOnce("true")   // enabled
      .mockResolvedValueOnce("18");    // hour
    const settings = await getReminderSettings();
    expect(settings).toEqual({ enabled: true, hour: 18 });
  });
});
