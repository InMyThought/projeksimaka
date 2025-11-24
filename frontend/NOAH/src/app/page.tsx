'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Download, Search, Bell, UserCheck, BarChart3, Settings, LogOut, Menu, X, UserPlus, ArrowRightLeft, Save, Shield, Heart } from 'lucide-react';
import { getStudents, updateAttendance, getSettings,updateSettings, getReports, exportReport, addStudent } from '@/utils/api';
import { useSettings } from '@/contexts/SettingsContext';
import TeacherScheduleTab from './components/TeacherScheduleTab';
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

// --- INTERFACES ---
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

interface Stats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  permission: number;
  attendanceRate: number;
  newStudents: number;
  transferStudents: number;
  enrollmentPeriod: boolean | string;
}

// --- PROPS untuk Komponen Tab Siswa ---
interface NewStudentsTabProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedClass: string;
  setSelectedClass: React.Dispatch<React.SetStateAction<string>>;
  selectedType: string;
  setSelectedType: React.Dispatch<React.SetStateAction<string>>;
  setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;
}
import { ChevronDown } from 'lucide-react'; // Pastikan tambah import ini di atas file jika belum ada, atau gunakan SVG manual seperti di bawah

// GANTI SELURUH KOMPONEN NewStudentsTab DENGAN INI:
const NewStudentsTab = ({
  students,
  setStudents,
  searchQuery,
  setSearchQuery,
  selectedClass,
  setSelectedClass,
  selectedType,
  setSelectedType,
  setShowNotification
}: NewStudentsTabProps) => {
  const { settings } = useSettings();
  const router = useRouter();
  
  // State lokal untuk modal & dropdown custom
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false); // State baru untuk dropdown kelas
  
  const [newStudentData, setNewStudentData] = useState({
    nis: '',
    name: '',
    class: 'X-IPA-1',
    type: 'new'
  });

  // Filter logic
  const newAndTransferredStudents = students.filter(s => s.type === 'new' || s.type === 'transfer');
  const filteredStudents = newAndTransferredStudents.filter(student => {
    const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.nis.includes(searchQuery);
    const matchClass = selectedClass === 'all' || student.class === selectedClass;
    const matchType = selectedType === 'all' || student.type === selectedType;
    return matchSearch && matchClass && matchType;
  });

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value);
  
  // Handler khusus untuk Custom Dropdown Kelas
  const handleClassSelect = (value: string) => {
    setSelectedClass(value);
    setIsClassDropdownOpen(false);
  };

  const handleNewStudentDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.nis || !newStudentData.name) {
      alert('NIS dan Nama siswa wajib diisi');
      return;
    }
    try {
      const response = await addStudent(newStudentData);
      if (response.success) {
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData); 
        setIsAddModalOpen(false);
        setNewStudentData({ nis: '', name: '', class: 'X-IPA-1', type: 'new' });
        setShowNotification(true);
      } else {
        alert('Gagal menambahkan siswa: ' + response.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menambahkan siswa');
    }
  };

  // Data kelas untuk dropdown custom
  const classOptions = [
    { label: "Kelas 10", options: ["X-IPA-1", "X-IPA-2", "X-IPS-1", "X-IPS-2"] },
    { label: "Kelas 11", options: ["XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2"] },
    { label: "Kelas 12", options: ["XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2"] },
  ];

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 cukup untuk ruang scroll sedikit */}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Siswa Baru</p>
              <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{students.filter(s => s.type === 'new').length}</h3>
            </div>
            <UserPlus className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
        
        <div className={`rounded-2xl p-6 ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'} shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Siswa Pindahan</p>
              <h3 className={`text-3xl font-bold mt-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{students.filter(s => s.type === 'transfer').length}</h3>
            </div>
            <ArrowRightLeft className={`w-10 h-10 ${settings.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </div>
      </div>
      
      {/* Filter Section */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
            {/* Input Cari Siswa */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cari Siswa</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input 
                  type="text" 
                  placeholder="Nama atau NIS..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border'
                  }`}
                />
              </div>
            </div>
            
            {/* CUSTOM DROPDOWN KELAS (Solusi scroll pendek) */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</label>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900 border'
                }`}
              >
                <span>{selectedClass === 'all' ? 'Semua Kelas' : selectedClass}</span>
                {/* Icon Chevron (Panah Bawah) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`}>
                    <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown List Content */}
              {isClassDropdownOpen && (
                <div className={`absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                    {/* INI KUNCINYA: max-h-60 overflow-y-auto membuat scroll ada di dalam sini */}
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        <button
                            onClick={() => handleClassSelect('all')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition-colors ${selectedClass === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                        >
                            Semua Kelas
                        </button>
                        
                        {classOptions.map((group, idx) => (
                            <div key={idx}>
                                <div className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${settings.theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                    {group.label}
                                </div>
                                {group.options.map((cls) => (
                                    <button
                                        key={cls}
                                        onClick={() => handleClassSelect(cls)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition-colors ${selectedClass === cls ? 'bg-blue-50 text-blue-600 font-medium' : settings.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
            
            {/* Dropdown Tipe (Tetap Native karena pendek) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipe Siswa</label>
              <select 
                value={selectedType}
                onChange={handleTypeChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}>
                <option value="all">Semua Tipe</option>
                <option value="new">Siswa Baru</option>
                <option value="transfer">Siswa Pindahan</option>
              </select>
            </div>
          </div>
          
          {/* Tombol Tambah Siswa */}
          <div className="w-full md:w-auto">
             <button
              onClick={() => setIsAddModalOpen(true)}
              className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                settings.theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white hover:from-blue-800 hover:to-purple-900 shadow-lg shadow-blue-900/20' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span>Tambah Siswa</span>
            </button>
          </div>
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
                <th className={`px-4 py-3 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${settings.theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-100 text-green-700'}`}>
                          <UserPlus className="w-3 h-3" /> Baru
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${settings.theme === 'dark' ? 'bg-orange-900/30 text-orange-400 border border-orange-800' : 'bg-orange-100 text-orange-700'}`}>
                          <ArrowRightLeft className="w-3 h-3" /> Pindahan
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
                          {student.status === 'hadir' ? 'Hadir' : student.status === 'terlambat' ? 'Terlambat' : student.status === 'tidak-hadir' ? 'Tidak Hadir' : student.status === 'izin' ? 'Izin' : student.status === 'sakit' ? 'Sakit' : 'Belum Hadir'}
                        </span>
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{student.time !== '-' ? student.time : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => router.push(`/students/${student.id}`)} className={`px-3 py-1 rounded-lg text-xs font-medium ${settings.theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>Detail</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className={`w-12 h-12 ${settings.theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} mb-4`} />
                      <p className={`text-lg font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Tidak Ada Siswa</p>
                      <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada siswa baru atau pindahan yang sesuai filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-white'} max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Tambah Siswa
                  </h3>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Masukkan data siswa baru atau pindahan
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className={`p-2 rounded-full transition-colors ${settings.theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddStudent}>
                <div className="space-y-5">
                  {/* Input NIS */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      NIS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nis"
                      value={newStudentData.nis}
                      onChange={handleNewStudentDataChange}
                      className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border'
                      }`}
                      placeholder="Contoh: 212210050"
                      required
                    />
                  </div>
                  
                  {/* Input Nama */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newStudentData.name}
                      onChange={handleNewStudentDataChange}
                      className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border'
                      }`}
                      placeholder="Nama lengkap siswa"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      {/* Input Kelas */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Kelas
                        </label>
                        <select
                          name="class"
                          value={newStudentData.class}
                          onChange={handleNewStudentDataChange}
                          className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-200 text-gray-900 border'
                          }`}
                          style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: `right 0.5rem center`,
                              backgroundRepeat: `no-repeat`,
                              backgroundSize: `1.5em 1.5em`,
                              paddingRight: `2.5rem`
                          }}
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
                      
                      {/* Input Tipe */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Status Siswa
                        </label>
                        <select
                          name="type"
                          value={newStudentData.type}
                          onChange={handleNewStudentDataChange}
                          className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none ${
                            settings.theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-200 text-gray-900 border'
                          }`}
                          style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: `right 0.5rem center`,
                              backgroundRepeat: `no-repeat`,
                              backgroundSize: `1.5em 1.5em`,
                              paddingRight: `2.5rem`
                          }}
                        >
                          <option value="new">Siswa Baru</option>
                          <option value="transfer">Pindahan</option>
                        </select>
                      </div>
                  </div>
                  
                  {/* Syarat dan Ketentuan */}
                  <div className={`p-4 rounded-xl ${settings.theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                    <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${settings.theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      <AlertCircle className="w-4 h-4" /> Syarat dan Ketentuan
                    </h4>
                    <ul className={`text-xs space-y-1.5 ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
                      {newStudentData.type === 'new' ? (
                        <>
                          <li>• Usia maksimal 21 tahun pada awal tahun ajaran</li>
                          <li>• Melampirkan akta kelahiran dan kartu keluarga</li>
                          <li>• Menyerahkan ijazah terakhir dengan nilai minimal 75</li>
                          <li>• Melakukan tes seleksi masuk yang ditetapkan sekolah</li>
                          <li className="font-bold">• Membayar biaya pendaftaran sebesar Rp 250.000</li>
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
                
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      settings.theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white shadow-lg transition-all transform active:scale-95 ${
                      settings.theme === 'dark' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 shadow-blue-900/30' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-500/30'
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
// --- MAIN COMPONENT ---
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
  const [notificationMessage, setNotificationMessage] = useState('Perubahan berhasil disimpan!');
  
  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        
        const settingsData = await getSettings();
        updateSettingsContext(settingsData);
        
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
            enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter siswa berdasarkan kelas dan pencarian (Untuk tab absensi dan list)
  const filteredStudents = students.filter(student => {
    const matchClass = selectedClass === 'all' || student.class === selectedClass;
    const matchType = selectedType === 'all' || student.type === selectedType;
    const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       student.nis.includes(searchQuery);
    return matchClass && matchType && matchSearch;
  });

  const updateAttendanceStatus = async (studentId: number, newStatus: string) => {
    try {
      const response = await updateAttendance(studentId, newStatus);
      if (response.success) {
        setStudents(students.map(student => 
          student.id === studentId ? { ...student, ...response.student } : student
        ));
        
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
            enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true
          });
        } else {
          await updateDashboardStats();
        }
        
        if (activeTab === 'reports') {
          window.dispatchEvent(new CustomEvent('refreshReports'));
        }
        
        triggerNotification('Absensi berhasil diperbarui!');
      } else {
        console.error('Failed to update attendance:', response.message);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const updateDashboardStats = async () => {
    try {
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
          enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true
        });
      }
      
      const studentsData = await getStudents();
      setStudents(studentsData.students || studentsData);
      
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

  // Warna status
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
      return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"><UserPlus className="w-3 h-3" /> Baru</span>;
    } else if (type === 'transfer') {
      return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium"><ArrowRightLeft className="w-3 h-3" /> Pindahan</span>;
    }
    return null;
  };

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

  // --- SUB COMPONENTS (Internal) ---
  const Dashboard = () => {
    useEffect(() => {
      const handleAttendanceUpdate = () => {
        updateDashboardStats();
      };
      window.addEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener);
      return () => {
        window.removeEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener);
      };
    }, []);
    
    const handleRefresh = async () => {
      setLoading(true);
      try {
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
          enrollmentPeriod: typeof stats.enrollmentPeriod === 'boolean' ? stats.enrollmentPeriod : true
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl p-4 ${settings.theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <p className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                Data diperbarui secara real-time saat absensi diubah
              </p>
            </div>
            <button onClick={handleRefresh} className={`px-3 py-1 rounded-lg text-xs font-medium ${settings.theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>Refresh</button>
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className={`rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Tingkat Kehadiran</h3>
              <div className="space-y-4">
                  <div className="flex justify-between mb-2"><span className="text-sm">Persentase</span><span className="text-sm font-bold text-emerald-500">{stats.attendanceRate}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div></div>
              </div>
           </div>
           <div className={`rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-600" /> Statistik</h3>
               <div className="h-32 flex items-center justify-center text-gray-500">Grafik Statistik</div>
           </div>
        </div>
      </div>
    );
  };

  const AttendanceTab = () => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value);
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClass(e.target.value);
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value);

    const saveAttendance = async () => {
      try {
        triggerNotification('Absensi berhasil disimpan!');
        await updateDashboardStats();
        const studentsData = await getStudents();
        setStudents(studentsData.students || studentsData);
        window.dispatchEvent(new CustomEvent('refreshReports'));
      } catch (error) {
        console.error('Error saving attendance:', error);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal</label>
              <input type="date" value={selectedDate} onChange={handleDateChange} className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</label>
              <select value={selectedClass} onChange={handleClassChange} className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'}`}>
                <option value="all">Semua Kelas</option>
                <optgroup label="Kelas 10"><option value="X-IPA-1">X-IPA-1</option><option value="X-IPA-2">X-IPA-2</option><option value="X-IPS-1">X-IPS-1</option><option value="X-IPS-2">X-IPS-2</option></optgroup>
              </select>
            </div>
             <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipe</label>
              <select value={selectedType} onChange={handleTypeChange} className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900'}`}>
                <option value="all">Semua Tipe</option>
                <option value="existing">Lama</option><option value="new">Baru</option><option value="transfer">Pindahan</option>
              </select>
            </div>
            <div>
                <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cari</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} /></div>
                    <input type="text" placeholder="Cari..." value={searchQuery} onChange={handleSearchChange} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
                 </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={saveAttendance} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Simpan Absensi</button>
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
                  <th className="px-4 py-3 text-center text-sm font-semibold">Aksi Absensi</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Waktu</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className={`${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredStudents.map(student => (
                  <tr key={student.id} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                     <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">{student.photo}</div>
                           <div><p className="font-medium text-sm">{student.name}</p><p className="text-xs opacity-70">{student.nis}</p></div>
                        </div>
                     </td>
                     <td className="px-4 py-3">{student.class}</td>
                     <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => updateAttendanceStatus(student.id, 'hadir')} className={`p-1 rounded-full ${student.status === 'hadir' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}><CheckCircle className="w-4 h-4"/></button>
                        <button onClick={() => updateAttendanceStatus(student.id, 'terlambat')} className={`p-1 rounded-full ${student.status === 'terlambat' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Clock className="w-4 h-4"/></button>
                        <button onClick={() => updateAttendanceStatus(student.id, 'tidak-hadir')} className={`p-1 rounded-full ${student.status === 'tidak-hadir' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}><XCircle className="w-4 h-4"/></button>
                        <button onClick={() => updateAttendanceStatus(student.id, 'izin')} className={`p-1 rounded-full ${student.status === 'izin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Shield className="w-4 h-4"/></button>
                        <button onClick={() => updateAttendanceStatus(student.id, 'sakit')} className={`p-1 rounded-full ${student.status === 'sakit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Heart className="w-4 h-4"/></button>
                     </td>
                     <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          student.status === 'hadir' ? 'bg-emerald-100 text-emerald-700' :
                          student.status === 'terlambat' ? 'bg-amber-100 text-amber-700' :
                          student.status === 'tidak-hadir' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{getStatusText(student.status)}</span>
                     </td>
                     <td className="px-4 py-3 text-center text-sm">{student.time}</td>
                     <td className="px-4 py-3 text-center"><button onClick={() => router.push(`/students/${student.id}`)} className="text-blue-500 text-xs">Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        </div>
      </div>
    );
  };

// GANTI SELURUH KOMPONEN ReportsTab DENGAN INI:
  const ReportsTab = () => {
    // 1. Setup State & Hooks
    const { settings } = useSettings();
    const [reportType, setReportType] = useState('summary');
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // 2. Fungsi Generate Report (Ambil Data)
    const generateReport = async () => {
        setLoadingReport(true);
        try {
            const data = await getReports(reportType);
            if (data.success) {
                setReportData(data);
            } else {
                console.error('Failed to generate report:', data.error);
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoadingReport(false); 
        }
    };

    // 3. Fungsi Export (PDF/Excel)
    const exportReportData = (format: string) => {
        if(!reportData) return;
        const fileName = `Laporan_${new Date().toISOString().split('T')[0]}`;
        
        // Logika sederhana untuk demo export (Sesuaikan dengan utils/api asli jika perlu)
        if (format === 'excel') {
             let dataToExport: any[] = reportData.attendanceStats ? [reportData.attendanceStats] : [];
             if(reportData.detailedStats) dataToExport = reportData.detailedStats;
             const wb = XLSX.utils.book_new();
             const ws = XLSX.utils.json_to_sheet(dataToExport);
             XLSX.utils.book_append_sheet(wb, ws, "Laporan");
             XLSX.writeFile(wb, `${fileName}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.text(`Laporan Absensi - ${settings.school_name}`, 14, 10);
            doc.text(`Tipe: ${reportType}`, 14, 20);
            
            // Contoh sederhana menggunakan autotable
            if (reportData.detailedStats) {
                const headers = [["Nama", "Kelas", "Status", "Waktu"]];
                const data = reportData.detailedStats.map((s: any) => [s.name, s.class, s.currentStatus, s.currentTime]);
                autoTable(doc, {
                    head: headers,
                    body: data,
                    startY: 30,
                });
            } else {
                doc.text("Ringkasan data tersedia di dashboard / excel.", 14, 30);
            }
            
            doc.save(`${fileName}.pdf`);
        }
        triggerNotification(`Laporan berhasil diekspor ke ${format}!`);
    };

    // 4. Effect: Auto Generate saat tipe berubah & Listener Refresh
    useEffect(() => { 
        generateReport(); 
        
        // Listener untuk auto-refresh dari tab lain
        const handleRefreshReports = () => {
            generateReport();
        };
        window.addEventListener('refreshReports', handleRefreshReports);
        return () => {
            window.removeEventListener('refreshReports', handleRefreshReports);
        };
    }, [reportType]);

    // 5. Render UI
    return (
      <div className="space-y-6">
        {/* Header Controls */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                  <h3 className="text-lg font-bold">Laporan Kehadiran</h3>
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Analisa data absensi siswa</p>
              </div>
              <div className="flex flex-wrap gap-2">
                  <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)} 
                    className={`px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 ${settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                      <option value="summary">Ringkasan</option>
                      <option value="performance">Performa (Grafik)</option>
                      <option value="detailed">Detail Harian</option>
                      <option value="class">Per Kelas</option>
                  </select>
                  <button onClick={() => exportReportData('pdf')} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 font-medium transition-colors"><Download className="w-4 h-4"/> PDF</button>
                  <button onClick={() => exportReportData('excel')} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 font-medium transition-colors"><Download className="w-4 h-4"/> Excel</button>
              </div>
           </div>
        </div>

        {/* Content Area */}
        {loadingReport ? (
            <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Memuat data laporan...</p>
            </div>
        ) : reportData ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* 1. Tampilan Ringkasan (Summary) */}
            {reportType === 'summary' && reportData.attendanceStats && (
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
                        <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Terlambat</p>
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
            )}

            {/* 2. Tampilan Grafik Performa (Performance) */}
            {reportType === 'performance' && reportData.chartData && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h4 className={`font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Grafik Batang</h4>
                        <div className="h-64">
                            <Bar 
                                data={reportData.chartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' }, ticks: { color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} },
                                        x: { grid: { display: false }, ticks: { color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} }
                                    }
                                }} 
                            />
                        </div>
                    </div>
                    <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h4 className={`font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Komposisi Kehadiran</h4>
                        <div className="h-64 flex justify-center">
                             <Pie 
                                data={reportData.chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'right', labels: { color: settings.theme === 'dark' ? '#fff' : '#000'} } }
                                }}
                             />
                        </div>
                    </div>
                 </div>
            )}

            {/* 3. Tampilan Tabel Detail (Detailed) */}
            {reportType === 'detailed' && reportData.detailedStats && (
                <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Siswa</th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                          <th className={`px-6 py-4 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                          <th className={`px-6 py-4 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu</th>
                          <th className={`px-6 py-4 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Persentase</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {reportData.detailedStats.map((student: any, index: number) => (
                          <tr key={index} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`px-6 py-4 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.name}</td>
                            <td className={`px-6 py-4 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{student.class}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    student.currentStatus === 'hadir' ? 'bg-emerald-100 text-emerald-700' :
                                    student.currentStatus === 'terlambat' ? 'bg-amber-100 text-amber-700' :
                                    student.currentStatus === 'tidak-hadir' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {student.currentStatus === 'hadir' ? 'Hadir' : student.currentStatus === 'terlambat' ? 'Terlambat' : student.currentStatus === 'tidak-hadir' ? 'Alpha' : 'Izin/Sakit'}
                                </span>
                            </td>
                            <td className={`px-6 py-4 text-center ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{student.currentTime}</td>
                            <td className={`px-6 py-4 text-center font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{student.attendancePercentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

             {/* 4. Tampilan Tabel Per Kelas (Class) */}
             {reportType === 'class' && reportData.classReports && (
                <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                          <th className={`px-6 py-4 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jml Siswa</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-500">Hadir</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-amber-500">Telat</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-red-500">Alpha</th>
                          <th className={`px-6 py-4 text-center text-sm font-semibold ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>% Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${settings.theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {reportData.classReports.map((c: any, index: number) => (
                          <tr key={index} className={`hover:${settings.theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`px-6 py-4 font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{c.class}</td>
                            <td className={`px-6 py-4 text-center ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{c.totalStudents}</td>
                            <td className="px-6 py-4 text-center text-emerald-500 font-medium">{c.present}</td>
                            <td className="px-6 py-4 text-center text-amber-500 font-medium">{c.late}</td>
                            <td className="px-6 py-4 text-center text-red-500 font-medium">{c.absent}</td>
                            <td className={`px-6 py-4 text-center font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                {Math.round(((c.present + c.late) / c.totalStudents) * 100) || 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             )}

          </div>
        ) : (
             <div className="p-12 text-center opacity-50">
                <BarChart3 className="w-16 h-16 mx-auto mb-4"/>
                <p>Data laporan tidak tersedia atau gagal dimuat.</p>
             </div>
        )}
      </div>
    );
  };

// Ganti SettingsTab yang ada di page.tsx dengan ini:
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
// Di dalam komponen SettingsTab
  const saveSettings = async () => {
  try {
    // 1. Kirim ke Database dulu
    await updateSettings(localSettings);

    // 2. Baru update Context lokal
    await updateSettingsContext(localSettings);

    triggerNotification('Pengaturan berhasil disimpan!'); 
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Gagal menyimpan ke database.');
  }
};

    return (
      <div className="space-y-6">
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Pengaturan Sistem</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Sekolah */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Sekolah</label>
              <input
                type="text"
                name="school_name"
                value={localSettings.school_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}
              />
            </div>
            
            {/* Tahun Ajaran */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tahun Ajaran</label>
              <input
                type="text"
                name="academic_year"
                value={localSettings.academic_year}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}
              />
            </div>
            
            {/* Semester (DIKEMBALIKAN DARI BACKUP) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Semester</label>
              <select
                name="semester"
                value={localSettings.semester}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            
            {/* Waktu Mulai (DIKEMBALIKAN DARI BACKUP) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Mulai</label>
              <input
                type="time"
                name="start_time"
                value={localSettings.start_time}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}
              />
            </div>
            
            {/* Waktu Selesai (DIKEMBALIKAN DARI BACKUP) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Selesai</label>
              <input
                type="time"
                name="end_time"
                value={localSettings.end_time}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-900 border'
                }`}
              />
            </div>
            
            {/* Notifikasi Checkbox (DIKEMBALIKAN DARI BACKUP) */}
            <div className="flex items-center h-full pt-6">
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
          
          {/* Tema */}
          <div className="mt-8">
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tema</label>
            <div className="flex gap-4">
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'light' }))}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  localSettings.theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Terang
              </button>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'dark' }))}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  localSettings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
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

  return (
    <div className={`min-h-screen flex ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {isSidebarOpen && <h1 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{settings.school_name || 'Sistem Absensi'}</h1>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg ${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {/* DASHBOARD */}
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' // Saat Aktif (Biru & Putih)
                    : settings.theme === 'dark' 
                      ? 'text-white hover:bg-gray-700' // Saat Tidak Aktif & Mode Gelap (PUTIH)
                      : 'text-gray-600 hover:bg-gray-100' // Saat Tidak Aktif & Mode Terang (Abu-abu)
                }`}
              >
                <UserCheck className="w-5 h-5" /> 
                {isSidebarOpen && <span>Dashboard</span>}
              </button>
            </li>

            {/* ABSENSI */}
            <li>
              <button 
                onClick={() => setActiveTab('attendance')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'attendance' 
                    ? 'bg-blue-600 text-white' 
                    : settings.theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" /> 
                {isSidebarOpen && <span>Absensi</span>}
              </button>
            </li>

            {/* LAPORAN */}
            <li>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : settings.theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" /> 
                {isSidebarOpen && <span>Laporan</span>}
              </button>
            </li>

            {/* PENGATURAN */}
            <li>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-600 text-white' 
                    : settings.theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" /> 
                {isSidebarOpen && <span>Pengaturan</span>}
              </button>
            </li>

            {/* JADWAL GURU */}
            <li>
              <button 
                onClick={() => setActiveTab('schedule')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'schedule' 
                    ? 'bg-blue-600 text-white' 
                    : settings.theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" /> 
                {isSidebarOpen && <span>Jadwal Guru</span>}
              </button>
            </li>

            {/* SISWA BARU */}
            <li>
              <button 
                onClick={() => setActiveTab('newStudents')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === 'newStudents' 
                    ? 'bg-blue-600 text-white' 
                    : settings.theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="w-5 h-5" /> 
                {isSidebarOpen && <span>Siswa Baru</span>}
              </button>
            </li>
          </ul>
        </nav>
        
      <div className="p-4 border-t border-gray-700">
          <button 
            onClick={() => router.push('/login')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-700 ${
              settings.theme === 'dark' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LogOut className="w-5 h-5" /> 
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'attendance' && 'Absensi Siswa'}
              {activeTab === 'reports' && 'Laporan Kehadiran'}
              {activeTab === 'settings' && 'Pengaturan'}
              {activeTab === 'schedule' && 'Jadwal Guru'}
              {activeTab === 'newStudents' && 'Siswa Baru & Pindahan'}
            </h2>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700"><Bell className="w-5 h-5" /></button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                  <p className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Admin</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'schedule' && <TeacherScheduleTab settings={settings} setShowNotification={setShowNotification} />}
          {activeTab === 'newStudents' && (
            <NewStudentsTab 
              students={students}
              setStudents={setStudents}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              setShowNotification={setShowNotification}
            />
          )}
        </main>
      </div>
      
      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
            settings.theme === 'dark' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{notificationMessage}</span> 
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  return (
    <ModernAttendanceSystem />
  );
}