"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

// ============= 类型定义 =============
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

interface TaskFormData {
  title: string;
  description?: string;
  priority: string;
  plannedDate?: string;
  assigneeIds?: string[];
  milestoneId?: string;
  status?: string;
}

interface EditingTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  plannedDate?: string;
  assigneeIds?: string[];
  milestoneId?: string;
  status?: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: TaskFormData) => Promise<void> | void;
  milestones?: Milestone[];
  projects?: Project[];
  defaultPriority?: string;
  defaultMilestoneId?: string;
  submitText?: string;
  editingTask?: EditingTask;
}

// ============= 表单状态 Hook =============
function useTaskForm({
  open,
  editingTask,
  milestones,
  projects,
  defaultPriority,
  defaultMilestoneId,
}: {
  open: boolean;
  editingTask?: EditingTask;
  milestones: Milestone[];
  projects: Project[];
  defaultPriority: string;
  defaultMilestoneId: string;
}) {
  // 表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(defaultPriority);
  const [plannedDate, setPlannedDate] = useState("");
  const [projectId, setProjectId] = useState(""); // 用户选择的项目
  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [status, setStatus] = useState("待开始");

  // 用户列表
  const [assignees, setAssignees] = useState<User[]>([]);

  // 获取用户列表
  useEffect(() => {
    if (!open) return;

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
    fetchAssignees();
  }, [open]);

  // 初始化表单数据
  useEffect(() => {
    if (!open) return;

    if (editingTask) {
      // 编辑模式：填充已有数据
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setPriority(editingTask.priority);
      setPlannedDate(editingTask.plannedDate || "");
      setSelectedAssignees(editingTask.assigneeIds || []);
      setStatus(editingTask.status || "待开始");
      setMilestoneId(editingTask.milestoneId || "");
    } else {
      // 创建模式：重置为默认值
      setTitle("");
      setDescription("");
      setPriority(defaultPriority);
      setPlannedDate("");
      setMilestoneId(defaultMilestoneId);
      setSelectedAssignees([]);
      setStatus("待开始");
    }
    setAssigneeSearch("");
  }, [open, editingTask?.id, defaultPriority, defaultMilestoneId, editingTask]);

  // 根据 milestoneId 计算 projectId（通过查找包含该里程碑的项目）
  // 编辑模式下，始终从 milestoneId 派生；创建模式下，只在未选择项目时派生
  const computedProjectId = useMemo(() => {
    if (!milestoneId) return "";
    const project = projects.find(p =>
      p.milestones?.some((m: Milestone) => m.id === milestoneId)
    );
    return project?.id || "";
  }, [milestoneId, projects]);

  // 编辑模式下，始终同步 projectId 从 computedProjectId
  // 创建模式下，只有在用户未选择项目时才同步
  useEffect(() => {
    const shouldSync = editingTask?.milestoneId
      ? true  // 编辑模式：始终同步
      : !projectId;  // 创建模式：仅当未选择项目时同步

    if (computedProjectId && shouldSync) {
      setProjectId(computedProjectId);
    }
  }, [editingTask?.milestoneId, computedProjectId]);

  // 根据选中的项目筛选里程碑
  const filteredMilestones = useMemo(() => {
    if (projectId) {
      return milestones.filter((m) => {
        const project = projects.find((p) => p.id === projectId);
        return project?.milestones?.some((pm: Milestone) => pm.id === m.id);
      });
    }
    return milestones;
  }, [projectId, milestones, projects]);

  // 过滤后的责任人列表
  const filteredAssignees = assignees.filter((user) =>
    user.userName.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  // 获取表单数据
  const getFormData = useCallback((): TaskFormData => ({
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    plannedDate: plannedDate || undefined,
    assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
    milestoneId: milestoneId || undefined,
    status,
  }), [title, description, priority, plannedDate, selectedAssignees, milestoneId, status]);

  // 重置表单
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority(defaultPriority);
    setPlannedDate("");
    setMilestoneId(defaultMilestoneId);
    setSelectedAssignees([]);
    setStatus("待开始");
    setProjectId("");
    setAssigneeSearch("");
  }, [defaultPriority, defaultMilestoneId]);

  return {
    // 状态
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    plannedDate, setPlannedDate,
    projectId, setProjectId,
    milestoneId, setMilestoneId,
    selectedAssignees, setSelectedAssignees,
    assigneeSearch, setAssigneeSearch,
    status, setStatus,
    assignees,
    filteredMilestones,
    filteredAssignees,
    // 方法
    getFormData,
    resetForm,
  };
}

