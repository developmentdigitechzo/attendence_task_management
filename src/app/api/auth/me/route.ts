import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      phone: user.phone,
      department: user.department,
      manager: user.manager,
      avatarUrl: user.avatarUrl,
      workLocation: user.workLocation,
      workingHours: user.workingHours,
      skills: user.skills,
      bio: user.bio,
    },
  });
}
