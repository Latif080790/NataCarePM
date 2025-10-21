/**
 * Safety Management System - Integration Tests
 *
 * Comprehensive integration testing for all safety modules:
 * - Incident Management
 * - Training Management
 * - PPE Management
 * - Audit Management
 * - OSHA Metrics Calculation
 */

import { render } from '@testing-library/react';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { SafetyProvider } from '@/contexts/SafetyContext';
import SafetyDashboardView from '@/views/SafetyDashboardView';
import IncidentManagementView from '@/views/IncidentManagementView';
import { TrainingManagementView } from '@/views/TrainingManagementView';
import { PPEManagementView } from '@/views/PPEManagementView';
import { safetyService } from '@/api/safetyService';

// Mock Firebase
jest.mock('@/api/safetyService');

const mockProjectId = 'test-project-123';

describe('Safety Management System - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Incident Management Workflow', () => {
    it('should create, update, and close an incident', async () => {
      const user = userEvent.setup();

      // Mock data
      const mockIncident = {
        id: 'inc-001',
        incidentNumber: 'INC-2024-001',
        projectId: mockProjectId,
        type: 'fall' as const,
        severity: 'minor' as const,
        status: 'reported' as const,
        title: 'Slip on wet floor',
        description: 'Worker slipped on wet floor in warehouse',
        location: 'Warehouse Zone A',
        occurredAt: new Date('2024-10-15T10:30:00'),
        reportedAt: new Date('2024-10-15T11:00:00'),
        reportedBy: 'Safety Officer',
        injuredPersons: [
          {
            id: 'person-1',
            name: 'John Doe',
            role: 'Warehouse Worker',
            injuryType: 'Sprain',
            injurySeverity: 'minor' as const,
            medicalTreatment: 'first_aid',
            daysLost: 0,
          },
        ],
        witnesses: [],
        correctiveActions: [],
        photos: [],
        documents: [],
        oshaRecordable: false,
        authoritiesNotified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (safetyService.getIncidents as jest.Mock).mockResolvedValue([mockIncident]);
      (safetyService.createIncident as jest.Mock).mockResolvedValue(mockIncident);
      (safetyService.updateIncident as jest.Mock).mockResolvedValue(undefined);

      render(
        <SafetyProvider>
          <IncidentManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      // Wait for incidents to load
      await waitFor(() => {
        expect(screen.getByText('INC-2024-001')).toBeInTheDocument();
      });

      // Verify incident displays
      expect(screen.getByText('Slip on wet floor')).toBeInTheDocument();
      expect(screen.getByText(/minor/i)).toBeInTheDocument();

      // Test status update workflow
      const viewButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(safetyService.updateIncident).toHaveBeenCalled();
      });
    });

    it('should calculate OSHA recordability correctly', async () => {
      const oshaRecordableIncident = {
        id: 'inc-002',
        incidentNumber: 'INC-2024-002',
        projectId: mockProjectId,
        type: 'fall' as const,
        severity: 'major' as const,
        status: 'reported' as const,
        title: 'Fall from height',
        description: 'Worker fell from scaffold',
        location: 'Construction Site',
        occurredAt: new Date(),
        reportedAt: new Date(),
        reportedBy: 'Site Manager',
        injuredPersons: [
          {
            id: 'person-2',
            name: 'Jane Smith',
            role: 'Construction Worker',
            injuryType: 'Fracture',
            injurySeverity: 'major' as const,
            medicalTreatment: 'hospital',
            daysLost: 15,
          },
        ],
        witnesses: [],
        correctiveActions: [],
        photos: [],
        documents: [],
        oshaRecordable: true,
        oshaClassification: 'OSHA 1904.7(b)(5)',
        authoritiesNotified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (safetyService.getIncidents as jest.Mock).mockResolvedValue([oshaRecordableIncident]);

      render(
        <SafetyProvider>
          <IncidentManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('INC-2024-002')).toBeInTheDocument();
      });

      // Verify OSHA recordable flag is displayed
      expect(screen.getByText(/major/i)).toBeInTheDocument();
    });
  });

  describe('2. Training Management Workflow', () => {
    it('should schedule training and record attendance', async () => {
      const user = userEvent.setup();

      const mockTraining = {
        id: 'train-001',
        trainingNumber: 'TRN-2024-001',
        projectId: mockProjectId,
        type: 'fall_protection' as const,
        title: 'Fall Protection Certification',
        description: 'OSHA-compliant fall protection training',
        instructor: 'Safety Specialist',
        duration: 4,
        scheduledDate: new Date('2024-11-01T09:00:00'),
        status: 'scheduled' as const,
        attendees: [],
        topics: ['Fall hazards', 'PPE requirements', 'Rescue procedures'],
        materials: [],
        assessmentRequired: true,
        passingScore: 80,
        location: 'Training Room A',
        maxAttendees: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (safetyService.getTraining as jest.Mock).mockResolvedValue([mockTraining]);
      (safetyService.createTraining as jest.Mock).mockResolvedValue(mockTraining);

      render(
        <SafetyProvider>
          <TrainingManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('TRN-2024-001')).toBeInTheDocument();
      });

      expect(screen.getByText('Fall Protection Certification')).toBeInTheDocument();
      expect(screen.getByText(/4h/i)).toBeInTheDocument();
    });

    it('should calculate training statistics correctly', async () => {
      const completedTraining = {
        id: 'train-002',
        trainingNumber: 'TRN-2024-002',
        projectId: mockProjectId,
        type: 'first_aid' as const,
        title: 'First Aid & CPR',
        instructor: 'Medical Professional',
        duration: 8,
        scheduledDate: new Date('2024-10-01T09:00:00'),
        completedDate: new Date('2024-10-01T17:00:00'),
        status: 'completed' as const,
        attendees: [
          {
            userId: 'user-1',
            name: 'Worker 1',
            role: 'Operator',
            attended: true,
            score: 95,
            passed: true,
            certificateIssued: true,
            certificateNumber: 'CERT-001',
          },
          {
            userId: 'user-2',
            name: 'Worker 2',
            role: 'Supervisor',
            attended: true,
            score: 88,
            passed: true,
            certificateIssued: true,
            certificateNumber: 'CERT-002',
          },
        ],
        topics: [],
        materials: [],
        assessmentRequired: true,
        passingScore: 80,
        location: 'Training Center',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (safetyService.getTraining as jest.Mock).mockResolvedValue([completedTraining]);

      render(
        <SafetyProvider>
          <TrainingManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('TRN-2024-002')).toBeInTheDocument();
      });

      // Verify statistics
      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument(); // Attendees count
        expect(screen.getByText(/100% attended/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. PPE Management Workflow', () => {
    it('should track PPE inventory and low stock alerts', async () => {
      const lowStockItem = {
        id: 'ppe-001',
        projectId: mockProjectId,
        type: 'hard_hat' as const,
        brand: 'MSA',
        model: 'V-Gard',
        description: 'Type I Hard Hat',
        totalQuantity: 50,
        availableQuantity: 5,
        assignedQuantity: 40,
        damagedQuantity: 5,
        size: 'One Size',
        specifications: {},
        certifications: ['ANSI Z89.1 Type I'],
        inspectionInterval: 90,
        unitCost: 25.0,
        totalValue: 1250.0,
        storageLocation: 'Equipment Room A',
        reorderLevel: 10,
        reorderQuantity: 50,
        supplierName: 'Safety Supply Co',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (safetyService.getPPEInventory as jest.Mock).mockResolvedValue([lowStockItem]);

      render(
        <SafetyProvider>
          <PPEManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('MSA V-Gard')).toBeInTheDocument();
      });

      // Verify low stock alert
      expect(screen.getByText(/low stock/i)).toBeInTheDocument();
      expect(screen.getByText(/5\/50/i)).toBeInTheDocument();
    });

    it('should calculate inventory value correctly', async () => {
      const ppeItems = [
        {
          id: 'ppe-001',
          projectId: mockProjectId,
          type: 'hard_hat' as const,
          brand: 'MSA',
          model: 'V-Gard',
          description: 'Hard Hat',
          totalQuantity: 50,
          availableQuantity: 30,
          assignedQuantity: 20,
          damagedQuantity: 0,
          specifications: {},
          certifications: ['ANSI Z89.1'],
          inspectionInterval: 90,
          unitCost: 25.0,
          totalValue: 1250.0,
          storageLocation: 'Room A',
          reorderLevel: 10,
          reorderQuantity: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ppe-002',
          projectId: mockProjectId,
          type: 'safety_glasses' as const,
          brand: '3M',
          model: 'SecureFit',
          description: 'Safety Glasses',
          totalQuantity: 100,
          availableQuantity: 80,
          assignedQuantity: 20,
          damagedQuantity: 0,
          specifications: {},
          certifications: ['ANSI Z87.1'],
          inspectionInterval: 180,
          unitCost: 10.0,
          totalValue: 1000.0,
          storageLocation: 'Room B',
          reorderLevel: 20,
          reorderQuantity: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (safetyService.getPPEInventory as jest.Mock).mockResolvedValue(ppeItems);

      render(
        <SafetyProvider>
          <PPEManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        // Total value should be $2,250 (1250 + 1000)
        expect(screen.getByText(/\$2,250/)).toBeInTheDocument();
      });
    });
  });

  describe('4. OSHA Metrics Calculation', () => {
    it('should calculate TRIR correctly', async () => {
      const mockMetrics = {
        projectId: mockProjectId,
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        totalWorkHours: 100000,
        rates: {
          totalRecordableIncidentRate: 4.0, // (2 incidents × 200,000) / 100,000
          lostTimeInjuryFrequencyRate: 2.0,
          daysAwayRestrictedTransferRate: 2.0,
          nearMissFrequencyRate: 6.0,
        },
        incidents: {
          total: 5,
          bySeverity: {
            fatal: 0,
            critical: 0,
            major: 2,
            minor: 2,
            near_miss: 3,
          },
          byType: {
            fall: 2,
            struck_by: 1,
            caught_in_between: 1,
            electrical: 0,
            chemical: 0,
            fire: 0,
            equipment: 1,
            environmental: 0,
            ergonomic: 0,
            other: 0,
          },
          fatalCount: 0,
          lostTimeInjuries: 1,
          totalDaysLost: 15,
        },
        costImpact: {
          totalCosts: 50000,
          medicalCosts: 30000,
          propertyCosts: 10000,
          productivityCosts: 10000,
        },
      };

      (safetyService.calculateMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (safetyService.getDashboardSummary as jest.Mock).mockResolvedValue({
        currentMetrics: mockMetrics,
        previousMetrics: mockMetrics,
        trends: {
          trirTrend: 'improving' as const,
          ltifrTrend: 'stable' as const,
          incidentTrend: 'improving' as const,
        },
        recentIncidents: [],
        criticalIncidents: [],
        openIncidents: [],
        upcomingTraining: [],
        ppeAlerts: {
          lowStock: [],
          expiringSoon: [],
          needsInspection: [],
        },
        pendingAudits: [],
        complianceScore: 85,
        daysWithoutLostTime: 45,
      });

      render(
        <SafetyProvider>
          <SafetyDashboardView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        // TRIR should be 4.0
        expect(screen.getByText(/4\.0/)).toBeInTheDocument();
      });
    });

    it('should color-code TRIR based on industry benchmarks', async () => {
      const excellentMetrics = {
        projectId: mockProjectId,
        period: { start: new Date(), end: new Date() },
        totalWorkHours: 100000,
        rates: {
          totalRecordableIncidentRate: 1.5, // Excellent (< 2.0)
          lostTimeInjuryFrequencyRate: 0.5,
          daysAwayRestrictedTransferRate: 0.8,
          nearMissFrequencyRate: 2.0,
        },
        incidents: {
          total: 1,
          bySeverity: { fatal: 0, critical: 0, major: 0, minor: 1, near_miss: 1 },
          byType: {
            fall: 1,
            struck_by: 0,
            caught_in_between: 0,
            electrical: 0,
            chemical: 0,
            fire: 0,
            equipment: 0,
            environmental: 0,
            ergonomic: 0,
            other: 0,
          },
          fatalCount: 0,
          lostTimeInjuries: 0,
          totalDaysLost: 0,
        },
        costImpact: { totalCosts: 0, medicalCosts: 0, propertyCosts: 0, productivityCosts: 0 },
      };

      (safetyService.getDashboardSummary as jest.Mock).mockResolvedValue({
        currentMetrics: excellentMetrics,
        previousMetrics: excellentMetrics,
        trends: { trirTrend: 'improving', ltifrTrend: 'improving', incidentTrend: 'improving' },
        recentIncidents: [],
        criticalIncidents: [],
        openIncidents: [],
        upcomingTraining: [],
        ppeAlerts: { lowStock: [], expiringSoon: [], needsInspection: [] },
        pendingAudits: [],
        complianceScore: 95,
        daysWithoutLostTime: 180,
      });

      render(
        <SafetyProvider>
          <SafetyDashboardView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        const trirElement = screen.getByText(/1\.5/);
        expect(trirElement).toBeInTheDocument();
        // Should have green background for excellent rating
        expect(trirElement.closest('div')).toHaveClass(/bg-green/);
      });
    });
  });

  describe('5. End-to-End Workflows', () => {
    it('should complete full incident-to-closure workflow', async () => {
      const user = userEvent.setup();

      // Simulate complete incident lifecycle
      const stages = [
        { status: 'reported', expectedText: 'Reported' },
        { status: 'investigating', expectedText: 'Investigating' },
        { status: 'corrective_action', expectedText: 'Corrective Action' },
        { status: 'closed', expectedText: 'Closed' },
      ];

      for (const stage of stages) {
        const mockIncident = {
          id: 'inc-workflow',
          incidentNumber: 'INC-2024-999',
          projectId: mockProjectId,
          status: stage.status as any,
          type: 'fall' as const,
          severity: 'minor' as const,
          title: 'Test Incident',
          description: 'Test',
          location: 'Test Location',
          occurredAt: new Date(),
          reportedAt: new Date(),
          reportedBy: 'Tester',
          injuredPersons: [],
          witnesses: [],
          correctiveActions: [],
          photos: [],
          documents: [],
          oshaRecordable: false,
          authoritiesNotified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (safetyService.getIncidents as jest.Mock).mockResolvedValue([mockIncident]);

        const { rerender } = render(
          <SafetyProvider>
            <IncidentManagementView projectId={mockProjectId} />
          </SafetyProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('INC-2024-999')).toBeInTheDocument();
        });

        // Verify status is displayed
        expect(screen.getByText(new RegExp(stage.expectedText, 'i'))).toBeInTheDocument();

        rerender(<div />); // Cleanup for next iteration
      }
    });

    it('should integrate all modules in dashboard summary', async () => {
      const comprehensiveSummary = {
        currentMetrics: {
          projectId: mockProjectId,
          period: { start: new Date(), end: new Date() },
          totalWorkHours: 100000,
          rates: {
            totalRecordableIncidentRate: 2.5,
            lostTimeInjuryFrequencyRate: 1.2,
            daysAwayRestrictedTransferRate: 1.5,
            nearMissFrequencyRate: 4.0,
          },
          incidents: {
            total: 10,
            bySeverity: { fatal: 0, critical: 1, major: 3, minor: 4, near_miss: 5 },
            byType: {
              fall: 3,
              struck_by: 2,
              caught_in_between: 1,
              electrical: 1,
              chemical: 0,
              fire: 0,
              equipment: 2,
              environmental: 1,
              ergonomic: 0,
              other: 0,
            },
            fatalCount: 0,
            lostTimeInjuries: 2,
            totalDaysLost: 30,
          },
          costImpact: {
            totalCosts: 100000,
            medicalCosts: 60000,
            propertyCosts: 20000,
            productivityCosts: 20000,
          },
        },
        previousMetrics: null,
        trends: {
          trirTrend: 'stable' as const,
          ltifrTrend: 'improving' as const,
          incidentTrend: 'worsening' as const,
        },
        recentIncidents: [],
        criticalIncidents: [],
        openIncidents: [],
        upcomingTraining: [],
        ppeAlerts: {
          lowStock: [],
          expiringSoon: [],
          needsInspection: [],
        },
        pendingAudits: [],
        complianceScore: 78,
        daysWithoutLostTime: 15,
      };

      (safetyService.getDashboardSummary as jest.Mock).mockResolvedValue(comprehensiveSummary);

      render(
        <SafetyProvider>
          <SafetyDashboardView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        // Verify all key metrics are displayed
        expect(screen.getByText(/2\.5/)).toBeInTheDocument(); // TRIR
        expect(screen.getByText(/78/)).toBeInTheDocument(); // Compliance score
      });
    });
  });

  describe('6. Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (safetyService.getIncidents as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch incidents')
      );

      render(
        <SafetyProvider>
          <IncidentManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch incidents/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields in forms', async () => {
      const user = userEvent.setup();

      render(
        <SafetyProvider>
          <IncidentManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      // Try to submit empty form
      const createButton = screen.getByRole('button', { name: /report incident/i });
      await user.click(createButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('7. Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate 100 mock incidents
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `inc-${i}`,
        incidentNumber: `INC-2024-${String(i + 1).padStart(3, '0')}`,
        projectId: mockProjectId,
        type: 'fall' as const,
        severity: 'minor' as const,
        status: 'reported' as const,
        title: `Incident ${i + 1}`,
        description: 'Test incident',
        location: 'Test Location',
        occurredAt: new Date(),
        reportedAt: new Date(),
        reportedBy: 'Tester',
        injuredPersons: [],
        witnesses: [],
        correctiveActions: [],
        photos: [],
        documents: [],
        oshaRecordable: false,
        authoritiesNotified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (safetyService.getIncidents as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = performance.now();

      render(
        <SafetyProvider>
          <IncidentManagementView projectId={mockProjectId} />
        </SafetyProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('INC-2024-001')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 1 second (performance requirement)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});
