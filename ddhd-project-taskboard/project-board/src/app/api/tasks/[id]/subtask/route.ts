import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/tasks/[id]/subtask - 创建子任务/后续任务（任务链）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentTaskId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      assigneeRole,
      assigneeName,
      deliverableType,
      priority,
      plannedDate,
    } = body;

    // 获取父任务的 milestoneId
    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
      select: { milestoneId: true },
    });

    if (!parentTask) {
      return NextResponse.json(
        { error: "父任务不存在" },
        { status: 404 }
      );
    }

    // 创建子任务
    const subTask = await prisma.task.create({
      data: {
        milestoneId: parentTask.milestoneId,
        parentTaskId,
        title,
        description,
        assigneeRole,
        assigneeName,
        deliverableType,
        priority: priority || "P1",
        plannedDate: plannedDate ? new Date(plannedDate) : null,
      },
    });

    return NextResponse.json({ data: subTask }, { status: 201 });
  } catch (error) {
    console.error("创建子任务失败:", error);
    return NextResponse.json(
      { error: "创建子任务失败" },
      { status: 500 }
    );
  }
}
