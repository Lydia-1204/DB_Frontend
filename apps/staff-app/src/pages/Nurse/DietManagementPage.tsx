import React, { useState, FormEvent } from 'react';
import type { DietRecommendation, HealthMonitoring, HealthAssessmentReport, ElderlyProfile } from '@smart-elderly-care/types';
import styles from './ElderlyManagementPage.module.css'; 

export function DietManagementPage() {
  const [searchId, setSearchId] = useState('');
  const [currentElderlyId, setCurrentElderlyId] = useState<string | null>(null);
  
  const [dietRecs, setDietRecs] = useState<DietRecommendation[]>([]);
  const [healthMonitors, setHealthMonitors] = useState<HealthMonitoring[]>([]);
  const [healthAssessments, setHealthAssessments] = useState<HealthAssessmentReport[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    setIsLoading(true);
    setError(null);
    setNotification(null);
    setDietRecs([]);
    setHealthMonitors([]);
    setHealthAssessments([]);
    setCurrentElderlyId(null); // 在新搜索开始时清除当前ID

    try {
      const profileResponse = await fetch(`/api/ElderlyRecord/${searchId}`);
      if (!profileResponse.ok) throw new Error(`未找到ID为 ${searchId} 的老人档案`);
      const profileData: ElderlyProfile = await profileResponse.json();
      setHealthMonitors(profileData.healthMonitorings);
      setHealthAssessments(profileData.healthAssessments);

      await fetchDietRecommendations(searchId);
      
      setCurrentElderlyId(searchId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchDietRecommendations = async (elderlyId: string) => {
     try {
        const dietResponse = await fetch(`/api/DietRecommendation/${elderlyId}`);
        if (!dietResponse.ok) throw new Error(`获取饮食建议失败`);
        const dietData: DietRecommendation[] = await dietResponse.json();
        setDietRecs(dietData);
     } catch (err: any) {
        // 如果获取饮食建议失败，不应该阻塞整个页面，只显示错误信息
        setError(`获取饮食建议时出错: ${err.message}`);
        setDietRecs([]); // 清空旧数据
     }
  }

  // --- 1. 优化：处理特殊的成功响应 ---
  const handleGenerate = async () => {
    if (!currentElderlyId) return;
    setError(null);
    setNotification('正在生成建议...');
    try {
      const response = await fetch(`/api/DietRecommendation/generate/${currentElderlyId}`, { method: 'POST' });
      const responseBody = await response.text(); // 先获取文本内容

      if (!response.ok) { // 处理网络或服务器级别的错误
        throw new Error(`服务器错误: ${response.statusText}`);
      }

      // 对返回 200 OK 的响应体进行内容判断
      if (responseBody.includes("缺少健康数据") || responseBody.includes("无法生成建议")) {
        // 这是后端返回的“业务逻辑失败”信息
        setError(responseBody);
        setNotification(null); // 清除"正在生成"的提示
      } else {
        // 成功生成，返回的是食物名称
        setNotification(`新建议已成功生成: ${responseBody}`);
        await fetchDietRecommendations(currentElderlyId);
      }
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };

  // --- 2. 优化：标记后立即刷新列表 ---
  const handleUpdateStatus = async (recommendationId: number) => {
    if (!currentElderlyId) return;
    setError(null);
    try {
      const response = await fetch(`/api/DietRecommendation/${recommendationId}/status?confirm=true`, { method: 'PUT' });
      if (!response.ok) throw new Error('更新状态失败');
      
      setNotification(`建议 #${recommendationId} 已标记为已执行。正在刷新列表...`);
      // 重新从服务器获取最新的饮食建议列表，确保数据同步
      await fetchDietRecommendations(currentElderlyId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (recommendationId: number) => {
    if (!currentElderlyId) return;
    if (!window.confirm(`确定要删除建议 #${recommendationId} 吗？`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/DietRecommendation/${recommendationId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除建议失败');
      
      setNotification(`建议 #${recommendationId} 已成功删除。正在刷新列表...`);
       // 删除成功后，也重新获取列表
      await fetchDietRecommendations(currentElderlyId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  // --- 3. 优化：完整的健康数据展示组件 ---
  const renderHealthData = () => (
    <aside>
      <section>
        <h3>健康监测数据 ({healthMonitors.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
          {healthMonitors.length > 0 ? healthMonitors.map((m, i) => (
            <div key={i} style={itemStyle}>
              <p><strong>监测时间:</strong> {formatDateTime(m.monitoringDate)}</p>
              <p><strong>心率:</strong> {m.heartRate} bpm | <strong>血压:</strong> {m.bloodPressure}</p>
              <p><strong>血氧:</strong> {m.oxygenLevel}% | <strong>体温:</strong> {m.temperature}°C</p>
              <p><strong>状态:</strong> <span style={{ color: m.status !== 'Normal' && m.status !== '正常' ? 'red' : 'green', fontWeight: 'bold' }}>{m.status}</span></p>
            </div>
          )) : <p>暂无数据</p>}
        </div>
      </section>
      <section style={{ marginTop: '20px' }}>
        <h3>健康评估报告 ({healthAssessments.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
           {healthAssessments.length > 0 ? healthAssessments.map((a, i) => (
            <div key={i} style={itemStyle}>
              <p><strong>评估日期:</strong> {formatDateTime(a.assessmentDate)}</p>
              <p><strong>生理机能:</strong> {a.physicalHealthFunction} | <strong>心理功能:</strong> {a.psychologicalFunction}</p>
              <p><strong>认知功能:</strong> {a.cognitiveFunction}</p>
              <p><strong>健康等级:</strong> <span style={{ fontWeight: 'bold' }}>{a.healthGrade}</span></p>
            </div>
          )) : <p>暂无数据</p>}
        </div>
      </section>
    </aside>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>饮食管理</h1></div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="输入老人ID进行搜索" style={{ flexGrow: 1, padding: '10px' }} />
        <button type="submit" className={styles.button} disabled={isLoading}>{isLoading ? '搜索中...' : '搜索'}</button>
      </form>

      {error && <p className={styles.error} onClick={() => setError(null)} style={{cursor: 'pointer'}} title="点击关闭">{error}</p>}
      {notification && <p style={{ color: 'green', padding: '10px', backgroundColor: '#e6f7ff', cursor: 'pointer' }} onClick={() => setNotification(null)} title="点击关闭">{notification}</p>}

      {currentElderlyId && !isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>饮食建议 ({dietRecs.length})</h3>
              <button className={styles.button} onClick={handleGenerate}>一键生成建议</button>
            </div>
            {dietRecs.length > 0 ? dietRecs.map(rec => (
              <div key={rec.recommendationId} style={itemStyle}>
                <p><strong>建议内容:</strong> <span style={{fontSize: '1.1em', fontWeight: 'bold'}}>{rec.recommendedFood}</span></p>
                <p><strong>建议日期:</strong> {formatDateTime(rec.recommendationDate)}</p>
                <p><strong>状态:</strong> <span style={{color: rec.executionStatus === '已执行' ? 'green' : 'orange'}}>{rec.executionStatus}</span></p>
                <div className={styles.actions} style={{marginTop: '10px'}}>
                  <button className={`${styles.button} ${styles.editBtn}`} onClick={() => handleUpdateStatus(rec.recommendationId)} disabled={rec.executionStatus === '已执行'}>标记为已执行</button>
                  <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleDelete(rec.recommendationId)}>删除</button>
                </div>
              </div>
            )) : <p>暂无饮食建议。可尝试点击“一键生成建议”。</p>}
          </section>
          {renderHealthData()}
        </div>
      )}
    </div>
  );
}

// 可以在 ElderlyManagementPage.module.css 同级目录下，或者在 packages/ui/src/styles 中定义这些样式
const itemStyle: React.CSSProperties = {
  border: '1px solid #eee',
  borderRadius: '4px',
  padding: '15px',
  marginBottom: '10px',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};