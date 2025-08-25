import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types';
import './MaintenanceLayout.css';

export function MaintenanceLayout() {
  const [user, setUser] = useState<StaffInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (!user) {
    return <div>正在加载用户信息...</div>;
  }

  return (
    <div className="maintenance-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>维修工系统</h2>
          <p>欢迎, {user.name}</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/maintenance" end>工作台</NavLink>
          <NavLink to="/maintenance/announcements">公告栏</NavLink>
          
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}