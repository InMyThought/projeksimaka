// Shared data manager to ensure consistency across all API routes
import { Student } from '../types/student';

interface Settings {
  school_name: string;
  academic_year: string;
  semester: string;
  start_time: string;
  end_time: string;
  notifications: boolean;
  language: string;
  theme: string;
}

// Centralized data storage
export class DataManager {
  private static instance: DataManager;
  private students: (Student & { violations?: number; achievements?: number })[];
  private settings: Settings;

  private constructor() {
    // Initialize with default data
    this.students = [
      { id: 1, nis: '2024001', name: 'Ahmad Fauzi', class: 'XII-IPA-1', status: 'hadir', time: '07:15', photo: 'AF', attendance: 95, late: 2, absent: 1, permission: 2, type: 'existing', violations: 1, achievements: 3 },
      { id: 2, nis: '2024002', name: 'Siti Nurhaliza', class: 'XII-IPA-1', status: 'hadir', time: '07:10', photo: 'SN', attendance: 98, late: 1, absent: 0, permission: 1, type: 'existing', violations: 0, achievements: 5 },
      { id: 3, nis: '2024003', name: 'Budi Santoso', class: 'XII-IPA-2', status: 'terlambat', time: '07:45', photo: 'BS', attendance: 92, late: 5, absent: 2, permission: 1, type: 'existing', violations: 3, achievements: 1 },
      { id: 4, nis: '2024004', name: 'Dewi Anggraini', class: 'XII-IPS-1', status: 'izin', time: '-', photo: 'DA', attendance: 96, late: 1, absent: 1, permission: 3, type: 'existing', violations: 2, achievements: 4 },
      { id: 5, nis: '2024005', name: 'Eko Prasetyo', class: 'XII-IPA-2', status: 'tidak-hadir', time: '-', photo: 'EP', attendance: 88, late: 3, absent: 5, permission: 2, type: 'existing', violations: 5, achievements: 0 },
      { id: 6, nis: '2024006', name: 'Fitri Handayani', class: 'XII-IPS-1', status: 'hadir', time: '07:20', photo: 'FH', attendance: 97, late: 2, absent: 1, permission: 1, type: 'existing', violations: 1, achievements: 6 },
      { id: 7, nis: '2024007', name: 'Galih Pratama', class: 'XII-IPA-1', status: 'hadir', time: '07:05', photo: 'GP', attendance: 99, late: 0, absent: 0, permission: 1, type: 'existing', violations: 0, achievements: 7 },
      { id: 8, nis: '2024008', name: 'Hani Wijaya', class: 'XII-IPS-2', status: 'sakit', time: '-', photo: 'HW', attendance: 94, late: 2, absent: 2, permission: 4, type: 'existing', violations: 2, achievements: 2 },
      { id: 9, nis: '2025001', name: 'Rina Permata', class: 'X-IPA-1', status: 'hadir', time: '07:08', photo: 'RP', attendance: 100, late: 0, absent: 0, permission: 0, type: 'new', violations: 0, achievements: 1 },
      { id: 10, nis: '2025002', name: 'Dimas Setiawan', class: 'X-IPA-1', status: 'hadir', time: '07:12', photo: 'DS', attendance: 100, late: 0, absent: 0, permission: 0, type: 'new', violations: 1, achievements: 2 },
      { id: 11, nis: '2025003', name: 'Nina Putri', class: 'X-IPS-1', status: 'terlambat', time: '07:40', photo: 'NP', attendance: 80, late: 1, absent: 0, permission: 0, type: 'new', violations: 2, achievements: 0 },
      { id: 12, nis: '2024009', name: 'Andi Wijaya', class: 'XII-IPA-1', status: 'hadir', time: '07:22', photo: 'AW', attendance: 90, late: 1, absent: 1, permission: 1, type: 'transfer', violations: 1, achievements: 3 },
      { id: 13, nis: '2024010', name: 'Maya Sari', class: 'XII-IPS-1', status: 'izin', time: '-', photo: 'MS', attendance: 85, late: 2, absent: 1, permission: 2, type: 'transfer', violations: 3, achievements: 2 },
    ];
    
    this.settings = {
      school_name: 'SMAN 1 Jakarta',
      academic_year: '2025/2026',
      semester: 'Ganjil',
      start_time: '07:00',
      end_time: '15:00',
      notifications: true,
      language: 'id',
      theme: 'light'
    };
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Student methods
  public getStudents(): Student[] {
    return this.students.map(student => ({
      ...student,
      violations: student.violations || 0,
      achievements: student.achievements || 0
    }));
  }

  public getStudentById(id: number): Student | undefined {
    const student = this.students.find(student => student.id === id);
    if (student) {
      return {
        ...student,
        violations: student.violations || 0,
        achievements: student.achievements || 0
      };
    }
    return undefined;
  }

  public updateStudentAttendance(studentId: number, newStatus: string, newTime: string): boolean {
    const studentIndex = this.students.findIndex(student => student.id === studentId);
    if (studentIndex === -1) return false;
    
    // Update attendance statistics based on new status
    const student = this.students[studentIndex];
    let updatedLate = student.late;
    let updatedAbsent = student.absent;
    let updatedPermission = student.permission;
    
    // Adjust statistics based on previous and new status
    // Decrease previous status count
    switch (student.status) {
      case 'hadir':
        // For present, we don't need to adjust anything as it's the base state
        break;
      case 'terlambat':
        updatedLate = Math.max(0, updatedLate - 1);
        break;
      case 'tidak-hadir':
        updatedAbsent = Math.max(0, updatedAbsent - 1);
        break;
      case 'izin':
      case 'sakit':
        updatedPermission = Math.max(0, updatedPermission - 1);
        break;
    }
    
    // Increase new status count
    switch (newStatus) {
      case 'hadir':
        // For present, we don't need to adjust anything as it's the base state
        break;
      case 'terlambat':
        updatedLate = updatedLate + 1;
        break;
      case 'tidak-hadir':
        updatedAbsent = updatedAbsent + 1;
        break;
      case 'izin':
      case 'sakit':
        updatedPermission = updatedPermission + 1;
        break;
    }
    
    // Recalculate attendance percentage based on updated statistics
    // Attendance percentage = (total days - absent - permission) / total days * 100
    // We'll use a fixed total of 100 days for simplicity
    const totalDays = 100;
    const presentDays = totalDays - updatedAbsent - updatedPermission;
    const updatedAttendance = Math.round((presentDays / totalDays) * 100);
    
    this.students[studentIndex] = {
      ...student,
      status: newStatus,
      time: newTime,
      attendance: updatedAttendance,
      late: updatedLate,
      absent: updatedAbsent,
      permission: updatedPermission
    };
    
    return true;
  }

  public addStudent(student: Omit<Student, 'id'>): Student {
    const newId = Math.max(...this.students.map(s => s.id), 0) + 1;
    const newStudent: Student = {
      id: newId,
      ...student
    };
    this.students.push(newStudent);
    return newStudent;
  }

  // Settings methods
  public getSettings(): Settings {
    return { ...this.settings }; // Return a copy to prevent direct mutation
  }

  public updateSettings(newSettings: Partial<Settings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  // Stats calculation methods
  public calculateAttendanceStats() {
    return {
      totalStudents: this.students.length,
      present: this.students.filter(s => s.status === 'hadir').length,
      absent: this.students.filter(s => s.status === 'tidak-hadir').length,
      late: this.students.filter(s => s.status === 'terlambat').length,
      permission: this.students.filter(s => s.status === 'izin' || s.status === 'sakit').length,
      attendanceRate: Math.round((this.students.filter(s => s.status === 'hadir' || s.status === 'terlambat').length / this.students.length) * 1000) / 10
    };
  }

  public calculateStudentCategories() {
    return {
      totalStudents: this.students.length,
      newStudents: this.students.filter(s => s.type === 'new').length,
      transferStudents: this.students.filter(s => s.type === 'transfer').length,
      existingStudents: this.students.filter(s => s.type === 'existing').length
    };
  }

  // Teacher methods
  private teachers: any[] = [
    {
      id: 1,
      name: 'Budi Santoso',
      subject: 'Matematika',
      photo: 'BS',
      schedule: [
        { id: 1, day: 'Senin', startTime: '07:00', endTime: '09:30', class: 'X-IPA-1', room: 'Ruang 101' },
        { id: 2, day: 'Senin', startTime: '09:45', endTime: '12:15', class: 'XI-IPA-2', room: 'Ruang 102' },
        { id: 3, day: 'Selasa', startTime: '07:00', endTime: '09:30', class: 'XII-IPS-1', room: 'Ruang 103' },
        { id: 4, day: 'Selasa', startTime: '09:45', endTime: '12:15', class: 'X-IPS-2', room: 'Ruang 104' },
        { id: 5, day: 'Rabu', startTime: '07:00', endTime: '09:30', class: 'XI-IPS-1', room: 'Ruang 105' }
      ]
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      subject: 'Bahasa Indonesia',
      photo: 'SN',
      schedule: [
        { id: 1, day: 'Senin', startTime: '07:00', endTime: '09:30', class: 'XII-IPA-1', room: 'Ruang 201' },
        { id: 2, day: 'Senin', startTime: '09:45', endTime: '12:15', class: 'X-IPA-2', room: 'Ruang 202' },
        { id: 3, day: 'Rabu', startTime: '07:00', endTime: '09:30', class: 'XI-IPS-2', room: 'Ruang 203' },
        { id: 4, day: 'Rabu', startTime: '09:45', endTime: '12:15', class: 'XII-IPS-1', room: 'Ruang 204' },
        { id: 5, day: 'Kamis', startTime: '07:00', endTime: '09:30', class: 'X-IPS-1', room: 'Ruang 205' }
      ]
    },
    {
      id: 3,
      name: 'Ahmad Fauzi',
      subject: 'Fisika',
      photo: 'AF',
      schedule: [
        { id: 1, day: 'Selasa', startTime: '07:00', endTime: '09:30', class: 'XI-IPA-1', room: 'Ruang 301' },
        { id: 2, day: 'Selasa', startTime: '09:45', endTime: '12:15', class: 'XII-IPA-2', room: 'Ruang 302' },
        { id: 3, day: 'Rabu', startTime: '07:00', endTime: '09:30', class: 'X-IPA-1', room: 'Ruang 303' },
        { id: 4, day: 'Rabu', startTime: '09:45', endTime: '12:15', class: 'XI-IPS-1', room: 'Ruang 304' },
        { id: 5, day: 'Jumat', startTime: '07:00', endTime: '09:30', class: 'XII-IPS-2', room: 'Ruang 305' }
      ]
    },
    // Adding a fourth teacher to prevent 404 errors when teacher ID 4 is requested
    {
      id: 4,
      name: 'Dewi Kartika',
      subject: 'Biologi',
      photo: 'DK',
      schedule: [
        { id: 1, day: 'Senin', startTime: '07:00', endTime: '09:30', class: 'XII-IPA-1', room: 'Ruang 401' },
        { id: 2, day: 'Selasa', startTime: '09:45', endTime: '12:15', class: 'X-IPA-2', room: 'Ruang 402' },
        { id: 3, day: 'Rabu', startTime: '07:00', endTime: '09:30', class: 'XI-IPA-1', room: 'Ruang 403' },
        { id: 4, day: 'Kamis', startTime: '09:45', endTime: '12:15', class: 'XII-IPS-2', room: 'Ruang 404' },
        { id: 5, day: 'Jumat', startTime: '07:00', endTime: '09:30', class: 'X-IPS-1', room: 'Ruang 405' }
      ]
    }
  ];

  public getTeachers(): any[] {
    return this.teachers;
  }

  public addTeacher(teacherData: any): any {
    const newId = Math.max(...this.teachers.map(t => t.id), 0) + 1;
    const newTeacher = {
      id: newId,
      ...teacherData
    };
    this.teachers.push(newTeacher);
    return newTeacher;
  }

  public getTeacherById(id: number): any | undefined {
    return this.teachers.find(teacher => teacher.id === id);
  }

  public updateTeacherSchedule(teacherId: number, scheduleData: any[]): boolean {
    // Validate teacherId
    if (!teacherId || typeof teacherId !== 'number' || teacherId <= 0) {
      console.error('Invalid teacher ID provided to updateTeacherSchedule:', teacherId);
      return false;
    }
    
    const teacherIndex = this.teachers.findIndex(teacher => teacher.id === teacherId);
    if (teacherIndex === -1) {
      console.error(`Teacher with ID ${teacherId} not found`);
      return false;
    }
    
    // Ensure each schedule item has a unique ID
    const scheduleWithIds = scheduleData.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index // Use existing ID or generate a new one
    }));
    
    this.teachers[teacherIndex].schedule = scheduleWithIds;
    return true;
  }
}