import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 定义项目类型
interface ProjectWithMeta {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  memberRole: string | null;
  joinedAt: Date | null;
  _count: {
    milestones: number;
  };
}

// GET /api/users/[id]/projects - 获取用户负责的所有项目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 先找到用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: id }, { openId: id }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 获取用户参与的所有项目
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId: user.id, project: { archived: false } },
      include: {
        project: {
          include: {
            milestones: {
              include: {
                tasks: {
                  include: {
                    assignees: {
                      where: { userId: user.id },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                milestones: true,
              },
            },
          },
        },
      },
    });

    // 获取用户有任务分配的项目（即使不是项目成员）
    const taskAssignees = await prisma.taskAssignee.findMany({
      where: { userId: user.id, task: { milestone: { project: { archived: false } } } },
      include: {
        task: {
          include: {
            milestone: {
              include: {
                project: {
                  include: {
                    _count: {
                      select: {
                        milestones: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 合并项目列表并去重
    const projectMap = new Map<string, ProjectWithMeta>();

    // 添加成员项目
    projectMembers.forEach((pm) => {
      projectMap.set(pm.project.id, {
        ...pm.project,
        memberRole: pm.role,
        joinedAt: pm.joinedAt,
      });
    });

    // 添加有任务的项目
    taskAssignees.forEach((ta) => {
      const project = ta.task.milestone.project;
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, {
          ...project,
          memberRole: null,
          joinedAt: null,
        });
      }
    });

    const projects = Array.from(projectMap.values());

    // 统计信息
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "进行中").length,
      completedProjects: projects.filter((p) => p.status === "已完成").length,
      totalTasks: taskAssignees.length,
      completedTasks: taskAssignees.filter((ta) => ta.task.status === "已完成").length,
      inProgressTasks: taskAssignees.filter((ta) => ta.task.status === "进行中").length,
    };

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          userId: user.userId,
          userName: user.userName,
          avatar: user.avatar,
          role: user.role,
        },
        stats,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          type: p.type,
          status: p.status,
          client: p.client,
          memberRole: p.memberRole,
          joinedAt: p.joinedAt,
          milestoneCount: p._count.milestones,
        })),
      },
    });
  } catch (error) {
    console.error("获取用户项目失败:", error);
    return NextResponse.json(
      { error: "获取用户项目失败" },
      { status: 500 }
    );
  }
}