// ============= 主组件 =============
export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  milestones = [],
  projects = [],
  defaultPriority = "P1",
  defaultMilestoneId = "",
  submitText,
  editingTask,
}: CreateTaskDialogProps) {
  const isEditMode = !!editingTask;
  const actualSubmitText = submitText || (isEditMode ? "保存" : "创建");

  const {
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    plannedDate, setPlannedDate,
    projectId, setProjectId,
    milestoneId, setMilestoneId,
    selectedAssignees, setSelectedAssignees,
    assigneeSearch, setAssigneeSearch,
    status, setStatus,
    assignees,
    filteredMilestones,
    filteredAssignees,
    getFormData,
  } = useTaskForm({
    open,
    editingTask,
    milestones,
    projects,
    defaultPriority,
    defaultMilestoneId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("请输入任务名称");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(getFormData());
      onOpenChange(false);
    } catch {
      toast.error(isEditMode ? "更新任务失败" : "创建任务失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "编辑任务" : "创建任务"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2 px-1 max-h-[60vh] overflow-y-auto">
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
                  <ScrollArea className="h-[200px]">
                    <div className="p-1">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className={cn(
                            "flex items-center px-2 py-1 rounded-md cursor-pointer hover:bg-accent",
                            projectId === project.id && "bg-accent",
                            "mb-1"
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
                            milestoneId === milestone.id && "bg-accent",
                            "mb-1 last-of-type:mb-0"
                          )}
                          onClick={() => setMilestoneId(milestone.id)}
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
          <PrioritySelector priority={priority} onPriorityChange={setPriority} />

          {/* 责任人 */}
          <AssigneeSelector
            assignees={assignees}
            filteredAssignees={filteredAssignees}
            selectedAssignees={selectedAssignees}
            assigneeSearch={assigneeSearch}
            assigneePopoverOpen={assigneePopoverOpen}
            onAssigneeSearchChange={setAssigneeSearch}
            onAssigneePopoverOpenChange={setAssigneePopoverOpen}
            onToggleAssignee={(userId) => {
              if (selectedAssignees.includes(userId)) {
                setSelectedAssignees(selectedAssignees.filter((id) => id !== userId));
              } else {
                setSelectedAssignees([...selectedAssignees, userId]);
              }
            }}
            onRemoveAssignee={(userId) => {
              setSelectedAssignees(selectedAssignees.filter((id) => id !== userId));
            }}
          />

          {/* 计划完成节点 */}
          <PlannedDateSelector
            plannedDate={plannedDate}
            onPlannedDateChange={setPlannedDate}
          />

          {/* 任务状态 */}
          <StatusSelector status={status} onStatusChange={setStatus} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "提交中..." : actualSubmitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= 子组件 =============
function PrioritySelector({
  priority,
  onPriorityChange,
}: {
  priority: string;
  onPriorityChange: (p: string) => void;
}) {
  const priorities = [
    { value: "P0", label: "P0", color: "bg-[#FF6231]", tooltip: "紧急重要" },
    { value: "P1", label: "P1", color: "bg-[#25B079]", tooltip: "紧急不重要" },
    { value: "P2", label: "P2", color: "bg-[#637CFF]", tooltip: "重要不紧急" },
    { value: "P3", label: "P3", color: "bg-[#9CA3AF]", tooltip: "不重要不紧急" },
  ];

  return (
    <div className="space-y-2">
      <Label>优先级</Label>
      <div className="flex gap-2">
        {priorities.map((p) => (
          <div key={p.value} className="relative group">
            <Button
              variant={priority === p.value ? "default" : "outline"}
              size="sm"
              className={priority === p.value ? `${p.color} hover:${p.color}/90` : ""}
              onClick={() => onPriorityChange(p.value)}
            >
              {p.label}
            </Button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {p.tooltip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssigneeSelector({
  assignees,
  filteredAssignees,
  selectedAssignees,
  assigneeSearch,
  assigneePopoverOpen,
  onAssigneeSearchChange,
  onAssigneePopoverOpenChange,
  onToggleAssignee,
  onRemoveAssignee,
}: {
  assignees: User[];
  filteredAssignees: User[];
  selectedAssignees: string[];
  assigneeSearch: string;
  assigneePopoverOpen: boolean;
  onAssigneeSearchChange: (s: string) => void;
  onAssigneePopoverOpenChange: (o: boolean) => void;
  onToggleAssignee: (userId: string) => void;
  onRemoveAssignee: (userId: string) => void;
}) {
  return (
    <div className="flex-1 space-y-2">
      <Label>责任人</Label>
      <Popover open={assigneePopoverOpen} onOpenChange={onAssigneePopoverOpenChange}>
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
            onChange={(e) => onAssigneeSearchChange(e.target.value)}
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
                        "flex items-center gap-2 px-1 py-1 mt-0.5 rounded-md cursor-pointer hover:bg-accent",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => onToggleAssignee(user.id)}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                          isSelected ? "bg-[#637CFF] border-[#637CFF]" : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#637CFF] flex items-center justify-center text-white text-xs font-medium shrink-0">
                        {user.userName.charAt(0)}
                      </div>
                      <span className="text-xs">{user.userName}</span>
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
        <div className="flex flex-wrap gap-1">
          {selectedAssignees.map((id) => {
            const user = assignees.find((u) => u.id === id);
            if (!user) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-1 bg-[#637CFF]/10 text-[#637CFF] px-1 py-0.5 rounded-full text-xs"
              >
                <span>{user.userName}</span>
                <button
                  onClick={() => onRemoveAssignee(id)}
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
  );
}

function PlannedDateSelector({
  plannedDate,
  onPlannedDateChange,
}: {
  plannedDate: string;
  onPlannedDateChange: (d: string) => void;
}) {
  return (
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
                  onPlannedDateChange(format(date, "yyyy-MM-dd") + "T" + currentTime);
                } else {
                  onPlannedDateChange("");
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
              onPlannedDateChange(datePart + "T" + e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
}

function StatusSelector({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (s: string) => void;
}) {
  const statuses = [
    { value: "待开始", color: "bg-gray-400" },
    { value: "进行中", color: "bg-[#637CFF]" },
    { value: "有风险", color: "bg-[#FF6231]" },
    { value: "已完成", color: "bg-[#25B079]" },
  ];

  return (
    <div className="space-y-2">
      <Label>任务状态</Label>
      <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E8EDEC] p-0.5">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer flex-1",
              status === s.value
                ? `${s.color} text-white`
                : "text-[#7E8485] hover:bg-gray-50"
            )}
            onClick={() => onStatusChange(s.value)}
          >
            {s.value}
          </button>
        ))}
      </div>
    </div>
  );
}
