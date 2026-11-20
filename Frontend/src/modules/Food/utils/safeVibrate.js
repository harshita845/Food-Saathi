/**
 * Vibrate the device only when the browser allows it.
 * Chrome blocks navigator.vibrate() until the user has tapped/clicked the page and logs a
 * red "[Intervention] Blocked call to navigator.vibrate" error each time — e.g. when a new
 * order alert arrives on a freshly opened app. This skips the call until then.
 */
export function safeVibrate(pattern) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
    const activation = navigator.userActivation;
    if (activation && !activation.hasBeenActive) return false;
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

export default safeVibrate;
