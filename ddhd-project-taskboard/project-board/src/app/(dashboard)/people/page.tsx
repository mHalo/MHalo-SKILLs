"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CheckCircle2, Clock, AlertCircle, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface User {
  id: string;
  userId: string;
  userName: string;
  avatar: string | null;
  role: string;
}

interface UserWithTasks extends User {
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    atRiskTasks: number;
  };
  projects: {
    id: string;
    name: string;
    status: string;
  }[];
}

export default function PeoplePage() {
  const [users, setUsers] = useState<UserWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 获取所有用户
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      
      if (usersData.data) {
        // 获取每个用户的项目和任务详情
        const usersWithDetails = await Promise.all(
          usersData.data.map(async (user: User) => {
            const projectsRes = await fetch(`/api/users/${user.userId}/projects`);
            const projectsData = await projectsRes.json();
            return {
              ...user,
              stats: projectsData.data?.stats || {
                totalTasks: 0,
                completedTasks: 0,
                inProgressTasks: 0,
                atRiskTasks: 0,
              },
              projects: projectsData.data?.projects || [],
            };
          })
        );
        setUsers(usersWithDetails);
      }
    } catch (error) {
      toast.error("获取人员数据失败");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "总指挥虾": return "bg-purple-100 text-purple-800";
      case "策划虾": return "bg-blue-100 text-blue-800";
      case "创作虾": return "bg-pink-100 text-pink-800";
      case "技术虾": return "bg-green-100 text-green-800";
      case "运营虾": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">人员看板</h1>
        <p className="text-gray-500 mt-1">按责任人查看任务分配及执行情况</p>
      </div>

      {/* 人员卡片网格 */}
      {users.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无人员</h3>
            <p className="text-gray-500">请先添加负责人</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {user.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.userName}</CardTitle>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* 任务统计 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.stats.totalTasks}
                    </div>
                    <div className="text-xs text-blue-600">总任务</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {user.stats.completedTasks}
                    </div>
                    <div className="text-xs text-green-600">已完成</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {user.stats.inProgressTasks}
                    </div>
                    <div className="text-xs text-yellow-600">进行中</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {user.stats.atRiskTasks}
                    </div>
                    <div className="text-xs text-red-600">有风险</div>
                  </div>
                </div>

                {/* 参与的项目 */}
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-500 mb-2">参与项目</div>
                  <div className="space-y-1">
                    {user.projects.length === 0 ? (
                      <span className="text-sm text-gray-400">暂无项目</span>
                    ) : (
                      user.projects.slice(0, 3).map(project => (
                        <Link 
                          key={project.id} 
                          href={`/projects/${project.id}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <FolderOpen className="w-4 h-4" />
                          {project.name}
                        </Link>
                      ))
                    )}
                    {user.projects.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{user.projects.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
