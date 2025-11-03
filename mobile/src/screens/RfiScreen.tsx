/**
 * RFI Screen
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

interface Rfi {
  id: string;
  projectId: string;
  rfiNumber: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    category: string;
  }>;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'under_review' | 'pending_response' | 'responded' | 'approved' | 'closed' | 'cancelled';
  submittedBy: string;
  submittedByName: string;
  submittedDate: Date;
  lastUpdated: Date;
  daysOpen: number;
}

const RfiScreen = () => {
  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [filteredRfis, setFilteredRfis] = useState<Rfi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [projectId] = useState('project_123'); // This would come from navigation params

  useEffect(() => {
    loadRfis();
  }, []);

  useEffect(() => {
    filterRfis();
  }, [rfis, searchQuery, filterStatus]);

  const loadRfis = async () => {
    try {
      setLoading(true);
      
      // Try to get from offline storage first
      const offlineRfis = await offlineService.getOfflineData<Rfi[]>('rfis_' + projectId);
      
      if (offlineRfis) {
        setRfis(offlineRfis);
      } else {
        // Simulate API call - in real app this would be an actual API call
        const mockRfis: Rfi[] = [
          {
            id: 'rfi_1',
            projectId: 'project_123',
            rfiNumber: 'RFI-2024-001',
            title: 'Concrete Mix Design for Foundation',
            questions: [
              {
                id: 'q1',
                question: 'What is the recommended concrete mix design for foundation work?',
                category: 'material'
              }
            ],
            type: 'material',
            priority: 'high',
            status: 'submitted',
            submittedBy: 'user1',
            submittedByName: 'John Doe',
            submittedDate: new Date(),
            lastUpdated: new Date(),
            daysOpen: 3
          },
          {
            id: 'rfi_2',
            projectId: 'project_123',
            rfiNumber: 'RFI-2024-002',
            title: 'Structural Drawing Clarification',
            questions: [
              {
                id: 'q2',
                question: 'Please clarify the connection details at Grid Line B-5',
                category: 'design'
              }
            ],
            type: 'design',
            priority: 'medium',
            status: 'under_review',
            submittedBy: 'user2',
            submittedByName: 'Jane Smith',
            submittedDate: new Date(),
            lastUpdated: new Date(),
            daysOpen: 5
          }
        ];
        
        setRfis(mockRfis);
        
        // Save to offline storage for offline access
        await offlineService.saveOfflineData('rfis_' + projectId, mockRfis, 'rfis', projectId);
      }
    } catch (error) {
      console.error('Error loading RFIs:', error);
      Alert.alert('Error', 'Failed to load RFIs');
    } finally {
      setLoading(false);
    }
  };

  const filterRfis = () => {
    let result = [...rfis];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(rfi => 
        rfi.title.toLowerCase().includes(query) ||
        rfi.rfiNumber.toLowerCase().includes(query) ||
        rfi.questions.some(q => q.question.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filterStatus) {
      result = result.filter(rfi => rfi.status === filterStatus);
    }
    
    setFilteredRfis(result);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRfis();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      // In a real implementation, this would sync with the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'RFIs synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync RFIs');
    }
  };

  const getStatusColor = (status: Rfi['status']) => {
    switch (status) {
      case 'draft': return '#9E9E9E';
      case 'submitted': return '#2196F3';
      case 'under_review': return '#FF9800';
      case 'pending_response': return '#FFC107';
      case 'responded': return '#4CAF50';
      case 'approved': return '#4CAF50';
      case 'closed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: Rfi['priority']) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderRfiItem = ({ item }: { item: Rfi }) => (
    <Card style={styles.rfiCard}>
      <Card.Content>
        <View style={styles.rfiHeader}>
          <Title style={styles.rfiTitle}>{item.title}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status.replace('_', ' ')}
          </Chip>
        </View>
        
        <Text style={styles.rfiNumber}>{item.rfiNumber}</Text>
        
        <View style={styles.rfiMeta}>
          <Text style={styles.metaText}>Submitted by {item.submittedByName}</Text>
          <Text style={styles.metaText}>{item.daysOpen} days open</Text>
        </View>
        
        <View style={styles.rfiTags}>
          <Chip 
            style={[styles.priorityChip, { borderColor: getPriorityColor(item.priority) }]}
            textStyle={styles.chipText}
          >
            {item.priority}
          </Chip>
          <Chip 
            style={styles.typeChip}
            textStyle={styles.chipText}
          >
            {item.type}
          </Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {item.questions.map((question) => (
            <View key={question.id} style={styles.questionItem}>
              <Text style={styles.questionText}>{question.question}</Text>
              <Chip 
                style={styles.categoryChip}
                textStyle={styles.chipText}
              >
                {question.category}
              </Chip>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const statusOptions = [
    'draft', 'submitted', 'under_review', 'pending_response', 
    'responded', 'approved', 'closed', 'cancelled'
  ];

  return (
    <ConstructionBaseScreen
      title="RFIs"
      entityType="rfi"
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
              placeholder="Search RFIs..."
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
                  {status.replace('_', ' ')}
                </Chip>
              ))}
            </ScrollView>
          </View>
          
          <FlatList
            data={filteredRfis}
            renderItem={renderRfiItem}
            keyExtractor={(item: Rfi) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No RFIs found</Text>
                <Button mode="outlined" onPress={loadRfis} style={styles.retryButton}>
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
  rfiCard: {
    marginBottom: 16,
  },
  rfiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rfiTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  rfiNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rfiMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  rfiTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priorityChip: {
    marginRight: 8,
    borderWidth: 1,
  },
  typeChip: {
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  questionsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questionItem: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
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

export default RfiScreen;