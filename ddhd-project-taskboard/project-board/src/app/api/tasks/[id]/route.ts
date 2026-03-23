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
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    userId: true,
                    userName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                userId: true,
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
      assignees,      // 新字段：更新负责人列表
      deliverableType,
      status,
      priority,
      plannedDate,
      actualDate,
    } = body;

    // 更新任务基本信息
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

    // 如果提供了负责人列表，更新负责人
    if (assignees !== undefined) {
      // 删除现有的负责人关联
      await prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      // 创建新的负责人关联
      for (const assignee of assignees) {
        const user = await prisma.user.findUnique({
          where: { userId: assignee.userId },
        });

        if (user) {
          await prisma.taskAssignee.create({
            data: {
              taskId: id,
              userId: user.id,
              role: assignee.role || null,
            },
          });
        }
      }
    }

    // 返回更新后的任务（包含负责人信息）
    const taskWithAssignees = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                userId: true,
                userName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: taskWithAssignees });
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
