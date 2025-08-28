import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_ELDERLY_ID } from '../types';
import { logOperation, submitVideoVisit } from '../api';

interface Props { onBack: () => void; }

const VisitorRegisterPage: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    id: '', name: '', idCard: '', phone: '', visitDate: '', startTime: '', endTime: '', relationship: '', reason: '', elderlyId: DEFAULT_ELDERLY_ID, status: 'pending' as const
  });

  const generateVisitorId = () => `V${Date.now().toString().slice(-8)}`;

  const handleVisitorSubmit = async () => {
    if (!visitorForm.name || !visitorForm.idCard || !visitorForm.phone || !visitorForm.visitDate || !visitorForm.startTime || !visitorForm.endTime || !visitorForm.relationship || !visitorForm.reason) {
      alert('请填写所有必填信息');
      return;
    }
    setLoading(true);
    try {
      await submitVideoVisit(visitorForm);
      await logOperation({ type: '访客登记', description: `登记访客: ${visitorForm.name}`, entity: 'visitor_registration' });
      setVisitorForm({ id: '', name: '', idCard: '', phone: '', visitDate: '', startTime: '', endTime: '', relationship: '', reason: '', elderlyId: DEFAULT_ELDERLY_ID, status: 'pending' });
      alert('访客登记成功！预约已提交，等待审批。');
      onBack();
    } catch {
      alert('登记失败，请重试');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <button onClick={onBack} className="page-back-btn"><ArrowLeft className="w-6 h-6" /></button>
            <div>
              <h2 className="page-title">访客登记</h2>
              <p className="page-subtitle">填写访客基本信息，系统将自动生成访客ID</p>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="form-grid">
            <div className="content-section">
              <h3 className="section-title">基本信息</h3>
              <div className="form-grid">
                <div className="form-field"><label className="form-label">访客姓名 *</label><input type="text" value={visitorForm.name} onChange={e => setVisitorForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="请输入访客姓名" /></div>
                <div className="form-field"><label className="form-label">身份证号 *</label><input type="text" value={visitorForm.idCard} onChange={e => setVisitorForm(p => ({ ...p, idCard: e.target.value }))} className="form-input" placeholder="请输入身份证号码" /></div>
                <div className="form-field"><label className="form-label">联系电话 *</label><input type="tel" value={visitorForm.phone} onChange={e => setVisitorForm(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="请输入联系电话" /></div>
                <div className="form-field"><label className="form-label">与老人关系 *</label><select value={visitorForm.relationship} onChange={e => setVisitorForm(p => ({ ...p, relationship: e.target.value }))} className="form-select"><option value="">请选择关系</option><option value="子女">子女</option><option value="配偶">配偶</option><option value="亲属">亲属</option><option value="朋友">朋友</option><option value="其他">其他</option></select></div>
              </div>
            </div>
            <div className="content-section">
              <h3 className="section-title">访问安排</h3>
              <div className="form-grid">
                <div className="form-field"><label className="form-label">访问日期 *</label><input type="date" value={visitorForm.visitDate} onChange={e => setVisitorForm(p => ({ ...p, visitDate: e.target.value }))} className="form-input" /></div>
                <div className="form-field"><label className="form-label">开始时间 *</label><input type="time" value={visitorForm.startTime} onChange={e => setVisitorForm(p => ({ ...p, startTime: e.target.value }))} className="form-input" /></div>
                <div className="form-field"><label className="form-label">结束时间 *</label><input type="time" value={visitorForm.endTime} onChange={e => setVisitorForm(p => ({ ...p, endTime: e.target.value }))} className="form-input" /></div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}><label className="form-label">访问原因 *</label><textarea value={visitorForm.reason} onChange={e => setVisitorForm(p => ({ ...p, reason: e.target.value }))} className="form-textarea" placeholder="请简要说明访问原因" /></div>
              </div>
            </div>
          </div>
          <div className="content-section" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <h3 className="section-title">登记预览</h3>
            <div className="result-details">
              <div className="detail-item"><span className="detail-label">访客ID:</span><span style={{ fontFamily: 'monospace' }}>{generateVisitorId()}</span></div>
              <div className="detail-item"><span className="detail-label">姓名:</span><span>{visitorForm.name || '未填写'}</span></div>
              <div className="detail-item"><span className="detail-label">电话:</span><span>{visitorForm.phone || '未填写'}</span></div>
              <div className="detail-item"><span className="detail-label">关系:</span><span>{visitorForm.relationship || '未选择'}</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
            <button onClick={onBack} className="btn-secondary">取消</button>
            <button onClick={handleVisitorSubmit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>{loading ? '提交中...' : '确认登记'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorRegisterPage;
