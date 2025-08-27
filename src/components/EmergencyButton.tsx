import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EmergencyButtonProps {
  onEmergencyCall?: (type: string) => void | Promise<void>;
  inline?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onEmergencyCall, inline = false }) => {
  const [showOptions, setShowOptions] = useState(false);
  // 自定义求助已移除
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [portalPos, setPortalPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const emergencyTypes = [
    { type: '跌倒', icon: '🤕', color: 'bg-red-600' },
    { type: '胸痛', icon: '💔', color: 'bg-red-600' },
    { type: '呼吸困难', icon: '😵', color: 'bg-red-600' },
    { type: '其他紧急情况', icon: '🚨', color: 'bg-orange-600' }
  ];

  const handleQuickCall = (type: string) => {
  onEmergencyCall?.(type);
    setShowOptions(false);
  };

  // 计算并更新下拉面板的位置（相对于视口，放到 body 上）
  useEffect(() => {
    if (!showOptions) return;
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPortalPos({ left: rect.left, top: rect.bottom, width: rect.width });
      }
    };
    update();
    window.addEventListener('resize', update);
    // use capture to catch scrolls on any ancestor
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showOptions]);

  // 已移除自定义求助

  return (
  <div ref={containerRef} className={inline ? 'relative inline-block' : 'fixed top-6 right-6 z-50'} style={inline ? undefined : { position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
      {/* 主要紧急按钮 */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-20 h-20 bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-3xl animate-pulse"
        aria-label="紧急呼叫"
      >
        🆘
      </button>

      {/* 紧急呼叫选项 - 使用 portal 渲染到 body，以覆盖其它内容 */}
      {showOptions && portalPos && createPortal(
        <div
          style={{ position: 'fixed', left: portalPos.left, top: portalPos.top, width: Math.max(220, portalPos.width), zIndex: 99999 }}
          className="emergency-portal-panel space-y-2 p-1"
          role="menu"
        >
          {emergencyTypes.map((emergency) => (
            <button
              key={emergency.type}
              onClick={() => handleQuickCall(emergency.type)}
              className={`flex items-center justify-between w-full px-4 py-3 ${emergency.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-white hover:scale-105`}
            >
              <span className="flex items-center">
                <span className="text-xl mr-2 bg-white bg-opacity-20 p-1 rounded-full">{emergency.icon}</span>
                <span className="font-medium">{emergency.type}</span>
              </span>
            </button>
          ))}

      {/* 自定义求助按钮已移除 */}
        </div>,
        document.body
      )}

    {/* 自定义求助弹窗已移除 */}
    </div>
  );
};
