/**
 * 考勤统计数据查询测试
 */

import { queryAttendanceStats } from '../scripts/feishu-attendance';

async function test() {
  try {
    // 测试参数
    const startDate = '20250301';  // 2025年3月1日
    const endDate = '20250331';     // 2025年3月31日
    const userIds = ['2a3f36c4', '5314294e'];  // 测试用户ID

    console.log('=== 测试查询考勤统计数据 ===\n');
    console.log(`日期范围: ${startDate} ~ ${endDate}`);
    console.log(`查询用户: ${userIds.join(', ')}\n`);

    const stats = await queryAttendanceStats(startDate, endDate, userIds);

    console.log('\n✅ 成功获取考勤统计数据！\n');
    console.log(`有效用户数据: ${stats.user_datas?.length || 0} 条`);
    
    if (stats.invalid_user_list && stats.invalid_user_list.length > 0) {
      console.log(`无效用户: ${stats.invalid_user_list.join(', ')}`);
    }

    if (stats.user_datas && stats.user_datas.length > 0) {
      console.log('\n========== 用户统计数据 ==========\n');
      
      stats.user_datas.forEach((user, index) => {
        console.log(`[${index + 1}] ${user.name} (${user.user_id})`);
        
        if (user.datas && user.datas.length > 0) {
          console.log('    统计项:');
          user.datas.forEach(item => {
            console.log(`      - ${item.title || item.code}: ${item.value}`);
          });
        }
        console.log('');
      });
      
      console.log('==================================\n');
    }

    console.log('✅ 测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
