import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting clean database seed (3 users only: Admin, Team Lead, Employee)...");

  // 1. Clean ALL existing data in proper dependency order
  await prisma.auditLog.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.dailyUpdate.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await (prisma as any).milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.attendanceCorrection.deleteMany();
  await prisma.break.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.companySetting.deleteMany();

  // 2. Company Settings
  const settings = [
    { key: "companyName", value: "Digitechzo", description: "Company display name" },
    { key: "subtitle", value: "Internal Employee Management & Productivity System", description: "Sub-branding title" },
    { key: "workStartTime", value: "09:00", description: "Official office start time" },
    { key: "workEndTime", value: "18:00", description: "Official office end time" },
    { key: "gracePeriodMinutes", value: "15", description: "Grace period in minutes before marked Late" },
    { key: "timezone", value: "Asia/Kolkata", description: "Company default timezone" },
    { key: "workingDays", value: "1,2,3,4,5,6", description: "Working days of the week (1=Mon ... 6=Sat)" },
  ];

  for (const s of settings) {
    await prisma.companySetting.create({ data: s });
  }

  // 3. Departments
  const deptHR = await prisma.department.create({
    data: { name: "HR & Operations", code: "HR", description: "Human resources, operations, and administration" },
  });
  const deptDev = await prisma.department.create({
    data: { name: "Development", code: "DEV", description: "Software engineering and technology architecture" },
  });
  const deptDesign = await prisma.department.create({
    data: { name: "Design", code: "DSN", description: "UI/UX, visual branding and creative direction" },
  });
  const deptMarketing = await prisma.department.create({
    data: { name: "Marketing", code: "MKT", description: "Digital marketing and business growth" },
  });
  const deptSales = await prisma.department.create({
    data: { name: "Sales", code: "SLS", description: "Client acquisition and client management" },
  });

  // Default hashed password: "password123"
  const passwordHash = await bcrypt.hash("password123", 10);

  // 4. Exactly 3 Users: Admin, Team Lead, Employee

  // User 1: Administrator (Super Admin)
  const admin = await prisma.user.create({
    data: {
      employeeId: "DIG-001",
      name: "Admin Director",
      email: "admin@digitechzo.com",
      passwordHash,
      role: "SUPER_ADMIN",
      departmentId: deptHR.id,
      designation: "Managing Director",
      phone: "+91 98765 43210",
      workLocation: "Headquarters",
      workingHours: "09:00 - 18:00",
      bio: "Managing Director leading digital transformation, operations and strategy at Digitechzo.",
      skills: "Leadership, Strategy, Operations, Architecture",
    },
  });

  // User 2: Team Lead (Manager)
  const lead = await prisma.user.create({
    data: {
      employeeId: "DIG-002",
      name: "Vikram Sharma",
      email: "lead@digitechzo.com",
      passwordHash,
      role: "MANAGER",
      departmentId: deptDev.id,
      designation: "Engineering Team Lead",
      phone: "+91 98765 43211",
      managerId: admin.id,
      workLocation: "Headquarters",
      workingHours: "09:00 - 18:00",
      bio: "Technical lead managing engineering workflows, sprint delivery, and technical mentorship.",
      skills: "Full-Stack Development, System Architecture, Agile, Mentorship",
    },
  });

  // User 3: Employee
  const employee = await prisma.user.create({
    data: {
      employeeId: "DIG-003",
      name: "John Fernandes",
      email: "employee@digitechzo.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: deptDev.id,
      designation: "Senior Full-Stack Developer",
      phone: "+91 98765 43212",
      managerId: lead.id,
      workLocation: "Office (Desk 4)",
      workingHours: "09:00 - 18:00",
      bio: "Full-stack developer building modern Next.js interfaces, APIs, and microservices.",
      skills: "React, Next.js, Node.js, TypeScript, MySQL, TailwindCSS",
    },
  });

  const allUsers = [admin, lead, employee];

  // 5. Projects
  const projWorkOS = await prisma.project.create({
    data: {
      name: "Digitechzo WorkOS",
      client: "Internal Digitechzo",
      description: "Internal employee management, attendance & task platform",
      managerId: admin.id,
      status: "ACTIVE",
      startDate: new Date("2026-09-01"),
      deadline: new Date("2026-09-30"),
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: lead.id, role: "MANAGER" },
          { userId: employee.id, role: "DEVELOPER" },
        ],
      },
    },
  });

  const projClient = await prisma.project.create({
    data: {
      name: "Enterprise Cloud Portal",
      client: "Global Logistics Group",
      description: "Client portal for fleet tracking and cloud analytics dashboard",
      managerId: lead.id,
      status: "ACTIVE",
      startDate: new Date("2026-09-05"),
      deadline: new Date("2026-09-25"),
      members: {
        create: [
          { userId: lead.id, role: "MANAGER" },
          { userId: employee.id, role: "DEVELOPER" },
        ],
      },
    },
  });

  // 6. Milestones
  const m1 = await (prisma as any).milestone.create({
    data: {
      projectId: projWorkOS.id,
      name: "Phase 1: Architecture & Design System",
      description: "Establish SaaS design system, typography, tokens, and multi-role auth foundation",
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-09-12"),
      status: "COMPLETED",
    },
  });

  const m2 = await (prisma as any).milestone.create({
    data: {
      projectId: projWorkOS.id,
      name: "Phase 2: Attendance Engine & 3 Portals",
      description: "Live Check In/Out, break tracking, and dedicated Admin, Lead & Employee portals",
      startDate: new Date("2026-09-10"),
      dueDate: new Date("2026-09-20"),
      status: "IN_PROGRESS",
    },
  });

  const m3 = await (prisma as any).milestone.create({
    data: {
      projectId: projClient.id,
      name: "Milestone 1: Backend API & Webhooks",
      description: "REST endpoints, auth middleware, and webhook receivers",
      startDate: new Date("2026-09-05"),
      dueDate: new Date("2026-09-18"),
      status: "IN_PROGRESS",
    },
  });

  const m4 = await (prisma as any).milestone.create({
    data: {
      projectId: projClient.id,
      name: "Milestone 2: Analytics & Final QA",
      description: "Real-time metrics charts, security audits, and production release signoff",
      startDate: new Date("2026-09-18"),
      dueDate: new Date("2026-09-25"),
      status: "UPCOMING",
    },
  });

  // 7. Tasks (Only assigned to and created by the 3 users)
  const tasks = [
    {
      taskId: "TSK-101",
      title: "Design System & Figma Component Tokens",
      description: "Establish neutral SaaS typography, badge variants, and table designs",
      projectId: projWorkOS.id,
      milestoneId: m1.id,
      assignedToId: lead.id,
      createdById: admin.id,
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-09-12"),
      completedAt: new Date("2026-09-12T17:30:00Z"),
    },
    {
      taskId: "TSK-102",
      title: "Implement Live Attendance & Break Clock",
      description: "Connect Check In/Out with real-time timer and late threshold calculator",
      projectId: projWorkOS.id,
      milestoneId: m2.id,
      assignedToId: employee.id,
      createdById: lead.id,
      priority: "URGENT",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-09-16"),
    },
    {
      taskId: "TSK-103",
      title: "Weekly & Monthly Dynamic Attendance Reports",
      description: "Build accurate calculation engine with CSV, Excel and PDF download",
      projectId: projWorkOS.id,
      milestoneId: m2.id,
      assignedToId: employee.id,
      createdById: admin.id,
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-09-18"),
    },
    {
      taskId: "TSK-104",
      title: "Cloud Portal Fleet API Endpoints",
      description: "Develop authenticated REST APIs for vehicle tracking telemetry",
      projectId: projClient.id,
      milestoneId: m3.id,
      assignedToId: employee.id,
      createdById: lead.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-09-17"),
    },
    {
      taskId: "TSK-105",
      title: "Database Query Optimization & Indexing",
      description: "Audit slow queries on attendance date ranges and add composite indexes",
      projectId: projWorkOS.id,
      milestoneId: m2.id,
      assignedToId: lead.id,
      createdById: admin.id,
      priority: "MEDIUM",
      status: "TODO",
      dueDate: new Date("2026-09-19"),
    },
    {
      taskId: "TSK-106",
      title: "Attendance Correction Approval Module",
      description: "Complete Lead & Admin correction approval workflows with audit logging",
      projectId: projWorkOS.id,
      milestoneId: m2.id,
      assignedToId: employee.id,
      createdById: lead.id,
      priority: "HIGH",
      status: "REVIEW",
      dueDate: new Date("2026-09-17"),
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  // 8. Attendance Records
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);

  // Employee checked in today
  const attEmployee = await prisma.attendance.create({
    data: {
      userId: employee.id,
      date: today,
      checkIn: fourHoursAgo,
      status: "PRESENT",
      workDurationMinutes: 240,
      breakDurationMinutes: 15,
      ipAddress: "192.168.1.45",
      deviceInfo: "Chrome 128 / Windows",
    },
  });

  await prisma.break.create({
    data: {
      attendanceId: attEmployee.id,
      userId: employee.id,
      startTime: oneHourAgo,
      endTime: fortyFiveMinsAgo,
      durationMinutes: 15,
      reason: "Tea & quick snack",
    },
  });

  // Team Lead checked in today
  await prisma.attendance.create({
    data: {
      userId: lead.id,
      date: today,
      checkIn: threeHoursAgo,
      status: "PRESENT",
      workDurationMinutes: 210,
      breakDurationMinutes: 20,
      ipAddress: "192.168.1.10",
      deviceInfo: "Chrome 128 / Windows",
    },
  });

  // Super Admin checked in today
  await prisma.attendance.create({
    data: {
      userId: admin.id,
      date: today,
      checkIn: fourHoursAgo,
      status: "PRESENT",
      workDurationMinutes: 240,
      breakDurationMinutes: 0,
      ipAddress: "192.168.1.5",
      deviceInfo: "Edge 128 / Windows",
    },
  });

  // Historical attendance records for September 2026 (Mon-Sat working days)
  const sundays = new Set(["2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27"]);
  const septemberWorkingDays: string[] = [];
  for (let day = 1; day <= 30; day++) {
    const dayStr = String(day).padStart(2, "0");
    const dStr = `2026-09-${dayStr}`;
    if (!sundays.has(dStr)) {
      septemberWorkingDays.push(dStr);
    }
  }

  for (const u of allUsers) {
    for (const d of septemberWorkingDays) {
      // Leave on 2026-09-16 for Employee
      if (u.id === employee.id && d === "2026-09-16") {
        await prisma.attendance.create({
          data: {
            userId: u.id,
            date: d,
            status: "ON_LEAVE",
            workDurationMinutes: 0,
            breakDurationMinutes: 0,
            notes: "Approved Casual Leave",
          },
        });
        continue;
      }

      // Simulate occasional late arrival for realistic metric graphs
      const isLate = u.id === employee.id && (d === "2026-09-12" || d === "2026-09-22");
      const inM = isLate ? 25 : 5 + (parseInt(u.employeeId.slice(-1) || "1", 10) % 7);
      const outM = 10 + (parseInt(u.employeeId.slice(-1) || "1", 10) % 10);
      const status = isLate ? "LATE" : "PRESENT";
      const inDate = new Date(`${d}T03:${String(inM).padStart(2, "0")}:00Z`);
      const outDate = new Date(`${d}T12:${String(outM).padStart(2, "0")}:00Z`);
      const workMin = isLate ? 480 : 500;

      await prisma.attendance.create({
        data: {
          userId: u.id,
          date: d,
          checkIn: inDate,
          checkOut: outDate,
          status,
          workDurationMinutes: workMin,
          breakDurationMinutes: 45,
          ipAddress: "192.168.1.10",
        },
      });
    }
  }

  // 9. Leave Requests
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      type: "CASUAL",
      startDate: "2026-09-16",
      endDate: "2026-09-16",
      totalDays: 1,
      reason: "Attending family function in hometown.",
      status: "APPROVED",
      reviewedById: lead.id,
      reviewNotes: "Approved. Handover critical tasks before proceeding.",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      type: "SICK",
      startDate: "2026-09-25",
      endDate: "2026-09-25",
      totalDays: 1,
      reason: "Medical consultation follow-up.",
      status: "PENDING",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: lead.id,
      type: "CASUAL",
      startDate: "2026-09-28",
      endDate: "2026-09-28",
      totalDays: 1,
      reason: "Personal work.",
      status: "APPROVED",
      reviewedById: admin.id,
      reviewNotes: "Approved. John will cover operational queries.",
    },
  });

  // 10. Daily Standup EOD Updates for today
  await prisma.dailyUpdate.create({
    data: {
      userId: employee.id,
      date: today,
      completedWork: "Implemented live attendance clock with persistent state and break timer.",
      pendingWork: "Integrating dynamic weekly/monthly report generator.",
      blockedWork: "",
      notes: "Ready for team review.",
    },
  });

  await prisma.dailyUpdate.create({
    data: {
      userId: lead.id,
      date: today,
      completedWork: "Reviewed sprint milestones, verified task assignments and checked leave approvals.",
      pendingWork: "Architecture review for enterprise cloud portal telemetry.",
      blockedWork: "",
      notes: "Sprint delivery on track.",
    },
  });

  // 11. Attendance Correction Request
  await prisma.attendanceCorrection.create({
    data: {
      userId: employee.id,
      requestedDate: "2026-09-15",
      requestedCheckIn: "09:00",
      requestedCheckOut: "18:00",
      reason: "Office internet outage occurred during evening checkout at 6:00 PM.",
      status: "PENDING",
    },
  });

  // 12. Chat Channels
  const chGeneral = await prisma.channel.create({
    data: {
      name: "general",
      topic: "Company-wide general discussions, lunch orders & daily watercooler",
      createdById: admin.id,
    },
  });

  const chDev = await prisma.channel.create({
    data: {
      name: "development",
      topic: "Tech architecture, code reviews, PRs, and infrastructure discussions",
      createdById: lead.id,
    },
  });

  const chAnnounce = await prisma.channel.create({
    data: {
      name: "announcements",
      topic: "Official leadership notifications, holiday notices, and company news",
      createdById: admin.id,
    },
  });

  const allChannels = [chGeneral, chDev, chAnnounce];

  // Channel memberships for the 3 users only
  for (const ch of allChannels) {
    for (const u of allUsers) {
      await prisma.channelMember.create({
        data: { channelId: ch.id, userId: u.id },
      });
    }
  }

  // Sample Messages
  await prisma.message.create({
    data: {
      senderId: admin.id,
      channelId: chGeneral.id,
      content: "Welcome everyone to **Digitechzo WorkOS**! We are now using this platform for all internal attendance, tasks, and team discussions.",
      isPinned: true,
      createdAt: new Date("2026-09-16T04:00:00Z"),
    },
  });

  await prisma.message.create({
    data: {
      senderId: lead.id,
      channelId: chGeneral.id,
      content: "Great to have everything in one single place! Team portals and real-time tracking look great 👋",
      createdAt: new Date("2026-09-16T04:05:00Z"),
    },
  });

  await prisma.message.create({
    data: {
      senderId: employee.id,
      channelId: chDev.id,
      content: "I've pushed the latest attendance timer updates. Check-in and break tracking are synced with the server.",
      createdAt: new Date("2026-09-16T05:30:00Z"),
    },
  });

  await prisma.message.create({
    data: {
      senderId: lead.id,
      channelId: chDev.id,
      content: "Code looks clean. I'll test the verification pipeline shortly.",
      createdAt: new Date("2026-09-16T05:35:00Z"),
    },
  });

  // 13. Announcements
  await prisma.announcement.create({
    data: {
      title: "Welcome to Digitechzo WorkOS 🚀",
      content: "Starting today, all team members should mark their daily attendance directly through WorkOS. Remember that office timing is 09:00 AM with a 15-minute grace window.",
      createdById: admin.id,
      priority: "IMPORTANT",
      audience: "EVERYONE",
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Quarterly All-Hands Meeting this Friday",
      content: "We will hold our Q3 review meeting this Friday at 4:30 PM in the conference room and online.",
      createdById: admin.id,
      priority: "NORMAL",
      audience: "EVERYONE",
    },
  });

  // 14. Holidays
  const holidays = [
    { name: "Gandhi Jayanti", date: "2026-10-02" },
    { name: "Dussehra", date: "2026-10-20" },
    { name: "Diwali (Laxmi Puja)", date: "2026-11-08" },
    { name: "Christmas", date: "2026-12-25" },
    { name: "New Year's Day", date: "2027-01-01" },
    { name: "Republic Day", date: "2027-01-26" },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({ data: h });
  }

  // 15. Audit Log entries
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: "SYSTEM_INITIALIZED",
      targetType: "SETTING",
      details: "Configured office hours (09:00 - 18:00) with 15 minute grace period.",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: lead.id,
      userName: lead.name,
      action: "LEAVE_APPROVED",
      targetType: "LEAVE",
      targetId: employee.id,
      details: "Approved casual leave for John Fernandes for 2026-09-16.",
    },
  });

  console.log("✅ Seed completed successfully! Exactly 3 user accounts created:");
  console.log("==================================================================");
  console.log("1. SUPER ADMIN: admin@digitechzo.com    | Password: password123 | Portal: /admin");
  console.log("2. TEAM LEAD:   lead@digitechzo.com     | Password: password123 | Portal: /lead");
  console.log("3. EMPLOYEE:    employee@digitechzo.com | Password: password123 | Portal: /employee");
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
