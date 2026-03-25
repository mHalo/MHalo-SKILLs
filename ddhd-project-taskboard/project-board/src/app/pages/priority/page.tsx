"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Calendar,
  Circle,
  PlusCircle,
  Pencil,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  plannedDate?: string;
  milestone?: {
    id: string;
    name: string;
    project: { id: string; name: string }
  };
  assignees?: {
    user: {
      id: string;
      userId: string;
      userName: string;
      avatar?: string;
      role?: string;
    };
    role?: string;
  }[];
}

interface Project {
  id: string;
  name: string;
  milestones?: { id: string; name: string }[];
}

interface QuadrantData {
  key: string;
  title: string;
  tasks: Task[];
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  labelBg: string;
  labelText: string;
}

export default function PriorityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("uncompleted");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("P1");
  const [statusConfirmTask, setStatusConfirmTask] = useState<{ task: Task; newStatus: string } | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?limit=200");
      const data = await res.json();
      if (data.data) {
        setTasks(data.data);
      }
    } catch {
      toast.error("获取任务数据失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects?includeDetails=true");
      const data = await res.json();
      if (data.data) {
        setProjects(data.data);
      }
    } catch {
      toast.error("获取项目列表失败");
    }
  };

  // 5分钟自动刷新
  useAutoRefresh({
    onRefresh: async () => {
      await fetchTasks();
      await fetchProjects();
    },
    enabled: true,
  });

  const handleTaskStatusToggle = (task: Task) => {
    const newStatus = task.status === "已完成" ? "待开始" : "已完成";
    setStatusConfirmTask({ task, newStatus });
  };

  const confirmTaskStatusChange = async () => {
    if (!statusConfirmTask) return;

    try {
      const res = await fetch(`/api/tasks/${statusConfirmTask.task.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusConfirmTask.newStatus }),
      });

      if (res.ok) {
        toast.success(`任务已更新为"${statusConfirmTask.newStatus}"`);
        fetchTasks();
      } else {
        toast.error("更新任务状态失败");
      }
    } catch {
      toast.error("更新任务状态失败");
    } finally {
      setStatusConfirmTask(null);
    }
  };

  const handleTaskSubmit = async (taskData: {
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
    status?: string;
  }) => {
    // 如果是编辑模式
    if (editingTask) {
      try {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          toast.success("任务已更新");
          fetchTasks();
        } else {
          toast.error("更新任务失败");
        }
      } catch {
        toast.error("更新任务失败");
      }
      return;
    }

    // 创建新任务
    let priority = taskData.priority;
    switch (selectedQuadrant) {
      case "p0":
        priority = "P0";
        break;
      case "p1":
        priority = "P1";
        break;
      case "p2":
        priority = "P2";
        break;
      case "p3":
        priority = "P3";
        break;
    }

    toast.success(`任务将创建在「${selectedQuadrant}」象限 (P:${priority})`);
  };

  const openCreateDialog = (quadrantKey: string) => {
    setSelectedQuadrant(quadrantKey);
    // 根据象限设置默认优先级
    switch (quadrantKey) {
      case "p0":
        setNewTaskPriority("P0");
        break;
      case "p1":
        setNewTaskPriority("P1");
        break;
      case "p2":
        setNewTaskPriority("P2");
        break;
      case "p3":
        setNewTaskPriority("P3");
        break;
      default:
        setNewTaskPriority("P2");
    }
    setIsCreateDialogOpen(true);
  };

  // 四象限数据配置
  const quadrants: QuadrantData[] = [
    {
      key: "p0",
      title: "紧急重要 P0",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P0" && matchProject && matchStatus;
      }),
      icon: AlertTriangle,
      accentColor: "text-[#FF6231]",
      bgColor: "bg-[#FF6231]",
      labelBg: "bg-[#FF6231]/10",
      labelText: "text-[#FF6231]",
    },
    {
      key: "p1",
      title: "紧急不重要 P1",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P1" && matchProject && matchStatus;
      }),
      icon: Flag,
      accentColor: "text-[#25B079]",
      bgColor: "bg-[#25B079]",
      labelBg: "bg-[#25B079]/10",
      labelText: "text-[#25B079]",
    },
    {
      key: "p2",
      title: "重要不紧急 P2",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P2" && matchProject && matchStatus;
      }),
      icon: Clock,
      accentColor: "text-[#637CFF]",
      bgColor: "bg-[#637CFF]",
      labelBg: "bg-[#637CFF]/10",
      labelText: "text-[#637CFF]",
    },
    {
      key: "p3",
      title: "不重要不紧急 P3",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P3" && matchProject && matchStatus;
      }),
      icon: Circle,
      accentColor: "text-[#9CA3AF]",
      bgColor: "bg-[#9CA3AF]",
      labelBg: "bg-[#9CA3AF]/10",
      labelText: "text-[#9CA3AF]",
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P0":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF6231]/10 text-[#FF6231]">P0</span>;
      case "P1":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-success/10 text-[#25B079]">P1</span>;
      case "P2":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#637CFF]/10 text-[#637CFF]">P2</span>;
      case "P3":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">P3</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E8EDEC] text-[#7E8485]">P3</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "进行中":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#637CFF]/10 text-[#637CFF]">进行中</span>;
      case "有风险":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF6231]/10 text-[#FF6231]">有风险</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E8EDEC] text-[#7E8485]">待开始</span>;
    }
  };

  // 任务卡片 - 白色背景
  const TaskCard = ({ task }: { task: Task }) => (
    <div className="group p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#E8EDEC] cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        setDetailTask(task);
      }}>
      {/* 标题行：勾选框 + 任务名 + 操作按钮 */}
      <div className="flex items-center justify-between gap-2">
        {/* 勾选框 */}
        <button
          className="shrink-0 w-5 h-5 rounded border-2 border-[#637CFF] flex items-center justify-center hover:bg-[#637CFF]/10 transition-colors mt-0.5"
          onClick={(e) => {
            e.stopPropagation();
            handleTaskStatusToggle(task);
          }}
        >
          {task.status === "已完成" && (
            <CheckCircle2 size={14} className="text-green-500" />
          )}
        </button>
        <h4 className={cn(
          "text-sm font-semibold  line-clamp-2 flex-1",
          task.status === "有风险"? "text-red-500 " : "text-[#1A1A1A]" 
        )}>
          {task.title}
        </h4>
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="shrink-0 text-[#7E8485] hover:text-[#637CFF] transition-colors p-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTask(task);
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* 项目名称 */}
      {task.milestone?.project?.name && (
        <div className="text-xs text-[#7E8485] bg-gray-50 p-1 mt-2 rounded-md">
          {task.milestone.project.name}
        </div>
      )}

      {/* 标签行 */}
      <div className="flex items-center gap-2 mt-2">
        {getPriorityBadge(task.priority)}
        {getStatusBadge(task.status)}
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4F7F6]">
        <div className="flex items-center gap-2">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center -space-x-1">
              {task.assignees.slice(0, 5).map((a, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-white ring-1 ring-white">
                  {a.user.avatar ? (
                    <Image
                      src={a.user.avatar}
                      alt={a.user.userName}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className={cn(
                      "text-[10px] font-medium",
                      getAvatarColor(a.user.userName).bg,
                      getAvatarColor(a.user.userName).text
                    )}>
                      {getInitials(a.user.userName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {task.assignees.length > 5 && (
                <Avatar className="w-5 h-5 border-2 border-white ring-1 ring-white bg-gray-200">
                  <AvatarFallback className="bg-gray-300 text-gray-600 text-[10px] font-medium">
                    +{task.assignees.length - 5}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </div>
        {task.plannedDate && (
          <span className="text-[11px] text-[#7E8485] flex items-center gap-1">
            <Calendar size={11} />
            {new Date(task.plannedDate).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );

  // 象限列 - 灰色背景
  const QuadrantColumn = ({ quadrant }: { quadrant: QuadrantData }) => {
    const Icon = quadrant.icon;
    return (
      <div className={cn(
        "flex flex-col h-full max-h-[calc(100vh-150px)]",
        quadrant.labelBg,
        "rounded-md py-3"
      )}>
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", quadrant.labelBg)}>
              <Icon size={14} className={quadrant.accentColor} />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{quadrant.title}</h3>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", quadrant.labelBg, quadrant.labelText)}>
              {quadrant.tasks.length}
            </span>
          </div>
          <div>
            <Button variant="destructive" onClick={() => openCreateDialog(quadrant.key)} className={cn(
              "cursor-pointer bg-white"
            )}>
              <PlusCircle />
            </Button>
          </div>
        </div>
        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 p-2 pt-1">
            {quadrant.tasks.length === 0 ? (
              <div className="text-center py-8 text-[#7E8485]">
                <Icon size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">暂无任务</p>
              </div>
            ) : (
              quadrant.tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="flex gap-4 flex-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-1/4 h-full shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden lg:max-w-7xl m-auto">
      {/* 头部 */}
      <div className="shrink-0 mb-4 w-full">
        <div className="flex items-center justify-between mb-3">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">紧急任务看板</h1>
            <p className="text-sm text-muted-foreground mt-1">
              共 <span className="font-medium text-[#1A1A1A]">{tasks.length}</span> 个任务
            </p>
          </div>
        </div>
          <div className="flex items-center gap-3">
            {/* 状态筛选 - Button Group */}
            <div className="flex items-center bg-white rounded-lg border border-[#E8EDEC] h-10 px-1.5 gap-1">
              <button
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer",
                  statusFilter === "uncompleted"
                    ? "bg-[#637CFF] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatusFilter("uncompleted")}
              >
                未完成
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer",
                  statusFilter === "completed"
                    ? "bg-[#637CFF] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatusFilter("completed")}
              >
                已完成
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-[#637CFF] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatusFilter("all")}
              >
                全部
              </button>
            </div>

            {/* 项目筛选 */}
            <Select value={selectedProject} onValueChange={(v) => v && setSelectedProject(v)}>
              <SelectTrigger className="w-[320px] h-10! text-sm bg-white">
                <SelectValue>
                  {selectedProject === "all" ? "全部项目" : projects.find(p => p.id === selectedProject)?.name || selectedProject}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} >
                <SelectItem value="all">全部项目</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="mb-1">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 四象限 grid 布局 */}
      <div className="flex-1 h-full w-full overflow-hidden">
        <div className="grid grid-cols-4 gap-4 h-full">
          {quadrants.map((quadrant) => (
            <QuadrantColumn key={quadrant.key} quadrant={quadrant} />
          ))}
        </div>
      </div>

      {/* 创建/编辑任务弹窗 */}
      <CreateTaskDialog
        open={isCreateDialogOpen || !!editingTask}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        projects={projects}
        milestones={projects.flatMap(p => p.milestones || [])}
        defaultPriority={newTaskPriority}
        submitText={editingTask ? "保存" : "创建"}
        editingTask={editingTask ? {
          id: editingTask.id,
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          plannedDate: editingTask.plannedDate,
          assigneeIds: editingTask.assignees?.map(a => a.user.userId || a.user.id),
          milestoneId: editingTask.milestone?.id,
          status: editingTask.status,
        } : undefined}
      />

      {/* 任务状态更新确认弹窗 */}
      <Dialog open={!!statusConfirmTask} onOpenChange={() => setStatusConfirmTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认更新任务状态</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              确定要将任务「{statusConfirmTask?.task.title}」更新为
              <span className="font-medium text-foreground">
                {statusConfirmTask?.newStatus === "已完成" ? "已完成" : "待开始"}
              </span>
              吗？
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirmTask(null)}>
              取消
            </Button>
            <Button onClick={confirmTaskStatusChange}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情弹窗 */}
      <TaskDetailDialog
        open={!!detailTask}
        onOpenChange={() => setDetailTask(null)}
        task={detailTask}
        onStatusChange={fetchTasks}
      />
    </div>
  );
}
