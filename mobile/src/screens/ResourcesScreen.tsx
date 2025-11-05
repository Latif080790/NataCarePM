/**
 * Resources Screen
 * NataCarePM Mobile App
 */

import React, { useState } from 'react';
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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const ResourcesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
//   const navigation = useNavigation(); // Unused variable

  const resources = [
    {
      id: '1',
      name: 'Excavator Model X200',
      type: 'equipment',
      status: 'available',
      location: 'Site A',
      lastUsed: '2023-06-10',
    },
    {
      id: '2',
      name: 'John Smith - Senior Engineer',
      type: 'human',
      status: 'allocated',
      location: 'Site B',
      lastUsed: '2023-06-15',
    },
    {
      id: '3',
      name: 'Concrete Mix Type C',
      type: 'material',
      status: 'low-stock',
      location: 'Warehouse',
      lastUsed: '2023-06-12',
    },
    {
      id: '4',
      name: 'Bob Johnson - Crane Operator',
      type: 'human',
      status: 'available',
      location: 'Site A',
      lastUsed: '2023-06-05',
    },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'allocated': return '#2196F3';
      case 'maintenance': return '#FF9800';
      case 'low-stock': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'human': return '#2196F3';
      case 'equipment': return '#4CAF50';
      case 'material': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderResource = ({ item }: { item: any }) => (
    <Card style={styles.resourceCard}>
      <Card.Content>
        <View style={styles.resourceHeader}>
          <Title style={styles.resourceTitle}>{item.name}</Title>
          <Chip 
            style={[styles.typeChip, { backgroundColor: getTypeColor(item.type) }]}
            textStyle={styles.chipText}
          >
            {item.type}
          </Chip>
        </View>
        <View style={styles.resourceDetails}>
          <Text style={styles.detailText}>Status: {item.status}</Text>
          <Text style={styles.detailText}>Location: {item.location}</Text>
          <Text style={styles.detailText}>Last Used: {item.lastUsed}</Text>
        </View>
        <View style={styles.resourceFooter}>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status.replace('-', ' ')}
          </Chip>
          <IconButton
            icon="information-outline"
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
          placeholder="Search resources"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Chip 
            mode={filterType === 'all' ? 'flat' : 'outlined'} 
            onPress={() => setFilterType('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip 
            mode={filterType === 'human' ? 'flat' : 'outlined'} 
            onPress={() => setFilterType('human')}
            style={styles.filterChip}
          >
            Human
          </Chip>
          <Chip 
            mode={filterType === 'equipment' ? 'flat' : 'outlined'} 
            onPress={() => setFilterType('equipment')}
            style={styles.filterChip}
          >
            Equipment
          </Chip>
          <Chip 
            mode={filterType === 'material' ? 'flat' : 'outlined'} 
            onPress={() => setFilterType('material')}
            style={styles.filterChip}
          >
            Material
          </Chip>
        </View>
      </View>
      
      <FlatList
        data={filteredResources}
        renderItem={renderResource}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      
      <Button
        mode="contained"
        onPress={() => {}}
        style={styles.fab}
      >
        Add Resource
      </Button>
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
  resourceCard: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceTitle: {
    flex: 1,
    fontSize: 16,
  },
  typeChip: {
    height: 24,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  resourceDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusChip: {
    height: 24,
  },
  fab: {
    margin: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default ResourcesScreen;