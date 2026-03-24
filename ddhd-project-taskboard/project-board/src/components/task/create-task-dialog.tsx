"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
    assigneeId?: string;
    milestoneId?: string;
  }) => Promise<void> | void;
  milestones?: Milestone[];
  defaultPriority?: string;
  defaultMilestoneId?: string;
  submitText?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  milestones = [],
  defaultPriority = "P1",
  defaultMilestoneId = "",
  submitText = "创建",
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(defaultPriority);
  const [plannedDate, setPlannedDate] = useState("");
  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 重置表单
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority(defaultPriority);
      setPlannedDate("");
      setMilestoneId(defaultMilestoneId);
      setSelectedAssignee("");
      setAssigneeSearch("");
    }
  }, [open, defaultPriority, defaultMilestoneId]);

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
        assigneeId: selectedAssignee || undefined,
        milestoneId: milestoneId || undefined,
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
          <DialogTitle>创建任务</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* 所属里程碑 - 仅当有里程碑列表时显示 */}
          {milestones.length > 0 && (
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
                    ? milestones.find((m) => m.id === milestoneId)?.name
                    : "选择里程碑（可选）"}
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                      {milestones.map((milestone) => (
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
              <Button
                variant={priority === "P0" ? "default" : "outline"}
                size="sm"
                className={priority === "P0" ? "bg-[#FF6231] hover:bg-[#FF6231]/90" : ""}
                onClick={() => setPriority("P0")}
              >
                P0
              </Button>
              <Button
                variant={priority === "P1" ? "default" : "outline"}
                size="sm"
                className={priority === "P1" ? "bg-[#25B079] hover:bg-[#25B079]/90" : ""}
                onClick={() => setPriority("P1")}
              >
                P1
              </Button>
              <Button
                variant={priority === "P2" ? "default" : "outline"}
                size="sm"
                className={priority === "P2" ? "bg-[#637CFF] hover:bg-[#637CFF]/90" : ""}
                onClick={() => setPriority("P2")}
              >
                P2
              </Button>
            </div>
          </div>

          {/* 责任人 */}
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
                {selectedAssignee
                  ? assignees.find((u) => u.id === selectedAssignee)?.userName
                  : "选择责任人（可选）"}
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

          {/* 计划日期 */}
          <div className="space-y-2">
            <Label>计划日期</Label>
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
                {plannedDate ? (
                  format(new Date(plannedDate), "yyyy-MM-dd")
                ) : (
                  <span className="text-muted-foreground">选择日期（可选）</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={plannedDate ? new Date(plannedDate) : undefined}
                  onSelect={(date) => setPlannedDate(date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
