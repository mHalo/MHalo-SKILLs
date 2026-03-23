import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id]/milestones - 获取项目的里程碑列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ data: milestones });
  } catch (error) {
    console.error("获取里程碑列表失败:", error);
    return NextResponse.json(
      { error: "获取里程碑列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/milestones - 创建里程碑
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { name, description, deadline, order } = body;

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        order: order || 0,
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
