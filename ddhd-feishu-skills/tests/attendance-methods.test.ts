/**
 * 测试新增的考勤方法
 */

import { getTodayLateUsers, getMonthlyAttendanceDetail } from '../scripts/feishu-attendance';

async function test() {
  try {
    // 测试1：获取当日迟到人员
    console.log('=== 测试1: 获取当日迟到人员 ===\n');
    const lateUsers = await getTodayLateUsers();
    
    if (lateUsers.length > 0) {
      console.log(`⚠️ 今日迟到人员 (${lateUsers.length}人):\n`);
      lateUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name}`);
        console.log(`     打卡时间: ${user.punchInTime}\n`);
      });
    } else {
      console.log('✅ 今日无人迟到！\n');
    }

    // 测试2：获取当月考勤明细
    console.log('\n=== 测试2: 获取当月考勤明细 ===\n');
    const details = await getMonthlyAttendanceDetail();
    
    console.log(`共 ${details.length} 人\n`);
    
    details.forEach((user, index) => {
      console.log(`[${index + 1}] ${user.name}`);
      console.log(`    迟到次数: ${user.beLateInfo.lateTimes} 次`);
      
      if (user.beLateInfo.detail.length > 0) {
        console.log('    迟到详情:');
        user.beLateInfo.detail.forEach(late => {
          console.log(`      - ${late.date} ${late.punchInTime}`);
        });
      }
      
      if (user.leaveInfo.length > 0) {
        console.log('    请假记录:');
        user.leaveInfo.forEach(leave => {
          console.log(`      - ${leave.leaveType}: ${leave.leaveDays}天`);
        });
      } else {
        console.log('    请假记录: 无');
      }
      
      console.log('');
    });

    console.log('✅ 所有测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
