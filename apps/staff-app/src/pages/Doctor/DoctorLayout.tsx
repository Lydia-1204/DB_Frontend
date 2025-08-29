import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types'; 
// 我们复用护士端的 CSS，因为布局几乎一样，保持风格统一
import '../../components/Layout/NurseLayout.css'; 

export function DoctorLayout() {
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
    return <div>Loading user information...</div>;
  }

 
  const userName = user.name || user.name; 

  return (
    <div className="nurse-layout"> {/* 复用 nurse-layout 的 class */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>医生端</h2>
          <p>欢迎, {userName}</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/doctor" end>工作台</NavLink>
          <NavLink to="/doctor/elderly-management">老人档案管理</NavLink>
          <NavLink to="/doctor/announcements">系统公告</NavLink>
          {/* 未来医生的其他导航链接可以在这里添加 */}
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