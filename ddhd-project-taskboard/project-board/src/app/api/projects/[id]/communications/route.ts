import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id]/communications - 获取项目沟通记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const communications = await prisma.communication.findMany({
      where: { projectId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ data: communications });
  } catch (error) {
    console.error("获取沟通记录失败:", error);
    return NextResponse.json(
      { error: "获取沟通记录失败" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/communications - 创建沟通记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { type, date, participants, summary, recordingPath, actionItems } = body;

    const communication = await prisma.communication.create({
      data: {
        projectId,
        type,
        date: date ? new Date(date) : new Date(),
        participants,
        summary,
        recordingPath,
        actionItems: actionItems ? JSON.stringify(actionItems) : null,
      },
    });

    return NextResponse.json({ data: communication }, { status: 201 });
  } catch (error) {
    console.error("创建沟通记录失败:", error);
    return NextResponse.json(
      { error: "创建沟通记录失败" },
      { status: 500 }
    );
  }
}
