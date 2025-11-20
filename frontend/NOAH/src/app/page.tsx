'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Download, Upload, Search, Filter, Bell, UserCheck, BarChart3, PieChart, Settings, LogOut, Menu, X, UserPlus, ArrowRightLeft, Save, Shield, Heart } from 'lucide-react';
import { getStudents, updateAttendance, getSettings, getReports, exportReport, addStudent, getTeachers, getTeacherSchedule } from '@/utils/api';
import { useSettings } from '@/contexts/SettingsContext';
import TeacherScheduleTab from './components/TeacherScheduleTab';
// Tambahkan import ini di baris paling atas, di bawah import React
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  violations?: number;
  achievements?: number;
}

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

// Add settings interface
interface Settings {
  school_name: string;
  academic_year: string;
  semester: string;
  start_time: string;
  end_time: string;
  notifications: boolean;
  language: string;
  theme: string;
}

// Add stats interface
interface Stats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  permission: number;
  attendanceRate: number;
  newStudents: number;
  transferStudents: number;
  enrollmentPeriod: boolean | string; // Accept both boolean and string
}

const ModernAttendanceSystem = () => {
  const { settings, updateSettingsContext } = useSettings();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('Perubahan berhasil disimpan!'); // <--- State Baru
  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };
  // Data dummy siswa dengan status absensi

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalStudents: 320,
    present: 285,
    absent: 15,
    late: 12,
    permission: 8,
    attendanceRate: 89.1,
    newStudents: 25, // Siswa baru tahun ini
    transferStudents: 8, // Siswa pindahan
    enrollmentPeriod: true // Musim pendaftaran aktif
  });

  // Fetch students and settings on component mount (without automatic refresh)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch students
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        
        // Fetch settings
        const settingsData = await getSettings();
        updateSettingsContext(settingsData);
        
        // Fetch reports for stats
        const reportsData = await getReports('summary');
        if (reportsData.success) {
          setStats({
            totalStudents: reportsData.attendanceStats?.totalStudents || stats.totalStudents,
            present: reportsData.attendanceStats?.present || stats.present,
            absent: reportsData.attendanceStats?.absent || stats.absent,
            late: reportsData.attendanceStats?.late || stats.late,
            permission: reportsData.attendanceStats?.permission || stats.permission,
            attendanceRate: reportsData.attendanceStats?.attendanceRate || stats.attendanceRate,
            newStudents: reportsData.studentCategories?.newStudents || stats.newStudents,
            transferStudents: reportsData.studentCategories?.transferStudents || stats.transferStudents,
            enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true // Preserve this value as boolean
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default stats if API fails
        setStats({
          totalStudents: 320,
          present: 285,
          absent: 15,
          late: 12,
          permission: 8,
          attendanceRate: 89.1,
          newStudents: 25,
          transferStudents: 8,
          enrollmentPeriod: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Removed automatic refresh interval - now refresh only happens manually
  }, []);

  // Filter siswa berdasarkan kelas dan pencarian
  const filteredStudents = students.filter(student => {
    const matchClass = selectedClass === 'all' || student.class === selectedClass;
    const matchType = selectedType === 'all' || student.type === selectedType;
    const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       student.nis.includes(searchQuery);
    return matchClass && matchType && matchSearch;
  });

  // Fungsi untuk mengubah status absensi
  const updateAttendanceStatus = async (studentId: number, newStatus: string) => {
    try {
      const response = await updateAttendance(studentId, newStatus);
      if (response.success) {
        // Update the student list with the new status
        setStudents(students.map(student => 
          student.id === studentId ? { ...student, ...response.student } : student
        ));
        
        // Update dashboard stats immediately with the new stats from the API response
        if (response.stats && response.categories) {
          setStats({
            totalStudents: response.stats.totalStudents || stats.totalStudents,
            present: response.stats.present || stats.present,
            absent: response.stats.absent || stats.absent,
            late: response.stats.late || stats.late,
            permission: response.stats.permission || stats.permission,
            attendanceRate: response.stats.attendanceRate || stats.attendanceRate,
            newStudents: response.categories.newStudents || stats.newStudents,
            transferStudents: response.categories.transferStudents || stats.transferStudents,
            enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true // Preserve this value as boolean
          });
        } else {
          // Fallback to local calculation if API doesn't return stats
          await updateDashboardStats();
        }
        
        // Also refresh student list to ensure consistency
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        
        // Dispatch event to refresh reports if we're on the reports tab
        if (activeTab === 'reports') {
          window.dispatchEvent(new CustomEvent('refreshReports'));
        }
        
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        console.error('Failed to update attendance:', response.message);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  // Function to update dashboard stats after attendance changes
  const updateDashboardStats = async () => {
    try {
      // Fetch updated reports for stats
      const reportsData = await getReports('summary');
      if (reportsData.success) {
        setStats({
          totalStudents: reportsData.attendanceStats?.totalStudents || stats.totalStudents,
          present: reportsData.attendanceStats?.present || stats.present,
          absent: reportsData.attendanceStats?.absent || stats.absent,
          late: reportsData.attendanceStats?.late || stats.late,
          permission: reportsData.attendanceStats?.permission || stats.permission,
          attendanceRate: reportsData.attendanceStats?.attendanceRate || stats.attendanceRate,
          newStudents: reportsData.studentCategories?.newStudents || stats.newStudents,
          transferStudents: reportsData.studentCategories?.transferStudents || stats.transferStudents,
          enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true // Preserve this value as boolean
        });
      }
      
      // Also refresh student list to ensure consistency
      const studentsData = await getStudents();
      setStudents(studentsData.students || studentsData);
      
      // Also refresh reports if we're on the reports tab
      if (activeTab === 'reports') {
        const reportsTab = document.querySelector('.reports-tab');
        if (reportsTab) {
          const refreshEvent = new CustomEvent('refreshReports');
          reportsTab.dispatchEvent(refreshEvent);
        }
      }
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
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

  const getStudentTypeBadge = (type: string) => {
    if (type === 'new') {
      return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
        <UserPlus className="w-3 h-3" />
        Baru
      </span>;
    } else if (type === 'transfer') {
      return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
        <ArrowRightLeft className="w-3 h-3" />
        Pindahan
      </span>;
    }
    return null;
  };

  // Dashboard Component
  const Dashboard = () => {
    
    // Listen for attendance updates
    useEffect(() => {
      const handleAttendanceUpdate = () => {
        // Refresh dashboard stats when attendance is updated
        updateDashboardStats();
      };
      
      window.addEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener);
      
      return () => {
        window.removeEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener);
      };
    }, []);
    
    // Manual refresh function
    const handleRefresh = async () => {
      setLoading(true);
      try {
        // Fetch updated data
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        
        const reportsData = await getReports('summary');
        setStats({
          totalStudents: reportsData.attendanceStats?.totalStudents || stats.totalStudents,
          present: reportsData.attendanceStats?.present || stats.present,
          absent: reportsData.attendanceStats?.absent || stats.absent,
          late: reportsData.attendanceStats?.late || stats.late,
          permission: reportsData.attendanceStats?.permission || stats.permission,
          attendanceRate: reportsData.attendanceStats?.attendanceRate || stats.attendanceRate,
          newStudents: reportsData.studentCategories?.newStudents || stats.newStudents,
          transferStudents: reportsData.studentCategories?.transferStudents || stats.transferStudents,
          enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true // Preserve this value as boolean
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="space-y-6">
        {/* Real-time Update Notice - Updated to show manual refresh */}
        <div className={`rounded-2xl p-4 ${settings.theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                Data diperbarui secara real-time saat absensi diubah
              </p>
            </div>
            <button 
              onClick={handleRefresh}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                settings.theme === 'dark' 
                  ? 'bg-blue-700 text-white hover:bg-blue-600' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-6 text-white shadow-lg ${settings.theme === 'dark' ? 'bg-gradient-to-br from-emerald-700 to-emerald-800' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-emerald-200' : 'text-emerald-100'} text-sm font-medium`}>Hadir Hari Ini</p>
                <h3 className="text-4xl font-bold mt-2">{stats.present}</h3>
                <p className={`${settings.theme === 'dark' ? 'text-emerald-200' : 'text-emerald-100'} text-xs mt-1`}>dari {stats.totalStudents} siswa</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-200" />
            </div>
          </div>

          <div className={`rounded-2xl p-6 text-white shadow-lg ${settings.theme === 'dark' ? 'bg-gradient-to-br from-blue-700 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-100'} text-sm font-medium`}>Siswa Baru</p>
                <h3 className="text-4xl font-bold mt-2">{stats.newStudents}</h3>
                <p className={`${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-100'} text-xs mt-1`}>tahun ajaran ini</p>
              </div>
              <UserPlus className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className={`rounded-2xl p-6 text-white shadow-lg ${settings.theme === 'dark' ? 'bg-gradient-to-br from-orange-700 to-orange-800' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-orange-200' : 'text-orange-100'} text-sm font-medium`}>Siswa Pindahan</p>
                <h3 className="text-4xl font-bold mt-2">{stats.transferStudents}</h3>
                <p className={`${settings.theme === 'dark' ? 'text-orange-200' : 'text-orange-100'} text-xs mt-1`}>semester ini</p>
              </div>
              <ArrowRightLeft className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          <div className={`rounded-2xl p-6 text-white shadow-lg ${settings.theme === 'dark' ? 'bg-gradient-to-br from-amber-700 to-amber-800' : 'bg-gradient-to-br from-amber-500 to-amber-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-amber-200' : 'text-amber-100'} text-sm font-medium`}>Terlambat</p>
                <h3 className="text-4xl font-bold mt-2">{stats.late}</h3>
                <p className={`${settings.theme === 'dark' ? 'text-amber-200' : 'text-amber-100'} text-xs mt-1`}>siswa</p>
              </div>
              <Clock className="w-12 h-12 text-amber-200" />
            </div>
          </div>
        </div>

        {/* Enrollment Alert */}
        {stats.enrollmentPeriod && (
          <div className={`rounded-2xl p-6 text-white shadow-lg ${settings.theme === 'dark' ? 'bg-gradient-to-r from-purple-700 to-pink-700' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Musim Pendaftaran Aktif!</h3>
                <p className={`${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-100'} mb-4`}>
                  Sistem sedang dalam periode penerimaan siswa baru. Siswa baru akan secara otomatis 
                  ditambahkan ke daftar absensi setelah pertemuan pertama dimulai.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{stats.newStudents}</div>
                    <div className={`${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-100'} text-sm`}>Siswa Baru</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.transferStudents}</div>
                    <div className={`${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-100'} text-sm`}>Siswa Pindahan</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2025/2026</div>
                    <div className={`${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-100'} text-sm`}>Tahun Ajaran</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tingkat Kehadiran
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Persentase Kehadiran</span>
                  <span className={`text-sm font-bold ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.attendanceRate.toFixed(1)}%</span>
                </div>
                <div className={`w-full rounded-full h-3 ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className={`rounded-xl p-4 border ${settings.theme === 'dark' ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Izin</p>
                  <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>{stats.permission}</p>
                </div>
                <div className={`rounded-xl p-4 border ${settings.theme === 'dark' ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-100'}`}>
                  <p className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>Total Siswa</p>
                  <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>{stats.totalStudents}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Rekap Minggu Ini
            </h3>
            <div className="space-y-3">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day, idx) => (
                <div key={day} className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-16 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{day}</span>
                  <div className={`flex-1 rounded-full h-2 ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" 
                      style={{ width: `${85 + (idx * 3)}%` } as React.CSSProperties}
                    ></div>
                  </div>
                  <span className={`text-sm font-bold ${settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{`${85 + (idx * 3)}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Settings Tab Component

  // Attendance Tab
  const AttendanceTab = () => {
    const { settings } = useSettings();
    
    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };
    
    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedDate(e.target.value);
    };
    
    // Handle class change
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedClass(e.target.value);
    };
    
    // Handle type change
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedType(e.target.value);
    };

    // Save all attendance changes
    const saveAttendance = async () => {
      try {
        // In a real implementation, you would save all pending changes here
        // For now, we'll just show a notification that changes are saved
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Refresh dashboard stats to ensure they reflect the latest changes
        await updateDashboardStats();
        
        // Also refresh student list to ensure consistency
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        
        // Dispatch event to refresh reports
        window.dispatchEvent(new CustomEvent('refreshReports'));
      } catch (error) {
        console.error('Error saving attendance:', error);
      }
    };

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

    return (
      <div className="space-y-6">
        {/* Filter Section */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={handleDateChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</label>
              <select 
                value={selectedClass}
                onChange={handleClassChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <option value="all">Semua Kelas</option>
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
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipe Siswa</label>
              <select 
                value={selectedType}
                onChange={handleTypeChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}>
                <option value="all">Semua Tipe</option>
                <option value="existing">Siswa Lama</option>
                <option value="new">Siswa Baru</option>
                <option value="transfer">Siswa Pindahan</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cari Siswa</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  placeholder="Nama atau NIS..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    settings.theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Perubahan langsung diterapkan ke dashboard dan laporan
              </span>
            </div>
            <button 
              onClick={saveAttendance}
              className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 ${
                settings.theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Simpan Absensi
            </button>
          </div>
        </div>

        {/* Student Attendance Table */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Siswa</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Hadir</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Terlambat</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tidak Hadir</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Izin</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sakit</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Saat Ini</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredStudents.map(student => (
                  <tr key={student.id} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {student.photo}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.name}</p>
                          <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{student.nis}</p>
                        </div>
                        {getStudentTypeBadge(student.type)}
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.class}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => updateAttendanceStatus(student.id, 'hadir')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.status === 'hadir' 
                            ? 'bg-emerald-500 text-white' 
                            : settings.theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => updateAttendanceStatus(student.id, 'terlambat')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.status === 'terlambat' 
                            ? 'bg-amber-500 text-white' 
                            : settings.theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => updateAttendanceStatus(student.id, 'tidak-hadir')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.status === 'tidak-hadir' 
                            ? 'bg-red-500 text-white' 
                            : settings.theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => updateAttendanceStatus(student.id, 'izin')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.status === 'izin' 
                            ? 'bg-blue-500 text-white' 
                            : settings.theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => updateAttendanceStatus(student.id, 'sakit')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.status === 'sakit' 
                            ? 'bg-purple-500 text-white' 
                            : settings.theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        student.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        student.status === 'terlambat' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        student.status === 'tidak-hadir' ? 'bg-red-100 text-red-700 border border-red-200' :
                        student.status === 'izin' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        student.status === 'sakit' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {getStatusText(student.status)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{student.time !== '-' ? student.time : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => router.push(`/students/${student.id}`)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          settings.theme === 'dark' 
                            ? 'bg-blue-700 text-white hover:bg-blue-600' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Reports Tab Component
  const ReportsTab = () => {
    const { settings } = useSettings();
    
    const [reportType, setReportType] = useState('summary');
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
    // Handle report type change
    const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setReportType(e.target.value);
    };
    
    // Generate report
    const generateReport = async () => {
      try {
        setLoadingReport(true);
        const data = await getReports(reportType);
        if (data.success) {
          setReportData(data);
        } else {
          console.error('Failed to generate report:', data.error);
        }
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setLoadingReport(false);
      }
    };
    
    // Export report
    // const exportReportData = async (format: string) => {
    //   try {
    //     await exportReport(format, reportData);
    //     setShowNotification(true);
    //     setTimeout(() => setShowNotification(false), 3000);
    //   } catch (error) {
    //     console.error('Error exporting report:', error);
    //   }
    // };
 
    // ... di dalam const ReportsTab = () => { ...

    // Fungsi Export PDF & Excel (Frontend Generated)
 // Fungsi Export PDF & Excel (Frontend Generated)
// Fungsi Export PDF & Excel (Frontend Generated)
    const exportReportData = (format: string) => {
      if (!reportData) {
        alert("Tidak ada data untuk diekspor");
        return;
      }

      try {
        const fileName = `Laporan_Kehadiran_${new Date().toISOString().split('T')[0]}`;

        if (format === 'excel') {
          // Logika Export Excel
          let dataToExport: any[] = [];
          
          if (reportType === 'detailed' && reportData.detailedStats) {
            dataToExport = reportData.detailedStats.map((item: any) => ({
              "Nama Siswa": item.name,
              "Kelas": item.class,
              "Status": item.currentStatus,
              "Waktu": item.currentTime,
              "Kehadiran (%)": item.attendancePercentage
            }));
          } else if (reportType === 'class' && reportData.classReports) {
            dataToExport = reportData.classReports;
          } else if (reportType === 'performance' && reportData.students) {
             dataToExport = reportData.students.map((item: any) => ({
              "Nama": item.name, "Kelas": item.class, 
              "Hadir": item.present, "Terlambat": item.late, 
              "Alpha": item.absent, "Izin/Sakit": item.permission + (item.sick || 0)
            }));
          } else {
            // Fallback untuk summary
            dataToExport = [reportData.attendanceStats];
          }

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(dataToExport);
          XLSX.utils.book_append_sheet(wb, ws, "Laporan");
          XLSX.writeFile(wb, `${fileName}.xlsx`);
          
          // Panggil notifikasi custom
          triggerNotification(`Laporan berhasil diekspor ke Excel!`);

        } else if (format === 'pdf') {
          // Logika Export PDF
          const doc = new jsPDF();
          doc.text("Laporan Kehadiran Siswa", 14, 10);
          doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 16);
          doc.setFontSize(10);
          doc.text(`Tipe Laporan: ${reportType.toUpperCase()}`, 14, 22);

          let head = [];
          let body = [];

          if (reportType === 'detailed' && reportData.detailedStats) {
            head = [['Nama', 'Kelas', 'Status', 'Waktu', '%']];
            body = reportData.detailedStats.map((item: any) => [
              item.name, item.class, item.currentStatus, item.currentTime, item.attendancePercentage + '%'
            ]);
          } else if (reportType === 'class' && reportData.classReports) {
             head = [['Kelas', 'Total', 'Hadir', 'Telat', 'Alpha', '%']];
             body = reportData.classReports.map((item: any) => [
               item.class, item.totalStudents, item.present, item.late, item.absent, item.averageAttendance + '%'
             ]);
          } else if (reportType === 'performance' && reportData.students) {
             head = [['Nama', 'Hadir', 'Telat', 'Alpha', 'Izin']];
             body = reportData.students.map((item: any) => [
               item.name, item.present, item.late, item.absent, item.permission
             ]);
          }

          autoTable(doc, {
            head: head,
            body: body,
            startY: 30,
          });

          doc.save(`${fileName}.pdf`);
          
          // Panggil notifikasi custom
          triggerNotification(`Laporan berhasil diekspor ke PDF!`);
        }
      } catch (error) {
        console.error('Error exporting report:', error);
        alert('Gagal mengekspor laporan');
      }
    };
    
    // Refresh reports when requested
    useEffect(() => {
      const handleRefreshReports = () => {
        generateReport();
      };
      
      // Add event listener for refresh
      window.addEventListener('refreshReports', handleRefreshReports);
      
      // Generate initial report
      generateReport();
      
      // Clean up
      return () => {
        window.removeEventListener('refreshReports', handleRefreshReports);
      };
    }, [reportType]);
    
  // Main render with sidebar and header
  // Main render with sidebar and header
  return (
      <div className="space-y-6">
        {/* Report Controls */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Laporan Kehadiran</h3>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Hasilkan dan ekspor laporan kehadiran siswa</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={reportType}
                onChange={handleReportTypeChange}
                className={`px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <option value="summary">Ringkasan</option>
                <option value="performance">Performa</option>
                <option value="detailed">Detail</option>
                <option value="class">Per Kelas</option>
              </select>
              <button 
                onClick={generateReport}
                disabled={loadingReport}
                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 ${
                  loadingReport 
                    ? 'opacity-50 cursor-not-allowed' 
                    : settings.theme === 'dark' 
                      ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {loadingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Hasilkan Laporan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Content */}
        {reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            {reportType === 'summary' && reportData.attendanceStats && (
              <React.Fragment>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Total Siswa</p>
                        <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{reportData.attendanceStats.totalStudents}</h3>
                      </div>
                      <Users className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Rata-rata Kehadiran</p>
                        <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{reportData.attendanceStats.attendanceRate}%</h3>
                      </div>
                      <TrendingUp className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Siswa Terlambat</p>
                        <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{reportData.attendanceStats.late}</h3>
                      </div>
                      <Clock className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Tidak Hadir</p>
                        <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{reportData.attendanceStats.absent}</h3>
                      </div>
                      <XCircle className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
            
            {/* Class Report */}
            {reportType === 'class' && reportData.classReports && (
              <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Laporan Kehadiran per Kelas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jumlah Siswa</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Hadir</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Terlambat</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Izin</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sakit</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tidak Hadir</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tingkat Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                      {reportData.classReports.map((classReport: any, index: number) => (
                        <tr key={index} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{classReport.class}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{classReport.totalStudents}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{classReport.present}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{classReport.late}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{classReport.permission}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{classReport.sick}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{classReport.absent}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{Math.round(((classReport.present + classReport.late) / classReport.totalStudents) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Detailed Report */}
            {reportType === 'detailed' && reportData.detailedStats && (
              <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Detail Laporan</h3>
                    <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Laporan kehadiran tanggal {new Date().toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => exportReportData('pdf')}
                      className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                        settings.theme === 'dark' 
                          ? 'bg-red-700 text-white hover:bg-red-800' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button 
                      onClick={() => exportReportData('excel')}
                      className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                        settings.theme === 'dark' 
                          ? 'bg-green-700 text-white hover:bg-green-800' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Excel
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Siswa</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Saat Ini</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu</th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tingkat Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                      {reportData.detailedStats.map((student: any, index: number) => (
                        <tr key={index} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.name}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.class}</td>
                          <td className={`px-4 py-3 font-medium ${student.currentStatus === 'hadir' ? (settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : student.currentStatus === 'terlambat' ? (settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : (student.currentStatus === 'izin' || student.currentStatus === 'sakit') ? (settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (settings.theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>{student.currentStatus === 'hadir' ? 'Hadir' : student.currentStatus === 'terlambat' ? 'Terlambat' : student.currentStatus === 'izin' ? 'Izin' : student.currentStatus === 'sakit' ? 'Sakit' : 'Tidak Hadir'}</td>
                          <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.currentTime}</td>
                          <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.attendancePercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Performance Report */}
            {reportType === 'performance' && reportData.students && (
              <div className="space-y-6">
                {/* Chart Section */}
                <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Statistik Kehadiran</h3>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className={`rounded-xl p-4 ${settings.theme === 'dark' ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-100'}`}>
                      <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600'}`}>Hadir</p>
                      <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-emerald-200' : 'text-emerald-700'}`}>{reportData.summary?.present || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${settings.theme === 'dark' ? 'bg-amber-900/30 border border-amber-800' : 'bg-amber-50 border border-amber-100'}`}>
                      <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`}>Terlambat</p>
                      <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-amber-200' : 'text-amber-700'}`}>{reportData.summary?.late || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${settings.theme === 'dark' ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-100'}`}>
                      <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>Tidak Hadir</p>
                      <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-red-200' : 'text-red-700'}`}>{reportData.summary?.absent || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${settings.theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                      <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Izin/Sakit</p>
                      <p className={`text-2xl font-bold mt-1 ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>{reportData.summary?.permission || 0}</p>
                    </div>
                  </div>
                  
                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className={`${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} rounded-xl p-4`}>
                      <h4 className={`font-medium mb-4 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Grafik Batang</h4>
                      {reportData.chartData && (
                        <Bar 
                          data={reportData.chartData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#fff',
                                titleColor: settings.theme === 'dark' ? '#f3f4f6' : '#111827',
                                bodyColor: settings.theme === 'dark' ? '#f3f4f6' : '#111827',
                                borderColor: settings.theme === 'dark' ? '#374151' : '#e5e7eb',
                                borderWidth: 1
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280'
                                },
                                grid: {
                                  color: settings.theme === 'dark' ? '#374151' : '#e5e7eb'
                                }
                              },
                              x: {
                                ticks: {
                                  color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280'
                                },
                                grid: {
                                  color: settings.theme === 'dark' ? '#374151' : '#e5e7eb'
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Pie Chart */}
                    <div className={`${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} rounded-xl p-4`}>
                      <h4 className={`font-medium mb-4 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Grafik Lingkaran</h4>
                      {reportData.chartData && (
                        <Pie 
                          data={reportData.chartData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  color: settings.theme === 'dark' ? '#f3f4f6' : '#111827',
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              tooltip: {
                                backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#fff',
                                titleColor: settings.theme === 'dark' ? '#f3f4f6' : '#111827',
                                bodyColor: settings.theme === 'dark' ? '#f3f4f6' : '#111827',
                                borderColor: settings.theme === 'dark' ? '#374151' : '#e5e7eb',
                                borderWidth: 1
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Performance Table */}
                <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Laporan Performa Siswa</h3>
                      <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Laporan performa siswa
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => exportReportData('pdf')}
                        className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                          settings.theme === 'dark' 
                            ? 'bg-red-700 text-white hover:bg-red-800' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button 
                        onClick={() => exportReportData('excel')}
                        className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                          settings.theme === 'dark' 
                            ? 'bg-green-700 text-white hover:bg-green-800' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Excel
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Siswa</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Hadir</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Terlambat</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Izin</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sakit</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tidak Hadir</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Persentase Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {reportData.students.map((student: any, index: number) => (
                          <tr key={index} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                            <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.name}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.class}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{student.present || 0}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{student.late}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{student.permission}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{student.sick || 0}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{student.absent}</td>
                            <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.attendance}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-12 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} text-center`}>
            <BarChart3 className={`w-16 h-16 mx-auto ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
            <h3 className={`text-xl font-bold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Belum Ada Laporan</h3>
            <p className={`mb-6 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Pilih jenis laporan dan klik "Hasilkan Laporan" untuk melihat data kehadiran siswa
            </p>
            <button 
              onClick={generateReport}
              className={`px-6 py-3 rounded-xl font-medium ${
                settings.theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              Hasilkan Laporan Sekarang
            </button>
          </div>
        )}
      </div>
    );
  };

  // Settings Tab Component
  const SettingsTab = () => {
    const { settings, updateSettingsContext } = useSettings();
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    
    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setLocalSettings(prev => ({ ...prev, [name]: value }));
    };
    
    // Handle checkbox changes
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setLocalSettings(prev => ({ ...prev, [name]: checked }));
    };
    
    // Save settings
    const saveSettings = async () => {
      try {
        await updateSettingsContext(localSettings);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Pengaturan Sistem</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Sekolah</label>
              <input
                type="text"
                name="school_name"
                value={localSettings.school_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tahun Ajaran</label>
              <input
                type="text"
                name="academic_year"
                value={localSettings.academic_year}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Semester</label>
              <select
                name="semester"
                value={localSettings.semester}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Mulai</label>
              <input
                type="time"
                name="start_time"
                value={localSettings.start_time}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Selesai</label>
              <input
                type="time"
                name="end_time"
                value={localSettings.end_time}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="notifications"
                checked={localSettings.notifications}
                onChange={handleCheckboxChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className={`ml-2 text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Aktifkan Notifikasi</label>
            </div>
          </div>
          
          <div className="mt-8">
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tema</label>
            <div className="flex gap-4">
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'light' }))}
                className={`px-6 py-3 rounded-xl font-medium ${
                  localSettings.theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                Terang
              </button>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'dark' }))}
                className={`px-6 py-3 rounded-xl font-medium ${
                  localSettings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                Gelap
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveSettings}
              className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 ${
                settings.theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <Save className="w-5 h-5" />
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    );
  };

  // New Students Tab Component
  const NewStudentsTab = () => {
    // State for add student modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStudentData, setNewStudentData] = useState({
      nis: '',
      name: '',
      class: 'X-IPA-1',
      type: 'new' // 'new' or 'transfer'
    });
    const { settings } = useSettings();
    const router = useRouter();
    
    // Filter students to show only new and transferred students
    const newAndTransferredStudents = students.filter(student => 
      student.type === 'new' || student.type === 'transfer'
    );
    
    // Count new and transferred students
    const newStudentsCount = students.filter(student => student.type === 'new').length;
    const transferredStudentsCount = students.filter(student => student.type === 'transfer').length;
    
    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };
    
    // Handle class change
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedClass(e.target.value);
    };
    
    // Handle type change (new/transferred)
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedType(e.target.value);
    };
    
    // Handle new student data change
    const handleNewStudentDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNewStudentData(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    // Filter students based on search, class, and type
    const filteredStudents = newAndTransferredStudents.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         student.nis.includes(searchQuery);
      const matchClass = selectedClass === 'all' || student.class === selectedClass;
      const matchType = selectedType === 'all' || student.type === selectedType;
      return matchSearch && matchClass && matchType;
    });
    
    // Handle add student submission
    const handleAddStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        // Validate required fields
        if (!newStudentData.nis || !newStudentData.name) {
          alert('NIS dan Nama siswa wajib diisi');
          return;
        }
        
        // Add student through API
        const response = await addStudent(newStudentData);
        
        if (response.success) {
          // Refresh student list
          const studentsData = await getStudents();
          setStudents(studentsData.students || studentsData);
          
          // Close modal and reset form
          setIsAddModalOpen(false);
          setNewStudentData({
            nis: '',
            name: '',
            class: 'X-IPA-1',
            type: 'new'
          });
          
          // Show success notification
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          alert('Gagal menambahkan siswa: ' + response.error);
        }
      } catch (error) {
        console.error('Error adding student:', error);
        alert('Terjadi kesalahan saat menambahkan siswa');
      }
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Siswa Baru</p>
                <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{newStudentsCount}</h3>
              </div>
              <UserPlus className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
          
          <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Siswa Pindahan</p>
                <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{transferredStudentsCount}</h3>
              </div>
              <ArrowRightLeft className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>
        
{/* Filter Section - Layout Diperbaiki agar Sejajar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
            
            {/* Kolom 1: Cari Siswa */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Cari Siswa
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input 
                  type="text" 
                  placeholder="Nama atau NIS..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    settings.theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 border'
                  }`}
                />
              </div>
            </div>

            {/* Kolom 2: Kelas */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Kelas
              </label>
              <select 
                value={selectedClass}
                onChange={handleClassChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-900 border'
                }`}
              >
                <option value="all">Semua Kelas</option>
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

            {/* Kolom 3: Tipe Siswa */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Tipe Siswa
              </label>
              <select 
                value={selectedType}
                onChange={handleTypeChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-900 border'
                }`}
              >
                <option value="all">Semua Tipe</option>
                <option value="new">Siswa Baru</option>
                <option value="transfer">Siswa Pindahan</option>
              </select>
            </div>

            {/* Kolom 4: Tombol Tambah (Sejajar Rata) */}
            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`w-full px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  settings.theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                Tambah Siswa
              </button>
            </div>

          </div>
        {/* Student Table */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Siswa</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipe</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Saat Ini</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu</th>
                  <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr key={student.id} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {student.photo}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.name}</p>
                            <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{student.nis}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.class}</td>
                      <td className="px-4 py-3 text-center">
                        {student.type === 'new' ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            settings.theme === 'dark' 
                              ? 'bg-green-900/30 text-green-400 border border-green-800' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <UserPlus className="w-3 h-3" />
                            Baru
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            settings.theme === 'dark' 
                              ? 'bg-orange-900/30 text-orange-400 border border-orange-800' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            <ArrowRightLeft className="w-3 h-3" />
                            Pindahan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          student.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          student.status === 'terlambat' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          student.status === 'tidak-hadir' ? 'bg-red-100 text-red-700 border border-red-200' :
                          student.status === 'izin' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          student.status === 'sakit' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {student.status === 'hadir' ? 'Hadir' :
                           student.status === 'terlambat' ? 'Terlambat' :
                           student.status === 'tidak-hadir' ? 'Tidak Hadir' :
                           student.status === 'izin' ? 'Izin' :
                           student.status === 'sakit' ? 'Sakit' : 'Belum Hadir'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{student.time !== '-' ? student.time : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => router.push(`/students/${student.id}`)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            settings.theme === 'dark' 
                              ? 'bg-blue-700 text-white hover:bg-blue-600' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className={`w-12 h-12 ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                        <p className={`text-lg font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Tidak Ada Siswa</p>
                        <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Tidak ada siswa baru atau pindahan yang sesuai dengan filter
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

{/* Add Student Modal Responsif */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden bg-black bg-opacity-50">
            <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]`}>
              
              {/* Header Modal - Fixed at top */}
              <div className="p-6 pb-2 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Tambah Siswa Baru
                  </h3>
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className={`p-2 rounded-full ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Body Modal - Scrollable content */}
              <div className="p-6 pt-0 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleAddStudent}>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        NIS *
                      </label>
                      <input
                        type="text"
                        name="nis"
                        value={newStudentData.nis}
                        onChange={handleNewStudentDataChange}
                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          settings.theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-200 text-gray-900'
                        }`}
                        placeholder="Nomor Induk Siswa"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newStudentData.name}
                        onChange={handleNewStudentDataChange}
                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          settings.theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-200 text-gray-900'
                        }`}
                        placeholder="Nama lengkap siswa"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Kelas
                      </label>
                      <select
                        name="class"
                        value={newStudentData.class}
                        onChange={handleNewStudentDataChange}
                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                      <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tipe Siswa
                      </label>
                      <select
                        name="type"
                        value={newStudentData.type}
                        onChange={handleNewStudentDataChange}
                        className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          settings.theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-200 text-gray-900'
                        }`}
                      >
                        <option value="new">Siswa Baru</option>
                        <option value="transfer">Siswa Pindahan</option>
                      </select>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${settings.theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                      <h4 className={`font-medium mb-2 ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                        Syarat dan Ketentuan
                      </h4>
                      <ul className={`text-sm space-y-1 ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                        {newStudentData.type === 'new' ? (
                          <>
                            <li>• Usia maksimal 21 tahun pada awal tahun ajaran</li>
                            <li>• Melampirkan akta kelahiran dan kartu keluarga</li>
                            <li>• Menyerahkan ijazah terakhir dengan nilai minimal 75</li>
                            <li>• Melakukan tes seleksi masuk yang ditetapkan sekolah</li>
                            <li>• Membayar biaya pendaftaran sebesar Rp 250.000</li>
                          </>
                        ) : (
                          <>
                            <li>• Surat keterangan pindah dari sekolah sebelumnya</li>
                            <li>• Transkrip nilai terakhir dengan rata-rata minimal 70</li>
                            <li>• Surat kelakuan baik dari sekolah sebelumnya</li>
                            <li>• Menyerahkan ijazah terakhir yang dilegalisir</li>
                            <li>• Melengkapi berkas administrasi sesuai ketentuan</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
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
                      Tambah Siswa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // Teacher Schedule Tab Component (using external component)
  // Removed corrupted inline TeacherScheduleTab component to use external component

  // Teacher Schedule Tab Component (using external component)
  // Removed corrupted inline TeacherScheduleTab component to use external component

  // Main render with sidebar and header
  return (
    <div className={`min-h-screen flex ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {settings.school_name || 'Sistem Absensi'}
              </h1>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'dashboard'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                {isSidebarOpen && <span>Dashboard</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'attendance'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {isSidebarOpen && <span>Absensi</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'reports'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                {isSidebarOpen && <span>Laporan</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'settings'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                {isSidebarOpen && <span>Pengaturan</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'schedule'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {isSidebarOpen && <span>Jadwal Guru</span>}
              </button>
            </li>
            {/* New menu item for new/transferred students */}
            <li>
              <button
                onClick={() => setActiveTab('newStudents')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'newStudents'
                    ? settings.theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : settings.theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                {isSidebarOpen && <span>Siswa Baru/Pindahan</span>}
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => router.push('/login')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${
              settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'attendance' && 'Absensi Siswa'}
                {activeTab === 'reports' && 'Laporan Kehadiran'}
                {activeTab === 'settings' && 'Pengaturan'}
                {activeTab === 'schedule' && 'Jadwal Guru'}
                {activeTab === 'newStudents' && 'Siswa Baru & Pindahan'}
              </h2>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {settings.academic_year || 'Tahun Ajaran 2024/2025'} - {settings.semester || 'Semester Ganjil'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className={`p-2 rounded-full ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                  <p className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Admin</p>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'schedule' && <TeacherScheduleTab settings={settings} setShowNotification={setShowNotification} />}
          {activeTab === 'newStudents' && <NewStudentsTab />}
        </main>
      </div>
      
{/* Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
            settings.theme === 'dark' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <CheckCircle className="w-5 h-5" />
            {/* Hanya tampilkan pesan dari state, hapus teks statis */}
            <span className="font-medium">{notificationMessage}</span> 
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  // Main render with sidebar and header
  return (
    <ModernAttendanceSystem />
  );
}

export { ModernAttendanceSystem };
