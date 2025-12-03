import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

const { width } = Dimensions.get('window');
const chartWidth = width - theme.spacing.md * 4;
const chartHeight = 200;

interface AttendanceChartProps {
  records: AttendanceRecord[];
  period: 'week' | 'month' | 'year';
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ records, period }) => {
  const getChartData = () => {
    const data = [];
    const now = new Date();
    
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayRecords = records.filter(r => 
          r.date.toDateString() === date.toDateString()
        );
        const isPresent = dayRecords.some(r => r.status === 'present');
        data.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: isPresent ? 1 : 0,
          date: date,
        });
      }
    } else if (period === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dayRecords = records.filter(r => 
          r.date.toDateString() === date.toDateString()
        );
        const isPresent = dayRecords.some(r => r.status === 'present');
        data.push({
          label: i.toString(),
          value: isPresent ? 1 : 0,
          date: date,
        });
      }
    } else {
      // Year - show monthly data
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now.getFullYear(), i, 1);
        const monthRecords = records.filter(r => 
          r.date.getMonth() === i && r.date.getFullYear() === now.getFullYear()
        );
        const presentDays = monthRecords.filter(r => r.status === 'present').length;
        const totalDays = monthRecords.length;
        const attendanceRate = totalDays > 0 ? presentDays / totalDays : 0;
        
        data.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          value: attendanceRate,
          date: monthDate,
        });
      }
    }
    
    return data;
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value));

  const renderBarChart = () => {
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {chartData.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 40) : 0;
            const isPresent = item.value > 0;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2),
                      backgroundColor: isPresent ? theme.colors.success : theme.colors.error,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>1</Text>
          <Text style={styles.yAxisLabel}>0.5</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderBarChart()}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.legendText}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.error }]} />
          <Text style={styles.legendText}>Absent</Text>
        </View>
      </View>
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
  bar: {
    width: '80%',
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  barLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
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
    marginTop: theme.spacing.sm,
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
});
