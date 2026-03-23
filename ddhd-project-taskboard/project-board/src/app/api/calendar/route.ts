import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/calendar - 获取所有项目的日历事件（全局日历视图）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const projectId = searchParams.get("projectId");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (start && end) {
      where.eventDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
      },
      orderBy: { eventDate: "asc" },
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("获取全局日历事件失败:", error);
    return NextResponse.json(
      { error: "获取全局日历事件失败" },
      { status: 500 }
    );
  }
}
