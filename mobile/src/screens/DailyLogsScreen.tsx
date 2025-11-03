/**
 * Daily Logs Screen
 * NataCarePM Mobile App
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  IconButton,
  Chip,
  Searchbar,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import ConstructionBaseScreen from './ConstructionBaseScreen';
import { offlineService } from '../services/offlineService';

interface DailyLog {
  id: string;
  projectId: string;
  logNumber: string;
  date: Date;
  generalContractor: string;
  projectManager: string;
  weatherConditions?: string;
  entries: Array<{
    id: string;
    type: 'general' | 'safety' | 'quality' | 'weather' | 'equipment' | 'materials' | 'personnel' | 'progress';
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>;
  workPerformed: string;
  workPlanned: string;
  issues: string;
  safetyNotes: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  lastUpdated: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

const DailyLogsScreen = () => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [filteredDailyLogs, setFilteredDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [projectId] = useState('project_123'); // This would come from navigation params

  useEffect(() => {
    loadDailyLogs();
  }, []);

  useEffect(() => {
    filterDailyLogs();
  }, [dailyLogs, searchQuery, filterStatus]);

  const loadDailyLogs = async () => {
    try {
      setLoading(true);
      
      // Try to get from offline storage first
      const offlineDailyLogs = await offlineService.getOfflineData<DailyLog[]>('dailyLogs_' + projectId);
      
      if (offlineDailyLogs) {
        setDailyLogs(offlineDailyLogs);
      } else {
        // Simulate API call - in real app this would be an actual API call
        const mockDailyLogs: DailyLog[] = [
          {
            id: 'dl_1',
            projectId: 'project_123',
            logNumber: 'DL-2024-001',
            date: new Date(),
            generalContractor: 'ABC Construction Co.',
            projectManager: 'John Doe',
            weatherConditions: 'Sunny, 25°C',
            entries: [
              {
                id: 'e1',
                type: 'progress',
                title: 'Foundation Work',
                description: 'Completed 80% of foundation excavation',
                priority: 'high'
              },
              {
                id: 'e2',
                type: 'safety',
                title: 'Safety Inspection',
                description: 'Conducted daily safety inspection with no incidents',
                priority: 'medium'
              }
            ],
            workPerformed: 'Completed foundation excavation and prepared for concrete pour',
            workPlanned: 'Concrete pour for foundation slabs',
            issues: 'Minor delay in material delivery',
            safetyNotes: 'All workers wearing proper PPE',
            createdBy: 'user1',
            createdByName: 'Jane Smith',
            createdAt: new Date(),
            lastUpdated: new Date(),
            status: 'submitted'
          },
          {
            id: 'dl_2',
            projectId: 'project_123',
            logNumber: 'DL-2024-002',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
            generalContractor: 'ABC Construction Co.',
            projectManager: 'John Doe',
            weatherConditions: 'Cloudy, 22°C',
            entries: [
              {
                id: 'e3',
                type: 'progress',
                title: 'Structural Framing',
                description: 'Completed 60% of Level 2 structural framing',
                priority: 'high'
              },
              {
                id: 'e4',
                type: 'materials',
                title: 'Material Delivery',
                description: 'Received steel beams for Level 3 framing',
                priority: 'medium'
              }
            ],
            workPerformed: 'Continued structural framing for Level 2',
            workPlanned: 'Complete Level 2 framing and begin Level 3',
            issues: 'None',
            safetyNotes: 'All safety protocols followed',
            createdBy: 'user1',
            createdByName: 'Jane Smith',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            lastUpdated: new Date(),
            status: 'approved'
          }
        ];
        
        setDailyLogs(mockDailyLogs);
        
        // Save to offline storage for offline access
        await offlineService.saveOfflineData('dailyLogs_' + projectId, mockDailyLogs, 'dailyLogs', projectId);
      }
    } catch (error) {
      console.error('Error loading daily logs:', error);
      Alert.alert('Error', 'Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  };

  const filterDailyLogs = () => {
    let result = [...dailyLogs];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.logNumber.toLowerCase().includes(query) ||
        log.entries.some(entry => 
          entry.title.toLowerCase().includes(query) || 
          entry.description.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply status filter
    if (filterStatus) {
      result = result.filter(log => log.status === filterStatus);
    }
    
    setFilteredDailyLogs(result);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDailyLogs();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      // In a real implementation, this would sync with the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Daily logs synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync daily logs');
    }
  };

  const getStatusColor = (status: DailyLog['status']) => {
    switch (status) {
      case 'draft': return '#9E9E9E';
      case 'submitted': return '#2196F3';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getEntryTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'general': '#E3F2FD',
      'safety': '#FFEBEE',
      'quality': '#E8F5E9',
      'weather': '#FFF3E0',
      'equipment': '#F3E5F5',
      'materials': '#E0F2F1',
      'personnel': '#F1F8E9',
      'progress': '#E1F5FE'
    };
    
    return typeColors[type] || '#F5F5F5';
  };

  const renderDailyLogItem = ({ item }: { item: DailyLog }) => (
    <Card style={styles.dailyLogCard}>
      <Card.Content>
        <View style={styles.dailyLogHeader}>
          <Title style={styles.dailyLogTitle}>Daily Log - {new Date(item.date).toLocaleDateString()}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>
        
        <Text style={styles.logNumber}>{item.logNumber}</Text>
        <Text style={styles.contractorInfo}>Contractor: {item.generalContractor}</Text>
        <Text style={styles.managerInfo}>Project Manager: {item.projectManager}</Text>
        
        {item.weatherConditions && (
          <View style={styles.weatherSection}>
            <Text style={styles.sectionTitle}>Weather Conditions</Text>
            <Text style={styles.weatherText}>{item.weatherConditions}</Text>
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Entries ({item.entries.length})</Text>
          {item.entries.map(entry => (
            <View key={entry.id} style={styles.entryItem}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Chip 
                  style={[
                    styles.entryTypeChip, 
                    { backgroundColor: getEntryTypeColor(entry.type) }
                  ]}
                  textStyle={styles.chipText}
                >
                  {entry.type}
                </Chip>
              </View>
              <Text style={styles.entryDescription}>{entry.description}</Text>
              {entry.priority && (
                <Chip 
                  style={styles.priorityChip}
                  textStyle={styles.chipText}
                >
                  Priority: {entry.priority}
                </Chip>
              )}
            </View>
          ))}
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Work Performed:</Text>
            <Text style={styles.summaryText}>{item.workPerformed}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Work Planned:</Text>
            <Text style={styles.summaryText}>{item.workPlanned}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Issues:</Text>
            <Text style={styles.summaryText}>{item.issues || 'None'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Safety Notes:</Text>
            <Text style={styles.summaryText}>{item.safetyNotes}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const statusOptions = ['draft', 'submitted', 'approved', 'rejected'];

  return (
    <ConstructionBaseScreen
      title="Daily Logs"
      entityType="dailyLog"
      projectId={projectId}
      onRefresh={handleRefresh}
      onSync={handleSync}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.searchSection}>
            <Searchbar
              placeholder="Search daily logs..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterChips}
            >
              <Chip 
                mode={filterStatus === null ? 'flat' : 'outlined'}
                onPress={() => setFilterStatus(null)}
                style={styles.filterChip}
              >
                All
              </Chip>
              {statusOptions.map(status => (
                <Chip 
                  key={status}
                  mode={filterStatus === status ? 'flat' : 'outlined'}
                  onPress={() => setFilterStatus(status)}
                  style={styles.filterChip}
                >
                  {status}
                </Chip>
              ))}
            </ScrollView>
          </View>
          
          <FlatList
            data={filteredDailyLogs}
            renderItem={renderDailyLogItem}
            keyExtractor={(item: DailyLog) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No daily logs found</Text>
                <Button mode="outlined" onPress={loadDailyLogs} style={styles.retryButton}>
                  Retry
                </Button>
              </View>
            }
          />
        </View>
      )}
    </ConstructionBaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  dailyLogCard: {
    marginBottom: 16,
  },
  dailyLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dailyLogTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  logNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contractorInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  managerInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  weatherSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    marginVertical: 12,
  },
  entriesSection: {
    marginBottom: 12,
  },
  entryItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  entryTypeChip: {
    height: 20,
  },
  entryDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  priorityChip: {
    backgroundColor: '#FFF3E0',
    height: 20,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
  },
  summarySection: {
    marginBottom: 8,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});

export default DailyLogsScreen;