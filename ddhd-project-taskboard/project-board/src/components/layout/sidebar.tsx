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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    href: "/dashboard/projects-list",
  },
  {
    icon: CalendarDays,
    label: "日历看板",
    href: "/dashboard/calendar",
  },
  {
    icon: Users,
    label: "人员看板",
    href: "/dashboard/people",
  },
  {
    icon: AlertCircle,
    label: "关键任务",
    href: "/dashboard/priority",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-64 bg-white border-r border-brand-border",
        className
      )}
    >
      {/* Logo区域 */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-primary">DDHD</h1>
            <p className="text-xs text-brand-secondary">项目看板</p>
          </div>
        </Link>
      </div>

      {/* 新建项目按钮 */}
      <div className="px-4 mb-6">
        <Link href="/dashboard/projects/new" className="block">
          <Button
            className="w-full h-11 bg-brand-primary hover:opacity-90 text-white font-medium rounded-md gap-2 shadow-soft transition-all"
          >
            <Plus size={20} strokeWidth={1.5} />
            新建项目
          </Button>
        </Link>
      </div>

      {/* 主菜单 */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="text-xs font-semibold text-brand-secondary uppercase tracking-wider px-3 mb-3">
          主菜单
        </div>
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                isActive
                  ? "nav-item-active font-medium"
                  : "text-brand-secondary hover:bg-brand-main hover:text-brand-primary"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-brand-main text-brand-secondary group-hover:bg-white group-hover:shadow-card"
              )}>
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部设置 */}
      <div className="p-4 border-t border-brand-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-brand-secondary hover:bg-brand-main hover:text-brand-primary transition-all w-full">
          <div className="w-9 h-9 rounded-md bg-brand-main flex items-center justify-center">
            <Settings size={20} strokeWidth={1.5} />
          </div>
          <span className="text-sm">设置</span>
        </button>
        
        <div className="mt-4 pt-4 border-t border-brand-border">
          <div className="flex items-center justify-between text-xs text-brand-secondary px-3">
            <span>版本</span>
            <span className="font-mono bg-brand-main px-2 py-0.5 rounded">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
