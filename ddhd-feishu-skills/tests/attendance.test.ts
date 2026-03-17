/**
 * 考勤功能测试
 */

import { fetchAttendanceGroups, setDefaultAttendanceGroup, getDefaultAttendanceGroup } from '../scripts/feishu-attendance';

async function test() {
  try {
    // 1. 测试获取考勤组列表
    console.log('=== 步骤1: 获取考勤组列表 ===\n');
    const groups = await fetchAttendanceGroups();
    
    if (groups.length === 0) {
      console.log('⚠️ 未获取到任何考勤组，请确认飞书应用有考勤权限');
      return;
    }
    
    console.log(`\n共获取 ${groups.length} 个考勤组:\n`);
    groups.forEach((group, index) => {
      console.log(`[${index + 1}] ${group.group_name}`);
      console.log(`    ID: ${group.group_id}`);
      console.log(`    类型: ${group.type === 1 ? '固定班制' : group.type === 2 ? '排班制' : '自由班制'}`);
      console.log(`    是否默认: ${group.isDefault ? '✅ 是' : '❌ 否'}`);
      console.log('');
    });
    
    // 2. 测试切换默认考勤组
    if (groups.length > 1) {
      const newDefaultGroup = groups[1];
      console.log(`=== 步骤2: 切换默认考勤组为 "${newDefaultGroup.group_name}" ===\n`);
      
      await setDefaultAttendanceGroup(newDefaultGroup.group_id);
      
      // 验证切换结果
      const defaultGroup = await getDefaultAttendanceGroup();
      console.log(`\n当前默认考勤组: "${defaultGroup?.group_name}"`);
    } else {
      console.log('只有一个考勤组，无法测试切换功能');
    }
    
    console.log('\n✅ 测试完成！');
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
