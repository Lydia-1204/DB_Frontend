import { API_BASE_URL } from './types';

// 通用请求
export const apiCall = async (endpoint: string, method: string = 'GET', data?: any) => {
  const config: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) config.body = JSON.stringify(data);
  const resp = await fetch(`${API_BASE_URL}${endpoint}`, config);
  // 尝试解析 JSON 错误信息
  if (!resp.ok) {
    let errorBody: any = undefined;
    try { errorBody = await resp.json(); } catch { /* ignore */ }
    const err: any = new Error(errorBody?.error || errorBody?.message || `API请求失败: ${resp.status}`);
    err.status = resp.status;
    err.body = errorBody;
    throw err;
  }
  try { return await resp.json(); } catch { return undefined; }
};

// =============== 访客预约（根据新API规格） ===============
// 请求体接口（与后端OpenAPI中 VideoVisitRequest 对应）
export interface VisitorRegistrationRequest {
  responsibleVisitorId: number; // 负责人访客ID（登录访客）
  visitorName: string; // 实际访客姓名
  relationshipToElderly: string; // 与老人关系
  visitReason: string; // 探访原因
  visitType: '视频探视' | '线下探视'; // 访问类型
  elderlyId: number; // 老人ID 或 0 (全体)
}

export const submitVisitorRegistration = async (req: VisitorRegistrationRequest) => {
  try {
    // 仅发送 API 需要的字段，后端会自动设置预约时间 visitTime 状态为 待批准
    return await apiCall('/api/VisitorRegistration/submit-video-visit', 'POST', req);
  } catch (e) {
    console.error('提交访客预约失败:', e);
    throw e;
  }
};

// 批量预约请求接口
export interface BulkVisitorInfo { visitorName: string; relationshipToElderly: string; visitReason: string; }
export interface BulkVisitorRegistrationRequest {
  responsibleVisitorId: number;
  visitors: BulkVisitorInfo[];
  visitType: '视频探视' | '线下探视';
  elderlyId: number;
}

export const submitBulkVisitorRegistration = async (req: BulkVisitorRegistrationRequest) => {
  try {
    return await apiCall('/api/VisitorRegistration/submit-bulk-video-visit', 'POST', req);
  } catch (e) {
    console.error('批量预约提交失败:', e);
    throw e;
  }
};

// 获取单条预约详情
export interface VisitorRegistrationDetail {
  registrationId: number;
  visitorId: number;
  elderlyId: number;
  visitorName: string;
  visitTime: string;
  relationshipToElderly: string;
  visitReason: string;
  visitType: string;
  approvalStatus: string;
}

export const getVisitorRegistrationById = async (id: number): Promise<VisitorRegistrationDetail> => {
  return await apiCall(`/api/VisitorRegistration/${id}`);
};

// 获取负责人提交的所有预约记录
export const getResponsibleVisitorRegistrations = async (responsibleVisitorId: number, staffId?: number): Promise<VisitorRegistrationDetail[]> => {
  const query = staffId ? `?staffId=${staffId}` : '';
  return await apiCall(`/api/VisitorRegistration/responsible/${responsibleVisitorId}${query}`);
};

// 工具：将后端预约详情映射为前端 Appointment 结构（局部使用，避免循环依赖故不直接引入类型）
export const mapRegistrationDetailToAppointment = (r: VisitorRegistrationDetail) => {
  return {
    registrationId: r.registrationId,
    visitorId: r.visitorId,
    elderlyId: r.elderlyId,
    visitorName: r.visitorName,
    visitTime: r.visitTime,
    relationshipToElderly: r.relationshipToElderly,
    visitReason: r.visitReason,
    visitType: r.visitType,
    approvalStatus: r.approvalStatus
  };
};

// 兼容旧的调用（批量或其它地方如仍引用 submitVideoVisit）——简单包装为视频探视
export const submitVideoVisit = async (legacyData: any) => {
  // 猜测 legacyData 中包含: elderlyId, name, relationship, reason
  const fallbackVisitorId = 0;
  const payload: VisitorRegistrationRequest = {
    responsibleVisitorId: legacyData.responsibleVisitorId || fallbackVisitorId,
    visitorName: legacyData.name || legacyData.visitorName || '访客',
    relationshipToElderly: legacyData.relationship || legacyData.relationshipToElderly || '',
    visitReason: legacyData.reason || legacyData.visitReason || '',
    visitType: '视频探视',
    elderlyId: typeof legacyData.elderlyId === 'number' ? legacyData.elderlyId : 0
  };
  return submitVisitorRegistration(payload);
};


// 获取访客预约列表
export const fetchVisitorRegistrations = async (filters?: any) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.familyId) queryParams.append('familyId', String(filters.familyId));
    if (filters?.elderlyId) queryParams.append('elderlyId', String(filters.elderlyId));
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.staffId) queryParams.append('staffId', String(filters.staffId));
    return await apiCall(`/api/VisitorRegistration?${queryParams.toString()}`);
  } catch (e) {
    console.error('获取访客预约列表失败:', e);
    return [];
  }
};

// ================= 访客账号相关接口 =================
export interface VisitorLoginInfo {
  visitorId: number;
  visitorName: string;
  visitorPhone: string;
  message?: string;
}

export interface VisitorRegisterRequest {
  visitorName: string;
  visitorPhone: string;
  visitorPassword: string;
}

export const visitorRegister = async (req: VisitorRegisterRequest): Promise<VisitorLoginInfo> => {
  const data = await apiCall('/api/VisitorLogin/register', 'POST', req);
  return data;
};

export const visitorLogin = async (visitorPhone: string, visitorPassword: string): Promise<VisitorLoginInfo> => {
  const data = await apiCall('/api/VisitorLogin/login', 'POST', { visitorPhone, visitorPassword });
  // 缓存登录信息
  if (data?.visitorId) {
    localStorage.setItem('visitorInfo', JSON.stringify(data));
  }
  return data;
};

export const getLoggedVisitor = (): VisitorLoginInfo | null => {
  try {
    const raw = localStorage.getItem('visitorInfo');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export const visitorChangePassword = async (visitorId: number, oldPassword: string, newPassword: string) => {
  return await apiCall(`/api/VisitorLogin/${visitorId}/change-password`, 'PUT', { oldPassword, newPassword });
};

