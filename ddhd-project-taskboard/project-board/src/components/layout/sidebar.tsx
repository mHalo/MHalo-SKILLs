"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "仪表盘",
    href: "/",
    description: "项目看板整体分配及执行状况",
  },
  {
    icon: FolderKanban,
    label: "项目列表",
    href: "/projects-list",
    description: "所有项目的详细列表",
  },
  {
    icon: CalendarDays,
    label: "日历看板",
    href: "/calendar",
    description: "本周项目任务时间轴",
  },
  {
    icon: Users,
    label: "人员看板",
    href: "/people",
    description: "按责任人查看任务",
  },
  {
    icon: AlertCircle,
    label: "关键任务看板",
    href: "/priority",
    description: "按紧急重要程度分类",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-72 bg-slate-900 text-white border-r border-slate-800",
        className
      )}
    >
      {/* 顶部系统名称 */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="block">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            DDHD项目看板
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            项目管理协作平台
          </p>
        </Link>
      </div>

      {/* 新建项目按钮 */}
      <div className="p-4">
        <Link href="/projects/new" className="block">
          <Button
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base gap-2 shadow-lg shadow-blue-900/50"
          >
            <Plus className="w-5 h-5" />
            新建项目
          </Button>
        </Link>
      </div>

      {/* 菜单项 */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mt-0.5 shrink-0",
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm",
                  isActive ? "text-white" : "text-slate-200"
                )}>
                  {item.label}
                </div>
                <div className={cn(
                  "text-xs mt-0.5 leading-relaxed",
                  isActive ? "text-blue-100" : "text-slate-500 group-hover:text-slate-400"
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 底部系统版本 */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>系统版本</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
