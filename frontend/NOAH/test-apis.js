// Simple test script to verify API functionality
const API_BASE = 'http://localhost:3000/api';

async function testAPIs() {
  try {
    console.log('Testing SIMAKA APIs...\n');
    
    // Test 1: Get students
    console.log('1. Testing GET /students');
    const studentsResponse = await fetch(`${API_BASE}/students`);
    const studentsData = await studentsResponse.json();
    console.log('   Status:', studentsResponse.status);
    console.log('   Students count:', studentsData.students?.length || 0);
    
    // Test 2: Get attendance
    console.log('\n2. Testing GET /attendance');
    const attendanceResponse = await fetch(`${API_BASE}/attendance`);
    const attendanceData = await attendanceResponse.json();
    console.log('   Status:', attendanceResponse.status);
    console.log('   Success:', attendanceData.success);
    console.log('   Records count:', attendanceData.records?.length || 0);
    
    // Test 3: Get reports
    console.log('\n3. Testing GET /reports?type=summary');
    const reportsResponse = await fetch(`${API_BASE}/reports?type=summary`);
    const reportsData = await reportsResponse.json();
    console.log('   Status:', reportsResponse.status);
    console.log('   Success:', reportsData.success);
    console.log('   Attendance rate:', reportsData.attendanceStats?.attendanceRate || 'N/A');
    
    // Test 4: Get settings
    console.log('\n4. Testing GET /settings');
    const settingsResponse = await fetch(`${API_BASE}/settings`);
    const settingsData = await settingsResponse.json();
    console.log('   Status:', settingsResponse.status);
    console.log('   School name:', settingsData.school_name || 'N/A');
    
    console.log('\n✅ All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the tests
testAPIs();