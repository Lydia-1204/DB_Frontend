import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ChangePasswordProps {
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  onCancel: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onChangePassword, onCancel }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('请填写所有密码字段');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少6位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onChangePassword(oldPassword, newPassword);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onCancel(); // 成功后关闭对话框
        }, 2000);
      } else {
        setError('修改密码失败，请检查原密码是否正确');
      }
    } catch (error) {
      console.error('修改密码错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return createPortal(
      <div 
        className="modal-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content bg-white p-8 rounded-xl shadow-2xl border-2 border-green-200 w-full max-w-md transform transition-all duration-300 scale-100">
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">密码修改成功！</h3>
            <p className="text-green-600">页面即将关闭...</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div 
      className="modal-overlay"
      onClick={(e) => {
        // 不允许点击遮罩层关闭弹窗，只能通过取消按钮关闭
        e.stopPropagation();
      }}
    >
      <div 
        className="modal-content bg-white p-8 rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-md transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h3 className="text-xl font-bold text-blue-800">修改密码</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="oldPassword" className="block text-base font-medium text-blue-700 mb-2">
              原密码：
            </label>
            <input 
              type="password" 
              id="oldPassword" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required 
              placeholder="请输入原密码"
              className="w-full px-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-base font-medium text-blue-700 mb-2">
              新密码：
            </label>
            <input 
              type="password" 
              id="newPassword" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
              placeholder="请输入新密码（至少6位）"
              className="w-full px-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-base font-medium text-blue-700 mb-2">
              确认新密码：
            </label>
            <input 
              type="password" 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              placeholder="请再次输入新密码"
              className="w-full px-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors border-2 border-blue-600 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
