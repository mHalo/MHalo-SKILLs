import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/tasks/[id]/status - 快速更新任务状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason, changedBy } = body;

    // 获取原状态
    const oldTask = await prisma.task.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!oldTask) {
      return NextResponse.json(
        { error: "任务不存在" },
        { status: 404 }
      );
    }

    // 更新状态
    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        actualDate: status === "已完成" ? new Date() : null,
      },
    });

    // 记录变更日志
    await prisma.taskChangeLog.create({
      data: {
        taskId: id,
        field: "状态",
        oldValue: oldTask.status,
        newValue: status,
        reason: reason || `状态从 ${oldTask.status} 变更为 ${status}`,
        changedBy: changedBy || "system",
      },
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("更新任务状态失败:", error);
    return NextResponse.json(
      { error: "更新任务状态失败" },
      { status: 500 }
    );
  }
}
