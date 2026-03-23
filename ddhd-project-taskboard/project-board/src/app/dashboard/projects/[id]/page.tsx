"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Target,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  createdAt: string;
  milestones: Milestone[];
  members: { user: { userName: string; avatar?: string } }[];
}

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignees: { user: { userName: string } }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}`);
      const data = await res.json();
      if (data.data) {
        setProject(data.data);
      }
    } catch (error) {
      toast.error("获取项目详情失败");
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

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "已完成": return <CheckCircle2 size={16} strokeWidth={1.5} className="text-brand-success" />;
      case "进行中": return <Clock size={16} strokeWidth={1.5} className="text-brand-info" />;
      case "有风险": return <AlertCircle size={16} strokeWidth={1.5} className="text-brand-warning" />;
      default: return <div className="w-2 h-2 bg-brand-secondary rounded-full" />;
    }
  };

  const getProjectProgress = () => {
    if (!project?.milestones?.length) return 0;
    const totalTasks = project.milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
    const completedTasks = project.milestones.reduce(
      (acc, m) => acc + (m.tasks?.filter(t => t.status === "已完成").length || 0), 0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-brand-main rounded-xl flex items-center justify-center mx-auto mb-6">
          <FolderOpen size={32} strokeWidth={1.5} className="text-brand-secondary" />
        </div>
        <h3 className="text-xl font-semibold text-brand-primary mb-2">项目不存在</h3>
        <Link href="/dashboard/projects-list" className="text-brand-info hover:underline">
          返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link 
        href="/dashboard/projects-list"
        className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-primary transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        返回项目列表
      </Link>

      {/* 项目头部信息 - Soft Tech Style */}
      <Card className="layout-card overflow-hidden">
        <div className="bg-brand-primary p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <FolderOpen size={32} strokeWidth={1.5} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusStyle(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-white/70 max-w-xl">
                  {project.description || "暂无项目描述"}
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm text-white/70">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} strokeWidth={1.5} />
                    创建于 {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                  {project.client && (
                    <span className="flex items-center gap-2">
                      <Users size={16} strokeWidth={1.5} />
                      客户: {project.client}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{getProjectProgress()}%</div>
              <p className="text-white/60 text-sm">完成进度</p>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-brand-secondary">整体进度</span>
              <span className="font-medium text-brand-primary">{getProjectProgress()}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill-success transition-all duration-500"
                style={{ width: `${getProjectProgress()}%` }}
              />
            </div>
          </div>

          {/* 成员头像 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-brand-secondary">项目成员</span>
              <div className="flex -space-x-2">
                {project.members?.slice(0, 5).map((member, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-brand-main border-2 border-white flex items-center justify-center text-sm font-medium text-brand-primary"
                    title={member.user.userName}
                  >
                    {member.user.userName.slice(0, 1)}
                  </div>
                ))}
                {(project.members?.length || 0) > 5 && (
                  <div className="w-8 h-8 rounded-full bg-brand-border border-2 border-white flex items-center justify-center text-sm text-brand-secondary">
                    +{project.members!.length - 5}
                  </div>
                )}
              </div>
            </div>
            <Button className="rounded-md gap-2 bg-brand-primary hover:opacity-90 h-9 px-3">
              <Plus size={16} strokeWidth={1.5} />
              添加成员
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 里程碑和任务 */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="bg-brand-main p-1 rounded-md">
          <TabsTrigger value="milestones" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-card">
            <Target size={16} strokeWidth={1.5} className="mr-2" />
            里程碑
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-card">
            <Flag size={16} strokeWidth={1.5} className="mr-2" />
            所有任务
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          {project.milestones?.length === 0 ? (
            <Card className="layout-card">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-brand-main rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target size={28} strokeWidth={1.5} className="text-brand-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无里程碑</h3>
                <p className="text-brand-secondary text-sm">添加里程碑来规划项目阶段</p>
              </CardContent>
            </Card>
          ) : (
            project.milestones?.map((milestone) => {
              const completedTasks = milestone.tasks?.filter(t => t.status === "已完成").length || 0;
              const totalTasks = milestone.tasks?.length || 0;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Card key={milestone.id} className="layout-card">
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-main rounded-xl flex items-center justify-center">
                          <Target size={20} strokeWidth={1.5} className="text-brand-secondary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-brand-primary">
                            {milestone.name}
                          </CardTitle>
                          <p className="text-xs text-brand-secondary mt-0.5">
                            {milestone.description || "暂无描述"}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-brand-secondary">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} strokeWidth={1.5} />
                              {milestone.dueDate 
                                ? new Date(milestone.dueDate).toLocaleDateString("zh-CN")
                                : "无截止日期"
                              }
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={14} strokeWidth={1.5} />
                              {completedTasks}/{totalTasks} 任务完成
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getStatusStyle(milestone.status)}`}>
                          {milestone.status}
                        </span>
                        <div className="text-xl font-bold text-brand-primary mt-1">{progress}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="progress-track mb-3">
                      <div 
                        className="progress-fill-info transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    {/* 任务列表 */}
                    {milestone.tasks && milestone.tasks.length > 0 && (
                      <div className="space-y-1.5">
                        {milestone.tasks.slice(0, 3).map((task) => (
                          <div 
                            key={task.id}
                            className="flex items-center justify-between p-2.5 bg-brand-main rounded-md hover:bg-brand-border/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {getTaskStatusIcon(task.status)}
                              <span className="font-medium text-brand-primary text-sm">{task.title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                task.priority === "紧急" ? "bg-brand-warning/10 text-brand-warning" :
                                task.priority === "高" ? "bg-brand-warning/10 text-brand-warning" :
                                "bg-brand-main text-brand-secondary"
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {task.assignees?.map((a, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-xs text-brand-primary"
                                >
                                  {a.user.userName.slice(0, 1)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {milestone.tasks.length > 3 && (
                          <Button variant="ghost" className="w-full text-brand-info hover:text-brand-primary h-8 text-sm">
                            查看全部 {milestone.tasks.length} 个任务
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card className="layout-card">
            <CardContent className="p-0">
              {project.milestones?.flatMap(m => m.tasks || []).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brand-main rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Flag size={28} strokeWidth={1.5} className="text-brand-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-primary mb-1">暂无任务</h3>
                  <p className="text-brand-secondary text-sm">添加任务来跟踪工作进度</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {project.milestones?.flatMap(m => 
                    (m.tasks || []).map(task => ({ ...task, milestoneName: m.name }))
                  ).map((task: Task & { milestoneName: string }) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 hover:bg-brand-main transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTaskStatusIcon(task.status)}
                        <div>
                          <p className="font-medium text-brand-primary text-sm">{task.title}</p>
                          <p className="text-xs text-brand-secondary">{task.milestoneName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          task.priority === "紧急" ? "bg-brand-warning/10 text-brand-warning" :
                          task.priority === "高" ? "bg-brand-warning/10 text-brand-warning" :
                          task.priority === "中" ? "bg-brand-info/10 text-brand-info" :
                          "bg-brand-main text-brand-secondary"
                        }`}>
                          {task.priority}优先级
                        </span>
                        <div className="flex -space-x-2">
                          {task.assignees?.slice(0, 3).map((a, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-brand-main border-2 border-white flex items-center justify-center text-xs text-brand-primary"
                            >
                              {a.user.userName.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
