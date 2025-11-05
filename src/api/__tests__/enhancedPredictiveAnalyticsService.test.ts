/**
 * Enhanced Predictive Analytics Service Tests
 * NataCarePM - Phase 4.2: AI & Analytics
 */

import { enhancedPredictiveAnalyticsService, FeatureEngineer, EnsembleForecaster } from '../enhancedPredictiveAnalyticsService';
import { Project } from '@/types';

// Mock Firebase
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  Timestamp: {
    fromDate: vi.fn(),
    toDate: vi.fn(),
  },
  addDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe('EnhancedPredictiveAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FeatureEngineer', () => {
    it('should extract features from project data', () => {
      const project = {
        id: 'test-project',
        name: 'Test Project',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        items: [
          { volume: 100, hargaSatuan: 50, progress: 50 },
          { volume: 200, hargaSatuan: 75, progress: 30 },
        ],
        expenses: [
          { amount: 1000, date: '2023-01-15' },
          { amount: 2000, date: '2023-02-15' },
        ],
        team: [{ id: 'worker1' }, { id: 'worker2' }],
      } as unknown as Project;

      const externalFactors = [
        { category: 'economic', currentValue: 0.5 },
        { category: 'weather', currentValue: 0.3 },
        { category: 'market', currentValue: 0.7 },
      ];

      const features = FeatureEngineer.extractProjectFeatures(project, externalFactors);

      expect(features).toHaveProperty('projectSize');
      expect(features).toHaveProperty('projectDuration');
      expect(features).toHaveProperty('taskCount');
      expect(features).toHaveProperty('teamSize');
      expect(features).toHaveProperty('budgetUtilization');
      expect(features).toHaveProperty('daysElapsed');
      expect(features).toHaveProperty('daysRemaining');
      expect(features).toHaveProperty('progressRatio');
      expect(features).toHaveProperty('costVariance');
      expect(features).toHaveProperty('scheduleVariance');
      expect(features).toHaveProperty('expenseTrend');
      expect(features).toHaveProperty('economicIndex');
      expect(features).toHaveProperty('weatherRisk');
      expect(features).toHaveProperty('marketVolatility');
    });
  });

  describe('EnsembleForecaster', () => {
    it('should initialize correctly', () => {
      const forecaster = new EnsembleForecaster();
      expect(forecaster).toBeInstanceOf(EnsembleForecaster);
    });
  });

  describe('EnhancedPredictiveAnalyticsService', () => {
    it('should initialize correctly', () => {
      expect(enhancedPredictiveAnalyticsService).toBeInstanceOf(Object);
    });
  });
});