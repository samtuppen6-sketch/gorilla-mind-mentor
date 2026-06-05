// Dev-only debug visibility flag.
//
// Resolution order:
//   1. URL query param `?debug=true|false` — sets localStorage and wins.
//   2. localStorage `gorillaMindDebug` ("true" | "false").
//   3. Defaults to OFF.
//
// Coach/profile/workout debug data is still computed and returned by the
// stable coach brain. This flag only gates UI visibility.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gorillaMindDebug";

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

function readLocal(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(STORAGE_KEY) === "true"; }
  catch { return false; }
}

function writeLocal(v: boolean) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, v ? "true" : "false"); } catch { /* ignore */ }
}

// One-time URL sync per page load.
let urlSynced = false;
function syncFromUrl() {
  if (urlSynced || typeof window === "undefined") return;
  urlSynced = true;
  try {
    const q = new URLSearchParams(window.location.search).get("debug");
    if (q === "true") { writeLocal(true); emit(); }
    else if (q === "false") { writeLocal(false); emit(); }
  } catch { /* ignore */ }
}

export function isDebugMode(): boolean {
  syncFromUrl();
  return readLocal();
}

export function useDebugMode(): boolean {
  return useSyncExternalStore(subscribe, isDebugMode, () => false);
}
