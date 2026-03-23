"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  AlertCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SidebarProps {
  className?: string;
}

const mainMenuItems = [
  {
    icon: LayoutDashboard,
    label: "仪表盘",
    href: "/dashboard",
  },
  {
    icon: FolderKanban,
    label: "项目列表",
    href: "/projects-list",
  },
  {
    icon: CalendarDays,
    label: "日历",
    href: "/calendar",
  },
  {
    icon: Users,
    label: "人员",
    href: "/people",
  },
  {
    icon: AlertCircle,
    label: "关键",
    href: "/priority",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    type: "营销",
    client: "",
    description: "",
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("请输入项目名称");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("项目创建成功");
        setIsCreateDialogOpen(false);
        setNewProject({ name: "", type: "营销", client: "", description: "" });
        // 跳转到新项目详情页
        router.push(`/projects/${data.data.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "创建项目失败");
      }
    } catch {
      toast.error("创建项目失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-screen w-20 bg-white border-r border-brand-border shrink-0 dark:bg-gray-900 dark:border-gray-800",
          className
        )}
      >
        {/* Logo区域 */}
        <div className="h-16 flex items-center justify-center border-b border-brand-border dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
          </Link>
        </div>

        {/* 主菜单 - 上下居中对齐 */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-1 px-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-3 px-2 rounded-lg transition-all duration-200 gap-1",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-brand-secondary hover:bg-brand-main hover:text-brand-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                )}
              >
                <Icon size={22} strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 新建项目按钮 - 放在最底部 */}
        <div className="p-3 border-t border-brand-border dark:border-gray-800">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full h-10 bg-brand-primary hover:opacity-90 text-white font-medium rounded-lg gap-0 shadow-soft transition-all"
          >
            <Plus size={20} strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* 创建项目弹窗 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                placeholder="输入项目名称"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">项目类型</Label>
              <Select
                value={newProject.type}
                onValueChange={(v) =>
                  setNewProject({ ...newProject, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="营销">营销</SelectItem>
                  <SelectItem value="活动">活动</SelectItem>
                  <SelectItem value="内容制作">内容制作</SelectItem>
                  <SelectItem value="开发">开发</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">客户名称</Label>
              <Input
                id="client"
                placeholder="输入客户名称（可选）"
                value={newProject.client}
                onChange={(e) =>
                  setNewProject({ ...newProject, client: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Input
                id="description"
                placeholder="输入项目描述（可选）"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleCreateProject} disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
