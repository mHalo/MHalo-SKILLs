import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/projects - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const includeArchived = searchParams.get("includeArchived");
    const showArchivedOnly = searchParams.get("showArchivedOnly") === "true";

    const where: Prisma.ProjectWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (showArchivedOnly) {
      where.archived = true;
    } else if (includeArchived !== "true") {
      where.archived = false;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            milestones: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                userName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("获取项目列表失败:", error);
    return NextResponse.json(
      { error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/projects - 创建项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, client, startDate, endDate } = body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        type: type || "创意营销",
        client,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("创建项目失败:", error);
    return NextResponse.json(
      { error: "创建项目失败" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects - 归档/取消归档项目
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, archived } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少项目ID" }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { archived },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("更新项目失败:", error);
    return NextResponse.json({ error: "更新项目失败" }, { status: 500 });
  }
}
