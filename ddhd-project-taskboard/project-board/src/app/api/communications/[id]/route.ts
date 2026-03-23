import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/communications/[id] - 获取单个沟通记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!communication) {
      return NextResponse.json(
        { error: "沟通记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: communication });
  } catch (error) {
    console.error("获取沟通记录失败:", error);
    return NextResponse.json(
      { error: "获取沟通记录失败" },
      { status: 500 }
    );
  }
}

// PUT /api/communications/[id] - 更新沟通记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, date, participants, summary, recordingPath, actionItems } = body;

    const communication = await prisma.communication.update({
      where: { id },
      data: {
        type,
        date: date ? new Date(date) : undefined,
        participants,
        summary,
        recordingPath,
        actionItems: actionItems ? JSON.stringify(actionItems) : undefined,
      },
    });

    return NextResponse.json({ data: communication });
  } catch (error) {
    console.error("更新沟通记录失败:", error);
    return NextResponse.json(
      { error: "更新沟通记录失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/communications/[id] - 删除沟通记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.communication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除沟通记录失败:", error);
    return NextResponse.json(
      { error: "删除沟通记录失败" },
      { status: 500 }
    );
  }
}
