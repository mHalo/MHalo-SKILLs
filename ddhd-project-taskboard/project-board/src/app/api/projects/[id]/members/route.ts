import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id]/members - 获取项目成员列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            userName: true,
            avatar: true,
            role: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("获取项目成员失败:", error);
    return NextResponse.json(
      { error: "获取项目成员失败" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - 添加项目成员
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { userId, role } = body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查是否已是成员
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "该用户已是项目成员" },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
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
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    console.error("添加项目成员失败:", error);
    return NextResponse.json(
      { error: "添加项目成员失败" },
      { status: 500 }
    );
  }
}
