import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/tasks/[id] - 获取任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        milestone: {
          select: { id: true, name: true, projectId: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        subTasks: {
          orderBy: { createdAt: "asc" },
        },
        changeLogs: {
          orderBy: { changedAt: "desc" },
        },
        deliverables: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "任务不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json(
      { error: "获取任务详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      assigneeRole,
      assigneeName,
      deliverableType,
      status,
      priority,
      plannedDate,
      actualDate,
    } = body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        assigneeRole,
        assigneeName,
        deliverableType,
        status,
        priority,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        actualDate: actualDate ? new Date(actualDate) : null,
      },
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("更新任务失败:", error);
    return NextResponse.json(
      { error: "更新任务失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json(
      { error: "删除任务失败" },
      { status: 500 }
    );
  }
}
