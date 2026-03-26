"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface User {
  userId: string;
  userName: string;
  avatar?: string;
  avatarColorBg?: string;
  avatarColorText?: string;
  role: string;
  openId?: string;
  _count?: {
    assignees: number;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  plannedDate?: string;
  assignees?: { user: { userName: string; avatar?: string } }[];
  milestone: { name: string; project: { id: string; name: string } };
}

interface UserDetail extends User {
  assignees: {
    task: Task;
    role: string;
  }[];
}

interface UserAPIResponse extends User {
  assignedTasks?: {
    task: Task;
    role: string;
  }[];
}

// 预定义的头像颜色选项
const avatarColorOptions = [
  { bg: "bg-red-500", text: "text-white", name: "红色" },
  { bg: "bg-orange-500", text: "text-white", name: "橙色" },
  { bg: "bg-amber-500", text: "text-white", name: "琥珀" },
  { bg: "bg-green-500", text: "text-white", name: "绿色" },
  { bg: "bg-emerald-500", text: "text-white", name: "翠绿" },
  { bg: "bg-teal-500", text: "text-white", name: "青色" },
  { bg: "bg-cyan-500", text: "text-white", name: "青色" },
  { bg: "bg-sky-500", text: "text-white", name: "天蓝" },
  { bg: "bg-blue-500", text: "text-white", name: "蓝色" },
  { bg: "bg-indigo-500", text: "text-white", name: "靛蓝" },
  { bg: "bg-violet-500", text: "text-white", name: "紫罗兰" },
  { bg: "bg-purple-500", text: "text-white", name: "紫色" },
  { bg: "bg-fuchsia-500", text: "text-white", name: "品红" },
  { bg: "bg-pink-500", text: "text-white", name: "粉色" },
  { bg: "bg-rose-500", text: "text-white", name: "玫瑰" },
  { bg: "bg-slate-600", text: "text-white", name: "石板灰" },
];

