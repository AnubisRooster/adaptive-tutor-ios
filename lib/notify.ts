import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const REMINDER_ENABLED_KEY = "reminder_enabled";
const REMINDER_HOUR_KEY = "reminder_hour";
const REMINDER_ID = "daily-study-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: next } = await Notifications.requestPermissionsAsync();
  return next === "granted";
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Time to study! 📚",
      body: "Keep your streak alive — a few minutes of learning goes a long way.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, "true");
  await SecureStore.setItemAsync(REMINDER_HOUR_KEY, String(hour));
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, "false");
}

export async function getReminderSettings(): Promise<{ enabled: boolean; hour: number }> {
  const [enabled, hour] = await Promise.all([
    SecureStore.getItemAsync(REMINDER_ENABLED_KEY),
    SecureStore.getItemAsync(REMINDER_HOUR_KEY),
  ]);
  return {
    enabled: enabled === "true",
    hour: parseInt(hour ?? "8", 10),
  };
}
