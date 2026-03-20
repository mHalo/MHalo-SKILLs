/**
 * 多维表格自定义角色管理 API 基础能力
 * 
 * 飞书文档:
 * - 新增自定义角色: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/create
 * - 更新自定义角色: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/update
 * - 列出自定义角色: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/list
 * - 删除自定义角色: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/delete
 */

import { client } from './client';

// ============ 类型定义 ============

/**
 * 表格权限级别
 * 1: 可阅读, 2: 可编辑, 4: 可管理
 */
export type TablePerm = 1 | 2 | 4;

/**
 * 表格角色配置
 */
export interface TableRoleConfig {
  /** 表格权限: 1-可阅读, 2-可编辑, 4-可管理 */
  table_perm: TablePerm;
  /** 表格名称 */
  table_name?: string;
  /** 表格 ID */
  table_id?: string;
  /** 允许新增记录 */
  allow_add_record?: boolean;
  /** 允许删除记录 */
  allow_delete_record?: boolean;
}

/**
 * 自定义角色信息
 */
export interface RoleInfo {
  /** 角色名称 */
  role_name: string;
  /** 角色 ID */
  role_id?: string;
  /** 表格角色配置列表 */
  table_roles: TableRoleConfig[];
  /** 仪表盘角色配置 */
  block_roles?: Array<{
    block_id: string;
    block_perm: number;
  }>;
}

/**
 * 创建角色结果
 */
export interface CreateRoleResult {
  success: boolean;
  role_id?: string;
  role_name?: string;
  error?: string;
}

/**
 * 删除角色结果
 */
export interface DeleteRoleResult {
  success: boolean;
  error?: string;
}

// ============ 内部辅助函数 ============

/**
 * 获取应用中的所有表格
 */
async function getAppTables(appToken: string): Promise<Array<{ table_id: string; name: string }>> {
  try {
    const res: any = await client.bitable.v1.appTable.list({
      path: { app_token: appToken },
    });

    if (res.code === 0 && res.data?.items) {
      return res.data.items.map((item: any) => ({
        table_id: item.table_id,
        name: item.name,
      }));
    }
  } catch (error: any) {
    console.error(`[lib/bitable-role] 获取表格列表失败: ${error.message}`);
  }
  return [];
}

// ============ 基础 API 封装 ============

/**
 * 新增自定义角色
 * 
 * API: client.bitable.v1.appRole.create
 * 
 * @param appToken - 应用标识
 * @param roleName - 角色名称
 * @param tableRoles - 表格角色配置列表
 * @returns 创建结果
 */
