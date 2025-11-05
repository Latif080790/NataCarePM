/**
 * Reports Screen
 * NataCarePM Mobile App
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  IconButton,
  DataTable,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const ReportsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
//   const navigation = useNavigation(); // Unused variable

  const reports = [
    {
      id: '1',
      name: 'Daily Progress Report',
      type: 'daily',
      date: '2023-06-15',
      status: 'approved',
    },
    {
      id: '2',
      name: 'Weekly Safety Report',
      type: 'safety',
      date: '2023-06-12',
      status: 'pending',
    },
    {
      id: '3',
      name: 'Monthly Financial Report',
      type: 'financial',
      date: '2023-05-31',
      status: 'approved',
    },
    {
      id: '4',
      name: 'RFI Summary',
      type: 'rfi',
      date: '2023-06-10',
      status: 'draft',
    },
  ];

  const recentActivities = [
    {
      id: '1',
      description: 'Foundation work completed',
      project: 'Office Building',
      date: '2023-06-15',
      user: 'John Doe',
    },
    {
      id: '2',
      description: 'Safety inspection passed',
      project: 'Residential Complex',
      date: '2023-06-14',
      user: 'Jane Smith',
    },
    {
      id: '3',
      description: 'Material delivery delayed',
      project: 'Highway Expansion',
      date: '2023-06-13',
      user: 'Bob Johnson',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search reports"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Recent Reports</Title>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => {}}
            />
          </View>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title numeric>Type</DataTable.Title>
              <DataTable.Title numeric>Date</DataTable.Title>
              <DataTable.Title numeric>Status</DataTable.Title>
            </DataTable.Header>
            
            {reports.map((report) => (
              <DataTable.Row key={report.id}>
                <DataTable.Cell>{report.name}</DataTable.Cell>
                <DataTable.Cell numeric>{report.type}</DataTable.Cell>
                <DataTable.Cell numeric>{report.date}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={[
                    styles.statusText,
                    report.status === 'approved' && styles.approved,
                    report.status === 'pending' && styles.pending,
                    report.status === 'draft' && styles.draft,
                  ]}>
                    {report.status}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activities</Title>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Paragraph>{activity.description}</Paragraph>
              <View style={styles.activityDetails}>
                <Text style={styles.detailText}>{activity.project}</Text>
                <Text style={styles.detailText}>{activity.date}</Text>
                <Text style={styles.detailText}>{activity.user}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Reports</Title>
          <View style={styles.quickActions}>
            <Button mode="outlined" style={styles.quickButton}>
              Daily Log
            </Button>
            <Button mode="outlined" style={styles.quickButton}>
              RFI Report
            </Button>
            <Button mode="outlined" style={styles.quickButton}>
              Submittal Status
            </Button>
            <Button mode="outlined" style={styles.quickButton}>
              Resource Utilization
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  card: {
    margin: 16,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    textTransform: 'capitalize',
  },
  approved: {
    color: '#4CAF50',
  },
  pending: {
    color: '#FF9800',
  },
  draft: {
    color: '#2196F3',
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  quickButton: {
    margin: 4,
  },
});

export default ReportsScreen;