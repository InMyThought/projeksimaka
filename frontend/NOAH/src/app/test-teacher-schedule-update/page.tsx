'use client';

import React from 'react';
import TeacherScheduleTab from '../components/TeacherScheduleTab';

const TestTeacherScheduleUpdate = () => {
  // Mock settings and setShowNotification for testing
  const mockSettings = {
    theme: 'light'
  };
  
  const mockSetShowNotification = (show: boolean) => {
    console.log('Show notification:', show);
    if (show) {
      alert('Schedule updated successfully!');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test Teacher Schedule Update</h1>
      <p className="mb-4">Edit a teacher's schedule and save it. The updated schedule should be displayed immediately after saving.</p>
      <TeacherScheduleTab 
        settings={mockSettings} 
        setShowNotification={mockSetShowNotification} 
      />
    </div>
  );
};

export default TestTeacherScheduleUpdate;