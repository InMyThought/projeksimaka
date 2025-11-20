'use client';

import React, { useState, useEffect } from 'react';
import { getTeachers, updateTeacherSchedule } from '@/utils/api';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  photo: string;
  schedule: ScheduleItem[];
}

interface ScheduleItem {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  class: string;
  room: string;
}

const TestScheduleUpdate = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.teachers || []);
      if (response.teachers && response.teachers.length > 0) {
        setSelectedTeacher(response.teachers[0]);
        setSchedule(response.teachers[0].schedule || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!selectedTeacher) return;
    
    try {
      // Add a new schedule item
      const newScheduleItem = {
        id: Date.now(),
        day: 'Senin',
        startTime: '08:00',
        endTime: '09:00',
        class: 'X-IPA-1',
        room: 'Ruang 101'
      };
      
      const updatedSchedule = [...schedule, newScheduleItem];
      
      // Update through API
      const response = await updateTeacherSchedule(selectedTeacher.id, updatedSchedule);
      
      if (response.success) {
        // Refresh the data
        fetchTeachers();
        alert('Schedule updated successfully!');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Schedule Update</h1>
      
      {selectedTeacher && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold">Selected Teacher: {selectedTeacher.name}</h2>
          <p>Current Schedule Items: {schedule.length}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Current Schedule:</h3>
        {schedule.length > 0 ? (
          <ul className="border rounded-lg divide-y">
            {schedule.map((item, index) => (
              <li key={index} className="p-3 flex justify-between">
                <span>{item.day}: {item.class} ({item.startTime}-{item.endTime})</span>
                <span>{item.room}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No schedule items</p>
        )}
      </div>
      
      <button 
        onClick={handleUpdateSchedule}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add Schedule Item and Update
      </button>
      
      <button 
        onClick={fetchTeachers}
        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default TestScheduleUpdate;