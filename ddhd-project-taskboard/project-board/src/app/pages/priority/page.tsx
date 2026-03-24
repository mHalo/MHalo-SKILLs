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

interface QuadrantData {
  key: string;
  title: string;
  subtitle: string;
  tasks: Task[];
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
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

  // 四象限数据
  const quadrants: QuadrantData[] = [
    {
      key: "p0",
      title: "重要且紧急",
      subtitle: "立即处理",
      tasks: tasks.filter((t) => t.priority === "P0"),
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-l-red-500",
    },
    {
      key: "p1",
      title: "重要不紧急",
      subtitle: "计划安排",
      tasks: tasks.filter((t) => t.priority === "P1"),
      icon: Flag,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-l-amber-500",
    },
    {
      key: "risk",
      title: "有风险任务",
      subtitle: "需要关注",
      tasks: tasks.filter((t) => t.priority === "P2" && t.status === "有风险"),
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-l-blue-500",
    },
    {
      key: "normal",
      title: "普通任务",
      subtitle: "按计划执行",
      tasks: tasks.filter((t) => t.priority === "P2" && t.status !== "有风险"),
      icon: CheckCircle2,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-l-gray-300",
    },
  ];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-red-100 text-red-700";
      case "P1":
        return "bg-amber-100 text-amber-700";
      case "P2":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "P0":
        return "P0";
      case "P1":
        return "P1";
      case "P2":
        return "P2";
      default:
        return "P3";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成":
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case "进行中":
        return <div className="w-2 h-2 rounded-full bg-blue-500" />;
      case "有风险":
        return <div className="w-2 h-2 rounded-full bg-amber-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  // 紧凑任务卡片
  const TaskCard = ({ task }: { task: Task }) => (
    <Link href={task.milestone ? `/projects/${task.milestone.project.id}` : "#"}>
      <div className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer border-l-2 border-transparent hover:border-primary">
        <div className="flex items-start gap-2">
          <div className="mt-1.5">{getStatusIcon(task.status)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {task.title}
              </p>
              <span
                className={cn(
                  "text-[10px] px-1 py-0 rounded shrink-0",
                  getPriorityStyle(task.priority)
                )}
              >
                {getPriorityLabel(task.priority)}
              </span>
            </div>
            
            {task.milestone && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                {task.milestone.project.name} · {task.milestone.name}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1.5">
              {task.plannedDate && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(task.plannedDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </span>
              )}
              {task.assignees && task.assignees.length > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <User size={10} />
                  {task.assignees[0].user.userName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  // 象限卡片（紧凑版）
  const QuadrantColumn = ({ quadrant }: { quadrant: QuadrantData }) => {
    const Icon = quadrant.icon;
    return (
      <div className="w-72 shrink-0 flex flex-col">
        {/* 头部 */}
        <div className={cn("p-3 rounded-t-lg border-l-4", quadrant.borderColor, quadrant.bgColor)}>
          <div className="flex items-center gap-2">
            <Icon size={16} className={quadrant.iconColor} />
            <div>
              <h3 className="text-sm font-semibold">{quadrant.title}</h3>
              <p className="text-[10px] text-muted-foreground">
                {quadrant.subtitle} · {quadrant.tasks.length}个
              </p>
            </div>
          </div>
        </div>
        
        {/* 任务列表 */}
        <div className="flex-1 bg-card border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto">
          {quadrant.tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 size={20} className="mx-auto mb-1 text-green-500" />
              <p className="text-xs">暂无任务</p>
            </div>
          ) : (
            quadrant.tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-72 h-96 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* 头部 */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">关键任务看板</h1>
        <p className="text-sm text-muted-foreground mt-1">
          按紧急重要程度管理任务优先级 · 共 {tasks.length} 个未完成任务
        </p>
      </div>

      {/* 横向滚动的四象限 */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 h-full">
          {quadrants.map((quadrant) => (
            <QuadrantColumn key={quadrant.key} quadrant={quadrant} />
          ))}
        </div>
      </div>
    </div>
  );
}
