import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types'; // 确保路径正确
import './CleanerLayout.css'; // 使用与之前相同的 CSS 文件

export function CleanerLayout() {
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
    <div className="cleaner-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>清洁工系统</h2>
          {/* 使用驼峰命名的 'name' */}
          <p>欢迎, {user.name}</p> 
        </div>
        <nav className="sidebar-nav">
          {/* `end` 属性确保只有在完全匹配 /cleaner 时才高亮 */}
          <NavLink to="/cleaner" end>工作台</NavLink>
          <NavLink to="/cleaner/announcements">公告栏</NavLink>
          
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