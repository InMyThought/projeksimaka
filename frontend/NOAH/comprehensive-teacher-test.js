// Comprehensive test script for teacher schedule functionality

async function runComprehensiveTeacherTest() {
  try {
    console.log('=== Comprehensive Teacher Schedule Test ===');
    
    // Test 1: Get all teachers
    console.log('\n1. Testing GET /api/teachers');
    const teachersResponse = await fetch('/api/teachers');
    console.log('Status:', teachersResponse.status);
    
    if (teachersResponse.status !== 200) {
      console.error('Failed to get teachers');
      return;
    }
    
    const teachersData = await teachersResponse.json();
    console.log('Teachers data:', JSON.stringify(teachersData, null, 2));
    
    if (!teachersData.teachers || teachersData.teachers.length === 0) {
      console.log('No teachers found, creating a new teacher...');
      
      // Test creating a teacher
      const newTeacher = {
        name: 'Test Teacher',
        subject: 'Test Subject'
      };
      
      const createResponse = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeacher),
      });
      
      console.log('Create teacher status:', createResponse.status);
      const createData = await createResponse.json();
      console.log('Create teacher response:', createData);
      
      if (!createData.success) {
        console.error('Failed to create teacher');
        return;
      }
      
      // Get teachers again
      const teachersResponse2 = await fetch('/api/teachers');
      const teachersData2 = await teachersResponse2.json();
      console.log('Teachers after creation:', teachersData2);
    }
    
    // Get the first teacher
    const teacher = teachersData.teachers[0];
    console.log(`\n2. Selected teacher: ${teacher.name} (ID: ${teacher.id})`);
    
    // Test 2: Get teacher schedule
    console.log('\n3. Testing GET /api/teachers/[id]/schedule');
    const scheduleResponse = await fetch(`/api/teachers/${teacher.id}/schedule`);
    console.log('Schedule status:', scheduleResponse.status);
    
    if (scheduleResponse.status !== 200) {
      console.error('Failed to get teacher schedule');
      return;
    }
    
    const scheduleData = await scheduleResponse.json();
    console.log('Schedule data:', JSON.stringify(scheduleData, null, 2));
    
    // Test 3: Update teacher schedule
    console.log('\n4. Testing PUT /api/teachers/[id]/schedule');
    
    // Create updated schedule
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
    
    console.log('Update schedule status:', updateResponse.status);
    const updateData = await updateResponse.json();
    console.log('Update schedule response:', JSON.stringify(updateData, null, 2));
    
    if (updateData.success) {
      console.log('\n5. Schedule updated successfully!');
      
      // Test 4: Verify the update
      console.log('\n6. Verifying updated schedule...');
      const verifyResponse = await fetch(`/api/teachers/${teacher.id}/schedule`);
      const verifyData = await verifyResponse.json();
      console.log('Verified schedule:', JSON.stringify(verifyData, null, 2));
      
      console.log('\n=== Test completed successfully! ===');
    } else {
      console.log('Failed to update schedule:', updateData.error);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the comprehensive test
runComprehensiveTeacherTest();