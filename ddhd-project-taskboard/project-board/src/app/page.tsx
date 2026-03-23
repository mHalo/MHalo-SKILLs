import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users } from "lucide-react";
import Link from "next/link";

async function getProjects() {
  return await prisma.project.findMany({
    include: {
      _count: {
        select: {
          milestones: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function Home() {
  const projects = await getProjects();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "进行中":
        return "bg-blue-100 text-blue-800";
      case "已完成":
        return "bg-green-100 text-green-800";
      case "暂停":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">DDHD 项目看板</h1>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
              <div className="text-sm text-gray-500">总项目数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter((p) => p.status === "进行中").length}
              </div>
              <div className="text-sm text-gray-500">进行中</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter((p) => p.status === "已完成").length}
              </div>
              <div className="text-sm text-gray-500">已完成</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {projects.filter((p) => p.status === "暂停").length}
              </div>
              <div className="text-sm text-gray-500">暂停</div>
            </CardContent>
          </Card>
        </div>

        {/* 项目列表 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">项目列表</h2>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Plus className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
              <p className="text-gray-500 mb-4">创建您的第一个项目开始管理</p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新建项目
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <Link href={`/projects/${project.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <span className="text-xs text-gray-400">{project.type}</span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "暂无描述"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {project._count.milestones} 个里程碑
                        </span>
                      </div>
                      {project.client && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.client}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
