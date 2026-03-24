import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/milestones - 创建里程碑
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, projectId, description, deadline, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: "里程碑名称不能为空" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "项目ID不能为空" },
        { status: 400 }
      );
    }

    // 获取该项目的里程碑数量，用于设置 order
    const milestoneCount = await prisma.milestone.count({
      where: { projectId },
    });

    const milestone = await prisma.milestone.create({
      data: {
        name,
        projectId,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "待开始",
        order: milestoneCount,
      },
    });

    return NextResponse.json({ data: milestone }, { status: 201 });
  } catch (error) {
    console.error("创建里程碑失败:", error);
    return NextResponse.json(
      { error: "创建里程碑失败" },
      { status: 500 }
    );
  }
}
