"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { toast } from "@/components/ui/ToastProvider";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushNotificationManager() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub && Notification.permission === "granted");
        // Keep server in sync if the browser already has a subscription
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-skip-toast": "1" },
            body: JSON.stringify({ subscription: sub.toJSON() }),
          });
        }
      } catch (e) {
        console.error("Service worker registration failed", e);
      }
    })();
  }, []);

  if (!supported) return null;

  const enable = async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notifications are not configured (missing VAPID key).");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications are blocked. Allow them in your browser's site settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-skip-toast": "1" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setSubscribed(true);
      toast.success("Push notifications enabled on this device.");
    } catch (e) {
      console.error(e);
      toast.error("Could not enable push notifications.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-skip-toast": "1" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.info("Push notifications turned off on this device.");
    } catch (e) {
      toast.error("Could not disable push notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={subscribed ? disable : enable}
      disabled={busy}
      className="relative p-1.5 sm:p-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:text-brand-700 hover:bg-brand-50 hover:border-brand-200 rounded-xl transition disabled:opacity-50"
      title={subscribed ? "Push notifications on (click to turn off)" : "Enable push notifications"}
      aria-label={subscribed ? "Disable push notifications" : "Enable push notifications"}
    >
      {subscribed ? (
        <BellRing className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-brand-600" />
      ) : (
        <BellOff className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      )}
    </button>
  );
}
