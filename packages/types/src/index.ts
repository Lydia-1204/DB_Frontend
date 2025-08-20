// packages/types/src/index.ts

// 文件来源: ElderlyInfo.cs
export interface ElderlyInfo {
  elderlyId: number;
  name: string;
  gender: string;
  birthDate?: string;
  idCardNumber: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
}

// 文件来源: StaffInfo.cs
// Note: Based on STAFFINFO class
export interface StaffInfo {
  staffId: number;
  name: string;
  position: string;
  contactPhone: string;
  skillLevel: string;
  workSchedule: string;
  
  // 我们暂时保留这些，即使当前API没返回，以备后用
  // 但要注意，在代码中使用它们之前要先判断是否存在
  gender?: string;
  email?: string;
  hireDate?: string; 
  salary?: number; 
  SKILL_LEVEL: string;
  WORK_SCHEDULE: string;
  // Navigation properties are kept for completeness
  ACTIVITYSCHEDULES: ActivitySchedule[];
  DISINFECTIONRECORDS: DisinfectionRecord[];
  RESPONSIBLE_EMERGENCYSOS: EmergencySOS[];
  MEDICALORDERS: MedicalOrder[];
  NURSINGPLANS: NursingPlan[];
  OPERATIONLOGS: OperationLog[];
  SOSNOTIFICATIONS: SosNotification[];
  CREATED_ANNOUNCEMENTS: SystemAnnouncements[];
  STAFFLOCATIONS: StaffLocation[];
  STAFFSCHEDULES: StaffSchedule[];
}

// 文件来源: FamilyInfo.cs
export interface FamilyInfo {
  // 注意：后端返回的 familyInfos 里没有 familyId 和 elderlyId
  name: string;
  relationship: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  isPrimaryContact: string; // 'Y' or 'N'
}

// 文件来源: HealthMonitoring.cs
export interface HealthMonitoring {
  monitoringDate: string;
  heartRate: number;
  bloodPressure: string;
  oxygenLevel: number;
  temperature: number;
  status: string;
}

// 文件来源: MedicalOrder.cs
export interface MedicalOrder {
  orderId: number;
  elderlyId: number;
  orderDate: string;
  staffId: number;
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
}

// 文件来源: NursingPlan.cs

export interface NursingPlan {
  planId: number;
  elderlyId: number;
  staffId: number;
  planStartDate: string; // ISO 8601 format string, e.g., "2025-08-19T15:46:40"
  planEndDate: string;
  careType: 'Normal' | 'Emergency'; // Use a union type for specific values
  priority: 'Basic' | 'Normal' | 'High';
  evaluationStatus: string; // e.g., "Scheduled"
}

// 文件来源: FeeSettlement.cs
export interface FeeSettlement {
  settlementId: number;
  elderlyId: number;
  totalAmount: number;
  insuranceAmount: number;
  personalPayment: number;
  settlementDate: string;
  paymentStatus: string;
  paymentMethod: string;
  staffId: number;
}

// 文件来源: FeeDetail.cs
export interface FeeDetail {
    id: number;
    fee_settlement_id: number;
    fee_type: string;
    description: string;
    amount: number; // Corresponds to decimal
    start_date?: string; // Corresponds to DateTime?
    end_date?: string; // Corresponds to DateTime?
    quantity?: number;
    unit_price?: number; // Corresponds to decimal?
}

// 文件来源: HealthAssessmentReport.cs
export interface HealthAssessmentReport {
  // 注意：后端返回的名字是 healthAssessments
  assessmentDate: string;
  physicalHealthFunction: number;
  psychologicalFunction: number;
  cognitiveFunction: number;
  healthGrade: string;
}


// 文件来源: ActivitySchedule.cs
export interface ActivitySchedule {
  activity_id: number;
  activity_name: string;
  activity_date: string; // Corresponds to DateTime
  activity_time: string; // Corresponds to TimeSpan
  location: string;
  staff_id: number;
  elderly_participants?: string;
  activity_description?: string;
}

// 文件来源: ActivityParticipation.cs
export interface ActivityParticipation {
  participationId: number;
  activityId: number;
  elderlyId: number;
  status: string;
  registrationTime: string;
  checkInTime?: string;
  feedback?: string;
}

// 文件来源: DietRecommendation.cs
export interface DietRecommendation {
  recommendationId: number;
  elderlyId: number;
  recommendationDate: string;
  recommendedFood: string;
  executionStatus: string;
}

// 文件来源: EmergencySOS.cs
// Note: Based on EMERGENCYSOS class
export interface EmergencySOS {
  CALL_ID: number; // Corresponds to decimal
  ELDERLY_ID: number; // Corresponds to decimal
  CALL_TIME: string; // Corresponds to DateTime
  CALL_TYPE: string;
  ROOM_ID?: number; // Corresponds to decimal?
  RESPONSE_TIME?: string; // Corresponds to DateTime?
  RESPONSE_STAFF_ID?: number; // Corresponds to decimal?
  FOLLOW_UP_REQUIRED: boolean;
  CALL_STATUS: string;
  HANDLING_RESULT: string;
}

// 文件来源: SystemAnnouncements.cs
export interface SystemAnnouncements {
  announcement_id: number;
  announcement_date: string; // Corresponds to DateTime
  announcement_type: string;
  announcement_content: string;
  status: string;
  audience: string;
  created_by: number;
  read_status: string;
  comments: string;
}

// 文件来源: DisinfectionRecord.cs
// Note: Based on DISINFECTIONRECORD class
export interface DisinfectionRecord {
  DISINFECTION_ID: number; // Corresponds to decimal
  AREA: string;
  DISINFECTION_TIME: string; // Corresponds to DateTime
  STAFF_ID: number; // Corresponds to decimal
  METHODS: string;
}
// ... 其他接口



