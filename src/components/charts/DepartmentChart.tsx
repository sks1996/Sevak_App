import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

const { width } = Dimensions.get('window');
const chartWidth = width - theme.spacing.md * 4;
const chartHeight = 200;

interface DepartmentChartProps {
  records: AttendanceRecord[];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ records }) => {
  const getDepartmentData = () => {
    // Mock department data - in a real app, this would come from user records
    const departments = [
      { name: 'IT', color: theme.colors.primary },
      { name: 'HR', color: theme.colors.success },
      { name: 'Finance', color: theme.colors.warning },
      { name: 'Operations', color: theme.colors.info },
      { name: 'Marketing', color: theme.colors.secondary },
    ];

    return departments.map(dept => {
      // Simulate attendance data for each department
      const mockAttendanceRate = Math.random() * 0.4 + 0.6; // 60-100%
      const mockTotalDays = Math.floor(Math.random() * 20) + 10; // 10-30 days
      const mockPresentDays = Math.floor(mockAttendanceRate * mockTotalDays);
      
      return {
        ...dept,
        totalDays: mockTotalDays,
        presentDays: mockPresentDays,
        attendanceRate: mockAttendanceRate,
        absentDays: mockTotalDays - mockPresentDays,
      };
    });
  };

  const departmentData = getDepartmentData();
  const maxDays = Math.max(...departmentData.map(d => d.totalDays));

  const renderBarChart = () => {
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {departmentData.map((dept, index) => {
            const barHeight = (dept.totalDays / maxDays) * (chartHeight - 60);
            const presentHeight = (dept.presentDays / dept.totalDays) * barHeight;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barGroup}>
                  {/* Present days (bottom part) */}
                  <View
                    style={[
                      styles.bar,
                      styles.presentBar,
                      {
                        height: presentHeight,
                        backgroundColor: dept.color,
                      },
                    ]}
                  />
                  {/* Absent days (top part) */}
                  <View
                    style={[
                      styles.bar,
                      styles.absentBar,
                      {
                        height: barHeight - presentHeight,
                        backgroundColor: theme.colors.error,
                      },
                    ]}
                  />
                </View>
                
                {/* Department label */}
                <Text style={styles.barLabel}>{dept.name}</Text>
                
                {/* Attendance percentage */}
                <Text style={styles.percentageLabel}>
                  {(dept.attendanceRate * 100).toFixed(0)}%
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Y-axis */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxDays}</Text>
          <Text style={styles.yAxisLabel}>{Math.floor(maxDays * 0.75)}</Text>
          <Text style={styles.yAxisLabel}>{Math.floor(maxDays * 0.5)}</Text>
          <Text style={styles.yAxisLabel}>{Math.floor(maxDays * 0.25)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
        <Text style={styles.legendText}>Present Days</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: theme.colors.error }]} />
        <Text style={styles.legendText}>Absent Days</Text>
      </View>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Department Summary</Text>
      {departmentData.map((dept, index) => (
        <View key={index} style={styles.summaryItem}>
          <View style={styles.summaryLeft}>
            <View style={[styles.summaryDot, { backgroundColor: dept.color }]} />
            <Text style={styles.summaryDept}>{dept.name}</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryStats}>
              {dept.presentDays}/{dept.totalDays} days
            </Text>
            <Text style={styles.summaryRate}>
              {(dept.attendanceRate * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderBarChart()}
      {renderLegend()}
      {renderSummary()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    height: chartHeight,
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barGroup: {
    width: '80%',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
  },
  presentBar: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  absentBar: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  barLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  percentageLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  yAxis: {
    height: chartHeight,
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginRight: theme.spacing.sm,
  },
  yAxisLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  summary: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  summaryDept: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryStats: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  summaryRate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
