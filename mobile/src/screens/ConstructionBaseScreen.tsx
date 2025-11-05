/**
 * Base Construction Screen Component
 * NataCarePM Mobile App
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Button, IconButton } from 'react-native-paper';
import { offlineService } from '../services/offlineService';

interface ConstructionBaseScreenProps {
  title: string;
  entityType: string;
  projectId: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  onSync?: () => Promise<void>;
}

const ConstructionBaseScreen: React.FC<ConstructionBaseScreenProps> = ({
  title,
  entityType,
  projectId,
  children,
  onRefresh,
  onSync,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial sync queue size
    offlineService.getSyncQueueSize().then(setSyncQueueSize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleSync = async () => {
    if (onSync) {
      try {
        await onSync();
        const newSize = await offlineService.getSyncQueueSize();
        setSyncQueueSize(newSize);
        Alert.alert('Success', 'Sync completed successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to sync data');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{title}</Title>
        <View style={styles.headerActions}>
          {!isOnline && syncQueueSize > 0 && (
            <IconButton
              icon="sync-alert"
              size={24}
              onPress={handleSync}
              style={styles.syncButton}
            />
          )}
          <IconButton
            icon={isOnline ? "wifi" : "wifi-off"}
            size={24}
            iconColor={isOnline ? "#4CAF50" : "#F44336"}
          />
        </View>
      </View>

      {syncQueueSize > 0 && (
        <Card style={styles.offlineIndicator}>
          <Card.Content style={styles.offlineContent}>
            <Text style={styles.offlineText}>
              {syncQueueSize} item{syncQueueSize !== 1 ? 's' : ''} waiting to sync
            </Text>
            {isOnline && (
              <Button 
                mode="outlined" 
                onPress={handleSync}
                style={styles.syncButton}
                compact
              >
                Sync Now
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    marginRight: 8,
  },
  offlineIndicator: {
    margin: 16,
    marginVertical: 8,
    backgroundColor: '#FFF3E0',
  },
  offlineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineText: {
    color: '#E65100',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default ConstructionBaseScreen;