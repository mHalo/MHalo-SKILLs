/**
 * 通讯录功能测试
 * 测试批量获取用户信息
 */

import { getUserInfo, batchGetUserInfo } from '../scripts/feishu-contact';

async function test() {
  const userIds = ['2a3f36c4', '5314294e'];
  
  console.log(`正在获取 ${userIds.length} 个用户的信息...`);
  console.log(`用户ID列表: ${userIds.join(', ')}`);
  console.log(`用户ID类型: user_id\n`);
  
  try {
    // 首先尝试使用 batch 接口批量获取
    console.log('尝试使用 batch 接口批量获取...');
    const users = await batchGetUserInfo(userIds, 'user_id');
    
    console.log(`\n✅ 成功获取 ${users.length} 个用户信息！\n`);
    console.log('========== 用户信息列表 ==========');
    users.forEach((user, index) => {
      console.log(`\n[用户 ${index + 1}]`);
      console.log(`  姓名: ${user.name}`);
      console.log(`  用户ID: ${user.user_id}`);
      console.log(`  邮箱: ${user.email || '无'}`);
      console.log(`  职位: ${user.job_title || '无'}`);
    });
    console.log('\n==================================\n');
    
    // 输出用户名
    const userNames = users.map(u => u.name).join('、');
    console.log(`[RESULT] 获取到的用户名: ${userNames}`);
    
  } catch (error: any) {
    console.error('❌ batch 接口调用失败，尝试逐个获取...\n');
    
    // 如果 batch 失败，使用单个接口获取
    const users = [];
    for (const userId of userIds) {
      try {
        const user = await getUserInfo(userId, 'user_id');
        if (user) {
          users.push(user);
          console.log(`✅ 用户 ${userId}: ${user.name}`);
        } else {
          console.log(`⚠️ 用户 ${userId}: 未找到`);
        }
      } catch (err: any) {
        console.error(`❌ 用户 ${userId}: 获取失败 - ${err.message}`);
      }
    }
    
    console.log(`\n========== 汇总 ==========`);
    console.log(`成功获取 ${users.length} 个用户`);
    const userNames = users.map(u => u.name).join('、');
    console.log(`[RESULT] 获取到的用户名: ${userNames}`);
    console.log('==========================\n');
  }
}

test();
