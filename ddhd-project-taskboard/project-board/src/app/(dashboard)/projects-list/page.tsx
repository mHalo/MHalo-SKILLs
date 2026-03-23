"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Calendar, CheckCircle2, Clock, ArrowRight, AlertCircle, MoreHorizontal, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    } catch (error) {
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
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 - Soft Tech Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-brand-primary">项目列表</h1>
          <p className="text-description mt-1">管理和跟踪您的所有项目</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" />
          <Input 
            placeholder="搜索项目..." 
            className="pl-10 h-11 rounded-md border-brand-border bg-white"
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-md border-brand-border gap-2 text-brand-secondary hover:text-brand-primary">
          <Filter size={18} strokeWidth={1.5} />
          筛选
        </Button>
      </div>

      {/* 项目列表 */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card className="layout-card">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-brand-main rounded-xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={28} strokeWidth={1.5} className="text-brand-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无项目</h3>
              <p className="text-brand-secondary text-sm">点击左侧"新建项目"开始创建您的第一个项目</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const stats = getProjectStats(project);
            const hasRisk = stats.atRiskTasks > 0;
            
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="layout-card hover:shadow-card transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 项目图标 */}
                      <div className="w-12 h-12 bg-brand-main rounded-xl flex items-center justify-center shrink-0">
                        <FolderOpen size={24} strokeWidth={1.5} className="text-brand-secondary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 标题和标签 */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base font-semibold text-brand-primary group-hover:text-brand-info transition-colors">
                            {project.name}
                          </h3>
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
                        
                        <p className="text-brand-secondary text-xs mb-3 line-clamp-1">
                          {project.description || "暂无描述"}
                        </p>
                        
                        {/* 统计信息 */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-brand-secondary">
                            <div className="w-6 h-6 bg-brand-main rounded-md flex items-center justify-center">
                              <Calendar size={14} strokeWidth={1.5} className="text-brand-secondary" />
                            </div>
                            <span>里程碑 {stats.completedMilestones}/{stats.totalMilestones}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-secondary">
                            <div className="w-6 h-6 bg-brand-main rounded-md flex items-center justify-center">
                              <Clock size={14} strokeWidth={1.5} className="text-brand-secondary" />
                            </div>
                            <span>待办 {stats.pendingTasks} 个</span>
                          </div>
                          {project.client && (
                            <span className="text-brand-secondary/60">客户: {project.client}</span>
                          )}
                        </div>

                        {/* 进度条 - Soft Tech Style */}
                        {stats.totalMilestones > 0 && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="progress-track">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  hasRisk ? "progress-fill-warning" : "progress-fill-success"
                                }`}
                                style={{ width: `${stats.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-brand-secondary w-10 text-right">
                              {stats.completionRate}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 箭头 */}
                      <div className="flex items-center self-center">
                        <div className="w-8 h-8 bg-brand-main rounded-md flex items-center justify-center group-hover:bg-brand-border transition-colors">
                          <ArrowRight size={16} strokeWidth={1.5} className="text-brand-secondary group-hover:text-brand-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
