import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
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
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.companySetting.deleteMany();

  // 1. Company Settings
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

  // 2. Departments
  const deptDev = await prisma.department.create({
    data: { name: "Development", code: "DEV", description: "Software engineering and technology architecture" },
  });
  const deptDesign = await prisma.department.create({
    data: { name: "Design", code: "DSN", description: "UI/UX, visual branding and creative direction" },
  });
  const deptMarketing = await prisma.department.create({
    data: { name: "Marketing", code: "MKT", description: "Digital marketing, social media and campaigns" },
  });
  const deptSales = await prisma.department.create({
    data: { name: "Sales", code: "SLS", description: "Client acquisition and revenue growth" },
  });
  const deptHR = await prisma.department.create({
    data: { name: "HR & Operations", code: "HR", description: "Human resources, payroll, and internal ops" },
  });

  // Default hashed password: "password123"
  const passwordHash = await bcrypt.hash("password123", 10);

  // 3. Super Admin
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
      bio: "Founder and director leading digital transformation at Digitechzo.",
      skills: "Leadership, Strategy, Operations, Architecture",
    },
  });

  // 4. Manager
  const manager = await prisma.user.create({
    data: {
      employeeId: "DIG-002",
      name: "Vikram Sharma",
      email: "manager@digitechzo.com",
      passwordHash,
      role: "MANAGER",
      departmentId: deptDev.id,
      designation: "Engineering & Delivery Lead",
      phone: "+91 98765 43211",
      managerId: admin.id,
      workLocation: "Headquarters",
      workingHours: "09:00 - 18:00",
      bio: "Technical lead managing client delivery and engineering workflows.",
      skills: "Full-Stack Development, Project Management, Agile, Mentorship",
    },
  });

  // 5. Employees
  const empJohn = await prisma.user.create({
    data: {
      employeeId: "DIG-003",
      name: "John Fernandes",
      email: "john@digitechzo.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: deptDev.id,
      designation: "Senior Full-Stack Developer",
      phone: "+91 98765 43212",
      managerId: manager.id,
      workLocation: "Office (Desk 4)",
      workingHours: "09:00 - 18:00",
      bio: "Full-stack developer focusing on Next.js, APIs, and scalable infrastructure.",
      skills: "React, Next.js, Node.js, PostgreSQL, TypeScript",
    },
  });

  const empSarah = await prisma.user.create({
    data: {
      employeeId: "DIG-004",
      name: "Sarah Khan",
      email: "sarah@digitechzo.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: deptDesign.id,
      designation: "Lead UI/UX Designer",
      phone: "+91 98765 43213",
      managerId: manager.id,
      workLocation: "Office (Desk 5)",
      workingHours: "09:00 - 18:00",
      bio: "Crafting beautiful SaaS user experiences, design systems, and client brands.",
      skills: "Figma, UI/UX, Design Systems, Prototyping, Motion Design",
    },
  });

  const empPriya = await prisma.user.create({
    data: {
      employeeId: "DIG-005",
      name: "Priya Patel",
      email: "priya@digitechzo.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: deptMarketing.id,
      designation: "Digital Marketing Specialist",
      phone: "+91 98765 43214",
      managerId: manager.id,
      workLocation: "Office (Desk 8)",
      workingHours: "09:00 - 18:00",
      bio: "Performance marketing, SEO, social campaigns, and client brand visibility.",
      skills: "Performance Ads, Meta Ads, SEO, Content Strategy, Analytics",
    },
  });

  const empArun = await prisma.user.create({
    data: {
      employeeId: "DIG-006",
      name: "Arun Verma",
      email: "arun@digitechzo.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: deptSales.id,
      designation: "Client Growth & Sales Strategist",
      phone: "+91 98765 43215",
      managerId: manager.id,
      workLocation: "Office (Desk 9)",
      workingHours: "09:00 - 18:00",
      bio: "Managing business development, client proposals, and strategic partnerships.",
      skills: "B2B Sales, CRM, Negotiation, Strategic Partnerships",
    },
  });

  // 6. Projects
  const projWorkOS = await prisma.project.create({
    data: {
      name: "Digitechzo WorkOS",
      client: "Internal Digitechzo",
      description: "Comprehensive internal employee management, attendance & task platform",
      managerId: admin.id,
      status: "ACTIVE",
      startDate: new Date("2026-09-01"),
      deadline: new Date("2026-09-30"),
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: manager.id, role: "MANAGER" },
          { userId: empJohn.id, role: "DEVELOPER" },
          { userId: empSarah.id, role: "DESIGNER" },
        ],
      },
    },
  });

  const projKulfi = await prisma.project.create({
    data: {
      name: "Mumbai Kulfi Branding",
      client: "Mumbai Kulfi Delights",
      description: "Rebranding campaign, digital video reels, and social marketing launch",
      managerId: manager.id,
      status: "ACTIVE",
      startDate: new Date("2026-09-05"),
      deadline: new Date("2026-09-25"),
      members: {
        create: [
          { userId: manager.id, role: "MANAGER" },
          { userId: empSarah.id, role: "DESIGNER" },
          { userId: empPriya.id, role: "MARKETER" },
        ],
      },
    },
  });

  // 6.1 NiftyPM-Style Milestones
  const m1 = await (prisma as any).milestone.create({
    data: {
      projectId: projWorkOS.id,
      name: "Phase 1: Design & Architecture",
      description: "Establish neutral SaaS design system and auth foundation",
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-09-12"),
      status: "COMPLETED",
    },
  });

  const m2 = await (prisma as any).milestone.create({
    data: {
      projectId: projWorkOS.id,
      name: "Phase 2: Attendance Engine & 3 Portals",
      description: "Live Check In/Out, break tracking, and dedicated Lead/Employee portals",
      startDate: new Date("2026-09-10"),
      dueDate: new Date("2026-09-20"),
      status: "IN_PROGRESS",
    },
  });

  const m3 = await (prisma as any).milestone.create({
    data: {
      projectId: projKulfi.id,
      name: "Milestone 1: Creative Production",
      description: "Video reels editing, flavor photoshoots, and menu design",
      startDate: new Date("2026-09-05"),
      dueDate: new Date("2026-09-18"),
      status: "IN_PROGRESS",
    },
  });

  const m4 = await (prisma as any).milestone.create({
    data: {
      projectId: projKulfi.id,
      name: "Milestone 2: Ads Launch & Distribution",
      description: "Meta ads campaign rollout and local influencer partnerships",
      startDate: new Date("2026-09-18"),
      dueDate: new Date("2026-09-25"),
      status: "UPCOMING",
    },
  });

  // 7. Tasks
  const tasks = [
    {
      taskId: "TSK-101",
      title: "Design System & Figma Components",
      description: "Establish neutral SaaS typography, badge variants, and table designs",
      projectId: projWorkOS.id,
      milestoneId: m1.id,
      assignedToId: empSarah.id,
      createdById: manager.id,
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
      assignedToId: empJohn.id,
      createdById: manager.id,
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
      assignedToId: empJohn.id,
      createdById: admin.id,
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-09-18"),
    },
    {
      taskId: "TSK-104",
      title: "Edit Video Reel 1 - Kitchen Process",
      description: "Cut and color grade 30-second Instagram reel with trending sound",
      projectId: projKulfi.id,
      milestoneId: m3.id,
      assignedToId: empSarah.id,
      createdById: manager.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-09-17"),
    },
    {
      taskId: "TSK-105",
      title: "Edit Video Reel 2 - Taste Test Reactions",
      description: "Motion graphics text overlays and call to action for Mumbai outlets",
      projectId: projKulfi.id,
      milestoneId: m3.id,
      assignedToId: empSarah.id,
      createdById: manager.id,
      priority: "MEDIUM",
      status: "TODO",
      dueDate: new Date("2026-09-19"),
    },
    {
      taskId: "TSK-106",
      title: "Setup Meta Ads Campaign for Mumbai Kulfi",
      description: "Target local foodies within 10km radius of flagship store",
      projectId: projKulfi.id,
      milestoneId: m4.id,
      assignedToId: empPriya.id,
      createdById: manager.id,
      priority: "URGENT",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-09-16"),
    },
    {
      taskId: "TSK-107",
      title: "Q3 Corporate Client Outreach",
      description: "Contact 40 local corporate offices for festival gifting hampers",
      projectId: null,
      assignedToId: empArun.id,
      createdById: admin.id,
      priority: "MEDIUM",
      status: "BLOCKED",
      dueDate: new Date("2026-09-15"), // Overdue!
    },
    {
      taskId: "TSK-108",
      title: "E-Commerce Checkout Flow & Payment Gateway",
      description: "Implemented Razorpay webhooks and completed mobile responsive order confirmation",
      projectId: projWorkOS.id,
      milestoneId: m2.id,
      assignedToId: empJohn.id,
      createdById: manager.id,
      priority: "HIGH",
      status: "REVIEW",
      dueDate: new Date("2026-09-17"),
    },
    {
      taskId: "TSK-109",
      title: "Brand Guideline & Typography Spec Sheet",
      description: "Finalized color contrast ratios and export ready Figma tokens for client review",
      projectId: projKulfi.id,
      milestoneId: m3.id,
      assignedToId: empSarah.id,
      createdById: manager.id,
      priority: "MEDIUM",
      status: "REVIEW",
      dueDate: new Date("2026-09-17"),
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  // 8. Attendance Records
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

  // John checked in on time
  const attJohn = await prisma.attendance.create({
    data: {
      userId: empJohn.id,
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
      attendanceId: attJohn.id,
      userId: empJohn.id,
      startTime: oneHourAgo,
      endTime: fortyFiveMinsAgo,
      durationMinutes: 15,
      reason: "Tea & quick snack",
    },
  });

  // Sarah checked in late
  const attSarah = await prisma.attendance.create({
    data: {
      userId: empSarah.id,
      date: today,
      checkIn: threeHoursAgo,
      status: "LATE",
      workDurationMinutes: 210,
      breakDurationMinutes: 0,
      ipAddress: "192.168.1.48",
      deviceInfo: "Safari / macOS",
    },
  });

  // Priya Patel checked in
  await prisma.attendance.create({
    data: {
      userId: empPriya.id,
      date: today,
      checkIn: fourHoursAgo,
      status: "PRESENT",
      workDurationMinutes: 240,
      breakDurationMinutes: 30,
      ipAddress: "192.168.1.52",
      deviceInfo: "Firefox / Ubuntu",
    },
  });

  // Arun is on approved leave today
  await prisma.attendance.create({
    data: {
      userId: empArun.id,
      date: today,
      status: "ON_LEAVE",
      workDurationMinutes: 0,
      breakDurationMinutes: 0,
      notes: "Casual Leave - Family function",
    },
  });

  // Vikram Sharma (Manager) checked in
  await prisma.attendance.create({
    data: {
      userId: manager.id,
      date: today,
      checkIn: fourHoursAgo,
      status: "PRESENT",
      workDurationMinutes: 240,
      breakDurationMinutes: 20,
      ipAddress: "192.168.1.10",
      deviceInfo: "Chrome 128 / Windows",
    },
  });

  // Historical attendance records for all working days in September 2026 (26 working days, Mon-Sat)
  const sundays = new Set(["2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27"]);
  const septemberWorkingDays: string[] = [];
  for (let day = 1; day <= 30; day++) {
    const dayStr = String(day).padStart(2, "0");
    const dStr = `2026-09-${dayStr}`;
    if (!sundays.has(dStr)) {
      septemberWorkingDays.push(dStr);
    }
  }

  const allStaff = [admin, manager, empJohn, empSarah, empPriya, empArun];

  for (const emp of allStaff) {
    for (const d of septemberWorkingDays) {
      if (emp.id === empArun.id && d === "2026-09-16") {
        await prisma.attendance.create({
          data: {
            userId: emp.id,
            date: d,
            status: "ON_LEAVE",
            workDurationMinutes: 0,
            breakDurationMinutes: 0,
            notes: "Approved Casual Leave",
          },
        });
        continue;
      }

      const isLate =
        (emp.id === empSarah.id && (d === "2026-09-12" || d === "2026-09-25")) ||
        (emp.id === empArun.id && (d === "2026-09-11" || d === "2026-09-22"));

      const inM = isLate ? 25 : 5 + (parseInt(emp.employeeId.slice(-1) || "1", 10) % 7);
      const outM = 10 + (parseInt(emp.employeeId.slice(-1) || "1", 10) % 10);
      const status = isLate ? "LATE" : "PRESENT";
      const inDate = new Date(`${d}T03:${String(inM).padStart(2, "0")}:00Z`);
      const outDate = new Date(`${d}T12:${String(outM).padStart(2, "0")}:00Z`);
      const workMin = isLate ? 480 : 500;

      await prisma.attendance.create({
        data: {
          userId: emp.id,
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
      userId: empArun.id,
      type: "CASUAL",
      startDate: "2026-09-16",
      endDate: "2026-09-16",
      totalDays: 1,
      reason: "Attending cousin's engagement ceremony in Pune.",
      status: "APPROVED",
      reviewedById: manager.id,
      reviewNotes: "Approved. Please ensure handoff of client proposals.",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: empSarah.id,
      type: "SICK",
      startDate: "2026-09-21",
      endDate: "2026-09-21",
      totalDays: 1,
      reason: "Routine dental surgery follow-up.",
      status: "PENDING",
    },
  });

  // Daily Standup EOD Updates for today
  await prisma.dailyUpdate.create({
    data: {
      userId: empJohn.id,
      date: today,
      completedWork: "Implemented live attendance clock with persistent state and break timer.",
      pendingWork: "Integrating dynamic weekly/monthly report generator.",
      blockedWork: "",
      notes: "Ready for team review.",
    },
  });

  await prisma.dailyUpdate.create({
    data: {
      userId: empSarah.id,
      date: today,
      completedWork: "Finished Figma layout tokens and responsive mobile navigation drawer.",
      pendingWork: "Exporting PNG assets for Mumbai Kulfi branding campaign.",
      blockedWork: "Waiting on client logo high-res SVG assets.",
      notes: "Need team lead assistance to expedite client communication.",
    },
  });

  // Pending Attendance Correction Request
  await prisma.attendanceCorrection.create({
    data: {
      userId: empJohn.id,
      requestedDate: "2026-09-15",
      requestedCheckIn: "09:00",
      requestedCheckOut: "18:00",
      reason: "Office internet outage occurred during evening checkout at 6:00 PM.",
      status: "PENDING",
    },
  });

  // 10. Slack-like Chat Channels
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
      createdById: manager.id,
    },
  });

  const chDesign = await prisma.channel.create({
    data: {
      name: "design",
      topic: "UI/UX prototypes, branding guidelines, and visual asset feedback",
      createdById: empSarah.id,
    },
  });

  const chMarketing = await prisma.channel.create({
    data: {
      name: "marketing",
      topic: "Campaign performance, social reels, ad spends and lead metrics",
      createdById: empPriya.id,
    },
  });

  const chAnnounce = await prisma.channel.create({
    data: {
      name: "announcements",
      topic: "Official leadership notifications, holiday notices, and company news",
      createdById: admin.id,
    },
  });

  // Channel memberships for all
  const allUsers = [admin, manager, empJohn, empSarah, empPriya, empArun];
  const allChannels = [chGeneral, chDev, chDesign, chMarketing, chAnnounce];

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
      senderId: manager.id,
      channelId: chGeneral.id,
      content: "Great to have everything in one single place! Goodbye scattered WhatsApp groups 👋",
      createdAt: new Date("2026-09-16T04:05:00Z"),
    },
  });

  await prisma.message.create({
    data: {
      senderId: empJohn.id,
      channelId: chDev.id,
      content: "I've pushed the latest attendance timer updates. Check-in and break tracking are synced with the server.",
      createdAt: new Date("2026-09-16T05:30:00Z"),
    },
  });

  await prisma.message.create({
    data: {
      senderId: empSarah.id,
      channelId: chDesign.id,
      content: "Just finalized the thumbnail variations for Mumbai Kulfi Reel #1. Sharing the review links shortly!",
      createdAt: new Date("2026-09-16T06:15:00Z"),
    },
  });

  // 11. Announcements
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

  // 12. Holidays
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

  // 13. Audit Log entries
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
      userId: manager.id,
      userName: manager.name,
      action: "LEAVE_APPROVED",
      targetType: "LEAVE",
      targetId: empArun.id,
      details: "Approved casual leave for Arun Verma for 2026-09-16.",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log("Super Admin: admin@digitechzo.com / password123");
  console.log("Manager:     manager@digitechzo.com / password123");
  console.log("Employee:    john@digitechzo.com / password123");
  console.log("Employee:    sarah@digitechzo.com / password123");
  console.log("Employee:    priya@digitechzo.com / password123");
  console.log("Employee:    arun@digitechzo.com / password123");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
