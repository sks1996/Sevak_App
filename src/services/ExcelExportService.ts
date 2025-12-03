import * as XLSX from 'xlsx';
import { AttendanceRecord, AttendanceStats } from '../types/attendance';
import { User } from '../types';

export interface ExcelExportData {
  records: AttendanceRecord[];
  stats: AttendanceStats;
  user: User;
  period: string;
  startDate: Date;
  endDate: Date;
}

export class ExcelExportService {
  static generateAttendanceReport(data: ExcelExportData): void {
    const workbook = XLSX.utils.book_new();
    
    // Create Summary Sheet
    const summarySheet = this.createSummarySheet(data);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create Detailed Records Sheet
    const recordsSheet = this.createRecordsSheet(data);
    XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Attendance Records');
    
    // Create Statistics Sheet
    const statsSheet = this.createStatisticsSheet(data);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
    
    // Generate filename
    const filename = this.generateFilename(data);
    
    // Export the file
    XLSX.writeFile(workbook, filename);
  }

  private static createSummarySheet(data: ExcelExportData): XLSX.WorkSheet {
    const summaryData = [
      ['ATTENDANCE REPORT SUMMARY'],
      [''],
      ['Employee Information'],
      ['Name', data.user.name],
      ['Role', data.user.role.toUpperCase()],
      ['Department', data.user.department || 'N/A'],
      [''],
      ['Report Period'],
      ['Period', data.period],
      ['Start Date', data.startDate.toLocaleDateString()],
      ['End Date', data.endDate.toLocaleDateString()],
      [''],
      ['Attendance Summary'],
      ['Total Days', data.stats.totalDays],
      ['Present Days', data.stats.presentDays],
      ['Absent Days', data.stats.absentDays],
      ['Late Days', data.stats.lateDays],
      ['Average Hours', data.stats.averageHours.toFixed(2)],
      ['Attendance Rate', `${((data.stats.presentDays / data.stats.totalDays) * 100).toFixed(2)}%`],
      [''],
      ['Generated On', new Date().toLocaleString()],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the header
    worksheet['!cols'] = [
      { width: 20 },
      { width: 30 }
    ];
    
    return worksheet;
  }

  private static createRecordsSheet(data: ExcelExportData): XLSX.WorkSheet {
    const headers = [
      'Date',
      'Status',
      'Check In Time',
      'Check Out Time',
      'Total Hours',
      'Location',
      'Notes',
      'Verified'
    ];

    const recordsData = data.records.map(record => [
      record.date.toLocaleDateString(),
      record.status.toUpperCase(),
      record.checkIn?.time ? record.checkIn.time.toLocaleTimeString() : 'N/A',
      record.checkOut?.time ? record.checkOut.time.toLocaleTimeString() : 'N/A',
      record.totalHours ? record.totalHours.toFixed(2) : 'N/A',
      record.checkIn?.location?.address || 'N/A',
      record.notes || '',
      record.checkIn?.verified ? 'Yes' : 'No'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...recordsData]);
    
    // Style the columns
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 12 }, // Status
      { width: 15 }, // Check In Time
      { width: 15 }, // Check Out Time
      { width: 12 }, // Total Hours
      { width: 25 }, // Location
      { width: 30 }, // Notes
      { width: 10 }  // Verified
    ];
    
    return worksheet;
  }

  private static createStatisticsSheet(data: ExcelExportData): XLSX.WorkSheet {
    const statsData = [
      ['ATTENDANCE STATISTICS'],
      [''],
      ['Overall Statistics'],
      ['Metric', 'Value'],
      ['Total Working Days', data.stats.totalDays],
      ['Days Present', data.stats.presentDays],
      ['Days Absent', data.stats.absentDays],
      ['Days Late', data.stats.lateDays],
      ['Average Hours per Day', data.stats.averageHours.toFixed(2)],
      ['Attendance Percentage', `${((data.stats.presentDays / data.stats.totalDays) * 100).toFixed(2)}%`],
      [''],
      ['Status Breakdown'],
      ['Status', 'Count', 'Percentage'],
      ['Present', data.stats.presentDays, `${((data.stats.presentDays / data.stats.totalDays) * 100).toFixed(2)}%`],
      ['Absent', data.stats.absentDays, `${((data.stats.absentDays / data.stats.totalDays) * 100).toFixed(2)}%`],
      ['Late', data.stats.lateDays, `${((data.stats.lateDays / data.stats.totalDays) * 100).toFixed(2)}%`],
      [''],
      ['Performance Analysis'],
      ['Metric', 'Value', 'Status'],
      ['Attendance Rate', `${((data.stats.presentDays / data.stats.totalDays) * 100).toFixed(2)}%`, this.getPerformanceStatus(data.stats.presentDays / data.stats.totalDays)],
      ['Average Hours', data.stats.averageHours.toFixed(2), this.getHoursStatus(data.stats.averageHours)],
      ['Punctuality', `${((data.stats.presentDays - data.stats.lateDays) / data.stats.presentDays * 100).toFixed(2)}%`, this.getPunctualityStatus(data.stats.presentDays, data.stats.lateDays)],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(statsData);
    
    // Style the columns
    worksheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];
    
    return worksheet;
  }

  private static getPerformanceStatus(attendanceRate: number): string {
    if (attendanceRate >= 0.95) return 'Excellent';
    if (attendanceRate >= 0.90) return 'Good';
    if (attendanceRate >= 0.80) return 'Average';
    return 'Needs Improvement';
  }

  private static getHoursStatus(averageHours: number): string {
    if (averageHours >= 8) return 'Excellent';
    if (averageHours >= 7) return 'Good';
    if (averageHours >= 6) return 'Average';
    return 'Below Standard';
  }

  private static getPunctualityStatus(presentDays: number, lateDays: number): string {
    if (presentDays === 0) return 'N/A';
    const punctualityRate = (presentDays - lateDays) / presentDays;
    if (punctualityRate >= 0.95) return 'Excellent';
    if (punctualityRate >= 0.90) return 'Good';
    if (punctualityRate >= 0.80) return 'Average';
    return 'Needs Improvement';
  }

  private static generateFilename(data: ExcelExportData): string {
    const user = data.user.name.replace(/\s+/g, '_');
    const period = data.period.toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    return `Attendance_Report_${user}_${period}_${date}.xlsx`;
  }
}
