"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Flag, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  plannedDate: string | null;
  milestone: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
    };
  };
  assignees: {
    user: {
      userName: string;
      avatar: string | null;
    };
  }[];
}

export default function PriorityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      // 获取所有项目
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      
      const allTasks: Task[] = [];
      
      // 遍历每个项目获取任务
      for (const project of projectsData.data || []) {
        const snapshotRes = await fetch(`/api/snapshot/project/${project.id}`);
        const snapshotData = await snapshotRes.json();
        
        if (snapshotData.data?.milestones) {
          snapshotData.data.milestones.forEach((milestone: any) => {
            milestone.tasks?.forEach((task: Task) => {
              allTasks.push({
                ...task,
                milestone: {
                  ...task.milestone,
                  project: { id: project.id, name: project.name },
                },
              });
            });
          });
        }
      }
      
      setTasks(allTasks);
    } catch (error) {
      toast.error("获取任务数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 四象限分类
  const categorizeTasks = () => {
    return {
      // 紧急重要: P0 且 进行中/待开始
      urgentImportant: tasks.filter(t => 
        t.priority === "P0" && 
        (t.status === "进行中" || t.status === "待开始" || t.status === "有风险")
      ),
      // 紧急不重要: P1 且 进行中/待开始
      urgentNotImportant: tasks.filter(t => 
        t.priority === "P1" && 
        (t.status === "进行中" || t.status === "待开始")
      ),
      // 重要不紧急: P0 且 已完成
      importantNotUrgent: tasks.filter(t => 
        t.priority === "P0" && 
        t.status === "已完成"
      ),
      // 不紧急不重要: P2
      notUrgentNotImportant: tasks.filter(t => 
        t.priority === "P2" || 
        (t.priority === "P1" && t.status === "已完成")
      ),
    };
  };

  const categories = categorizeTasks();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已完成": return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />已完成</Badge>;
      case "进行中": return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />进行中</Badge>;
      case "有风险": return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />有风险</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
        <Link href={`/projects/${task.milestone.project.id}`}>
          <ArrowUpRight className="w-4 h-4 text-gray-400 hover:text-blue-600" />
        </Link>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {getStatusBadge(task.status)}
        <Badge variant="outline" className={
          task.priority === "P0" ? "border-red-200 text-red-600" :
          task.priority === "P1" ? "border-orange-200 text-orange-600" :
          "border-gray-200 text-gray-600"
        }>
          {task.priority}
        </Badge>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {task.milestone.project.name} · {task.milestone.name}
      </div>
      <div className="flex items-center gap-1">
        {task.assignees?.map((assignee, idx) => (
          <div 
            key={idx}
            className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs"
            title={assignee.user.userName}
          >
            {assignee.user.userName?.charAt(0) || "?"}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">关键任务看板</h1>
        <p className="text-gray-500 mt-1">按紧急重要程度分类管理任务</p>
      </div>

      {/* 四象限 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 紧急重要 */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">紧急重要</CardTitle>
              <Badge className="bg-red-600 text-white ml-auto">
                {categories.urgentImportant.length}
              </Badge>
            </div>
            <p className="text-sm text-red-600">立即处理 · P0优先级进行中任务</p>
          </CardHeader>
          <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {categories.urgentImportant.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无紧急重要任务</p>
              ) : (
                categories.urgentImportant.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 紧急不重要 */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-900">紧急不重要</CardTitle>
              <Badge className="bg-orange-600 text-white ml-auto">
                {categories.urgentNotImportant.length}
              </Badge>
            </div>
            <p className="text-sm text-orange-600">尽快处理 · P1优先级进行中任务</p>
          </CardHeader>
          <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {categories.urgentNotImportant.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无紧急不重要任务</p>
              ) : (
                categories.urgentNotImportant.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 重要不紧急 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">重要不紧急</CardTitle>
              <Badge className="bg-blue-600 text-white ml-auto">
                {categories.importantNotUrgent.length}
              </Badge>
            </div>
            <p className="text-sm text-blue-600">计划处理 · P0已完成任务</p>
          </CardHeader>
          <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {categories.importantNotUrgent.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无重要不紧急任务</p>
              ) : (
                categories.importantNotUrgent.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 不紧急不重要 */}
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-gray-900">不紧急不重要</CardTitle>
              <Badge className="bg-gray-600 text-white ml-auto">
                {categories.notUrgentNotImportant.length}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">低优先级 · P2或已完成P1任务</p>
          </CardHeader>
          <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {categories.notUrgentNotImportant.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无不紧急不重要任务</p>
              ) : (
                categories.notUrgentNotImportant.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
