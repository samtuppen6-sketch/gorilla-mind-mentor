// Shared completion-gating hook for guided breathwork players.
//
// Completion unlocks only after the user has *actually played* >= 85 % of the
// active breathwork window (breathingEndTime - breathingStartTime). Intro,
// outro, ambience tail, paused time, and any time skipped via scrubbing are
// NOT counted.
//
// Anti-skip: we only credit small forward deltas (<=1.5s) emitted by the
// browser's normal `timeupdate` cadence while the audio element is actively
// playing and not seeking. Large jumps (scrub-forward) and backward jumps
// (restart / scrub-back) do not add to the active time. A jump back below
// breathingStart resets the accumulator so Restart truly resets progress.

import { useEffect, useRef, type RefObject } from "react";

export function useBreathworkGate(opts: {
  audioRef: RefObject<HTMLAudioElement | null>;
  breathingStart: number;
  breathingEnd: number;
  onUnlock: () => void;
}) {
  const { audioRef, breathingStart, breathingEnd, onUnlock } = opts;
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const windowSec = Math.max(1, breathingEnd - breathingStart);
    const threshold = windowSec * 0.85;

    let active = 0;
    let last: number | null = null;
    let unlocked = false;

    const reset = () => {
      active = 0;
      unlocked = false;
    };

    const onTime = () => {
      const t = el.currentTime;
      if (last !== null && !el.paused && !el.seeking) {
        const delta = t - last;
        if (delta > 0 && delta <= 1.5) {
          const a = Math.max(last, breathingStart);
          const b = Math.min(t, breathingEnd);
          if (b > a) {
            active += b - a;
            if (!unlocked && active >= threshold) {
              unlocked = true;
              onUnlockRef.current();
            }
          }
        }
      }
      last = t;
    };
    const onPlay = () => {
      last = el.currentTime;
    };
    const onPause = () => {
      last = null;
    };
    const onSeeking = () => {
      last = null;
    };
    const onSeeked = () => {
      last = el.paused ? null : el.currentTime;
      if (el.currentTime < breathingStart) reset();
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("seeking", onSeeking);
    el.addEventListener("seeked", onSeeked);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("seeked", onSeeked);
    };
  }, [audioRef, breathingStart, breathingEnd]);
}