export default function PeoplePage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    userName: "",
    role: "",
    openId: "",
  });
  const [projects, setProjects] = useState<any[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    userName: "",
    avatar: "",
    role: "",
    useColorAvatar: false,
    colorBg: "bg-blue-500",
    colorText: "text-white",
    openId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 使用 includeDetails=true 获取完整任务数据，避免 N+1 查询
      const res = await fetch("/api/users?includeDetails=true");
      const data = await res.json();
      if (data.data) {
        // Map assignedTasks to assignees for frontend compatibility
        const usersWithDetails = data.data.map((u: UserAPIResponse) => {
          const { assignedTasks, ...rest } = u;
          return {
            ...rest,
            assignees: assignedTasks || [],
          };
        });
        setUsers(usersWithDetails);
      }
    } catch {
      toast.error("获取人员数据失败");
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
      console.error("获取项目数据失败");
    }
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      let res;
      if (editingTask) {
        // 更新任务 - 使用 PATCH
        const { assigneeIds, ...updateData } = taskData;
        const payload = {
          id: editingTask.id,
          ...updateData,
          assignees: assigneeIds?.map((userId: string) => ({ userId })),
        };
        res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // 创建任务 - 使用 POST
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
      }
      if (res.ok) {
        toast.success(editingTask ? "任务已更新" : "任务已创建");
        setIsCreateDialogOpen(false);
        setEditingTask(null);
        fetchUsers();
      } else {
        toast.error(editingTask ? "更新任务失败" : "创建任务失败");
      }
    } catch {
      toast.error(editingTask ? "更新任务失败" : "创建任务失败");
    }
  };

  // 5分钟自动刷新
  useAutoRefresh({
    onRefresh: fetchUsers,
    enabled: true,
  });

  const openUserEdit = (user: UserDetail) => {
    setEditingUser(user);
    setEditForm({
      userName: user.userName,
      avatar: user.avatar || "",
      role: user.role,
      useColorAvatar: !user.avatar,
      colorBg: user.avatarColorBg || "bg-blue-500",
      colorText: user.avatarColorText || "text-white",
      openId: user.openId || "",
    });
    setIsUserEditOpen(true);
  };

  const handleCropComplete = (croppedUrl: string) => {
    setEditForm({ ...editForm, avatar: croppedUrl, useColorAvatar: false });
    setCropImageSrc("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result?.toString() || "");
      setIsCropDialogOpen(true);
    });
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: Record<string, string | undefined> = {
        userName: editForm.userName,
        role: editForm.role,
        openId: editForm.openId,
      };

      // 如果使用颜色头像，保存颜色信息；否则保存头像URL
      if (editForm.useColorAvatar) {
        updateData.avatar = ""; // 清空头像URL
        updateData.avatarColorBg = editForm.colorBg;
        updateData.avatarColorText = editForm.colorText;
      } else {
        updateData.avatar = editForm.avatar || "";
        updateData.avatarColorBg = undefined;
        updateData.avatarColorText = undefined;
      }

      const res = await fetch(`/api/users/${editingUser.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        toast.success("用户信息已更新");
        setIsUserEditOpen(false);
        fetchUsers(); // 刷新列表
      } else {
        toast.error("更新失败");
      }
    } catch {
      toast.error("更新用户信息失败");
    }
  };

  const handleCreateUser = async () => {
    if (!createUserForm.userName.trim()) {
      toast.error("请输入姓名");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: createUserForm.userName.trim(),
          role: createUserForm.role.trim() || undefined,
          openId: createUserForm.openId.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("用户创建成功");
        setIsCreateUserOpen(false);
        setCreateUserForm({ userName: "", role: "", openId: "" });
        fetchUsers();
      } else {
        toast.error("创建用户失败");
      }
    } catch {
      toast.error("创建用户失败");
    }
  };

  const getTaskStats = (user: UserDetail) => {
    const assignees = user.assignees || [];
    const pending = assignees.filter(
      (a) => a.task.status !== "已完成"
    ).length;
    const completed = assignees.filter(
      (a) => a.task.status === "已完成"
    ).length;
    const highPriority = assignees.filter((a) =>
      ["P0", "P1"].includes(a.task.priority)
    ).length;

    // 获取未完成的任务（用于显示近3条）
    const incompleteTasks = assignees
      .filter((a) => a.task.status !== "已完成")
      .sort((a, b) => {
        // 按优先级排序 P0 > P1 > P2 > P3
        const priorityOrder: Record<string, number> = {
          P0: 0,
          P1: 1,
          P2: 2,
          P3: 3,
        };
        return (
          priorityOrder[a.task.priority] - priorityOrder[b.task.priority]
        );
      });

    return {
      pending,
      completed,
      highPriority,
      total: assignees.length,
      incompleteTasks,
    };
  };

  const getRoleStyle = (role: string) => {
    if (role.includes("指挥"))
      return "bg-primary/10 text-primary border-primary/20";
    if (role.includes("技术"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (role.includes("创作") || role.includes("策划"))
      return "bg-green-100 text-green-700 border-green-200";
    if (role.includes("运营"))
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-muted text-muted-foreground border-border";
  };



  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "P0":
        return <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
      case "P1":
        return <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />;
      case "P2":
        return <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />;
      case "P3":
        return <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "进行中":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">进行中</span>;
      case "有风险":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">有风险</span>;
      case "已延期":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">已延期</span>;
      case "暂停":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">暂停</span>;
      case "待开始":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">待开始</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-2xl font-bold tracking-tight">人员看板</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看团队成员的任务分配情况
          </p>
        </div>
        <Button onClick={() => setIsCreateUserOpen(true)} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1" />
          添加人员
        </Button>
      </div>

      {/* 人员卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => {
          const stats = getTaskStats(user);
          const isExpanded = expandedUser === user.userId;

          return (
            <Card key={user.userId} className="p-0 hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-4 flex flex-col flex-1">
                {/* 头像和基本信息 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative group">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.userName}
                        className="w-12 h-12 rounded-xl object-cover bg-muted shrink-0"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg shrink-0",
                        user.avatarColorBg || getAvatarColor(user.userId).bg,
                        user.avatarColorText || getAvatarColor(user.userId).text
                      )}>
                        {getInitials(user.userName)}
                      </div>
                    )}
                    {/* 悬停编辑按钮 */}
                    <button
                      onClick={() => openUserEdit(user)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={16} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate">{user.userName}</h3>
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded text-xs font-medium border mt-1",
                        getRoleStyle(user.role)
                      )}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* 任务统计 - 横排 */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="text-center flex-1">
                    <span className="text-xl font-bold text-blue-600 block">
                      {stats.pending}
                    </span>
                    <span className="text-[10px] text-muted-foreground">进行中</span>
                  </div>
                  <div className="text-center flex-1 border-x border-gray-200">
                    <span className="text-xl font-bold text-green-600 block">
                      {stats.completed}
                    </span>
                    <span className="text-[10px] text-muted-foreground">已完成</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="text-xl font-bold text-amber-600 block">
                      {stats.highPriority}
                    </span>
                    <span className="text-[10px] text-muted-foreground">高优</span>
                  </div>
                </div>

                {/* 待推进任务 */}
                <div className="flex-1">
                  {stats.incompleteTasks.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          待推进 ({stats.incompleteTasks.length})
                        </p>
                        {stats.incompleteTasks.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-xs px-1"
                            onClick={() =>
                              setExpandedUser(isExpanded ? null : user.userId)
                            }
                          >
                            {isExpanded ? "收起" : "更多"}
                            <ChevronRight
                              size={10}
                              className={cn(
                                "transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {(isExpanded
                          ? stats.incompleteTasks
                          : stats.incompleteTasks.slice(0, 3)
                        ).map(({ task }) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 p-2 rounded-md bg-amber-50 hover:bg-amber-100/70 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDialogOpen(true);
                            }}
                          >
                            {getPriorityDot(task.priority)}
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-sm font-medium truncate block",
                                task.status === "有风险" && "text-red-600"
                              )}>
                                {task.title}
                              </span>
                              <Link
                                href={`/projects/${task.milestone?.project?.id}`}
                                className="text-[10px] text-muted-foreground truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {task.milestone?.project?.name}
                              </Link>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                      <CheckCircle2 size={20} className="mb-1 text-green-500" />
                      <span className="text-xs">任务已全部完成</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 任务详情弹窗 */}
      <TaskDetailDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) {
            setSelectedTask(null);
          }
        }}
        task={selectedTask}
        onEdit={(task) => {
          // 先关闭详情弹窗，打开编辑弹窗
          setIsTaskDialogOpen(false);
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

      {/* 创建/编辑任务弹窗 */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        projects={projects}
        milestones={projects.flatMap((p: any) => p.milestones || [])}
        submitText={editingTask ? "保存" : "创建"}
        editingTask={editingTask || undefined}
      />

      {/* 用户编辑弹窗 */}
      <Dialog open={isUserEditOpen} onOpenChange={setIsUserEditOpen}>
        <DialogContent className="sm:max-w-lg z-60">
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 头像预览 */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {editForm.useColorAvatar ? (
                  <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center font-semibold text-2xl", editForm.colorBg, editForm.colorText)}>
                    {getInitials(editForm.userName)}
                  </div>
                ) : editForm.avatar ? (
                  <Image
                    src={editForm.avatar}
                    alt={editForm.userName}
                    className="w-20 h-20 rounded-xl object-cover"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    无头像
                  </div>
                )}
              </div>

              {/* 上传头像按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                上传头像
              </Button>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="userName">姓名</Label>
              <Input
                id="userName"
                value={editForm.userName}
                onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>

            {/* 角色 */}
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Input
                id="role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                placeholder="请输入角色（如：技术虾、策划虾）"
              />
            </div>

            {/* OpenID */}
            <div className="space-y-2">
              <Label htmlFor="openId">OpenID</Label>
              <Input
                id="openId"
                value={editForm.openId}
                onChange={(e) => setEditForm({ ...editForm, openId: e.target.value })}
                placeholder="请输入第三方OpenID"
              />
            </div>

            {/* 选择头像 */}
            <div className="space-y-2">
              <Label>选择头像</Label>
              <div className="flex flex-wrap gap-2">
                {avatarColorOptions.map((color) => (
                  <button
                    key={color.bg}
                    type="button"
                    onClick={() => setEditForm({
                      ...editForm,
                      useColorAvatar: true,
                      colorBg: color.bg,
                      colorText: color.text,
                    })}
                    className={cn(
                      "w-10 h-10 text-xs rounded-lg flex items-center justify-center transition-all",
                      color.bg,
                      color.text,
                      editForm.useColorAvatar && editForm.colorBg === color.bg && "ring-2 ring-offset-2 ring-primary"
                    )}
                    title={color.name}
                  >
                    {getInitials(editForm.userName)}
                  </button>
                ))}
                {/* 已上传的头像 */}
                {editForm.avatar && (
                  <button
                    type="button"
                    onClick={() => setEditForm({
                      ...editForm,
                      useColorAvatar: false,
                    })}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all",
                      !editForm.useColorAvatar && "ring-2 ring-offset-2 ring-primary"
                    )}
                    title="已上传的头像"
                  >
                    <Image
                      src={editForm.avatar}
                      alt="已上传的头像"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            {/* 底部按钮 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUserEditOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveUser}>
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片裁切弹窗 */}
      <ImageCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        onCropComplete={handleCropComplete}
        initialImageSrc={cropImageSrc}
      />

      {/* 创建用户弹窗 */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加人员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="createUserName">姓名 *</Label>
              <Input
                id="createUserName"
                value={createUserForm.userName}
                onChange={(e) => setCreateUserForm({ ...createUserForm, userName: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createUserRole">角色</Label>
              <Input
                id="createUserRole"
                value={createUserForm.role}
                onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                placeholder="请输入角色（如：技术虾、策划虾）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createUserOpenId">OpenID</Label>
              <Input
                id="createUserOpenId"
                value={createUserForm.openId}
                onChange={(e) => setCreateUserForm({ ...createUserForm, openId: e.target.value })}
                placeholder="请输入第三方OpenID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUser}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
