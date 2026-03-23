"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, Clock, CheckCircle2, ArrowRight, TrendingUp, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  createdAt: string;
  _count?: { milestones: number };
}

interface DashboardStats {
  projects: { total: number; active: number; completed: number; paused: number };
  tasks: { total: number; completed: number; inProgress: number; atRisk: number; completionRate: number };
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
      if (projectsData.data) setProjects(projectsData.data);
      if (dashboardData.data) setStats(dashboardData.data.statistics);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已完成": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "进行中": return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">DDHD 项目看板</h1>
                <p className="text-xs text-gray-500">项目管理与协作平台</p>
              </div>
            </div>
            <Link href="/projects/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 mb-1">总项目数</p>
              <div className="text-3xl font-bold">{stats?.projects.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 mb-1">进行中</p>
              <div className="text-3xl font-bold text-blue-600">{stats?.projects.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 mb-1">已完成</p>
              <div className="text-3xl font-bold text-green-600">{stats?.projects.completed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 mb-1">任务完成率</p>
              <div className="text-3xl font-bold text-purple-600">{stats?.tasks.completionRate || 0}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">项目列表</h2>
          <Link href="/projects/new">
            <Button variant="outline"><Plus className="w-4 h-4 mr-2" />新建项目</Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">暂无项目</h3>
              <p className="text-gray-500 mb-6">创建您的第一个项目开始管理</p>
              <Link href="/projects/new">
                <Button size="lg"><Plus className="w-5 h-5 mr-2" />新建项目</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      <span className="text-xs text-gray-400">{project.type}</span>
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description || "暂无描述"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {project._count?.milestones || 0} 个里程碑
                      </span>
                      {project.client && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.client}
                        </span>
                      )}
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
