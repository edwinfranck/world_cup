"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

/**
 * Best-effort local match reminder using the browser Notification API.
 * Fires a notification at kickoff IF the app is still open. For reminders when
 * the app is closed, the "Add to Google Calendar" button is the reliable path
 * (true server push would require a backend with VAPID keys).
 */
export function NotifyButton({ match }: { match: Match }) {
  const [armed, setArmed] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
  }, []);

  if (match.status !== "SCHEDULED" || !supported) return null;

  async function arm() {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    setArmed(true);
    const delay = new Date(match.utcDate).getTime() - Date.now();
    const title = `${match.home.name} - ${match.away.name}`;
    if (delay <= 0) {
      new Notification(title, { body: "Le match commence !" });
    } else if (delay < 24 * 60 * 60 * 1000) {
      // Only schedulable while the tab stays open.
      setTimeout(() => {
        new Notification(title, { body: "Coup d'envoi imminent ⚽" });
      }, delay);
    }
  }

  return (
    <button
      type="button"
      onClick={arm}
      className={cn(
        "inline-flex items-center justify-center gap-2 border px-3 py-2 text-sm font-semibold transition-colors",
        armed
          ? "border-primary text-primary"
          : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
      )}
    >
      {armed ? <BellRing size={16} /> : <Bell size={16} />}
      {armed ? "Rappel activé" : "Me rappeler"}
    </button>
  );
}
