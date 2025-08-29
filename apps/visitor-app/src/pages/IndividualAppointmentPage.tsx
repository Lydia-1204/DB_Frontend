import React, { useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { DEFAULT_ELDERLY_ID } from '../types';
import type { Appointment } from '../types';
import { submitVisitorRegistration } from '../api';
import { getLoggedVisitor } from '../api';

interface Props { onBack: () => void; onAddAppointment: (a: Appointment) => void; }

const IndividualAppointmentPage: React.FC<Props> = ({ onBack, onAddAppointment }) => {
  const [loading, setLoading] = useState(false);
  const [individualForm, setIndividualForm] = useState({ name: '', relationship: '', reason: '', elderlyId: DEFAULT_ELDERLY_ID, visitType: '视频探视' as '视频探视' | '线下探视' });

  const handleIndividualSubmit = async () => {
  if (!individualForm.name || !individualForm.relationship || !individualForm.reason) { alert('请填写所有必填信息'); return; }
    const logged = getLoggedVisitor();
    if (!logged?.visitorId) { alert('请先登录'); return; }
    setLoading(true);
    try {
  const res: any = await submitVisitorRegistration({
        responsibleVisitorId: logged.visitorId,
        visitorName: individualForm.name,
        relationshipToElderly: individualForm.relationship,
        visitReason: individualForm.reason,
        visitType: individualForm.visitType,
        elderlyId: individualForm.elderlyId
      });
  const regId = res?.registrationId || res?.id || Date.now();
  const newAppointment: Appointment = {
    registrationId: Number(regId),
    visitorId: logged.visitorId,
    elderlyId: individualForm.elderlyId,
    visitorName: individualForm.name,
    visitTime: undefined,
    relationshipToElderly: individualForm.relationship,
    visitReason: individualForm.reason,
    visitType: individualForm.visitType,
    approvalStatus: '待批准'
  };
  onAddAppointment(newAppointment);
  setIndividualForm({ name: '', relationship: '', reason: '', elderlyId: DEFAULT_ELDERLY_ID, visitType: '视频探视' });
  alert(`个人预约成功！您的预约ID为 ${regId} ，请牢记。`);
      onBack();
    } catch { alert('个人预约失败，请重试'); } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-card">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={onBack} className="back-button"><ArrowLeft className="w-6 h-6" /></button>
              <h2 className="page-title">个人预约</h2>
            </div>
            <div className="header-icon"><User className="w-5 h-5" /></div>
          </div>
          <div className="page-content">
            {/* 合并后的单一预约信息板块 */}
            <div className="content-section" style={{ marginBottom: '28px' }}>
              <h3 className="section-title">预约信息</h3>
              <div style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: '1fr 1fr',
              }}>
                <div>
                  <label className="form-label">姓名 *</label>
                  <input type="text" value={individualForm.name} onChange={e => setIndividualForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="请输入姓名" />
                </div>
                <div>
                  <label className="form-label">与老人关系 *</label>
                  <select value={individualForm.relationship} onChange={e => setIndividualForm(p => ({ ...p, relationship: e.target.value }))} className="form-select">
                    <option value="">请选择关系</option>
                    <option value="子女">子女</option>
                    <option value="配偶">配偶</option>
                    <option value="亲属">亲属</option>
                    <option value="朋友">朋友</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">老人ID (0表示全体)</label>
                  <input type="number" value={individualForm.elderlyId} onChange={e => setIndividualForm(p => ({ ...p, elderlyId: Number(e.target.value) }))} className="form-input" placeholder="请输入老人ID或0" />
                </div>
                <div>
                  <label className="form-label">访问类型 *</label>
                  <select value={individualForm.visitType} onChange={e => setIndividualForm(p => ({ ...p, visitType: e.target.value as any }))} className="form-select">
                    <option value="视频探视">视频探视</option>
                    <option value="线下探视">线下探视</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '15px' }}>访问原因 *</label>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{individualForm.reason.length}/70</div>
                  <textarea
                    value={individualForm.reason}
                    onChange={e => setIndividualForm(p => ({ ...p, reason: e.target.value.slice(0, 70) }))}
                    className="form-input"
                    rows={2}
                    maxLength={70}
                    style={{ width: '100%', height: '56px', paddingTop: '10px', paddingBottom: '10px', resize: 'none' }}
                    placeholder="请输入访问原因（最多70字）"
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid rgba(239,246,255,0.5)' }}>
              <button onClick={onBack} className="btn-secondary">取消</button>
              <button onClick={handleIndividualSubmit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>{loading ? '提交中...' : '确认预约'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualAppointmentPage;
