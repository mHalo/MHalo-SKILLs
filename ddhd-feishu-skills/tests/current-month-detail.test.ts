/**
 * 查看本月考勤明细和汇总
 */

import { getMonthlyAttendanceDetail, getTodayLateUsers } from '../scripts/feishu-attendance';

async function viewCurrentMonthAttendance() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  console.log(`\n📅 ${year}年${month}月 考勤明细报表\n`);
  console.log('=' .repeat(60));
  
  // 获取今日迟到人员
  console.log('\n【今日考勤概况】\n');
  const todayLateUsers = await getTodayLateUsers();
  if (todayLateUsers.length > 0) {
    console.log(`⚠️ 今日迟到 (${todayLateUsers.length}人):`);
    todayLateUsers.forEach(user => {
      console.log(`   • ${user.name} - ${user.punchInTime}`);
    });
  } else {
    console.log('✅ 今日全员准时打卡，无人迟到');
  }
  
  // 获取当月考勤明细
  console.log('\n' + '=' .repeat(60));
  console.log('\n【本月考勤明细】\n');
  
  const details = await getMonthlyAttendanceDetail();
  
  // 统计汇总
  let totalLateCount = 0;
  let totalLeaveCount = 0;
  const lateUsers: { name: string; count: number; details: string[] }[] = [];
  const normalUsers: string[] = [];
  const leaveUsers: { name: string; leaves: { type: string; days: string }[] }[] = [];
  
  details.forEach(user => {
    // 统计迟到
    if (user.beLateInfo.lateTimes > 0) {
      totalLateCount += user.beLateInfo.lateTimes;
      lateUsers.push({
        name: user.name,
        count: user.beLateInfo.lateTimes,
        details: user.beLateInfo.detail.map(d => `${d.date} ${d.punchInTime}`)
      });
    }
    
    // 统计请假
    if (user.leaveInfo.length > 0) {
      totalLeaveCount += user.leaveInfo.length;
      leaveUsers.push({
        name: user.name,
        leaves: user.leaveInfo.map(l => ({ type: l.leaveType, days: l.leaveDays }))
      });
    }
    
    // 统计正常人员（无迟到、无请假）
    if (user.beLateInfo.lateTimes === 0 && user.leaveInfo.length === 0) {
      normalUsers.push(user.name);
    }
  });
  
  // 显示详细列表
  console.log(`共 ${details.length} 人\n`);
  
  details.forEach((user, index) => {
    const status = user.beLateInfo.lateTimes > 0 ? '⚠️' : 
                   user.leaveInfo.length > 0 ? '📝' : '✅';
    console.log(`${index + 1}. ${status} ${user.name}`);
    
    if (user.beLateInfo.lateTimes > 0) {
      console.log(`   迟到: ${user.beLateInfo.lateTimes}次`);
      user.beLateInfo.detail.forEach(late => {
        console.log(`   └─ ${late.date} ${late.punchInTime}`);
      });
    }
    
    if (user.leaveInfo.length > 0) {
      user.leaveInfo.forEach(leave => {
        console.log(`   请假: ${leave.leaveType} ${leave.leaveDays}天`);
      });
    }
    
    if (user.beLateInfo.lateTimes === 0 && user.leaveInfo.length === 0) {
      console.log(`   状态: 正常`);
    }
    console.log('');
  });
  
  // 汇总统计
  console.log('=' .repeat(60));
  console.log('\n【本月考勤汇总】\n');
  
  console.log(`📊 总体情况:`);
  console.log(`   总人数: ${details.length}人`);
  console.log(`   正常: ${normalUsers.length}人`);
  console.log(`   有迟到: ${lateUsers.length}人`);
  console.log(`   有请假: ${leaveUsers.length}人`);
  console.log(`   总迟到次数: ${totalLateCount}次`);
  console.log(`   总请假次数: ${totalLeaveCount}次\n`);
  
  if (lateUsers.length > 0) {
    console.log(`⚠️ 迟到人员 (${lateUsers.length}人):`);
    lateUsers.forEach(user => {
      console.log(`   • ${user.name}: ${user.count}次`);
      user.details.forEach(d => console.log(`     - ${d}`));
    });
    console.log('');
  }
  
  if (leaveUsers.length > 0) {
    console.log(`📝 请假人员 (${leaveUsers.length}人):`);
    leaveUsers.forEach(user => {
      console.log(`   • ${user.name}:`);
      user.leaves.forEach(l => console.log(`     - ${l.type}: ${l.days}天`));
    });
    console.log('');
  }
  
  if (normalUsers.length > 0) {
    console.log(`✅ 满勤人员 (${normalUsers.length}人): ${normalUsers.join(', ')}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ 查询完成！\n');
}

viewCurrentMonthAttendance();
