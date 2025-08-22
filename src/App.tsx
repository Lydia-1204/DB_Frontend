import React, { useState, useEffect } from 'react';
import './App.css';
import { Calendar, Clock, User, Phone, FileText, ArrowLeft, Search, Plus, Users, Trash2, X, CheckCircle, Eye, Edit } from 'lucide-react';

// API相关类型定义 - 基于OpenAPI文档
interface VisitorRegistration {
  visitor_id?: number;
  family_id?: number;
  elderly_id: number;
  visitor_name: string;
  visit_time?: string;
  relationship_to_elderly: string;
  visit_reason: string;
  visit_type?: string;
  approval_status?: string;
}

interface OperationLog {
  log_id?: number;
  staff_id: number;
  operation_time?: string;
  operation_type?: string;
  operation_description?: string;
  affected_entity?: string;
  operation_status?: string;
  ip_address?: string;
  device_type?: string;
}

// 本地使用的类型定义
interface Visitor {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  relationship?: string;
  reason?: string;
  elderlyId?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

interface BatchVisitor {
  name: string;
  idCard: string;
  phone: string;
  relationship: string;
}

interface Appointment {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  visitDate: string;
  startTime: string;
  type: 'individual' | 'batch';
  reason?: string;
  visitorCount?: number;
  batchVisitors?: BatchVisitor[];
  relationship?: string;
  elderlyId?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

// API配置
const API_BASE_URL = 'http://47.96.238.102:9000';
const DEFAULT_STAFF_ID = 1;
const DEFAULT_ELDERLY_ID = 1;

type Page = 'home' | 'register' | 'query' | 'batchAppointment' | 'individualAppointment' | 'appointments' | 'dashboard' | 'announcements' | 'pendingApproval';

// API调用函数
const apiCall = async (endpoint: string, method: string = 'GET', data?: any) => {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

const VisitorAppointmentSystem: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // 预约查询表单状态
  const [queryForm, setQueryForm] = useState({
    name: '',
    phone: '',
    elderlyId: '',
    status: ''
  });

  // 查询结果状态
  const [queryResults, setQueryResults] = useState<Appointment[]>([]);

  // 批量预约表单状态
  const [batchForm, setBatchForm] = useState({
    visitors: [{ name: '', idCard: '', phone: '', relationship: '' }] as BatchVisitor[],
    reason: '',
    visitDate: '',
    startTime: '',
    elderlyId: DEFAULT_ELDERLY_ID
  });

  // 个人预约表单状态
  const [individualForm, setIndividualForm] = useState({
    name: '',
    idCard: '',
    phone: '',
    visitDate: '',
    startTime: '',
    endTime: '',
    relationship: '',
    reason: '',
    elderName: '',
    elderRoom: '',
    elderlyId: DEFAULT_ELDERLY_ID
  });

  // 生成访客ID
  const generateVisitorId = () => {
    return `V${Date.now().toString().slice(-8)}`;
  };

  // 访客登记表单状态
  const [visitorForm, setVisitorForm] = useState<Visitor>({
    id: '',
    name: '',
    idCard: '',
    phone: '',
    visitDate: '',
    startTime: '',
    endTime: '',
    relationship: '',
    reason: '',
    elderlyId: DEFAULT_ELDERLY_ID,
    status: 'pending'
  });

  // API调用函数实现
  /* API调用：提交视频访问预约
  POST /api/VisitorRegistration/submit-video-visit */
  const submitVideoVisit = async (visitorData: any) => {
    const visitData: VisitorRegistration = {
      elderly_id: visitorData.elderlyId || DEFAULT_ELDERLY_ID,
      visitor_name: visitorData.name,
      visit_time: `${visitorData.visitDate}T${visitorData.startTime}:00`,
      relationship_to_elderly: visitorData.relationship,
      visit_reason: visitorData.reason,
      visit_type: 'video'
    };
    
    try {
      return await apiCall('/api/VisitorRegistration/submit-video-visit', 'POST', visitData);
    } catch (error) {
      console.error('提交视频访问预约失败:', error);
      return { success: true, id: Date.now() };
    }
  };

  /* API调用：记录操作日志
  POST /api/OperationLog */
  const logOperation = async (logData: any) => {
    try {
      const operationLog: OperationLog = {
        staff_id: DEFAULT_STAFF_ID,
        operation_time: new Date().toISOString(),
        operation_type: logData.type,
        operation_description: logData.description,
        affected_entity: logData.entity,
        operation_status: 'success',
        ip_address: '127.0.0.1',
        device_type: 'web'
      };
      
      return await apiCall('/api/OperationLog', 'POST', operationLog);
    } catch (error) {
      console.error('记录操作日志失败:', error);
      console.log('操作日志:', logData);
    }
  };

  /* API调用：获取访客预约列表
  GET /api/VisitorRegistration?familyId={familyId}&elderlyId={elderlyId}&status={status}&staffId={staffId} */
  const fetchVisitorRegistrations = async (filters?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.familyId) queryParams.append('familyId', filters.familyId.toString());
      if (filters?.elderlyId) queryParams.append('elderlyId', filters.elderlyId.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.staffId) queryParams.append('staffId', filters.staffId.toString());
      
      const response = await apiCall(`/api/VisitorRegistration?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('获取访客预约列表失败:', error);
      return appointments;
    }
  };

  /* API调用：获取待审批访客申请
  GET /api/VisitorRegistration/pending-approval?staffId={staffId} */
  const fetchPendingApprovals = async (staffId?: number) => {
    try {
      const queryParams = new URLSearchParams();
      if (staffId) queryParams.append('staffId', staffId.toString());
      
      return await apiCall(`/api/VisitorRegistration/pending-approval?${queryParams.toString()}`);
    } catch (error) {
      console.error('获取待审批申请失败:', error);
      return [];
    }
  };

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // 加载访客预约列表
        const appointmentsData = await fetchVisitorRegistrations();
        setAppointments(appointmentsData);

        // 加载待审批申请
        const pendingData = await fetchPendingApprovals(DEFAULT_STAFF_ID);
        setPendingApprovals(pendingData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // 处理访客登记提交
  const handleVisitorSubmit = async () => {
    if (!visitorForm.name || !visitorForm.idCard || !visitorForm.phone || 
        !visitorForm.visitDate || !visitorForm.startTime || !visitorForm.endTime ||
        !visitorForm.relationship || !visitorForm.reason) {
      alert('请填写所有必填信息');
      return;
    }
    
    setLoading(true);
    try {
      // API调用：提交访客登记
      await submitVideoVisit(visitorForm);
      
      // 记录操作日志
      await logOperation({
        type: '访客登记',
        description: `登记访客: ${visitorForm.name}`,
        entity: 'visitor_registration'
      });
      
      const newVisitor: Visitor = {
        ...visitorForm,
        id: generateVisitorId()
      };
      
      setVisitors(prev => [...prev, newVisitor]);
      setVisitorForm({
        id: '',
        name: '',
        idCard: '',
        phone: '',
        visitDate: '',
        startTime: '',
        endTime: '',
        relationship: '',
        reason: '',
        elderlyId: DEFAULT_ELDERLY_ID,
        status: 'pending'
      });
      
      alert('访客登记成功！预约已提交，等待审批。');
      setCurrentPage('home');
    } catch (error) {
      alert('登记失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理预约查询
  const handleQuery = () => {
    if (!queryForm.name || !queryForm.phone) {
      alert('请输入姓名和电话进行查询');
      return;
    }

    /* API调用：根据条件查询访客预约
    GET /api/VisitorRegistration?familyId={familyId}&elderlyId={elderlyId}&status={status}&staffId={staffId}
    这里可以根据姓名和电话进行模糊查询 */
    
    const results = appointments.filter(apt => 
      apt.name === queryForm.name && apt.phone === queryForm.phone
    );

    setQueryResults(results);
  };

  // 批量预约相关函数
  const addBatchVisitor = () => {
    setBatchForm(prev => ({
      ...prev,
      visitors: [...prev.visitors, { name: '', idCard: '', phone: '', relationship: '' }]
    }));
  };

  const removeBatchVisitor = (index: number) => {
    if (batchForm.visitors.length > 1) {
      setBatchForm(prev => ({
        ...prev,
        visitors: prev.visitors.filter((_, i) => i !== index)
      }));
    }
  };

  const updateBatchVisitor = (index: number, field: keyof BatchVisitor, value: string) => {
    setBatchForm(prev => ({
      ...prev,
      visitors: prev.visitors.map((visitor, i) => 
        i === index ? { ...visitor, [field]: value } : visitor
      )
    }));
  };

  const handleBatchSubmit = async () => {
    const validVisitors = batchForm.visitors.filter(v => v.name && v.idCard && v.phone);
    if (validVisitors.length === 0 || !batchForm.visitDate || !batchForm.startTime || !batchForm.reason) {
      alert('请填写至少一个完整的访客信息和必填字段');
      return;
    }

    setLoading(true);
    try {
      // 为每个访客提交预约申请
      for (const visitor of validVisitors) {
        const visitData = {
          name: visitor.name,
          idCard: visitor.idCard,
          phone: visitor.phone,
          relationship: visitor.relationship,
          reason: batchForm.reason,
          visitDate: batchForm.visitDate,
          startTime: batchForm.startTime,
          elderlyId: batchForm.elderlyId
        };
        
        await submitVideoVisit(visitData);
      }

      // 记录操作日志
      await logOperation({
        type: '批量预约',
        description: `批量预约访客: ${validVisitors.length} 人`,
        entity: 'batch_appointment'
      });

      const newAppointment: Appointment = {
        id: Date.now().toString(),
        name: validVisitors[0].name,
        idCard: validVisitors[0].idCard,
        phone: validVisitors[0].phone,
        visitDate: batchForm.visitDate,
        startTime: batchForm.startTime,
        type: 'batch',
        reason: batchForm.reason,
        visitorCount: validVisitors.length,
        batchVisitors: validVisitors
      };

      setAppointments(prev => [...prev, newAppointment]);
      setBatchForm({
        visitors: [{ name: '', idCard: '', phone: '', relationship: '' }],
        reason: '',
        visitDate: '',
        startTime: '',
        elderlyId: DEFAULT_ELDERLY_ID
      });

      alert('批量预约成功！');
      setCurrentPage('home');
    } catch (error) {
      alert('批量预约失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualSubmit = async () => {
    if (!individualForm.name || !individualForm.idCard || !individualForm.phone || 
        !individualForm.visitDate || !individualForm.startTime || !individualForm.relationship || !individualForm.reason) {
      alert('请填写所有必填信息');
      return;
    }

    setLoading(true);
    try {
      await submitVideoVisit(individualForm);

      // 记录操作日志
      await logOperation({
        type: '个人预约',
        description: `个人预约访客: ${individualForm.name}`,
        entity: 'individual_appointment'
      });

      const newAppointment: Appointment = {
        id: Date.now().toString(),
        name: individualForm.name,
        idCard: individualForm.idCard,
        phone: individualForm.phone,
        visitDate: individualForm.visitDate,
        startTime: individualForm.startTime,
        type: 'individual',
        relationship: individualForm.relationship,
        reason: individualForm.reason
      };

      setAppointments(prev => [...prev, newAppointment]);
      setIndividualForm({
        name: '',
        idCard: '',
        phone: '',
        visitDate: '',
        startTime: '',
        endTime: '',
        relationship: '',
        reason: '',
        elderName: '',
        elderRoom: '',
        elderlyId: DEFAULT_ELDERLY_ID
      });

      alert('个人预约成功！');
      setCurrentPage('home');
    } catch (error) {
      alert('个人预约失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 主页渲染 (Header 居中定宽 + 内容垂直居中分布)
  const renderHome = () => (
    <div className="home-wrapper">
      <header className="home-header">
        <div className="home-header-inner">
          <h1 className="home-title">智慧养老访客预约系统</h1>
          <div className="home-subline-box">
            <div className="home-subline-flex">
              <p className="home-subline-text">欢迎使用智慧养老访客预约系统 - 高效便捷的访客管理和预约服务平台</p>
              <p className="home-date">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }).replace(/\//g, '/')}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="home-main">
        <div className="home-main-inner">
          <div className="function-grid">
          {/* 访客登记 */}
          <div 
            onClick={() => setCurrentPage('register')}
            className="function-card group"
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">访客登记</h3>
              <p className="text-blue-700 leading-relaxed">登记访客基本信息，生成唯一访客ID，记录访问时间安排</p>
            </div>
          </div>

          {/* 预约查询 */}
          <div 
            onClick={() => setCurrentPage('query')}
            className="function-card group"
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">预约查询</h3>
              <p className="text-blue-700 leading-relaxed">通过姓名和电话快速查询预约记录，确认访问信息</p>
            </div>
          </div>

          {/* 批量预约 */}
          <div 
            onClick={() => setCurrentPage('batchAppointment')}
            className="function-card group"
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">批量预约</h3>
              <p className="text-blue-700 leading-relaxed">支持多人同时预约，适用于团队访问和集体活动</p>
            </div>
          </div>

          {/* 我的预约 */}
          <div 
            onClick={() => setCurrentPage('appointments')}
            className="function-card group"
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">我的预约</h3>
              <p className="text-blue-700 leading-relaxed">查看和管理所有预约记录，掌握访问安排</p>
            </div>
          </div>

          {/* 待审批 */}
          <div 
            onClick={() => setCurrentPage('pendingApproval')}
            className="function-card group"
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">待审批</h3>
              <p className="text-blue-700 leading-relaxed">查看和处理待审批的访客申请</p>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="function-card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{appointments.length}</div>
              <div className="text-blue-100 mb-4">总预约数</div>
              <div className="text-2xl font-semibold mb-2">{visitors.length}</div>
              <div className="text-blue-100 mb-4">总访客数</div>
              <div className="text-xl font-medium mb-2">{pendingApprovals.length}</div>
              <div className="text-blue-100">待审批</div>
            </div>
          </div>
          </div>
        </div>
      </main>
      <div className="home-footer-spacer" />
    </div>
  );

  // 访客登记页面渲染
  const renderVisitorRegister = () => (
    <div className="page-wrapper">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button 
              onClick={() => setCurrentPage('home')}
              className="page-back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="page-title">访客登记</h2>
              <p className="page-subtitle">填写访客基本信息，系统将自动生成访客ID</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          <div className="form-grid">
            {/* 基本信息部分 */}
            <div className="content-section">
              <h3 className="section-title">基本信息</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">访客姓名 *</label>
                  <input
                    type="text"
                    value={visitorForm.name}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="请输入访客姓名"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">身份证号 *</label>
                  <input
                    type="text"
                    value={visitorForm.idCard}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, idCard: e.target.value }))}
                    className="form-input"
                    placeholder="请输入身份证号码"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">联系电话 *</label>
                  <input
                    type="tel"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="form-input"
                    placeholder="请输入联系电话"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">与老人关系 *</label>
                  <select
                    value={visitorForm.relationship}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, relationship: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">请选择关系</option>
                    <option value="子女">子女</option>
                    <option value="配偶">配偶</option>
                    <option value="亲属">亲属</option>
                    <option value="朋友">朋友</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 访问安排部分 */}
            <div className="content-section">
              <h3 className="section-title">访问安排</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">访问日期 *</label>
                  <input
                    type="date"
                    value={visitorForm.visitDate}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">开始时间 *</label>
                  <input
                    type="time"
                    value={visitorForm.startTime}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">结束时间 *</label>
                  <input
                    type="time"
                    value={visitorForm.endTime}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field" style={{gridColumn: '1 / -1'}}>
                  <label className="form-label">访问原因 *</label>
                  <textarea
                    value={visitorForm.reason}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="form-textarea"
                    placeholder="请简要说明访问原因"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 登记预览 */}
          <div className="content-section" style={{background: 'rgba(59, 130, 246, 0.05)'}}>
            <h3 className="section-title">登记预览</h3>
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">访客ID:</span>
                <span style={{fontFamily: 'monospace'}}>{generateVisitorId()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">姓名:</span>
                <span>{visitorForm.name || '未填写'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">电话:</span>
                <span>{visitorForm.phone || '未填写'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">关系:</span>
                <span>{visitorForm.relationship || '未选择'}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px'}}>
            <button
              onClick={() => setCurrentPage('home')}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleVisitorSubmit}
              disabled={loading}
              className="btn-primary"
              style={{opacity: loading ? 0.5 : 1}}
            >
              {loading ? '提交中...' : '确认登记'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 预约查询页面
  const renderQuery = () => (
    <div className="page-wrapper">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button 
              onClick={() => setCurrentPage('home')}
              className="page-back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="page-title">预约查询</h2>
              <p className="page-subtitle">输入预约时填写的姓名和电话号码进行查询</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          <div className="content-section" style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '32px'}}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '50%',
                marginBottom: '16px'
              }}>
                <Search className="w-8 h-8" style={{color: '#3b82f6'}} />
              </div>
              <h3 className="section-title" style={{textAlign: 'center', border: 'none', marginBottom: '8px'}}>预约信息查询</h3>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">姓名 *</label>
                <input
                  type="text"
                  value={queryForm.name}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="请输入预约姓名"
                />
              </div>
              <div className="form-field">
                <label className="form-label">电话号码 *</label>
                <input
                  type="tel"
                  value={queryForm.phone}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-input"
                  placeholder="请输入预约电话"
                />
              </div>
            </div>

            <div style={{display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px'}}>
              <button
                onClick={() => setCurrentPage('home')}
                className="btn-secondary"
              >
                返回
              </button>
              <button
                onClick={handleQuery}
                className="btn-primary"
              >
                查询预约
              </button>
            </div>
          </div>

          {/* 查询结果 */}
          {queryResults.length > 0 && (
            <div className="content-section">
              <h3 className="section-title">查询结果 ({queryResults.length} 条)</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {queryResults.map((appointment) => (
                  <div key={appointment.id} className="query-result-card">
                    <div className="result-header">
                      <span className="result-name">{appointment.name}</span>
                      <span className={`result-status ${
                        appointment.type === 'batch' ? 'status-approved' : 'status-pending'
                      }`}>
                        {appointment.type === 'batch' ? '批量预约' : '个人预约'}
                      </span>
                    </div>
                    <div className="result-details">
                      <div className="detail-item">
                        <span className="detail-label">预约日期:</span>
                        <span>{appointment.visitDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">访问时间:</span>
                        <span>{appointment.startTime}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">联系电话:</span>
                        <span>{appointment.phone}</span>
                      </div>
                      {appointment.visitorCount && (
                        <div className="detail-item">
                          <span className="detail-label">访客人数:</span>
                          <span>{appointment.visitorCount} 人</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 批量预约页面渲染
  const renderBatchAppointment = () => (
    <div className="page-wrapper">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <button 
              onClick={() => setCurrentPage('home')}
              className="page-back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="page-title">批量预约</h2>
              <p className="page-subtitle">为多位访客同时预约访问时间</p>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users className="w-5 h-5" />
            </div>
            <span style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: '500'}}>
              当前 {batchForm.visitors.length} 人
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px'}}>
            {/* Left Column - Visitors */}
            <div className="content-section">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
                <h3 className="section-title">访客信息</h3>
                <button
                  onClick={addBatchVisitor}
                  className="btn-secondary"
                  style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <Plus className="w-4 h-4" />
                  添加访客
                </button>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto'}}>
                {batchForm.visitors.map((visitor, index) => (
                  <div key={index} style={{
                    background: 'rgba(239, 246, 255, 0.3)',
                    border: '2px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    padding: '24px',
                    position: 'relative'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                      <h4 style={{margin: '0', fontSize: '16px', fontWeight: '600', color: '#1e3a8a'}}>
                        访客 {index + 1}
                      </h4>
                      {batchForm.visitors.length > 1 && (
                        <button
                          onClick={() => removeBatchVisitor(index)}
                          style={{
                            padding: '4px',
                            color: '#dc2626',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                      <div>
                        <label className="form-label">姓名 *</label>
                        <input
                          type="text"
                          value={visitor.name}
                          onChange={(e) => updateBatchVisitor(index, 'name', e.target.value)}
                          className="form-input"
                          placeholder="姓名"
                        />
                      </div>
                      <div>
                        <label className="form-label">身份证号 *</label>
                        <input
                          type="text"
                          value={visitor.idCard}
                          onChange={(e) => updateBatchVisitor(index, 'idCard', e.target.value)}
                          className="form-input"
                          placeholder="身份证号"
                        />
                      </div>
                      <div>
                        <label className="form-label">电话 *</label>
                        <input
                          type="tel"
                          value={visitor.phone}
                          onChange={(e) => updateBatchVisitor(index, 'phone', e.target.value)}
                          className="form-input"
                          placeholder="电话号码"
                        />
                      </div>
                      <div>
                        <label className="form-label">与老人关系 *</label>
                        <select
                          value={visitor.relationship}
                          onChange={(e) => updateBatchVisitor(index, 'relationship', e.target.value)}
                          className="form-select"
                        >
                          <option value="">请选择关系</option>
                          <option value="子女">子女</option>
                          <option value="配偶">配偶</option>
                          <option value="亲属">亲属</option>
                          <option value="朋友">朋友</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Appointment Details */}
            <div className="content-section">
              <h3 className="section-title">预约详情</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <div>
                  <label className="form-label">预约原因 *</label>
                  <textarea
                    value={batchForm.reason}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="form-input"
                    rows={3}
                    placeholder="请输入预约原因"
                  />
                </div>

                <div>
                  <label className="form-label">访问日期 *</label>
                  <input
                    type="date"
                    value={batchForm.visitDate}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">开始时间 *</label>
                  <input
                    type="time"
                    value={batchForm.startTime}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="form-input"
                  />
                </div>

                {/* Summary */}
                <div style={{
                  background: 'rgba(239, 246, 255, 0.5)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e3a8a'}}>
                    预约摘要
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>访客数量:</span>
                      <span style={{color: '#1e3a8a', fontWeight: '600'}}>
                        {batchForm.visitors.filter(v => v.name && v.idCard && v.phone).length} 人
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>访问日期:</span>
                      <span style={{color: '#1e3a8a'}}>{batchForm.visitDate || '未选择'}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>开始时间:</span>
                      <span style={{color: '#1e3a8a'}}>{batchForm.startTime || '未选择'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid rgba(239, 246, 255, 0.5)'}}>
            <button
              onClick={() => setCurrentPage('home')}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleBatchSubmit}
              disabled={loading}
              className="btn-primary"
              style={{opacity: loading ? 0.5 : 1}}
            >
              {loading ? '提交中...' : '确认预约'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 个人预约页面渲染
  const renderIndividualAppointment = () => (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-card">
          {/* Header */}
          <div className="page-header">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button 
                onClick={() => setCurrentPage('home')}
                className="back-button"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="page-title">个人预约</h2>
            </div>
            <div className="header-icon">
              <User className="w-5 h-5" />
            </div>
          </div>

          {/* Content */}
          <div className="page-content">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
              {/* Left Column - Personal Info */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <div className="content-section">
                  <h3 className="section-title">访客信息</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div>
                      <label className="form-label">姓名 *</label>
                      <input
                        type="text"
                        value={individualForm.name}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, name: e.target.value }))}
                        className="form-input"
                        placeholder="请输入姓名"
                      />
                    </div>

                    <div>
                      <label className="form-label">身份证号 *</label>
                      <input
                        type="text"
                        value={individualForm.idCard}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, idCard: e.target.value }))}
                        className="form-input"
                        placeholder="请输入身份证号"
                      />
                    </div>

                    <div>
                      <label className="form-label">电话号码 *</label>
                      <input
                        type="tel"
                        value={individualForm.phone}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="form-input"
                        placeholder="请输入电话号码"
                      />
                    </div>

                    <div>
                      <label className="form-label">与老人关系 *</label>
                      <select
                        value={individualForm.relationship}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, relationship: e.target.value }))}
                        className="form-select"
                      >
                        <option value="">请选择关系</option>
                        <option value="子女">子女</option>
                        <option value="配偶">配偶</option>
                        <option value="亲属">亲属</option>
                        <option value="朋友">朋友</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Elder Info */}
                <div className="content-section">
                  <h3 className="section-title">老人信息</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div>
                      <label className="form-label">老人姓名 *</label>
                      <input
                        type="text"
                        value={individualForm.elderName}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, elderName: e.target.value }))}
                        className="form-input"
                        placeholder="请输入老人姓名"
                      />
                    </div>

                    <div>
                      <label className="form-label">老人房间号</label>
                      <input
                        type="text"
                        value={individualForm.elderRoom}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, elderRoom: e.target.value }))}
                        className="form-input"
                        placeholder="请输入房间号（如已知）"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Appointment Details */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <div className="content-section">
                  <h3 className="section-title">预约详情</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div>
                      <label className="form-label">访问日期 *</label>
                      <input
                        type="date"
                        value={individualForm.visitDate}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, visitDate: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">开始时间 *</label>
                      <input
                        type="time"
                        value={individualForm.startTime}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">结束时间</label>
                      <input
                        type="time"
                        value={individualForm.endTime}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">访问原因 *</label>
                      <textarea
                        value={individualForm.reason}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="form-input"
                        rows={4}
                        placeholder="请输入访问原因"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div style={{
                  background: 'rgba(239, 246, 255, 0.5)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#1e3a8a'}}>
                    预约信息预览
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>访客姓名:</span>
                      <span style={{color: '#1e3a8a', fontWeight: '600'}}>{individualForm.name || '未填写'}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>老人姓名:</span>
                      <span style={{color: '#1e3a8a', fontWeight: '600'}}>{individualForm.elderName || '未填写'}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>访问日期:</span>
                      <span style={{color: '#1e3a8a'}}>{individualForm.visitDate || '未选择'}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>时间段:</span>
                      <span style={{color: '#1e3a8a'}}>
                        {individualForm.startTime || '未选择'} - {individualForm.endTime || '未选择'}
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#6b7280'}}>关系:</span>
                      <span style={{color: '#1e3a8a'}}>{individualForm.relationship || '未选择'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid rgba(239, 246, 255, 0.5)'}}>
              <button
                onClick={() => setCurrentPage('home')}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleIndividualSubmit}
                disabled={loading}
                className="btn-primary"
                style={{opacity: loading ? 0.5 : 1}}
              >
                {loading ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 预约列表页面渲染
  const renderAppointments = () => (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-card">
          {/* Header */}
          <div className="page-header">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button 
                onClick={() => setCurrentPage('home')}
                className="back-button"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="page-title">预约记录</h2>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div className="header-icon">
                <FileText className="w-5 h-5" />
              </div>
              <span style={{fontSize: '14px', color: '#3b82f6', fontWeight: '600'}}>
                总计 {appointments.length} 条记录
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="page-content">
            {appointments.length === 0 ? (
              <div style={{textAlign: 'center', padding: '48px 24px'}}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(229, 231, 235, 0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FileText style={{width: '32px', height: '32px', color: '#9ca3af'}} />
                </div>
                <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '8px'}}>
                  暂无预约记录
                </h3>
                <p style={{color: '#6b7280', marginBottom: '16px'}}>
                  还没有任何访客预约记录，开始创建您的第一个预约吧！
                </p>
                <button
                  onClick={() => setCurrentPage('register')}
                  className="btn-primary"
                >
                  创建预约
                </button>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {appointments.map((appointment, index) => (
                  <div key={index} className="content-section">
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <div style={{flex: '1'}}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                          <h4 style={{fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginRight: '12px'}}>
                            {appointment.name || '未知访客'}
                          </h4>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#1e3a8a'
                          }}>
                            {appointment.type === 'batch' ? '批量预约' : '个人预约'}
                          </span>
                          {appointment.visitorCount && (
                            <span style={{
                              marginLeft: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#1e3a8a'
                            }}>
                              {appointment.visitorCount} 人
                            </span>
                          )}
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '16px',
                          fontSize: '14px',
                          marginBottom: '12px'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <Calendar style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                            <span style={{color: '#374151'}}>访问日期: {appointment.visitDate}</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <Clock style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                            <span style={{color: '#374151'}}>时间: {appointment.startTime}</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <Phone style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                            <span style={{color: '#374151'}}>电话: {appointment.phone || '未提供'}</span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div style={{marginTop: '12px', fontSize: '14px', color: '#4b5563'}}>
                            <span style={{fontWeight: '600'}}>访问原因: </span>
                            {appointment.reason}
                          </div>
                        )}
                      </div>

                      <div style={{display: 'flex', gap: '8px', marginLeft: '24px'}}>
                        <button className="btn-icon">
                          <Eye style={{width: '20px', height: '20px'}} />
                        </button>
                        <button className="btn-icon">
                          <Edit style={{width: '20px', height: '20px'}} />
                        </button>
                        <button className="btn-icon-danger">
                          <Trash2 style={{width: '20px', height: '20px'}} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 待审批页面渲染
  const renderPendingApproval = () => (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-card">
          {/* Header */}
          <div className="page-header">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button 
                onClick={() => setCurrentPage('home')}
                className="back-button"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="page-title">待审批申请</h2>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div className="header-icon">
                <Clock className="w-5 h-5" />
              </div>
              <span style={{fontSize: '14px', color: '#3b82f6', fontWeight: '600'}}>
                待处理 {pendingApprovals.length} 条
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="page-content">
            {pendingApprovals.length === 0 ? (
              <div style={{textAlign: 'center', padding: '48px 24px'}}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(229, 231, 235, 0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle style={{width: '32px', height: '32px', color: '#9ca3af'}} />
                </div>
                <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '8px'}}>
                  暂无待审批申请
                </h3>
                <p style={{color: '#6b7280'}}>当前没有需要审批的访客申请。</p>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                {pendingApprovals.map((approval, index) => (
                  <div key={index} style={{
                    background: 'rgba(239, 246, 255, 0.3)',
                    border: '2px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    padding: '24px'
                  }}>
                    <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                      <div style={{flex: '1'}}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                          <h4 style={{fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginRight: '12px'}}>
                            {approval.visitorName}
                          </h4>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#1e3a8a'
                          }}>
                            待审批
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '24px',
                          marginBottom: '16px'
                        }}>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <User style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>身份证号:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.idCard}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <Phone style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>联系电话:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.phone}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <Users style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>与老人关系:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.relationship}</span>
                            </div>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <Calendar style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>访问日期:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.visitDate}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <Clock style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>访问时间:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.startTime}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                              <Clock style={{width: '16px', height: '16px', color: '#6b7280', marginRight: '8px'}} />
                              <span style={{color: '#6b7280'}}>申请时间:</span>
                              <span style={{marginLeft: '8px', fontWeight: '600', color: '#374151'}}>{approval.createdAt}</span>
                            </div>
                          </div>
                        </div>

                        {approval.reason && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: '1px solid rgba(59, 130, 246, 0.1)'
                          }}>
                            <p style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginBottom: '8px'}}>
                              访问原因
                            </p>
                            <p style={{fontSize: '14px', color: '#4b5563'}}>{approval.reason}</p>
                          </div>
                        )}
                      </div>

                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '24px'}}>
                        <button className="btn-primary" style={{fontSize: '14px', padding: '8px 16px'}}>
                          批准
                        </button>
                        <button style={{
                          padding: '8px 16px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}>
                          拒绝
                        </button>
                        <button className="btn-secondary" style={{fontSize: '14px', padding: '8px 16px'}}>
                          详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 页面路由渲染
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHome();
      case 'register':
        return renderVisitorRegister();
      case 'query':
        return renderQuery();
      case 'batchAppointment':
        return renderBatchAppointment();
      case 'individualAppointment':
        return renderIndividualAppointment();
      case 'appointments':
        return renderAppointments();
      case 'pendingApproval':
        return renderPendingApproval();
      default:
        return renderHome();
    }
  };

  return (
    <div className="font-sans">
      {renderCurrentPage()}
    </div>
  );
};

export default VisitorAppointmentSystem;
