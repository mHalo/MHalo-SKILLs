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

const mainMenuItems = [
  {
    icon: LayoutDashboard,
    label: "仪表盘",
    href: "/pages/dashboard",
  },
  {
    icon: FolderKanban,
    label: "项目列表",
    href: "/pages/projects-list",
  },
  {
    icon: CalendarDays,
    label: "日历",
    href: "/pages/calendar",
  },
  {
    icon: Users,
    label: "人员",
    href: "/pages/people",
  },
  {
    icon: AlertCircle,
    label: "关键",
    href: "/pages/priority",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-20 bg-white border-r border-brand-border shrink-0",
        className
      )}
    >
      {/* Logo区域 */}
      <div className="h-16 flex items-center justify-center border-b border-brand-border">
        <Link href="/pages/dashboard" className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
        </Link>
      </div>

      {/* 新建项目按钮 */}
      <div className="p-3">
        <Link href="/pages/projects/new" className="block">
          <Button
            className="w-full h-10 bg-brand-primary hover:opacity-90 text-white font-medium rounded-lg gap-0 shadow-soft transition-all"
          >
            <Plus size={20} strokeWidth={1.5} />
          </Button>
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
                  : "text-brand-secondary hover:bg-brand-main hover:text-brand-primary"
              )}
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
