import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const dashboardLoadTime = new Trend('dashboard_load_time');
const reportCreationTime = new Trend('report_creation_time');
const dataUpdateTime = new Trend('data_update_time');
const concurrentFailRate = new Rate('concurrent_failures');

// Test options
export const options = {
  // Concurrent user simulation
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 150,
      duration: '5m',
    },
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  
  // Define thresholds
  thresholds: {
    dashboard_load_time: ['p(95)<1200'], // 95% of dashboard loads under 1.2s
    report_creation_time: ['p(95)<1500'], // 95% of report creations under 1.5s
    data_update_time: ['p(95)<1000'], // 95% of updates under 1s
    concurrent_failures: ['rate<0.03'], // Less than 3% failure rate
    http_req_duration: ['p(95)<1500'], // 95% of requests under 1.5s
  },
};

// Test data
const BASE_URL = 'http://localhost:5173';
const API_BASE = '/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MTAwMDAwMDB9.example';

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  group('Concurrent User Scenarios', function () {
    // Scenario 1: Project manager loading dashboard
    const dashboardRes = http.get(`${BASE_URL}${API_BASE}/dashboard`, { headers });
    dashboardLoadTime.add(dashboardRes.timings.duration);
    
    check(dashboardRes, {
      'dashboard load status is 200': (r) => r.status === 200,
      'dashboard has projects': (r) => r.json().projects !== undefined,
    });
    
    concurrentFailRate.add(dashboardRes.status !== 200);

    // Scenario 2: Site supervisor creating daily report
    if (dashboardRes.status === 200 && dashboardRes.json().projects.length > 0) {
      const projectId = dashboardRes.json().projects[0].id;
      
      const reportPayload = {
        date: new Date().toISOString().split('T')[0],
        weather: 'Cerah',
        notes: 'Concurrent user test report',
        workforce: [
          { workerId: 'worker1', status: 'Hadir' },
          { workerId: 'worker2', status: 'Izin' },
        ],
      };

      const reportRes = http.post(
        `${BASE_URL}${API_BASE}/projects/${projectId}/daily-reports`,
        JSON.stringify(reportPayload),
        { headers }
      );
      
      reportCreationTime.add(reportRes.timings.duration);
      
      check(reportRes, {
        'report creation status is 201': (r) => r.status === 201,
      });
      
      concurrentFailRate.add(reportRes.status !== 201);
    }

    // Scenario 3: Finance manager updating expense status
    const expensesRes = http.get(`${BASE_URL}${API_BASE}/expenses?status=pending`, { headers });
    dashboardLoadTime.add(expensesRes.timings.duration);
    
    check(expensesRes, {
      'expenses load status is 200': (r) => r.status === 200,
    });
    
    concurrentFailRate.add(expensesRes.status !== 200);

    // Scenario 4: Logistics manager checking inventory
    const inventoryRes = http.get(`${BASE_URL}${API_BASE}/inventory?lowStock=true`, { headers });
    dashboardLoadTime.add(inventoryRes.timings.duration);
    
    check(inventoryRes, {
      'inventory load status is 200': (r) => r.status === 200,
    });
    
    concurrentFailRate.add(inventoryRes.status !== 200);
  });

  // Variable think time to simulate real user behavior
  sleep(Math.random() * 3 + 1);
}