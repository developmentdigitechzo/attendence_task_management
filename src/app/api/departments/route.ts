import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    let generatedCode = code?.trim().toUpperCase();
    if (!generatedCode) {
      const words = trimmedName.split(/\s+/);
      if (words.length > 1) {
        generatedCode = words.map((w: string) => w[0]).join("").toUpperCase();
      } else {
        generatedCode = trimmedName.slice(0, 3).toUpperCase();
      }
    }

    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { code: generatedCode },
        ],
      },
    });

    if (existing) {
      if (existing.name.toLowerCase() === trimmedName.toLowerCase()) {
        return NextResponse.json(
          { error: "A department with this name already exists." },
          { status: 400 }
        );
      }
      generatedCode = `${generatedCode}_${Math.floor(Math.random() * 90 + 10)}`;
    }

    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        code: generatedCode,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error: any) {
    console.error("Create department error:", error);
    return NextResponse.json(
      { error: "Failed to create department." },
      { status: 500 }
    );
  }
}
