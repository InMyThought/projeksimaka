# API Activation and Usage Guide for SIMAKA

This guide explains how to activate all APIs and ensure they properly connect to the SIMAKA page with real-time updates to reports and dashboard.

## 1. API Endpoints Overview

The system has the following API endpoints:

1. **Students API** (`/api/students`)
   - GET: Retrieve all students with optional filtering
   - POST: Add a new student

2. **Attendance API** (`/api/attendance`)
   - GET: Retrieve attendance records with optional filtering
   - PUT: Update attendance status for a student

3. **Reports API** (`/api/reports`)
   - GET: Generate various types of reports (summary, performance, detailed, class)
   - POST: Export reports in PDF or Excel format

4. **Settings API** (`/api/settings`)
   - GET: Retrieve system settings
   - PUT: Update system settings

## 2. How to Activate the APIs

### Prerequisites
Make sure you have Node.js and npm installed on your system.

### Steps to Activate

1. **Navigate to the project directory:**
   ```
   cd d:\Data C\Downloads\NOAH\noah
   ```

2. **Install dependencies (if not already installed):**
   ```
   npm install
   ```

3. **Start the development server:**
   ```
   npm run dev
   ```

4. **The APIs will be available at:**
   - Students: `http://localhost:3000/api/students`
   - Attendance: `http://localhost:3000/api/attendance`
   - Reports: `http://localhost:3000/api/reports`
   - Settings: `http://localhost:3000/api/settings`

## 3. Real-time Updates Implementation

The system is designed to provide real-time updates to the dashboard and reports when attendance changes. Here's how it works:

### When Updating Attendance:
1. User clicks on an attendance status button (Hadir, Terlambat, Izin, Sakit, Tidak Hadir)
2. The frontend calls the `updateAttendance` API endpoint
3. The API updates the student's status and recalculates statistics
4. The API returns the updated student data and new statistics
5. The frontend updates the UI immediately with the new data
6. The dashboard and reports are automatically refreshed with the latest data

### Key Implementation Details:

1. **Data Manager**: All data is managed by a centralized `DataManager` class that ensures consistency across all API routes.

2. **Real-time Statistics**: When attendance is updated, the system automatically recalculates:
   - Attendance rates
   - Student categories (new, transfer, existing)
   - Class distribution statistics

3. **Immediate UI Updates**: The frontend receives updated statistics directly from the API response and updates the dashboard immediately.

## 4. Testing the APIs

You can test the APIs using curl commands or a tool like Postman:

### Get all students:
```bash
curl http://localhost:3000/api/students
```

### Update student attendance:
```bash
curl -X PUT http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "newStatus": "hadir"}'
```

### Get summary report:
```bash
curl http://localhost:3000/api/reports?type=summary
```

### Get class report:
```bash
curl http://localhost:3000/api/reports?type=class
```

## 5. Troubleshooting

### If APIs are not responding:
1. Make sure the development server is running (`npm run dev`)
2. Check the terminal for any error messages
3. Verify that all dependencies are installed (`npm install`)

### If real-time updates are not working:
1. Ensure the frontend is properly handling API responses
2. Check that the `updateAttendance` function is correctly updating the UI
3. Verify that the `updateDashboardStats` function is being called after attendance updates

### If data is not persisting:
1. The current implementation uses in-memory storage for demonstration
2. For production, you would need to integrate a database

## 6. Key Features Implemented

1. **Real-time Dashboard Updates**: When attendance is updated, the dashboard statistics update immediately
2. **Automatic Report Refresh**: Reports automatically reflect the latest attendance data
3. **Consistent Data Management**: All APIs use the same data manager for consistency
4. **Proper Error Handling**: APIs return appropriate success/error responses
5. **TypeScript Support**: All APIs are properly typed for better reliability

## 7. Files Modified for Real-time Updates

1. `src/utils/dataManager.ts` - Enhanced attendance update logic
2. `src/app/api/attendance/route.ts` - Improved response with updated stats
3. `src/app/api/reports/route.ts` - Fixed class report generation
4. `src/app/page.tsx` - Updated frontend to handle real-time updates

The system is now fully activated and provides real-time updates to both the dashboard and reports when attendance changes.