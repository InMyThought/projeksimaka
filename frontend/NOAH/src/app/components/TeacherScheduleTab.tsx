'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Search, UserPlus, X, Settings } from 'lucide-react';
import { getTeachers, getTeacherSchedule, addTeacher, updateTeacherSchedule } from '@/utils/api';

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

const TeacherScheduleTab = ({ settings, setShowNotification }: { settings: any; setShowNotification: (show: boolean) => void }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    name: '',
    subject: ''
  });
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem[]>([]);

  // Fetch teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await getTeachers();
        setTeachers(response.teachers || []);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle teacher selection
  const handleSelectTeacher = async (teacher: Teacher) => {
    try {
      setSelectedTeacher(teacher);
      // Fetch detailed schedule if needed
      const response = await getTeacherSchedule(teacher.id);
      if (response.schedule) {
        setSelectedTeacher({
          ...teacher,
          schedule: response.schedule
        });
      }
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
    }
  };

  // Group schedule by day
  const groupScheduleByDay = (schedule: ScheduleItem[]) => {
    const grouped: Record<string, ScheduleItem[]> = {};
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    schedule.forEach(item => {
      if (!grouped[item.day]) {
        grouped[item.day] = [];
      }
      grouped[item.day].push(item);
    });

    // Sort schedule items by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Return in order of days
    return daysOrder
      .filter(day => grouped[day])
      .map(day => ({ day, items: grouped[day] }));
  };

  // Handle new teacher data change
  const handleNewTeacherDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeacherData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add teacher submission
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newTeacherData.name || !newTeacherData.subject) {
        alert('Nama guru dan mata pelajaran wajib diisi');
        return;
      }
      
      // Add teacher through API
      const response = await addTeacher(newTeacherData);
      
      if (response.success) {
        // Refresh teacher list
        const teachersResponse = await getTeachers();
        setTeachers(teachersResponse.teachers || []);
        
        // Close modal and reset form
        setIsAddTeacherModalOpen(false);
        setNewTeacherData({
          name: '',
          subject: ''
        });
        
        // Show success notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        alert('Gagal menambahkan guru: ' + response.error);
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Terjadi kesalahan saat menambahkan guru');
    }
  };

  // Open edit schedule modal
  const openEditScheduleModal = () => {
    if (selectedTeacher) {
      setEditingSchedule(selectedTeacher.schedule || []);
      setIsEditScheduleModalOpen(true);
    }
  };

  // Handle schedule item change
  const handleScheduleItemChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const updatedSchedule = [...editingSchedule];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value
    };
    setEditingSchedule(updatedSchedule);
  };

  // Add new schedule item
  const addScheduleItem = () => {
    const newItem: ScheduleItem = {
      id: Date.now(), // Temporary ID
      day: 'Senin',
      startTime: '07:00',
      endTime: '08:00',
      class: 'X-IPA-1',
      room: 'Ruang 101'
    };
    setEditingSchedule([...editingSchedule, newItem]);
  };

  // Remove schedule item
  const removeScheduleItem = (index: number) => {
    const updatedSchedule = [...editingSchedule];
    updatedSchedule.splice(index, 1);
    setEditingSchedule(updatedSchedule);
  };

  // Handle save schedule
  const handleSaveSchedule = async () => {
    if (!selectedTeacher) return;
    
    // Validate teacher ID
    if (!selectedTeacher.id || typeof selectedTeacher.id !== 'number' || selectedTeacher.id <= 0) {
      console.error('Invalid teacher ID:', selectedTeacher.id);
      alert('Terjadi kesalahan dengan data guru. Silakan coba memilih guru lain.');
      return;
    }
    
    try {
      // Update teacher schedule through API
      const response = await updateTeacherSchedule(selectedTeacher.id, editingSchedule);
      
      if (response.success) {
        // Refresh teacher list and selected teacher
        const teachersResponse = await getTeachers();
        setTeachers(teachersResponse.teachers || []);
        
        // Update selected teacher with new schedule
        if (response.teacher) {
          setSelectedTeacher(response.teacher);
        } else {
          // If the API doesn't return the updated teacher, find it in the refreshed list
          const updatedTeacher = teachersResponse.teachers?.find(
            (teacher: Teacher) => teacher.id === selectedTeacher.id
          );
          if (updatedTeacher) {
            setSelectedTeacher(updatedTeacher);
          }
        }
        
        // Close modal
        setIsEditScheduleModalOpen(false);
        
        // Show success notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        console.error('Failed to update schedule:', response.error);
        alert('Gagal memperbarui jadwal: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Terjadi kesalahan saat memperbarui jadwal: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Jadwal Guru</h3>
            <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Kelola dan lihat jadwal mengajar guru
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 ${
                settings.theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Tambah Guru
            </button>
            <div className="relative w-full md:w-64">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Cari guru atau mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-12 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Memuat data guru...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher List */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className={`font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Daftar Guru</h4>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {filteredTeachers.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTeachers.map(teacher => (
                    <li key={teacher.id}>
                      <button
                        onClick={() => handleSelectTeacher(teacher)}
                        className={`w-full text-left p-4 hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors ${
                          selectedTeacher?.id === teacher.id 
                            ? (settings.theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50') 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {teacher.photo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                              {teacher.name}
                            </p>
                            <p className={`text-sm truncate ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {teacher.subject}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <Users className={`w-12 h-12 mx-auto ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                  <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada guru yang ditemukan</p>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Schedule Detail */}
          <div className="lg:col-span-2">
            {selectedTeacher ? (
              <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedTeacher.photo}
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTeacher.name}
                        </h3>
                        <p className={`text-lg ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedTeacher.subject}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={openEditScheduleModal}
                      className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                        settings.theme === 'dark' 
                          ? 'bg-blue-700 text-white hover:bg-blue-800' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Edit Jadwal
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className={`text-xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Jadwal Mengajar</h4>
                  
                  {selectedTeacher.schedule && selectedTeacher.schedule.length > 0 ? (
                    <div className="space-y-6">
                      {groupScheduleByDay(selectedTeacher.schedule).map(({ day, items }) => (
                        <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          <div className={`px-4 py-3 font-bold ${settings.theme === 'dark' ? 'bg-gray-750 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {day}
                          </div>
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {items.map(item => (
                              <div key={item.id} className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                      {item.class}
                                    </p>
                                    <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {item.room}
                                    </p>
                                  </div>
                                  <div className={`text-right ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <p className="font-medium">{item.startTime} - {item.endTime}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`rounded-xl p-8 text-center ${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                      <Calendar className={`w-12 h-12 mx-auto ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                      <p className={`text-lg font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Tidak Ada Jadwal</p>
                      <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Guru ini belum memiliki jadwal mengajar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-12 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} text-center`}>
                <Users className={`w-16 h-16 mx-auto ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                <h3 className={`text-xl font-bold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Pilih Guru</h3>
                <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pilih seorang guru dari daftar untuk melihat jadwal mengajarnya
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-xl w-full max-w-md`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Tambah Guru Baru
                </h3>
                <button 
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className={`p-2 rounded-full ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddTeacher}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Guru *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newTeacherData.name}
                      onChange={handleNewTeacherDataChange}
                      className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-200 text-gray-900'
                      }`}
                      placeholder="Nama lengkap guru"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Mata Pelajaran *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={newTeacherData.subject}
                      onChange={handleNewTeacherDataChange}
                      className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-200 text-gray-900'
                      }`}
                      placeholder="Mata pelajaran yang diajarkan"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddTeacherModalOpen(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium ${
                      settings.theme === 'dark' 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium ${
                      settings.theme === 'dark' 
                        ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    Tambah Guru
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isEditScheduleModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Edit Jadwal: {selectedTeacher.name}
                </h3>
                <button 
                  onClick={() => setIsEditScheduleModalOpen(false)}
                  className={`p-2 rounded-full ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={addScheduleItem}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                    settings.theme === 'dark' 
                      ? 'bg-green-700 text-white hover:bg-green-800' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Tambah Jadwal
                </button>
              </div>
              
              <div className="space-y-4">
                {editingSchedule.map((item, index) => (
                  <div key={item.id} className={`p-4 rounded-xl ${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Hari
                        </label>
                        <select
                          value={item.day}
                          onChange={(e) => handleScheduleItemChange(index, 'day', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'border-gray-200 text-gray-900'
                          }`}
                        >
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Jumat">Jumat</option>
                          <option value="Sabtu">Sabtu</option>
                          <option value="Minggu">Minggu</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Waktu Mulai
                        </label>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleScheduleItemChange(index, 'startTime', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Waktu Selesai
                        </label>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleScheduleItemChange(index, 'endTime', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Kelas
                        </label>
                        <select
                          value={item.class}
                          onChange={(e) => handleScheduleItemChange(index, 'class', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'border-gray-200 text-gray-900'
                          }`}
                        >
                          <optgroup label="Kelas 10">
                            <option value="X-IPA-1">X-IPA-1</option>
                            <option value="X-IPA-2">X-IPA-2</option>
                            <option value="X-IPS-1">X-IPS-1</option>
                            <option value="X-IPS-2">X-IPS-2</option>
                          </optgroup>
                          <optgroup label="Kelas 11">
                            <option value="XI-IPA-1">XI-IPA-1</option>
                            <option value="XI-IPA-2">XI-IPA-2</option>
                            <option value="XI-IPS-1">XI-IPS-1</option>
                            <option value="XI-IPS-2">XI-IPS-2</option>
                          </optgroup>
                          <optgroup label="Kelas 12">
                            <option value="XII-IPA-1">XII-IPA-1</option>
                            <option value="XII-IPA-2">XII-IPA-2</option>
                            <option value="XII-IPS-1">XII-IPS-1</option>
                            <option value="XII-IPS-2">XII-IPS-2</option>
                          </optgroup>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Ruang
                        </label>
                        <input
                          type="text"
                          value={item.room}
                          onChange={(e) => handleScheduleItemChange(index, 'room', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'border-gray-200 text-gray-900'
                          }`}
                          placeholder="Ruang kelas"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeScheduleItem(index)}
                          className={`px-3 py-2 rounded-lg font-medium ${
                            settings.theme === 'dark' 
                              ? 'bg-red-700 text-white hover:bg-red-800' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {editingSchedule.length === 0 && (
                  <div className={`p-8 rounded-xl text-center ${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <Calendar className={`w-12 h-12 mx-auto ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                    <p className={`text-lg font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Belum Ada Jadwal</p>
                    <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Klik "Tambah Jadwal" untuk menambahkan jadwal mengajar
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditScheduleModalOpen(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium ${
                    settings.theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium ${
                    settings.theme === 'dark' 
                      ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  Simpan Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherScheduleTab;