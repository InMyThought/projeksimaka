import { NextResponse } from 'next/server';
import { DataManager } from '../../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/students/violations - Get all students with violations data
export async function GET() {
  try {
    const students = dataManager.getStudents();
    
    // Add violations and achievements data to each student
    const studentsWithDetails = students.map(student => ({
      ...student,
      violations: student.violations || 0,
      achievements: student.achievements || 0
    }));

    return NextResponse.json({ students: studentsWithDetails });
  } catch (error) {
    console.error('Error in GET /api/students/violations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}