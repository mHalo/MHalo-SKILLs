"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderOpen, Clock, AlertCircle, CheckCircle2, Archive, ArchiveRestore, Pencil } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  archived: boolean;
  milestones?: {
    id: string;
    status: string;
    tasks?: { status: string; priority: string }[];
  }[];
  members?: {
    user: {
      userName: string;
      avatar: string | null;
    };
  }[];
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "archived">("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    client: "",
    type: "",
  });
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archivingProject, setArchivingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let url = "/api/projects?includeDetails=true";
      if (activeTab === "archived") {
        url += "&showArchivedOnly=true";
      } else if (activeTab === "all") {
        url += "&status=进行中";
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setProjects(data.data);
      }
    } catch {
      toast.error("获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 5分钟自动刷新
  useAutoRefresh({
    onRefresh: fetchProjects,
    enabled: true,
  });

  const handleArchive = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArchivingProject(project);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!archivingProject) return;
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: archivingProject.id, archived: !archivingProject.archived }),
      });
      if (res.ok) {
        toast.success(archivingProject.archived ? "已取消归档" : "已归档");
        setArchiveDialogOpen(false);
        setArchivingProject(null);
        fetchProjects();
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const handleEdit = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      client: project.client || "",
      type: project.type,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProject.id,
          name: editForm.name,
          description: editForm.description,
          client: editForm.client,
          type: editForm.type,
        }),
      });
      if (res.ok) {
        toast.success("项目已更新");
        setEditDialogOpen(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        toast.error("更新失败");
      }
    } catch {
      toast.error("更新失败");
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

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-brand-primary"
              : "text-brand-secondary hover:text-brand-primary"
          }`}
        >
          进行中的项目
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "archived"
              ? "text-brand-primary"
              : "text-brand-secondary hover:text-brand-primary"
          }`}
        >
          归档项目
          {activeTab === "archived" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>
      </div>

      {/* 项目卡片网格 */}
      {projects.length === 0 ? (
        <Card className="layout-card">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-brand-main rounded-lg flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={28} strokeWidth={1.5} className="text-brand-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-brand-primary mb-1">
              {activeTab === "archived" ? "暂无归档项目" : "暂无项目"}
            </h3>
            <p className="text-brand-secondary text-sm">
              {activeTab === "archived"
                ? "归档的项目将在此显示"
                : "点击左侧&quot;新建项目&quot;开始创建您的第一个项目"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            const hasRisk = stats.atRiskTasks > 0;
            
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-0 layout-card hover:shadow-card transition-all cursor-pointer group h-full flex flex-col gap-1">
                  <CardContent className="pt-4 flex flex-col h-full">
                    {/* 头部：图标和状态 */}
                    <div className="flex items-start justify-between mb-2">
                      {/* 项目名称 */}
                      <h3 className="text-xl w-4/5 font-semibold text-brand-primary line-clamp-1">
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
                    <p className="text-xs text-brand-secondary mb-2 line-clamp-2 flex-1 max-h-8 overflow-hidden ">
                      {project.description || "暂无描述"}
                    </p>

                    {/* 参与人员头像 */}
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
                        <div className="text-xs w-full h-8 flex items-center text-gray-400">暂无成员</div>
                      )}
                    </div>

                    {/* 进度条 */}
                    <div className="mb-3">
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
                    <div className="flex items-center justify-between pb-2">
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
                  <CardFooter className="flex-col gap-2 py-2">
                    {/* 操作按钮 */}
                    <div className="flex items-center w-full  justify-between  border-gray-100">
                      <button
                        onClick={(e) => handleArchive(project, e)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 text-md rounded-md hover:bg-gray-100 transition-colors w-1/2 cursor-pointer"
                        title={project.archived ? "取消归档" : "归档"}
                      >
                        {project.archived ? (
                          <>
                            <ArchiveRestore size={14} className="text-brand-secondary" />
                            <span className="text-brand-secondary">取消归档</span>
                          </>
                        ) : (
                          <>
                            <Archive size={14} className="text-brand-secondary" />
                            <span className="text-brand-secondary">归档</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleEdit(project, e)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 text-md rounded-md hover:bg-gray-100 transition-colors w-1/2 cursor-pointer"
                        title="编辑"
                      >
                        <Pencil size={14} className="text-brand-secondary" />
                        <span className="text-brand-secondary">编辑</span>
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* 编辑项目对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-brand-primary mb-1 block">项目名称</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="请输入项目名称"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-primary mb-1 block">项目描述</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="请输入项目描述"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-primary mb-1 block">客户名称</label>
              <Input
                value={editForm.client}
                onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateProject}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 归档确认对话框 */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{archivingProject?.archived ? "取消归档" : "归档项目"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-brand-secondary">
              {archivingProject?.archived
                ? `确定要取消归档项目「${archivingProject?.name}」吗？取消归档后该项目将重新出现在进行中的项目列表中。`
                : `确定要归档项目「${archivingProject?.name}」吗？归档后该项目将不会出现在进行中的项目列表中，但可以在归档项目中查看。`}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmArchive}>
              {archivingProject?.archived ? "取消归档" : "归档"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
