/**
 * Human-readable reason when a "Test notification" could not be delivered to this browser.
 */
export function describeUndeliveredTestPush() {
  try {
    if (typeof window === "undefined") return "Test notification could not be delivered.";
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      return "This browser can't receive push notifications. Open the app in a normal (non-Incognito) Chrome window.";
    }
    if (Notification.permission === "denied") {
      return "Notifications are blocked for this site. Allow notifications in the browser's site settings, then try again.";
    }
    if (Notification.permission !== "granted") {
      return "Allow notifications when the browser asks, then try again.";
    }
  } catch {
    // ignore
  }
  return "This device isn't registered for notifications yet. Use a normal (non-Incognito) Chrome window with notifications allowed, reload the app, then try again.";
}
