"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { toast } from "sonner";

interface TaskAssignee {
  user: {
    id?: string;
    userName: string;
    avatar?: string;
    role?: string;
  };
  role?: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  plannedDate?: string;
  actualDate?: string;
  assignees?: TaskAssignee[];
  milestone?: {
    id?: string;
    name: string;
    projectId?: string;
    project: {
      id: string;
      name: string;
    };
  };
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskDetail | null;
  onStatusChange?: () => void;
  onEdit?: (task: TaskDetail) => void;
}

const priorityLabels: Record<string, string> = {
  P0: "紧急重要",
  P1: "紧急不重要",
  P2: "重要不紧急",
  P3: "不重要不紧急",
};

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onStatusChange,
  onEdit,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const handleStatusToggle = async () => {
    const newStatus = task.status === "已完成" ? "待开始" : "已完成";
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`任务已更新为"${newStatus}"`);
        onStatusChange?.();
        onOpenChange(false);
      } else {
        toast.error("更新任务状态失败");
      }
    } catch {
      toast.error("更新任务状态失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pb-4">
          {/* 优先级和状态 */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded",
                task.priority === "P0" && "bg-red-100 text-red-700",
                task.priority === "P1" && "bg-orange-100 text-orange-700",
                task.priority === "P2" && "bg-blue-100 text-blue-700",
                task.priority === "P3" && "bg-gray-100 text-gray-600"
              )}
            >
              {task.priority} {priorityLabels[task.priority]}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded",
                task.status === "已完成" && "bg-green-100 text-green-700",
                task.status === "进行中" && "bg-blue-100 text-blue-700",
                task.status === "待开始" && "bg-gray-100 text-gray-600",
                task.status === "有风险" && "bg-red-100 text-red-700",
                task.status === "已延期" && "bg-red-100 text-red-700",
                task.status === "暂停" && "bg-amber-100 text-amber-700"
              )}
            >
              {task.status}
            </span>
          </div>

          {/* 任务描述 */}
          {task.description && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">任务描述</p>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* 所属项目和里程碑 */}
          {task.milestone?.project && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-lime-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">所属项目</span>
                  </div>
                  <Link
                    href={`/projects/${task.milestone.project.id}`}
                    className="text-sm font-medium text-primary"
                    onClick={() => onOpenChange(false)}
                  >
                    {task.milestone.project.name}
                  </Link>
                </div>
                {task.milestone?.name && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">里程碑</span>
                    </div>
                    <p className="text-sm font-medium">{task.milestone.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 负责人 */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">负责人</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {task.assignees.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-emerald-100/50 px-3 py-2.5 rounded-lg"
                  >
                    {a.user.avatar ? (
                      <Image
                        src={a.user.avatar}
                        alt={a.user.userName}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-medium text-white shrink-0",
                        getAvatarColor(a.user.userName).bg,
                        getAvatarColor(a.user.userName).text
                      )}>
                        {getInitials(a.user.userName)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{a.user.userName}</span>
                      {(a.user.role || a.role) && (
                        <span className="inline-block  text-primary/60 text-[10px] ">
                          {a.user.role || a.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 计划完成时间 */}
          {task.plannedDate && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">计划完成节点</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(task.plannedDate).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              onClick={() => {
                // Blur current button and use setTimeout to allow focus to move before dialog closes
                (document.activeElement as HTMLElement)?.blur();
                setTimeout(() => {
                  onEdit?.(task);
                }, 0);
              }}
              className="cursor-pointer"
            >
              编 辑
            </Button>
            <Button
              onClick={handleStatusToggle}
              className={cn(
                task.status === "已完成" ? "bg-amber-800 hover:bg-amber-600" : "bg-primary/90 hover:bg-primary",
                "cursor-pointer"
              )}
            >
              {task.status === "已完成" ? "标记为未完成" : "标记为已完成"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
