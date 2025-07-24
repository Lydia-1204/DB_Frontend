import { useEffect, useState } from 'react';
import './App.css';
// 从共享的 api-client 包导入API函数
import { fetchElderlyInfoById } from '@smart-elderly-care/api-client';
// 从共享的 types 包导入类型
import type { ElderlyInfo } from '@smart-elderly-care/types';
// 从共享的 ui 包导入UI组件
import { ElderlyInfoCard } from '@smart-elderly-care/ui';

function App() {
  const [elderlyData, setElderlyData] = useState<ElderlyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 组件加载时，调用API获取数据
    fetchElderlyInfoById('elderly-001').then(data => {
      setElderlyData(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <h1>智慧养老系统 - 员工端</h1>
      {loading ? (
        <p>正在加载老人信息...</p>
      ) : elderlyData ? (
        <ElderlyInfoCard elderly={elderlyData} />
      ) : (
        <p>未找到老人信息</p>
      )}
    </>
  );
}

export default App;