"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  duration: number | null;
  project: {
    id: string;
    name: string;
  };
}

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取本周的日期范围
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 周一开始
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchEvents();
  }, [currentWeek]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = format(weekStart, "yyyy-MM-dd");
      const end = format(weekEnd, "yyyy-MM-dd");
      const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
      const data = await res.json();
      if (data.data) {
        setEvents(data.data);
      }
    } catch (error) {
      toast.error("获取日历数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return isSameDay(eventDate, date);
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "会议": return "bg-blue-100 text-blue-800 border-blue-200";
      case "拜访": return "bg-green-100 text-green-800 border-green-200";
      case "截止日": return "bg-red-100 text-red-800 border-red-200";
      case "评审": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日历看板</h1>
          <p className="text-gray-500 mt-1">本周项目任务时间轴及节点安排</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            本周
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 周标题 */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} - {format(weekEnd, "MM月dd日", { locale: zhCN })}
        </h2>
      </div>

      {/* 周日历 */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={index} className="min-h-[200px]">
              {/* 日期头部 */}
              <div className={`text-center p-3 rounded-t-lg ${
                isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}>
                <div className="text-sm font-medium">
                  {format(day, "EEE", { locale: zhCN })}
                </div>
                <div className={`text-2xl font-bold ${isToday ? "text-white" : "text-gray-900"}`}>
                  {format(day, "d")}
                </div>
              </div>
              
              {/* 事件列表 */}
              <div className="border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[150px] bg-white">
                {dayEvents.length === 0 ? (
                  <div className="text-center text-gray-300 text-xs py-8">
                    无安排
                  </div>
                ) : (
                  dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-2 rounded border text-xs hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType}
                        </Badge>
                      </div>
                      <div className="font-medium text-gray-900 truncate">
                        {event.title}
                      </div>
                      <div className="text-gray-500 mt-1">
                        {format(new Date(event.eventDate), "HH:mm")}
                        {event.duration && ` (${event.duration}分钟)`}
                      </div>
                      <div className="text-blue-600 mt-1 truncate">
                        {event.project?.name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>图例:</span>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">会议</Badge>
          <Badge className="bg-green-100 text-green-800">拜访</Badge>
          <Badge className="bg-red-100 text-red-800">截止日</Badge>
          <Badge className="bg-purple-100 text-purple-800">评审</Badge>
        </div>
      </div>
    </div>
  );
}
