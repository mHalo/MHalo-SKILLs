/**
 * 素材上传下载测试
 * 
 * 测试飞书云空间素材管理功能
 */

import { uploadMedia, downloadMedia, batchGetMediaDownloadUrls } from '../scripts/feishu-media';
import * as fs from 'fs';
import * as path from 'path';

// 从飞书链接中提取的信息
// https://ij40h0sxny.feishu.cn/base/Z7jjbGWIeaawClsbBxIcVHawndU?table=tblw60jWaaU4clC3&view=vewJmz2qxb
const BASE_TOKEN = 'Z7jjbGWIeaawClsbBxIcVHawndU';  // 多维表格 base token
const TEST_FILE_PATH = path.resolve(__dirname, 'medias-test.png');

/**
 * 打印权限帮助信息
 */
function printPermissionHelp() {
  console.log('\n========================================');
  console.log('    ⚠️  权限配置帮助');
  console.log('========================================\n');
  console.log('错误原因：飞书应用缺少必要的权限\n');
  console.log('解决步骤：\n');
  console.log('1. 访问飞书开放平台：https://open.feishu.cn/app');
  console.log('2. 选择你的应用：cli_a737****101c');
  console.log('3. 进入「权限管理」页面');
  console.log('4. 添加以下权限：');
  console.log('   - drive:media:upload  (上传素材)');
  console.log('   - drive:media:download (下载素材)');
  console.log('   - drive:drive          (访问云空间)');
  console.log('   - bitable:app          (访问多维表格)');
  console.log('5. 点击「批量开通」');
  console.log('6. 进入「版本管理与发布」，创建并发布一个版本');
  console.log('\n另外，确保应用已被添加到该多维表格的协作者中：');
  console.log('   多维表格 -> 分享 -> 添加协作者 -> 搜索应用名称\n');
}

/**
 * 测试上传素材到多维表格
 */
async function testUploadMedia() {
  console.log('=== 测试上传素材到多维表格 ===\n');

  // 检查测试文件是否存在
  if (!fs.existsSync(TEST_FILE_PATH)) {
    console.error(`❌ 测试文件不存在: ${TEST_FILE_PATH}`);
    return;
  }

  const stats = fs.statSync(TEST_FILE_PATH);
  console.log(`测试文件: ${TEST_FILE_PATH}`);
  console.log(`文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`目标多维表格: ${BASE_TOKEN}\n`);

  try {
    // 上传图片到多维表格
    const result = await uploadMedia(
      TEST_FILE_PATH,
      'bitable_image',  // 多维表格图片类型
      BASE_TOKEN,       // 多维表格 base token
      { fileName: 'test-upload.png' }
    );

    console.log('\n✅ 上传成功！');
    console.log('素材 Token:', result.file_token);
    console.log('素材名称:', result.file_name);
    console.log('素材大小:', (result.size / 1024).toFixed(2), 'KB');

    return result.file_token;
  } catch (error: any) {
    console.error('\n❌ 上传失败:', error.message);
    
    // 检查是否是权限错误
    if (error.message?.includes('403') || error.message?.includes('forbidden')) {
      printPermissionHelp();
    }
    
    throw error;
  }
}

/**
 * 测试下载素材
 */
async function testDownloadMedia(fileToken: string) {
  console.log('\n=== 测试下载素材 ===\n');

  const downloadPath = path.resolve(__dirname, 'medias-test-downloaded.png');

  try {
    const result = await downloadMedia(fileToken, downloadPath);

    console.log('✅ 下载成功！');
    console.log('保存路径:', result.filePath);
    console.log('文件大小:', (result.size / 1024).toFixed(2), 'KB');

    return downloadPath;
  } catch (error: any) {
    console.error('❌ 下载失败:', error.message);
    throw error;
  }
}

/**
 * 测试批量获取临时下载链接
 */
async function testBatchGetDownloadUrls(fileToken: string) {
  console.log('\n=== 测试批量获取临时下载链接 ===\n');

  try {
    const urls = await batchGetMediaDownloadUrls([fileToken]);

    console.log('✅ 获取成功！');
    urls.forEach(item => {
      console.log(`\n素材 Token: ${item.file_token}`);
      console.log(`临时下载链接: ${item.tmp_download_url.substring(0, 80)}...`);
      console.log('链接有效期: 24小时');
    });

    return urls;
  } catch (error: any) {
    console.error('❌ 获取失败:', error.message);
    throw error;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('========================================');
  console.log('    飞书素材管理功能测试');
  console.log('========================================\n');

  let uploadedFileToken: string | undefined;

  try {
    // 测试上传
    uploadedFileToken = await testUploadMedia();

    // 如果上传成功，继续测试下载
    if (uploadedFileToken) {
      // 等待一下，让飞书服务器处理
      console.log('\n等待 2 秒让服务器处理...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试下载
      await testDownloadMedia(uploadedFileToken);

      // 测试获取临时下载链接
      await testBatchGetDownloadUrls(uploadedFileToken);
    }

    console.log('\n========================================');
    console.log('    ✅ 所有测试完成！');
    console.log('========================================');
  } catch (error) {
    console.log('\n========================================');
    console.log('    ❌ 测试过程中出现错误');
    console.log('========================================');
    process.exit(1);
  }
}

// 运行测试
runTests();
