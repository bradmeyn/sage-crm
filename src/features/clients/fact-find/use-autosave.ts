import { useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave. Call `schedule(value)` on every change; it saves
 * `delay`ms after the last change. Returns a live status for an indicator.
 */
export function useAutosave<T>(
  saveFn: (value: T) => Promise<unknown>,
  delay = 800,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(saveFn);
  saveRef.current = saveFn;

  const schedule = (value: T) => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await saveRef.current(value);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);
  };

  return { status, schedule };
}

export const saveStatusText: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};
