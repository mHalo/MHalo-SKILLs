/**
 * 默认考勤组详情及班次缓存测试
 */

import { 
  getDefaultAttendanceGroupDetail,
  readDefaultGroupShifts,
  fetchAttendanceGroups 
} from '../scripts/feishu-attendance';

async function test() {
  try {
    // 步骤1：先获取考勤组列表（确保有默认考勤组缓存）
    console.log('=== 步骤1: 获取考勤组列表 ===\n');
    await fetchAttendanceGroups();

    // 步骤2：获取默认考勤组详情（会自动获取班次信息）
    console.log('\n=== 步骤2: 获取默认考勤组详情 ===\n');
    const detail = await getDefaultAttendanceGroupDetail();
    
    console.log('\n✅ 成功获取默认考勤组详情！');
    console.log(`考勤组ID: ${detail.group_id}`);
    console.log(`考勤组名称: ${detail.group_name}`);
    
    // 显示 punch_day_shift_ids
    if (detail.punch_day_shift_ids && detail.punch_day_shift_ids.length > 0) {
      console.log(`班次ID列表: [${detail.punch_day_shift_ids.join(', ')}]`);
    }
    console.log('');

    // 步骤3：验证班次缓存文件
    console.log('=== 步骤3: 验证班次缓存文件 ===\n');
    const shiftsData = await readDefaultGroupShifts();
    
    if (shiftsData) {
      console.log(`✅ 班次缓存读取成功！`);
      console.log(`考勤组: ${shiftsData.group_name}`);
      console.log(`班次数量: ${shiftsData.total_count}\n`);
      
      if (shiftsData.shifts.length > 0) {
        console.log('========== 班次列表 ==========\n');
        shiftsData.shifts.forEach((shift, index) => {
          console.log(`[${index + 1}] ${shift.shift_name} (ID: ${shift.shift_id})`);
          console.log(`    打卡次数: ${shift.punch_times}次`);
          console.log(`    是否弹性: ${shift.is_flexible ? '是' : '否'}`);
          
          if (shift.punch_time_rule.length > 0) {
            const rule = shift.punch_time_rule[0];
            console.log(`    上班时间: ${rule.on_time}`);
            console.log(`    下班时间: ${rule.off_time}`);
          }
          console.log('');
        });
        console.log('=============================\n');
      }
    } else {
      console.log('❌ 班次缓存文件不存在或读取失败\n');
    }

    console.log('✅ 所有测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

test();
