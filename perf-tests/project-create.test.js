import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const createProjectTime = new Trend('create_project_time');
const createProjectFailRate = new Rate('create_project_failures');
const createDailyReportTime = new Trend('create_daily_report_time');
const createPOTime = new Trend('create_po_time');

// Test options
export const options = {
  // Stress test - gradually increase load
  stages: [
    { duration: '30s', target: 20 },   // 20 VUs for 30s
    { duration: '30s', target: 50 },   // Increase to 50 VUs
    { duration: '30s', target: 100 },  // Increase to 100 VUs
    { duration: '30s', target: 50 },   // Decrease to 50 VUs
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  
  // Define thresholds
  thresholds: {
    create_project_time: ['p(95)<1500'], // 95% of project creations under 1.5s
    create_daily_report_time: ['p(95)<1000'], // 95% of reports under 1s
    create_po_time: ['p(95)<1200'], // 95% of POs under 1.2s
    create_project_failures: ['rate<0.05'], // Less than 5% failure rate
  },
};

// Test data
const BASE_URL = 'http://localhost:5173';
const API_BASE = '/api/projects';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MTAwMDAwMDB9.example';

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  group('Create Project Resources', function () {
    // Test 1: Create a new project
    const projectPayload = {
      name: `Performance Test Project ${__VU}-${__ITER}`,
      location: 'Jakarta, Indonesia',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      description: 'Project created for performance testing',
    };

    const createProjectRes = http.post(`${BASE_URL}${API_BASE}`, JSON.stringify(projectPayload), { headers });
    createProjectTime.add(createProjectRes.timings.duration);
    
    const projectSuccess = check(createProjectRes, {
      'create project status is 201': (r) => r.status === 201,
      'create project response has id': (r) => r.json().id !== undefined,
    });
    
    createProjectFailRate.add(!projectSuccess);

    // If project creation succeeded, test creating related resources
    if (createProjectRes.status === 201) {
      const projectId = createProjectRes.json().id;
      
      // Test 2: Create daily report
      const dailyReportPayload = {
        date: '2023-01-01',
        weather: 'Cerah',
        notes: 'Performance test daily report',
        workforce: [
          { workerId: 'worker1', status: 'Hadir' },
          { workerId: 'worker2', status: 'Izin' },
        ],
        workProgress: [
          { item: 'Foundation work', progress: 10 },
        ],
      };

      const createReportRes = http.post(
        `${BASE_URL}${API_BASE}/${projectId}/daily-reports`,
        JSON.stringify(dailyReportPayload),
        { headers }
      );
      
      createDailyReportTime.add(createReportRes.timings.duration);
      
      check(createReportRes, {
        'create daily report status is 201': (r) => r.status === 201,
      });

      // Test 3: Create purchase order
      const poPayload = {
        prNumber: `PR-${__VU}-${__ITER}`,
        items: [
          {
            materialName: 'Portland Cement',
            quantity: 100,
            unit: 'bags',
            pricePerUnit: 50000,
            totalPrice: 5000000,
          },
        ],
        requester: 'test-user',
        requestDate: '2023-01-01',
      };

      const createPORes = http.post(
        `${BASE_URL}${API_BASE}/${projectId}/purchase-orders`,
        JSON.stringify(poPayload),
        { headers }
      );
      
      createPOTime.add(createPORes.timings.duration);
      
      check(createPORes, {
        'create PO status is 201': (r) => r.status === 201,
      });
    }
  });

  // Simulate user think time
  sleep(1);
}