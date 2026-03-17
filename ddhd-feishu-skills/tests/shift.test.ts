/**
 * 班次查询测试
 */

import { getShiftDetail } from '../scripts/feishu-attendance';

async function test() {
  // 测试班次 ID，从默认考勤组详情中获取到的班次 ID
  const testShiftId = '8';
  
  console.log(`=== 测试查询班次详情 ===\n`);
  console.log(`班次ID: ${testShiftId}\n`);

  try {
    const shift = await getShiftDetail(testShiftId);

    if (shift) {
      console.log('✅ 成功获取班次详情！\n');
      console.log('========== 班次信息 ==========');
      console.log(`班次ID: ${shift.shift_id}`);
      console.log(`班次名称: ${shift.shift_name}`);
      console.log(`打卡次数: ${shift.punch_times}次`);
      console.log(`是否弹性: ${shift.is_flexible ? '是' : '否'}`);
      
      if (shift.flexible_minutes) {
        console.log(`弹性时长: ${shift.flexible_minutes}分钟`);
      }
      
      console.log('\n--- 上下班时间规则 ---');
      shift.punch_time_rule.forEach((rule, index) => {
        console.log(`\n[时段 ${index + 1}]`);
        console.log(`  上班时间: ${rule.on_time}`);
        console.log(`  下班时间: ${rule.off_time}`);
        console.log(`  迟到几分钟算迟到: ${rule.late_minutes_as_late}分钟`);
        console.log(`  迟到几分钟算缺卡: ${rule.late_minutes_as_lack}分钟`);
        console.log(`  早退几分钟算早退: ${rule.early_minutes_as_early}分钟`);
        if (rule.no_need_on) {
          console.log(`  ⚠️ 无需上班打卡`);
        }
        if (rule.no_need_off) {
          console.log(`  ⚠️ 无需下班打卡`);
        }
      });

      if (shift.rest_time_rule && shift.rest_time_rule.length > 0) {
        console.log('\n--- 休息时间 ---');
        shift.rest_time_rule.forEach((rest, index) => {
          console.log(`  休息${index + 1}: ${rest.rest_begin_time} - ${rest.rest_end_time}`);
        });
      }

      console.log('\n完整数据:');
      console.log(JSON.stringify(shift, null, 2));
      console.log('=============================\n');
    } else {
      console.log(`❌ 未找到班次: ${testShiftId}`);
    }

    // 测试查询不存在的班次
    console.log('=== 测试查询不存在的班次 ===\n');
    try {
      const notFound = await getShiftDetail('not_exist_shift');
      if (!notFound) {
        console.log('✅ 正确返回 null（班次不存在）\n');
      }
    } catch (err: any) {
      console.log('⚠️ 查询不存在的班次抛出错误:', err.message, '\n');
    }

    console.log('✅ 所有测试完成！');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

test();
