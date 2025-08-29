import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types';
import '../../components/Layout/NurseLayout.css'; // 导入我们刚创建的CSS

export function NurseLayout() {
  const [user, setUser] = useState<StaffInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    } else {
      // 如果没有用户信息，理论上应该被路由守卫拦住，但作为双重保险
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (!user) {
    // 可以在这里显示一个加载动画
    return <div>Loading user information...</div>;
  }

  return (
    <div className="nurse-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>护士端</h2>
          <p>欢迎, {user.name}</p>
        </div>
        <nav className="sidebar-nav">
          {/* 使用 NavLink，当路径匹配时，它会自动添加 'active' class */}
          <NavLink to="/nurse" end>工作台</NavLink>
          <NavLink to="/nurse/elderly-management">老人档案管理</NavLink>
           {/* ↓↓↓↓ 在这里添加我们新的导航链接 ↓↓↓↓ */}
          <NavLink to="/nurse/diet-management"> 饮食管理</NavLink>
         
          <NavLink to="/nurse/activity-schedule">活动安排</NavLink>
          {/* ↓↓↓↓ 在这里添加我们新的导航链接 ↓↓↓↓ */}
          <NavLink to="/nurse/visitor-approval">访客审批</NavLink>
          <NavLink to="/nurse/announcements">系统公告</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        {/* Outlet 是一个占位符，所有子路由的页面都会在这里显示 */}
        <Outlet />
      </main>
    </div>
  );
}