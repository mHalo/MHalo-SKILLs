import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/[id]/calendar - 获取项目日历事件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: any = { projectId };
    if (start && end) {
      where.eventDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { eventDate: "asc" },
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("获取日历事件失败:", error);
    return NextResponse.json(
      { error: "获取日历事件失败" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/calendar - 创建日历事件
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, eventType, eventDate, duration, attendees, reminder, notes } = body;

    const event = await prisma.calendarEvent.create({
      data: {
        projectId,
        title,
        eventType,
        eventDate: new Date(eventDate),
        duration,
        attendees,
        reminder,
        notes,
      },
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    console.error("创建日历事件失败:", error);
    return NextResponse.json(
      { error: "创建日历事件失败" },
      { status: 500 }
    );
  }
}
