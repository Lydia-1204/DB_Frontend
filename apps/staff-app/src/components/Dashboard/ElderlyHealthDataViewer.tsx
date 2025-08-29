import React, { useState } from 'react';
import type { ElderlyProfile } from '@smart-elderly-care/types';

// 为了保持风格统一，我们假设可以复用一些全局或父级组件的样式
// 这里使用内联样式作为示例
const sectionStyle: React.CSSProperties = { background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '20px' };
const headerStyle: React.CSSProperties = { marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' };
const itemStyle: React.CSSProperties = { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' };
const buttonStyle = (isActive: boolean): React.CSSProperties => ({ padding: '8px 12px', cursor: 'pointer', background: isActive ? '#007bff' : '#f0f0f0', color: isActive ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '4px' });

interface Props {
  profile: ElderlyProfile;
}

type ActiveSection = 'health' | 'assessment' | 'orders' | null;

export const ElderlyHealthDataViewer: React.FC<Props> = ({ profile }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('health');

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => (prev === section ? null : section));
  };
  
  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  return (
    <div style={sectionStyle}>
      <h3 style={headerStyle}>{profile.elderlyInfo.name} 的健康档案依据</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button style={buttonStyle(activeSection === 'health')} onClick={() => toggleSection('health')}>健康监测 ({profile.healthMonitorings.length})</button>
        <button style={buttonStyle(activeSection === 'assessment')} onClick={() => toggleSection('assessment')}>健康评估 ({profile.healthAssessments.length})</button>
        <button style={buttonStyle(activeSection === 'orders')} onClick={() => toggleSection('orders')}>历史医嘱 ({profile.medicalOrders.length})</button>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto', paddingRight: '10px' }}>
        {activeSection === 'health' && (
          <section>
            {profile.healthMonitorings.map((record, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>监测时间:</strong> {formatDateTime(record.monitoringDate)}</p>
                <p>心率: {record.heartRate} bpm | 血压: {record.bloodPressure}</p>
                <p>血氧: {record.oxygenLevel}% | 体温: {record.temperature}°C</p>
                <p><strong>状态:</strong> {record.status}</p>
              </div>
            ))}
          </section>
        )}
        {activeSection === 'assessment' && (
          <section>
            {profile.healthAssessments.map((report, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>评估日期:</strong> {formatDateTime(report.assessmentDate)}</p>
                <p>生理机能: {report.physicalHealthFunction} | 心理功能: {report.psychologicalFunction}</p>
                <p>认知功能: {report.cognitiveFunction} | <strong>健康等级:</strong> {report.healthGrade}</p>
              </div>
            ))}
          </section>
        )}
        {activeSection === 'orders' && (
          <section>
            {profile.medicalOrders.map((order, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>开立日期:</strong> {formatDateTime(order.orderDate)}</p>
                <p>药品ID: {order.medicineId} | 剂量: {order.dosage}</p>
                <p>频次: {order.frequency} | 持续时间: {order.duration}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};