'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Shield, Heart, Award, User, MapPin, Phone, Mail, Save, UserCheck, Plus } from 'lucide-react';
import { getStudentById, updateAttendance } from '@/utils/api';
import { useSettings } from '@/contexts/SettingsContext';

interface Student {
  id: number;
  nis: string;
  name: string;
  class: string;
  status: string;
  time: string;
  photo: string;
  attendance: number;
  late: number;
  absent: number;
  permission: number;
  type: string;
  violations: number;
  achievements: number;
  recentViolations?: Violation[];
  recentAchievements?: Achievement[];
}

interface Violation {
  id: number;
  date: string;
  type: string;
  description: string;
  points: number;
}

interface Achievement {
  id: number;
  date: string;
  type: string;
  description: string;
  points: number;
}

const StudentDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { settings } = useSettings();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // State for adding violations
  const [showAddViolationForm, setShowAddViolationForm] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [violationDescription, setViolationDescription] = useState('');
  const [violationPoints, setViolationPoints] = useState(5);
  
  // State for adding achievements
  const [showAddAchievementForm, setShowAddAchievementForm] = useState(false);
  const [achievementType, setAchievementType] = useState('');
  const [achievementDescription, setAchievementDescription] = useState('');
  const [achievementPoints, setAchievementPoints] = useState(10);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        // Check if params is available and has id
        if (!params || !params.id) {
          setError('Invalid student ID');
          setLoading(false);
          return;
        }
        
        // Unwrap the params promise correctly
        const studentId = Array.isArray(params.id) 
          ? parseInt(params.id[0], 10) 
          : parseInt(params.id as string, 10);
        
        // Validate that we have a valid number
        if (isNaN(studentId)) {
          setError('Invalid student ID');
          setLoading(false);
          return;
        }
        
        const response = await getStudentById(studentId);
        if (response && response.student) {
          setStudent(response.student);
        } else if (response) {
          // Handle case where response is the student object directly
          setStudent(response);
        } else {
          setError('Student not found');
        }
      } catch (err: any) {
        console.error('Error fetching student:', err);
        // Provide more user-friendly error messages
        if (err.message && err.message.includes('connect')) {
          setError('Unable to connect to the server. Please make sure the development server is running.');
        } else {
          setError(err.message || 'Failed to load student details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [params]);

  // Function to update student attendance
  const handleAttendanceUpdate = async (newStatus: string) => {
    if (!student) return;
    
    try {
      const response = await updateAttendance(student.id, newStatus);
      if (response.success) {
        // Update the student with the new data
        setStudent({
          ...student,
          ...response.student,
          status: newStatus,
          time: response.student?.time || '-'
        });
        
        // Dispatch event to refresh reports and dashboard
        window.dispatchEvent(new CustomEvent('attendanceUpdated', {
          detail: {
            studentId: student.id,
            newStatus: newStatus
          }
        }));
        
        // Show notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setError(response.message || 'Failed to update attendance');
      }
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setError(err.message || 'Failed to update attendance');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>Error</h2>
          <p className={`mb-6 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{error || 'Student not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Function to get status text in Indonesian
  const getStatusText = (status: string) => {
    switch (status) {
      case 'hadir': return 'Hadir';
      case 'terlambat': return 'Terlambat';
      case 'tidak-hadir': return 'Tidak Hadir';
      case 'izin': return 'Izin';
      case 'sakit': return 'Sakit';
      default: return 'Belum Hadir';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'hadir': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'terlambat': 'bg-amber-100 text-amber-700 border-amber-200',
      'tidak-hadir': 'bg-red-100 text-red-700 border-red-200',
      'izin': 'bg-blue-100 text-blue-700 border-blue-200',
      'sakit': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Dark mode status color mapping
  const getDarkModeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'hadir': 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      'terlambat': 'bg-amber-900/30 text-amber-400 border-amber-800',
      'tidak-hadir': 'bg-red-900/30 text-red-400 border-red-800',
      'izin': 'bg-blue-900/30 text-blue-400 border-blue-800',
      'sakit': 'bg-purple-900/30 text-purple-400 border-purple-800'
    };
    return colors[status] || 'bg-gray-800 text-gray-300 border-gray-700';
  };

  // Function to add a new violation
  const handleAddViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !violationType.trim()) return;
    
    try {
      // In a real implementation, you would call an API endpoint here
      // For now, we'll simulate adding to the UI
      const newViolation: Violation = {
        id: Date.now(), // Simple ID generation
        date: new Date().toISOString(),
        type: violationType,
        description: violationDescription,
        points: violationPoints
      };
      
      // Update the student state with the new violation
      setStudent({
        ...student,
        recentViolations: [newViolation, ...(student.recentViolations || [])],
        violations: (student.violations || 0) + 1
      });
      
      // Reset form and hide it
      setViolationType('');
      setViolationDescription('');
      setViolationPoints(5);
      setShowAddViolationForm(false);
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err: any) {
      console.error('Error adding violation:', err);
      setError(err.message || 'Failed to add violation');
    }
  };

  // Function to add a new achievement
  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !achievementType.trim()) return;
    
    try {
      // In a real implementation, you would call an API endpoint here
      // For now, we'll simulate adding to the UI
      const newAchievement: Achievement = {
        id: Date.now(), // Simple ID generation
        date: new Date().toISOString(),
        type: achievementType,
        description: achievementDescription,
        points: achievementPoints
      };
      
      // Update the student state with the new achievement
      setStudent({
        ...student,
        recentAchievements: [newAchievement, ...(student.recentAchievements || [])],
        achievements: (student.achievements || 0) + 1
      });
      
      // Reset form and hide it
      setAchievementType('');
      setAchievementDescription('');
      setAchievementPoints(10);
      setShowAddAchievementForm(false);
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err: any) {
      console.error('Error adding achievement:', err);
      setError(err.message || 'Failed to add achievement');
    }
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
          Data berhasil diperbarui!
        </div>
      )}

      {/* Header */}
      <header className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className={`flex items-center ${settings.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mr-4`}
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Kembali
            </button>
            <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detail Siswa</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Student Info Card */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} rounded-xl shadow-md overflow-hidden mb-8 border`}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0 md:mr-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {student.photo}
                </div>
                <div className="ml-4">
                  <h2 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.name}</h2>
                  <p className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{student.nis}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    student.type === 'new' 
                      ? (settings.theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-100 text-green-800') 
                      : student.type === 'transfer' 
                        ? (settings.theme === 'dark' ? 'bg-orange-900/30 text-orange-400 border border-orange-800' : 'bg-orange-100 text-orange-800') 
                        : (settings.theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-blue-100 text-blue-800')
                  }`}>
                    {student.type === 'new' ? 'Siswa Baru' : student.type === 'transfer' ? 'Siswa Pindahan' : 'Siswa Lama'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className={`${settings.theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Kelas</p>
                  <p className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-900'}`}>{student.class}</p>
                </div>
                
                <div className={`${settings.theme === 'dark' ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-emerald-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>Kehadiran</p>
                  <p className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900'}`}>{student.attendance}%</p>
                </div>
                
                <div className={`${settings.theme === 'dark' ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>Pelanggaran</p>
                  <p className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-amber-200' : 'text-amber-900'}`}>{student.violations}</p>
                </div>
                
                <div className={`${settings.theme === 'dark' ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Penghargaan</p>
                  <p className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-900'}`}>{student.achievements}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <div className={`flex items-center ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2`}>
                <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Saat Ini:</span>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${
                  settings.theme === 'dark' 
                    ? getDarkModeStatusColor(student.status) 
                    : getStatusColor(student.status)
                }`}>
                  {getStatusText(student.status)}
                </span>
              </div>
              
              <div className={`flex items-center ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2`}>
                <Clock className="w-4 h-4 text-gray-600 mr-2" />
                <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Absen:</span>
                <span className={`ml-2 text-sm font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.time !== '-' ? student.time : 'Belum Absen'}</span>
              </div>
            </div>
            
            {/* Attendance Update Section */}
            <div className={`mt-6 p-4 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-medium mb-3 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Update Status Absensi</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAttendanceUpdate('hadir')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    student.status === 'hadir'
                      ? 'bg-emerald-500 text-white'
                      : settings.theme === 'dark'
                        ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Hadir
                </button>
                <button
                  onClick={() => handleAttendanceUpdate('terlambat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    student.status === 'terlambat'
                      ? 'bg-amber-500 text-white'
                      : settings.theme === 'dark'
                        ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Terlambat
                </button>
                <button
                  onClick={() => handleAttendanceUpdate('tidak-hadir')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    student.status === 'tidak-hadir'
                      ? 'bg-red-500 text-white'
                      : settings.theme === 'dark'
                        ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Tidak Hadir
                </button>
                <button
                  onClick={() => handleAttendanceUpdate('izin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    student.status === 'izin'
                      ? 'bg-blue-500 text-white'
                      : settings.theme === 'dark'
                        ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Izin
                </button>
                <button
                  onClick={() => handleAttendanceUpdate('sakit')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    student.status === 'sakit'
                      ? 'bg-purple-500 text-white'
                      : settings.theme === 'dark'
                        ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Sakit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 border`}>
            <div className="flex items-center">
              <div className={`rounded-full ${settings.theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-100'} p-3`}>
                <CheckCircle className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Hadir</p>
                <p className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.attendance}</p>
              </div>
            </div>
          </div>
          
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 border`}>
            <div className="flex items-center">
              <div className={`rounded-full ${settings.theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'} p-3`}>
                <Clock className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Terlambat</p>
                <p className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.late}</p>
              </div>
            </div>
          </div>
          
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 border`}>
            <div className="flex items-center">
              <div className={`rounded-full ${settings.theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'} p-3`}>
                <XCircle className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tidak Hadir</p>
                <p className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.absent}</p>
              </div>
            </div>
          </div>
          
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 border`}>
            <div className="flex items-center">
              <div className={`rounded-full ${settings.theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} p-3`}>
                <Shield className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Izin/Sakit</p>
                <p className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.permission}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Violations and Achievements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Violations */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md overflow-hidden border`}>
            <div className={`${settings.theme === 'dark' ? 'bg-red-900/20 border-b border-red-800' : 'bg-red-50'} px-6 py-4`}>
              <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-red-300' : 'text-red-800'} flex items-center`}>
                <AlertCircle className="w-5 h-5 mr-2" />
                Riwayat Pelanggaran
              </h3>
            </div>
            <div className="p-6">
              {/* Button to add violation */}
              <button
                onClick={() => setShowAddViolationForm(!showAddViolationForm)}
                className={`mb-4 flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  settings.theme === 'dark' 
                    ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pelanggaran
              </button>
              
              {/* Add Violation Form */}
              {showAddViolationForm && (
                <form onSubmit={handleAddViolation} className={`mb-6 p-4 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-medium mb-3 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Form Tambah Pelanggaran
                  </h4>
                  
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Jenis Pelanggaran
                    </label>
                    <input
                      type="text"
                      value={violationType}
                      onChange={(e) => setViolationType(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Contoh: Terlambat, Tidak Mengerjakan PR"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deskripsi
                    </label>
                    <textarea
                      value={violationDescription}
                      onChange={(e) => setViolationDescription(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Deskripsikan pelanggaran..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Poin Pelanggaran
                    </label>
                    <input
                      type="number"
                      value={violationPoints}
                      onChange={(e) => setViolationPoints(parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        settings.theme === 'dark' 
                          ? 'bg-red-700 text-white hover:bg-red-600' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddViolationForm(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
              
              {student?.recentViolations && student.recentViolations.length > 0 ? (
                <div className="space-y-4">
                  {student.recentViolations.map((violation) => (
                    <div 
                      key={violation.id} 
                      className={`border rounded-lg p-4 hover:${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors ${
                        settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{violation.type}</h4>
                          <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{violation.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          settings.theme === 'dark' 
                            ? 'bg-red-900/30 text-red-300 border border-red-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {violation.points} poin
                        </span>
                      </div>
                      <div className={`flex items-center mt-2 text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(violation.date).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    Tidak ada pelanggaran. 
                    <br />
                    <span className={`text-xs ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Klik "Tambah Pelanggaran" untuk menambahkan catatan pelanggaran.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md overflow-hidden border`}>
            <div className={`${settings.theme === 'dark' ? 'bg-green-900/20 border-b border-green-800' : 'bg-green-50'} px-6 py-4`}>
              <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-green-300' : 'text-green-800'} flex items-center`}>
                <Award className="w-5 h-5 mr-2" />
                Riwayat Penghargaan
              </h3>
            </div>
            <div className="p-6">
              {/* Button to add achievement */}
              <button
                onClick={() => setShowAddAchievementForm(!showAddAchievementForm)}
                className={`mb-4 flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  settings.theme === 'dark' 
                    ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Penghargaan
              </button>
              
              {/* Add Achievement Form */}
              {showAddAchievementForm && (
                <form onSubmit={handleAddAchievement} className={`mb-6 p-4 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-medium mb-3 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Form Tambah Penghargaan
                  </h4>
                  
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Jenis Penghargaan
                    </label>
                    <input
                      type="text"
                      value={achievementType}
                      onChange={(e) => setAchievementType(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Contoh: Juara Lomba, Prestasi Akademik"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deskripsi
                    </label>
                    <textarea
                      value={achievementDescription}
                      onChange={(e) => setAchievementDescription(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Deskripsikan penghargaan..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Poin Penghargaan
                    </label>
                    <input
                      type="number"
                      value={achievementPoints}
                      onChange={(e) => setAchievementPoints(parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        settings.theme === 'dark' 
                          ? 'bg-green-700 text-white hover:bg-green-600' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAchievementForm(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
              
              {student?.recentAchievements && student.recentAchievements.length > 0 ? (
                <div className="space-y-4">
                  {student.recentAchievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`border rounded-lg p-4 hover:${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors ${
                        settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{achievement.type}</h4>
                          <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{achievement.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          settings.theme === 'dark' 
                            ? 'bg-green-900/30 text-green-300 border border-green-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {achievement.points} poin
                        </span>
                      </div>
                      <div className={`flex items-center mt-2 text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(achievement.date).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className={`w-12 h-12 mx-auto mb-3 ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    Tidak ada penghargaan.
                    <br />
                    <span className={`text-xs ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Klik "Tambah Penghargaan" untuk menambahkan catatan penghargaan.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 mt-8 border`}>
          <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Informasi Kontak</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Phone className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
              <span className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>+62 812 3456 7890</span>
            </div>
            <div className="flex items-center">
              <Mail className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
              <span className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>-</span>
            </div>
            <div className="flex items-center">
              <MapPin className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mr-3`} />
              <span className={settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>-</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDetailPage;