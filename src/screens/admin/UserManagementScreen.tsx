import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminUser, UserRole } from '../../types/admin';

export const UserManagementScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const { adminState, createUser, updateUser, deleteUser, toggleUserStatus, assignRole } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'sevak' as UserRole,
    department: '',
    password: '',
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Refresh logic would go here
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isActive: true,
        permissions: [],
      });

      setNewUser({ name: '', email: '', role: 'sevak', department: '', password: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await updateUser(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        department: selectedUser.department,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await toggleUserStatus(user.id);
      Alert.alert('Success', `User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleRoleChange = async (user: AdminUser, newRole: UserRole) => {
    try {
      await assignRole(user.id, newRole);
      Alert.alert('Success', `User role changed to ${newRole.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to change user role');
    }
  };

  const filteredUsers = adminState.users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item: user }: { item: AdminUser }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={theme.colors.textWhite} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={[styles.userRole, { color: getRoleColor(user.role) }]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(user)}
          >
            <Ionicons 
              name={user.isActive ? "pause-outline" : "play-outline"} 
              size={16} 
              color={user.isActive ? theme.colors.warning : theme.colors.success} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(user)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.userFooter}>
        <View style={styles.userMeta}>
          <Text style={styles.metaText}>Department: {user.department || 'N/A'}</Text>
          <Text style={styles.metaText}>
            Last Login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: user.isActive ? theme.colors.success : theme.colors.error }
        ]}>
          <Text style={styles.statusText}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return theme.colors.error;
      case 'hod':
        return theme.colors.warning;
      case 'sevak':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderAddUserModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New User</Text>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Input
            label="Full Name"
            value={newUser.name}
            onChangeText={(text) => setNewUser({ ...newUser, name: text })}
            placeholder="Enter full name"
          />
          
          <Input
            label="Email"
            value={newUser.email}
            onChangeText={(text) => setNewUser({ ...newUser, email: text })}
            placeholder="Enter email address"
            keyboardType="email-address"
          />
          
          <Input
            label="Password"
            value={newUser.password}
            onChangeText={(text) => setNewUser({ ...newUser, password: text })}
            placeholder="Enter password"
            secureTextEntry
          />
          
          <View style={styles.roleSelector}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleButtons}>
              {(['sevak', 'hod', 'admin'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    newUser.role === role && styles.roleButtonActive,
                  ]}
                  onPress={() => setNewUser({ ...newUser, role })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      newUser.role === role && styles.roleButtonTextActive,
                    ]}
                  >
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Input
            label="Department"
            value={newUser.department}
            onChangeText={(text) => setNewUser({ ...newUser, department: text })}
            placeholder="Enter department"
          />
        </ScrollView>
        
        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            onPress={() => setShowAddModal(false)}
            variant="outline"
            style={styles.modalButton}
          />
          <Button
            title="Create User"
            onPress={handleAddUser}
            style={styles.modalButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderEditUserModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit User</Text>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {selectedUser && (
            <>
              <Input
                label="Full Name"
                value={selectedUser.name}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, name: text })}
                placeholder="Enter full name"
              />
              
              <Input
                label="Email"
                value={selectedUser.email}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
              />
              
              <View style={styles.roleSelector}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleButtons}>
                  {(['sevak', 'hod', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        selectedUser.role === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setSelectedUser({ ...selectedUser, role })}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          selectedUser.role === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <Input
                label="Department"
                value={selectedUser.department || ''}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, department: text })}
                placeholder="Enter department"
              />
            </>
          )}
        </ScrollView>
        
        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            onPress={() => setShowEditModal(false)}
            variant="outline"
            style={styles.modalButton}
          />
          <Button
            title="Update User"
            onPress={handleEditUser}
            style={styles.modalButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="User Management" 
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
        onLogoutPress={logout}
        rightButton={{
          icon: 'add-outline',
          onPress: () => setShowAddModal(true),
        }}
      />
      
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
        />
      </View>
      
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
      
      {renderAddUserModal()}
      {renderEditUserModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userMeta: {
    flex: 1,
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textWhite,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  roleSelector: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  roleButtonTextActive: {
    color: theme.colors.textWhite,
  },
});
