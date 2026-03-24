import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/users/[id] - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 支持通过 userId 或 openId 查询
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: id }, { openId: id }],
      },
      include: {
        assignedTasks: {
          where: {
            task: { milestone: { project: { archived: false } } },
          },
          include: {
            task: {
              include: {
                milestone: {
                  include: {
                    project: true,
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
              },
            },
          },
        },
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("获取用户详情失败:", error);
    return NextResponse.json(
      { error: "获取用户详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      userName,
      avatar,
      avatarColorBg,
      avatarColorText,
      role,
      email,
      phone,
      status,
    } = body;

    // 先找到用户
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userId: id }, { openId: id }],
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        userName,
        avatar,
        avatarColorBg,
        avatarColorText,
        role,
        email,
        phone,
        status,
      },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json(
      { error: "更新用户失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 先找到用户
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userId: id }, { openId: id }],
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: existingUser.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json(
      { error: "删除用户失败" },
      { status: 500 }
    );
  }
}
