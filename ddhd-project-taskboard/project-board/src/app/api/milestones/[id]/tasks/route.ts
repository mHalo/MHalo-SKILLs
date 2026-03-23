import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// 定义任务树类型
interface TaskTreeItem {
  id: string;
  title: string;
  description: string | null;
  assigneeRole: string | null;
  assigneeName: string | null;
  deliverableType: string | null;
  status: string;
  priority: string;
  plannedDate: Date | null;
  actualDate: Date | null;
  milestoneId: string;
  parentTaskId: string | null;
  nextTaskId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignees: Prisma.TaskAssigneeGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          userId: true;
          userName: true;
          avatar: true;
          role: true;
        };
      };
    };
  }>[];
  _count: {
    subTasks: number;
  };
  subTasks: TaskTreeItem[];
}

// GET /api/milestones/[id]/tasks - 获取里程碑的任务列表（树形结构）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await params;

    // 获取所有任务（包含负责人信息）
    const allTasks = await prisma.task.findMany({
      where: { milestoneId },
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
        _count: {
          select: { subTasks: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 构建任务树
    const taskMap = new Map<string, TaskTreeItem>();
    const rootTasks: TaskTreeItem[] = [];

    // 先创建所有任务的映射
    allTasks.forEach((task) => {
      taskMap.set(task.id, { ...task, subTasks: [] });
    });

    // 构建父子关系
    allTasks.forEach((task) => {
      const taskWithChildren = taskMap.get(task.id)!;
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
      assigneeRole,   // 兼容旧字段
      assigneeName,   // 兼容旧字段
      assignees,      // 新字段：负责人列表 [{userId, role}]
      deliverableType,
      priority,
      plannedDate,
      parentTaskId,
    } = body;

    // 创建任务
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

    // 如果有指定负责人，创建关联
    if (assignees && assignees.length > 0) {
      for (const assignee of assignees) {
        // 通过 userId 查找用户
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

    // 返回包含负责人信息的任务
    const taskWithAssignees = await prisma.task.findUnique({
      where: { id: task.id },
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

    return NextResponse.json({ data: taskWithAssignees }, { status: 201 });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json(
      { error: "创建任务失败" },
      { status: 500 }
    );
  }
}
