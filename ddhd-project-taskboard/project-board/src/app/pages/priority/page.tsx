"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Briefcase,
  User,
  Calendar,
  Plus,
  FolderKanban,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

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
  assignees?: { user: { userName: string; avatar?: string } }[];
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  userName: string;
  role: string;
  avatar?: string;
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
  const [assigneeUsers, setAssigneeUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "P1",
    status: "待开始",
    plannedDate: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchAssignees();
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
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.data) {
        setProjects(data.data);
      }
    } catch {
      toast.error("获取项目列表失败");
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.data) {
        setAssigneeUsers(data.data);
      }
    } catch {
      toast.error("获取用户列表失败");
    }
  };

  const filteredAssignees = assigneeUsers.filter((user) =>
    user.userName.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("请输入任务名称");
      return;
    }

    // 根据象限设置优先级和状态
    let priority = newTask.priority;
    let status = newTask.status;
    
    switch (selectedQuadrant) {
      case "p0":
        priority = "P0";
        break;
      case "p1":
        priority = "P1";
        break;
      case "risk":
        priority = "P2";
        status = "有风险";
        break;
      case "normal":
        priority = "P2";
        status = "待开始";
        break;
    }

    toast.success(`任务将创建在「${selectedQuadrant}」象限 (P:${priority}, S:${status})`);
    setIsCreateDialogOpen(false);
    setNewTask({ title: "", description: "", priority: "P1", status: "待开始", plannedDate: "" });
    setSelectedAssignee("");
  };

  const openCreateDialog = (quadrantKey: string) => {
    setSelectedQuadrant(quadrantKey);
    setNewTask({ title: "", description: "", priority: "P1", status: "待开始", plannedDate: "" });
    setSelectedAssignee("");
    setIsCreateDialogOpen(true);
  };

  // 四象限数据配置
  const quadrants: QuadrantData[] = [
    {
      key: "p0",
      title: "重要且紧急",
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
      title: "重要不紧急",
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
      key: "risk",
      title: "有风险任务",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P2" && t.status === "有风险" && matchProject && matchStatus;
      }),
      icon: Clock,
      accentColor: "text-[#637CFF]",
      bgColor: "bg-[#637CFF]",
      labelBg: "bg-[#637CFF]/10",
      labelText: "text-[#637CFF]",
    },
    {
      key: "normal",
      title: "普通任务",
      tasks: tasks.filter((t) => {
        const matchProject = selectedProject === "all" || t.milestone?.project.id === selectedProject;
        const matchStatus = statusFilter === "all" ||
          (statusFilter === "completed" && t.status === "已完成") ||
          (statusFilter === "uncompleted" && t.status !== "已完成");
        return t.priority === "P2" && t.status !== "有风险" && matchProject && matchStatus;
      }),
      icon: CheckCircle2,
      accentColor: "text-[#7E8485]",
      bgColor: "bg-[#7E8485]",
      labelBg: "bg-[#7E8485]/10",
      labelText: "text-[#7E8485]",
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P0":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF6231]/10 text-[#FF6231]">P0</span>;
      case "P1":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#25B079]/10 text-[#25B079]">P1</span>;
      case "P2":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#637CFF]/10 text-[#637CFF]">P2</span>;
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
    <div className="group p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#E8EDEC]">
      {/* 标题行：任务名 + 项目链接 */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 flex-1">
          {task.title}
        </h4>
        {task.milestone && (
          <Link
            href={`/projects/${task.milestone.project.id}`}
            className="shrink-0 text-[#7E8485] hover:text-[#637CFF] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderKanban size={14} />
          </Link>
        )}
      </div>

      {/* 标签行 */}
      <div className="flex items-center gap-2 mt-2">
        {getPriorityBadge(task.priority)}
        {getStatusBadge(task.status)}
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4F7F6]">
        <div className="flex items-center gap-2">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-[#637CFF] flex items-center justify-center text-[10px] text-white font-medium">
                {task.assignees[0].user.userName.charAt(0)}
              </div>
              {task.assignees.length > 1 && (
                <span className="text-[10px] text-[#7E8485]">+{task.assignees.length - 1}</span>
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
      <div className="w-72 shrink-0 flex flex-col h-full max-h-[calc(100vh-180px)]">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", quadrant.labelBg)}>
              <Icon size={14} className={quadrant.accentColor} />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{quadrant.title}</h3>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", quadrant.labelBg, quadrant.labelText)}>
              {quadrant.tasks.length}
            </span>
          </div>
        </div>
        
        {/* 任务列表 - 灰色背景 */}
        <div className="flex-1 bg-[#F4F7F6] rounded-2xl p-3 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
            {quadrant.tasks.length === 0 ? (
              <div className="text-center py-8 text-[#7E8485]">
                <Icon size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">暂无任务</p>
              </div>
            ) : (
              quadrant.tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
          
          {/* 添加任务按钮 */}
          <Button
            variant="ghost"
            className="w-full mt-3 h-9 text-[#7E8485] hover:text-[#1A1A1A] hover:bg-white/50 rounded-lg text-sm"
            onClick={() => openCreateDialog(quadrant.key)}
          >
            <Plus size={16} className="mr-1.5" />
            添加任务
          </Button>
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
            <Skeleton key={i} className="w-72 h-full shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">紧急任务看板</h1>
            <p className="text-xs text-[#7E8485] mt-0.5">
              共 <span className="font-medium text-[#1A1A1A]">{tasks.length}</span> 个任务
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue>
                  {statusFilter === "completed" ? "已完成" : statusFilter === "all" ? "全部" : "未完成"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncompleted">未完成</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>

            {/* 项目筛选 */}
            <Select value={selectedProject} onValueChange={(v) => v && setSelectedProject(v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue>
                  {selectedProject === "all" ? "全部项目" : projects.find(p => p.id === selectedProject)?.name || selectedProject}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部项目</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 横向滚动的四象限 */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full pb-2">
          {quadrants.map((quadrant) => (
            <QuadrantColumn key={quadrant.key} quadrant={quadrant} />
          ))}
        </div>
      </div>

      {/* 创建任务弹窗 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>添加任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>任务名称</Label>
              <Input
                placeholder="输入任务名称"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>任务说明</Label>
              <Textarea
                placeholder="输入任务说明（可选）"
                value={newTask.description || ""}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <div className="flex gap-2">
                <Button
                  variant={newTask.priority === "P0" ? "default" : "outline"}
                  size="sm"
                  className={newTask.priority === "P0" ? "bg-[#FF6231] hover:bg-[#FF6231]/90" : ""}
                  onClick={() => setNewTask({ ...newTask, priority: "P0" })}
                >
                  P0
                </Button>
                <Button
                  variant={newTask.priority === "P1" ? "default" : "outline"}
                  size="sm"
                  className={newTask.priority === "P1" ? "bg-[#25B079] hover:bg-[#25B079]/90" : ""}
                  onClick={() => setNewTask({ ...newTask, priority: "P1" })}
                >
                  P1
                </Button>
                <Button
                  variant={newTask.priority === "P2" ? "default" : "outline"}
                  size="sm"
                  className={newTask.priority === "P2" ? "bg-[#637CFF] hover:bg-[#637CFF]/90" : ""}
                  onClick={() => setNewTask({ ...newTask, priority: "P2" })}
                >
                  P2
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>责任人</Label>
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-start text-left font-normal"
                    />
                  }
                >
                  {selectedAssignee ? assigneeUsers.find(u => u.id === selectedAssignee)?.userName : "选择责任人（可选）"}
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Input
                    placeholder="搜索责任人..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="border-0 border-b rounded-none"
                  />
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                      {filteredAssignees.length === 0 ? (
                        <p className="py-2 px-2 text-sm text-muted-foreground">未找到责任人</p>
                      ) : (
                        filteredAssignees.map((user) => (
                          <div
                            key={user.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                              selectedAssignee === user.id && "bg-accent"
                            )}
                            onClick={() => {
                              setSelectedAssignee(user.id);
                              setAssigneePopoverOpen(false);
                              setAssigneeSearch("");
                            }}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#637CFF] flex items-center justify-center text-white text-xs font-medium">
                              {user.userName.charAt(0)}
                            </div>
                            <span className="text-sm">{user.userName}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{user.role}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>计划日期</Label>
              <Input
                type="date"
                value={newTask.plannedDate}
                onChange={(e) => setNewTask({ ...newTask, plannedDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
