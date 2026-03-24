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
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: { id: true, name: true }
            }
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        changeLogs: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const { title, status, priority, dueDate, reason, completionNote } = body;

    // 获取当前任务信息用于日志
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completionNote !== undefined) updateData.completionNote = completionNote;
    
    // 如果状态变为已完成，设置实际完成日期
    if (status === "已完成" && existingTask.status !== "已完成") {
      updateData.actualDate = new Date();
    }

    // 先更新任务
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
              },
            },
          },
        },
      },
    });

    // 如果有状态变更，单独创建日志记录
    if (status !== undefined && status !== existingTask.status) {
      try {
        await prisma.taskChangeLog.create({
          data: {
            taskId: id,
            field: "状态",
            oldValue: existingTask.status,
            newValue: status,
            reason: reason || "状态变更",
            changedBy: "system",
          },
        });
      } catch (logError) {
        console.error("Failed to create change log:", logError);
      }
    }

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error("Failed to update task:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update task", details: errorMessage },
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

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
