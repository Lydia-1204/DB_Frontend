import React from 'react';
import { Calendar, Search, Users, User } from 'lucide-react';
import type { Page } from '../types';

interface Props { onNavigate: (p: Page) => void; }

const HomePage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="home-wrapper">
      <div className="home-center-wrapper">
      <header className="home-header">
        <div className="home-header-inner">
          <h1 className="home-title">智慧养老访客预约系统</h1>
          <div className="home-subline-box">
            <div className="home-subline-flex">
              <p className="home-subline-text">欢迎使用智慧养老访客预约系统 - 高效便捷的访客管理和预约服务平台</p>
              <p className="home-date">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }).replace(/\//g, '/')}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="home-main">
        <div className="home-main-inner">
          <div className="function-grid">
            <div onClick={() => onNavigate('individualAppointment')} className="function-card group">
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-3">个人预约</h3>
                <p className="text-blue-700 leading-relaxed">登记访客基本信息，并生成唯一预约ID</p>
              </div>
            </div>
            {/* 交换位置：批量预约 放在第二 */}
            <div onClick={() => onNavigate('batchAppointment')} className="function-card group">
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-3">批量预约</h3>
                <p className="text-blue-700 leading-relaxed">支持多人同时预约，适用于团队访问和集体活动</p>
              </div>
            </div>
            {/* 原第二项换成第三：预约查询 */}
            <div onClick={() => onNavigate('query')} className="function-card group">
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-3">预约查询</h3>
                <p className="text-blue-700 leading-relaxed">通过预约ID快速查询预约记录，确认访问信息</p>
              </div>
            </div>
            <div onClick={() => onNavigate('appointments')} className="function-card group">
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-3">我的预约</h3>
                <p className="text-blue-700 leading-relaxed">查看本账户的所有预约记录，掌握访问安排</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default HomePage;
