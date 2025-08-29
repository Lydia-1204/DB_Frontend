import React from 'react';
import type { HealthAssessment } from '../types';

interface HealthAssessmentProps {
  assessments: HealthAssessment[];
  loading?: boolean;
  error?: string | null;
}

export const HealthAssessmentComponent: React.FC<HealthAssessmentProps> = ({ 
  assessments, 
  loading = false, 
  error = null 
}) => {
  // 调试输出
  console.debug('HealthAssessmentComponent received:', {
    assessmentsCount: assessments.length,
    loading,
    error,
    assessments
  });

  const latestAssessment = assessments[0];
  const recentAssessments = assessments.slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '优秀':
        return 'text-green-600 bg-green-50 border-green-200';
      case '良好':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case '一般':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '较差':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 9) return '优秀';
    if (score >= 8) return '良好';
    if (score >= 6) return '一般';
    return '较差';
  };

  return (
  <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100 text-[16px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-blue-800 flex items-center">
          <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full border-2 border-blue-200">♥️</span>
          健康评估
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-blue-600">正在加载健康评估数据...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 border-2 border-red-100 rounded-lg bg-red-50">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-red-600">加载健康评估数据失败</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      ) : !latestAssessment ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-blue-600">暂无健康评估数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 最新评估数据 */}
          <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-blue-800 text-lg md:text-xl">最新健康评估</h4>
              <span className={`text-sm md:text-base font-medium px-2 py-0.5 rounded-full border-2 ${getGradeColor(latestAssessment.healthGrade)}`}>
                {latestAssessment.healthGrade}
              </span>
            </div>
            {/* 3列网格：第一行名称+图标；第二行分数；第三行等级。共享一个外框，列之间使用分隔线 */}
            <div className="bg-white rounded-md overflow-hidden border border-blue-200">
              <div className="grid grid-cols-3 divide-x divide-blue-200 border-b border-blue-200 text-center py-2">
                <div className="flex flex-col items-center justify-center text-lg md:text-xl text-blue-700 leading-tight py-1">
                  <span className="text-lg md:text-2xl mb-0.5">💪</span>
                  <span className="text-lg md:text-xl font-medium">身体功能</span>
                </div>
                <div className="flex flex-col items-center justify-center text-lg md:text-xl text-blue-700 leading-tight py-1">
                  <span className="text-lg md:text-2xl mb-0.5">😊</span>
                  <span className="text-lg md:text-xl font-medium">心理功能</span>
                </div>
                <div className="flex flex-col items-center justify-center text-lg md:text-xl text-blue-700 leading-tight py-1">
                  <span className="text-lg md:text-2xl mb-0.5">🧠</span>
                  <span className="text-lg md:text-xl font-medium">认知功能</span>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-blue-200 border-b border-blue-200 text-center">
                <div className={`py-2 text-xl md:text-2xl font-semibold ${getScoreColor(latestAssessment.physicalHealthFunction)}`}>{latestAssessment.physicalHealthFunction}/10</div>
                <div className={`py-2 text-xl md:text-2xl font-semibold ${getScoreColor(latestAssessment.psychologicalFunction)}`}>{latestAssessment.psychologicalFunction}/10</div>
                <div className={`py-2 text-xl md:text-2xl font-semibold ${getScoreColor(latestAssessment.cognitiveFunction)}`}>{latestAssessment.cognitiveFunction}/10</div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-blue-200 text-center text-sm md:text-base text-blue-500 leading-tight">
                <div className="py-1">{getScoreLevel(latestAssessment.physicalHealthFunction)}</div>
                <div className="py-1">{getScoreLevel(latestAssessment.psychologicalFunction)}</div>
                <div className="py-1">{getScoreLevel(latestAssessment.cognitiveFunction)}</div>
              </div>
            </div>
            <p className="text-sm md:text-base text-blue-600 mt-2 text-center bg-white px-2 py-1 rounded border border-blue-200 leading-snug">
              评估时间: {new Date(latestAssessment.assessmentDate).toLocaleString()}
            </p>
          </div>

          {/* 评估历史 */}
          <div className="border-2 border-blue-100 rounded-lg p-5 bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-3 text-lg md:text-xl">评估历史记录</h4>
            <div className="space-y-3">
              {recentAssessments.map((assessment) => (
                <div key={assessment.assessmentId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200">
                  <div>
                    <p className="text-lg font-medium text-blue-800">
                      {new Date(assessment.assessmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-base text-blue-500">
                      评估ID: {assessment.assessmentId}
                    </p>
                  </div>
                  <div className="flex space-x-3 text-lg">
                    <span className={`px-3 py-1 rounded border ${getScoreColor(assessment.physicalHealthFunction)}`}>
                      💪 {assessment.physicalHealthFunction}
                    </span>
                    <span className={`px-3 py-1 rounded border ${getScoreColor(assessment.psychologicalFunction)}`}>
                      😊 {assessment.psychologicalFunction}
                    </span>
                    <span className={`px-3 py-1 rounded border ${getScoreColor(assessment.cognitiveFunction)}`}>
                      🧠 {assessment.cognitiveFunction}
                    </span>
                    <span className={`px-3 py-1 rounded border font-medium ${getGradeColor(assessment.healthGrade)}`}>
                      {assessment.healthGrade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 评估说明 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2 text-lg md:text-xl">📋 评估说明</h5>
            <div className="text-lg md:text-lg text-gray-600 space-y-1 leading-relaxed">
              <p>• <strong>身体功能:</strong> 评估日常生活活动能力、运动能力等</p>
              <p>• <strong>心理功能:</strong> 评估情绪状态、社交能力、生活满意度等</p>
              <p>• <strong>认知功能:</strong> 评估记忆力、注意力、思维能力等</p>
              <p>• <strong>评分标准:</strong> 1-3分(较差)，4-6分(一般)，7-8分(良好)，9-10分(优秀)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
