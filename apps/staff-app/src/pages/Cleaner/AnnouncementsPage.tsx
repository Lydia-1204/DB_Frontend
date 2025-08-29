import React from 'react';

export function AnnouncementsPage() {
  // 在这个组件里，你可以调用 API 获取并展示面向清洁人员的系统公告
  return (
    <div>
      <h1>系统公告 (清洁工)</h1>
      <p>这里将显示所有与清洁工作相关的系统公告和通知。</p>
      {/* 示例公告项 */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
        <h4>关于三号楼深度消毒的通知</h4>
        <p>发布日期: 2025-08-20</p>
        <p>请所有清洁人员注意，本周五下午将对三号楼进行全面深度消毒，请提前准备好相关设备和消毒液。</p>
      </div>
    </div>
  );
}