"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ArrowRight,
  TrendingUp,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  createdAt: string;
  milestones: { id: string }[];
}

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

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, dashboardRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/snapshot/dashboard"),
      ]);

      const projectsData = await projectsRes.json();
      const dashboardData = await dashboardRes.json();

      if (projectsData.data) {
        setProjects(projectsData.data);
      }
      if (dashboardData.data) {
        setStats(dashboardData.data.statistics);
      }
    } catch (error) {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "进行中":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "暂停":
        return <PauseCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "进行中":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "已完成":
        return "bg-green-100 text-green-800 border-green-200";
      case "暂停":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">DDHD 项目看板</h1>
                <p className="text-xs text-gray-500">项目管理与协作平台</p>
              </div>
            </div>
            <Link href="/projects/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总项目数</p>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats?.projects.total || 0}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
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

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
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

          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
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

        {/* 项目列表 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">项目列表</h2>
            <p className="text-sm text-gray-500 mt-1">管理和跟踪您的所有项目</p>
          </div>
          {projects.length > 0 && (
            <Link href="/projects/new">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Button>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无项目</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                创建您的第一个项目，开始管理任务、里程碑和团队协作
              </p>
              <Link href="/projects/new">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Plus className="w-5 h-5 mr-2" />
                  新建项目
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1">{project.status}</span>
                      </Badge>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {project.type}
                      </span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {project.description || "暂无描述"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {project.milestones?.length || 0} 个里程碑
                        </span>
                      </div>
                      {project.client ? (
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Users className="w-4 h-4" />
                          {project.client}
                        </span>
                      ) : (
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-gray-100 text-gray-500">
                            ?
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
