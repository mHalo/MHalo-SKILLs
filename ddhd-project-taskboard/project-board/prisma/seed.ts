import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清理旧数据
  await prisma.taskChangeLog.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.task.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.project.deleteMany()

  console.log('开始创建测试数据...')

  // 创建项目
  const project = await prisma.project.create({
    data: {
      name: 'XX品牌春季发布会',
      description: '2026年春季新品发布活动，包含线上直播和线下体验',
      type: '营销',
      status: '进行中',
      client: 'XX科技',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-15'),
    }
  })
  console.log('✅ 项目创建:', project.name)

  // 创建里程碑
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: project.id,
        name: '前期沟通与方案',
        description: '需求确认、方案设计',
        order: 1,
      }
    }),
    prisma.milestone.create({
      data: {
        projectId: project.id,
        name: '设计与制作',
        order: 2,
      }
    }),
    prisma.milestone.create({
      data: {
        projectId: project.id,
        name: '执行与落地',
        order: 3,
      }
    }),
  ])
  console.log('✅ 里程碑创建:', milestones.map(m => m.name).join(', '))

  // 创建任务
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        milestoneId: milestones[0].id,
        title: '主视觉设计',
        assigneeRole: '创作虾',
        assigneeName: '小A',
        deliverableType: '平面设计稿',
        priority: 'P0',
        plannedDate: new Date('2026-03-25'),
      }
    }),
    prisma.task.create({
      data: {
        milestoneId: milestones[0].id,
        title: '3D效果图',
        assigneeRole: '创作虾',
        assigneeName: '小B',
        deliverableType: '3D渲染图',
        priority: 'P0',
        plannedDate: new Date('2026-03-28'),
      }
    }),
    prisma.task.create({
      data: {
        milestoneId: milestones[0].id,
        title: '技术可行性研判',
        assigneeRole: '技术虾',
        assigneeName: '小C',
        deliverableType: '技术评估报告',
        priority: 'P1',
        plannedDate: new Date('2026-03-24'),
        status: '进行中',
      }
    }),
  ])
  console.log('✅ 任务创建:', tasks.map(t => t.title).join(', '))

  // 添加沟通记录
  await prisma.communication.create({
    data: {
      projectId: project.id,
      type: '电话',
      date: new Date(),
      participants: '客户张总、总指挥虾',
      summary: '确认活动基调为科技感，主色调使用品牌蓝，需要3D场景渲染',
      actionItems: JSON.stringify(['主视觉设计', '3D效果图']),
    }
  })
  console.log('✅ 沟通记录创建')

  // 添加日历事件
  await prisma.calendarEvent.create({
    data: {
      projectId: project.id,
      title: '方案汇报',
      eventType: '会议',
      eventDate: new Date('2026-03-28T14:00:00'),
      duration: 120,
      attendees: '客户张总、策划虾、创作虾',
      reminder: 60,
    }
  })
  console.log('✅ 日历事件创建')

  console.log('\n🎉 测试数据创建完成!')
  console.log(`项目ID: ${project.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
