"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  milestones?: {
    id: string;
    status: string;
    tasks?: { status: string; priority: string }[];
  }[];
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.data) {
        const projectsWithDetails = await Promise.all(
          data.data.map(async (p: Project) => {
            const detailRes = await fetch(`/api/projects/${p.id}`);
            const detailData = await detailRes.json();
            return { ...p, ...detailData.data };
          })
        );
        setProjects(projectsWithDetails);
      }
    } catch {
      toast.error("获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "进行中": return "bg-brand-success/10 text-brand-success";
      case "已完成": return "bg-brand-info/10 text-brand-info";
      case "暂停": return "bg-brand-warning/10 text-brand-warning";
      default: return "bg-brand-main text-brand-secondary";
    }
  };

  const getProjectStats = (project: Project) => {
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter(m => m.status === "已完成").length;
    const totalMilestones = milestones.length;
    
    let pendingTasks = 0;
    let atRiskTasks = 0;
    milestones.forEach(m => {
      m.tasks?.forEach(t => {
        if (t.status === "待开始" || t.status === "进行中") pendingTasks++;
        if (t.status === "有风险" || t.status === "已延期") atRiskTasks++;
      });
    });

    const completionRate = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100) 
      : 0;

    return { completionRate, completedMilestones, totalMilestones, pendingTasks, atRiskTasks };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-page-title text-brand-primary">项目列表</h1>
          <p className="text-description mt-1">管理和跟踪您的所有项目</p>
        </div>
      </div>

      {/* 项目卡片网格 */}
      {projects.length === 0 ? (
        <Card className="layout-card">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-brand-main rounded-lg flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={28} strokeWidth={1.5} className="text-brand-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无项目</h3>
            <p className="text-brand-secondary text-sm">点击左侧&quot;新建项目&quot;开始创建您的第一个项目</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            const hasRisk = stats.atRiskTasks > 0;
            
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="layout-card hover:shadow-card transition-all cursor-pointer group h-full flex flex-col">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* 头部：图标和状态 */}
                    <div className="flex items-start justify-between mb-2">
                      {/* 项目名称 */}
                      <h3 className="text-xl w-4/5 font-semibold text-brand-primary line-clamp-2">
                        {project.name}
                      </h3>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(project.status)}`}>
                          {project.status}
                        </span>
                        {hasRisk && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-warning/10 text-brand-warning flex items-center gap-1">
                            <AlertCircle size={10} strokeWidth={1.5} />
                            有风险
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 描述 */}
                    <p className="text-xs text-brand-secondary mb-4 line-clamp-2 flex-1">
                      {project.description || "暂无描述"}
                    </p>

                    {/* 参与人员头像 */}
                    <div className="flex -space-x-1.5 mb-4">
                      {[1, 2, 3].map((_, i) => (
                        <Avatar key={i} className="w-10 h-10 border-2 border-white">
                          <AvatarFallback className="bg-brand-main text-brand-primary text-[10px]">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>

                    {/* 进度条 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-brand-secondary">进度</span>
                        <span className="font-medium text-brand-primary">{stats.completionRate}%</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            hasRisk ? "progress-fill-warning" : "progress-fill-success"
                          }`}
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* 底部统计和客户 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-brand-secondary">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} strokeWidth={1.5} />
                          {stats.completedMilestones}/{stats.totalMilestones} 里
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} />
                          {stats.pendingTasks} 待办
                        </span>
                      </div>
                      {project.client && (
                        <span className="text-xs text-brand-secondary/60 truncate max-w-[80px]">
                          {project.client}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
