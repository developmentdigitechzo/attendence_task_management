import webpush from "web-push";
import { prisma } from "./db";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let configured = false;
function configure() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!configure()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // Subscription expired / unsubscribed – clean it up
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push send error:", err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );
}

/**
 * Drop-in replacement for `prisma.notification.create`:
 * stores the in-app notification AND sends a web push to the user's devices.
 * Push failures never break the calling request.
 */
export async function createNotification(args: {
  data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    linkUrl?: string | null;
  };
}) {
  const notification = await prisma.notification.create(args);
  try {
    await sendPushToUser(args.data.userId, {
      title: args.data.title,
      body: args.data.message,
      url: args.data.linkUrl || "/",
      tag: notification.id,
    });
  } catch (e) {
    console.error("Push error:", e);
  }
  return notification;
}
