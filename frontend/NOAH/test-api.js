const http = require('http');

// Test the API endpoints
async function testAPI() {
  try {
    // Test students API
    console.log('Testing /api/students...');
    const studentsRes = await fetch('http://localhost:3000/api/students');
    const studentsData = await studentsRes.json();
    console.log('Students API response:', studentsData);
    
    // Test attendance API
    console.log('\nTesting /api/attendance...');
    const attendanceRes = await fetch('http://localhost:3000/api/attendance');
    const attendanceData = await attendanceRes.json();
    console.log('Attendance API response:', attendanceData);
    
    // Test reports API
    console.log('\nTesting /api/reports...');
    const reportsRes = await fetch('http://localhost:3000/api/reports?type=summary');
    const reportsData = await reportsRes.json();
    console.log('Reports API response:', reportsData);
    
    // Test settings API
    console.log('\nTesting /api/settings...');
    const settingsRes = await fetch('http://localhost:3000/api/settings');
    const settingsData = await settingsRes.json();
    console.log('Settings API response:', settingsData);
    
  } catch (error) {
    console.error('Error testing APIs:', error);
  }
}

testAPI();