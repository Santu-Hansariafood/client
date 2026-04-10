import Notification from "../models/Notification.js";

const clearNotifications = async () => {
  try {
    const result = await Notification.deleteMany({});
    console.log(`[Scheduler] Cleared ${result.deletedCount} notifications at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error("[Scheduler] Error clearing notifications:", error);
  }
};

/**
 * Schedules a daily task at a specific hour (0-23).
 * Default is 12 (12:00 PM / Noon).
 */
export const startNotificationCleanup = (hour = 12) => {
  console.log(`[Scheduler] Notification cleanup scheduled for ${hour}:00 daily.`);

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);

    // If the scheduled time is already passed today, set it for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();
    console.log(`[Scheduler] Next cleanup in ${Math.round(delay / 1000 / 60)} minutes.`);

    setTimeout(async () => {
      await clearNotifications();
      scheduleNext(); // Re-schedule for the next day
    }, delay);
  };

  scheduleNext();
};
