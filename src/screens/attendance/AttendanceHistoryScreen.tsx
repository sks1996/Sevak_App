import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

export const AttendanceHistoryScreen: React.FC = () => {
  const { authState } = useAuth();
  const { attendanceState, getAttendanceHistory, updateAttendanceRecord } = useAttendance();
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  const { records, isLoading } = attendanceState;

  useEffect(() => {
    loadAttendanceHistory();
  }, [authState.user, filterPeriod]);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, filterPeriod]);

  const loadAttendanceHistory = async () => {
    if (!authState.user) return;

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (filterPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
          startDate.setFullYear(2020); // Show all records from 2020
          break;
      }

      await getAttendanceHistory(authState.user.id, startDate, endDate);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // Filter by search query (date or status)
    if (searchQuery) {
      filtered = filtered.filter(record => {
        const dateStr = record.date.toLocaleDateString().toLowerCase();
        const statusStr = record.status.toLowerCase();
        const query = searchQuery.toLowerCase();
        return dateStr.includes(query) || statusStr.includes(query);
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    setFilteredRecords(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceHistory();
    setRefreshing(false);
  };

  const handleRecordPress = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditingNotes(record.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    try {
      await updateAttendanceRecord(selectedRecord.id, {
        notes: editingNotes,
      });
      
      setShowEditModal(false);
      setSelectedRecord(null);
      Alert.alert('Success', 'Attendance record updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return theme.colors.success;
      case 'late':
        return theme.colors.warning;
      case 'absent':
        return theme.colors.error;
      case 'half-day':
        return theme.colors.info;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'late':
        return 'time';
      case 'absent':
        return 'close-circle';
      case 'half-day':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filter by:</Text>
      <View style={styles.filterButtons}>
        {(['week', 'month', 'year', 'all'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterButton,
              filterPeriod === period && styles.filterButtonActive
            ]}
            onPress={() => setFilterPeriod(period)}
          >
            <Text style={[
              styles.filterButtonText,
              filterPeriod === period && styles.filterButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date or status..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRecordItem = ({ item }: { item: AttendanceRecord }) => (
    <TouchableOpacity onPress={() => handleRecordPress(item)}>
      <Card style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordDate}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={styles.dayText}>{item.date.toLocaleDateString([], { weekday: 'long' })}</Text>
          </View>
          <View style={styles.recordStatus}>
            <Ionicons 
              name={getStatusIcon(item.status)} 
              size={24} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.recordDetails}>
          {item.checkIn && (
            <View style={styles.timeDetail}>
              <Ionicons name="log-in" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.timeText}>{formatTime(item.checkIn.timestamp)}</Text>
              {item.checkIn.verified && (
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              )}
            </View>
          )}
          
          {item.checkOut && (
            <View style={styles.timeDetail}>
              <Ionicons name="log-out" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.timeText}>{formatTime(item.checkOut.timestamp)}</Text>
              {item.checkOut.verified && (
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              )}
            </View>
          )}
          
          {item.totalHours && (
            <View style={styles.timeDetail}>
              <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.timeText}>{item.totalHours.toFixed(1)}h</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        <View style={styles.recordActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditRecord(item)}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Attendance Details</Text>
          <TouchableOpacity onPress={() => setShowDetailModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {selectedRecord && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailCard}>
              <Text style={styles.detailTitle}>Date: {formatDate(selectedRecord.date)}</Text>
              <Text style={styles.detailSubtitle}>{selectedRecord.date.toLocaleDateString([], { weekday: 'long' })}</Text>
              
              <View style={styles.detailStatus}>
                <Ionicons 
                  name={getStatusIcon(selectedRecord.status)} 
                  size={32} 
                  color={getStatusColor(selectedRecord.status)} 
                />
                <Text style={[styles.detailStatusText, { color: getStatusColor(selectedRecord.status) }]}>
                  {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                </Text>
              </View>

              {selectedRecord.checkIn && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Check-in</Text>
                  <Text style={styles.detailText}>Time: {formatTime(selectedRecord.checkIn.timestamp)}</Text>
                  <Text style={styles.detailText}>Method: {selectedRecord.checkIn.method}</Text>
                  <Text style={styles.detailText}>Verified: {selectedRecord.checkIn.verified ? 'Yes' : 'No'}</Text>
                  {selectedRecord.checkIn.location && (
                    <Text style={styles.detailText}>Location: {selectedRecord.checkIn.location.address}</Text>
                  )}
                </View>
              )}

              {selectedRecord.checkOut && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Check-out</Text>
                  <Text style={styles.detailText}>Time: {formatTime(selectedRecord.checkOut.timestamp)}</Text>
                  <Text style={styles.detailText}>Method: {selectedRecord.checkOut.method}</Text>
                  <Text style={styles.detailText}>Verified: {selectedRecord.checkOut.verified ? 'Yes' : 'No'}</Text>
                  {selectedRecord.checkOut.location && (
                    <Text style={styles.detailText}>Location: {selectedRecord.checkOut.location.address}</Text>
                  )}
                </View>
              )}

              {selectedRecord.totalHours && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Total Hours</Text>
                  <Text style={styles.detailText}>{selectedRecord.totalHours.toFixed(1)} hours</Text>
                </View>
              )}

              {selectedRecord.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.detailText}>{selectedRecord.notes}</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Attendance</Text>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Card style={styles.editCard}>
            <Text style={styles.editLabel}>Notes</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Add notes about this attendance record..."
              placeholderTextColor={theme.colors.textMuted}
              value={editingNotes}
              onChangeText={setEditingNotes}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowEditModal(false)}
                style={styles.editButton}
              />
              <Button
                title="Save"
                onPress={handleSaveEdit}
                style={styles.editButton}
              />
            </View>
          </Card>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No Attendance Records</Text>
      <Text style={styles.emptySubtitle}>
        No attendance records found for the selected period.
      </Text>
    </View>
  );

  if (!authState.user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Attendance History" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please log in to view attendance history</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Attendance History" />
      
      {/* Filter Buttons */}
      {renderFilterButtons()}
      
      {/* Search Bar */}
      {renderSearchBar()}
      
      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderRecordItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Edit Modal */}
      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  filterContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.textWhite,
  },
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  recordCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  recordDate: {
    flex: 1,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dayText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  timeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  notesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '10',
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  detailCard: {
    padding: theme.spacing.lg,
  },
  detailTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  detailSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  detailStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailStatusText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  editCard: {
    padding: theme.spacing.lg,
  },
  editLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
