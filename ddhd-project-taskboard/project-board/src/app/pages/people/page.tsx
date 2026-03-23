"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Flag,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  plannedDate?: string;
  milestone: { name: string; project: { id: string; name: string } };
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
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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
    } catch {
      toast.error("获取人员数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = (user: UserDetail) => {
    const assignees = user.assignees || [];
    const pending = assignees.filter(
      (a) => a.task.status === "待开始" || a.task.status === "进行中"
    ).length;
    const completed = assignees.filter(
      (a) => a.task.status === "已完成"
    ).length;
    const highPriority = assignees.filter((a) =>
      ["P0", "P1"].includes(a.task.priority)
    ).length;

    // 获取未完成的任务（用于显示近3条）
    const incompleteTasks = assignees
      .filter((a) => a.task.status !== "已完成")
      .sort((a, b) => {
        // 按优先级排序 P0 > P1 > P2
        const priorityOrder: Record<string, number> = {
          P0: 0,
          P1: 1,
          P2: 2,
        };
        return (
          priorityOrder[a.task.priority] - priorityOrder[b.task.priority]
        );
      });

    return {
      pending,
      completed,
      highPriority,
      total: assignees.length,
      incompleteTasks,
    };
  };

  const getRoleStyle = (role: string) => {
    if (role.includes("指挥"))
      return "bg-primary/10 text-primary border-primary/20";
    if (role.includes("技术"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (role.includes("创作") || role.includes("策划"))
      return "bg-green-100 text-green-700 border-green-200";
    if (role.includes("运营"))
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-muted text-muted-foreground border-border";
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P0":
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
            紧急
          </span>
        );
      case "P1":
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
            高
          </span>
        );
      case "P2":
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
            中
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            低
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成":
        return <CheckCircle2 size={14} className="text-green-500" />;
      case "进行中":
        return <Clock size={14} className="text-blue-500" />;
      case "有风险":
        return <AlertCircle size={14} className="text-amber-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">人员看板</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看团队成员的任务分配情况
          </p>
        </div>
      </div>

      {/* 人员卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user) => {
          const stats = getTaskStats(user);
          const isExpanded = expandedUser === user.userId;

          return (
            <Card key={user.userId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* 头像和基本信息 */}
                <div className="flex items-start gap-4 mb-4">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.userName}
                      className="w-14 h-14 rounded-xl object-cover bg-muted"
                      width={56}
                      height={56}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-semibold text-lg">
                      {getInitials(user.userName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{user.userName}</h3>
                    <span
                      className={cn(
                        "inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mt-1 border",
                        getRoleStyle(user.role)
                      )}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold">{stats.total}</span>
                    <p className="text-xs text-muted-foreground">任务总数</p>
                  </div>
                </div>

                {/* 任务统计 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                    <Clock
                      size={16}
                      className="text-blue-500 mx-auto mb-1"
                    />
                    <span className="text-lg font-semibold">
                      {stats.pending}
                    </span>
                    <p className="text-xs text-muted-foreground">进行中</p>
                  </div>
                  <div className="text-center p-2.5 bg-green-50 rounded-lg">
                    <CheckCircle2
                      size={16}
                      className="text-green-500 mx-auto mb-1"
                    />
                    <span className="text-lg font-semibold">
                      {stats.completed}
                    </span>
                    <p className="text-xs text-muted-foreground">已完成</p>
                  </div>
                  <div className="text-center p-2.5 bg-amber-50 rounded-lg">
                    <Flag
                      size={16}
                      className="text-amber-500 mx-auto mb-1"
                    />
                    <span className="text-lg font-semibold">
                      {stats.highPriority}
                    </span>
                    <p className="text-xs text-muted-foreground">高优先级</p>
                  </div>
                </div>

                {/* 近3条待推进任务 */}
                {stats.incompleteTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        待推进任务（近{Math.min(stats.incompleteTasks.length, 3)}条）
                      </p>
                      {stats.incompleteTasks.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            setExpandedUser(isExpanded ? null : user.userId)
                          }
                        >
                          {isExpanded ? "收起" : "查看全部"}
                          <ChevronRight
                            size={12}
                            className={cn(
                              "ml-1 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(isExpanded
                        ? stats.incompleteTasks
                        : stats.incompleteTasks.slice(0, 3)
                      ).map(({ task }) => (
                        <Link
                          key={task.id}
                          href={`/projects/${task.milestone.project.id}`}
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                            {getStatusIcon(task.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {task.title}
                                </span>
                                {getPriorityBadge(task.priority)}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Briefcase size={10} />
                                  {task.milestone.project.name}
                                </span>
                                {task.plannedDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(
                                      task.plannedDate
                                    ).toLocaleDateString("zh-CN")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              size={14}
                              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {stats.incompleteTasks.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm bg-muted/30 rounded-lg">
                    <CheckCircle2
                      size={24}
                      className="mx-auto mb-2 text-green-500"
                    />
                    暂无待推进任务
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
