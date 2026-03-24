"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Briefcase,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isToday,
  parseISO,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@base-ui/react";

type CalendarView = "day" | "week" | "month";

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  duration?: number;
  description?: string;
  project?: {
    id: string;
    name: string;
    client?: string;
  };
  attendees?: string[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  plannedDate?: string;
  actualDate?: string;
  assignees?: { user: { userName: string; avatar?: string } }[];
  milestone?: { name: string; project: { id: string; name: string } };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  // 新建事件表单
  const [newEvent, setNewEvent] = useState({
    title: "",
    projectId: "",
    eventType: "会议",
    eventDate: "",
    description: "",
  });

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // 计算日期范围
      let start, end;
      if (view === "month") {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      } else if (view === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
      } else {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      }

      // 获取日历事件
      const eventsRes = await fetch(
        `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const eventsData = await eventsRes.json();

      // 获取任务（用于在日历上显示）
      const tasksRes = await fetch("/api/tasks?limit=200");
      const tasksData = await tasksRes.json();

      if (eventsData.data) setEvents(eventsData.data);
      if (tasksData.data) {
        // 获取任务详情
        const tasksWithDetails = await Promise.all(
          tasksData.data.map(async (t: Task) => {
            const detailRes = await fetch(`/api/tasks/${t.id}`);
            const detailData = await detailRes.json();
            return { ...t, ...detailData.data };
          })
        );
        setTasks(tasksWithDetails.filter((t: Task) => t.plannedDate));
      }
    } catch {
      toast.error("获取日历数据失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.data) setProjects(data.data);
    } catch {
      console.error("获取项目列表失败");
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.projectId || !newEvent.eventDate) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch(`/api/projects/${newEvent.projectId}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          eventType: newEvent.eventType,
          eventDate: new Date(newEvent.eventDate).toISOString(),
          notes: newEvent.description,
        }),
      });

      if (res.ok) {
        toast.success("日程创建成功");
        setIsCreateDialogOpen(false);
        setNewEvent({
          title: "",
          projectId: "",
          eventType: "会议",
          eventDate: "",
          description: "",
        });
        fetchCalendarData();
      } else {
        toast.error("创建失败");
      }
    } catch {
      toast.error("创建失败");
    }
  };

  // 导航函数
  const goToPrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // 获取日期范围内的所有天
  const calendarDays = useMemo(() => {
    let start, end;
    if (view === "month") {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    } else if (view === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    }
    return eachDayOfInterval({ start, end });
  }, [currentDate, view]);

  // 获取某天的事件和任务
  const getItemsForDay = (day: Date) => {
    const dayEvents = events.filter((e) =>
      isSameDay(parseISO(e.eventDate), day)
    );
    const dayTasks = tasks.filter((t) =>
      t.plannedDate ? isSameDay(parseISO(t.plannedDate), day) : false
    );
    return { events: dayEvents, tasks: dayTasks };
  };

  // 统计信息
  const stats = useMemo(() => {
    return {
      totalEvents: events.length,
      totalTasks: tasks.length,
      meetings: events.filter((e) => e.eventType === "会议").length,
      deadlines: events.filter((e) => e.eventType === "截止日").length,
    };
  }, [events, tasks]);

  // 月视图
  const MonthView = () => (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] border-b border-r p-1.5 transition-colors",
                !isCurrentMonth && "bg-muted/30",
                isTodayDate && "bg-primary/5"
              )}
            >
              {/* 日期数字 */}
              <div className="flex justify-between items-center mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isTodayDate
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {(dayEvents.length > 0 || dayTasks.length > 0) && (
                  <span className="text-[10px] text-muted-foreground">
                    {dayEvents.length + dayTasks.length}
                  </span>
                )}
              </div>

              {/* 事件和任务 */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                      event.eventType === "会议" && "bg-blue-100 text-blue-700",
                      event.eventType === "拜访" && "bg-amber-100 text-amber-700",
                      event.eventType === "截止日" && "bg-red-100 text-red-700",
                      event.eventType === "评审" && "bg-purple-100 text-purple-700"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 flex items-center gap-1",
                      task.status === "已完成"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    <Briefcase size={8} />
                    {task.title}
                  </div>
                ))}
                {dayEvents.length + dayTasks.length > 4 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayEvents.length + dayTasks.length - 4} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 周视图
  const WeekView = () => {
    const weekDays = calendarDays;
    return (
      <div className="bg-card rounded-lg border shadow-sm">
        {/* 星期标题 */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "py-3 text-center border-r last:border-r-0",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, "EEE", { locale: zhCN })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                  isToday(day)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, index) => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day);
            return (
              <div
                key={index}
                className={cn(
                  "border-r last:border-r-0 p-2 space-y-2",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {dayEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-2">
                      <div
                        className={cn(
                          "text-xs font-medium truncate",
                          event.eventType === "会议" && "text-blue-600",
                          event.eventType === "拜访" && "text-amber-600",
                          event.eventType === "截止日" && "text-red-600"
                        )}
                      >
                        {event.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {format(parseISO(event.eventDate), "HH:mm")}
                      </div>
                      {event.project && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Briefcase size={8} />
                          {event.project.name}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {dayTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-shadow",
                      task.status === "已完成" && "bg-green-50"
                    )}
                  >
                    <CardContent className="p-2">
                      <div className="text-xs font-medium truncate">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        任务
                      </div>
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {task.assignees.slice(0, 2).map((a, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px]"
                            >
                              {a.user.userName.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 日视图
  const DayView = () => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDay(currentDate);
    const allItems = [
      ...dayEvents.map((e) => ({ ...e, itemType: "event" as const })),
      ...dayTasks.map((t) => ({ ...t, itemType: "task" as const })),
    ].sort((a, b) => {
      const dateA =
        "eventDate" in a ? parseISO(a.eventDate) : parseISO(a.plannedDate!);
      const dateB =
        "eventDate" in b ? parseISO(b.eventDate) : parseISO(b.plannedDate!);
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <div className="bg-card rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "yyyy年M月d日 EEEE", { locale: zhCN })}
            </h2>
            <p className="text-sm text-muted-foreground">
              共 {allItems.length} 个事项
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>今天没有安排</p>
            </div>
          ) : (
            allItems.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        item.itemType === "event"
                          ? "eventType" in item && item.eventType === "会议"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-amber-100 text-amber-600"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.itemType === "event" ? (
                        <Clock size={18} />
                      ) : (
                        <Briefcase size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{item.title}</h3>
                        {item.itemType === "event" ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                            {(item as CalendarEvent).eventType}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              (item as Task).status === "已完成"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {(item as Task).status}
                          </span>
                        )}
                      </div>
                      {"description" in item && item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {"eventDate" in item
                            ? format(parseISO(item.eventDate), "HH:mm")
                            : format(
                                parseISO((item as Task).plannedDate!),
                                "HH:mm"
                              )}
                        </span>
                        {"project" in item && item.project && (
                          <span className="flex items-center gap-1">
                            <Briefcase size={12} />
                            {item.project.name}
                          </span>
                        )}
                        {"assignees" in item &&
                          (item as Task).assignees &&
                          (item as Task).assignees!.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {(item as Task).assignees![0].user.userName}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* 顶部统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">全部事项</p>
              <p className="text-2xl font-bold">{stats.totalEvents + stats.totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CalendarIcon size={20} className="text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">会议</p>
              <p className="text-2xl font-bold">{stats.meetings}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">截止日</p>
              <p className="text-2xl font-bold">{stats.deadlines}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <CalendarIcon size={20} className="text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">任务</p>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase size={20} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={goToToday}>
            今天
          </Button>
          <Separator orientation="vertical" />
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight size={18} />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {view === "day"
              ? format(currentDate, "yyyy年M月d日 EEEE", { locale: zhCN })
              : format(currentDate, "yyyy年M月", { locale: zhCN })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(["day", "week", "month"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setView(v)}
              >
                {v === "day" ? "日" : v === "week" ? "周" : "月"}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus size={16} className="mr-1" />
            新建日程
          </Button>
        </div>
      </div>

      {/* 日历视图 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {view === "month" && <MonthView />}
        {view === "week" && <WeekView />}
        {view === "day" && <DayView />}
      </div>

      {/* 新建日程弹窗 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建日程</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                placeholder="输入日程标题"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>所属项目</Label>
              <Select
                value={newEvent.projectId || undefined}
                onValueChange={(v) =>
                  setNewEvent({ ...newEvent, projectId: v || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select
                value={newEvent.eventType}
                onValueChange={(v) =>
                  setNewEvent({ ...newEvent, eventType: v || "会议" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="会议">会议</SelectItem>
                  <SelectItem value="拜访">拜访</SelectItem>
                  <SelectItem value="评审">评审</SelectItem>
                  <SelectItem value="截止日">截止日</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>时间</Label>
              <Input
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, eventDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                placeholder="可选"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateEvent}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
