/**
 * 查询本月考勤统计
 */

import { queryAttendanceStats, readDefaultGroupMembers } from '../scripts/feishu-attendance';

async function getCurrentMonthStats() {
  // 获取本月日期范围
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-11，需要+1
  
  // 格式化为 yyyyMMdd
  const startDate = `${year}${String(month).padStart(2, '0')}01`;
  const lastDay = new Date(year, month, 0).getDate(); // 获取本月最后一天
  const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
  
  console.log(`=== 查询 ${year}年${month}月 考勤统计 ===\n`);
  console.log(`日期范围: ${startDate} ~ ${endDate}\n`);

  // 从缓存中读取默认考勤组成员
  const membersData = await readDefaultGroupMembers();
  
  if (!membersData || membersData.members.length === 0) {
    console.log('⚠️ 未找到默认考勤组成员，请先运行 getDefaultAttendanceGroupMembers()');
    return;
  }

  // 提取用户ID
  const userIds = membersData.members
    .map(m => m.user_id)
    .filter((id): id is string => !!id);

  console.log(`查询用户: ${userIds.length} 人`);
  console.log(`用户列表: ${userIds.join(', ')}\n`);

  try {
    const stats = await queryAttendanceStats(startDate, endDate, userIds);

    console.log('\n========== 本月考勤统计 ==========\n');
    
    if (stats.user_datas && stats.user_datas.length > 0) {
      stats.user_datas.forEach((user, index) => {
        console.log(`[${index + 1}] ${user.name} (${user.user_id})`);
        
        if (user.datas && user.datas.length > 0) {
          // 提取关键统计信息
          const keyStats = user.datas.filter(item => {
            const keyCodes = ['应出勤天数', '实际出勤时长', '迟到次数', '早退次数', '缺勤', '考勤组名称', '部门'];
            return keyCodes.some(key => item.title?.includes(key) || item.code?.includes(key));
          });
          
          keyStats.forEach(item => {
            const label = item.title || item.code;
            console.log(`    ${label}: ${item.value}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('未获取到用户统计数据');
    }

    if (stats.invalid_user_list && stats.invalid_user_list.length > 0) {
      console.log(`⚠️ 无效用户: ${stats.invalid_user_list.join(', ')}`);
    }

    console.log('===================================\n');
    console.log('✅ 查询完成！');

  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
  }
}

getCurrentMonthStats();
