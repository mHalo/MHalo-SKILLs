import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id] - 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { createdAt: "asc" },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, userId: true, userName: true, avatar: true, role: true },
                    },
                  },
                },
              },
            },
          },
        },
        calendarEvents: {
          orderBy: { eventDate: "asc" },
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

    // 从任务负责人汇总项目成员
    const memberMap = new Map<string, { userName: string; avatar: string | null; role: string }>();
    project.milestones.forEach((m) => {
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
    const members = Array.from(memberMap.values()).map((m) => ({ user: m }));

    return NextResponse.json({ data: { ...project, members } });
  } catch (error) {
    console.error("获取项目详情失败:", error);
    return NextResponse.json(
      { error: "获取项目详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, type, status, client, startDate, endDate } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        type,
        status,
        client,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("更新项目失败:", error);
    return NextResponse.json(
      { error: "更新项目失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除项目失败:", error);
    return NextResponse.json(
      { error: "删除项目失败" },
      { status: 500 }
    );
  }
}
