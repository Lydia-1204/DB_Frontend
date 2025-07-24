// packages/types/src/index.ts

// 基于 ElderlyInfo (老人基本信息表) [cite: 5]
export interface ElderlyInfo {
  elderly_id: string;
  name: string;
  id_card: string;
  // ... 其他您需要的字段
}

// 基于 HealthMonitoring (健康监测记录表) [cite: 7]
export interface HealthMonitoring {
  record_id: string;
  elderly_id: string;
  timestamp: string;
  heart_rate: number;
  blood_pressure: string;
  // ... 其他您需要的字段
}