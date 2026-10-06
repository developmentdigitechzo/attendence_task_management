import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const redirectTarget = req.nextUrl.searchParams.get("redirect") || "/login";
  const redirectUrl = new URL(redirectTarget, req.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete("auth_token");
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("auth_token");
  return response;
}
