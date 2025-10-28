import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const projectLoadTime = new Trend('project_load_time');
const projectLoadFailRate = new Rate('project_load_failures');

// Test options
export const options = {
  // Load test with constant VUs
  vus: 100,
  duration: '2m',
  
  // Define thresholds
  thresholds: {
    project_load_time: ['p(95)<1000'], // 95% of requests should be below 1s
    project_load_failures: ['rate<0.05'], // Error rate should be less than 5%
    http_req_duration: ['p(95)<800'], // 95% of requests should be below 800ms
  },
};

// Test data
const BASE_URL = 'http://localhost:5173';
const API_BASE = '/api/projects';

// Authentication token (in real test, this would be obtained through login)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MTAwMDAwMDB9.example';

export default function () {
  // Add authentication header
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  group('Project Data Loading', function () {
    // Test 1: Load project list
    const projectListRes = http.get(`${BASE_URL}${API_BASE}`, { headers });
    
    projectLoadTime.add(projectListRes.timings.duration);
    
    const projectLoadSuccess = check(projectListRes, {
      'project list status is 200': (r) => r.status === 200,
      'project list has data': (r) => r.json().length > 0,
    });
    
    projectLoadFailRate.add(!projectLoadSuccess);

    // Test 2: Load individual project details
    if (projectListRes.status === 200 && projectListRes.json().length > 0) {
      const projectId = projectListRes.json()[0].id;
      const projectDetailRes = http.get(`${BASE_URL}${API_BASE}/${projectId}`, { headers });
      
      projectLoadTime.add(projectDetailRes.timings.duration);
      
      check(projectDetailRes, {
        'project detail status is 200': (r) => r.status === 200,
        'project detail has name': (r) => r.json().name !== undefined,
      });
    }

    // Test 3: Load project dashboard data
    if (projectListRes.status === 200 && projectListRes.json().length > 0) {
      const projectId = projectListRes.json()[0].id;
      const dashboardRes = http.get(`${BASE_URL}${API_BASE}/${projectId}/dashboard`, { headers });
      
      projectLoadTime.add(dashboardRes.timings.duration);
      
      check(dashboardRes, {
        'dashboard status is 200': (r) => r.status === 200,
        'dashboard has metrics': (r) => r.json().metrics !== undefined,
      });
    }
  });

  // Simulate user think time
  sleep(2);
}