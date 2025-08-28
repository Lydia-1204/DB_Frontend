// 仅保留与后端预约接口相关的核心类型
export interface Appointment {
  registrationId: number;              // 预约ID
  visitorId?: number;                  // 访客ID（创建者/提交者）
  elderlyId?: number;                  // 老人ID（0=全体 或 指定）
  visitorName: string;                 // 访客姓名
  visitTime?: string;                  // 预约时间（后端生成 ISO 字符串）
  relationshipToElderly: string;       // 与老人关系
  visitReason: string;                 // 探视原因
  visitType: string;                   // 探视类型（视频探视/线下探视）
  approvalStatus?: string;             // 审批状态（待批准/已批准/已拒绝 等）
}

export type Page = 'home' | 'query' | 'batchAppointment' | 'individualAppointment' | 'appointments';

// 常量
export const API_BASE_URL = 'http://47.96.238.102:9000';
export const DEFAULT_ELDERLY_ID = 1;
