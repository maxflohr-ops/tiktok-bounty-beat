// Where to send someone after sign-in. Set right before any hop to /auth
// (or the OAuth redirect), consumed once on SIGNED_IN. sessionStorage
// survives the round-trip through Google in the same tab.
const KEY = "bs_return_to";

export function setReturnTo(path: string) {
  try {
    if (path.startsWith("/") && !path.startsWith("/auth")) sessionStorage.setItem(KEY, path);
  } catch {
    // storage unavailable — sign-in just lands on the default page
  }
}

export function consumeReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}
