import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Appointment } from '../types';

interface Props { onBack: () => void; appointments: Appointment[]; }

const AppointmentsPage: React.FC<Props> = ({ onBack, appointments }) => {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-card">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={onBack} className="back-button"><ArrowLeft className="w-6 h-6" /></button>
              <h2 className="page-title">我的预约记录</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="header-icon"><FileText className="w-5 h-5" /></div>
              <span style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600 }}>共 {appointments.length} 条</span>
            </div>
          </div>
          <div className="page-content">
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ width: 64, height: 64, background: 'rgba(229,231,235,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FileText style={{ width: 32, height: 32, color: '#9ca3af' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e3a8a', marginBottom: 8 }}>暂无预约记录</h3>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>目前没有从接口获取到任何预约。</p>
                <button onClick={onBack} className="btn-primary">去创建</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {appointments.map((a, idx) => {
                  const dateTime = a.visitTime ? a.visitTime.replace('T', ' ') : '-';
                  return (
                    <div key={idx} className="content-section" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <h4 style={{ fontSize: 18, fontWeight: 600, color: '#1e3a8a', margin: 0 }}>{a.visitorName}</h4>
                          <span style={{ background: 'rgba(59,130,246,0.15)', color: '#1e3a8a', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{a.visitType}</span>
                          <span style={{ background: 'rgba(148,163,184,0.2)', color: '#334155', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{a.approvalStatus || '待批准'}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>预约ID: {a.registrationId}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, fontSize: 13, lineHeight: 1.5 }}>
                        <div><strong style={{ color: '#475569' }}>老人ID: </strong>{a.elderlyId ?? '-'}</div>
                        <div><strong style={{ color: '#475569' }}>预约时间: </strong>{dateTime}</div>
                        <div><strong style={{ color: '#475569' }}>关系: </strong>{a.relationshipToElderly}</div>
                      </div>
                      {a.visitReason && <div style={{ marginTop: 10, fontSize: 13, color: '#475569' }}><strong style={{ color: '#334155' }}>探视原因: </strong>{a.visitReason}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
