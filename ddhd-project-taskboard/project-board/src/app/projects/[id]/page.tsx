"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  PauseCircle,
  MoreHorizontal,
  Plus,
  MessageSquare,
  Layout,
  ListTodo,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  status: string;
  order: number;
  _count: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeRole: string | null;
  assigneeName: string | null;
  plannedDate: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
}

interface Communication {
  id: string;
  type: string;
  date: string;
  summary: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // 获取项目详情
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.data) {
        setProject(projectData.data);
        setMilestones(projectData.data.milestones || []);
        setEvents(projectData.data.calendarEvents || []);
        setCommunications(projectData.data.communications || []);
      }

      // 获取所有任务
      const tasksPromises = projectData.data?.milestones?.map((m: Milestone) =>
        fetch(`/api/milestones/${m.id}/tasks`).then((r) => r.json())
      ) || [];
      const tasksResults = await Promise.all(tasksPromises);
      const allTasks = tasksResults.flatMap((r) => r.data || []);
      setTasks(allTasks);
    } catch (error) {
      console.error("获取项目数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "进行中":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "有风险":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "暂停":
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已完成":
        return "bg-green-100 text-green-800";
      case "进行中":
        return "bg-blue-100 text-blue-800";
      case "有风险":
        return "bg-red-100 text-red-800";
      case "暂停":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-red-100 text-red-800";
      case "P1":
        return "bg-orange-100 text-orange-800";
      case "P2":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">项目不存在或已被删除</p>
            <Link href="/">
              <Button className="mt-4">返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "已完成").length,
    inProgress: tasks.filter((t) => t.status === "进行中").length,
    pending: tasks.filter((t) => t.status === "待开始").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  返回
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500">{project.client || "无客户"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                新建任务
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
              <div className="text-sm text-gray-500">总任务</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-gray-500">进行中</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-gray-500">已完成</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-400">{taskStats.pending}</div>
              <div className="text-sm text-gray-500">待开始</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="milestones" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="milestones">
              <ListTodo className="w-4 h-4 mr-2" />
              里程碑
            </TabsTrigger>
            <TabsTrigger value="board">
              <Layout className="w-4 h-4 mr-2" />
              看板
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="w-4 h-4 mr-2" />
              日历
            </TabsTrigger>
            <TabsTrigger value="communications">
              <MessageSquare className="w-4 h-4 mr-2" />
              沟通记录
            </TabsTrigger>
          </TabsList>

          {/* 里程碑视图 */}
          <TabsContent value="milestones" className="space-y-4">
            {milestones.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500">暂无里程碑</p>
                  <Button className="mt-4">添加里程碑</Button>
                </CardContent>
              </Card>
            ) : (
              milestones.map((milestone, index) => (
                <Card key={milestone.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50/50 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{milestone.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {milestone.deadline
                              ? format(new Date(milestone.deadline), "yyyy年MM月dd日", {
                                  locale: zhCN,
                                })
                              : "无截止日期"}
                            · {milestone._count.tasks} 个任务
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(milestone.status)}>
                        {milestone.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.id === milestone.id)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(task.status)}
                              <div>
                                <p className="font-medium text-sm">{task.title}</p>
                                <p className="text-xs text-gray-500">
                                  {task.assigneeName || task.assigneeRole || "未分配"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.plannedDate && (
                                <span className="text-xs text-gray-500">
                                  {format(new Date(task.plannedDate), "MM/dd")}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        <Plus className="w-4 h-4 mr-1" />
                        添加任务
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 看板视图 */}
          <TabsContent value="board">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {["待开始", "进行中", "已完成", "有风险"].map((status) => (
                <div key={status} className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">{status}</h3>
                    <Badge variant="secondary">
                      {tasks.filter((t) => t.status === status).length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {tasks
                      .filter((t) => t.status === status)
                      .map((task) => (
                        <Card
                          key={task.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm mb-2">{task.title}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                    {task.assigneeName?.charAt(0) ||
                                      task.assigneeRole?.charAt(0) ||
                                      "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 日历视图 */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>即将发生的事件</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无日历事件</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="w-14 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {format(new Date(event.eventDate), "MM月")}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {format(new Date(event.eventDate), "dd")}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(event.eventDate), "HH:mm")} · {event.eventType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 沟通记录 */}
          <TabsContent value="communications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>沟通记录</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  添加记录
                </Button>
              </CardHeader>
              <CardContent>
                {communications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无沟通记录</p>
                ) : (
                  <div className="space-y-4">
                    {communications.map((comm) => (
                      <div
                        key={comm.id}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {comm.type.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{comm.type}</span>
                            <span className="text-sm text-gray-500">
                              {format(new Date(comm.date), "yyyy年MM月dd日 HH:mm", {
                                locale: zhCN,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comm.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
