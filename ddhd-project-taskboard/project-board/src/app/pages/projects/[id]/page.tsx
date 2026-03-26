"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  FolderOpen,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  Filter,
  MoreHorizontal,
  GripVertical,
  Edit2Icon,
  Edit,
  Edit3,
  EditIcon,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

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
  deadline: string | null;
  tasks: Task[];
  order: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  plannedDate?: string;
  assignees: { user: { id: string; userId: string; userName: string; avatar?: string } }[];
  milestoneId?: string;
  createdAt: string;
}

interface Assignee {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
}

type TaskFilter = "all" | "completed" | "incomplete";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    id: string;
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
    status?: string;
  } | null>(null);
  const [isCreateMilestoneDialogOpen, setIsCreateMilestoneDialogOpen] = useState(false);
  const [isEditMilestoneDialogOpen, setIsEditMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMilestoneName, setEditMilestoneName] = useState("");
  const [editMilestoneDueDate, setEditMilestoneDueDate] = useState("");
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("P1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "delete" | "toggle";
    taskId: string;
    taskTitle: string;
    newStatus?: string;
  }>({
    isOpen: false,
    type: "delete",
    taskId: "",
    taskTitle: "",
  });
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProject = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/projects/${params.id}`);
      const data = await res.json();
      if (data.data) {
        setProject(data.data);
        if (!selectedMilestoneId && data.data.milestones?.length > 0) {
          setSelectedMilestoneId(data.data.milestones[0].id);
        }
      }
    } catch {
      toast.error("获取项目详情失败");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 5分钟自动刷新
  useAutoRefresh({
    onRefresh: () => fetchProject(false),
    enabled: true,
  });

  const selectedMilestone = useMemo(() => {
    return project?.milestones?.find(m => m.id === selectedMilestoneId);
  }, [project, selectedMilestoneId]);

  const filteredTasks = useMemo(() => {
    if (!selectedMilestone) return [];
    let tasks = selectedMilestone.tasks || [];

    if (taskFilter === "completed") {
      tasks = tasks.filter(t => t.status === "已完成");
    } else if (taskFilter === "incomplete") {
      tasks = tasks.filter(t => t.status !== "已完成");
    }

    // 按创建时间倒序排列
    return [...tasks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [selectedMilestone, taskFilter]);

  const taskProgress = useMemo(() => {
    if (!selectedMilestone) return 0;
    const total = selectedMilestone.tasks?.length || 0;
    const completed = selectedMilestone.tasks?.filter(t => t.status === "已完成").length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [selectedMilestone]);

  // 里程碑拖拽排序
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !project) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    // 获取当前排序的里程碑
    const sortedMilestones = [...(project.milestones || [])].sort((a, b) => a.order - b.order);
    const [movedItem] = sortedMilestones.splice(source.index, 1);
    sortedMilestones.splice(destination.index, 0, movedItem);

    // 更新本地状态（乐观更新）
    const updatedMilestones = sortedMilestones.map((m, index) => ({
      ...m,
      order: index,
    }));
    setProject({
      ...project,
      milestones: updatedMilestones,
    });

    // 调用 API 保存排序
    try {
      await fetch("/api/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: updatedMilestones.map((m) => ({ id: m.id, order: m.order })),
        }),
      });
      toast.success("里程碑顺序已更新");
    } catch {
      toast.error("更新排序失败");
      // 失败时重新获取数据
      fetchProject(false);
    }
  };

  // 获取项目中所有任务的唯一责任人
  const allAssignees = useMemo(() => {
    if (!project?.milestones) return [];
    const assigneeMap = new Map<string, Assignee>();
    project.milestones.forEach(milestone => {
      milestone.tasks?.forEach(task => {
        task.assignees?.forEach(a => {
          if (!assigneeMap.has(a.user.id)) {
            assigneeMap.set(a.user.id, a.user);
          }
        });
      });
    });
    return Array.from(assigneeMap.values());
  }, [project]);

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
    status?: string;
  }) => {
    if (!taskData.milestoneId) {
      toast.error("请选择里程碑");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          milestoneId: taskData.milestoneId,
          priority: taskData.priority,
          status: taskData.status || "待开始",
          plannedDate: taskData.plannedDate,
          assignees: taskData.assigneeIds?.map((userId) => ({ userId })) || [],
        }),
      });

      if (res.ok) {
        toast.success("任务创建成功");
        await fetchProject(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "创建任务失败");
      }
    } catch {
      toast.error("创建任务失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (taskData: {
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
  }) => {
    if (!editingTask) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          plannedDate: taskData.plannedDate,
          milestoneId: taskData.milestoneId,
          assignees: taskData.assigneeIds?.map((userId) => ({ userId })) || [],
        }),
      });

      if (res.ok) {
        toast.success("任务更新成功");
        setEditingTask(null);
        await fetchProject(false);
      } else {
        toast.error("更新任务失败");
      }
    } catch {
      toast.error("更新任务失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateDialog = (milestoneId?: string) => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) {
      toast.error("请输入里程碑名称");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMilestoneName.trim(),
          projectId: project?.id,
          status: "待开始",
          dueDate: newMilestoneDueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("里程碑创建成功");
        setNewMilestoneName("");
        setNewMilestoneDueDate("");
        setIsCreateMilestoneDialogOpen(false);
        await fetchProject(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "创建里程碑失败");
      }
    } catch {
      toast.error("创建里程碑失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditMilestoneDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditMilestoneName(milestone.name);
    setEditMilestoneDueDate(milestone.deadline || "");
    setIsEditMilestoneDialogOpen(true);
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !editMilestoneName.trim()) {
      toast.error("请输入里程碑名称");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/milestones/${editingMilestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editMilestoneName.trim(),
          deadline: editMilestoneDueDate || null,
        }),
      });

      if (res.ok) {
        toast.success("里程碑更新成功");
        setIsEditMilestoneDialogOpen(false);
        setEditingMilestone(null);
        await fetchProject(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "更新里程碑失败");
      }
    } catch {
      toast.error("更新里程碑失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!editingMilestone) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/milestones/${editingMilestone.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("里程碑已删除");
        setIsEditMilestoneDialogOpen(false);
        setEditingMilestone(null);
        if (selectedMilestoneId === editingMilestone.id) {
          setSelectedMilestoneId("");
        }
        await fetchProject(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "删除里程碑失败");
      }
    } catch {
      toast.error("删除里程碑失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirmDialog.taskId) return;
    
    try {
      const res = await fetch(`/api/tasks/${confirmDialog.taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("任务已删除");
        await fetchProject(false);
      } else {
        toast.error("删除任务失败");
      }
    } catch {
      toast.error("删除任务失败");
    } finally {
      setConfirmDialog({ isOpen: false, type: "delete", taskId: "", taskTitle: "" });
    }
  };

  const handleToggleTaskStatus = async () => {
    if (!confirmDialog.taskId || !confirmDialog.newStatus) return;
    
    try {
      const body: Record<string, string> = { status: confirmDialog.newStatus };
      // 如果是标记为完成，添加完成说明
      if (confirmDialog.newStatus === "已完成" && completionNote.trim()) {
        body.completionNote = completionNote;
      }
      
      const res = await fetch(`/api/tasks/${confirmDialog.taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`任务已${confirmDialog.newStatus === "已完成" ? "完成" : "重启"}`);
        setCompletionNote("");
        await fetchProject(false);
      } else {
        toast.error("更新任务状态失败");
      }
    } catch {
      toast.error("更新任务状态失败");
    } finally {
      setConfirmDialog({ isOpen: false, type: "toggle", taskId: "", taskTitle: "" });
    }
  };

  const openConfirmDialog = (type: "delete" | "toggle", task: Task) => {
    const newStatus = task.status === "已完成" ? "进行中" : "已完成";
    setCompletionNote(""); // 重置完成说明
    setConfirmDialog({
      isOpen: true,
      type,
      taskId: task.id,
      taskTitle: task.title,
      newStatus,
    });
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

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      "P0": { label: "紧急重要", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      "P1": { label: "紧急不重要", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
      "P2": { label: "重要不紧急", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      "P3": { label: "不紧急不重要", color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" },
    };
    const config = priorityMap[priority] || { label: priority, color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color}`}>
        {config.label}
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

  const getProjectStatus = () => {
    if (!project?.milestones?.length) return "待开始";
    const totalTasks = project.milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
    const completedTasks = project.milestones.reduce(
      (acc, m) => acc + (m.tasks?.filter(t => t.status === "已完成").length || 0), 0
    );
    if (totalTasks === 0) return "待开始";
    if (completedTasks === totalTasks) return "已完成";
    return "进行中";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg lg:col-span-2" />
        </div>
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
    <div className="space-y-4 h-full flex flex-col">
      <Link 
        href="/projects-list"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        返回列表
      </Link>

      <Card>
        <CardContent >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-semibold truncate">{project.name}</h1>
                {getStatusBadge(getProjectStatus())}
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description || "暂无项目描述"}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon size={12} />
                  {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                </span>
                {project.client && (
                  <span>客户: {project.client}</span>
                )}
              </div>
            </div>
            
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

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">责任人</span>
                <div className="flex items-center gap-1">
                  {allAssignees.length > 0 ? (
                    <>
                      <div className="flex -space-x-1.5">
                        {allAssignees.slice(0, 6).map((assignee) => {
                          const color = getAvatarColor(assignee.userName);
                          return assignee.avatar ? (
                            <img
                              key={assignee.id}
                              src={assignee.avatar}
                              alt={assignee.userName}
                              className="w-7 h-7 rounded-full border-2 border-background object-cover"
                              title={assignee.userName}
                            />
                          ) : (
                            <div
                              key={assignee.id}
                              className={cn(
                                "w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px]",
                                color.bg,
                                color.text
                              )}
                              title={assignee.userName}
                            >
                              {getInitials(assignee.userName, 1)}
                            </div>
                          );
                        })}
                        {allAssignees.length > 6 && (
                          <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
                            +{allAssignees.length - 6}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">共 {allAssignees.length} 人</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">暂无责任人</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsCreateMilestoneDialogOpen(true)}
              >
                <Plus size={12} className="mr-1" />
                添加里程碑
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-2 overflow-auto bg-white rounded-lg p-2 border-border border shadow-sm h-min">
          <div className="flex items-center justify-between px-1 py-2">
            <h2 className="text-md font-bold text-muted-foreground">里程碑</h2>
            <span className="text-xs text-muted-foreground">{project.milestones?.length || 0} 个</span>
          </div>
          
          {project.milestones?.length === 0 ? (
            <Card className="flex-1">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">暂无里程碑</p>
              </CardContent>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="milestones">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {[...project.milestones].sort((a, b) => a.order - b.order).map((milestone, index) => {
                      const completedTasks = milestone.tasks?.filter(t => t.status === "已完成").length || 0;
                      const totalTasks = milestone.tasks?.length || 0;
                      const isSelected = selectedMilestoneId === milestone.id;

                      return (
                        <Draggable key={milestone.id} draggableId={milestone.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "relative rounded-lg border-2 transition-all duration-200 bg-gray-100/30",
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-border hover:border-primary/50 hover:bg-muted/30",
                                snapshot.isDragging && "shadow-lg opacity-90"
                              )}
                            >
                              <div onClick={() => setSelectedMilestoneId(milestone.id)}
                                className="w-full p-3 hover:pl-6 hover:pr-8 transition-all flex items-center justify-between group"
                                {...provided.dragHandleProps}
                                >
                                <div className="w-3/5 text-left ">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className={cn(
                                      "font-medium text-sm truncate flex-1",
                                      isSelected && "text-primary"
                                    )}>
                                      {milestone.name}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon size={11} />
                                      {milestone.deadline
                                        ? new Date(milestone.deadline).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
                                        : "无截止"
                                      }
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 size={11} />
                                      {completedTasks}/{totalTasks}
                                    </span>
                                  </div>
                                </div>
                                <div className="size-12">
                                  {/* 圆形进度 */}
                                  <div className="relative w-12 h-12 shrink-0">
                                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 32 32">
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="12"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        className="text-muted/30"
                                      />
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="12"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray={`${(completedTasks / (totalTasks || 1)) * 75.4} 75.4`}
                                        className={cn(
                                          "transition-all duration-300",
                                          completedTasks === totalTasks && totalTasks > 0
                                            ? "text-green-500"
                                            : "text-primary"
                                        )}
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 left-0.5 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <GripVertical size={14} className="text-muted-foreground" />
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditMilestoneDialog(milestone);
                                  }}
                                  className="absolute top-1/2 -translate-1/2 right-0.5 group-hover:opacity-100 hover:opacity-100 opacity-0 cursor-pointer"
                                >
                                  <Edit size={18} className="text-primary" />
                                </button>
                              </div>
                              
                              
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          {selectedMilestone ? (
            <>
              <Card className="shrink-0 p-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-bold">{selectedMilestone.name}</h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={11} />
                          {selectedMilestone.deadline
                            ? new Date(selectedMilestone.deadline).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
                            : "无截止"}
                        </span>
                        <span>
                          {selectedMilestone.tasks?.filter(t => t.status === "已完成").length || 0} / {selectedMilestone.tasks?.length || 0} 任务已完成
                        </span>
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">{taskProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={taskFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTaskFilter("all")}
                  >
                    全部
                  </Button>
                  <Button
                    variant={taskFilter === "completed" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTaskFilter("completed")}
                  >
                    已完成
                  </Button>
                  <Button
                    variant={taskFilter === "incomplete" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTaskFilter("incomplete")}
                  >
                    未完成
                  </Button>
                </div>
                
                <Button 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => openCreateDialog()}
                >
                  <Plus size={14} className="mr-1" />
                  添加任务
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-1 space-y-3">
                {filteredTasks.length === 0 ? (
                  <Card className="flex-1">
                    <CardContent className="py-12 text-center">
                      <Filter size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {taskFilter === "all" ? "暂无任务" : "没有符合条件的任务"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className={cn(
                        "group hover:shadow-sm transition-all duration-200",
                        task.status === "已完成" 
                          ? "bg-green-50/50 dark:bg-green-900/10" 
                          : "bg-card"
                      )}
                    >
                      <CardContent className="p-3 py-0">
                        <div className="flex items-center gap-3">
                          <div
                            role="checkbox"
                            aria-checked={task.status === "已完成"}
                            onClick={() => openConfirmDialog("toggle", task)}
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                              task.status === "已完成"
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 hover:border-primary dark:border-gray-600"
                            )}
                          >
                            {task.status === "已完成" && <CheckCircle2 size={12} />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-sm truncate cursor-pointer hover:text-primary",
                                  task.status === "已完成" && "line-through text-muted-foreground",
                                  task.status === "有风险" && "text-red-600"
                                )}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsTaskDialogOpen(true);
                                }}
                              >
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex -space-x-1">
                              {task.assignees?.slice(0, 2).map((a, i) => {
                                const color = getAvatarColor(a.user.userName);
                                return a.user.avatar ? (
                                  <img
                                    key={i}
                                    src={a.user.avatar}
                                    alt={a.user.userName}
                                    className="w-6 h-6 rounded-full border border-background object-cover"
                                    title={a.user.userName}
                                  />
                                ) : (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-6 h-6 rounded-full border border-background flex items-center justify-center text-[10px]",
                                      color.bg,
                                      color.text
                                    )}
                                    title={a.user.userName}
                                  >
                                    {getInitials(a.user.userName, 1)}
                                  </div>
                                );
                              })}
                              {task.assignees?.length === 0 && (
                                <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center">
                                  <span className="text-[10px] text-muted-foreground">无</span>
                                </div>
                              )}
                            </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded",
                                task.status === "已完成" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                task.status === "进行中" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                task.status === "有风险" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                task.status === "已延期" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                task.status === "暂停" && "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
                                task.status === "待开始" && "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
                              )}>
                                {task.status}
                              </span>
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger 
                                className="h-8 w-8 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 hover:bg-gray-200 cursor-pointer"
                              >
                                <MoreHorizontal size={14} />

                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingTask({
                                      id: task.id,
                                      title: task.title,
                                      description: task.description,
                                      priority: task.priority,
                                      plannedDate: task.plannedDate,
                                      assigneeIds: task.assignees?.map((a) => a.user.id) || [],
                                      milestoneId: task.milestoneId,
                                    });
                                    setIsCreateDialogOpen(true);
                                  }}
                                  className="text-sm cursor-pointer"
                                >
                                  <Edit size={12} className="mr-2" />
                                  编辑任务
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openConfirmDialog("toggle", task)}
                                  className="text-sm mt-1 cursor-pointer"
                                >
                                  {task.status === "已完成" ? (
                                    <><Clock size={12} className="mr-2" /> 标记为未完成</>
                                  ) : (
                                    <><CheckCircle2 size={12} className="mr-2" /> 标记为完成</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openConfirmDialog("delete", task)}
                                  className="text-sm mt-1 cursor-pointer text-red-600 focus:bg-red-100"
                                >
                                  <Trash2 size={12} className="mr-2" />
                                  删除任务
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center py-12">
                <p className="text-sm text-muted-foreground">请选择一个里程碑查看任务</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleEditTask : handleCreateTask}
        milestones={project?.milestones || []}
        defaultPriority={newTaskPriority}
        defaultMilestoneId={selectedMilestoneId}
        submitText={editingTask ? "保存" : "创建"}
        editingTask={editingTask ? {
          id: editingTask.id,
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          plannedDate: editingTask.plannedDate,
          assigneeIds: editingTask.assigneeIds,
          milestoneId: editingTask.milestoneId,
        } : undefined}
      />

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className={cn("sm:max-w-sm", confirmDialog.type === "toggle" && confirmDialog.newStatus === "已完成" && "sm:max-w-md")}>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "delete" ? "确认删除任务" : "确认更改任务状态"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "delete" ? (
                <>确定要删除任务「<strong>{confirmDialog.taskTitle}</strong>」吗？此操作不可撤销。</>
              ) : (
                <>确定要将任务「<strong>{confirmDialog.taskTitle}</strong>」标记为{confirmDialog.newStatus === "已完成" ? "已完成" : "未完成"}吗？</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* 完成说明输入框 - 仅在标记为完成时显示 */}
          {confirmDialog.type === "toggle" && confirmDialog.newStatus === "已完成" && (
            <div className="py-4">
              <Label htmlFor="completionNote" className="text-sm font-medium">
                完成说明（可选）
              </Label>
              <textarea
                id="completionNote"
                className="w-full mt-2 p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="简要说明任务完成情况、交付物等..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
              />
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            >
              取消
            </Button>
            <Button 
              variant={confirmDialog.type === "delete" ? "destructive" : "default"}
              onClick={confirmDialog.type === "delete" ? handleDeleteTask : handleToggleTaskStatus}
            >
              {confirmDialog.type === "delete" ? "删除" : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建里程碑弹窗 */}
      <Dialog open={isCreateMilestoneDialogOpen} onOpenChange={setIsCreateMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>添加里程碑</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestoneName">里程碑名称 *</Label>
              <Input
                id="milestoneName"
                placeholder="输入里程碑名称"
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>截止日期</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-start text-left font-normal"
                    />
                  }
                >
                  {newMilestoneDueDate ? (
                    format(new Date(newMilestoneDueDate), "yyyy-MM-dd")
                  ) : (
                    <span className="text-muted-foreground">选择截止日期（可选）</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newMilestoneDueDate ? new Date(newMilestoneDueDate) : undefined}
                    onSelect={(date) => setNewMilestoneDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewMilestoneName("");
                setNewMilestoneDueDate("");
                setIsCreateMilestoneDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleCreateMilestone} disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑里程碑弹窗 */}
      <Dialog open={isEditMilestoneDialogOpen} onOpenChange={setIsEditMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>编辑里程碑</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editMilestoneName">里程碑名称 *</Label>
              <Input
                id="editMilestoneName"
                placeholder="输入里程碑名称"
                value={editMilestoneName}
                onChange={(e) => setEditMilestoneName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>截止日期</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-start text-left font-normal"
                    />
                  }
                >
                  {editMilestoneDueDate ? (
                    format(new Date(editMilestoneDueDate), "yyyy-MM-dd")
                  ) : (
                    <span className="text-muted-foreground">选择截止日期（可选）</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editMilestoneDueDate ? new Date(editMilestoneDueDate) : undefined}
                    onSelect={(date) => setEditMilestoneDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteMilestone}
              disabled={isSubmitting}
            >
              删除
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => {
                setIsEditMilestoneDialogOpen(false);
                setEditingMilestone(null);
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleUpdateMilestone} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情弹窗 */}
      <TaskDetailDialog
        task={selectedTask}
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        onEdit={(task) => {
          setEditingTask({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            plannedDate: task.plannedDate,
            assigneeIds: task.assignees?.map((a) => a.user.id).filter((id): id is string => !!id),
            milestoneId: task.milestone?.id,
            status: task.status,
          });
          setIsCreateDialogOpen(true);
        }}
      />
    </div>
  );
}