export async function createAppRole(
  appToken: string,
  roleName: string,
  tableRoles: TableRoleConfig[]
): Promise<CreateRoleResult> {
  console.log(`[lib/bitable-role] 正在创建自定义角色: ${roleName}...`);

  try {
    // 如果没有提供 table_id，需要获取应用中的表格列表
    let finalTableRoles = tableRoles;
    if (tableRoles.length === 0 || !tableRoles[0].table_id) {
      const tables = await getAppTables(appToken);
      if (tables.length === 0) {
        return {
          success: false,
          error: '应用中没有表格，无法创建角色',
        };
      }
      
      // 为每个表格设置相同的权限
      const perm = tableRoles[0]?.table_perm || 2;
      const allowAdd = tableRoles[0]?.allow_add_record ?? true;
      const allowDelete = tableRoles[0]?.allow_delete_record ?? true;
      
      finalTableRoles = tables.map(table => ({
        table_id: table.table_id,
        table_perm: perm,
        allow_add_record: allowAdd,
        allow_delete_record: allowDelete,
      }));
    }

    const res: any = await (client as any).bitable.v1.appRole.create({
      path: { app_token: appToken },
      data: {
        role_name: roleName,
        table_roles: finalTableRoles,
      },
    });

    if (res.code !== 0) {
      return {
        success: false,
        error: `${res.code} - ${res.msg}`,
      };
    }

    const roleId = res.data?.role?.role_id;
    console.log(`[lib/bitable-role] 角色创建成功: ${roleName} (${roleId})`);

    return {
      success: true,
      role_id: roleId,
      role_name: res.data?.role?.role_name || roleName,
    };
  } catch (error: any) {
    console.error(`[lib/bitable-role] 创建角色失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 更新自定义角色
 * 
 * API: client.bitable.v1.appRole.update
 * 
 * @param appToken - 应用标识
 * @param roleId - 角色 ID
 * @param roleName - 角色名称
 * @param tableRoles - 表格角色配置列表
 * @returns 是否成功
 */
export async function updateAppRole(
  appToken: string,
  roleId: string,
  roleName: string,
  tableRoles: TableRoleConfig[]
): Promise<boolean> {
  console.log(`[lib/bitable-role] 正在更新自定义角色: ${roleId}...`);

  try {
    // 如果没有提供 table_id，需要获取应用中的表格列表
    let finalTableRoles = tableRoles;
    if (tableRoles.length === 0 || !tableRoles[0].table_id) {
      const tables = await getAppTables(appToken);
      if (tables.length === 0) {
        console.error('[lib/bitable-role] 应用中没有表格');
        return false;
      }
      
      const perm = tableRoles[0]?.table_perm || 2;
      const allowAdd = tableRoles[0]?.allow_add_record ?? true;
      const allowDelete = tableRoles[0]?.allow_delete_record ?? true;
      
      finalTableRoles = tables.map(table => ({
        table_id: table.table_id,
        table_perm: perm,
        allow_add_record: allowAdd,
        allow_delete_record: allowDelete,
      }));
    }

    const res: any = await (client as any).bitable.v1.appRole.update({
      path: { 
        app_token: appToken,
        role_id: roleId
      },
      data: {
        role_name: roleName,
        table_roles: finalTableRoles,
      },
    });

    if (res.code !== 0) {
      console.error(`[lib/bitable-role] 更新角色失败: ${res.code} - ${res.msg}`);
      return false;
    }

    console.log(`[lib/bitable-role] 角色更新成功: ${roleId}`);
    return true;
  } catch (error: any) {
    console.error(`[lib/bitable-role] 更新角色失败: ${error.message}`);
    return false;
  }
}

/**
 * 列出自定义角色
 * 
 * API: client.base.v2.appRole.list
 * 
 * @param appToken - 应用标识
 * @param pageSize - 每页数量
 * @param pageToken - 分页标记
 * @returns 角色列表
 */
export async function listAppRolesV2(
  appToken: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{
  items: RoleInfo[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}> {
  console.log(`[lib/bitable-role] 正在获取自定义角色列表...`);

  try {
    const res: any = await (client as any).base.v2.appRole.list({
      path: { app_token: appToken },
      params: {
        page_size: pageSize,
        ...(pageToken && { page_token: pageToken }),
      },
    });

    if (res.code !== 0) {
      throw new Error(`获取角色列表失败: ${res.code} - ${res.msg}`);
    }

    const items = (res.data?.items || []).map((item: any) => ({
      role_name: item.role_name,
      role_id: item.role_id,
      table_roles: item.table_roles || [],
      block_roles: item.block_roles,
    }));

    console.log(`[lib/bitable-role] 获取到 ${items.length} 个自定义角色`);

    return {
      items,
      has_more: res.data?.has_more || false,
      page_token: res.data?.page_token,
      total: res.data?.total,
    };
  } catch (error: any) {
    console.error(`[lib/bitable-role] 获取角色列表失败: ${error.message}`);
    throw error;
  }
}

/**
 * 删除自定义角色
 * 
 * API: client.bitable.v1.appRole.delete
 * 
 * @param appToken - 应用标识
 * @param roleId - 角色 ID
 * @returns 删除结果
 */
export async function deleteAppRole(
  appToken: string,
  roleId: string
): Promise<DeleteRoleResult> {
  console.log(`[lib/bitable-role] 正在删除自定义角色: ${roleId}...`);

  try {
    const res: any = await (client as any).bitable.v1.appRole.delete({
      path: { 
        app_token: appToken,
        role_id: roleId
      },
    });

    if (res.code !== 0) {
      return {
        success: false,
        error: `${res.code} - ${res.msg}`,
      };
    }

    console.log(`[lib/bitable-role] 角色删除成功: ${roleId}`);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error(`[lib/bitable-role] 删除角色失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============ 便捷方法 ============

/**
 * 创建管理员角色
 * 
 * @param appToken - 应用标识
 * @param roleName - 角色名称
 * @returns 创建结果
 */
export async function createAdminRole(
  appToken: string,
  roleName: string = '管理员'
): Promise<CreateRoleResult> {
  console.log(`[lib/bitable-role] 正在创建管理员角色...`);

  return createAppRole(appToken, roleName, [
    {
      table_perm: 4, // 可管理
      allow_add_record: true,
      allow_delete_record: true,
    }
  ]);
}

/**
 * 创建编辑者角色
 * 
 * @param appToken - 应用标识
 * @param roleName - 角色名称
 * @returns 创建结果
 */
export async function createEditorRole(
  appToken: string,
  roleName: string = '编辑者'
): Promise<CreateRoleResult> {
  console.log(`[lib/bitable-role] 正在创建编辑者角色...`);

  return createAppRole(appToken, roleName, [
    {
      table_perm: 2, // 可编辑
      allow_add_record: true,
      allow_delete_record: true,
    }
  ]);
}

/**
 * 获取或创建角色
 * 
 * 如果角色已存在则返回现有角色 ID，否则创建新角色
 * 
 * @param appToken - 应用标识
 * @param roleName - 角色名称
 * @param tablePerm - 表格权限级别
 * @returns 角色 ID
 */
export async function getOrCreateRole(
  appToken: string,
  roleName: string,
  tablePerm: TablePerm
): Promise<string | null> {
  console.log(`[lib/bitable-role] 获取或创建角色: ${roleName}...`);

  // 先列出所有角色查找是否已存在
  try {
    const roles = await listAppRolesV2(appToken);
    const existingRole = roles.items.find(r => r.role_name === roleName);
    
    if (existingRole?.role_id) {
      console.log(`[lib/bitable-role] 找到现有角色: ${existingRole.role_id}`);
      return existingRole.role_id;
    }
  } catch (error: any) {
    console.error(`[lib/bitable-role] 列出角色失败: ${error.message}`);
  }

  // 不存在则创建
  const result = await createAppRole(appToken, roleName, [
    {
      table_perm: tablePerm,
      allow_add_record: tablePerm >= 2,
      allow_delete_record: tablePerm >= 2,
    }
  ]);
  
  return result.success ? result.role_id || null : null;
}
