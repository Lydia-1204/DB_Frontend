import React, { useState, useEffect } from 'react';
import './App.css';
import type { Page, Appointment } from './types';
import { fetchVisitorRegistrations, /*getLoggedVisitor,*/ getResponsibleVisitorRegistrations, mapRegistrationDetailToAppointment } from './api';
import type { VisitorLoginInfo } from './api';
import HomePage from './pages/HomePage';
import QueryPage from './pages/QueryPage';
import BatchAppointmentPage from './pages/BatchAppointmentPage';
import IndividualAppointmentPage from './pages/IndividualAppointmentPage';
import AppointmentsPage from './pages/AppointmentsPage';
import { LoginForm } from './pages/LoginForm';
import { ChangePassword } from './pages/ChangePassword';
import { RefreshCw } from 'lucide-react';

const VisitorAppointmentSystem: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 始终要求重新登录：不从 localStorage 自动恢复
  const [visitor, setVisitor] = useState<VisitorLoginInfo | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  // 若需要全局加载状态，可在此引入; 当前未使用故省略

  // 加载初始数据
  // 初次挂载时清理旧缓存，之后不再干扰登录后的 localStorage
  useEffect(() => {
    localStorage.removeItem('visitorInfo');
  }, []);

  useEffect(() => {
    // 登录后才加载预约数据
    if (!visitor) return;
    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (visitor?.visitorId) {
          try {
            const list = await getResponsibleVisitorRegistrations(visitor.visitorId);
            setAppointments(list.map(mapRegistrationDetailToAppointment));
          } catch {
            // 回退旧接口（若后端暂未提供负责人接口时）
            const legacy = await fetchVisitorRegistrations();
            setAppointments(legacy);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [visitor]);
  const addAppointment = (a: Appointment) => setAppointments(prev => [...prev, a]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    if (!visitor) return;
    setLoading(true);
    try {
      if (visitor?.visitorId) {
        try {
          const list = await getResponsibleVisitorRegistrations(visitor.visitorId);
          setAppointments(list.map(mapRegistrationDetailToAppointment));
        } catch {
          const legacy = await fetchVisitorRegistrations();
          setAppointments(legacy);
        }
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'query':
        return <QueryPage onBack={() => setCurrentPage('home')} appointments={appointments} />;
      case 'batchAppointment':
        return <BatchAppointmentPage onBack={() => setCurrentPage('home')} onAddAppointment={addAppointment} />;
      case 'individualAppointment':
        return <IndividualAppointmentPage onBack={() => setCurrentPage('home')} onAddAppointment={addAppointment} />;
      case 'appointments':
        return <AppointmentsPage onBack={() => setCurrentPage('home')} appointments={appointments} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  // 未登录 -> 仅显示登录页面
  if (!visitor) {
  return <LoginForm onSuccess={() => { /* 登录成功后重新从 localStorage 读取 */ const raw = localStorage.getItem('visitorInfo'); if (raw) { try { setVisitor(JSON.parse(raw)); } catch {} } }} />;
  }

  return (
    <div className="font-sans" style={{ position: 'relative', minHeight: '100vh' }}>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontSize: 18, color: '#1e3a8a' }}>加载中...</div>
      )}
      {/* 顶部条 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#1e40af', color: 'white', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600 }}>
          访客[{visitor?.visitorId}]：{visitor.visitorName}（{visitor.visitorPhone}）
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={refreshData}
            title="刷新"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          ><RefreshCw style={{ width: 16, height: 16 }} /></button>
          <button
            onClick={() => setShowChangePassword(true)}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer' }}
          >修改密码</button>
          <button
            onClick={() => { localStorage.removeItem('visitorInfo'); setVisitor(null); setAppointments([]); }}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer' }}
          >退出登录</button>
        </div>
      </div>
      {renderCurrentPage()}
      {showChangePassword && <ChangePassword onCancel={() => setShowChangePassword(false)} />}
    </div>
  );
};

export default VisitorAppointmentSystem;
