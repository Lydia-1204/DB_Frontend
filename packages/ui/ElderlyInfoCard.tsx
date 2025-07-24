// 从共享的 types 包中导入类型
import type { ElderlyInfo } from '@smart-elderly-care/types';
import React from 'react';

// 定义组件的 props 类型
interface ElderlyInfoCardProps {
  elderly: ElderlyInfo;
}

// 老人信息卡片组件
export const ElderlyInfoCard: React.FC<ElderlyInfoCardProps> = ({ elderly }) => {
  // 一些简单的内联样式
  const cardStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px',
    maxWidth: '300px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '8px',
  };

  return (
    <div style={cardStyle}>
      <div style={nameStyle}>{elderly.name}</div>
      <div>身份证号: {elderly.id_card}</div>
      <div>老人ID: {elderly.elderly_id}</div>
    </div>
  );
};