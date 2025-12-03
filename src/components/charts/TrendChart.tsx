import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

const { width } = Dimensions.get('window');
const chartWidth = width - theme.spacing.md * 4;
const chartHeight = 200;

interface TrendChartProps {
  records: AttendanceRecord[];
  period: 'week' | 'month' | 'year';
}

export const TrendChart: React.FC<TrendChartProps> = ({ records, period }) => {
  const getTrendData = () => {
    const data = [];
    const now = new Date();
    
    if (period === 'week') {
      // Show daily trends for the week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayRecords = records.filter(r => 
          r.date.toDateString() === date.toDateString()
        );
        
        let attendanceScore = 0;
        if (dayRecords.length > 0) {
          const record = dayRecords[0];
          switch (record.status) {
            case 'present':
              attendanceScore = 1;
              break;
            case 'late':
              attendanceScore = 0.7;
              break;
            case 'early_checkout':
              attendanceScore = 0.8;
              break;
            case 'absent':
              attendanceScore = 0;
              break;
            default:
              attendanceScore = 0;
          }
        }
        
        data.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: attendanceScore,
          date: date,
        });
      }
    } else if (period === 'month') {
      // Show weekly trends for the month
      const weeksInMonth = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7);
      for (let week = 0; week < weeksInMonth; week++) {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), week * 7 + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekRecords = records.filter(r => 
          r.date >= weekStart && r.date <= weekEnd
        );
        
        const presentDays = weekRecords.filter(r => r.status === 'present').length;
        const totalDays = weekRecords.length;
        const attendanceRate = totalDays > 0 ? presentDays / totalDays : 0;
        
        data.push({
          label: `W${week + 1}`,
          value: attendanceRate,
          date: weekStart,
        });
      }
    } else {
      // Show monthly trends for the year
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(now.getFullYear(), month, 1);
        const monthRecords = records.filter(r => 
          r.date.getMonth() === month && r.date.getFullYear() === now.getFullYear()
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

  const trendData = getTrendData();
  const maxValue = Math.max(...trendData.map(d => d.value), 1);

  const renderLineChart = () => {
    if (trendData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No trend data available</Text>
        </View>
      );
    }

    const points = trendData.map((item, index) => {
      const x = (index / (trendData.length - 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - 40 - (item.value / maxValue) * (chartHeight - 40);
      return { x, y, value: item.value, label: item.label };
    });

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: chartHeight - 40 - ratio * (chartHeight - 40),
                },
              ]}
            />
          ))}
          
          {/* Data points and lines */}
          {points.map((point, index) => (
            <View key={index}>
              {/* Line to next point */}
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) +
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            points[index + 1].y - point.y,
                            points[index + 1].x - point.x
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}
              
              {/* Data point */}
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                  },
                ]}
              />
              
              {/* Value label */}
              <Text
                style={[
                  styles.valueLabel,
                  {
                    left: point.x - 10,
                    top: point.y - 25,
                  },
                ]}
              >
                {(point.value * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {points.map((point, index) => (
            <Text
              key={index}
              style={[
                styles.xAxisLabel,
                {
                  left: point.x - 10,
                },
              ]}
            >
              {point.label}
            </Text>
          ))}
        </View>
        
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <Text
              key={index}
              style={[
                styles.yAxisLabel,
                {
                  top: chartHeight - 40 - ratio * (chartHeight - 40) - 8,
                },
              ]}
            >
              {(ratio * 100).toFixed(0)}%
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderLineChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    width: chartWidth,
    height: chartHeight,
    position: 'relative',
  },
  chartArea: {
    width: chartWidth,
    height: chartHeight,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.3,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: theme.colors.primary,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  valueLabel: {
    position: 'absolute',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    width: 20,
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 20,
    width: 20,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    width: 20,
  },
  emptyChart: {
    width: chartWidth,
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
});
