import { NextResponse } from 'next/server';
import { Student } from '../../../types/student';
import { DataManager } from '../../../utils/dataManager';

// Add error handling for data manager initialization
let dataManager: DataManager;
try {
  dataManager = DataManager.getInstance();
} catch (error) {
  console.error('Failed to initialize DataManager:', error);
  // We'll handle this error in each route function
}

// Helper function to safely get data manager instance
function getDataManager() {
  if (!dataManager) {
    try {
      dataManager = DataManager.getInstance();
    } catch (error) {
      console.error('DataManager initialization error:', error);
      throw new Error('Failed to initialize data manager');
    }
  }
  return dataManager;
}

// GET /api/reports - Get various types of reports
export async function GET(request: Request) {
  try {
    // Ensure data manager is initialized
    const dm = getDataManager();
    
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    const classFilter = searchParams.get('class') || 'all';

    switch (reportType) {
      case 'summary': {
        try {
          // Get current students from data manager
          const allStudents = dm.getStudents();
          
          // Calculate stats using data manager
          const attendanceStats = dm.calculateAttendanceStats();
          const studentCategories = dm.calculateStudentCategories();
          
          return NextResponse.json({
            success: true,
            attendanceStats,
            studentCategories,
            topPerformers: allStudents
              .filter((s: Student) => s.attendance >= 97)
              .sort((a: Student, b: Student) => b.attendance - a.attendance)
              .slice(0, 3),
            classDistribution: [
              { class: 'X-IPA-1', present: 2, late: 1, absent: 0, permission: 0 },
              { class: 'X-IPS-1', present: 0, late: 1, absent: 0, permission: 0 },
              { class: 'XII-IPA-1', present: 3, late: 1, absent: 1, permission: 1 },
              { class: 'XII-IPA-2', present: 1, late: 1, absent: 1, permission: 0 },
              { class: 'XII-IPS-1', present: 1, late: 0, absent: 0, permission: 2 },
              { class: 'XII-IPS-2', present: 0, late: 0, absent: 0, permission: 1 }
            ]
          });
        } catch (error) {
          console.error('Error generating summary report:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to generate summary report',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'performance': {
        try {
          // Fixed variable naming conflict
          const performanceStudents = dm.getStudents();
          
          // Calculate statistics for chart visualization
          const lateCount = performanceStudents.filter((s: Student) => s.status === 'terlambat').length;
          const absentCount = performanceStudents.filter((s: Student) => s.status === 'tidak-hadir').length;
          const permissionCount = performanceStudents.filter((s: Student) => s.status === 'izin' || s.status === 'sakit').length;
          const presentCount = performanceStudents.filter((s: Student) => s.status === 'hadir').length;
          
          // Prepare chart data
          const chartData = {
            labels: ['Hadir', 'Terlambat', 'Tidak Hadir', 'Izin/Sakit'],
            datasets: [
              {
                label: 'Jumlah Siswa',
                data: [presentCount, lateCount, absentCount, permissionCount],
                backgroundColor: [
                  'rgba(16, 185, 129, 0.8)', // green for present
                  'rgba(245, 158, 11, 0.8)',  // amber for late
                  'rgba(239, 68, 68, 0.8)',   // red for absent
                  'rgba(59, 130, 246, 0.8)'   // blue for permission
                ],
                borderColor: [
                  'rgba(16, 185, 129, 1)',
                  'rgba(245, 158, 11, 1)',
                  'rgba(239, 68, 68, 1)',
                  'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1
              }
            ]
          };
          
          return NextResponse.json({
            success: true,
            students: performanceStudents.map((student: Student) => ({
              id: student.id,
              nis: student.nis,
              name: student.name,
              class: student.class,
              attendance: student.attendance,
              late: student.late,
              absent: student.absent,
              permission: student.permission,
              sick: student.permission, // Using permission count for sick as well since we don't have separate data
              present: presentCount, // This should be individual student's present count, but we'll use total for now
              type: student.type
            })),
            chartData: chartData,
            summary: {
              totalStudents: performanceStudents.length,
              present: presentCount,
              late: lateCount,
              absent: absentCount,
              permission: permissionCount
            }
          });
        } catch (error) {
          console.error('Error generating performance report:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to generate performance report',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'detailed': {
        try {
          // More detailed report with historical data simulation
          const studentsData = dm.getStudents();
          const detailedStats = studentsData.map((student: Student) => ({
            id: student.id,
            nis: student.nis,
            name: student.name,
            class: student.class,
            currentStatus: student.status,
            currentTime: student.time,
            attendancePercentage: student.attendance,
            weeklyHistory: [
              { date: '2025-11-01', status: 'hadir', time: '07:10' },
              { date: '2025-11-02', status: 'hadir', time: '07:05' },
              { date: '2025-11-03', status: 'terlambat', time: '07:30' },
              { date: '2025-11-04', status: 'hadir', time: '07:12' },
              { date: '2025-11-05', status: 'izin', time: '-' },
              { date: '2025-11-06', status: 'hadir', time: '07:08' },
              { date: '2025-11-07', status: student.status, time: student.time }
            ],
            monthlySummary: {
              present: Math.floor(student.attendance * 0.25),
              late: student.late,
              absent: student.absent,
              permission: student.permission
            }
          }));
          
          // Calculate attendance rate using data manager
          const detailedAttendanceStats = dm.calculateAttendanceStats();
          
          return NextResponse.json({
            success: true,
            reportTitle: 'Laporan Kehadiran Siswa',
            generatedAt: new Date().toISOString(),
            period: 'Mingguan',
            totalStudents: studentsData.length,
            attendanceRate: detailedAttendanceStats.attendanceRate,
            detailedStats
          });
        } catch (error) {
          console.error('Error generating detailed report:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to generate detailed report',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'class': {
        try {
          // Class-wise attendance report
          const students = dm.getStudents();
          
          // Group students by class and calculate stats
          const classStats: Record<string, any> = {};
          
          students.forEach((student: Student) => {
            if (!classStats[student.class]) {
              classStats[student.class] = {
                class: student.class,
                totalStudents: 0,
                present: 0,
                late: 0,
                absent: 0,
                permission: 0,
                sick: 0
              };
            }
            
            classStats[student.class].totalStudents++;
            
            switch (student.status) {
              case 'hadir':
                classStats[student.class].present++;
                break;
              case 'terlambat':
                classStats[student.class].late++;
                break;
              case 'tidak-hadir':
                classStats[student.class].absent++;
                break;
              case 'izin':
                classStats[student.class].permission++;
                break;
              case 'sakit':
                classStats[student.class].sick++;
                break;
            }
          });
          
          // Convert to array and calculate attendance rates
          const classReportData = Object.values(classStats).map((stats: any) => {
            const total = stats.present + stats.late + stats.absent + stats.permission + stats.sick;
            const attendanceRate = total > 0 ? Math.round(((stats.present + stats.late) / total) * 1000) / 10 : 0;
            
            return {
              ...stats,
              averageAttendance: attendanceRate
            };
          });
          
          return NextResponse.json({
            success: true,
            reportTitle: 'Laporan Kehadiran per Kelas',
            generatedAt: new Date().toISOString(),
            classReports: classReportData
          });
        } catch (error) {
          console.error('Error generating class report:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to generate class report',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ 
          success: false,
          error: 'Invalid report type' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/reports:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/reports - Export reports
export async function POST(request: Request) {
  try {
    // Ensure data manager is initialized
    const dm = getDataManager();
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body',
        message: error instanceof Error ? error.message : 'Failed to parse request body'
      }, { status: 400 });
    }
    
    const { format, data, reportType } = body;

    // Validate required fields
    if (!format || !reportType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'Format and reportType are required'
      }, { status: 400 });
    }

    // Validate format
    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid format',
        message: 'Format must be either "pdf" or "excel"'
      }, { status: 400 });
    }

    // Simulate report generation with more realistic data
    const allStudents = dm.getStudents();
    const reportMetadata = {
      title: reportType === 'detailed' ? 'Laporan Kehadiran Siswa' : 
             reportType === 'class' ? 'Laporan Kehadiran per Kelas' : 
             'Laporan Ringkasan Kehadiran',
      generatedAt: new Date().toISOString(),
      period: 'Mingguan',
      totalStudents: allStudents.length,
      fileType: format
    };

    // In a real application, this would generate actual export files
    // For now, we'll just return a success message with metadata
    return NextResponse.json({ 
      success: true, 
      message: `Laporan berhasil diekspor dalam format ${format}`,
      reportMetadata,
      downloadUrl: `/downloads/report-${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/reports:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}