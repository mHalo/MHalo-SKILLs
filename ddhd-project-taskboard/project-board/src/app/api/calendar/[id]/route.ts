import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/calendar/[id] - 获取单个日历事件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "日历事件不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error("获取日历事件失败:", error);
    return NextResponse.json(
      { error: "获取日历事件失败" },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/[id] - 更新日历事件
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, eventType, eventDate, duration, attendees, reminder, notes } = body;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title,
        eventType,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        duration,
        attendees,
        reminder,
        notes,
      },
    });

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error("更新日历事件失败:", error);
    return NextResponse.json(
      { error: "更新日历事件失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[id] - 删除日历事件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除日历事件失败:", error);
    return NextResponse.json(
      { error: "删除日历事件失败" },
      { status: 500 }
    );
  }
}
