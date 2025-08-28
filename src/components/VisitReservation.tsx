import React from 'react';

// 预约探视占位组件：后续可替换为真正的预约逻辑 / 表单
export const VisitReservation: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
      <h2 className="text-3xl font-bold text-blue-800 mb-4 flex items-center">
        <span className="mr-2 text-4xl">🗓️</span>预约探视
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        此处为“预约探视”功能占位页面，后续添加跳转逻辑。
      </p>
    </div>
  );
};

export default VisitReservation;
