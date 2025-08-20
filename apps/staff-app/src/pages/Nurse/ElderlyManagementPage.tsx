import React, { useState } from 'react';
import type { ElderlyProfile } from '@smart-elderly-care/types'; // 导入我们刚定义的类型

export function ElderlyManagementPage() {
  const [searchId, setSearchId] = useState('');
  const [elderlyProfile, setElderlyProfile] = useState<ElderlyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) {
      setError('请输入老人ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setElderlyProfile(null);

    try {
      // API 路径: /api/ElderlyRecord/[elderlyId]
      // 这个请求会被 Vite 代理到 7000 端口
      const response = await fetch(`/api/ElderlyRecord/${searchId}`);
      
      if (response.status === 404) {
        throw new Error(`未找到ID为 ${searchId} 的老人档案。`);
      }
      if (!response.ok) {
        throw new Error('搜索失败，请稍后重试。');
      }

      const data: ElderlyProfile = await response.json();
      setElderlyProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>老人档案查询</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="输入老人ID进行搜索"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '8px' }}>
          {isLoading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>错误: {error}</p>}
      
      {/* 结果展示区 */}
      {elderlyProfile && (
        <div style={{ marginTop: '20px' }}>
          <h2>{elderlyProfile.elderlyInfo.name} 的档案</h2>
          
          {/* 这里可以把不同信息封装成独立的组件来复用 */}
          <section>
            <h3>基本信息</h3>
            <p>ID: {elderlyProfile.elderlyInfo.elderlyId}</p>
            <p>性别: {elderlyProfile.elderlyInfo.gender}</p>
            <p>出生日期: {elderlyProfile.elderlyInfo.birthDate}</p>
          </section>

          <section>
            <h3>家属信息 ({elderlyProfile.familyInfos.length})</h3>
            {/* 这里可以 map familyInfos 来展示 */}
          </section>

          <section>
            <h3>健康监测记录 ({elderlyProfile.healthMonitorings.length})</h3>
             {/* 这里可以 map healthMonitorings 来展示 */}
          </section>

          {/* ... 其他信息模块 ... */}
        </div>
      )}
    </div>
  );
}