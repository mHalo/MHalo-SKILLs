import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 基础用户类型（根据 select 定义）
interface UserInfo {
  id: string;
  userId: string;
  userName: string;
  avatar: string | null;
  role: string;
}

// 任务负责人
interface TaskAssigneeWithUser {
  id: string;
  taskId: string;
  userId: string;
  role: string | null;
  user: UserInfo;
}

// 交付物
interface Deliverable {
  id: string;
  taskId: string;
  name: string;
  type: string;
  path: string;
  createdAt: Date;
}

// 任务变更日志
interface TaskChangeLog {
  id: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

// 子任务（递归引用主Task类型，需要在主Task后定义）
interface SubTask {
  id: string;
  title: string;
  description: string | null;
  assigneeRole: string | null;
  assigneeName: string | null;
  deliverableType: string | null;
  status: string;
  priority: string;
  plannedDate: Date | null;
  actualDate: Date | null;
  assignees: TaskAssigneeWithUser[];
}

// 任务
interface Task {
  id: string;
  title: string;
  description: string | null;
  assigneeRole: string | null;
  assigneeName: string | null;
  deliverableType: string | null;
  status: string;
  priority: string;
  plannedDate: Date | null;
  actualDate: Date | null;
  assignees: TaskAssigneeWithUser[];
  changeLogs: TaskChangeLog[];
  subTasks: SubTask[];
  deliverables: Deliverable[];
}

// 里程碑
interface Milestone {
  id: string;
  name: string;
  description: string | null;
  deadline: Date | null;
  status: string;
  order: number;
  tasks: Task[];
}

// 日历事件
interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  eventType: string;
  eventDate: Date;
  duration: number | null;
  attendees: string | null;
  reminder: number | null;
  notes: string | null;
  createdAt: Date;
}

// 沟通记录
interface Communication {
  id: string;
  projectId: string;
  type: string;
  date: Date;
  participants: string | null;
  summary: string;
  recordingPath: string | null;
  actionItems: string | null;
  createdAt: Date;
}

// 项目成员
interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  role: string | null;
  joinedAt: Date;
  user: UserInfo;
}

// 项目（包含所有关联数据）
interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  client: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMemberWithUser[];
  milestones: Milestone[];
  calendarEvents: CalendarEvent[];
  communications: Communication[];
}

// GET /api/snapshot/project/[id] - 获取项目完整快照（Agent首选）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userId: true,
                userName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { createdAt: "asc" },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        userId: true,
                        userName: true,
                        avatar: true,
                        role: true,
                      },
                    },
                  },
                },
                changeLogs: {
                  orderBy: { changedAt: "desc" },
                  take: 5,
                },
                subTasks: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    assignees: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            userId: true,
                            userName: true,
                            avatar: true,
                            role: true,
                          },
                        },
                      },
                    },
                  },
                },
                deliverables: true,
              },
            },
          },
        },
        calendarEvents: {
          where: {
            eventDate: {
              gte: new Date(),
            },
          },
          orderBy: { eventDate: "asc" },
          take: 10,
        },
        communications: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "项目不存在" },
        { status: 404 }
      );
    }

    // 类型断言为完整项目类型
    const typedProject = project as unknown as ProjectWithRelations;

    // 统计数据
    const allTasks = typedProject.milestones.flatMap((m: Milestone) => m.tasks);
    const allSubTasks = allTasks.flatMap((t: Task) => t.subTasks || []);
    const totalTasks = allTasks.length + allSubTasks.length;
    const completedTasks = [...allTasks, ...allSubTasks].filter(
      (t: Task | SubTask) => t.status === "已完成"
    ).length;
    const inProgressTasks = [...allTasks, ...allSubTasks].filter(
      (t: Task | SubTask) => t.status === "进行中"
    ).length;

    // 提取所有参与项目的用户
    const memberMap = new Map<string, UserInfo>();
    typedProject.members.forEach((m: ProjectMemberWithUser) => {
      memberMap.set(m.user.id, m.user);
    });
    // 从任务中提取负责人
    [...allTasks, ...allSubTasks].forEach((t: Task | SubTask) => {
      t.assignees?.forEach((a: TaskAssigneeWithUser) => {
        if (a.user) {
          memberMap.set(a.user.id, a.user);
        }
      });
    });
    const allMembers = Array.from(memberMap.values());

    const snapshot = {
      project: {
        id: typedProject.id,
        name: typedProject.name,
        description: typedProject.description,
        type: typedProject.type,
        status: typedProject.status,
        client: typedProject.client,
        startDate: typedProject.startDate,
        endDate: typedProject.endDate,
        createdAt: typedProject.createdAt,
        updatedAt: typedProject.updatedAt,
      },
      statistics: {
        totalMilestones: typedProject.milestones.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        memberCount: allMembers.length,
      },
      members: allMembers,
      milestones: typedProject.milestones.map((milestone: Milestone) => ({
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        deadline: milestone.deadline,
        status: milestone.status,
        order: milestone.order,
        tasks: milestone.tasks.map((task: Task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignees: task.assignees.map((a: TaskAssigneeWithUser) => ({
            userId: a.user.userId,
            userName: a.user.userName,
            avatar: a.user.avatar,
            role: a.user.role,
            taskRole: a.role,
          })),
          // 兼容旧字段
          assigneeRole: task.assigneeRole,
          assigneeName: task.assigneeName,
          deliverableType: task.deliverableType,
          status: task.status,
          priority: task.priority,
          plannedDate: task.plannedDate,
          actualDate: task.actualDate,
          changeLogs: task.changeLogs,
          subTasks: task.subTasks?.map((sub: SubTask) => ({
            id: sub.id,
            title: sub.title,
            assignees: sub.assignees.map((a: TaskAssigneeWithUser) => ({
              userId: a.user.userId,
              userName: a.user.userName,
              avatar: a.user.avatar,
              role: a.user.role,
            })),
            status: sub.status,
            priority: sub.priority,
            plannedDate: sub.plannedDate,
          })),
          deliverables: task.deliverables,
        })),
      })),
      upcomingEvents: typedProject.calendarEvents,
      recentCommunications: typedProject.communications,
    };

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    console.error("获取项目快照失败:", error);
    return NextResponse.json(
      { error: "获取项目快照失败" },
      { status: 500 }
    );
  }
}
