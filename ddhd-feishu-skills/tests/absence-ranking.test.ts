/**
 * 查询本月缺勤排名
 */

import { queryAttendanceStats } from '../scripts/feishu-attendance';
import { readDefaultGroupMembers } from '../scripts/feishu-attendance';

async function getAbsenceRanking() {
  // 获取本月日期范围
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const startDate = `${year}${String(month).padStart(2, '0')}01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
  
  console.log(`=== ${year}年${month}月 缺勤情况统计 ===\n`);

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
    const stats = await queryAttendanceStats(startDate, endDate, userIds);

    const absenceStats: { 
      name: string; 
      userId: string;
      absenceDays: number;
      lateCount: number;
      earlyLeaveCount: number;
      actualWorkHours: number;
      expectedWorkDays: number;
    }[] = [];

    if (stats.user_datas) {
      stats.user_datas.forEach(user => {
        let absenceDays = 0;
        let lateCount = 0;
        let earlyLeaveCount = 0;
        let actualWorkHours = 0;
        let expectedWorkDays = 0;

        user.datas?.forEach(item => {
          const title = item.title || '';
          const value = item.value || '';
          
          // 缺勤天数
          if (title.includes('缺勤') || item.code?.includes('absence')) {
            const match = value.match(/(\d+)/);
            if (match) absenceDays = parseInt(match[1], 10);
          }
          
          // 迟到次数
          if (title.includes('迟到次数') || item.code?.includes('late_count')) {
            lateCount = parseInt(value, 10) || 0;
          }
          
          // 早退次数
          if (title.includes('早退次数') || item.code?.includes('early_leave_count')) {
            earlyLeaveCount = parseInt(value, 10) || 0;
          }
          
          // 实际出勤时长
          if (title.includes('实际出勤时长') || item.code?.includes('actual_work_hours')) {
            actualWorkHours = parseFloat(value) || 0;
          }
          
          // 应出勤天数
          if (title.includes('应出勤天数') || item.code?.includes('expected_work_days')) {
            expectedWorkDays = parseInt(value, 10) || 0;
          }
        });

        absenceStats.push({
          name: user.name,
          userId: user.user_id,
          absenceDays,
          lateCount,
          earlyLeaveCount,
          actualWorkHours,
          expectedWorkDays
        });
      });
    }

    // 按缺勤天数排序（降序）
    absenceStats.sort((a, b) => b.absenceDays - a.absenceDays);

    console.log('========== 本月缺勤排名 ==========\n');
    
    if (absenceStats.length > 0) {
      const maxAbsence = absenceStats[0].absenceDays;
      
      if (maxAbsence === 0) {
        console.log('✅ 本月全员满勤，无人缺勤！\n');
      } else {
        // 找出缺勤最多的人
        const topAbsenceUsers = absenceStats.filter(u => u.absenceDays === maxAbsence && u.absenceDays > 0);
        
        console.log(`🔴 缺勤最多: ${maxAbsence} 天\n`);
        topAbsenceUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.userId})`);
          console.log(`     缺勤: ${user.absenceDays} 天`);
          console.log(`     迟到: ${user.lateCount} 次`);
          console.log(`     早退: ${user.earlyLeaveCount} 次`);
          console.log(`     实际出勤: ${user.actualWorkHours} 小时`);
          console.log(`     应出勤: ${user.expectedWorkDays} 天\n`);
        });

        // 显示完整排名
        console.log('---------- 完整排名 ----------\n');
        absenceStats.forEach((user, index) => {
          const rank = index + 1;
          let icon = '✅';
          if (user.absenceDays > 0) icon = '❌';
          else if (user.lateCount > 0) icon = '⚠️';
          
          console.log(`${rank}. ${icon} ${user.name}`);
          console.log(`   缺勤: ${user.absenceDays}天 | 迟到: ${user.lateCount}次 | 早退: ${user.earlyLeaveCount}次`);
        });
      }
    }

    console.log('\n===================================\n');
    
    // 汇总统计
    const totalAbsence = absenceStats.reduce((sum, u) => sum + u.absenceDays, 0);
    const totalLate = absenceStats.reduce((sum, u) => sum + u.lateCount, 0);
    const totalEarly = absenceStats.reduce((sum, u) => sum + u.earlyLeaveCount, 0);
    
    console.log('📊 本月考勤汇总:');
    console.log(`   总缺勤天数: ${totalAbsence} 天`);
    console.log(`   总迟到次数: ${totalLate} 次`);
    console.log(`   总早退次数: ${totalEarly} 次`);
    console.log(`   统计人数: ${absenceStats.length} 人`);

  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
  }
}

getAbsenceRanking();
