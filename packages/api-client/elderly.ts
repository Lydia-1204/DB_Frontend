// 同样从共享的 types 包中导入类型
import type { ElderlyInfo } from '@smart-elderly-care/types';

/**
 * 模拟一个从后端获取老人信息的API函数
 * @param elderlyId 老人的ID
 * @returns 返回一个包含老人信息的Promise
 */
export const fetchElderlyInfoById = async (elderlyId: string): Promise<ElderlyInfo> => {
  console.log(`正在从服务器获取 ID 为 ${elderlyId} 的老人信息...`);

  // 这里是模拟的网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 模拟的返回数据
  const mockData: ElderlyInfo = {
    elderly_id: elderlyId,
    name: '李奶奶 (模拟数据)',
    id_card: '440...',
  };

  console.log('成功获取到模拟数据:', mockData);
  return mockData;
};