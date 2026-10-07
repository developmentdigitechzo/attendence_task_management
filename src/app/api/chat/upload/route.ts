import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

// 10MB maximum file size
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension
    const originalName = file.name || "attachment";
    const rawExt = path.extname(originalName).toLowerCase();
    const ext = rawExt || (file.type.startsWith("image/") ? ".png" : ".bin");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "chat");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Unique filename
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const safeBase = path
      .basename(originalName, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `${safeBase}_${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const isImage =
      file.type.startsWith("image/") ||
      [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"].includes(ext);

    const publicUrl = `/uploads/chat/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: originalName,
      type: isImage ? "image" : "document",
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("Chat file upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}
