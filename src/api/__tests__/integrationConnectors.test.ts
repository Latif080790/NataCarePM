/**
 * Integration Connectors Tests
 * NataCarePM - Phase 4.4: Third-Party Integrations
 */

import { MicrosoftProjectConnector, PrimaveraConnector, SAPConnector } from '../integrationConnectors';
import { BaseIntegrationConnector } from '../integrationConnectors/baseConnector';

describe('Integration Connectors', () => {
  describe('Microsoft Project Connector', () => {
    let connector: MicrosoftProjectConnector;

    beforeEach(() => {
      const config = {
        id: 'test-ms-project',
        name: 'Test Microsoft Project',
        type: 'microsoft_project' as const,
        baseUrl: 'https://graph.microsoft.com',
        authType: 'oauth2' as const,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        },
        enabled: true,
        syncFrequency: 'hourly' as const
      };
      
      connector = new MicrosoftProjectConnector(config);
    });

    it('should initialize correctly', async () => {
      await connector.initialize();
      expect(connector).toBeInstanceOf(MicrosoftProjectConnector);
      expect(connector).toBeInstanceOf(BaseIntegrationConnector);
    });

    it('should authenticate successfully', async () => {
      const result = await connector.authenticate();
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should map status correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapStatusToMicrosoft('not_started')).toBe('notStarted');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapStatusToMicrosoft('in_progress')).toBe('inProgress');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapStatusToMicrosoft('completed')).toBe('completed');
    });

    it('should map priority correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapPriorityToMicrosoft('low')).toBe(200);
      // @ts-ignore - accessing private method for testing
      expect(connector.mapPriorityToMicrosoft('medium')).toBe(500);
      // @ts-ignore - accessing private method for testing
      expect(connector.mapPriorityToMicrosoft('high')).toBe(800);
      // @ts-ignore - accessing private method for testing
      expect(connector.mapPriorityToMicrosoft('critical')).toBe(950);
    });

    it('should map resource type correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToMicrosoft('human')).toBe('work');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToMicrosoft('equipment')).toBe('work');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToMicrosoft('material')).toBe('material');
    });
  });

  describe('Primavera Connector', () => {
    let connector: PrimaveraConnector;

    beforeEach(() => {
      const config = {
        id: 'test-primavera',
        name: 'Test Primavera',
        type: 'primavera' as const,
        baseUrl: 'https://primavera.example.com',
        authType: 'basic' as const,
        credentials: {
          username: 'test-user',
          password: 'test-password'
        },
        enabled: true,
        syncFrequency: 'daily' as const
      };
      
      connector = new PrimaveraConnector(config);
    });

    it('should initialize correctly', async () => {
      await connector.initialize();
      expect(connector).toBeInstanceOf(PrimaveraConnector);
      expect(connector).toBeInstanceOf(BaseIntegrationConnector);
    });

    it('should authenticate successfully', async () => {
      const result = await connector.authenticate();
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should map project status correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapProjectStatus('Active')).toBe('active');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapProjectStatus('Inactive')).toBe('on_hold');
    });

    it('should map activity status correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapActivityStatus('Not Started')).toBe('not_started');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapActivityStatus('In Progress')).toBe('in_progress');
    });

    it('should map activity priority correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapActivityPriority('Low')).toBe('low');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapActivityPriority('High')).toBe('high');
    });

    it('should map resource type correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToPrimavera('human')).toBe('Labor');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToPrimavera('equipment')).toBe('Nonlabor');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToPrimavera('material')).toBe('Material');
    });
  });

  describe('SAP Connector', () => {
    let connector: SAPConnector;

    beforeEach(() => {
      const config = {
        id: 'test-sap',
        name: 'Test SAP',
        type: 'sap' as const,
        baseUrl: 'https://sap.example.com',
        authType: 'basic' as const,
        credentials: {
          username: 'test-user',
          password: 'test-password'
        },
        enabled: true,
        syncFrequency: 'daily' as const
      };
      
      connector = new SAPConnector(config);
    });

    it('should initialize correctly', async () => {
      await connector.initialize();
      expect(connector).toBeInstanceOf(SAPConnector);
      expect(connector).toBeInstanceOf(BaseIntegrationConnector);
    });

    it('should authenticate successfully', async () => {
      const result = await connector.authenticate();
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should calculate duration correctly', () => {
      // @ts-ignore - accessing private method for testing
      const duration = connector.calculateDuration('2023-01-01', '2023-01-10');
      expect(duration).toBeGreaterThanOrEqual(5); // Approximately 5 work days
      expect(duration).toBeLessThanOrEqual(10); // At most 10 calendar days
    });

    it('should map project status correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapProjectStatus('RELEASED')).toBe('active');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapProjectStatus('CLOSED')).toBe('completed');
    });

    it('should map network status correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapNetworkStatus('RELEASED')).toBe('in_progress');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapNetworkStatus('CLOSED')).toBe('completed');
    });

    it('should map network priority correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapNetworkPriority('LOW')).toBe('low');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapNetworkPriority('VERY_HIGH')).toBe('critical');
    });

    it('should map resource type correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToSAP('human')).toBe('PERSON');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToSAP('equipment')).toBe('EQUIPMENT');
      // @ts-ignore - accessing private method for testing
      expect(connector.mapResourceTypeToSAP('material')).toBe('MATERIAL');
    });
  });
});