"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, AlertCircle, Flag, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  daysUntilDeadline?: number;
  project: { id: string; name: string };
  milestone: { id: string; name: string };
  assignees: { user: { userName: string; avatar?: string } }[];
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
      const res = await fetch("/api/tasks?limit=100");
      const data = await res.json();
      if (data.data) {
        // 获取所有任务详情
        const tasksWithDetails = await Promise.all(
          data.data.map(async (t: Task) => {
            const detailRes = await fetch(`/api/tasks/${t.id}`);
            const detailData = await detailRes.json();
            return { ...t, ...detailData.data };
          })
        );
        setTasks(tasksWithDetails);
      }
    } catch (error) {
      toast.error("获取任务数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 四象限分类
  const urgentImportant = tasks.filter(t => ["紧急", "高"].includes(t.priority) && t.status !== "已完成");
  const importantNotUrgent = tasks.filter(t => t.priority === "中" && t.status !== "已完成");
  const urgentNotImportant = tasks.filter(t => ["紧急", "高"].includes(t.priority) && t.status === "已完成");
  const neither = tasks.filter(t => t.priority === "低" && t.status !== "已完成");

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "紧急": return "bg-brand-warning/10 text-brand-warning";
      case "高": return "bg-brand-warning/10 text-brand-warning";
      case "中": return "bg-brand-info/10 text-brand-info";
      case "低": return "bg-brand-main text-brand-secondary";
      default: return "bg-brand-main text-brand-secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成": return <CheckCircle2 size={16} strokeWidth={1.5} className="text-brand-success" />;
      case "进行中": return <Clock size={16} strokeWidth={1.5} className="text-brand-info" />;
      case "有风险": return <AlertCircle size={16} strokeWidth={1.5} className="text-brand-warning" />;
      case "已延期": return <AlertTriangle size={16} strokeWidth={1.5} className="text-brand-warning" />;
      default: return <div className="w-2 h-2 bg-brand-secondary rounded-full" />;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Link href={`/projects/${task.project.id}/milestones/${task.milestone.id}/tasks/${task.id}`}>
      <Card className="layout-card hover:shadow-card transition-all cursor-pointer group">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-brand-primary group-hover:text-brand-info transition-colors line-clamp-1 text-sm">
                {task.title}
              </h4>
              <p className="text-xs text-brand-secondary mt-0.5">{task.project.name} · {task.milestone.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-1.5 py-0.5 rounded text-xs ${getPriorityStyle(task.priority)}`}>
                  {task.priority}优先级
                </span>
                {task.daysUntilDeadline !== undefined && task.daysUntilDeadline <= 3 && task.status !== "已完成" && (
                  <span className="text-xs text-brand-warning flex items-center gap-1">
                    <Clock size={10} strokeWidth={1.5} />
                    {task.daysUntilDeadline <= 0 ? "已逾期" : `${task.daysUntilDeadline}天后截止`}
                  </span>
                )}
              </div>
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {task.assignees.slice(0, 3).map((a, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 rounded-full bg-brand-main flex items-center justify-center text-xs text-brand-primary border-2 border-white"
                      title={a.user.userName}
                    >
                      {a.user.userName.slice(0, 1)}
                    </div>
                  ))}
                  {task.assignees.length > 3 && (
                    <span className="text-xs text-brand-secondary">+{task.assignees.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <ArrowUpRight size={14} strokeWidth={1.5} className="text-brand-border group-hover:text-brand-info transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 - Soft Tech Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-brand-primary">关键任务看板</h1>
          <p className="text-description mt-1">按紧急重要程度管理任务优先级</p>
        </div>
      </div>

      {/* 四象限视图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 重要且紧急 */}
        <Card className="layout-card border-l-4 border-l-brand-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-brand-warning/10 rounded-md flex items-center justify-center">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-brand-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary text-sm">重要且紧急</h3>
                <p className="text-xs text-brand-secondary">立即处理 · {urgentImportant.length}个任务</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {urgentImportant.length === 0 ? (
                <p className="text-center text-brand-secondary py-6 text-sm">暂无任务</p>
              ) : (
                urgentImportant.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </CardContent>
        </Card>

        {/* 重要不紧急 */}
        <Card className="layout-card border-l-4 border-l-brand-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-brand-success/10 rounded-md flex items-center justify-center">
                <Flag size={18} strokeWidth={1.5} className="text-brand-success" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary text-sm">重要不紧急</h3>
                <p className="text-xs text-brand-secondary">计划安排 · {importantNotUrgent.length}个任务</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {importantNotUrgent.length === 0 ? (
                <p className="text-center text-brand-secondary py-6 text-sm">暂无任务</p>
              ) : (
                importantNotUrgent.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </CardContent>
        </Card>

        {/* 紧急不重要 */}
        <Card className="layout-card border-l-4 border-l-brand-info">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-brand-info/10 rounded-md flex items-center justify-center">
                <Clock size={18} strokeWidth={1.5} className="text-brand-info" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary text-sm">紧急不重要</h3>
                <p className="text-xs text-brand-secondary">尽量委托 · {urgentNotImportant.length}个任务</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {urgentNotImportant.length === 0 ? (
                <p className="text-center text-brand-secondary py-6 text-sm">暂无任务</p>
              ) : (
                urgentNotImportant.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </CardContent>
        </Card>

        {/* 不重要不紧急 */}
        <Card className="layout-card border-l-4 border-l-brand-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-brand-main rounded-md flex items-center justify-center">
                <CheckCircle2 size={18} strokeWidth={1.5} className="text-brand-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary text-sm">不重要不紧急</h3>
                <p className="text-xs text-brand-secondary">有空再做 · {neither.length}个任务</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {neither.length === 0 ? (
                <p className="text-center text-brand-secondary py-6 text-sm">暂无任务</p>
              ) : (
                neither.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
