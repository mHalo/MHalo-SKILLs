import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清理旧数据
  await prisma.taskChangeLog.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.task.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  console.log('开始创建测试数据...')

  // 创建用户
  const users = await Promise.all([
    prisma.user.create({
      data: { userId: 'u001', userName: '小A', role: '创作虾', avatar: null }
    }),
    prisma.user.create({
      data: { userId: 'u002', userName: '小B', role: '创作虾', avatar: null }
    }),
    prisma.user.create({
      data: { userId: 'u003', userName: '小C', role: '技术虾', avatar: null }
    }),
    prisma.user.create({
      data: { userId: 'u004', userName: '小D', role: '策划虾', avatar: null }
    }),
    prisma.user.create({
      data: { userId: 'u005', userName: '小E', role: '运营虾', avatar: null }
    }),
  ])
  console.log('✅ 用户创建:', users.map(u => u.userName).join(', '))

  // ==================== 项目1: XX品牌春季发布会 ====================
  const project1 = await prisma.project.create({
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
  console.log('✅ 项目1创建:', project1.name)

  // 项目1 - 里程碑
  const ms1_1 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '前期沟通与方案',
      description: '需求确认、方案设计',
      order: 1,
      deadline: new Date('2026-03-15'),
    }
  })

  const ms1_2 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '视觉设计',
      description: '主视觉、延展物料设计',
      order: 2,
      deadline: new Date('2026-03-25'),
    }
  })

  const ms1_3 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '3D场景制作',
      description: '舞台效果、产品渲染',
      order: 3,
      deadline: new Date('2026-04-05'),
    }
  })

  const ms1_4 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '技术开发',
      description: 'H5、直播系统、互动功能',
      order: 4,
      deadline: new Date('2026-04-10'),
    }
  })

  const ms1_5 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '执行落地',
      description: '现场搭建、活动执行',
      order: 5,
      deadline: new Date('2026-04-15'),
    }
  })

  const ms1_6 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: '复盘总结',
      description: '数据汇总、经验总结',
      order: 6,
      deadline: new Date('2026-04-20'),
    }
  })

  console.log('✅ 项目1里程碑创建: 6个')

  // 里程碑1的任务 - 前期沟通与方案
  const task1_1_1 = await prisma.task.create({
    data: {
      milestoneId: ms1_1.id,
      title: '客户需求调研',
      description: '深入了解品牌定位、目标受众、活动预算',
      assigneeRole: '策划虾',
      assigneeName: '小D',
      deliverableType: '调研报告',
      status: '已完成',
      priority: 'P0',
      plannedDate: new Date('2026-03-05'),
      actualDate: new Date('2026-03-05'),
    }
  })

  const task1_1_2 = await prisma.task.create({
    data: {
      milestoneId: ms1_1.id,
      title: '活动方案策划(v1)',
      description: '初版活动策划方案，包含主题、流程、预算',
      assigneeRole: '策划虾',
      assigneeName: '小D',
      deliverableType: '策划方案',
      status: '已完成',
      priority: 'P0',
      plannedDate: new Date('2026-03-08'),
      actualDate: new Date('2026-03-09'),
    }
  })

  // 子任务 - 方案修改v2
  const task1_1_2_sub = await prisma.task.create({
    data: {
      milestoneId: ms1_1.id,
      parentTaskId: task1_1_2.id,
      title: '活动方案修改(v2)',
      description: '根据客户反馈调整方案，增加互动环节',
      assigneeRole: '策划虾',
      assigneeName: '小D',
      deliverableType: '策划方案',
      status: '已完成',
      priority: 'P0',
      plannedDate: new Date('2026-03-12'),
      actualDate: new Date('2026-03-12'),
    }
  })

  // 子任务 - 方案确认
  const task1_1_2_confirm = await prisma.task.create({
    data: {
      milestoneId: ms1_1.id,
      parentTaskId: task1_1_2_sub.id,
      title: '方案最终确认',
      description: '客户确认最终方案，签署合同',
      assigneeRole: '策划虾',
      assigneeName: '小D',
      deliverableType: '确认函',
      status: '已完成',
      priority: 'P0',
      plannedDate: new Date('2026-03-15'),
      actualDate: new Date('2026-03-14'),
    }
  })

  const task1_1_3 = await prisma.task.create({
    data: {
      milestoneId: ms1_1.id,
      title: '场地考察',
      description: '实地考察活动场地，确认布置方案',
      assigneeRole: '运营虾',
      assigneeName: '小E',
      deliverableType: '场地报告',
      status: '已完成',
      priority: 'P1',
      plannedDate: new Date('2026-03-10'),
      actualDate: new Date('2026-03-10'),
    }
  })

  // 里程碑2的任务 - 视觉设计
  const task1_2_1 = await prisma.task.create({
    data: {
      milestoneId: ms1_2.id,
      title: '主视觉设计(v1)',
      description: '活动主KV设计，包含多种尺寸版本',
      assigneeRole: '创作虾',
      assigneeName: '小A',
      deliverableType: '平面设计稿',
      status: '已完成',
      priority: 'P0',
      plannedDate: new Date('2026-03-18'),
      actualDate: new Date('2026-03-19'),
    }
  })

  // 子任务 - 修改v2
  const task1_2_1_v2 = await prisma.task.create({
    data: {
      milestoneId: ms1_2.id,
      parentTaskId: task1_2_1.id,
      title: '主视觉修改(v2)',
      description: '调整色调为品牌蓝，优化字体',
      assigneeRole: '创作虾',
      assigneeName: '小A',
      deliverableType: '平面设计稿',
      status: '进行中',
      priority: 'P0',
      plannedDate: new Date('2026-03-22'),
    }
  })

  // 子任务 - 修改v3
  const task1_2_1_v3 = await prisma.task.create({
    data: {
      milestoneId: ms1_2.id,
      parentTaskId: task1_2_1_v2.id,
      title: '主视觉修改(v3)',
      description: '微调LOGO位置和背景元素',
      assigneeRole: '创作虾',
      assigneeName: '小A',
      deliverableType: '平面设计稿',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-03-24'),
    }
  })

  const task1_2_2 = await prisma.task.create({
    data: {
      milestoneId: ms1_2.id,
      title: '延展物料设计',
      description: '邀请函、工作证、指示牌、背景板等',
      assigneeRole: '创作虾',
      assigneeName: '小B',
      deliverableType: '设计稿包',
      status: '进行中',
      priority: 'P1',
      plannedDate: new Date('2026-03-25'),
    }
  })

  const task1_2_3 = await prisma.task.create({
    data: {
      milestoneId: ms1_2.id,
      title: '宣传海报设计',
      description: '社交媒体推广海报系列',
      assigneeRole: '创作虾',
      assigneeName: '小B',
      deliverableType: '海报套图',
      status: '待开始',
      priority: 'P1',
      plannedDate: new Date('2026-03-28'),
    }
  })

  // 里程碑3的任务 - 3D场景制作
  const task1_3_1 = await prisma.task.create({
    data: {
      milestoneId: ms1_3.id,
      title: '舞台3D效果图',
      description: '活动现场舞台3D建模与渲染',
      assigneeRole: '创作虾',
      assigneeName: '小A',
      deliverableType: '3D渲染图',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-01'),
    }
  })

  const task1_3_2 = await prisma.task.create({
    data: {
      milestoneId: ms1_3.id,
      title: '产品3D展示模型',
      description: '新品3D模型制作，用于AR展示',
      assigneeRole: '技术虾',
      assigneeName: '小C',
      deliverableType: '3D模型文件',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-03'),
    }
  })

  const task1_3_3 = await prisma.task.create({
    data: {
      milestoneId: ms1_3.id,
      title: '动态开场视频',
      description: '活动开场30秒动态视频制作',
      assigneeRole: '创作虾',
      assigneeName: '小B',
      deliverableType: '视频文件',
      status: '待开始',
      priority: 'P1',
      plannedDate: new Date('2026-04-05'),
    }
  })

  // 里程碑4的任务 - 技术开发
  const task1_4_1 = await prisma.task.create({
    data: {
      milestoneId: ms1_4.id,
      title: '活动H5页面开发',
      description: '邀请函H5、报名页面、活动官网',
      assigneeRole: '技术虾',
      assigneeName: '小C',
      deliverableType: '前端代码',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-08'),
    }
  })

  const task1_4_2 = await prisma.task.create({
    data: {
      milestoneId: ms1_4.id,
      title: '直播系统搭建',
      description: '多平台直播推流系统配置',
      assigneeRole: '技术虾',
      assigneeName: '小C',
      deliverableType: '系统配置',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-10'),
    }
  })

  const task1_4_3 = await prisma.task.create({
    data: {
      milestoneId: ms1_4.id,
      title: '现场互动功能',
      description: '签到、抽奖、弹幕等互动功能',
      assigneeRole: '技术虾',
      assigneeName: '小C',
      deliverableType: '功能模块',
      status: '待开始',
      priority: 'P1',
      plannedDate: new Date('2026-04-10'),
    }
  })

  // 里程碑5的任务 - 执行落地
  const task1_5_1 = await prisma.task.create({
    data: {
      milestoneId: ms1_5.id,
      title: '物料制作对接',
      description: '与制作工厂对接，确认材质工艺',
      assigneeRole: '运营虾',
      assigneeName: '小E',
      deliverableType: '制作清单',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-12'),
    }
  })

  const task1_5_2 = await prisma.task.create({
    data: {
      milestoneId: ms1_5.id,
      title: '现场搭建',
      description: '舞台搭建、设备调试、彩排',
      assigneeRole: '运营虾',
      assigneeName: '小E',
      deliverableType: '现场执行',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-14'),
    }
  })

  const task1_5_3 = await prisma.task.create({
    data: {
      milestoneId: ms1_5.id,
      title: '活动执行',
      description: '活动当天全流程执行',
      assigneeRole: '运营虾',
      assigneeName: '小E',
      deliverableType: '执行报告',
      status: '待开始',
      priority: 'P0',
      plannedDate: new Date('2026-04-15'),
    }
  })

  console.log('✅ 项目1任务创建: 主任务14个 + 子任务3个')

  // 添加沟通记录
  await prisma.communication.create({
    data: {
      projectId: project1.id,
      type: '电话',
      date: new Date('2026-03-05'),
      participants: '客户张总、总指挥虾、策划虾',
      summary: '确认活动基调为科技感，主色调使用品牌蓝',
      actionItems: JSON.stringify(['主视觉设计', '需求调研']),
    }
  })

  await prisma.communication.create({
    data: {
      projectId: project1.id,
      type: '会议',
      date: new Date('2026-03-12'),
      participants: '客户张总、策划虾、创作虾',
      summary: '方案评审会议，客户要求增加互动环节，预算增加20%',
      actionItems: JSON.stringify(['方案修改v2', '预算调整']),
    }
  })

  await prisma.communication.create({
    data: {
      projectId: project1.id,
      type: '微信',
      date: new Date('2026-03-19'),
      participants: '客户张总、创作虾小A',
      summary: '主视觉v1反馈：色调偏暗，需要提亮，字体更换为品牌字体',
      actionItems: JSON.stringify(['主视觉修改v2']),
    }
  })

  // 添加日历事件
  await prisma.calendarEvent.createMany({
    data: [
      {
        projectId: project1.id,
        title: '方案汇报',
        eventType: '会议',
        eventDate: new Date('2026-03-12T14:00:00'),
        duration: 120,
        attendees: '客户张总、策划虾、创作虾',
        reminder: 60,
      },
      {
        projectId: project1.id,
        title: '主视觉评审',
        eventType: '评审',
        eventDate: new Date('2026-03-22T10:00:00'),
        duration: 60,
        attendees: '创作虾、策划虾',
        reminder: 30,
      },
      {
        projectId: project1.id,
        title: '客户拜访',
        eventType: '拜访',
        eventDate: new Date('2026-03-25T15:00:00'),
        duration: 90,
        attendees: '总指挥虾、策划虾',
        reminder: 120,
      },
      {
        projectId: project1.id,
        title: '活动执行日',
        eventType: '截止日',
        eventDate: new Date('2026-04-15T09:00:00'),
        duration: 480,
        attendees: '全员',
        reminder: 1440,
      },
    ]
  })

  // ==================== 项目2: YY电商平台大促活动 ====================
  const project2 = await prisma.project.create({
    data: {
      name: 'YY电商平台618大促',
      description: '618购物节全渠道营销活动，包含APP、小程序、线下门店',
      type: '营销',
      status: '进行中',
      client: 'YY电商',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-20'),
    }
  })
  console.log('✅ 项目2创建:', project2.name)

  // 项目2 - 里程碑
  const ms2_1 = await prisma.milestone.create({
    data: {
      projectId: project2.id,
      name: '策略规划',
      description: '营销策略、预算分配、KPI设定',
      order: 1,
      deadline: new Date('2026-04-15'),
    }
  })

  const ms2_2 = await prisma.milestone.create({
    data: {
      projectId: project2.id,
      name: '创意设计',
      description: '视觉风格、活动页面、广告素材',
      order: 2,
      deadline: new Date('2026-05-10'),
    }
  })

  const ms2_3 = await prisma.milestone.create({
    data: {
      projectId: project2.id,
      name: '系统开发',
      description: '促销系统、库存系统、支付优化',
      order: 3,
      deadline: new Date('2026-05-25'),
    }
  })

  const ms2_4 = await prisma.milestone.create({
    data: {
      projectId: project2.id,
      name: '预热推广',
      description: '种草内容、预约活动、会员通知',
      order: 4,
      deadline: new Date('2026-06-05'),
    }
  })

  const ms2_5 = await prisma.milestone.create({
    data: {
      projectId: project2.id,
      name: '大促执行',
      description: '618活动正式执行',
      order: 5,
      deadline: new Date('2026-06-20'),
    }
  })

  // 项目2的任务
  await prisma.task.createMany({
    data: [
      {
        milestoneId: ms2_1.id,
        title: '竞品分析',
        description: '分析主要竞品的618策略',
        assigneeRole: '策划虾',
        assigneeName: '小D',
        status: '已完成',
        priority: 'P0',
        plannedDate: new Date('2026-04-05'),
      },
      {
        milestoneId: ms2_1.id,
        title: '营销方案(v1)',
        description: '618营销活动全案',
        assigneeRole: '策划虾',
        assigneeName: '小D',
        status: '已完成',
        priority: 'P0',
        plannedDate: new Date('2026-04-10'),
      },
      {
        milestoneId: ms2_1.id,
        title: '预算审批',
        description: '各渠道预算分配与审批',
        assigneeRole: '策划虾',
        assigneeName: '小D',
        status: '进行中',
        priority: 'P0',
        plannedDate: new Date('2026-04-15'),
      },
      {
        milestoneId: ms2_2.id,
        title: '618主视觉',
        description: '大促主KV及视觉规范',
        assigneeRole: '创作虾',
        assigneeName: '小A',
        status: '进行中',
        priority: 'P0',
        plannedDate: new Date('2026-04-25'),
      },
      {
        milestoneId: ms2_2.id,
        title: 'APP开屏广告',
        description: '618期间每日开屏素材',
        assigneeRole: '创作虾',
        assigneeName: '小B',
        status: '待开始',
        priority: 'P1',
        plannedDate: new Date('2026-05-01'),
      },
      {
        milestoneId: ms2_2.id,
        title: '短视频脚本',
        description: '种草视频脚本10条',
        assigneeRole: '策划虾',
        assigneeName: '小D',
        status: '待开始',
        priority: 'P1',
        plannedDate: new Date('2026-05-05'),
      },
      {
        milestoneId: ms2_3.id,
        title: '促销引擎升级',
        description: '支持叠加优惠券、满减规则',
        assigneeRole: '技术虾',
        assigneeName: '小C',
        status: '待开始',
        priority: 'P0',
        plannedDate: new Date('2026-05-15'),
      },
      {
        milestoneId: ms2_3.id,
        title: '库存预警系统',
        description: '热销商品库存实时监控',
        assigneeRole: '技术虾',
        assigneeName: '小C',
        status: '待开始',
        priority: 'P1',
        plannedDate: new Date('2026-05-20'),
      },
    ]
  })

  // ==================== 项目3: ZZ品牌内容运营 ====================
  const project3 = await prisma.project.create({
    data: {
      name: 'ZZ品牌内容运营',
      description: '季度内容规划与执行，包含小红书、抖音、公众号',
      type: '内容制作',
      status: '已完成',
      client: 'ZZ品牌',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    }
  })
  console.log('✅ 项目3创建:', project3.name)

  // 项目3 - 里程碑
  const ms3_1 = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: 'Q1内容规划',
      order: 1,
      status: '已完成',
    }
  })

  const ms3_2 = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: '1月内容执行',
      order: 2,
      status: '已完成',
    }
  })

  const ms3_3 = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: '2月内容执行',
      order: 3,
      status: '已完成',
    }
  })

  const ms3_4 = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: '3月内容执行',
      order: 4,
      status: '已完成',
    }
  })

  // 项目3的任务
  await prisma.task.createMany({
    data: [
      {
        milestoneId: ms3_1.id,
        title: '年度内容策略',
        status: '已完成',
        priority: 'P0',
      },
      {
        milestoneId: ms3_1.id,
        title: 'KOL合作清单',
        status: '已完成',
        priority: 'P1',
      },
      {
        milestoneId: ms3_2.id,
        title: '小红书笔记30篇',
        status: '已完成',
        priority: 'P0',
      },
      {
        milestoneId: ms3_2.id,
        title: '抖音视频15条',
        status: '已完成',
        priority: 'P0',
      },
      {
        milestoneId: ms3_3.id,
        title: '春节专题内容',
        status: '已完成',
        priority: 'P0',
      },
      {
        milestoneId: ms3_4.id,
        title: '春季新品种草',
        status: '已完成',
        priority: 'P0',
      },
    ]
  })

  console.log('\n🎉 测试数据创建完成!')
  console.log(`✅ 共3个项目`)
  console.log(`✅ 共${6 + 5 + 4}个里程碑`)
  console.log(`✅ 共30+个任务（含子任务）`)
  console.log(`✅ 5个用户`)
  console.log(`✅ 3条沟通记录`)
  console.log(`✅ 4个日历事件`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
