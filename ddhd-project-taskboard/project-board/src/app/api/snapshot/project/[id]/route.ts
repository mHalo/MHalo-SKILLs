import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/snapshot/project/[id] - 获取项目完整快照（Agent首选）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
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
        milestones: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
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
                        role: true,
                      },
                    },
                  },
                },
                changeLogs: {
                  orderBy: { changedAt: "desc" },
                  take: 5,
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
                            role: true,
                          },
                        },
                      },
                    },
                  },
                },
                deliverables: true,
              },
            },
          },
        },
        calendarEvents: {
          where: {
            eventDate: {
              gte: new Date(),
            },
          },
          orderBy: { eventDate: "asc" },
          take: 10,
        },
        communications: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "项目不存在" },
        { status: 404 }
      );
    }

    // 统计数据
    const allTasks = project.milestones.flatMap((m: any) => m.tasks);
    const allSubTasks = allTasks.flatMap((t: any) => t.subTasks || []);
    const totalTasks = allTasks.length + allSubTasks.length;
    const completedTasks = [...allTasks, ...allSubTasks].filter(
      (t: any) => t.status === "已完成"
    ).length;
    const inProgressTasks = [...allTasks, ...allSubTasks].filter(
      (t: any) => t.status === "进行中"
    ).length;

    // 提取所有参与项目的用户
    const memberMap = new Map();
    project.members.forEach((m: any) => {
      memberMap.set(m.user.id, m.user);
    });
    // 从任务中提取负责人
    [...allTasks, ...allSubTasks].forEach((t: any) => {
      t.assignees?.forEach((a: any) => {
        if (a.user) {
          memberMap.set(a.user.id, a.user);
        }
      });
    });
    const allMembers = Array.from(memberMap.values());

    const snapshot = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status,
        client: project.client,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      statistics: {
        totalMilestones: project.milestones.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        memberCount: allMembers.length,
      },
      members: allMembers,
      milestones: project.milestones.map((milestone: any) => ({
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        deadline: milestone.deadline,
        status: milestone.status,
        order: milestone.order,
        tasks: milestone.tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignees: task.assignees.map((a: any) => ({
            userId: a.user.userId,
            userName: a.user.userName,
            avatar: a.user.avatar,
            role: a.user.role,
            taskRole: a.role,
          })),
          // 兼容旧字段
          assigneeRole: task.assigneeRole,
          assigneeName: task.assigneeName,
          deliverableType: task.deliverableType,
          status: task.status,
          priority: task.priority,
          plannedDate: task.plannedDate,
          actualDate: task.actualDate,
          changeLogs: task.changeLogs,
          subTasks: task.subTasks?.map((sub: any) => ({
            id: sub.id,
            title: sub.title,
            assignees: sub.assignees.map((a: any) => ({
              userId: a.user.userId,
              userName: a.user.userName,
              avatar: a.user.avatar,
              role: a.user.role,
            })),
            status: sub.status,
            priority: sub.priority,
            plannedDate: sub.plannedDate,
          })),
          deliverables: task.deliverables,
        })),
      })),
      upcomingEvents: project.calendarEvents,
      recentCommunications: project.communications,
    };

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    console.error("获取项目快照失败:", error);
    return NextResponse.json(
      { error: "获取项目快照失败" },
      { status: 500 }
    );
  }
}
