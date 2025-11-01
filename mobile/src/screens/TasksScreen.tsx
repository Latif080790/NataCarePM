/**
 * Tasks Screen
 * NataCarePM Mobile App
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  IconButton,
  Chip,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useOffline } from '../hooks';

const TasksScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tasks, setTasks] = useState<any[]>([
    {
      id: '1',
      title: 'Excavate Foundation',
      project: 'Office Building',
      status: 'completed',
      priority: 'high',
      dueDate: '2023-06-15',
      assignee: 'John Doe',
    },
    {
      id: '2',
      title: 'Install Steel Framework',
      project: 'Office Building',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2023-07-30',
      assignee: 'Jane Smith',
    },
    {
      id: '3',
      title: 'Pour Concrete Slab',
      project: 'Residential Complex',
      status: 'pending',
      priority: 'medium',
      dueDate: '2023-08-15',
      assignee: 'Bob Johnson',
    },
    {
      id: '4',
      title: 'Electrical Rough-in',
      project: 'Highway Expansion',
      status: 'overdue',
      priority: 'critical',
      dueDate: '2023-05-30',
      assignee: 'Alice Brown',
    },
  ]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigation = useNavigation();
  
  const { isOnline, isInitialized, saveOfflineData, addToSyncQueue } = useOffline();

  useEffect(() => {
    if (!isOnline && isInitialized) {
      setSnackbarMessage('Working offline - changes will sync when online');
      setSnackbarVisible(true);
    }
  }, [isOnline, isInitialized]);

  // Tasks are now loaded from state

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in-progress': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const renderTask = ({ item }: { item: any }) => (
    <Card style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <Title style={styles.taskTitle}>{item.title}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status.replace('-', ' ')}
          </Chip>
        </View>
        <Paragraph style={styles.projectName}>{item.project}</Paragraph>
        <View style={styles.taskDetails}>
          <Text style={styles.detailText}>Due: {item.dueDate}</Text>
          <Text style={styles.detailText}>Assignee: {item.assignee}</Text>
        </View>
        <View style={styles.taskFooter}>
          <Chip 
            style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
            textStyle={styles.chipText}
          >
            {item.priority}
          </Chip>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => {}}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tasks"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Chip 
            mode={filterStatus === 'all' ? 'flat' : 'outlined'} 
            onPress={() => setFilterStatus('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip 
            mode={filterStatus === 'pending' ? 'flat' : 'outlined'} 
            onPress={() => setFilterStatus('pending')}
            style={styles.filterChip}
          >
            Pending
          </Chip>
          <Chip 
            mode={filterStatus === 'in-progress' ? 'flat' : 'outlined'} 
            onPress={() => setFilterStatus('in-progress')}
            style={styles.filterChip}
          >
            In Progress
          </Chip>
          <Chip 
            mode={filterStatus === 'completed' ? 'flat' : 'outlined'} 
            onPress={() => setFilterStatus('completed')}
            style={styles.filterChip}
          >
            Completed
          </Chip>
        </View>
      </View>
      
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      
      <Button
        mode="contained"
        onPress={async () => {
          // Create a new task
          const newTask = {
            id: `task_${Date.now()}`,
            title: 'New Task',
            project: 'Current Project',
            status: 'pending',
            priority: 'medium',
            dueDate: new Date().toISOString().split('T')[0],
            assignee: 'Current User',
          };
          
          // Add to local state
          setTasks(prev => [...prev, newTask]);
          
          // Save offline and add to sync queue
          try {
            await saveOfflineData(newTask.id, newTask, 'task');
            await addToSyncQueue('create', 'task', newTask);
            
            if (!isOnline) {
              setSnackbarMessage('Task saved offline - will sync when online');
              setSnackbarVisible(true);
            }
          } catch (error) {
            console.error('Failed to save task:', error);
            setSnackbarMessage('Failed to save task');
            setSnackbarVisible(true);
          }
        }}
        style={styles.fab}
      >
        New Task
      </Button>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 0,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  taskCard: {
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  projectName: {
    opacity: 0.7,
    marginTop: 4,
  },
  taskDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityChip: {
    height: 24,
  },
  fab: {
    margin: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default TasksScreen;