import { NextResponse } from 'next/server';
import { DataManager } from '../../../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/teachers/[id]/schedule - Get a specific teacher's schedule
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Handle both Promise and resolved params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    // Validate that params exists and has an id property
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
    }
    
    // Parse and validate the teacher ID
    const teacherId = parseInt(resolvedParams.id, 10);
    if (isNaN(teacherId) || teacherId <= 0) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const teacher = dataManager.getTeacherById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: `Teacher with ID ${teacherId} not found` }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      schedule: teacher.schedule || [] 
    });
  } catch (error) {
    console.error('Error in GET /api/teachers/[id]/schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/teachers/[id]/schedule - Update a teacher's schedule
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Handle both Promise and resolved params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    // Validate that params exists and has an id property
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
    }
    
    // Parse and validate the teacher ID
    const teacherId = parseInt(resolvedParams.id, 10);
    if (isNaN(teacherId) || teacherId <= 0) {
      return NextResponse.json({ error: 'Invalid teacher ID: ' + resolvedParams.id }, { status: 400 });
    }

    const body = await request.json();
    const scheduleData = body.schedule || body; // Accept both formats

    const success = dataManager.updateTeacherSchedule(teacherId, scheduleData);
    if (!success) {
      return NextResponse.json({ error: `Teacher with ID ${teacherId} not found` }, { status: 404 });
    }

    const updatedTeacher = dataManager.getTeacherById(teacherId);
    
    return NextResponse.json({ 
      success: true, 
      teacher: updatedTeacher 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/teachers/[id]/schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}