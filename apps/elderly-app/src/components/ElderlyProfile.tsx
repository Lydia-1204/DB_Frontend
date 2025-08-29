import React, { useState } from 'react';

// 接收来自父组件(App)的已登录用户与更新函数，避免再次调用 useElderlyAuth 导致独立状态实例被初始化为 null
interface FamilyInfo {
  familyId: number;
  elderlyId: number;
  name: string;
  relationship: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  isPrimaryContact: string;
}

interface ElderlyProfileUser {
  elderlyId: number;
  name: string;
  gender: string;
  birthDate: string;
  idCardNumber: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
  familyInfos?: FamilyInfo[]; // 添加家庭信息
}

interface ElderlyProfileProps {
  user: ElderlyProfileUser | null; // App 会在确保 user 存在时再渲染该组件
  updateLocalUser: (patch: Partial<ElderlyProfileUser>) => void;
}

interface PreferenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  preference: {
    key: string;
    label: string;
    value: string;
  };
  onSave: (key: string, value: string) => void;
}

const PreferenceEditModal: React.FC<PreferenceEditModalProps> = ({ isOpen, onClose, preference, onSave }) => {
  const [value, setValue] = useState(preference.value);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(preference.key, value);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 animate-fade-in-up">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">编辑 {preference.label}</h3>
        <div className="flex items-center space-x-3 mb-2">
          <label className="text-sm font-medium text-gray-700 mr-3 shrink-0">{preference.label}:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            style={{ marginLeft: '20px' }}
            type="button"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            style={{ marginLeft: '10px' }}
            type="button"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const ElderlyProfile: React.FC<ElderlyProfileProps> = ({ user, updateLocalUser }) => {
  const [editingPreference, setEditingPreference] = useState<{ key: string; label: string; value: string } | null>(null);

  // 局部样式：覆盖全局 button 的默认样式，确保编辑按钮为小尺寸 inline-flex
  React.useEffect(() => {
    const id = 'ep-local-button-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      .ep-edit-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0.35rem 0.75rem !important;
        font-size: 1rem !important; /* 同步为 text-base */
        border-radius: 8px !important;
        border-width: 1px !important;
        min-width: auto !important;
        width: auto !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // 调试：注入一个强制性的样式片段，帮助检测是否有外部样式覆盖
  // 注意：此 useEffect 必须在组件的 Hook 顺序顶端位置，避免在某些渲染路径下未被调用从而破坏 Hooks 顺序。
  React.useEffect(() => {
    const id = 'debug-profile-grid-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      .profile-basic-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 1rem !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // 兜底：理论上 App 在 user 存在时才会渲染；这里加上防御性渲染
  if (!user) return null;

  // 计算年龄
  const calcAge = (birthDate?: string) => {
    if (!birthDate) return '';
    const b = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return String(age);
  };

  // 获取主要联系人信息
  const primaryContact = user.familyInfos?.find(f => f.isPrimaryContact === 'Y');

  const preferences = [
    { key: 'contactPhone', label: '联系电话', value: user.contactPhone },
    { key: 'address', label: '地址', value: user.address },
    { key: 'emergencyContact', label: '紧急联系人', value: user.emergencyContact }
  ];

  const handleEditPreference = (preference: { key: string; label: string; value: string }) => {
    setEditingPreference(preference);
  };

  const handleSavePreference = (key: string, value: string) => {
    if (!user) return;
    const elderlyId = user.elderlyId;
    const propertyMap: Record<string, string> = {
      contactPhone: 'ContactPhone',
      address: 'Address',
      emergencyContact: 'EmergencyContact'
    };
    const propertyName = propertyMap[key] || key;

    // 发起 PATCH 请求
    fetch(`/api/ElderlyInfo/${elderlyId}?propertyName=${encodeURIComponent(propertyName)}&value=${encodeURIComponent(value)}`, {
      method: 'PATCH'
    }).then(res => {
      if (res.ok) {
        // 更新本地状态
        const patch: any = {};
        patch[key] = value;
        updateLocalUser(patch);
        alert('保存成功');
      } else {
        alert('保存失败，请重试');
      }
    }).catch(err => {
      console.error('保存偏好设置失败', err);
      alert('网络错误，保存失败');
    });
  };


  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-white min-h-screen animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">个人资料</h1>
        
        {/* 基本信息卡片 */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6 mb-6 animate-slide-in-right">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">基本信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 profile-basic-grid">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">姓名:</span>
              <span className="text-gray-800 text-lg truncate">{user.name}</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">年龄:</span>
              <span className="text-gray-800 text-lg">{calcAge(user.birthDate)}岁</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">性别:</span>
              <span className="text-gray-800 text-lg">{user.gender}</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">老人ID:</span>
              <span className="text-gray-800 text-lg font-mono">{user.elderlyId}</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">身份证号:</span>
              <span className="text-gray-800 text-lg font-mono truncate">{user.idCardNumber}</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium text-base">状态:</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-lg font-medium bg-green-100 text-green-800">正常</span>
            </div>

            {/* 主要联系人信息 */}
            {primaryContact && (
              <>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 font-medium text-base">家庭ID:</span>
                  <span className="text-gray-800 text-lg font-mono">{primaryContact.familyId}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 font-medium text-base">家人姓名:</span>
                  <span className="text-gray-800 text-lg truncate">{primaryContact.name}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 font-medium text-base">关系:</span>
                  <span className="text-gray-800 text-lg">{primaryContact.relationship}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 个人偏好设置卡片（紧凑布局） */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6 animate-slide-in-right">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 border-b border-blue-100 pb-2">个人偏好设置</h2>
          {/* 三等列布局（固定 3 列，电话/地址/紧急联系人 同一行） */}
          <div className="grid grid-cols-3 gap-4">
            {preferences.map((preference) => (
              <div
                key={preference.key}
                className="flex items-center px-4 py-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm shadow-sm h-full overflow-hidden"
              >
                <span className="text-gray-600 font-medium text-base shrink-0 mr-1">{preference.label}:</span>
                <span
                  className="text-gray-800 flex-1 truncate text-lg"
                  title={preference.value}
                >
                  {preference.value}
                </span>
                <button
                  onClick={() => handleEditPreference(preference)}
                  className="ep-edit-btn ml-auto inline-flex items-center justify-center rounded-md border border-blue-400 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors text-base font-medium flex-shrink-0"
                  type="button"
                >
                  编辑
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 编辑偏好设置模态框 */}
        <PreferenceEditModal
          isOpen={!!editingPreference}
          onClose={() => setEditingPreference(null)}
          preference={editingPreference || { key: '', label: '', value: '' }}
          onSave={handleSavePreference}
        />
      </div>
    </div>
  );
};

export default ElderlyProfile;
