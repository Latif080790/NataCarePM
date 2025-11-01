/**
 * Projects Screen
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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const ProjectsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const projects = [
    {
      id: '1',
      name: 'Office Building Construction',
      status: 'In Progress',
      progress: 65,
      startDate: '2023-01-15',
      endDate: '2023-12-31',
    },
    {
      id: '2',
      name: 'Residential Complex',
      status: 'Planning',
      progress: 10,
      startDate: '2023-03-01',
      endDate: '2024-06-30',
    },
    {
      id: '3',
      name: 'Highway Expansion',
      status: 'Completed',
      progress: 100,
      startDate: '2022-06-01',
      endDate: '2023-05-31',
    },
  ];

  const handleProjectPress = (projectId: string) => {
    // @ts-ignore
    navigation.navigate('ProjectDetail', { projectId });
  };

  const renderProject = ({ item }: { item: any }) => (
    <Card style={styles.projectCard} onPress={() => handleProjectPress(item.id)}>
      <Card.Content>
        <View style={styles.projectHeader}>
          <Title style={styles.projectTitle}>{item.name}</Title>
          <IconButton
            icon="information-outline"
            size={20}
            onPress={() => handleProjectPress(item.id)}
          />
        </View>
        <Paragraph>Status: {item.status}</Paragraph>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${item.progress}%` }
            ]} 
          />
        </View>
        <View style={styles.projectFooter}>
          <Text>{item.progress}% Complete</Text>
          <Text>{item.startDate} - {item.endDate}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search projects"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      
      <Button
        mode="contained"
        onPress={() => {}}
        style={styles.fab}
      >
        New Project
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
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  projectCard: {
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectTitle: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fab: {
    margin: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default ProjectsScreen;