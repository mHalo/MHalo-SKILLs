/**
 * 查询今天迟到人员
 */

import { queryAttendanceStats } from '../scripts/feishu-attendance';
import { readDefaultGroupMembers } from '../scripts/feishu-attendance';

async function checkTodayLate() {
  // 获取今天的日期
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 格式化为 yyyyMMdd
  const dateStr = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  
  console.log(`=== 查询 ${year}年${month}月${day}日 迟到情况 ===\n`);

  // 从缓存中读取默认考勤组成员
  const membersData = await readDefaultGroupMembers();
  
  if (!membersData || membersData.members.length === 0) {
    console.log('⚠️ 未找到默认考勤组成员');
    return;
  }

  const userIds = membersData.members
    .map(m => m.user_id)
    .filter((id): id is string => !!id);

  try {
    // 查询今天的考勤统计（单天）
    const stats = await queryAttendanceStats(dateStr, dateStr, userIds);

    const lateUsers: { name: string; userId: string; checkInTime: string; lateMinutes: number }[] = [];
    const normalUsers: { name: string; checkInTime: string }[] = [];
    const absentUsers: { name: string; reason: string }[] = [];

    if (stats.user_datas) {
      stats.user_datas.forEach(user => {
        // 查找今天的打卡记录
        const todayRecord = user.datas?.find(item => {
          const title = item.title || '';
          return title.includes(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        });

        if (todayRecord) {
          const value = todayRecord.value || '';
          
          // 解析打卡记录，格式如: "迟到9分钟(09:09),缺卡(12:03);事假(下午)" 或 "正常(08:54),正常(18:13)"
          const checkInMatch = value.match(/迟到(\d+)分钟\((\d{2}:\d{2})\)/);
          
          if (checkInMatch) {
            // 迟到
            lateUsers.push({
              name: user.name,
              userId: user.user_id,
              checkInTime: checkInMatch[2],
              lateMinutes: parseInt(checkInMatch[1], 10)
            });
          } else if (value.includes('正常')) {
            // 正常打卡
            const timeMatch = value.match(/正常\((\d{2}:\d{2})\)/);
            normalUsers.push({
              name: user.name,
              checkInTime: timeMatch ? timeMatch[1] : '未知'
            });
          } else if (value.includes('缺卡') || value.includes('缺勤')) {
            // 缺卡
            absentUsers.push({
              name: user.name,
              reason: value
            });
          } else if (value.includes('休息')) {
            // 休息日
          }
        }
      });
    }

    // 输出结果
    console.log(`📅 今天 (${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}) 考勤情况\n`);

    if (lateUsers.length > 0) {
      console.log(`⚠️ 迟到人员 (${lateUsers.length}人):\n`);
      lateUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name}`);
        console.log(`     打卡时间: ${user.checkInTime}`);
        console.log(`     迟到时长: ${user.lateMinutes} 分钟\n`);
      });
    } else {
      console.log('✅ 今天没有人迟到！\n');
    }

    if (normalUsers.length > 0) {
      console.log(`✅ 正常打卡 (${normalUsers.length}人): ${normalUsers.map(u => `${u.name}(${u.checkInTime})`).join(', ')}\n`);
    }

    if (absentUsers.length > 0) {
      console.log(`❌ 缺卡/缺勤 (${absentUsers.length}人):`);
      absentUsers.forEach(user => {
        console.log(`  - ${user.name}: ${user.reason}`);
      });
      console.log('');
    }

  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
  }
}

checkTodayLate();
