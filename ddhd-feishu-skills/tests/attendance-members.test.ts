/**
 * 考勤组成员查询测试
 */

import { 
  getAttendanceGroupMembers, 
  getDefaultAttendanceGroupMembers,
  readDefaultGroupMembers,
  fetchAttendanceGroups 
} from '../scripts/feishu-attendance';

async function test() {
  try {
    // 步骤1：先获取考勤组列表
    console.log('=== 步骤1: 获取考勤组列表 ===\n');
    const groups = await fetchAttendanceGroups();
    
    if (groups.length === 0) {
      console.log('⚠️ 未获取到任何考勤组');
      return;
    }

    const testGroupId = groups[0].group_id;
    const testGroupName = groups[0].group_name;
    console.log(`考勤组: "${testGroupName}" (${testGroupId})\n`);

    // 步骤2：测试查询考勤组成员
    console.log('=== 步骤2: 查询考勤组成员 ===\n');
    const members = await getAttendanceGroupMembers(testGroupId);
    
    console.log(`✅ 成功获取考勤组成员！`);
    console.log(`考勤组: ${members.group_name}`);
    console.log(`成员数量: ${members.total_count}\n`);
    
    if (members.members.length > 0) {
      console.log('========== 成员列表 ==========\n');
      members.members.slice(0, 5).forEach((member, index) => {
        console.log(`[${index + 1}] ${member.userInfo?.name || '未知'}`);
        console.log(`    用户ID: ${member.user_id}`);
        console.log(`    邮箱: ${member.userInfo?.email || '无'}`);
        console.log(`    头像: ${member.userInfo?.avatar?.avatar_72 || '无'}`);
        console.log('');
      });
      
      if (members.members.length > 5) {
        console.log(`... 还有 ${members.members.length - 5} 人`);
      }
      console.log('=============================\n');
    }

    // 步骤3：测试查询默认考勤组成员并缓存
    console.log('=== 步骤3: 查询默认考勤组成员并缓存 ===\n');
    const defaultMembers = await getDefaultAttendanceGroupMembers();
    
    console.log(`✅ 默认考勤组成员获取成功！`);
    console.log(`考勤组: ${defaultMembers.group_name}`);
    console.log(`成员数量: ${defaultMembers.total_count}\n`);

    // 步骤4：验证缓存文件
    console.log('=== 步骤4: 验证缓存文件 ===\n');
    const cachedMembers = await readDefaultGroupMembers();
    
    if (cachedMembers) {
      console.log(`✅ 缓存文件读取成功！`);
      console.log(`缓存考勤组: ${cachedMembers.group_name}`);
      console.log(`缓存成员数: ${cachedMembers.total_count}\n`);
    } else {
      console.log('❌ 缓存文件不存在或读取失败\n');
    }

    console.log('✅ 所有测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

test();
