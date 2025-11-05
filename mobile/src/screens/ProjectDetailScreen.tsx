/**
 * Project Detail Screen
 * NataCarePM Mobile App
 */

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
  ProgressBar,
  Button,
} from 'react-native-paper';

const ProjectDetailScreen = ({ route }: any) => {
  const { projectId } = route.params;

  // Mock project data
  const project = {
    id: projectId,
    name: 'Office Building Construction',
    description: 'Construction of a 10-story office building with modern amenities',
    status: 'In Progress',
    progress: 65,
    startDate: '2023-01-15',
    endDate: '2023-12-31',
    budget: 5000000,
    spent: 3250000,
    team: [
      { id: '1', name: 'John Doe', role: 'Project Manager' },
      { id: '2', name: 'Jane Smith', role: 'Site Engineer' },
      { id: '3', name: 'Bob Johnson', role: 'Safety Officer' },
    ],
    tasks: [
      { id: '1', name: 'Foundation Work', status: 'Completed', progress: 100 },
      { id: '2', name: 'Structural Framing', status: 'In Progress', progress: 75 },
      { id: '3', name: 'Electrical Installation', status: 'Pending', progress: 0 },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{project.name}</Title>
          <Paragraph>{project.description}</Paragraph>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Status</Text>
            <View style={styles.statusContainer}>
              <Text>Status: {project.status}</Text>
              <Text>Progress: {project.progress}%</Text>
            </View>
            <ProgressBar progress={project.progress / 100} style={styles.progressBar} />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timelineContainer}>
              <Text>Start Date: {project.startDate}</Text>
              <Text>End Date: {project.endDate}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <View style={styles.budgetContainer}>
              <Text>Budget: ${project.budget.toLocaleString()}</Text>
              <Text>Spent: ${project.spent.toLocaleString()}</Text>
              <Text>Remaining: ${(project.budget - project.spent).toLocaleString()}</Text>
            </View>
            <ProgressBar 
              progress={project.spent / project.budget} 
              style={styles.progressBar}
              color={project.spent / project.budget > 0.8 ? '#f44336' : '#4caf50'}
            />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Team Members</Title>
          {project.team.map(member => (
            <View key={member.id} style={styles.teamMember}>
              <Text>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Tasks</Title>
          {project.tasks.map(task => (
            <View key={task.id} style={styles.task}>
              <Text>{task.name}</Text>
              <View style={styles.taskStatus}>
                <Text>Status: {task.status}</Text>
                <Text>{task.progress}%</Text>
              </View>
              <ProgressBar progress={task.progress / 100} style={styles.taskProgress} />
            </View>
          ))}
        </Card.Content>
      </Card>
      
      <View style={styles.actions}>
        <Button mode="contained" style={styles.actionButton}>
          Update Progress
        </Button>
        <Button mode="outlined" style={styles.actionButton}>
          Add Task
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  timelineContainer: {
    marginBottom: 8,
  },
  budgetContainer: {
    marginBottom: 8,
  },
  teamMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  memberRole: {
    opacity: 0.7,
  },
  task: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taskStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  taskProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ProjectDetailScreen;