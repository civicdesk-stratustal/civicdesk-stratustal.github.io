const KEY = "civicdesk.pin";

function encode(pin: string) {
  // Lightweight, non-reversible-enough digest for a local device lock.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const salted = `civicdesk::${pin}`;
  for (let i = 0; i < salted.length; i++) {
    h1 = (h1 ^ salted.charCodeAt(i)) >>> 0;
    h1 = (h1 * 0x01000193) >>> 0;
    h2 = (h2 + salted.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return `${h1.toString(36)}.${h2.toString(36)}`;
}

export function hasPin() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(KEY);
}

export function setPin(pin: string) {
  localStorage.setItem(KEY, encode(pin));
}

export function verifyPin(pin: string) {
  return localStorage.getItem(KEY) === encode(pin);
}

export function clearPin() {
  localStorage.removeItem(KEY);
}
