"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
    } catch (error) {
      toast.error("获取数据失败");
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 mt-1">项目看板整体分配及执行状况概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">总项目数</p>
                <div className="text-3xl font-bold">{stats?.projects.total || 0}</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">进行中</p>
                <div className="text-3xl font-bold text-indigo-600">
                  {stats?.projects.active || 0}
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">已完成</p>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.projects.completed || 0}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">任务完成率</p>
                <div className="text-3xl font-bold text-purple-600">
                  {stats?.tasks.completionRate || 0}%
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 风险预警 */}
      {(stats?.tasks.atRisk || 0) > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                有风险任务: {stats?.tasks.atRisk} 个
              </p>
              <p className="text-sm text-red-700">
                请及时关注并处理风险任务
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近项目 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>最近项目</CardTitle>
            <p className="text-sm text-gray-500 mt-1">最近更新的项目列表</p>
          </div>
          <Link 
            href="/projects" 
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无项目，点击左侧"新建项目"开始创建
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">
                          {project.client || "无客户"} · {project.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {project.milestoneCount} 里程碑
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.taskCount} 任务
                        </span>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
