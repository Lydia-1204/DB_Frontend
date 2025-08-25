import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ElderlyProfile } from '@smart-elderly-care/types';

// 定义一个类型，用于表示当前激活的板块
// 使用 string | null 可以方便地扩展，而不仅仅是预定义的几个
type ActiveSection = string | null;

export function ElderlyDetailPage() {
  const { elderlyId } = useParams<{ elderlyId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ElderlyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  useEffect(() => {
    if (!elderlyId) {
      setError("未提供老人ID");
      setIsLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ElderlyRecord/${elderlyId}`);
        if (!response.ok) {
          throw new Error(`获取ID为 ${elderlyId} 的老人档案失败，状态码: ${response.status}`);
        }
        const data: ElderlyProfile = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [elderlyId]);

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  // 格式化日期时间的辅助函数
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('zh-CN');
  };

  if (isLoading) return <div>正在加载档案...</div>;
  if (error) return <div style={{ color: 'red' }}>错误: {error}</div>;
  if (!profile) return <div>未找到档案信息。</div>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        &larr; 返回列表
      </button>
      <h1>{profile.elderlyInfo.name} 的详细档案</h1>
      
      {/* --- 基本信息 --- */}
      <section style={sectionStyle}>
        <h3 style={headerStyle}>基本信息</h3>
        <p><strong>ID:</strong> {profile.elderlyInfo.elderlyId}</p>
        <p><strong>性别:</strong> {profile.elderlyInfo.gender}</p>
        <p><strong>出生日期:</strong> {profile.elderlyInfo.birthDate}</p>
        <p><strong>身份证号:</strong> {profile.elderlyInfo.idCardNumber}</p>
        <p><strong>联系电话:</strong> {profile.elderlyInfo.contactPhone}</p>
        <p><strong>地址:</strong> {profile.elderlyInfo.address}</p>
        <p><strong>紧急联系人:</strong> {profile.elderlyInfo.emergencyContact}</p>
      </section>

      {/* --- 控制按钮区域 --- */}
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button style={buttonStyle(activeSection === 'family')} onClick={() => toggleSection('family')}>家属信息 ({profile.familyInfos.length})</button>
        <button style={buttonStyle(activeSection === 'health')} onClick={() => toggleSection('health')}>健康监测 ({profile.healthMonitorings.length})</button>
        <button style={buttonStyle(activeSection === 'assessment')} onClick={() => toggleSection('assessment')}>健康评估 ({profile.healthAssessments.length})</button>
        <button style={buttonStyle(activeSection === 'orders')} onClick={() => toggleSection('orders')}>医嘱记录 ({profile.medicalOrders.length})</button>
        <button style={buttonStyle(activeSection === 'nursing')} onClick={() => toggleSection('nursing')}>护理计划 ({profile.nursingPlans.length})</button>
        <button style={buttonStyle(activeSection === 'fees')} onClick={() => toggleSection('fees')}>费用结算 ({profile.feeSettlements.length})</button>
        <button style={buttonStyle(activeSection === 'activities')} onClick={() => toggleSection('activities')}>活动参与 ({profile.activityParticipations.length})</button>
      </div>

      {/* --- 动态渲染区域 --- */}
      <div>
        {activeSection === 'family' && (
          <section style={sectionStyle}>
            <h4 style={headerStyle}>家属信息</h4>
            {profile.familyInfos.map((info, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>姓名:</strong> {info.name} ({info.relationship}) {info.isPrimaryContact === 'Y' && <span style={{ color: 'green' }}>(主联系人)</span>}</p>
                <p><strong>联系电话:</strong> {info.contactPhone}</p>
                <p><strong>邮箱:</strong> {info.contactEmail}</p>
                <p><strong>地址:</strong> {info.address}</p>
              </div>
            ))}
          </section>
        )}
        
        {activeSection === 'health' && (
          <section style={sectionStyle}>
            <h4 style={headerStyle}>健康监测记录</h4>
            {profile.healthMonitorings.map((record, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>监测时间:</strong> {formatDateTime(record.monitoringDate)}</p>
                <p><strong>心率:</strong> {record.heartRate} bpm</p>
                <p><strong>血压:</strong> {record.bloodPressure}</p>
                <p><strong>血氧:</strong> {record.oxygenLevel}%</p>
                <p><strong>体温:</strong> {record.temperature}°C</p>
                <p><strong>状态:</strong> <span style={{ color: record.status !== 'Normal' && record.status !== '正常' ? 'red' : 'green' }}>{record.status}</span></p>
              </div>
            ))}
          </section>
        )}

        {activeSection === 'assessment' && (
           <section style={sectionStyle}>
            <h4 style={headerStyle}>健康评估报告</h4>
            {profile.healthAssessments.map((report, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>评估日期:</strong> {formatDateTime(report.assessmentDate)}</p>
                <p><strong>生理机能:</strong> {report.physicalHealthFunction}</p>
                <p><strong>心理功能:</strong> {report.psychologicalFunction}</p>
                <p><strong>认知功能:</strong> {report.cognitiveFunction}</p>
                <p><strong>健康等级:</strong> {report.healthGrade}</p>
              </div>
            ))}
          </section>
        )}

        {activeSection === 'orders' && (
           <section style={sectionStyle}>
            <h4 style={headerStyle}>医嘱记录</h4>
            {profile.medicalOrders.map((order, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>开立日期:</strong> {formatDateTime(order.orderDate)}</p>
                <p><strong>药品ID:</strong> {order.medicineId}</p>
                <p><strong>剂量:</strong> {order.dosage}</p>
                <p><strong>频次:</strong> {order.frequency}</p>
                <p><strong>持续时间:</strong> {order.duration}</p>
                <p><strong>开立员工ID:</strong> {order.staffId}</p>
              </div>
            ))}
          </section>
        )}

        {activeSection === 'nursing' && (
           <section style={sectionStyle}>
            <h4 style={headerStyle}>护理计划</h4>
            {profile.nursingPlans.map((plan, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>计划周期:</strong> {formatDateTime(plan.planStartDate)} - {formatDateTime(plan.planEndDate)}</p>
                <p><strong>护理类型:</strong> {plan.careType}</p>
                <p><strong>优先级:</strong> {plan.priority}</p>
                <p><strong>评估状态:</strong> {plan.evaluationStatus}</p>
                <p><strong>负责员工ID:</strong> {plan.staffId}</p>
              </div>
            ))}
          </section>
        )}

        {activeSection === 'fees' && (
           <section style={sectionStyle}>
            <h4 style={headerStyle}>费用结算</h4>
            {profile.feeSettlements.map((fee, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>结算日期:</strong> {formatDateTime(fee.settlementDate)}</p>
                <p><strong>总金额:</strong> ¥{fee.totalAmount}</p>
                <p><strong>医保支付:</strong> ¥{fee.insuranceAmount}</p>
                <p><strong>个人支付:</strong> ¥{fee.personalPayment}</p>
                <p><strong>支付状态:</strong> {fee.paymentStatus} ({fee.paymentMethod})</p>
                <p><strong>经办员工ID:</strong> {fee.staffId}</p>
              </div>
            ))}
          </section>
        )}

        {activeSection === 'activities' && (
           <section style={sectionStyle}>
            <h4 style={headerStyle}>活动参与记录</h4>
            {profile.activityParticipations.map((item, index) => (
              <div key={index} style={itemStyle}>
                <p><strong>活动ID:</strong> {item.activityId}</p>
                <p><strong>报名时间:</strong> {formatDateTime(item.registrationTime)}</p>
                <p><strong>签到时间:</strong> {item.checkInTime}</p>
                <p><strong>参与状态:</strong> {item.status}</p>
                <p><strong>反馈:</strong> {item.feedback}</p>
              </div>
            ))}
          </section>
        )}

      </div>
    </div>
  );
}

// --- 内联 CSS 样式，用于美化界面 ---
const sectionStyle: React.CSSProperties = {
  background: '#f9f9f9',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '15px',
  marginBottom: '20px',
};

const headerStyle: React.CSSProperties = {
  marginTop: 0,
  borderBottom: '2px solid #eee',
  paddingBottom: '10px',
};

const itemStyle: React.CSSProperties = {
  border: '1px solid #eee',
  borderRadius: '4px',
  padding: '10px',
  marginBottom: '10px',
  background: '#fff',
};

const buttonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '10px 15px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  background: isActive ? '#007bff' : '#f0f0f0',
  color: isActive ? 'white' : 'black',
  fontWeight: isActive ? 'bold' : 'normal',
});