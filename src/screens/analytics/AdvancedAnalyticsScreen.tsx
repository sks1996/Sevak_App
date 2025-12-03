import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { AttendanceChart } from '../../components/charts/AttendanceChart';
import { PerformanceChart } from '../../components/charts/PerformanceChart';
import { TrendChart } from '../../components/charts/TrendChart';
import { DepartmentChart } from '../../components/charts/DepartmentChart';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const { analyticsState } = useAnalytics();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const departments = ['Education', 'Administration', 'Finance', 'HR'];
  const roles = ['sevak', 'hod', 'admin'];

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleApply = () => {
    onApply({
      departments: selectedDepartments,
      roles: selectedRoles,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Advanced Filters</Text>
        
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Departments</Text>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={styles.filterOption}
              onPress={() => toggleDepartment(dept)}
            >
              <View style={[
                styles.checkbox,
                selectedDepartments.includes(dept) && styles.checkboxSelected
              ]}>
                {selectedDepartments.includes(dept) && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.textWhite} />
                )}
              </View>
              <Text style={styles.filterOptionText}>{dept}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Roles</Text>
          {roles.map(role => (
            <TouchableOpacity
              key={role}
              style={styles.filterOption}
              onPress={() => toggleRole(role)}
            >
              <View style={[
                styles.checkbox,
                selectedRoles.includes(role) && styles.checkboxSelected
              ]}>
                {selectedRoles.includes(role) && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.textWhite} />
                )}
              </View>
              <Text style={styles.filterOptionText}>{role.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.modalButton}
          />
          <Button
            title="Apply Filters"
            onPress={handleApply}
            style={styles.modalButton}
          />
        </View>
      </View>
    </View>
  );
};

export const AdvancedAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState, logout } = useAuth();
  const { analyticsState, generateAnalytics, exportAnalytics, resetFilters } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateAnalytics();
    setIsRefreshing(false);
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      await exportAnalytics(format);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleApplyFilters = (filters: any) => {
    // Apply filters logic here
    console.log('Applied filters:', filters);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatHours = (value: number) => `${value.toFixed(1)}h`;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Advanced Analytics"
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
        onLogoutPress={logout}
        rightButton={{
          icon: 'filter-outline',
          onPress: () => setShowFilters(true),
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {analyticsState.attendanceAnalytics?.totalRecords || 0}
            </Text>
            <Text style={styles.summaryLabel}>Total Records</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatPercentage(analyticsState.attendanceAnalytics?.attendanceRate || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Attendance Rate</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatHours(analyticsState.attendanceAnalytics?.averageHours || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Avg Hours</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {analyticsState.departmentAnalytics.length}
            </Text>
            <Text style={styles.summaryLabel}>Departments</Text>
          </Card>
        </View>

        {/* Charts Section */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          {analyticsState.chartData.attendanceChart && (
            <AttendanceChart data={analyticsState.chartData.attendanceChart} />
          )}
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Department Comparison</Text>
          {analyticsState.chartData.departmentChart && (
            <DepartmentChart data={analyticsState.chartData.departmentChart} />
          )}
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Attendance Trends</Text>
          {analyticsState.chartData.trendChart && (
            <TrendChart data={analyticsState.chartData.trendChart} />
          )}
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Hours Distribution</Text>
          {analyticsState.chartData.hoursChart && (
            <PerformanceChart data={analyticsState.chartData.hoursChart} />
          )}
        </Card>

        {/* Top Performers */}
        {analyticsState.insights?.topPerformers && (
          <Card style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            {analyticsState.insights.topPerformers.map((user, index) => (
              <View key={user.userId} style={styles.performerItem}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{user.userName}</Text>
                  <Text style={styles.performerDept}>{user.department}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.performerRate}>
                    {formatPercentage(user.attendanceRate)}
                  </Text>
                  <Text style={styles.performerHours}>
                    {formatHours(user.averageHours)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Recommendations */}
        {analyticsState.insights?.recommendations && (
          <Card style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analyticsState.insights.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="bulb-outline" size={16} color={theme.colors.warning} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Export Options */}
        <Card style={styles.exportCard}>
          <Text style={styles.sectionTitle}>Export Analytics</Text>
          <View style={styles.exportButtons}>
            <Button
              title="📊 Excel"
              variant="outline"
              onPress={() => handleExport('excel')}
              style={styles.exportButton}
            />
            <Button
              title="📄 PDF"
              variant="outline"
              onPress={() => handleExport('pdf')}
              style={styles.exportButton}
            />
            <Button
              title="📋 CSV"
              variant="outline"
              onPress={() => handleExport('csv')}
              style={styles.exportButton}
            />
          </View>
        </Card>

        {/* Reset Filters */}
        <Button
          title="Reset All Filters"
          variant="outline"
          onPress={resetFilters}
          style={styles.resetButton}
          leftIcon="refresh-outline"
        />
      </ScrollView>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    width: '48%',
    marginRight: '4%',
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: theme.spacing.md,
  },
  insightsCard: {
    marginBottom: theme.spacing.md,
  },
  recommendationsCard: {
    marginBottom: theme.spacing.md,
  },
  exportCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  performerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rankNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textWhite,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  performerDept: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerRate: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.success,
  },
  performerHours: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  exportButton: {
    flex: 1,
    minWidth: '30%',
  },
  resetButton: {
    marginBottom: theme.spacing.xl,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.textWhite,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
