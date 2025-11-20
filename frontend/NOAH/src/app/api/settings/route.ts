import { NextResponse } from 'next/server';
import { DataManager } from '../../../utils/dataManager';

const dataManager = DataManager.getInstance();

// GET /api/settings - Get system settings
export async function GET() {
  const settings = dataManager.getSettings();
  return NextResponse.json(settings);
}

// PUT /api/settings - Update system settings
export async function PUT(request: Request) {
  const body = await request.json();
  
  // Update settings using data manager
  dataManager.updateSettings(body);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Settings updated successfully'
  });
}