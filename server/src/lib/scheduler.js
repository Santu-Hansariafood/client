import Notification from "../models/Notification.js";

const clearNotifications = async () => {
  try {
    const result = await Notification.deleteMany({});
    console.log(
      `[Scheduler] Cleared ${result.deletedCount} notifications at ${new Date().toLocaleString()}`,
    );
  } catch (error) {
    console.error("[Scheduler] Error clearing notifications:", error);
  }
};

export const startNotificationCleanup = (hour = 12) => {
  console.log(
    `[Scheduler] Notification cleanup scheduled for ${hour}:00 daily.`,
  );

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();
    console.log(
      `[Scheduler] Next cleanup in ${Math.round(delay / 1000 / 60)} minutes.`,
    );

    setTimeout(async () => {
      await clearNotifications();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
};
