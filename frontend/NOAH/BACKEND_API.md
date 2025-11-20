# Backend API Documentation

This document outlines the backend API structure for the attendance system.

## API Endpoints

### Students API

#### GET /api/students
Retrieve all students with optional filtering.

**Query Parameters:**
- `class` (string): Filter by class
- `search` (string): Search by name or NIS
- `type` (string): Filter by student type (existing, new, transfer)

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "nis": "2024001",
      "name": "Ahmad Fauzi",
      "class": "XII-IPA-1",
      "status": "hadir",
      "time": "07:15",
      "photo": "AF",
      "attendance": 95,
      "late": 2,
      "absent": 1,
      "permission": 2,
      "type": "existing"
    }
  ]
}
```

#### POST /api/students
Add a new student.

**Request Body:**
```json
{
  "nis": "2024011",
  "name": "Budi Hartono",
  "class": "X-IPA-2",
  "type": "new"
}
```

**Response:**
```json
{
  "success": true,
  "student": {
    "id": 14,
    "nis": "2024011",
    "name": "Budi Hartono",
    "class": "X-IPA-2",
    "status": "hadir",
    "time": "-",
    "photo": "BH",
    "attendance": 100,
    "late": 0,
    "absent": 0,
    "permission": 0,
    "type": "new"
  }
}
```

### Attendance API

#### GET /api/attendance
Get attendance records with optional filtering.

**Query Parameters:**
- `date` (string): Filter by date (YYYY-MM-DD)
- `class` (string): Filter by class
- `search` (string): Search by name or NIS

**Response:**
```json
{
  "date": "2025-11-08",
  "records": [...],
  "stats": {
    "totalStudents": 13,
    "present": 7,
    "absent": 1,
    "late": 2,
    "permission": 3,
    "attendanceRate": 89.1
  }
}
```

#### PUT /api/attendance
Update attendance status for a student.

**Request Body:**
```json
{
  "studentId": 1,
  "newStatus": "terlambat"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance status updated successfully",
  "student": {
    "id": 1,
    "nis": "2024001",
    "name": "Ahmad Fauzi",
    "class": "XII-IPA-1",
    "status": "terlambat",
    "time": "07:45",
    "photo": "AF",
    "attendance": 95,
    "late": 2,
    "absent": 1,
    "permission": 2,
    "type": "existing"
  }
}
```

### Settings API

#### GET /api/settings
Get system settings.

**Response:**
```json
{
  "school_name": "SMAN 1 Jakarta",
  "academic_year": "2025/2026",
  "semester": "Ganjil",
  "start_time": "07:00",
  "end_time": "15:00",
  "notifications": true,
  "language": "id",
  "theme": "light"
}
```

#### PUT /api/settings
Update system settings.

**Request Body:**
```json
{
  "school_name": "SMAN 1 Jakarta",
  "academic_year": "2025/2026",
  "semester": "Ganjil",
  "start_time": "07:00",
  "end_time": "15:00",
  "notifications": true,
  "language": "id",
  "theme": "light"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Reports API

#### GET /api/reports
Get reports with different types and filters.

**Query Parameters:**
- `type` (string): Report type (summary, performance, detailed, class)
- `period` (string, optional): Report period (daily, weekly, monthly)
- `class` (string, optional): Filter by class

**Response (summary):**
```json
{
  "attendanceStats": {
    "present": 285,
    "late": 12,
    "absent": 15,
    "permission": 8,
    "attendanceRate": 89.1
  },
  "studentCategories": {
    "totalStudents": 320,
    "newStudents": 25,
    "transferStudents": 8,
    "existingStudents": 287
  },
  "topPerformers": [...],
  "classDistribution": [...]
}
```

**Response (detailed):**
```json
{
  "reportTitle": "Laporan Kehadiran Siswa",
  "generatedAt": "2025-11-08T10:30:00.000Z",
  "period": "Mingguan",
  "totalStudents": 320,
  "attendanceRate": 89.1,
  "detailedStats": [
    {
      "id": 1,
      "nis": "2024001",
      "name": "Ahmad Fauzi",
      "class": "XII-IPA-1",
      "currentStatus": "hadir",
      "currentTime": "07:15",
      "attendancePercentage": 95,
      "weeklyHistory": [...],
      "monthlySummary": {...}
    }
  ]
}
```

**Response (class):**
```json
{
  "reportTitle": "Laporan Kehadiran per Kelas",
  "generatedAt": "2025-11-08T10:30:00.000Z",
  "classReport": [
    {
      "class": "X-IPA-1",
      "totalStudents": 30,
      "present": 28,
      "late": 1,
      "absent": 0,
      "permission": 1,
      "averageAttendance": 96.7
    }
  ]
}
```

#### POST /api/reports/export
Export reports in different formats.

**Request Body:**
```json
{
  "format": "excel", // or "pdf"
  "data": { 
    "type": "attendance",
    "reportType": "summary" // or "detailed" or "class"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Laporan berhasil diekspor dalam format excel",
  "reportMetadata": {
    "title": "Laporan Ringkasan Kehadiran",
    "generatedAt": "2025-11-08T10:30:00.000Z",
    "period": "Mingguan",
    "totalStudents": 320,
    "fileType": "excel"
  },
  "downloadUrl": "/downloads/report-1731081600000.xlsx"
}
```

## Database Schema

### Students Table
```sql
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nis VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(20) NOT NULL,
    photo VARCHAR(10),
    enrollment_date DATE,
    student_type ENUM('existing', 'new', 'transfer') DEFAULT 'existing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Attendance Records Table
```sql
CREATE TABLE attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('hadir', 'terlambat', 'tidak-hadir', 'izin', 'sakit') NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_date (student_id, date)
);
```

### Settings Table
```sql
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notifications BOOLEAN DEFAULT TRUE,
    language VARCHAR(5) DEFAULT 'id',
    theme VARCHAR(10) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period VARCHAR(20),
    filters JSON,
    data JSON,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Notes

1. All API routes are implemented using Next.js App Router API routes
2. Data is currently stored in-memory for demonstration purposes
3. In a production environment, this would be connected to a database
4. Authentication and authorization should be added for security
5. Input validation should be implemented for all endpoints
6. See [REPORTS_API.md](REPORTS_API.md) for detailed documentation on the reports API