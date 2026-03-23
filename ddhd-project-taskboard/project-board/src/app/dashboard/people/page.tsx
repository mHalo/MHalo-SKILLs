"use client";

import { useEffect, useState } from "react";
import { Users, Briefcase, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface User {
  userId: string;
  userName: string;
  avatar?: string;
  role: string;
  _count?: {
    assignees: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: { name: string };
  milestone: { name: string };
}

interface UserDetail extends User {
  assignees: {
    task: Task;
    role: string;
  }[];
}

export default function PeoplePage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.data) {
        const usersWithDetails = await Promise.all(
          data.data.map(async (u: User) => {
            const detailRes = await fetch(`/api/users/${u.userId}`);
            const detailData = await detailRes.json();
            return { ...u, ...detailData.data };
          })
        );
        setUsers(usersWithDetails);
      }
    } catch (error) {
      toast.error("获取人员数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = (user: UserDetail) => {
    const assignees = user.assignees || [];
    const pending = assignees.filter(a => a.task.status === "待开始").length;
    const inProgress = assignees.filter(a => a.task.status === "进行中").length;
    const completed = assignees.filter(a => a.task.status === "已完成").length;
    const highPriority = assignees.filter(a => ["高", "紧急"].includes(a.task.priority)).length;

    return { pending, inProgress, completed, highPriority, total: assignees.length };
  };

  const getRoleStyle = (role: string) => {
    if (role.includes("指挥")) return "bg-brand-primary/10 text-brand-primary";
    if (role.includes("技术")) return "bg-brand-info/10 text-brand-info";
    if (role.includes("创作") || role.includes("策划")) return "bg-brand-success/10 text-brand-success";
    if (role.includes("运营")) return "bg-brand-warning/10 text-brand-warning";
    return "bg-brand-main text-brand-secondary";
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
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
          <h1 className="text-page-title text-brand-primary">人员看板</h1>
          <p className="text-description mt-1">查看团队成员的任务分配情况</p>
        </div>
      </div>

      {/* 人员卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user) => {
          const stats = getTaskStats(user);
          
          return (
            <Card key={user.userId} className="layout-card hover:shadow-card transition-all">
              <CardContent className="p-4">
                {/* 头像和基本信息 */}
                <div className="flex items-start gap-3 mb-3">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.userName}
                      className="w-12 h-12 rounded-lg object-cover bg-brand-main"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(user.userName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-brand-primary">{user.userName}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getRoleStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-brand-primary">{stats.total}</span>
                    <p className="text-xs text-brand-secondary">任务总数</p>
                  </div>
                </div>

                {/* 任务统计 - Soft Tech Style */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-1.5 bg-brand-main rounded">
                    <Clock size={14} strokeWidth={1.5} className="text-brand-secondary mx-auto mb-0.5" />
                    <span className="text-sm font-semibold text-brand-primary">{stats.pending}</span>
                    <p className="text-xs text-brand-secondary">待开始</p>
                  </div>
                  <div className="text-center p-1.5 bg-brand-info/10 rounded">
                    <Briefcase size={14} strokeWidth={1.5} className="text-brand-info mx-auto mb-0.5" />
                    <span className="text-sm font-semibold text-brand-info">{stats.inProgress}</span>
                    <p className="text-xs text-brand-secondary">进行中</p>
                  </div>
                  <div className="text-center p-1.5 bg-brand-success/10 rounded">
                    <CheckCircle2 size={14} strokeWidth={1.5} className="text-brand-success mx-auto mb-0.5" />
                    <span className="text-sm font-semibold text-brand-success">{stats.completed}</span>
                    <p className="text-xs text-brand-secondary">已完成</p>
                  </div>
                  <div className="text-center p-1.5 bg-brand-warning/10 rounded">
                    <AlertCircle size={14} strokeWidth={1.5} className="text-brand-warning mx-auto mb-0.5" />
                    <span className="text-sm font-semibold text-brand-warning">{stats.highPriority}</span>
                    <p className="text-xs text-brand-secondary">高优先级</p>
                  </div>
                </div>

                {/* 最近任务预览 */}
                {user.assignees && user.assignees.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-brand-secondary uppercase tracking-wide">最近任务</p>
                    {user.assignees.slice(0, 2).map(({ task }) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          task.status === "已完成" ? "bg-brand-success" :
                          task.status === "进行中" ? "bg-brand-info" : "bg-brand-secondary"
                        }`} />
                        <span className="text-brand-secondary truncate flex-1">{task.title}</span>
                        <span className="text-brand-secondary/60">{task.project.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
