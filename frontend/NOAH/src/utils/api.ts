// // Utility functions for API operations

// export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
//   const baseUrl = '/api';
//   const url = `${baseUrl}${endpoint}`;
  
//   // Log the request for debugging
//   console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
//   const config: RequestInit = {
//     headers: {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     },
//     ...options,
//   };
  
//   try {
//     const response = await fetch(url, config);
    
//     // Log the response for debugging
//     console.log(`API Response: ${response.status} ${response.statusText} for ${url}`);
    
//     // Handle case where response is not JSON
//     const contentType = response.headers.get('content-type');
//     if (contentType && contentType.includes('application/json')) {
//       const data = await response.json();
      
//       if (!response.ok) {
//         const errorMessage = data.message || data.error || `API request failed with status ${response.status}`;
//         console.error('API Error:', errorMessage);
//         throw new Error(`API request failed: ${errorMessage}`);
//       }
      
//       return data;
//     } else {
//       // Handle non-JSON responses
//       const text = await response.text();
//       if (!response.ok) {
//         throw new Error(`API request failed with status ${response.status}: ${text}`);
//       }
//       return text;
//     }
//   } catch (error: any) {
//     console.error('API request error for', url, ':', error);
//     // Provide more detailed error information
//     if (error instanceof TypeError && error.message === 'fetch failed') {
//       throw new Error('Failed to connect to the API. Please make sure the development server is running.');
//     }
//     throw error;
//   }
// }

// export async function getStudents(filters: { class?: string; search?: string; type?: string } = {}) {
//   const params = new URLSearchParams();
  
//   if (filters.class) params.append('class', filters.class);
//   if (filters.search) params.append('search', filters.search);
//   if (filters.type) params.append('type', filters.type);
  
//   const queryString = params.toString() ? `?${params.toString()}` : '';
  
//   return fetchAPI(`/students${queryString}`);
// }

// export async function updateAttendance(studentId: number, newStatus: string) {
//   return fetchAPI('/attendance', {
//     method: 'PUT',
//     body: JSON.stringify({ studentId, newStatus }),
//   });
// }

// export async function addStudent(studentData: any) {
//   return fetchAPI('/students', {
//     method: 'POST',
//     body: JSON.stringify(studentData),
//   });
// }

// export async function getSettings() {
//   return fetchAPI('/settings');
// }

// export async function updateSettings(settings: any) {
//   return fetchAPI('/settings', {
//     method: 'PUT',
//     body: JSON.stringify(settings),
//   });
// }

// export async function getReports(type: string, params: Record<string, string> = {}) {
//   // Create a new URLSearchParams object with the type parameter
//   const searchParams = new URLSearchParams();
//   searchParams.append('type', type);
  
//   // Add any additional parameters
//   Object.entries(params).forEach(([key, value]) => {
//     searchParams.append(key, value);
//   });
  
//   // Construct the full URL with query parameters
//   const queryString = searchParams.toString();
//   const url = queryString ? `/reports?${queryString}` : '/reports';
  
//   return fetchAPI(url);
// }

// export async function exportReport(format: string, data: any) {
//   return fetchAPI('/reports', {
//     method: 'POST',
//     body: JSON.stringify({ format, data }),
//   });
// }

// // Add function to fetch student details by ID
// export async function getStudentById(id: number) {
//   return fetchAPI(`/students/${id}`);
// }

// // Teacher schedule functions
// export async function getTeachers() {
//   return fetchAPI('/teachers');
// }

// export async function getTeacherSchedule(teacherId: number) {
//   return fetchAPI(`/teachers/${teacherId}/schedule`);
// }

// export async function addTeacher(teacherData: any) {
//   return fetchAPI('/teachers', {
//     method: 'POST',
//     body: JSON.stringify(teacherData),
//   });
// }

// export async function updateTeacherSchedule(teacherId: number, scheduleData: any) {
//   // Validate inputs
//   if (!teacherId || typeof teacherId !== 'number' || teacherId <= 0) {
//     throw new Error(`Invalid teacher ID: ${teacherId}. Teacher ID must be a positive number.`);
//   }
  
//   if (!Array.isArray(scheduleData)) {
//     throw new Error('Schedule data must be an array.');
//   }
  
//   return fetchAPI(`/teachers/${teacherId}/schedule`, {
//     method: 'PUT',
//     body: JSON.stringify(scheduleData),
//   });
// }

// src/utils/api.ts

// Ganti URL ini sesuai port Django Anda
// src/utils/api.ts

const DJANGO_API_URL = 'http://localhost:8000/api';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${DJANGO_API_URL}${endpoint}`;
  console.log(`Request: ${options.method || 'GET'} ${url}`);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content (sukses delete biasanya 204)
    if (response.status === 204) {
        return { success: true };
    }

    if (!response.ok) {
      // Coba baca error message dari backend jika ada
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Connection error:', error);
    throw error;
  }
}

// --- Siswa ---
export async function getStudents(filters: { class?: string; search?: string; type?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.class) params.append('class', filters.class);
  if (filters.search) params.append('search', filters.search);
  if (filters.type) params.append('type', filters.type);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return fetchAPI(`/students/${queryString}`);
}

// Fungsi DELETE Baru
export async function deleteStudent(id: number) {
  return fetchAPI(`/students/${id}/`, {
    method: 'DELETE',
  });
}

export async function addStudent(studentData: any) {
  return fetchAPI('/students/', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
}

// --- Absensi & Laporan ---
export async function updateAttendance(studentId: number, newStatus: string) {
  return fetchAPI('/attendance/', {
    method: 'PUT',
    body: JSON.stringify({ studentId, newStatus }),
  });
}

export async function getReports(type: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams();
  searchParams.append('type', type);
  const queryString = searchParams.toString();
  return fetchAPI(`/reports/?${queryString}`);
}

// Fungsi Export Baru
export async function exportReport(format: string, data: any) {
  return fetchAPI('/reports/export/', {
    method: 'POST',
    body: JSON.stringify({ format, data }),
  });
}

// --- Settings & Teachers ---
export async function getSettings() {
  return fetchAPI('/settings/');
}

export async function updateSettings(settings: any) {
  return fetchAPI('/settings/', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function getTeachers() {
  // Memanggil endpoint Django: GET /api/teachers/
  return fetchAPI('/teachers/');
}

export async function getStudentById(id: number) {
  const data = await getStudents();
  const student = data.students.find((s: any) => s.id === id);
  return { student };
}

// Placeholder Functions untuk menghindari error import
// src/utils/api.ts

// ... (fungsi lain biarkan) ...

// Ambil jadwal guru dari database
export async function getTeacherSchedule(teacherId: number) {
  // Panggil endpoint detail guru: GET /api/teachers/1/
  const data = await fetchAPI(`/teachers/${teacherId}/`);
  // Backend mengembalikan object teacher yang punya properti 'schedule'
  return { schedule: data.schedule || [] };
}

// Simpan jadwal ke database
export async function updateTeacherSchedule(teacherId: number, scheduleData: any) {
  // Panggil endpoint update guru: PUT /api/teachers/1/
  // Kita kirim object JSON dengan key 'schedule'
  return fetchAPI(`/teachers/${teacherId}/`, {
    method: 'PUT',
    body: JSON.stringify({ schedule: scheduleData }),
  });
}
export async function addTeacher(teacherData: any) {
  // Memanggil endpoint Django: POST /api/teachers/
  return fetchAPI('/teachers/', {
    method: 'POST',
    body: JSON.stringify(teacherData),
  });
}
