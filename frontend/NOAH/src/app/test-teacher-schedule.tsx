'use client';

import React from 'react';
import TeacherScheduleTab from './components/TeacherScheduleTab';

const TestTeacherSchedule = () => {
  // Mock settings and setShowNotification for testing
  const mockSettings = {
    theme: 'light'
  };
  
  const mockSetShowNotification = (show: boolean) => {
    console.log('Show notification:', show);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test Teacher Schedule Component</h1>
      <TeacherScheduleTab 
        settings={mockSettings} 
        setShowNotification={mockSetShowNotification} 
      />
    </div>
  );
};

export default TestTeacherSchedule;