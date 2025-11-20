// Simple test script to verify teacher schedule API functionality

async function testTeacherScheduleAPI() {
  try {
    console.log('Testing teacher schedule API...');
    
    // Get all teachers
    console.log('1. Getting all teachers...');
    const teachersResponse = await fetch('/api/teachers');
    const teachersData = await teachersResponse.json();
    console.log('Teachers:', teachersData);
    
    if (!teachersData.teachers || teachersData.teachers.length === 0) {
      console.log('No teachers found');
      return;
    }
    
    const teacher = teachersData.teachers[0];
    console.log(`2. Selected teacher: ${teacher.name} (ID: ${teacher.id})`);
    
    // Get teacher's current schedule
    console.log('3. Getting teacher schedule...');
    const scheduleResponse = await fetch(`/api/teachers/${teacher.id}/schedule`);
    const scheduleData = await scheduleResponse.json();
    console.log('Current schedule:', scheduleData);
    
    // Update teacher's schedule
    console.log('4. Updating teacher schedule...');
    const newScheduleItem = {
      id: Date.now(),
      day: 'Senin',
      startTime: '08:00',
      endTime: '09:00',
      class: 'X-IPA-1',
      room: 'Ruang 101'
    };
    
    const updatedSchedule = scheduleData.schedule ? [...scheduleData.schedule, newScheduleItem] : [newScheduleItem];
    
    const updateResponse = await fetch(`/api/teachers/${teacher.id}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedSchedule),
    });
    
    const updateData = await updateResponse.json();
    console.log('Update response:', updateData);
    
    if (updateData.success) {
      console.log('5. Schedule updated successfully!');
      
      // Verify the update
      console.log('6. Verifying updated schedule...');
      const verifyResponse = await fetch(`/api/teachers/${teacher.id}/schedule`);
      const verifyData = await verifyResponse.json();
      console.log('Verified schedule:', verifyData);
      
      console.log('Test completed successfully!');
    } else {
      console.log('Failed to update schedule:', updateData.error);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testTeacherScheduleAPI();