import { NextResponse } from 'next/server';
import { DataManager } from '../../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/students/[id] - Get a specific student by ID with detailed information
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('API Route: GET /api/students/[id] called');
    
    // Unwrap the params promise using await
    const { id } = await params;
    console.log('Received ID parameter:', id);
    
    const studentId = parseInt(id, 10); // Add radix parameter for clarity
    
    // Check if the ID is a valid number
    if (isNaN(studentId)) {
      console.error('Invalid student ID provided:', id);
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }
    
    console.log('Parsed student ID:', studentId);
    
    const student = dataManager.getStudentById(studentId);
    
    if (!student) {
      console.log('Student not found for ID:', studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    console.log('Found student:', student);
    
    // Add detailed information to the student
    const studentWithDetails = {
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
        },
        {
          id: 3,
          date: '2025-08-05',
          type: 'Perilaku',
          description: 'Bertindak tidak sopan terhadap guru',
          points: 3
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
        },
        {
          id: 4,
          date: '2025-07-15',
          type: 'Kesenian',
          description: 'Juara 1 lomba menyanyi tingkat sekolah',
          points: 7
        }
      ].slice(0, student.achievements || 0)
    };

    console.log('Returning student with details:', studentWithDetails);
    return NextResponse.json({ student: studentWithDetails });
  } catch (error) {
    console.error('Error in GET /api/students/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}