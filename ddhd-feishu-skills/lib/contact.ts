/**
 * 通讯录 API 基础能力
 * 
 * 飞书文档: https://open.feishu.cn/document/server-docs/docs/contact-v3/user/overview
 */

import { client } from './client';

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户的唯一标识 */
  user_id: string;
  /** 用户的邮箱 */
  email?: string;
  /** 用户的手机号 */
  mobile?: string;
  /** 用户的中文名 */
  name: string;
  /** 用户的英文名 */
  en_name?: string;
  /** 用户所属部门名称列表 */
  department_names?: string[];
  /** 用户的职位 */
  job_title?: string;
  /** 用户头像 */
  avatar?: {
    avatar_72?: string;
    avatar_240?: string;
    avatar_640?: string;
  };
  /** 用户状态 */
  status?: {
    is_activated: boolean;
    is_frozen: boolean;
    is_resigned: boolean;
  };
}

/**
 * 获取单个用户信息
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/contact-v3/user/get
 * 
 * @param userId - 用户 ID
 * @param userIdType - ID 类型: open_id | union_id | user_id
 * @returns 用户信息
 */
export async function getUserInfo(
  userId: string,
  userIdType: 'open_id' | 'union_id' | 'user_id' = 'user_id'
): Promise<UserInfo | null> {
  try {
    const res = await client.contact.v3.user.get({
      path: { user_id: userId },
      params: { user_id_type: userIdType },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    return res.data?.user ? formatUserInfo(res.data.user) : null;
  } catch (error: any) {
    if (error?.code === 99991401 || error?.msg?.includes('user not found')) {
      return null;
    }
    throw new Error(`获取用户信息失败: ${error.message || error}`);
  }
}

/**
 * 批量获取用户信息
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/contact-v3/user/batch
 * 
 * @param userIds - 用户 ID 数组（最多 50 个）
 * @param userIdType - ID 类型
 * @returns 用户列表
 */
export async function batchGetUserInfo(
  userIds: string[],
  userIdType: 'open_id' | 'union_id' | 'user_id' = 'user_id'
): Promise<UserInfo[]> {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  if (userIds.length > 50) throw new Error('批量获取一次最多支持 50 个用户 ID');

  try {
    const res = await client.contact.v3.user.batch({
      params: {
        user_ids: userIds,
        user_id_type: userIdType,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    return (res.data?.items || []).map(formatUserInfo);
  } catch (error: any) {
    throw new Error(`批量获取用户信息失败: ${error.message || error}`);
  }
}

/**
 * 批量获取用户信息（支持分页）
 * 
 * @param userIds - 用户 ID 数组（支持超过 50 个）
 * @param userIdType - ID 类型
 * @returns 所有用户信息
 */
export async function batchGetUserInfoWithPaging(
  userIds: string[],
  userIdType: 'open_id' | 'union_id' | 'user_id' = 'user_id'
): Promise<UserInfo[]> {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const results: UserInfo[] = [];
  const batchSize = 50;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const users = await batchGetUserInfo(batch, userIdType);
    results.push(...users);
  }

  return results;
}

/**
 * 格式化用户信息
 */
function formatUserInfo(user: any): UserInfo {
  return {
    user_id: user.user_id || '',
    email: user.email || undefined,
    mobile: user.mobile || undefined,
    name: user.name || '',
    en_name: user.en_name || undefined,
    department_names: user.department_ids || undefined,
    job_title: user.job_title || undefined,
    avatar: user.avatar ? {
      avatar_72: user.avatar.avatar_72,
      avatar_240: user.avatar.avatar_240,
      avatar_640: user.avatar.avatar_640,
    } : undefined,
    status: user.status ? {
      is_activated: user.status.is_activated || false,
      is_frozen: user.status.is_frozen || false,
      is_resigned: user.status.is_resigned || false,
    } : undefined,
  };
}
