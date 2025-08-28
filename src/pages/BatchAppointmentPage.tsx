import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, X } from 'lucide-react';
import { DEFAULT_ELDERLY_ID } from '../types';
import type { Appointment } from '../types';
import { submitBulkVisitorRegistration, getLoggedVisitor } from '../api';

interface Props { onBack: () => void; onAddAppointment: (a: Appointment) => void; }

const BatchAppointmentPage: React.FC<Props> = ({ onBack, onAddAppointment }) => {
  const [loading, setLoading] = useState(false);
  const [batchForm, setBatchForm] = useState({ visitors: [{ name: '', relationship: '' }], reason: '', elderlyId: DEFAULT_ELDERLY_ID, visitType: '视频探视' as '视频探视' | '线下探视' });

  const addBatchVisitor = () => setBatchForm(p => ({ ...p, visitors: [...p.visitors, { name: '', relationship: '' }] }));
  const removeBatchVisitor = (i: number) => setBatchForm(p => ({ ...p, visitors: p.visitors.filter((_, idx) => idx !== i) }));
  const updateBatchVisitor = (i: number, field: 'name' | 'relationship', value: string) => setBatchForm(p => ({ ...p, visitors: p.visitors.map((v: any, idx) => idx === i ? { ...v, [field]: value } : v) }));

  const handleBatchSubmit = async () => {
    const logged = getLoggedVisitor();
    if (!logged?.visitorId) { alert('请先登录'); return; }
  const validVisitors = batchForm.visitors.filter(v => v.name && v.relationship);
  if (validVisitors.length === 0 || !batchForm.reason) { alert('请填写至少一个访客姓名和关系，并填入预约原因'); return; }
    setLoading(true);
    try {
      const res: any = await submitBulkVisitorRegistration({
        responsibleVisitorId: logged.visitorId,
        visitors: validVisitors.map(v => ({ visitorName: v.name, relationshipToElderly: v.relationship, visitReason: batchForm.reason })),
        visitType: batchForm.visitType,
        elderlyId: batchForm.elderlyId
      });
      const ids: number[] = res?.registrationIds || [];
      const firstId = ids[0] || Date.now();
      // 仅以第一条作为代表加入列表（后端每个生成的预约需单独刷新后获取）
      const newAppointment: Appointment = {
        registrationId: Number(firstId),
        visitorId: logged.visitorId,
        elderlyId: batchForm.elderlyId,
        visitorName: validVisitors[0].name,
        visitTime: undefined,
        relationshipToElderly: validVisitors[0].relationship,
        visitReason: batchForm.reason,
        visitType: batchForm.visitType,
        approvalStatus: '待批准'
      };
      onAddAppointment(newAppointment);
  setBatchForm({ visitors: [{ name: '', relationship: '' }], reason: '', elderlyId: DEFAULT_ELDERLY_ID, visitType: '视频探视' });
      if (ids.length > 0) {
        alert(`批量预约成功！您的预约ID列表为：${ids.join(', ')} ，请牢记。`);
      } else {
        alert('批量预约成功！(服务器未返回ID列表)');
      }
      onBack();
    } catch { alert('批量预约失败，请重试'); } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper"><div className="page-container"><div className="page-header"><div className="page-header-left"><button onClick={onBack} className="page-back-btn"><ArrowLeft className="w-6 h-6" /></button><div><h2 className="page-title">批量预约</h2><p className="page-subtitle">为多位访客同时预约访问时间</p></div></div><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users className="w-5 h-5" /></div><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>当前 {batchForm.visitors.length} 人</span></div></div><div className="page-content"><div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
      <div className="content-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}><h3 className="section-title">访客信息</h3><button onClick={addBatchVisitor} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus className="w-4 h-4" />添加访客</button></div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {batchForm.visitors.map((visitor, index) => (
            <div key={index} style={{ background: 'rgba(239,246,255,0.3)', border: '2px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e3a8a' }}>访客 {index + 1}</h4>
                {batchForm.visitors.length > 1 && (<button onClick={() => removeBatchVisitor(index)} style={{ padding: '4px', color: '#dc2626', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X className="w-4 h-4" /></button>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '16px' }}>
                <div><label className="form-label">姓名 *</label><input type="text" value={visitor.name} onChange={e => updateBatchVisitor(index, 'name', e.target.value)} className="form-input" placeholder="姓名" /></div>
                <div><label className="form-label">与老人关系 *</label><select value={visitor.relationship} onChange={e => updateBatchVisitor(index, 'relationship', e.target.value)} className="form-select"><option value="">请选择关系</option><option value="子女">子女</option><option value="配偶">配偶</option><option value="亲属">亲属</option><option value="朋友">朋友</option><option value="其他">其他</option></select></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="content-section">
        <h3 className="section-title">预约详情</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div><label className="form-label">预约原因 *</label><textarea value={batchForm.reason} onChange={e => setBatchForm(p => ({ ...p, reason: e.target.value }))} className="form-input" rows={3} placeholder="请输入预约原因" /></div>
          <div><label className="form-label">访问类型 *</label><select value={batchForm.visitType} onChange={e => setBatchForm(p => ({ ...p, visitType: e.target.value as any }))} className="form-select"><option value="视频探视">视频探视</option><option value="线下探视">线下探视</option></select></div>
          <div><label className="form-label">老人ID (0=全体)</label><input type="number" value={batchForm.elderlyId} onChange={e => setBatchForm(p => ({ ...p, elderlyId: Number(e.target.value) }))} className="form-input" placeholder="输入老人ID或0" /></div>
          <div style={{ background: 'rgba(239,246,255,0.5)', border: '2px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1e3a8a' }}>预约摘要</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>访客数量:</span><span style={{ color: '#1e3a8a', fontWeight: 600 }}>{batchForm.visitors.filter(v => v.name && v.relationship).length} 人</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>访问类型:</span><span style={{ color: '#1e3a8a', fontWeight: 600 }}>{batchForm.visitType}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>探视对象:</span><span style={{ color: '#1e3a8a', fontWeight: 600 }}>{batchForm.elderlyId === 0 ? '全体老人' : `老人ID ${batchForm.elderlyId}`}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div><div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid rgba(239,246,255,0.5)' }}><button onClick={onBack} className="btn-secondary">取消</button><button onClick={handleBatchSubmit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>{loading ? '提交中...' : '确认预约'}</button></div></div></div></div>
  );
};

export default BatchAppointmentPage;
