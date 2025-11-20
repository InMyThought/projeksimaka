import { NextResponse } from 'next/server';
import { Student } from '../../../types/student';
import { DataManager } from '../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/attendance - Get attendance records with optional filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const classFilter = searchParams.get('class');
  const searchQuery = searchParams.get('search');

  // Get all students from data manager
  let filteredStudents = dataManager.getStudents();

  // Apply class filter
  if (classFilter && classFilter !== 'all') {
    filteredStudents = filteredStudents.filter((student: Student) => student.class === classFilter);
  }

  // Apply search filter
  if (searchQuery) {
    filteredStudents = filteredStudents.filter((student: Student) => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.nis.includes(searchQuery)
    );
  }

  // Calculate stats using data manager
  const stats = dataManager.calculateAttendanceStats();

  return NextResponse.json({ 
    success: true,
    date,
    records: filteredStudents,
    stats
  });
}

// PUT /api/attendance - Update attendance status for a student
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentId, newStatus } = body;

    // Validate input
    if (!studentId || !newStatus) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID and new status are required' 
      }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ['hadir', 'terlambat', 'tidak-hadir', 'izin', 'sakit'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid status value. Must be one of: hadir, terlambat, tidak-hadir, izin, sakit' 
      }, { status: 400 });
    }

    // Update student status using data manager
    const currentTime = newStatus === 'hadir' || newStatus === 'terlambat' 
      ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
      : '-';
    
    const success = dataManager.updateStudentAttendance(studentId, newStatus, currentTime);
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student not found' 
      }, { status: 404 });
    }

    // Get updated student
    const updatedStudent = dataManager.getStudentById(studentId);
    
    // Get updated stats
    const updatedStats = dataManager.calculateAttendanceStats();
    const studentCategories = dataManager.calculateStudentCategories();

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance status updated successfully',
      student: updatedStudent,
      stats: updatedStats,
      categories: studentCategories
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}