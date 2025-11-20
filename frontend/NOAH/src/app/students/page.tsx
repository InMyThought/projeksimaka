'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Filter, UserPlus, ArrowRightLeft, CheckCircle, Clock, XCircle, Shield, Heart } from 'lucide-react';
import { getStudents } from '@/utils/api';
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
  violations?: number;
  achievements?: number;
}

const StudentListPage = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await getStudents();
        setStudents(response.students);
        setFilteredStudents(response.students);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.nis.includes(query)
      );
    }
    
    // Apply class filter
    if (selectedClass !== 'all') {
      result = result.filter(student => student.class === selectedClass);
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter(student => student.type === selectedType);
    }
    
    setFilteredStudents(result);
  }, [searchQuery, selectedClass, selectedType, students]);

  const getStudentTypeBadge = (type: string) => {
    if (type === 'new') {
      return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        settings.theme === 'dark' 
          ? 'bg-green-900/30 text-green-400 border border-green-800' 
          : 'bg-green-100 text-green-700'
      }`}>
        <UserPlus className="w-3 h-3" />
        Baru
      </span>;
    } else if (type === 'transfer') {
      return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        settings.theme === 'dark' 
          ? 'bg-orange-900/30 text-orange-400 border border-orange-800' 
          : 'bg-orange-100 text-orange-700'
      }`}>
        <ArrowRightLeft className="w-3 h-3" />
        Pindahan
      </span>;
    }
    return null;
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

  if (loading) {
    return (
      <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className={`flex items-center ${settings.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mr-4`}
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Kembali
            </button>
            <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Daftar Siswa</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md p-6 mb-8 border`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cari Siswa</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  placeholder="Nama atau NIS..."
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
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
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
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <option value="all">Semua Tipe</option>
                <option value="existing">Siswa Lama</option>
                <option value="new">Siswa Baru</option>
                <option value="transfer">Siswa Pindahan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-md overflow-hidden border`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Siswa</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kehadiran</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${settings.theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={settings.theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {student.photo}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{student.name}</div>
                          <div className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{student.nis}</div>
                        </div>
                        {getStudentTypeBadge(student.type)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        settings.theme === 'dark' 
                          ? getDarkModeStatusColor(student.status) 
                          : getStatusColor(student.status)
                      }`}>
                        {getStatusText(student.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {student.time}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${student.attendance}%` }}
                          ></div>
                        </div>
                        <span>{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/students/${student.id}`)}
                        className={`px-3 py-1 rounded-md text-sm ${
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
      </main>
    </div>
  );
};

export default StudentListPage;