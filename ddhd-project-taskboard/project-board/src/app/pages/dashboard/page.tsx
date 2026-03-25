"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FolderOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    paused: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    atRisk: number;
    completionRate: number;
  };
}

interface RecentProject {
  id: string;
  name: string;
  status: string;
  type: string;
  client: string | null;
  taskCount: number;
  completedTaskCount: number;
  milestoneCount: number;
  members?: { user: { userName: string; avatar: string | null } }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/snapshot/dashboard");
      const data = await res.json();
      if (data.data) {
        setStats(data.data.statistics);
        setRecentProjects(data.data.projects?.slice(0, 5) || []);
      }
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 5分钟自动刷新
  useAutoRefresh({
    onRefresh: fetchDashboardData,
    enabled: true,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区域 - Soft Tech Style */}
      <div>
        <h1 className="text-page-title text-brand-primary mb-1">下午好，叮当的小伙伴们~</h1>
        <p className="text-description">这是您今天的项目概览</p>
      </div>

      {/* 统计卡片 - Soft Tech 风格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="layout-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-description mb-1">总项目</p>
              <div className="text-2xl font-bold text-brand-primary">{stats?.projects.total || 0}</div>
            </div>
            <div className="w-9 h-9 bg-brand-main rounded-md flex items-center justify-center">
              <FolderOpen size={18} strokeWidth={1.5} className="text-brand-secondary" />
            </div>
          </div>
        </div>

        <div className="layout-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-description mb-1">进行中</p>
              <div className="text-2xl font-bold text-brand-primary">{stats?.projects.active || 0}</div>
            </div>
            <div className="w-9 h-9 bg-brand-main rounded-md flex items-center justify-center">
              <Clock size={18} strokeWidth={1.5} className="text-brand-info" />
            </div>
          </div>
        </div>

        <div className="layout-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-description mb-1">已完成</p>
              <div className="text-2xl font-bold text-brand-primary">{stats?.projects.completed || 0}</div>
            </div>
            <div className="w-9 h-9 bg-brand-main rounded-md flex items-center justify-center">
              <CheckCircle2 size={18} strokeWidth={1.5} className="text-brand-success" />
            </div>
          </div>
        </div>

        <div className="layout-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-description mb-1">完成率</p>
              <div className="text-2xl font-bold text-brand-primary">{stats?.tasks.completionRate || 0}%</div>
            </div>
            <div className="w-9 h-9 bg-brand-main rounded-md flex items-center justify-center">
              <TrendingUp size={18} strokeWidth={1.5} className="text-brand-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* 风险预警 - Soft Tech Style */}
      {(stats?.tasks.atRisk || 0) > 0 && (
        <div className="layout-card border-brand-warning/20 bg-brand-warning/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-warning/10 rounded-md flex items-center justify-center">
              <AlertCircle size={18} strokeWidth={1.5} className="text-brand-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-brand-primary">
                有 {stats?.tasks.atRisk} 个任务存在风险
              </p>
              <p className="text-sm text-brand-secondary">
                请及时关注并处理风险任务
              </p>
            </div>
            <Link 
              href="/priority" 
              className="px-4 py-2 bg-brand-warning text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              查看详情
            </Link>
          </div>
        </div>
      )}

      {/* 最近项目 - 卡片网格布局 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-module-title text-brand-primary">最近项目</h2>
          <Link 
            href="/projects-list" 
            className="text-sm text-brand-info hover:opacity-80 flex items-center gap-1 font-medium transition-opacity"
          >
            查看全部
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <Card className="layout-card">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-brand-main rounded-lg flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={28} strokeWidth={1.5} className="text-brand-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无项目</h3>
              <p className="text-brand-secondary text-sm">点击左侧&quot;新建项目&quot;开始创建</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentProjects.map((project) => {
              const progress = project.taskCount > 0 
                ? Math.round((project.completedTaskCount / project.taskCount) * 100) 
                : 0;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="layout-card hover:shadow-card transition-all cursor-pointer group h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* 头部：图标和状态 */}
                      <div className="flex items-start justify-between mb-3">
                        {/* 项目名称 - 字号加大 */}
                        <h3 className="font-semibold text-brand-primary transition-colors mb-2 line-clamp-1 text-xl w-4/5">
                          {project.name}
                        </h3>
                        <span className={`
                          px-2 py-0.5 rounded-md text-xs font-medium
                          ${project.status === '进行中' ? 'bg-brand-success/10 text-brand-success' : ''}
                          ${project.status === '已完成' ? 'bg-brand-info/10 text-brand-info' : ''}
                          ${project.status === '暂停' ? 'bg-brand-warning/10 text-brand-warning' : ''}
                        `}>
                          {project.status}
                        </span>
                      </div>
                      
                      {/* 成员头像 - 移动到项目名称下方 */}
                      <div className="flex items-center -space-x-2 mb-2">
                        {project.members && project.members.length > 0 ? (
                          <>
                            {project.members.slice(0, 5).map((member, i) => (
                              <Avatar key={i} className="w-8 h-8 border-2 border-white ring-2 ring-white">
                                {member.user.avatar ? (
                                  <Image
                                    src={member.user.avatar}
                                    alt={member.user.userName}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <AvatarFallback className={cn(
                                    "text-[10px] font-medium",
                                    getAvatarColor(member.user.userName).bg,
                                    getAvatarColor(member.user.userName).text
                                  )}>
                                    {getInitials(member.user.userName)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            ))}
                            {project.members.length > 5 && (
                              <Avatar className="w-10 h-10 border-2 border-white ring-2 ring-white bg-gray-200">
                                <AvatarFallback className="bg-gray-300 text-gray-600 text-[10px] font-medium">
                                  +{project.members.length - 5}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </>
                        ) : (
                          <span className="text-xs w-full h-8 flex items-center text-gray-400">暂无成员</span>
                        )}
                      </div>

                      {/* 进度条 */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-brand-secondary">进度</span>
                          <span className="font-medium text-brand-primary">{progress}%</span>
                        </div>
                        <div className="progress-track mb-4">
                          <div 
                            className="progress-fill-success transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* 底部：客户名称 + 统计信息（人物和里程碑位置互换） */}
                        <div className="flex items-center justify-between ">
                          {/* 客户名称 - 移到底部左侧 */}
                          <p className="text-xs text-brand-secondary">
                            {project.client || "无客户"}
                          </p>
                          
                          {/* 统计信息 - 里程碑在前，任务在后 */}
                          <div className="flex items-center gap-4 text-xs text-brand-secondary">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={14} strokeWidth={1.5} />
                              {project.milestoneCount} 里程碑
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} strokeWidth={1.5} />
                              {project.taskCount} 任务
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
