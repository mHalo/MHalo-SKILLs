"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Briefcase,
  User,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  accentColor: string;
  bgColor: string;
  borderColor: string;
  lightBg: string;
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

  // 四象限数据配置 - 使用品牌色系
  const quadrants: QuadrantData[] = [
    {
      key: "p0",
      title: "重要且紧急",
      subtitle: "立即处理",
      tasks: tasks.filter((t) => t.priority === "P0"),
      icon: AlertTriangle,
      accentColor: "text-[#FF6231]",
      bgColor: "bg-[#FF6231]/10",
      borderColor: "border-[#FF6231]",
      lightBg: "bg-[#FF6231]/5",
    },
    {
      key: "p1",
      title: "重要不紧急",
      subtitle: "计划安排",
      tasks: tasks.filter((t) => t.priority === "P1"),
      icon: Flag,
      accentColor: "text-[#25B079]",
      bgColor: "bg-[#25B079]/10",
      borderColor: "border-[#25B079]",
      lightBg: "bg-[#25B079]/5",
    },
    {
      key: "risk",
      title: "有风险任务",
      subtitle: "需要关注",
      tasks: tasks.filter((t) => t.priority === "P2" && t.status === "有风险"),
      icon: Clock,
      accentColor: "text-[#637CFF]",
      bgColor: "bg-[#637CFF]/10",
      borderColor: "border-[#637CFF]",
      lightBg: "bg-[#637CFF]/5",
    },
    {
      key: "normal",
      title: "普通任务",
      subtitle: "按计划执行",
      tasks: tasks.filter((t) => t.priority === "P2" && t.status !== "有风险"),
      icon: CheckCircle2,
      accentColor: "text-[#7E8485]",
      bgColor: "bg-[#7E8485]/10",
      borderColor: "border-[#7E8485]",
      lightBg: "bg-[#7E8485]/5",
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P0":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FF6231]/10 text-[#FF6231]">
            P0
          </span>
        );
      case "P1":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#25B079]/10 text-[#25B079]">
            P1
          </span>
        );
      case "P2":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#637CFF]/10 text-[#637CFF]">
            P2
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8EDEC] text-[#7E8485]">
            P3
          </span>
        );
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "进行中":
        return <div className="w-2 h-2 rounded-full bg-[#637CFF]" />;
      case "有风险":
        return <div className="w-2 h-2 rounded-full bg-[#FF6231]" />;
      case "待开始":
        return <div className="w-2 h-2 rounded-full bg-[#7E8485]" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-[#E8EDEC]" />;
    }
  };

  // 紧凑任务卡片
  const TaskCard = ({ task }: { task: Task }) => (
    <Link href={task.milestone ? `/projects/${task.milestone.project.id}` : "#"}>
      <div className="group p-3 rounded-lg bg-white hover:bg-[#F4F7F6] transition-all cursor-pointer border border-[#E8EDEC] hover:border-[#7E8485]/30 shadow-sm hover:shadow-md">
        <div className="flex items-start gap-2.5">
          <div className="mt-1">{getStatusDot(task.status)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#637CFF] transition-colors">
                {task.title}
              </p>
              {getPriorityBadge(task.priority)}
            </div>
            
            {task.milestone && (
              <p className="text-xs text-[#7E8485] mt-1.5 truncate">
                {task.milestone.project.name}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {task.plannedDate && (
                <span className="text-[11px] text-[#7E8485] flex items-center gap-1">
                  <Calendar size={11} className="text-[#7E8485]" />
                  {new Date(task.plannedDate).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                </span>
              )}
              {task.assignees && task.assignees.length > 0 && (
                <span className="text-[11px] text-[#7E8485] flex items-center gap-1">
                  <User size={11} className="text-[#7E8485]" />
                  {task.assignees[0].user.userName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  // 象限列
  const QuadrantColumn = ({ quadrant }: { quadrant: QuadrantData }) => {
    const Icon = quadrant.icon;
    return (
      <div className="w-72 shrink-0 flex flex-col">
        {/* 头部 - 使用卡片样式 */}
        <Card className={cn("mb-3 border-l-4", quadrant.borderColor)}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", quadrant.bgColor)}>
                <Icon size={18} className={quadrant.accentColor} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">{quadrant.title}</h3>
                <p className="text-xs text-[#7E8485]">
                  {quadrant.subtitle} · <span className={cn("font-medium", quadrant.accentColor)}>{quadrant.tasks.length}个</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 任务列表 */}
        <div className="flex-1 space-y-2 min-h-[300px] max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {quadrant.tasks.length === 0 ? (
            <div className="text-center py-8 text-[#7E8485]">
              <div className={cn("w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center", quadrant.lightBg)}>
                <Icon size={18} className={quadrant.accentColor} />
              </div>
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
        <h1 className="text-xl font-semibold text-[#1A1A1A]">关键任务看板</h1>
        <p className="text-sm text-[#7E8485] mt-0.5">
          共 <span className="font-medium text-[#1A1A1A]">{tasks.length}</span> 个未完成任务
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
