/**
 * 多维表格协作者管理 API 基础能力
 * 
 * ⚠️ 重要说明：
 * SDK 中的 appRoleMember API 是用于管理【自定义角色】的协作者，不是管理整个多维表格的协作者。
 * 使用这些 API 需要先通过 appRole.create 创建自定义角色，获取 role_id 后才能使用。
 * 
 * 如需管理整个多维表格的协作者权限，请使用飞书云文档权限 API。
 * 
 * 飞书文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/overview
 */

import { client } from './client';

// ============ 类型定义 ============

/**
 * 协作者成员类型
 */
export type CollaboratorMemberType =
  | 'open_id'
  | 'union_id'
  | 'user_id'
  | 'chat_id'
  | 'department_id'
  | 'open_department_id';

/**
 * 协作者信息
 */
export interface CollaboratorInfo {
  /** 成员 ID */
  member_id: string;
  /** 成员类型 */
  member_type: string;
  /** 成员名称 */
  member_name?: string;
  /** 成员英文名 */
  member_en_name?: string;
}

/**
 * 操作结果
 */
export interface CollaboratorResult {
  /** 成员 ID */
  member_id: string;
  /** 成员类型 */
  member_type: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

// ============ 基础 API 封装 ============

/**
 * 列出自定义角色的协作者
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/list
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID（必需）
 * @param pageSize - 每页数量（默认50）
 * @param pageToken - 分页标记
 * @returns 协作者列表
 */
export async function listCollaborators(
  appToken: string,
  roleId: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{
  items: CollaboratorInfo[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}> {
  console.log(`[lib/bitable-collaborator] 正在获取角色 ${roleId} 的协作者列表...`);

  const res: any = await client.bitable.v1.appRoleMember.list({
    path: { 
      app_token: appToken,
      role_id: roleId
    },
    params: {
      page_size: pageSize,
      ...(pageToken && { page_token: pageToken }),
    },
  });

  if (res.code !== 0) {
    throw new Error(`获取协作者列表失败: ${res.code} - ${res.msg}`);
  }

  const items = (res.data?.items || []).map((item: any) => ({
    member_id: item.open_id || item.union_id || item.user_id || item.chat_id || item.department_id || item.open_department_id,
    member_type: item.member_type,
    member_name: item.member_name,
    member_en_name: item.member_en_name,
  }));

  console.log(`[lib/bitable-collaborator] 获取到 ${items.length} 个协作者`);
  
  return {
    items,
    has_more: res.data?.has_more || false,
    page_token: res.data?.page_token,
    total: res.data?.total,
  };
}

/**
 * 新增自定义角色的协作者
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/create
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID（必需）
 * @param memberId - 成员 ID
 * @param memberType - 成员类型
 * @returns 操作结果
 */
export async function addCollaborator(
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: CollaboratorMemberType = 'open_id'
): Promise<CollaboratorResult> {
  console.log(`[lib/bitable-collaborator] 正在添加协作者到角色 ${roleId}: ${memberId}...`);

  try {
    const res: any = await client.bitable.v1.appRoleMember.create({
      path: { 
        app_token: appToken,
        role_id: roleId
      },
      params: {
        member_id_type: memberType,
      },
      data: {
        member_id: memberId,
      },
    });

    if (res.code !== 0) {
      return {
        member_id: memberId,
        member_type: memberType,
        success: false,
        error: `${res.code} - ${res.msg}`,
      };
    }

    console.log(`[lib/bitable-collaborator] 协作者添加成功: ${memberId}`);
    
    return {
      member_id: memberId,
      member_type: memberType,
      success: true,
    };
  } catch (error: any) {
    console.error(`[lib/bitable-collaborator] 添加协作者失败: ${error.message}`);
    return {
      member_id: memberId,
      member_type: memberType,
      success: false,
      error: error.message,
    };
  }
}

/**
 * 批量新增自定义角色的协作者
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/batch_create
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID（必需）
 * @param members - 协作者列表
 * @returns 批量添加结果
 */
export async function batchAddCollaborators(
  appToken: string,
  roleId: string,
  members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[]
): Promise<CollaboratorResult[]> {
  console.log(`[lib/bitable-collaborator] 正在批量添加 ${members.length} 个协作者到角色 ${roleId}...`);

  // 构建请求数据
  const memberList = members.map(c => ({
    type: c.memberType,
    id: c.memberId,
  }));

  const res: any = await client.bitable.v1.appRoleMember.batchCreate({
    path: { 
      app_token: appToken,
      role_id: roleId
    },
    data: {
      member_list: memberList,
    },
  });

  if (res.code !== 0) {
    throw new Error(`批量添加协作者失败: ${res.code} - ${res.msg}`);
  }

  // SDK 返回可能没有详细的失败信息，返回简单结果
  const results: CollaboratorResult[] = members.map(m => ({
    member_id: m.memberId,
    member_type: m.memberType,
    success: res.code === 0,
  }));

  console.log(`[lib/bitable-collaborator] 批量添加完成: ${members.length} 个`);

  return results;
}

/**
 * 删除自定义角色的协作者
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/delete
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID（必需）
 * @param memberId - 成员 ID
 * @param memberType - 成员类型
 * @returns 是否成功
 */
export async function removeCollaborator(
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: CollaboratorMemberType = 'open_id'
): Promise<boolean> {
  console.log(`[lib/bitable-collaborator] 正在从角色 ${roleId} 删除协作者: ${memberId}...`);

  try {
    const res: any = await client.bitable.v1.appRoleMember.delete({
      path: { 
        app_token: appToken,
        role_id: roleId,
        member_id: memberId
      },
      params: {
        member_id_type: memberType,
      },
    });

    if (res.code !== 0) {
      console.error(`[lib/bitable-collaborator] 删除协作者失败: ${res.code} - ${res.msg}`);
      return false;
    }

    console.log(`[lib/bitable-collaborator] 协作者删除成功: ${memberId}`);
    return true;
  } catch (error: any) {
    console.error(`[lib/bitable-collaborator] 删除协作者失败: ${error.message}`);
    return false;
  }
}

/**
 * 批量删除自定义角色的协作者
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member/batch_delete
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID（必需）
 * @param members - 要删除的协作者列表
 * @returns 删除结果
 */
export async function batchRemoveCollaborators(
  appToken: string,
  roleId: string,
  members: { memberId: string; memberType: CollaboratorMemberType }[]
): Promise<CollaboratorResult[]> {
  console.log(`[lib/bitable-collaborator] 正在批量删除角色 ${roleId} 的 ${members.length} 个协作者...`);

  // 构建请求数据
  const memberList = members.map(c => ({
    type: c.memberType,
    id: c.memberId,
  }));

  const res: any = await client.bitable.v1.appRoleMember.batchDelete({
    path: { 
      app_token: appToken,
      role_id: roleId
    },
    data: {
      member_list: memberList,
    },
  });

  if (res.code !== 0) {
    throw new Error(`批量删除协作者失败: ${res.code} - ${res.msg}`);
  }

  // SDK 返回可能没有详细的失败信息，返回简单结果
  const results: CollaboratorResult[] = members.map(m => ({
    member_id: m.memberId,
    member_type: m.memberType,
    success: res.code === 0,
  }));

  console.log(`[lib/bitable-collaborator] 批量删除完成: ${members.length} 个`);

  return results;
}

// ============ 组合能力 ============

/**
 * 一键添加多个协作者到自定义角色（支持批量）
 * 
 * @param appToken - 应用标识
 * @param roleId - 自定义角色 ID
 * @param members - 协作者列表
 * @returns 添加结果
 */
export async function addCollaboratorsToRole(
  appToken: string,
  roleId: string,
  members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[]
): Promise<{
  success: CollaboratorResult[];
  failed: CollaboratorResult[];
}> {
  console.log(`\n[lib/bitable-collaborator] ========== 开始添加协作者 ==========`);
  console.log(`[lib/bitable-collaborator] 目标应用: ${appToken}`);
  console.log(`[lib/bitable-collaborator] 目标角色: ${roleId}`);
  console.log(`[lib/bitable-collaborator] 协作者数量: ${members.length}`);

  // 如果数量较少，直接批量添加
  if (members.length <= 100) {
    const results = await batchAddCollaborators(appToken, roleId, members);
    
    const success = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`[lib/bitable-collaborator] ========== 添加完成 ==========`);
    console.log(`[lib/bitable-collaborator] 成功: ${success.length}, 失败: ${failed.length}`);

    return { success, failed };
  }

  // 如果数量超过100，分批处理
  console.log(`[lib/bitable-collaborator] 协作者数量超过100，分批处理...`);
  
  const allResults: CollaboratorResult[] = [];
  const batchSize = 100;
  
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    console.log(`[lib/bitable-collaborator] 处理第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length} 个)...`);
    
    const results = await batchAddCollaborators(appToken, roleId, batch);
    allResults.push(...results);
  }

  const success = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`[lib/bitable-collaborator] ========== 全部完成 ==========`);
  console.log(`[lib/bitable-collaborator] 成功: ${success.length}, 失败: ${failed.length}`);

  return { success, failed };
}

// ============ 自定义角色管理 ============

/**
 * 列出自定义角色
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/list
 * 
 * @param appToken - 应用标识
 * @param pageSize - 每页数量
 * @param pageToken - 分页标记
 */
export async function listAppRoles(
  appToken: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{
  items: any[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}> {
  console.log(`[lib/bitable-collaborator] 正在获取自定义角色列表...`);

  // 使用 as any 绕过类型检查，确保传递正确的参数格式
  const res: any = await (client.bitable.v1.appRole as any).list({
    path: { app_token: appToken },
    params: {
      page_size: pageSize,
      ...(pageToken && { page_token: pageToken }),
    },
  });

  if (res.code !== 0) {
    throw new Error(`获取自定义角色列表失败: ${res.code} - ${res.msg}`);
  }

  console.log(`[lib/bitable-collaborator] 获取到 ${res.data?.items?.length || 0} 个自定义角色`);
  
  return {
    items: res.data?.items || [],
    has_more: res.data?.has_more || false,
    page_token: res.data?.page_token,
    total: res.data?.total,
  };
}
