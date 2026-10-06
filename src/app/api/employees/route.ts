import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { employeeId: { contains: search } },
      { designation: { contains: search } },
    ];
  }

  if (departmentId && departmentId !== "ALL") {
    where.departmentId = departmentId;
  }

  if (role && role !== "ALL") {
    where.role = role;
  }

  if (status && status !== "ALL") {
    where.status = status;
  } else if (!status) {
    // Default to ACTIVE unless specified
    where.status = { not: "ARCHIVED" };
  }

  // Managers only see their assigned team members (and themselves)
  if (user.role === "MANAGER") {
    where.OR = [
      { managerId: user.id },
      { id: user.id },
    ];
  }

  const employees = await prisma.user.findMany({
    where,
    include: {
      department: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
      attendances: {
        take: 1,
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can onboard new employees." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      departmentId,
      designation,
      role = "EMPLOYEE",
      managerId,
      workLocation = "Office",
      workingHours = "10:00 AM - 07:00 PM",
      password = "password123", // default temporary password
      skills,
      bio,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required." },
        { status: 400 }
      );
    }

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An employee with this email already exists." },
        { status: 400 }
      );
    }

    // Generate unique sequential Employee ID: DIG-00X
    const totalUsers = await prisma.user.count();
    const employeeId = `DIG-${String(totalUsers + 1).padStart(3, "0")}`;

    const passwordHash = await hashPassword(password);

    const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(0, 10) : null;
    if (phone && cleanPhone && cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits." },
        { status: 400 }
      );
    }

    const newEmployee = await prisma.user.create({
      data: {
        employeeId,
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: cleanPhone,
        departmentId: departmentId || null,
        designation,
        role,
        managerId: managerId || null,
        workLocation,
        workingHours,
        skills,
        bio,
        status: "ACTIVE",
      },
      include: {
        department: true,
      },
    });

    // Auto-join default channels
    const generalChannel = await prisma.channel.findUnique({
      where: { name: "general" },
    });
    if (generalChannel) {
      await prisma.channelMember.create({
        data: { channelId: generalChannel.id, userId: newEmployee.id },
      });
    }

    const announcementsChannel = await prisma.channel.findUnique({
      where: { name: "announcements" },
    });
    if (announcementsChannel) {
      await prisma.channelMember.create({
        data: { channelId: announcementsChannel.id, userId: newEmployee.id },
      });
    }

    await logAuditAction({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "EMPLOYEE_ONBOARDED",
      targetType: "USER",
      targetId: newEmployee.id,
      details: `Onboarded employee ${newEmployee.name} (${newEmployee.employeeId}) in department ${newEmployee.department?.name || "General"}`,
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${name} (${employeeId}) onboarded successfully.`,
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error("Employee onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to onboard employee. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      status,
      name,
      phone,
      designation,
      departmentId,
      managerId,
      role,
      workLocation,
      workingHours,
      bio,
      skills,
      pushMessageVisibility,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    let cleanPhone = phone;
    if (phone !== undefined) {
      cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(0, 10) : null;
      if (phone && cleanPhone && cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: "Phone number must be exactly 10 digits." },
          { status: 400 }
        );
      }
    }

    // Permission checks: regular employees can only edit limited own profile fields
    if (currentUser.role === "EMPLOYEE") {
      if (currentUser.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Employee can update phone, bio, skills, pushMessageVisibility
      const updated = await prisma.user.update({
        where: { id },
        data: {
          phone: cleanPhone,
          bio,
          skills,
          ...(pushMessageVisibility !== undefined ? { pushMessageVisibility } : {}),
        },
      });

      return NextResponse.json({ success: true, employee: updated });
    }

    // Admins and Managers can edit broader settings
    if (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (cleanPhone !== undefined) updateData.phone = cleanPhone;
    if (designation !== undefined) updateData.designation = designation;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (managerId !== undefined) updateData.managerId = managerId || null;
    if (role && currentUser.role === "SUPER_ADMIN") updateData.role = role;
    if (workLocation !== undefined) updateData.workLocation = workLocation;
    if (workingHours !== undefined) updateData.workingHours = workingHours;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (pushMessageVisibility !== undefined) updateData.pushMessageVisibility = pushMessageVisibility;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { department: true },
    });

    await logAuditAction({
      userId: currentUser.id,
      userName: currentUser.name,
      action: status ? `EMPLOYEE_STATUS_${status}` : "EMPLOYEE_UPDATED",
      targetType: "USER",
      targetId: updated.id,
      details: `Updated employee profile for ${updated.name} (${updated.employeeId})`,
    });

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully.",
      employee: updated,
    });
  } catch (error: any) {
    console.error("Employee update error:", error);
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}
