import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription } = await req.json();
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh, auth, userAgent: req.headers.get("user-agent") },
    create: { userId: user.id, endpoint, p256dh, auth, userAgent: req.headers.get("user-agent") },
  });
  return NextResponse.json({ success: true, message: "Push notifications enabled." });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  }
  return NextResponse.json({ success: true, message: "Push notifications disabled." });
}
