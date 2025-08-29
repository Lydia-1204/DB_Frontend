import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types';
import '../../components/layout/SupervisorLayout.css'; // 引入样式

export function SupervisorLayout() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('loggedInUser');
  
  if (!userString) {
    // 理论上不会发生，因为有路由守卫，但作为保险
    return null; 
  }
  
  const user: StaffInfo = JSON.parse(userString);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  return (
    <div className="supervisor-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>主管系统</h2>
          <p>欢迎, {user.name}</p>
        </div>
        <nav className="sidebar-nav">
          {/* NavLink 会在当前路由匹配时自动添加 'active' class */}
          
          <NavLink to="/supervisor/staff">员工管理</NavLink>
          <NavLink to="/supervisor/nursing-plans">护理计划</NavLink>
          <NavLink to="/supervisor/disinfection-reports">消毒报告</NavLink>
          <NavLink to="/supervisor/devices">设备管理</NavLink>
          
           {/* ↓↓↓↓ 在这里添加新的房间管理导航链接 ↓↓↓↓ */}
          <NavLink to="/supervisor/rooms">房间管理</NavLink>
          {/* ↓↓↓↓ 在这里添加新的费用结算导航链接 ↓↓↓↓ */}
          <NavLink to="/supervisor/fee-settlement">费用结算</NavLink>
          <NavLink to="/supervisor/announcements">公告栏</NavLink>

        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        {/* Outlet 是一个占位符，用于渲染匹配到的子路由组件 */}
        <Outlet />
      </main>
    </div>
  );
}