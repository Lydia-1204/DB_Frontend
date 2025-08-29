import React from 'react';
export function OperationsPage() {
  const handleGenerateSchedule = () => {
      alert('功能待实现：调用 POST /api/staff-info/nursing-schedule/generate');
  };
  return (
      <div>
          <h1>运营与调度 (功能待开发)</h1>
          <button onClick={handleGenerateSchedule}>一键生成智能排班</button>
      </div>
  );
}