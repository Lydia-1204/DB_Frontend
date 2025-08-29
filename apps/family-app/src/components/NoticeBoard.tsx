import React, { useEffect, useState } from 'react';
import type { SystemAnnouncement, SystemAnnouncementComment } from '../types';
import { systemAnnouncementService } from '../services/systemAnnouncementService';

interface NoticeBoardProps {
  notices?: SystemAnnouncement[];
  loading?: boolean;
  familyId?: number;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ notices: externalNotices, loading: externalLoading, familyId }) => {
  const [innerNotices, setInnerNotices] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  const useExternal = Array.isArray(externalNotices);

  const fetchData = async () => {
    if (useExternal) return;
    setLoading(true); setError(null);
    try {
      const data = await systemAnnouncementService.list({ audience: '家属', status: '已发布' });
      setInnerNotices(data);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const notices = useExternal ? (externalNotices as SystemAnnouncement[]) : innerNotices;
  const finalLoading = useExternal ? !!externalLoading : loading;

  const handleCommentChange = (id: number, value: string) => setCommentInputs(p => ({ ...p, [id]: value }));

  const handleSubmit = async (n: SystemAnnouncement) => {
    const text = (commentInputs[n.id] || '').trim();
    if (!text) return;
    if (!familyId) { alert('缺少家属ID'); return; }
    setSubmitting(p => ({ ...p, [n.id]: true }));
    const ok = await systemAnnouncementService.addComment(n.id, { comment: text, commenterId: familyId, commenterType: '家属' });
    setSubmitting(p => ({ ...p, [n.id]: false }));
    if (!ok) { alert('评论失败'); return; }
    const newComment: SystemAnnouncementComment = { commenterId: familyId, commenterType: '家属', comment: text, commentTime: new Date().toISOString() };
    setInnerNotices(prev => prev.map(item => item.id === n.id ? { ...item, comments: [...(Array.isArray(item.comments) ? item.comments : []), newComment] } : item));
    setCommentInputs(p => ({ ...p, [n.id]: '' }));
    setExpandedComments(p => ({ ...p, [n.id]: true }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
      <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <span className="text-2xl mr-2">📢</span>公告查看
      </h3>
      {finalLoading && <div className="text-gray-500 mb-4">加载中...</div>}
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {!finalLoading && notices.length === 0 && !error && (
        <div className="text-center py-10 text-gray-500"><div className="text-4xl mb-2">📰</div>暂无公告</div>
      )}
      {!finalLoading && notices.length > 0 && (
        <div className="space-y-4">
          {notices.map(n => (
              <div key={n.id} className="border rounded-lg p-4 border-gray-200 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{new Date(n.publishDate).toLocaleString('zh-CN')}</span>
              </div>
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{n.content}</p>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <textarea
                    value={commentInputs[n.id] || ''}
                    onChange={e => handleCommentChange(n.id, e.target.value)}
                    placeholder="添加评论..."
                    className="flex-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-vertical"
                    rows={2}
                  />
                  {Array.isArray(n.comments) && n.comments.length > 0 && (
                    <button
                      onClick={() => setExpandedComments(p => ({ ...p, [n.id]: !p[n.id] }))}
                      className="h-8 px-3 text-xs rounded border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 whitespace-nowrap shadow-sm"
                    >
                      {expandedComments[n.id] ? '收起评论' : `查看评论 (${n.comments.length})`}
                    </button>
                  )}
                </div>
                {expandedComments[n.id] && Array.isArray(n.comments) && n.comments.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-2 space-y-2 max-h-48 overflow-y-auto">
                    {n.comments.map((c, idx) => (
                      <div key={idx} className="text-xs text-gray-700 flex items-start">
                        <span className="font-medium text-blue-600 mr-2">[{c.commenterType}]#{c.commenterId}</span>
                        <span className="flex-1 leading-snug">{c.comment}</span>
                        {c.commentTime && <span className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">{new Date(c.commentTime).toLocaleString('zh-CN', { hour12: false })}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    disabled={submitting[n.id] || !(commentInputs[n.id] || '').trim()}
                    onClick={() => handleSubmit(n)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${submitting[n.id] || !(commentInputs[n.id] || '').trim() ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'}`}
                  >
                    {submitting[n.id] ? '提交中...' : '提交评论'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
