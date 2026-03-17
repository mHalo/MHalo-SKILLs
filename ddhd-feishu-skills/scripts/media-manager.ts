#!/usr/bin/env ts-node
/**
 * 素材管理器
 * 
 * 场景描述: 上传文件到飞书云空间或下载素材到本地
 * 
 * 使用的基础能力:
 * - lib/drive.ts - uploadMedia, downloadMedia, batchGetMediaDownloadUrls
 * 
 * 使用方法:
 * ```bash
 * # 上传素材
 * npx ts-node scripts/media-manager.ts upload -f ./image.png -t docx_image -n <token>
 * 
 * # 下载素材
 * npx ts-node scripts/media-manager.ts download -t <file_token> -o ./image.png
 * 
 * # 获取临时下载链接
 * npx ts-node scripts/media-manager.ts url --tokens <token1>,<token2>
 * ```
 */

import { uploadMedia, downloadMedia, batchGetMediaDownloadUrls, MediaParentType } from '../lib/drive';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.replace('-', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    }
  }
  return result;
}

function printUsage() {
  console.log(`
素材管理器

用法: npx ts-node scripts/media-manager.ts <命令> [选项]

命令:
  upload      上传素材到云空间
  download    下载素材到本地
  url         获取素材临时下载链接

上传选项:
  -f, --file          本地文件路径（必需）
  -t, --type          素材父类型（必需）
  -n, --node          父节点token（必需）
      --name          自定义文件名

download 选项:
  -t, --token         素材token（必需）
  -o, --output        保存路径（默认: ./downloads/<token>）

url 选项:
      --tokens        素材token列表，逗号分隔（必需）

示例:
  npx ts-node scripts/media-manager.ts upload -f ./image.png -t docx_image -n docxnXxxxxx
  npx ts-node scripts/media-manager.ts download -t boxcnXxxxxx -o ./image.png
  npx ts-node scripts/media-manager.ts url --tokens boxcnXxxxxx,boxcnYyyyyy
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args.slice(1));

  try {
    switch (command) {
      case 'upload': {
        const file = options.f || options.file;
        const parentType = (options.t || options.type) as MediaParentType;
        const parentNode = options.n || options.node;
        const fileName = options.name;

        if (!file || !parentType || !parentNode) {
          console.error('错误: 缺少必需参数 --file, --type, --node');
          printUsage();
          process.exit(1);
        }

        const result = await uploadMedia(file, parentType, parentNode, fileName ? { fileName } : undefined);
        console.log('\n✅ 上传成功!');
        console.log('素材 Token:', result.file_token);
        console.log('素材名称:', result.file_name);
        break;
      }

      case 'download': {
        const token = options.t || options.token;
        const output = options.o || options.output || `./downloads/${token}`;

        if (!token) {
          console.error('错误: 缺少必需参数 --token');
          printUsage();
          process.exit(1);
        }

        const result = await downloadMedia(token, output);
        console.log('\n✅ 下载成功!');
        console.log('保存路径:', result.filePath);
        console.log('文件大小:', `${(result.size / 1024).toFixed(2)} KB`);
        break;
      }

      case 'url': {
        const tokensStr = options.tokens;
        if (!tokensStr) {
          console.error('错误: 缺少必需参数 --tokens');
          printUsage();
          process.exit(1);
        }

        const tokens = tokensStr.split(',').map(t => t.trim());
        const urls = await batchGetMediaDownloadUrls(tokens);
        
        console.log('\n✅ 获取成功!');
        urls.forEach((item, i) => {
          console.log(`\n[${i + 1}] 素材 Token: ${item.file_token}`);
          console.log(`    下载链接: ${item.tmp_download_url}`);
        });
        break;
      }

      default:
        console.error(`错误: 未知命令 "${command}"`);
        printUsage();
        process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
