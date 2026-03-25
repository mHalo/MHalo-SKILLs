"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Milestone {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  milestones?: Milestone[];
}

interface User {
  id: string;
  userName: string;
  role: string;
  avatar?: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
    status?: string;
  }) => Promise<void> | void;
  milestones?: Milestone[];
  projects?: Project[];
  defaultPriority?: string;
  defaultMilestoneId?: string;
  submitText?: string;
  editingTask?: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    plannedDate?: string;
    assigneeIds?: string[];
    milestoneId?: string;
    status?: string;
  };
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  milestones = [],
  projects = [],
  defaultPriority = "P1",
  defaultMilestoneId = "",
  submitText = "创建",
  editingTask,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(editingTask?.description || "");
  const [priority, setPriority] = useState(editingTask?.priority || defaultPriority);
  const [plannedDate, setPlannedDate] = useState(editingTask?.plannedDate || "");
  const [projectId, setProjectId] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState(editingTask?.milestoneId || defaultMilestoneId);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(editingTask?.assigneeIds || []);
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(editingTask?.status || "待开始");

  // 根据选中的项目筛选里程碑
  const filteredMilestones = projectId
    ? milestones.filter((m) => {
        const project = projects.find((p) => p.id === projectId);
        return project?.milestones?.some((pm) => pm.id === m.id);
      })
    : milestones;

  // 获取用户列表
  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.data) {
          setAssignees(data.data);
        }
      } catch {
        console.error("Failed to fetch users");
      }
    };
    if (open) {
      fetchAssignees();
    }
  }, [open]);

  // 重置表单 - 使用 editingTask?.id 作为依赖，避免对象引用变化导致重复渲染
  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || "");
        setPriority(editingTask.priority);
        setPlannedDate(editingTask.plannedDate || "");
        setMilestoneId(editingTask.milestoneId || defaultMilestoneId);
        setSelectedAssignees(editingTask.assigneeIds || []);
        setStatus(editingTask.status || "待开始");
        setProjectId("");
      } else {
        setTitle("");
        setDescription("");
        setPriority(defaultPriority);
        setPlannedDate("");
        setMilestoneId(defaultMilestoneId);
        setSelectedAssignees([]);
        setStatus("待开始");
        setProjectId("");
      }
      setAssigneeSearch("");
    }
  }, [open, defaultPriority, defaultMilestoneId, editingTask?.id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("请输入任务名称");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        plannedDate: plannedDate || undefined,
        assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
        milestoneId: milestoneId || undefined,
        status,
      });
      onOpenChange(false);
    } catch {
      toast.error("创建任务失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignees = assignees.filter((user) =>
    user.userName.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{editingTask ? "编辑任务" : "创建任务"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 px-1 max-h-[60vh] overflow-y-auto">
          {/* 所属项目 - 仅当有项目列表时显示 */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>所属项目</Label>
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
                  {projectId
                    ? projects.find((p) => p.id === projectId)?.name
                    : "选择项目"}
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                            projectId === project.id && "bg-accent"
                          )}
                          onClick={() => {
                            setProjectId(project.id);
                            setMilestoneId(""); // 清空已选的里程碑
                          }}
                        >
                          <span className="text-sm">{project.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* 所属里程碑 - 当有项目选择时显示筛选后的里程碑 */}
          {filteredMilestones.length > 0 && (
            <div className="space-y-2">
              <Label>所属里程碑</Label>
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
                  {milestoneId
                    ? filteredMilestones.find((m) => m.id === milestoneId)?.name
                    : "选择里程碑（可选）"}
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                      {filteredMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                            milestoneId === milestone.id && "bg-accent"
                          )}
                          onClick={() => {
                            setMilestoneId(milestone.id);
                          }}
                        >
                          <span className="text-sm">{milestone.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* 任务名称 */}
          <div className="space-y-2">
            <Label>任务名称 *</Label>
            <Input
              placeholder="输入任务名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 任务说明 */}
          <div className="space-y-2">
            <Label>任务说明</Label>
            <Textarea
              placeholder="输入任务说明（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
            <Label>优先级</Label>
            <div className="flex gap-2">
                <div className="relative group">
                  <Button
                    variant={priority === "P0" ? "default" : "outline"}
                    size="sm"
                    className={priority === "P0" ? "bg-[#FF6231] hover:bg-[#FF6231]/90" : ""}
                    onClick={() => setPriority("P0")}
                  >
                    P0
                  </Button>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    紧急重要
                  </span>
                </div>
                <div className="relative group">
                  <Button
                    variant={priority === "P1" ? "default" : "outline"}
                    size="sm"
                    className={priority === "P1" ? "bg-[#25B079] hover:bg-[#25B079]/90" : ""}
                    onClick={() => setPriority("P1")}
                  >
                    P1
                  </Button>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    紧急不重要
                  </span>
                </div>
                <div className="relative group">
                  <Button
                    variant={priority === "P2" ? "default" : "outline"}
                    size="sm"
                    className={priority === "P2" ? "bg-[#637CFF] hover:bg-[#637CFF]/90" : ""}
                    onClick={() => setPriority("P2")}
                  >
                    P2
                  </Button>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    重要不紧急
                  </span>
                </div>
                <div className="relative group">
                  <Button
                    variant={priority === "P3" ? "default" : "outline"}
                    size="sm"
                    className={priority === "P3" ? "bg-[#9CA3AF] hover:bg-[#9CA3AF]/90" : ""}
                    onClick={() => setPriority("P3")}
                  >
                    P3
                  </Button>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    不重要不紧急
                  </span>
                </div>
              </div>
            </div>

            {/* 责任人 */}
            <div className="flex-1 space-y-2">
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
                  {selectedAssignees.length > 0
                    ? `已选择 ${selectedAssignees.length} 人`
                    : "选择责任人"}
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 overflow-hidden" align="start">
                  <Input
                    placeholder="搜索责任人..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="border-0 border-b rounded-none"
                  />
                  <ScrollArea className="h-[200px]">
                    <div className="p-1">
                      {filteredAssignees.length === 0 ? (
                        <p className="py-2 px-2 text-sm text-muted-foreground">未找到责任人</p>
                      ) : (
                        filteredAssignees.map((user) => {
                          const isSelected = selectedAssignees.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                                isSelected && "bg-accent"
                              )}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedAssignees(selectedAssignees.filter((id) => id !== user.id));
                                } else {
                                  setSelectedAssignees([...selectedAssignees, user.id]);
                                }
                              }}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                                isSelected ? "bg-[#637CFF] border-[#637CFF]" : "border-gray-300"
                              )}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-[#637CFF] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                {user.userName.charAt(0)}
                              </div>
                              <span className="text-sm">{user.userName}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{user.role}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {/* 已选责任人标签 */}
              {selectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedAssignees.map((id) => {
                    const user = assignees.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1 bg-[#637CFF]/10 text-[#637CFF] px-2 py-1 rounded-full text-xs"
                      >
                        <span>{user.userName}</span>
                        <button
                          onClick={() => setSelectedAssignees(selectedAssignees.filter((a) => a !== id))}
                          className="ml-0.5 hover:bg-[#637CFF]/20 rounded-full p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          {/* 计划完成节点 */}
          <div className="space-y-2">
            <Label>计划完成节点</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-start text-left font-normal"
                    />
                  }
                >
                  {plannedDate ? (
                    format(new Date(plannedDate), "yyyy-MM-dd")
                  ) : (
                    <span className="text-muted-foreground">选择日期</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={plannedDate ? new Date(plannedDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = plannedDate ? format(new Date(plannedDate), "HH:mm:ss") : "12:00:00";
                        setPlannedDate(format(date, "yyyy-MM-dd") + "T" + currentTime);
                      } else {
                        setPlannedDate("");
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                step="1"
                defaultValue="12:00:00"
                className="w-32"
                disabled={!plannedDate}
                value={plannedDate ? format(new Date(plannedDate), "HH:mm:ss") : ""}
                onChange={(e) => {
                  if (plannedDate) {
                    const datePart = format(new Date(plannedDate), "yyyy-MM-dd");
                    setPlannedDate(datePart + "T" + e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {/* 任务状态 */}
          <div className="space-y-2">
            <Label>任务状态</Label>
            <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E8EDEC] p-0.5">
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs rounded-md transition-all cursor-pointer flex-1",
                  status === "待开始"
                    ? "text-white bg-gray-400 "
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatus("待开始")}
              >
                待开始
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs rounded-md transition-all cursor-pointer flex-1",
                  status === "进行中"
                    ? "bg-[#637CFF] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatus("进行中")}
              >
                进行中
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs rounded-md transition-all cursor-pointer flex-1",
                  status === "有风险"
                    ? "bg-[#FF6231] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatus("有风险")}
              >
                有风险
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-xs rounded-md transition-all cursor-pointer flex-1",
                  status === "已完成"
                    ? "bg-[#25B079] text-white"
                    : "text-[#7E8485] hover:bg-gray-50"
                )}
                onClick={() => setStatus("已完成")}
              >
                已完成
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "创建中..." : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
