import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/milestones/[id]/tasks - 获取里程碑的任务列表（树形结构）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await params;

    // 获取所有任务
    const allTasks = await prisma.task.findMany({
      where: { milestoneId },
      include: {
        _count: {
          select: { subTasks: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 构建任务树
    const taskMap = new Map();
    const rootTasks: any[] = [];

    // 先创建所有任务的映射
    allTasks.forEach((task) => {
      taskMap.set(task.id, { ...task, subTasks: [] });
    });

    // 构建父子关系
    allTasks.forEach((task) => {
      const taskWithChildren = taskMap.get(task.id);
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId);
        if (parent) {
          parent.subTasks.push(taskWithChildren);
        }
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    return NextResponse.json({ data: rootTasks });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/milestones/[id]/tasks - 创建任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      assigneeRole,
      assigneeName,
      deliverableType,
      priority,
      plannedDate,
      parentTaskId,
    } = body;

    const task = await prisma.task.create({
      data: {
        milestoneId,
        title,
        description,
        assigneeRole,
        assigneeName,
        deliverableType,
        priority: priority || "P1",
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        parentTaskId: parentTaskId || null,
      },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json(
      { error: "创建任务失败" },
      { status: 500 }
    );
  }
}
