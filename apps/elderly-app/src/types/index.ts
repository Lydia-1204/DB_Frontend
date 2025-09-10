export interface ElderlyProfile {
  elderlyId: number;
  name: string;
  gender: string;
  birthDate?: string;
  idCardNumber?: string;
  contactPhone?: string;
  address?: string;
  emergencyContact?: string;
}

export interface HealthMonitoring {
  monitoringDate: string;
  heartRate: number;
  bloodPressure: string;
  oxygenLevel: number;
  temperature: number;
  status: string;
}

export interface MedicalOrder {
  id: string;
  elderlyId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  instructions: string;
  status: '进行中' | '已完成' | '已暂停';
  nextDoseTime?: string;
  takenToday: boolean;
  orderDate?: string; // 开药时间
}

// 原始护理计划返回（严格保持后端字段，不添加多余属性）
export interface RawNursingPlan {
  planId: number;
  elderlyId: number;
  staffId: number | null;
  planStartDate: string;
  planEndDate: string;
  careType: string;
  priority: string;
  evaluationStatus: string; // 后端字段
}

// 兼容旧组件引用的 NursingPlan（保持原名引用处若还存在）
export type NursingPlan = RawNursingPlan;

export interface ActivitySchedule {

}

export interface DietRecommendation {
  id: string;
  elderlyId: string;
  mealType: '早餐' | '午餐' | '晚餐' | '加餐' | '饮食建议';
  recommendedDate: string;
  foods: {
    name: string;
    portion: string;
    calories: number;
    nutrients: string[];
  }[];
  totalCalories: number;
  specialInstructions: string[];
  executionStatus: '未执行' | '部分执行' | '已执行';
  recommendedFood?: string; // 后端返回的原始食物推荐文本
}

export interface VoiceAssistantReminder {
  // 与后端原始字段保持兼容
  reminder_id?: number;
  order_id?: number;
  elderly_id?: number;
  reminder_time?: string;
  reminder_count?: number;
  reminder_status?: string;

  // 前端需要的便捷字段
  id: string;
  scheduledTime: string; // ISO 字符串
  reminderStatus: '待提醒' | '已提醒' | '已确认' | '已忽略' | string;
  reminderType: string; // '服药' | '活动' | ...
  content: string;
  repeatCount?: number;
  maxRepeat?: number;
}

export interface EmergencySOS {
  id: string;
  elderlyId: string;
  triggerTime: string;
  location: string;
  sosType: '跌倒' | '胸痛' | '呼吸困难' | '其他紧急情况';
  status: '待响应' | '处理中' | '已完成';
  responseTime?: string;
  handlingResult?: string;
}



export interface HealthAssessment {
  assessmentId: number;
  elderlyId: number;
  assessmentDate: string;
  physicalHealthFunction: number;
  psychologicalFunction: number;
  cognitiveFunction: number;
  healthGrade: string;
}
