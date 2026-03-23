"use client";

import { Sidebar } from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* 左侧菜单 */}
      <Sidebar />
      
      {/* 右侧内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
