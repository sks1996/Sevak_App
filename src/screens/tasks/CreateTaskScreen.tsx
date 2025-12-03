import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import { TaskPriority, TaskCategory, TaskStatus } from '../../types/tasks';
import { MOCK_USERS } from '../../constants';

export const CreateTaskScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const { createTask } = useTasks();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    category: 'general' as TaskCategory,
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    tags: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!formData.assignedTo) {
      Alert.alert('Error', 'Please select an assignee');
      return;
    }

    if (!formData.dueDate) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }

    try {
      setIsLoading(true);
      
      const dueDate = new Date(formData.dueDate);
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: 'pending' as TaskStatus,
        priority: formData.priority,
        category: formData.category,
        assignedTo: formData.assignedTo,
        assignedBy: authState.user?.id || '',
        dueDate,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        tags,
        attachments: [],
        comments: [],
        subtasks: [],
        isRecurring: false,
        dependencies: [],
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityOptions = () => [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const getCategoryOptions = () => [
    { label: 'General', value: 'general' },
    { label: 'Development', value: 'development' },
    { label: 'Design', value: 'design' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Human Resources', value: 'hr' },
    { label: 'Finance', value: 'finance' },
    { label: 'Operations', value: 'operations' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  const getUserOptions = () => {
    return MOCK_USERS.map(user => ({
      label: `${user.name} (${user.role.toUpperCase()})`,
      value: user.id,
    }));
  };

  const showPicker = (title: string, options: any[], currentValue: string, onSelect: (value: string) => void) => {
    Alert.alert(
      title,
      'Select an option:',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => onSelect(option.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Task"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Task Details</Text>
          
          <Input
            label="Task Title *"
            placeholder="Enter task title"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            style={styles.input}
          />
          
          <Input
            label="Description"
            placeholder="Enter task description"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline={true}
            numberOfLines={4}
            style={styles.input}
          />
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Button
                title={`Priority: ${getPriorityOptions().find(p => p.value === formData.priority)?.label}`}
                variant="outline"
                onPress={() => showPicker(
                  'Select Priority',
                  getPriorityOptions(),
                  formData.priority,
                  (value) => handleInputChange('priority', value)
                )}
                style={styles.pickerButton}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Button
                title={`Category: ${getCategoryOptions().find(c => c.value === formData.category)?.label}`}
                variant="outline"
                onPress={() => showPicker(
                  'Select Category',
                  getCategoryOptions(),
                  formData.category,
                  (value) => handleInputChange('category', value)
                )}
                style={styles.pickerButton}
              />
            </View>
          </View>
          
          <Button
            title={`Assignee: ${getUserOptions().find(u => u.value === formData.assignedTo)?.label || 'Select Assignee'}`}
            variant="outline"
            onPress={() => showPicker(
              'Select Assignee',
              getUserOptions(),
              formData.assignedTo,
              (value) => handleInputChange('assignedTo', value)
            )}
            style={styles.pickerButton}
          />
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Due Date *"
                placeholder="YYYY-MM-DD"
                value={formData.dueDate}
                onChangeText={(value) => handleInputChange('dueDate', value)}
                style={styles.input}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Input
                label="Estimated Hours"
                placeholder="e.g., 8"
                value={formData.estimatedHours}
                onChangeText={(value) => handleInputChange('estimatedHours', value)}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>
          
          <Input
            label="Tags"
            placeholder="Enter tags separated by commas"
            value={formData.tags}
            onChangeText={(value) => handleInputChange('tags', value)}
            style={styles.input}
          />
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Create Task"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
            leftIcon="checkmark-outline"
          />
          
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
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
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    marginBottom: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    gap: theme.spacing.md,
  },
  submitButton: {
    backgroundColor: theme.colors.success,
  },
  cancelButton: {
    borderColor: theme.colors.error,
  },
});
