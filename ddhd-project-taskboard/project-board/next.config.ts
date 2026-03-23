import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 仪表板
      {
        source: "/dashboard",
        destination: "/pages/dashboard",
      },
      // 项目列表
      {
        source: "/projects-list",
        destination: "/pages/projects-list",
      },
      // 日历
      {
        source: "/calendar",
        destination: "/pages/calendar",
      },
      // 人员
      {
        source: "/people",
        destination: "/pages/people",
      },
      // 关键任务
      {
        source: "/priority",
        destination: "/pages/priority",
      },
      // 项目详情
      {
        source: "/projects/:id",
        destination: "/pages/projects/:id",
      },
      // 新建项目
      {
        source: "/projects/new",
        destination: "/pages/projects/new",
      },
    ];
  },
};

export default nextConfig;
