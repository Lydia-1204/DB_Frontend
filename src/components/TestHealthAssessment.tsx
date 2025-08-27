import React from 'react';
import { HealthAssessmentComponent } from './HealthAssessment';
import type { HealthAssessment } from '../types';

// 模拟数据用于测试
const mockHealthAssessments: HealthAssessment[] = [
  {
    assessmentId: 46,
    elderlyId: 89,
    assessmentDate: "2025-07-20T09:00:00",
    physicalHealthFunction: 8,
    psychologicalFunction: 7,
    cognitiveFunction: 9,
    healthGrade: "良好"
  },
  {
    assessmentId: 45,
    elderlyId: 89,
    assessmentDate: "2025-06-15T10:30:00",
    physicalHealthFunction: 7,
    psychologicalFunction: 8,
    cognitiveFunction: 8,
    healthGrade: "良好"
  },
  {
    assessmentId: 44,
    elderlyId: 89,
    assessmentDate: "2025-05-10T14:00:00",
    physicalHealthFunction: 6,
    psychologicalFunction: 6,
    cognitiveFunction: 7,
    healthGrade: "一般"
  }
];

export const TestHealthAssessment: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">健康评估组件测试</h1>
      <HealthAssessmentComponent assessments={mockHealthAssessments} />
    </div>
  );
};
