"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Target,
  Flag,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}`);
      const data = await res.json();
      if (data.data) {
        setProject(data.data);
      }
    } catch {
      toast.error("获取项目详情失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "进行中": "default",
      "已完成": "secondary",
      "暂停": "destructive",
      "待开始": "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status}
      </Badge>
    );
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "已完成": return <CheckCircle2 size={14} className="text-green-500" />;
      case "进行中": return <Clock size={14} className="text-blue-500" />;
      case "有风险": return <AlertCircle size={14} className="text-amber-500" />;
      default: return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      "P0": "bg-red-100 text-red-700",
      "P1": "bg-amber-100 text-amber-700",
      "P2": "bg-blue-100 text-blue-700",
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[priority] || "bg-gray-100 text-gray-600"}`}>
        {priority}
      </span>
    );
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen size={28} strokeWidth={1.5} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">项目不存在</h3>
        <Link href="/projects-list" className="text-primary hover:underline text-sm">
          返回项目列表
        </Link>
      </div>
    );
  }

  const progress = getProjectProgress();

  return (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <Link 
        href="/projects-list"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        返回列表
      </Link>

      {/* 项目头部信息 */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-semibold truncate">{project.name}</h1>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description || "暂无项目描述"}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                </span>
                {project.client && (
                  <span>客户: {project.client}</span>
                )}
              </div>
            </div>
            
            {/* 进度环形指示器 */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray={`${progress * 1.76} 176`}
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {progress}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">完成度</span>
            </div>
          </div>

          {/* 成员和进度条 */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">成员</span>
                <div className="flex -space-x-1.5">
                  {project.members?.slice(0, 4).map((member, i) => (
                    <Avatar key={i} className="w-7 h-7 border-2 border-background">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {member.user.userName.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {(project.members?.length || 0) > 4 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
                      +{project.members!.length - 4}
                    </div>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                <Plus size={14} className="mr-1" />
                添加
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 里程碑和任务 */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-9">
          <TabsTrigger value="milestones" className="text-xs">
            <Target size={14} className="mr-1.5" />
            里程碑
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">
            <Flag size={14} className="mr-1.5" />
            任务
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="mt-3 space-y-3">
          {project.milestones?.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Target size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">暂无里程碑</p>
              </CardContent>
            </Card>
          ) : (
            project.milestones?.map((milestone) => {
              const completedTasks = milestone.tasks?.filter(t => t.status === "已完成").length || 0;
              const totalTasks = milestone.tasks?.length || 0;
              const mProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Card key={milestone.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* 里程碑头部 */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{milestone.name}</h3>
                            {getStatusBadge(milestone.status)}
                          </div>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {milestone.dueDate 
                                ? new Date(milestone.dueDate).toLocaleDateString("zh-CN", {month: "short", day: "numeric"})
                                : "无截止"
                              }
                            </span>
                            <span>{completedTasks}/{totalTasks} 任务</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold">{mProgress}%</span>
                        </div>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${mProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* 任务列表 */}
                    {milestone.tasks && milestone.tasks.length > 0 && (
                      <div className="border-t border-border/50">
                        {milestone.tasks.slice(0, 3).map((task) => (
                          <div 
                            key={task.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                          >
                            {getTaskStatusIcon(task.status)}
                            <span className="flex-1 text-sm truncate">{task.title}</span>
                            {getPriorityBadge(task.priority)}
                            <div className="flex -space-x-1">
                              {task.assignees?.slice(0, 2).map((a, i) => (
                                <Avatar key={i} className="w-5 h-5 border border-background">
                                  <AvatarFallback className="text-[8px] bg-muted">
                                    {a.user.userName.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </div>
                        ))}
                        {milestone.tasks.length > 3 && (
                          <button className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1">
                            查看全部 {milestone.tasks.length} 个任务
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {project.milestones?.flatMap(m => m.tasks || []).length === 0 ? (
                <div className="py-10 text-center">
                  <Flag size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">暂无任务</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {project.milestones?.flatMap(m => 
                    (m.tasks || []).map(task => ({ ...task, milestoneName: m.name }))
                  ).map((task: Task & { milestoneName: string }) => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {getTaskStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.milestoneName}</p>
                      </div>
                      {getPriorityBadge(task.priority)}
                      <div className="flex -space-x-1">
                        {task.assignees?.slice(0, 2).map((a, i) => (
                          <Avatar key={i} className="w-6 h-6 border border-background">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {a.user.userName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
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
