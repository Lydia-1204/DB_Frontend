import { useState, useEffect } from 'react';

// 统一使用相对路径，由前端所在域的 Nginx 反向代理到对应后端服务；
// 避免跨端口导致的 CORS 问题，不再在生产写死 http://47.96.238.102:7000。
// 若后端网关前缀未来发生变化，只需全局替换此常量。
const API_BASE_URL = '';

interface ElderlyUser {
  elderlyId: number; // 依然保留 elderlyId 供系统其他模块使用（通过登录返回推断）
  familyId?: number; // 新增：家属 ID
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
  // 家属登录：传入 familyId，后端应返回与其关联的老人信息（含 elderlyId）
  const login = async (familyId: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Account/family/login?familyId=${encodeURIComponent(familyId)}&password=${encodeURIComponent(password)}`, {
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
        let inferredElderlyId: number | null = null;

        // 如果返回数据里包含 elderlyId，则直接使用；否则暂存为 0，后续通过档案再补全
        if (data) {
          const possibleElderlyId = data.elderlyId ?? data.user?.elderlyId ?? data.user?.id;
          if (possibleElderlyId != null) {
            inferredElderlyId = parseInt(possibleElderlyId);
          }
        }

        let nextUser: ElderlyUser = {
          elderlyId: inferredElderlyId ?? 0,
          familyId: parseInt(familyId),
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
              elderlyId: parseInt(data.user.elderlyId ?? data.user.id ?? inferredElderlyId ?? '0'),
              familyId: parseInt(data.user.familyId ?? familyId),
              name: data.user.name ?? data.user.elderlyName ?? nextUser.name,
              gender: data.user.gender ?? data.user.sex ?? nextUser.gender,
              birthDate: data.user.birthDate ?? data.user.birthday ?? nextUser.birthDate,
              idCardNumber: data.user.idCardNumber ?? data.user.idNumber ?? nextUser.idCardNumber,
              contactPhone: data.user.contactPhone ?? data.user.phone ?? nextUser.contactPhone,
              address: data.user.address ?? data.user.homeAddress ?? nextUser.address,
              emergencyContact: data.user.emergencyContact ?? data.user.emergencyPerson ?? nextUser.emergencyContact
            };
        }

        // 补充：使用提供的家属 -> 老人 ID API 取得权威 elderlyId
        try {
          const elderlyIdRes = await fetch(`${API_BASE_URL}/api/Family/${encodeURIComponent(familyId)}/elderlyId`);
          if (elderlyIdRes.ok) {
            const ct2 = elderlyIdRes.headers.get('content-type') || '';
            let elderlyIdValue: any = null;
            if (ct2.includes('application/json')) {
              try {
                elderlyIdValue = await elderlyIdRes.json();
              } catch (e) {
                console.warn('elderlyId JSON 解析失败', e);
              }
            } else {
              const text = await elderlyIdRes.text();
              // 可能直接返回数字字符串
              elderlyIdValue = text;
            }
            // 从多种可能结构中提取数值
            const extractNumber = (v: any): number | null => {
              if (v == null) return null;
              if (typeof v === 'number') return Number.isFinite(v) ? v : null;
              if (typeof v === 'string') {
                // 只接受纯数字（避免 HTML 片段里粘出的巨大数字）
                const trimmed = v.trim();
                if (/^\d{1,10}$/.test(trimmed)) {
                  const num = parseInt(trimmed, 10);
                  return Number.isFinite(num) ? num : null;
                }
                return null;
              }
              if (typeof v === 'object') {
                for (const key of ['elderlyId', 'id', 'data']) {
                  if (v[key] != null) {
                    const inner = extractNumber(v[key]);
                    if (inner != null) return inner;
                  }
                }
              }
              return null;
            };
            const fetchedElderlyId = extractNumber(elderlyIdValue);
            if (fetchedElderlyId && fetchedElderlyId !== nextUser.elderlyId) {
              console.debug('使用 /api/Family/{familyId}/elderlyId 返回覆盖 elderlyId:', fetchedElderlyId);
              nextUser.elderlyId = fetchedElderlyId;
            }
          } else {
            console.warn('获取 elderlyId 接口非 200:', elderlyIdRes.status, elderlyIdRes.statusText);
          }
        } catch (elderlyIdErr) {
          console.warn('调用 /api/Family/{familyId}/elderlyId 失败:', elderlyIdErr);
        }

        // 如果已最终确定 elderlyId，则获取完整档案 /api/ElderlyRecord/{elderlyId}
        try {
          if (nextUser.elderlyId) {
            const recordRes = await fetch(`${API_BASE_URL}/api/ElderlyRecord/${encodeURIComponent(String(nextUser.elderlyId))}`);
            if (recordRes.ok) {
              const ct = recordRes.headers.get('content-type') || '';
              if (ct.includes('application/json')) {
                try {
                  const record = await recordRes.json();
                  if (record && typeof record === 'object') {
                    const info: any = (record as any).elderlyInfo ? (record as any).elderlyInfo : record;
                    const familyInfos: any[] = (record as any).familyInfos || [];
                    const normalize = (v: any): ElderlyUser => ({
                      elderlyId: parseInt(v.elderlyId ?? v.id ?? nextUser.elderlyId),
                      familyId: nextUser.familyId,
                      name: v.name ?? v.elderlyName ?? nextUser.name,
                      gender: v.gender ?? v.sex ?? nextUser.gender,
                      birthDate: v.birthDate ?? v.birthday ?? nextUser.birthDate,
                      idCardNumber: v.idCardNumber ?? v.idNumber ?? nextUser.idCardNumber,
                      contactPhone: v.contactPhone ?? v.phone ?? nextUser.contactPhone,
                      address: v.address ?? v.homeAddress ?? nextUser.address,
                      emergencyContact: v.emergencyContact ?? v.emergencyPerson ?? nextUser.emergencyContact,
                      familyInfos: familyInfos.map((f: any) => ({
                        familyId: f.familyId ?? f.id,
                        elderlyId: f.elderlyId ?? parseInt(String(nextUser.elderlyId)),
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
      const idParam = user.familyId ? `familyId=${user.familyId}` : `elderlyId=${user.elderlyId}`;
      const response = await fetch(`${API_BASE_URL}/api/Account/family/change-password?${idParam}&oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`, {
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
