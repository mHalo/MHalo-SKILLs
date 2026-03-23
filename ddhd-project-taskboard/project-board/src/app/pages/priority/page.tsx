"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  ArrowUpRight,
  Briefcase,
  User,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  plannedDate?: string;
  milestone?: { 
    id: string;
    name: string; 
    project: { id: string; name: string } 
  };
  assignees?: { user: { userName: string; avatar?: string } }[];
}

export default function PriorityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?limit=200");
      const data = await res.json();
      if (data.data) {
        const incompleteTasks = data.data.filter(
          (t: Task) => t.status !== "已完成"
        );
        setTasks(incompleteTasks);
      }
    } catch {
      toast.error("获取任务数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 四象限分类
  const urgentImportant = tasks.filter((t) => t.priority === "P0");
  const importantNotUrgent = tasks.filter((t) => t.priority === "P1");
  const urgentNotImportant = tasks.filter((t) => t.priority === "P2" && t.status === "有风险");
  const neither = tasks.filter((t) => t.priority === "P2" && t.status !== "有风险");

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-red-100 text-red-700 border-red-200";
      case "P1":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "P2":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "P0":
        return "紧急";
      case "P1":
        return "高";
      case "P2":
        return "中";
      default:
        return "低";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "进行中":
        return <Clock size={16} className="text-blue-500" />;
      case "有风险":
        return <AlertTriangle size={16} className="text-amber-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Link href={task.milestone ? `/projects/${task.milestone.project.id}` : "#"}>
      <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                  {task.title}
                </h4>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    getPriorityStyle(task.priority)
                  )}
                >
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
              
              {task.milestone && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase size={12} />
                    {task.milestone.project.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag size={12} />
                    {task.milestone.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.plannedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(task.plannedDate).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                  {task.assignees && task.assignees.length > 0 && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {task.assignees[0].user.userName}
                      {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                    </span>
                  )}
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const QuadrantCard = ({
    title,
    subtitle,
    count,
    tasks,
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
  }: {
    title: string;
    subtitle: string;
    count: number;
    tasks: Task[];
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
  }) => (
    <Card className={cn("border-l-4", borderColor)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {subtitle} · {count}个任务
            </p>
          </div>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm">暂无任务</p>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">关键任务看板</h1>
        <p className="text-sm text-muted-foreground mt-1">
          按紧急重要程度管理任务优先级 · 共 {tasks.length} 个未完成任务
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuadrantCard
          title="重要且紧急"
          subtitle="立即处理"
          count={urgentImportant.length}
          tasks={urgentImportant}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-100"
          borderColor="border-l-red-500"
        />
        <QuadrantCard
          title="重要不紧急"
          subtitle="计划安排"
          count={importantNotUrgent.length}
          tasks={importantNotUrgent}
          icon={Flag}
          iconColor="text-amber-600"
          bgColor="bg-amber-100"
          borderColor="border-l-amber-500"
        />
        <QuadrantCard
          title="有风险任务"
          subtitle="需要关注"
          count={urgentNotImportant.length}
          tasks={urgentNotImportant}
          icon={Clock}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
          borderColor="border-l-blue-500"
        />
        <QuadrantCard
          title="普通任务"
          subtitle="按计划执行"
          count={neither.length}
          tasks={neither}
          icon={CheckCircle2}
          iconColor="text-gray-600"
          bgColor="bg-gray-100"
          borderColor="border-l-gray-300"
        />
      </div>
    </div>
  );
}
