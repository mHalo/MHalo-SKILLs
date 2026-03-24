import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/snapshot/dashboard - 获取仪表盘数据（所有项目概览）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.ProjectWhereInput = { archived: false, status: "进行中" };
    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      include: {
        milestones: {
          include: {
            tasks: {
              select: { status: true, assignees: { include: { user: { select: { userName: true, avatar: true, role: true } } } } },
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
          take: 3,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 统计数据
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "进行中").length;
    const completedProjects = projects.filter((p) => p.status === "已完成").length;
    const pausedProjects = projects.filter((p) => p.status === "暂停").length;

    // 任务统计
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let atRiskTasks = 0;

    projects.forEach((project) => {
      project.milestones.forEach((milestone) => {
        milestone.tasks.forEach((task) => {
          totalTasks++;
          if (task.status === "已完成") completedTasks++;
          if (task.status === "进行中") inProgressTasks++;
          if (task.status === "有风险" || task.status === "已延期") atRiskTasks++;
        });
      });
    });

    // 即将到期的事件
    const upcomingEvents = projects
      .flatMap((p) =>
        p.calendarEvents.map((e) => ({
          ...e,
          projectName: p.name,
          projectId: p.id,
        }))
      )
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
      .slice(0, 10);

    const dashboard = {
      statistics: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          paused: pausedProjects,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          atRisk: atRiskTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      },
      projects: projects.map((p) => {
        // 从任务的负责人中汇总项目成员
        const memberMap = new Map<string, { userName: string; avatar: string | null; role: string }>();
        p.milestones.forEach((m) => {
          m.tasks.forEach((t) => {
            t.assignees.forEach((a) => {
              if (!memberMap.has(a.user.userName)) {
                memberMap.set(a.user.userName, {
                  userName: a.user.userName,
                  avatar: a.user.avatar,
                  role: a.user.role,
                });
              }
            });
          });
        });
        const members = Array.from(memberMap.values()).slice(0, 5);

        return {
          id: p.id,
          name: p.name,
          status: p.status,
          type: p.type,
          client: p.client,
          taskCount: p.milestones.reduce((acc, m) => acc + m.tasks.length, 0),
          completedTaskCount: p.milestones.reduce(
            (acc, m) => acc + m.tasks.filter((t) => t.status === "已完成").length,
            0
          ),
          milestoneCount: p.milestones.length,
          members: members.map((m) => ({ user: m })),
          updatedAt: p.updatedAt,
        };
      }),
      upcomingEvents,
    };

    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error("获取仪表盘数据失败:", error);
    return NextResponse.json(
      { error: "获取仪表盘数据失败" },
      { status: 500 }
    );
  }
}
