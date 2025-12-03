import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

const { width } = Dimensions.get('window');
const chartSize = Math.min(width - theme.spacing.md * 4, 250);

interface PerformanceChartProps {
  records: AttendanceRecord[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ records }) => {
  const getPerformanceData = () => {
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const earlyCheckoutDays = records.filter(r => r.status === 'early_checkout').length;

    return [
      { label: 'Present', value: presentDays, color: theme.colors.success },
      { label: 'Absent', value: absentDays, color: theme.colors.error },
      { label: 'Late', value: lateDays, color: theme.colors.warning },
      { label: 'Early Checkout', value: earlyCheckoutDays, color: theme.colors.info },
    ].filter(item => item.value > 0);
  };

  const performanceData = getPerformanceData();
  const total = performanceData.reduce((sum, item) => sum + item.value, 0);

  const renderPieChart = () => {
    if (total === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    let currentAngle = 0;
    const radius = chartSize / 2 - 20;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.pieChart}>
          {performanceData.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            // Create a simple pie slice using a circle with border radius
            const sliceStyle = {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              backgroundColor: item.color,
              opacity: 0.8,
              position: 'absolute' as const,
              transform: [{ rotate: `${startAngle}deg` }],
            };

            return (
              <View key={index} style={sliceStyle} />
            );
          })}
        </View>
        
        {/* Center circle */}
        <View style={styles.centerCircle}>
          <Text style={styles.centerText}>{total}</Text>
          <Text style={styles.centerSubText}>Total Days</Text>
        </View>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      {performanceData.map((item, index) => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        return (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label}: {item.value} ({percentage}%)
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderPieChart()}
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    width: chartSize,
    height: chartSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pieChart: {
    width: chartSize,
    height: chartSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    position: 'absolute',
    width: chartSize * 0.4,
    height: chartSize * 0.4,
    borderRadius: chartSize * 0.2,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  centerText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  centerSubText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  emptyChart: {
    width: chartSize,
    height: chartSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: chartSize / 2,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
  legend: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
