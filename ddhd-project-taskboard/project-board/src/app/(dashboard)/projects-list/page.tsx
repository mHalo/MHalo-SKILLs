"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Calendar, CheckCircle2, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        // 获取每个项目的详细信息
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "进行中": return "bg-blue-100 text-blue-800";
      case "已完成": return "bg-green-100 text-green-800";
      case "暂停": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "进行中": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProjectStats = (project: Project) => {
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter(m => m.status === "已完成").length;
    const totalMilestones = milestones.length;
    
    // 统计任务
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

    return {
      completionRate,
      completedMilestones,
      totalMilestones,
      pendingTasks,
      atRiskTasks,
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">项目列表</h1>
        <p className="text-gray-500 mt-1">所有项目的详细列表及执行状况</p>
      </div>

      {/* 项目列表 */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无项目</h3>
              <p className="text-gray-500 mb-6">点击左侧"新建项目"开始创建您的第一个项目</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const stats = getProjectStats(project);
            const hasRisk = stats.atRiskTasks > 0;
            
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusIcon(project.status)}
                            <span className="ml-1">{project.status}</span>
                          </Badge>
                          {hasRisk && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              有风险
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {project.description || "暂无描述"}
                        </p>
                        
                        {/* 项目统计 */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              里程碑: {stats.completedMilestones}/{stats.totalMilestones}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              待办任务: {stats.pendingTasks} 个
                            </span>
                          </div>
                          {stats.atRiskTasks > 0 && (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span>风险任务: {stats.atRiskTasks} 个</span>
                            </div>
                          )}
                          {project.client && (
                            <span className="text-gray-500">
                              客户: {project.client}
                            </span>
                          )}
                        </div>

                        {/* 进度条 */}
                        {stats.totalMilestones > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">里程碑进度</span>
                              <span className="font-medium">{stats.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  hasRisk ? "bg-red-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${stats.completionRate}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex items-center">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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
