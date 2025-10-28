/**
 * Integration Tests
 * 
 * Comprehensive tests for all integration services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { integrationGateway } from '../../api/integrationGateway';
import { erpIntegrationService } from '../../services/erpIntegrationService';
import { crmIntegrationService } from '../../services/crmIntegrationService';
import { accountingIntegrationService } from '../../services/accountingIntegrationService';

// Mock logger
vi.mock('../../utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('Integration Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Integration Gateway', () => {
    it('should fetch all integrations', async () => {
      const response = await integrationGateway.getIntegrations();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should create a new integration', async () => {
      const newIntegration = {
        id: 'test-001',
        name: 'Test Integration',
        type: 'erp' as const,
        baseUrl: 'https://test.example.com/api',
        authType: 'oauth2' as const,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        },
        enabled: true,
        syncFrequency: 'hourly' as const
      };

      const response = await integrationGateway.createIntegration(newIntegration);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(newIntegration.id);
      expect(response.data.name).toBe(newIntegration.name);
    });

    it('should update an existing integration', async () => {
      // First create an integration
      const initialIntegration = {
        id: 'update-test-001',
        name: 'Initial Integration',
        type: 'crm' as const,
        baseUrl: 'https://initial.example.com/api',
        authType: 'api_key' as const,
        credentials: {
          apiKey: 'initial-api-key'
        },
        enabled: true,
        syncFrequency: 'daily' as const
      };

      await integrationGateway.createIntegration(initialIntegration);

      // Then update it
      const updatedData = {
        name: 'Updated Integration',
        enabled: false
      };

      const response = await integrationGateway.updateIntegration('update-test-001', updatedData);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe(updatedData.name);
      expect(response.data.enabled).toBe(updatedData.enabled);
    });

    it('should delete an integration', async () => {
      // First create an integration
      const integrationToDelete = {
        id: 'delete-test-001',
        name: 'Integration to Delete',
        type: 'accounting' as const,
        baseUrl: 'https://delete.example.com/api',
        authType: 'basic' as const,
        credentials: {
          username: 'testuser',
          password: 'testpass'
        },
        enabled: true,
        syncFrequency: 'weekly' as const
      };

      await integrationGateway.createIntegration(integrationToDelete);

      // Then delete it
      const response = await integrationGateway.deleteIntegration('delete-test-001');
      
      expect(response.success).toBe(true);
      expect(response.data).toBe(true);
    });

    it('should get integration status', async () => {
      const response = await integrationGateway.getIntegrationStatus();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(typeof response.data.total).toBe('number');
      expect(typeof response.data.enabled).toBe('number');
      expect(typeof response.data.disabled).toBe('number');
    });
  });

  describe('ERP Integration Service', () => {
    it('should fetch organizations', async () => {
      const response = await erpIntegrationService.getOrganizations();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch projects', async () => {
      const response = await erpIntegrationService.getProjects();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch tasks', async () => {
      const response = await erpIntegrationService.getTasks();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch resources', async () => {
      const response = await erpIntegrationService.getResources();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch cost centers', async () => {
      const response = await erpIntegrationService.getCostCenters();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('CRM Integration Service', () => {
    it('should fetch contacts', async () => {
      const response = await crmIntegrationService.getContacts();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch opportunities', async () => {
      const response = await crmIntegrationService.getOpportunities();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch accounts', async () => {
      const response = await crmIntegrationService.getAccounts();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch activities', async () => {
      const response = await crmIntegrationService.getActivities();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should create a contact', async () => {
      const newContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        title: 'Test Title'
      };

      const response = await crmIntegrationService.createContact(newContact);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.firstName).toBe(newContact.firstName);
      expect(response.data.lastName).toBe(newContact.lastName);
      expect(response.data.email).toBe(newContact.email);
    });

    it('should create an opportunity', async () => {
      const newOpportunity = {
        name: 'Test Opportunity',
        accountId: 'account-001',
        contactId: 'contact-001',
        value: 10000,
        currency: 'USD',
        stage: 'prospecting' as const,
        probability: 10,
        owner: 'user-001'
      };

      const response = await crmIntegrationService.createOpportunity(newOpportunity);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe(newOpportunity.name);
      expect(response.data.value).toBe(newOpportunity.value);
    });
  });

  describe('Accounting Integration Service', () => {
    it('should fetch chart of accounts', async () => {
      const response = await accountingIntegrationService.getChartOfAccounts();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch journal entries', async () => {
      const response = await accountingIntegrationService.getJournalEntries();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch invoices', async () => {
      const response = await accountingIntegrationService.getInvoices();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch payments', async () => {
      const response = await accountingIntegrationService.getPayments();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch vendors', async () => {
      const response = await accountingIntegrationService.getVendors();
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should create a journal entry', async () => {
      const newEntry = {
        date: new Date(),
        reference: 'TEST-001',
        description: 'Test journal entry',
        status: 'draft' as const,
        lines: [
          {
            id: 'line-001',
            accountId: 'account-1000',
            debit: 1000,
            credit: 0,
            description: 'Test debit'
          },
          {
            id: 'line-002',
            accountId: 'account-2000',
            debit: 0,
            credit: 1000,
            description: 'Test credit'
          }
        ]
      };

      const response = await accountingIntegrationService.createJournalEntry(newEntry);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.reference).toBe(newEntry.reference);
      expect(response.data.description).toBe(newEntry.description);
    });

    it('should create an invoice', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-TEST-001',
        customerId: 'customer-001',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        terms: 'Net 30',
        currency: 'USD',
        exchangeRate: 1,
        subtotal: 1000,
        tax: 100,
        total: 1100,
        amountPaid: 0,
        balance: 1100,
        status: 'draft' as const,
        lines: [
          {
            id: 'invline-001',
            description: 'Test item',
            quantity: 1,
            unitPrice: 1000,
            amount: 1000,
            accountId: 'account-4000'
          }
        ]
      };

      const response = await accountingIntegrationService.createInvoice(newInvoice);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.invoiceNumber).toBe(newInvoice.invoiceNumber);
      expect(response.data.total).toBe(newInvoice.total);
    });
  });
});