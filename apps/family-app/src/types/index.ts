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
  // 评估/流程状态：Unpaid(待支付) | Pending(待确认) | Scheduled(待完成) | Completed(已完成)
  evaluationStatus: 'Unpaid' | 'Pending' | 'Scheduled' | 'Completed'; // 若后端扩展仍兼容 string
}

// 兼容旧组件引用的 NursingPlan（保持原名引用处若还存在）
export type NursingPlan = RawNursingPlan;

export interface ActivitySchedule {
  id: string;
  activityName: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  capacity: number;
  currentParticipants: number;
  category: '文娱' | '健身' | '康复' | '社交' | '教育';
  isRegistered: boolean;
  photos?: string[];
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

// 已移除：语音提醒 VoiceAssistantReminder 与紧急呼叫 EmergencySOS

export interface BillingRecord {
  id: string;
  elderlyId: number;
  item: string;
  amount: number;
  billingDate: string;
  status: '未支付' | '已支付' | '已取消';
  remark?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  publisher?: string;
  category?: string;
  important?: boolean;
}

// 系统公告（来自 /api/SystemAnnouncement）
export interface SystemAnnouncementComment {
  commenterId: number;
  commenterType: string; // 家属/员工/老人
  comment: string;
  commentTime?: string;
}

export interface SystemAnnouncement {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  status: string; // 已发布 / 已撤回
  audience: string; // 家属 / 员工 / 全体
  publisher?: string;
  category?: string;
  important?: boolean;
  comments?: SystemAnnouncementComment[];
}

export interface ElectronicFenceAlert {
  id: string;
  elderlyId: string;
  alertTime: string;
  location: string;
  fenceType: '室内安全区' | '院内活动区' | '外出许可区';
  alertType: '进入' | '离开' | '异常停留';
  status: '待处理' | '已处理';
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
