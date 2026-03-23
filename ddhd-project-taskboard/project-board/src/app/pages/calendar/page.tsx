"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  project?: { name: string };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar?upcoming=true&limit=30");
      const data = await res.json();
      if (data.data) {
        setEvents(data.data);
      }
    } catch (error) {
      toast.error("获取日历事件失败");
    } finally {
      setLoading(false);
    }
  };

  // 按日期分组事件
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  const formatDate = (dateStr: string) => {
    // 处理只有日期部分的情况 (YYYY-MM-DD)
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(date.getTime())) return dateStr;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "今天";
    if (date.toDateString() === tomorrow.toDateString()) return "明天";

    return new Intl.DateTimeFormat("zh-CN", { 
      month: "long", 
      day: "numeric",
      weekday: "short"
    }).format(date);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "会议": return <div className="w-8 h-8 bg-brand-info/10 rounded-md flex items-center justify-center"><Clock size={16} strokeWidth={1.5} className="text-brand-info" /></div>;
      case "交付": return <div className="w-8 h-8 bg-brand-success/10 rounded-md flex items-center justify-center"><CheckCircle2 size={16} strokeWidth={1.5} className="text-brand-success" /></div>;
      case "截止": return <div className="w-8 h-8 bg-brand-warning/10 rounded-md flex items-center justify-center"><AlertCircle size={16} strokeWidth={1.5} className="text-brand-warning" /></div>;
      default: return <div className="w-8 h-8 bg-brand-main rounded-md flex items-center justify-center"><Calendar size={16} strokeWidth={1.5} className="text-brand-secondary" /></div>;
    }
  };

  const getEventBorderColor = (type: string) => {
    switch (type) {
      case "会议": return "border-l-brand-info";
      case "交付": return "border-l-brand-success";
      case "截止": return "border-l-brand-warning";
      default: return "border-l-brand-secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full max-w-md" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 - Soft Tech Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-brand-primary">日历看板</h1>
          <p className="text-description mt-1">查看所有项目的时间安排和里程碑</p>
        </div>
      </div>

      {/* 月份导航 */}
      <Card className="layout-card">
        <CardContent className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-md hover:bg-brand-main">
            <ChevronLeft size={20} strokeWidth={1.5} className="text-brand-secondary" />
          </Button>
          <span className="text-lg font-semibold text-brand-primary">
            {new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(currentDate)}
          </span>
          <Button variant="ghost" size="icon" className="rounded-md hover:bg-brand-main">
            <ChevronRight size={20} strokeWidth={1.5} className="text-brand-secondary" />
          </Button>
        </CardContent>
      </Card>

      {/* 事件列表 */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <Card className="layout-card">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-brand-main rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} strokeWidth={1.5} className="text-brand-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无事件</h3>
              <p className="text-brand-secondary text-sm">当前没有即将发生的项目事件</p>
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dateObj = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
            const dayNumber = isNaN(dateObj.getTime()) ? '--' : dateObj.getDate();
            
            return (
            <div key={date} className="space-y-3">
              {/* 日期标题 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-main rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-primary">
                    {dayNumber}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-brand-primary">{formatDate(date)}</h3>
              </div>

              {/* 事件卡片 */}
              <div className="grid gap-3 pl-14">
                {groupedEvents[date].map((event) => (
                  <Card 
                    key={event.id} 
                    className={cn(
                      "layout-card border-l-4 hover:shadow-card transition-shadow",
                      getEventBorderColor(event.type)
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {getEventIcon(event.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-brand-primary text-sm">{event.title}</h4>
                            <span className="px-1.5 py-0.5 bg-brand-main text-brand-secondary text-xs rounded">
                              {event.type}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-brand-secondary text-xs mb-1.5">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-brand-secondary">
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} strokeWidth={1.5} />
                                {event.time}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} strokeWidth={1.5} />
                                {event.location}
                              </span>
                            )}
                            {event.project && (
                              <span className="flex items-center gap-1">
                                <User size={12} strokeWidth={1.5} />
                                {event.project.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
