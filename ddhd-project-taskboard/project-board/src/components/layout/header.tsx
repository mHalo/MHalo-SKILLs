"use client";

import { useState, useEffect } from "react";
import { Search, Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // 避免 hydration 不匹配 - 使用微任务延迟 setState
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
      {/* 左侧：搜索框 */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search 
            size={18} 
            strokeWidth={1.5} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" 
          />
          <Input
            type="text"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 h-10 rounded-md border-brand-border bg-brand-main focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 右侧：主题切换 + 设置 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-md hover:bg-brand-main"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun size={20} strokeWidth={1.5} className="text-brand-secondary" />
            ) : (
              <Moon size={20} strokeWidth={1.5} className="text-brand-secondary" />
            )
          ) : (
            <Moon size={20} strokeWidth={1.5} className="text-brand-secondary" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-md hover:bg-brand-main"
        >
          <Settings size={20} strokeWidth={1.5} className="text-brand-secondary" />
        </Button>
      </div>
    </header>
  );
}
