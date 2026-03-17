/**
 * 考勤组详情查询测试
 */

import { getAttendanceGroupDetail, fetchAttendanceGroups } from '../scripts/feishu-attendance';

async function test() {
  try {
    // 首先获取考勤组列表，拿到一个有效的 group_id
    console.log('=== 步骤1: 获取考勤组列表 ===\n');
    const groups = await fetchAttendanceGroups();
    
    if (groups.length === 0) {
      console.log('⚠️ 未获取到任何考勤组');
      return;
    }

    // 使用第一个考勤组的 ID 测试查询详情
    const testGroupId = groups[0].group_id;
    console.log(`\n=== 步骤2: 查询考勤组详情 ===`);
    console.log(`考勤组ID: ${testGroupId}\n`);

    const detail = await getAttendanceGroupDetail(testGroupId);

    if (detail) {
      console.log('✅ 成功获取考勤组详情！\n');
      console.log('========== 考勤组详细信息 ==========');
      console.log(`考勤组ID: ${detail.group_id}`);
      console.log(`考勤组名称: ${detail.group_name}`);
      console.log(`考勤类型: ${detail.type === 1 ? '固定班制' : detail.type === 2 ? '排班制' : detail.type === 3 ? '自由班制' : '未知'}`);
      console.log(`时区: ${detail.time_zone || '未设置'}`);
      console.log(`是否默认: ${detail.isDefault ? '✅ 是' : '❌ 否'}`);
      
      // 输出其他可能的字段
      if (detail.group_leader_ids?.length > 0) {
        console.log(`考勤负责人: ${detail.group_leader_ids.join(', ')}`);
      }
      if (detail.bind_user_ids?.length > 0) {
        console.log(`绑定用户: ${detail.bind_user_ids.length} 人`);
      }
      if (detail.bind_dept_ids?.length > 0) {
        console.log(`绑定部门: ${detail.bind_dept_ids.length} 个`);
      }
      
      console.log('\n完整数据:');
      console.log(JSON.stringify(detail, null, 2));
      console.log('=====================================\n');
    } else {
      console.log('❌ 未找到该考勤组');
    }

    // 测试查询不存在的考勤组
    console.log('=== 步骤3: 测试查询不存在的考勤组 ===\n');
    try {
      const notFound = await getAttendanceGroupDetail('not_exist_group_id');
      if (!notFound) {
        console.log('✅ 正确返回 null（考勤组不存在）\n');
      }
    } catch (err: any) {
      console.log('✅ 正确抛出错误（考勤组不存在）:', err.message, '\n');
    }

    console.log('✅ 所有测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
