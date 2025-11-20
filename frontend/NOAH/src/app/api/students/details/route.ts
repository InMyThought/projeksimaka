import { NextResponse } from 'next/server';
import { DataManager } from '../../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/students/details - Get all students with detailed information
export async function GET() {
  try {
    const students = dataManager.getStudents();
    
    // Add detailed information to each student
    const studentsWithDetails = students.map(student => ({
      ...student,
      violations: student.violations || 0,
      achievements: student.achievements || 0,
      // Sample violations data
      recentViolations: [
        {
          id: 1,
          date: '2025-10-15',
          type: 'Keterlambatan',
          description: 'Terlambat masuk kelas lebih dari 15 menit',
          points: 2
        },
        {
          id: 2,
          date: '2025-09-22',
          type: 'Pelanggaran Seragam',
          description: 'Tidak memakai dasi sekolah',
          points: 1
        }
      ].slice(0, student.violations || 0),
      // Sample achievements data
      recentAchievements: [
        {
          id: 1,
          date: '2025-10-05',
          type: 'Akademik',
          description: 'Peringkat 1 ujian matematika',
          points: 10
        },
        {
          id: 2,
          date: '2025-09-18',
          type: 'Olahraga',
          description: 'Juara 2 lomba renang antar kelas',
          points: 8
        },
        {
          id: 3,
          date: '2025-08-30',
          type: 'Sikap',
          description: 'Siswa teladan bulan Agustus',
          points: 5
        }
      ].slice(0, student.achievements || 0)
    }));

    return NextResponse.json({ students: studentsWithDetails });
  } catch (error) {
    console.error('Error in GET /api/students/details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}