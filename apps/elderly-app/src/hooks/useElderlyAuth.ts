import { useState, useEffect } from 'react';

// 在开发模式下使用相对路径，以便 Vite dev server 的 proxy 可以拦截请求并绕过浏览器 CORS 限制。
// 在生产环境中使用真实的后端地址。
const API_BASE_URL = import.meta.env.DEV ? '' : 'http://47.96.238.102:7000';

interface ElderlyUser {
  elderlyId: number; // 使用 elderlyId，类型为整数
  name: string;
  gender: string;
  birthDate: string; // ISO 字符串
  idCardNumber: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
  familyInfos?: Array<{
    familyId: number;
    elderlyId: number;
    name: string;
    relationship: string;
    contactPhone: string;
    contactEmail?: string;
    address?: string;
    isPrimaryContact: string;
  }>;
}

export const useElderlyAuth = () => {
  const [user, setUser] = useState<ElderlyUser | null>(null);
  const [loading, setLoading] = useState(false); // 不做持久化恢复，直接非 loading
  useEffect(() => { setLoading(false); }, []);

  // 真实登录
  const login = async (elderlyId: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Account/elderly/login?elderlyId=${encodeURIComponent(elderlyId)}&password=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // 兼容后端返回纯文本（如 "登录成功"）或 JSON 的情况，避免直接调用 response.json() 导致解析错误
        const contentType = response.headers.get('content-type') || '';
        let data: any = null;

        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (err) {
            console.warn('响应 Content-Type 为 JSON，但解析失败：', err);
            data = null;
          }
        } else {
          // 尝试以文本方式读取，再尝试解析为 JSON（如果可能）；否则按登录成功处理
          const text = await response.text();
          console.debug('login response text:', text);
          try {
            data = JSON.parse(text);
          } catch (_err) {
            data = null;
          }
        }

        // 如果API返回用户信息，使用返回的信息
        // 初步用户对象（可能只是占位）
        let nextUser: ElderlyUser = {
          elderlyId: parseInt(elderlyId),
          name: '用户',
          gender: '',
          birthDate: '',
          idCardNumber: '',
          contactPhone: '',
          address: '',
          emergencyContact: ''
        };
        if (data && data.user) {
          // 若后端直接给出 user 对象
            nextUser = {
              elderlyId: parseInt(data.user.elderlyId ?? elderlyId),
              name: data.user.name ?? data.user.elderlyName ?? nextUser.name,
              gender: data.user.gender ?? data.user.sex ?? nextUser.gender,
              birthDate: data.user.birthDate ?? data.user.birthday ?? nextUser.birthDate,
              idCardNumber: data.user.idCardNumber ?? data.user.idNumber ?? nextUser.idCardNumber,
              contactPhone: data.user.contactPhone ?? data.user.phone ?? nextUser.contactPhone,
              address: data.user.address ?? data.user.homeAddress ?? nextUser.address,
              emergencyContact: data.user.emergencyContact ?? data.user.emergencyPerson ?? nextUser.emergencyContact
            };
        }

        // 追加：获取完整档案 /api/ElderlyRecord/{elderlyId}
        try {
          const recordRes = await fetch(`${API_BASE_URL}/api/ElderlyRecord/${encodeURIComponent(elderlyId)}`);
          if (recordRes.ok) {
            const ct = recordRes.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              try {
                const record = await recordRes.json();
                if (record && typeof record === 'object') {
                  // 兼容包裹结构 { elderlyInfo: {...}, familyInfos: [...], ... }
                  const info: any = (record as any).elderlyInfo ? (record as any).elderlyInfo : record;
                  const familyInfos: any[] = (record as any).familyInfos || [];
                  
                  const normalize = (v: any): ElderlyUser => ({
                    elderlyId: parseInt(v.elderlyId ?? v.id ?? elderlyId),
                    name: v.name ?? v.elderlyName ?? nextUser.name,
                    gender: v.gender ?? v.sex ?? nextUser.gender,
                    birthDate: v.birthDate ?? v.birthday ?? nextUser.birthDate,
                    idCardNumber: v.idCardNumber ?? v.idNumber ?? nextUser.idCardNumber,
                    contactPhone: v.contactPhone ?? v.phone ?? nextUser.contactPhone,
                    address: v.address ?? v.homeAddress ?? nextUser.address,
                    emergencyContact: v.emergencyContact ?? v.emergencyPerson ?? nextUser.emergencyContact,
                    familyInfos: familyInfos.map((f: any) => ({
                      familyId: f.familyId ?? f.id,
                      elderlyId: f.elderlyId ?? parseInt(elderlyId),
                      name: f.name ?? f.familyName,
                      relationship: f.relationship ?? f.relation,
                      contactPhone: f.contactPhone ?? f.phone,
                      contactEmail: f.contactEmail ?? f.email,
                      address: f.address ?? f.homeAddress,
                      isPrimaryContact: f.isPrimaryContact ?? f.primary ?? 'N'
                    }))
                  });
                  nextUser = normalize(info);
                }
              } catch (parseErr) {
                console.warn('老人档案 JSON 解析失败', parseErr);
              }
            } else {
              const text = await recordRes.text();
              console.warn('老人档案返回非 JSON 内容（可能是错误页/HTML），前 120 字符:', text.slice(0, 120));
            }
          } else {
            console.warn('获取老人档案失败', recordRes.status, recordRes.statusText);
          }
        } catch (e) {
          console.warn('获取老人档案请求异常', e);
        }

        setUser(nextUser); // 仅内存保存（无持久化）
        return true;
      } else {
        console.error('登录失败:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      return false;
    }
  };

  // 修改密码
  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) {
      console.error('用户未登录');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/Account/elderly/change-password?elderlyId=${user.elderlyId}&oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else {
        console.error('修改密码失败:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('修改密码请求失败:', error);
      return false;
    }
  };

  // 更新本地用户信息（仅在当前会话中有效）
  const updateLocalUser = (patch: Partial<ElderlyUser>) => {
    setUser(prev => ({ ...(prev as ElderlyUser), ...patch } as ElderlyUser));
  };

  const logout = () => { setUser(null); };

  return { user, loading, login, logout, updateLocalUser, changePassword };
};
