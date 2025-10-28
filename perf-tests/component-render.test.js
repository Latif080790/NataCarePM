/**
 * Component Render Performance Test
 * 
 * Tests performance of key components under various conditions
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const renderTime = new Trend('component_render_time', true);
const bundleSize = new Trend('bundle_size_kb');
const firstPaint = new Trend('first_paint_ms');
const errorRate = new Rate('errors');

// Test options
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.1'], // Error rate should be less than 10%
    'component_render_time': ['p(95)<100'], // 95% of renders should be below 100ms
  },
};

// Test data
const testUsers = [
  { id: 'user1', role: 'admin' },
  { id: 'user2', role: 'project_manager' },
  { id: 'user3', role: 'team_member' },
];

export function setup() {
  // Setup code (run once before test)
  console.log('Starting component render performance test');
  
  // Login and get auth token
  const loginRes = http.post('http://localhost:5173/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  
  const authToken = loginRes.json('token');
  
  return { authToken };
}

export default function (data) {
  const { authToken } = data;
  
  group('Component Render Tests', function () {
    // Test dashboard load time
    group('Dashboard Render', function () {
      const start = Date.now();
      const res = http.get('http://localhost:5173/dashboard', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/html',
        },
      });
      
      const duration = Date.now() - start;
      renderTime.add(duration);
      
      check(res, {
        'dashboard status is 200': (r) => r.status === 200,
        'dashboard loads within 1s': () => duration < 1000,
      }) || errorRate.add(1);
      
      // Simulate user interaction
      sleep(1);
    });
    
    // Test project list render
    group('Project List Render', function () {
      const start = Date.now();
      const res = http.get('http://localhost:5173/api/projects', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });
      
      const duration = Date.now() - start;
      renderTime.add(duration);
      
      check(res, {
        'project list status is 200': (r) => r.status === 200,
        'project list loads within 500ms': () => duration < 500,
      }) || errorRate.add(1);
      
      sleep(0.5);
    });
    
    // Test task board render
    group('Task Board Render', function () {
      const start = Date.now();
      const res = http.get('http://localhost:5173/tasks', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/html',
        },
      });
      
      const duration = Date.now() - start;
      renderTime.add(duration);
      
      check(res, {
        'task board status is 200': (r) => r.status === 200,
        'task board loads within 800ms': () => duration < 800,
      }) || errorRate.add(1);
      
      sleep(0.5);
    });
  });
  
  // Simulate think time between user actions
  sleep(2);
}

export function teardown(data) {
  // Teardown code (run once after test)
  console.log('Component render performance test completed');
  
  // Report metrics
  console.log(`Average render time: ${renderTime.mean}ms`);
  console.log(`95th percentile render time: ${renderTime.percentile(95)}ms`);
  console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
}