// 文件来源: OperationLog.cs
export interface OperationLog {
  log_id: number;
  staff_id: number;
  operation_time: string; // Corresponds to DateTime
  operation_type: string;
  operation_description: string;
  affected_entity: string;
  operation_status: string;
  ip_address: string;
  device_type: string;
}

// 文件来源: RoomManagement.cs
export interface RoomManagement {
  RoomId: number;
  RoomNumber: string;
  RoomType: string;
  Capacity: number;
  Status: string;
  Rate: number; // Corresponds to decimal
  BedType: string;
  Floor: number;
}

// 文件来源: DeviceStatus.cs
export interface DeviceStatus {
  DeviceId: number;
  DeviceName: string;
  DeviceType: string;
  InstallationDate: string; // Corresponds to DateTime
  Status: string;
  LastMaintenanceDate?: string; // Corresponds to DateTime?
  MaintenanceStatus?: string;
  Location: string;
}

// 文件来源: ElectronicFence.cs
export interface ElectronicFence {
  FenceId: number;
  AreaDefinition: string;
}

// 文件来源: FenceLog.cs
export interface FenceLog {
  EventLogId: number;
  ElderlyId: number;
  FenceId: number;
  EntryTime: string; // Corresponds to DateTime
  ExitTime?: string; // Corresponds to DateTime?
}

// 文件来源: MedicineInventory.cs
export interface MedicineInventory {
  medicine_id: number;
  medicine_name: string;
  medicine_type: string;
  unit_price: number; // Corresponds to decimal
  quantity_in_stock: number;
  minimum_stock_level: number;
  supplier: string;
  expiration_date: string; // Corresponds to DateTime
  description?: string;
}

// 文件来源: MedicineProcurement.cs
export interface MedicineProcurement {
  procurement_id: number;
  medicine_id: number;
  purchase_quantity: number;
  purchase_time: string; // Corresponds to DateTime
  staff_id: number;
  status: string;
}

// 文件来源: VoiceAssistantReminder.cs
export interface VoiceAssistantReminder {
  reminder_id: number;
  order_id: number;
  elderly_id: number;
  reminder_time: string; // Corresponds to DateTime
  reminder_count: number;
  reminder_status: string;
}

// 文件来源: HealthThreshold.cs
export interface HealthThreshold {
  threshold_id: number;
  elderly_id: number;
  data_type: string;
  min_value: number; // Corresponds to float
  max_value: number; // Corresponds to float
  description?: string;
}

// 文件来源: HealthAlerts.cs
// Note: Based on HealthAlert class
export interface HealthAlert {
  alert_id: number;
  elderly_id: number;
  alert_type: string;
  alert_time: string; // Corresponds to DateTime
  alert_value: string;
  notified_staff_id: number;
  status: string;
}

// 文件来源: VisitorRegistration.cs
export interface VisitorRegistration {
  visitor_id: number;
  family_id: number;
  elderly_id: number;
  visitor_name: string;
  visit_time: string; // Corresponds to DateTime
  relationship_to_elderly: string;
  visit_reason: string;
  visit_type: string;
  approval_status: string;
}

// 文件来源: StaffSchedule.cs
// Note: Based on STAFFSCHEDULE class
export interface StaffSchedule {
  SCHEDULE_ID: number; // Corresponds to decimal
  STAFF_ID: number; // Corresponds to decimal
  DAY_OF_WEEK: number; // Corresponds to byte
  START_TIME: string; // Corresponds to TimeSpan
  END_TIME: string; // Corresponds to TimeSpan
}

// 文件来源: SosNotification.cs
// Note: Based on SOSNOTIFICATION class
export interface SosNotification {
  NOTIFICATION_ID: number; // Corresponds to decimal
  CALL_ID: number; // Corresponds to decimal
  STAFF_ID: number; // Corresponds to decimal
  NOTIFICATION_TIME: string; // Corresponds to DateTime
  IS_RESPONDED: boolean;
  RESPONSE_TIME?: string; // Corresponds to DateTime?
}

// 文件来源: StaffLocation.cs
// Note: Based on STAFFLOCATION class
export interface StaffLocation {
  LOCATION_ID: number; // Corresponds to decimal
  STAFF_ID: number; // Corresponds to decimal
  FLOOR?: number; // Corresponds to decimal?
  UPDATE_TIME: string; // Corresponds to DateTime
}

export interface DisinfectionReportData {
  month: string;
  totalDisinfections: number;
  byArea: Record<string, number>;
  byStaff: Record<string, number>;
  byMethod: Record<string, number>;
}

export interface ElderlyProfile {
  elderlyInfo: ElderlyInfo;
  familyInfos: FamilyInfo[];
  healthMonitorings: HealthMonitoring[];
  healthAssessments: HealthAssessmentReport[];
  medicalOrders: MedicalOrder[];
  nursingPlans: NursingPlan[];
  feeSettlements: FeeSettlement[];
  activityParticipations: ActivityParticipation[];
}

// ↓↓↓↓ 新增 SOS 事件的类型接口 ↓↓↓↓
export interface EmergencySosEvent {
  calL_ID: number;           // 修正
  elderlY_ID: number;        // 修正
  calL_TIME: string;
  calL_TYPE: string;
  rooM_ID: number;
  responsE_TIME: string | null;
  responsE_STAFF_ID: number | null;
  folloW_UP_REQUIRED: boolean;
  calL_STATUS: 'Pending' | 'InProgress' | 'Completed' | '处理中' | '已完成'; // 修正，并加入中文状态
  handlinG_RESULT: string;
}