import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            assignedTasks: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/users - 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      openId,
      userName,
      avatar,
      role,
      email,
      phone,
    } = body;

    // 如果没有提供 userId，自动生成一个
    const finalUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 检查 userId 是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { userId: finalUserId },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "用户ID已存在" },
        { status: 409 }
      );
    }

    // 如果提供了 openId，检查是否已存在
    if (openId) {
      const existingOpenId = await prisma.user.findUnique({
        where: { openId },
      });
      if (existingOpenId) {
        return NextResponse.json(
          { error: "OpenID已存在" },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        userId: finalUserId,
        openId: openId || null,
        userName,
        avatar: avatar || null,
        role: role || "",
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json(
      { error: "创建用户失败" },
      { status: 500 }
    );
  }
}
