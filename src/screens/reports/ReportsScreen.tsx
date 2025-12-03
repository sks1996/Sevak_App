import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useNavigation } from '@react-navigation/native';
import { AttendanceChart } from '../../components/charts/AttendanceChart';
import { PerformanceChart } from '../../components/charts/PerformanceChart';
import { TrendChart } from '../../components/charts/TrendChart';
import { DepartmentChart } from '../../components/charts/DepartmentChart';
import { AttendanceStats, AttendanceRecord } from '../../types/attendance';
import { ExcelExportService, ExcelExportData } from '../../services/ExcelExportService';

const { width } = Dimensions.get('window');

export const ReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const { attendanceState, getRecordsByDateRange, getMonthlyStats } = useAttendance();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedDate]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate(selectedDate, selectedPeriod);
      const endDate = getEndDate(selectedDate, selectedPeriod);
      
      const periodRecords = getRecordsByDateRange(startDate, endDate);
      const periodStats = getMonthlyStats(selectedDate.getMonth(), selectedDate.getFullYear());
      
      setRecords(periodRecords);
      setStats(periodStats);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = (date: Date, period: string): Date => {
    const newDate = new Date(date);
    switch (period) {
      case 'week':
        const dayOfWeek = newDate.getDay();
        newDate.setDate(newDate.getDate() - dayOfWeek);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
      case 'month':
        newDate.setDate(1);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
      case 'year':
        newDate.setMonth(0, 1);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
      default:
        return newDate;
    }
  };

  const getEndDate = (date: Date, period: string): Date => {
    const newDate = new Date(date);
    switch (period) {
      case 'week':
        newDate.setDate(newDate.getDate() + (6 - newDate.getDay()));
        newDate.setHours(23, 59, 59, 999);
        return newDate;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1, 0);
        newDate.setHours(23, 59, 59, 999);
        return newDate;
      case 'year':
        newDate.setMonth(11, 31);
        newDate.setHours(23, 59, 59, 999);
        return newDate;
      default:
        return newDate;
    }
  };

  const exportToExcel = () => {
    if (!authState.user || !stats) {
      Alert.alert('Error', 'Unable to export: Missing user or statistics data');
      return;
    }

    try {
      const startDate = getStartDate(selectedDate, selectedPeriod);
      const endDate = getEndDate(selectedDate, selectedPeriod);

      const exportData: ExcelExportData = {
        records,
        stats,
        user: authState.user,
        period: formatPeriodTitle(),
        startDate,
        endDate,
      };

      ExcelExportService.generateAttendanceReport(exportData);
      
      Alert.alert(
        'Export Successful!',
        'Your attendance report has been downloaded successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'There was an error generating the Excel report. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatPeriodTitle = (): string => {
    switch (selectedPeriod) {
      case 'week':
        return `Week of ${selectedDate.toLocaleDateString()}`;
      case 'month':
        return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'year':
        return selectedDate.getFullYear().toString();
      default:
        return 'Reports';
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.periodTitle}>{formatPeriodTitle()}</Text>
      <View style={styles.periodButtons}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatsCards = () => {
    if (!stats) return null;

    const statsData = [
      {
        title: 'Total Days',
        value: stats.totalDays.toString(),
        icon: 'calendar-outline',
        color: theme.colors.info,
      },
      {
        title: 'Present Days',
        value: stats.presentDays.toString(),
        icon: 'checkmark-circle-outline',
        color: theme.colors.success,
      },
      {
        title: 'Absent Days',
        value: stats.absentDays.toString(),
        icon: 'close-circle-outline',
        color: theme.colors.error,
      },
      {
        title: 'Late Days',
        value: stats.lateDays.toString(),
        icon: 'time-outline',
        color: theme.colors.warning,
      },
      {
        title: 'Avg Hours',
        value: stats.averageHours.toFixed(1),
        icon: 'hourglass-outline',
        color: theme.colors.primary,
      },
      {
        title: 'Attendance %',
        value: `${((stats.presentDays / stats.totalDays) * 100).toFixed(1)}%`,
        icon: 'trending-up-outline',
        color: theme.colors.secondary,
      },
    ];

    return (
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCharts = () => (
    <View style={styles.chartsContainer}>
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Attendance</Text>
        <AttendanceChart records={records} period={selectedPeriod} />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Performance Trends</Text>
        <TrendChart records={records} period={selectedPeriod} />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Attendance Distribution</Text>
        <PerformanceChart records={records} />
      </Card>

      {authState.user?.role === 'admin' && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Department Comparison</Text>
          <DepartmentChart records={records} />
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Reports" 
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadReportData}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {renderPeriodSelector()}
        {renderStatsCards()}
        {renderCharts()}
        
        <View style={styles.actionsContainer}>
          <Button
            title="📊 Export to Excel"
            onPress={exportToExcel}
            style={styles.excelButton}
          />
          <Button
            title="📈 Advanced Analytics"
            variant="outline"
            onPress={() => navigation.navigate('AdvancedAnalytics' as never)}
            style={styles.analyticsButton}
            leftIcon="analytics-outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  periodSelector: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  periodTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: theme.colors.textWhite,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: (width - theme.spacing.md * 3) / 2,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartsContainer: {
    marginBottom: theme.spacing.lg,
  },
  chartCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingVertical: theme.spacing.lg,
  },
  excelButton: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.success,
  },
  analyticsButton: {
    marginBottom: theme.spacing.md,
  },
});