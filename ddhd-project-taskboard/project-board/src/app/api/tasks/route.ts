import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/tasks - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Prisma.TaskWhereInput = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        milestone: {
          select: { id: true, name: true, projectId: true },
        },
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
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - 创建任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      milestoneId,
      assigneeRole,
      assigneeName,
      assignees,
      deliverableType,
      status,
      priority,
      plannedDate,
      parentTaskId,
    } = body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        milestoneId,
        assigneeRole,
        assigneeName,
        deliverableType,
        status: status || "待开始",
        priority: priority || "P1",
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        parentTaskId,
      },
    });

    // 如果有负责人列表，创建关联
    if (assignees && assignees.length > 0) {
      for (const assignee of assignees) {
        const user = await prisma.user.findUnique({
          where: { userId: assignee.userId },
        });

        if (user) {
          await prisma.taskAssignee.create({
            data: {
              taskId: task.id,
              userId: user.id,
              role: assignee.role || null,
            },
          });
        }
      }
    }

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json(
      { error: "创建任务失败" },
      { status: 500 }
    );
  }
}
