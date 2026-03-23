// 预定义的头像颜色方案
const avatarColors = [
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-yellow-500", text: "text-gray-900" },
  { bg: "bg-lime-500", text: "text-gray-900" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
  { bg: "bg-sky-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-fuchsia-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-slate-600", text: "text-white" },
  { bg: "bg-gray-600", text: "text-white" },
  { bg: "bg-zinc-600", text: "text-white" },
];

/**
 * 根据字符串生成哈希值
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
}

/**
 * 根据用户ID或用户名获取头像颜色
 */
export function getAvatarColor(userIdOrName: string): {
  bg: string;
  text: string;
} {
  const hash = hashString(userIdOrName);
  const index = hash % avatarColors.length;
  return avatarColors[index];
}

/**
 * 获取用户姓名首字母
 */
export function getInitials(name: string, length: number = 2): string {
  if (!name) return "?";
  return name.slice(0, length).toUpperCase();
}
