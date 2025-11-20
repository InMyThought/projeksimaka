// src/utils/djangoApi.ts

// URL Backend Django Anda
const API_BASE_URL = 'http://localhost:8000/api';

export interface Student {
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
}

// Mengambil semua data siswa dari Django
export const fetchStudentsFromDjango = async (): Promise<Student[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/`, {
      cache: 'no-store', // Pastikan data selalu fresh
    });
    if (!res.ok) throw new Error('Gagal mengambil data dari Django');
    const data = await res.json();
    return data.students;
  } catch (error) {
    console.error("Django API Error:", error);
    return [];
  }
};

// Update Absensi ke Django
export const updateAttendanceToDjango = async (studentId: number, newStatus: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId, newStatus }),
    });

    if (!res.ok) throw new Error('Gagal update absensi');
    return await res.json();
  } catch (error) {
    console.error("Update Error:", error);
    throw error;
  }
};