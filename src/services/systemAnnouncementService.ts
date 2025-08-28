import type { SystemAnnouncement, SystemAnnouncementComment } from '../types';

const BASE = '/api/SystemAnnouncement';

export const systemAnnouncementService = {
  async list(params: { audience?: string; status?: string } = { audience: '家属', status: '已发布' }): Promise<SystemAnnouncement[]> {
    const query = new URLSearchParams();
    if (params.audience) query.set('audience', params.audience);
    if (params.status) query.set('status', params.status);
    const url = `${BASE}${query.size ? `?${query.toString()}` : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`获取公告失败: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      // 规范化 comments 字段，避免后端返回字符串/对象导致前端 map 报错
      return data.map((item: any) => {
        // 兼容不同字段命名（后端示例：announcement_id, announcement_date, announcement_content, announcement_type, created_by）
        if (item.announcement_id != null) {
          item.id = item.announcement_id;
        }
        if (item.announcement_date && !item.publishDate) {
          item.publishDate = item.announcement_date;
        }
        if (item.announcement_content && !item.content) {
          item.content = item.announcement_content;
        }
        if (item.announcement_type && !item.title) {
          item.title = item.announcement_type; // 若只是“通知”之类，前端可只显示内容
        }
        if (item.created_by && !item.publisher) {
          item.publisher = String(item.created_by);
        }
        let commentsRaw = item.comments;
        if (typeof commentsRaw === 'string') {
          const txt = commentsRaw.trim();
          // 尝试 JSON
          if (txt.startsWith('[') || txt.startsWith('{')) {
            try {
              const parsed = JSON.parse(txt);
              commentsRaw = parsed;
            } catch {
              // 继续按自定义日志格式解析
            }
          }
          if (typeof commentsRaw === 'string') {
            // 自定义日志行格式: [YYYY-MM-DD HH:MM:SS] [家属ID:101] 文本
            const lines = commentsRaw.split(/\n+/).map(l => l.trim()).filter(Boolean);
            const lineRegex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})]\s*\[(家属|员工|老人)ID:(\d+)\]\s*(.+)$/;
            const structured: any[] = [];
            for (const line of lines) {
              const m = line.match(lineRegex);
              if (m) {
                const [, timeStr, role, idStr, text] = m;
                const iso = new Date(timeStr.replace(' ', 'T')).toISOString();
                structured.push({ commenterType: role, commenterId: parseInt(idStr, 10), comment: text, commentTime: iso });
              } else if (line) {
                structured.push({ commenterType: '系统', commenterId: 0, comment: line });
              }
            }
            commentsRaw = structured;
          }
        }
        if (commentsRaw && !Array.isArray(commentsRaw)) {
          // 可能是单个对象
            commentsRaw = [commentsRaw];
        }
        if (!Array.isArray(commentsRaw)) commentsRaw = [];
        return { ...item, comments: commentsRaw } as SystemAnnouncement;
      });
    } catch (e) {
      console.error('[SystemAnnouncement][list] error', e);
      return [];
    }
  },
  async addComment(id: number, payload: { comment: string; commenterId: number; commenterType: string }): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`添加评论失败: ${res.status} ${text}`);
      }
      return true;
    } catch (e) {
      console.error('[SystemAnnouncement][addComment] error', e);
      return false;
    }
  }
};

export type { SystemAnnouncement, SystemAnnouncementComment };