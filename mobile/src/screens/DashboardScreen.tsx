/**
 * Dashboard Screen
 * NataCarePM Mobile App
 */

import React from 'react';
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
  Avatar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();

  const handleViewProjects = () => {
    // @ts-ignore
    navigation.navigate('Projects');
  };

  const handleViewTasks = () => {
    // @ts-ignore
    navigation.navigate('Tasks');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={48} label="JD" />
        <View style={styles.headerText}>
          <Title>Welcome, John</Title>
          <Paragraph>Project Manager</Paragraph>
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Today's Overview</Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Active Projects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Upcoming Deadlines</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={handleViewProjects}
              style={styles.actionButton}
            >
              View Projects
            </Button>
            <Button
              mode="outlined"
              onPress={handleViewTasks}
              style={styles.actionButton}
            >
              View Tasks
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activity</Title>
          <Paragraph>No recent activity</Paragraph>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 16,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default DashboardScreen;