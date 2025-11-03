/**
 * Submittals Screen
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

interface Submittal {
  id: string;
  projectId: string;
  submittalNumber: string;
  title: string;
  description: string;
  type: string;
  status: 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'resubmitted' | 'closed' | 'cancelled';
  submittedBy: string;
  submittedByName: string;
  submittedDate: Date;
  dueDate?: Date;
  lastUpdated: Date;
  daysOpen: number;
  reviewers: string[];
  reviews: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string;
    reviewDate: Date;
    status: 'approved' | 'rejected' | 'comments_required';
    comments: string;
  }>;
}

const SubmittalsScreen = () => {
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [filteredSubmittals, setFilteredSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [projectId] = useState('project_123'); // This would come from navigation params

  useEffect(() => {
    loadSubmittals();
  }, []);

  useEffect(() => {
    filterSubmittals();
  }, [submittals, searchQuery, filterStatus]);

  const loadSubmittals = async () => {
    try {
      setLoading(true);
      
      // Try to get from offline storage first
      const offlineSubmittals = await offlineService.getOfflineData<Submittal[]>('submittals_' + projectId);
      
      if (offlineSubmittals) {
        setSubmittals(offlineSubmittals);
      } else {
        // Simulate API call - in real app this would be an actual API call
        const mockSubmittals: Submittal[] = [
          {
            id: 'sub_1',
            projectId: 'project_123',
            submittalNumber: 'SUB-2024-001',
            title: 'Concrete Mix Design',
            description: 'Proposed concrete mix design for foundation work',
            type: 'product_data',
            status: 'under_review',
            submittedBy: 'user1',
            submittedByName: 'John Doe',
            submittedDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            lastUpdated: new Date(),
            daysOpen: 2,
            reviewers: ['reviewer1', 'reviewer2'],
            reviews: [
              {
                id: 'rev1',
                reviewerId: 'reviewer1',
                reviewerName: 'Jane Smith',
                reviewDate: new Date(),
                status: 'comments_required',
                comments: 'Please provide additional test results for 28-day strength'
              }
            ]
          },
          {
            id: 'sub_2',
            projectId: 'project_123',
            submittalNumber: 'SUB-2024-002',
            title: 'Structural Steel Shop Drawings',
            description: 'Shop drawings for structural steel framing',
            type: 'shop_drawings',
            status: 'approved',
            submittedBy: 'user2',
            submittedByName: 'Mike Johnson',
            submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            lastUpdated: new Date(),
            daysOpen: 5,
            reviewers: ['reviewer1'],
            reviews: [
              {
                id: 'rev2',
                reviewerId: 'reviewer1',
                reviewerName: 'Jane Smith',
                reviewDate: new Date(),
                status: 'approved',
                comments: 'Approved as submitted'
              }
            ]
          }
        ];
        
        setSubmittals(mockSubmittals);
        
        // Save to offline storage for offline access
        await offlineService.saveOfflineData('submittals_' + projectId, mockSubmittals, 'submittals', projectId);
      }
    } catch (error) {
      console.error('Error loading submittals:', error);
      Alert.alert('Error', 'Failed to load submittals');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmittals = () => {
    let result = [...submittals];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(submittal => 
        submittal.title.toLowerCase().includes(query) ||
        submittal.submittalNumber.toLowerCase().includes(query) ||
        submittal.description.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus) {
      result = result.filter(submittal => submittal.status === filterStatus);
    }
    
    setFilteredSubmittals(result);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubmittals();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      // In a real implementation, this would sync with the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Submittals synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync submittals');
    }
  };

  const getStatusColor = (status: Submittal['status']) => {
    switch (status) {
      case 'draft': return '#9E9E9E';
      case 'submitted': return '#2196F3';
      case 'under_review': return '#FF9800';
      case 'reviewed': return '#FFC107';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'resubmitted': return '#2196F3';
      case 'closed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'product_data': '#E3F2FD',
      'samples': '#E8F5E9',
      'shop_drawings': '#FFF3E0',
      'schedules': '#F3E5F5',
      'certifications': '#E0F2F1',
      'reports': '#F1F8E9',
      'specifications': '#E1F5FE',
      'other': '#F5F5F5'
    };
    
    return typeColors[type] || '#F5F5F5';
  };

  const renderSubmittalItem = ({ item }: { item: Submittal }) => (
    <Card style={styles.submittalCard}>
      <Card.Content>
        <View style={styles.submittalHeader}>
          <Title style={styles.submittalTitle}>{item.title}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status.replace('_', ' ')}
          </Chip>
        </View>
        
        <Text style={styles.submittalNumber}>{item.submittalNumber}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        <View style={styles.submittalMeta}>
          <Text style={styles.metaText}>Submitted by {item.submittedByName}</Text>
          <Text style={styles.metaText}>{item.daysOpen} days open</Text>
        </View>
        
        <View style={styles.submittalTags}>
          <Chip 
            style={[styles.typeChip, { backgroundColor: getTypeColor(item.type) }]}
            textStyle={styles.chipText}
          >
            {item.type.replace('_', ' ')}
          </Chip>
          {item.dueDate && (
            <Chip 
              style={styles.dueDateChip}
              textStyle={styles.chipText}
            >
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Chip>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {item.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Latest Review</Text>
            {item.reviews.slice(-1).map(review => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                  <Chip 
                    style={[
                      styles.reviewStatusChip, 
                      { 
                        backgroundColor: review.status === 'approved' ? '#4CAF50' : 
                                       review.status === 'rejected' ? '#F44336' : '#FFC107' 
                      }
                    ]}
                    textStyle={styles.chipText}
                  >
                    {review.status.replace('_', ' ')}
                  </Chip>
                </View>
                <Text style={styles.reviewComments}>{review.comments}</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const statusOptions = [
    'draft', 'submitted', 'under_review', 'reviewed', 'approved', 
    'rejected', 'resubmitted', 'closed', 'cancelled'
  ];

  return (
    <ConstructionBaseScreen
      title="Submittals"
      entityType="submittal"
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
              placeholder="Search submittals..."
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
            data={filteredSubmittals}
            renderItem={renderSubmittalItem}
            keyExtractor={(item: Submittal) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No submittals found</Text>
                <Button mode="outlined" onPress={loadSubmittals} style={styles.retryButton}>
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
  submittalCard: {
    marginBottom: 16,
  },
  submittalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  submittalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  submittalNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  submittalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  submittalTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeChip: {
    marginRight: 8,
  },
  dueDateChip: {
    backgroundColor: '#FFF3E0',
  },
  chipText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  reviewsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewStatusChip: {
    height: 20,
  },
  reviewComments: {
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

export default SubmittalsScreen;