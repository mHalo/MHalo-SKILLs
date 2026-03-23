import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/milestones/[id] - 获取里程碑详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        tasks: {
          orderBy: { createdAt: "asc" },
          include: {
            _count: {
              select: { subTasks: true },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "里程碑不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: milestone });
  } catch (error) {
    console.error("获取里程碑详情失败:", error);
    return NextResponse.json(
      { error: "获取里程碑详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/milestones/[id] - 更新里程碑
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, deadline, status, order } = body;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status,
        order,
      },
    });

    return NextResponse.json({ data: milestone });
  } catch (error) {
    console.error("更新里程碑失败:", error);
    return NextResponse.json(
      { error: "更新里程碑失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/milestones/[id] - 删除里程碑
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.milestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除里程碑失败:", error);
    return NextResponse.json(
      { error: "删除里程碑失败" },
      { status: 500 }
    );
  }
}
