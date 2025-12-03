import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { useMeetings } from '../../contexts/MeetingContext';
import { useAuth } from '../../contexts/AuthContext';
import { Meeting, MeetingType, MeetingPriority } from '../../types/meetings';

interface CreateMeetingScreenProps {
  navigation: any;
  route?: {
    params?: {
      meeting?: Meeting;
      isEdit?: boolean;
    };
  };
}

export const CreateMeetingScreen: React.FC<CreateMeetingScreenProps> = ({
  navigation,
  route,
}) => {
  const { createMeeting, updateMeeting, getAvailableUsers } = useMeetings();
  const { user } = useAuth();
  
  const isEdit = route?.params?.isEdit || false;
  const existingMeeting = route?.params?.meeting;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general' as MeetingType,
    priority: 'medium' as MeetingPriority,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    location: '',
    agenda: [] as string[],
    attendees: [] as string[],
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isEdit && existingMeeting) {
      setFormData({
        title: existingMeeting.title,
        description: existingMeeting.description,
        type: existingMeeting.type,
        priority: existingMeeting.priority,
        startTime: existingMeeting.startTime,
        endTime: existingMeeting.endTime,
        location: existingMeeting.location,
        agenda: existingMeeting.agenda.map(item => item.title),
        attendees: existingMeeting.attendees.map(attendee => attendee.userId),
      });
    }
    
    // Load available users
    const users = getAvailableUsers();
    setAvailableUsers(users);
  }, [isEdit, existingMeeting, getAvailableUsers]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, newAgendaItem.trim()]
      }));
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const toggleAttendee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter(id => id !== userId)
        : [...prev.attendees, userId]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a meeting title');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (formData.attendees.length === 0) {
      Alert.alert('Error', 'Please select at least one attendee');
      return;
    }

    try {
      const meetingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location.trim(),
        organizerId: user?.id || '',
        attendees: formData.attendees.map(userId => ({
          userId,
          status: 'pending' as const,
          responseTime: null,
        })),
        agenda: formData.agenda.map(title => ({
          title,
          description: '',
          duration: 15, // Default 15 minutes
          completed: false,
        })),
        status: 'scheduled' as const,
        meetingLink: '',
        notes: '',
      };

      if (isEdit && existingMeeting) {
        await updateMeeting(existingMeeting.id, meetingData);
        Alert.alert('Success', 'Meeting updated successfully!');
      } else {
        await createMeeting(meetingData);
        Alert.alert('Success', 'Meeting created successfully!');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save meeting');
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEdit ? 'Edit Meeting' : 'Create Meeting'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Enter meeting title"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Enter meeting description"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="General" value="general" />
                  <Picker.Item label="Team Meeting" value="team" />
                  <Picker.Item label="Project Review" value="project" />
                  <Picker.Item label="Training" value="training" />
                  <Picker.Item label="Client Meeting" value="client" />
                </Picker>
              </View>
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="Urgent" value="urgent" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={formatDateTime(formData.startTime)}
                placeholder="Select start time"
                placeholderTextColor={theme.colors.textMuted}
                editable={false}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={styles.input}
                value={formatDateTime(formData.endTime)}
                placeholder="Select end time"
                placeholderTextColor={theme.colors.textMuted}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              placeholder="Enter meeting location or link"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendees *</Text>
          <Text style={styles.subtitle}>Select meeting attendees</Text>
          
          {availableUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.attendeeItem}
              onPress={() => toggleAttendee(user.id)}
            >
              <View style={styles.attendeeInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.attendeeDetails}>
                  <Text style={styles.attendeeName}>{user.name}</Text>
                  <Text style={styles.attendeeRole}>{user.role}</Text>
                </View>
              </View>
              <View style={[
                styles.checkbox,
                formData.attendees.includes(user.id) && styles.checkboxSelected
              ]}>
                {formData.attendees.includes(user.id) && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Agenda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agenda</Text>
          
          <View style={styles.agendaInput}>
            <TextInput
              style={styles.agendaTextInput}
              value={newAgendaItem}
              onChangeText={setNewAgendaItem}
              placeholder="Add agenda item"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAgendaItem}>
              <Ionicons name="add" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          {formData.agenda.map((item, index) => (
            <View key={index} style={styles.agendaItem}>
              <Text style={styles.agendaText}>{item}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAgendaItem(index)}
              >
                <Ionicons name="close" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Update Meeting' : 'Create Meeting'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  attendeeDetails: {
    flex: 1,
  },
  attendeeName: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  attendeeRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  agendaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  agendaTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  agendaText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textMuted,
  },
  submitButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
});
