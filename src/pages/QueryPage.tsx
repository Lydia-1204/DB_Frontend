import React, { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { getVisitorRegistrationById } from '../api';

interface Props { onBack: () => void; appointments: any[]; }

const QueryPage: React.FC<Props> = ({ onBack }) => {
  const [registrationId, setRegistrationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleQuery = async () => {
    const idNum = Number(registrationId);
    if (!idNum || idNum <= 0) { alert('请输入有效的预约ID（正整数）'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await getVisitorRegistrationById(idNum);
      setResult(data);
    } catch (e: any) {
      if (e?.status === 404) {
        alert('未找到该预约ID');
      } else {
        alert('查询失败，请稍后再试');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <button onClick={onBack} className="page-back-btn"><ArrowLeft className="w-6 h-6" /></button>
            <div><h2 className="page-title">预约查询</h2></div>
          </div>
        </div>
        <div className="page-content">
          <div className="content-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', marginBottom: '16px' }}>
                <Search className="w-8 h-8" style={{ color: '#3b82f6' }} />
              </div>
              <h3 className="section-title" style={{ textAlign: 'center', border: 'none', marginBottom: '8px' }}>预约信息查询</h3>
            </div>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}><label className="form-label">预约ID *</label><input type="number" value={registrationId} onChange={e => setRegistrationId(e.target.value)} className="form-input" placeholder="请输入预约ID" /></div>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
              <button onClick={onBack} className="btn-secondary">返回</button>
              <button onClick={handleQuery} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>{loading ? '查询中...' : '查询预约'}</button>
            </div>
          </div>
          {result && (
            <div className="content-section">
              <h3 className="section-title">预约详情</h3>
              <div className="query-result-card">
                <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="result-name">{result.visitorName} <span style={{ fontSize: '14px', color: '#64748b' }}>[{result.visitorId}]</span></span>
                  <span className="result-status status-pending">{result.visitType}</span>
                </div>
                <div className="result-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '12px 32px' }}>
                  <div className="detail-item"><span className="detail-label">老人ID:</span> <span>{result.elderlyId}</span></div>
                  <div className="detail-item"><span className="detail-label">预约时间:</span> <span>{result.visitTime}</span></div>
                  <div className="detail-item"><span className="detail-label">关系:</span> <span>{result.relationshipToElderly}</span></div>
                  <div className="detail-item"><span className="detail-label">审批状态:</span> <span>{result.approvalStatus}</span></div>
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span className="detail-label">探视原因:</span> <span style={{ wordBreak: 'break-word' }}>{result.visitReason}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryPage;
