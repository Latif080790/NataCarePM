/**
 * Load Performance Test
 * 
 * Tests system performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const pageLoadTime = new Trend('page_load_time', true);
const apiResponseTime = new Trend('api_response_time', true);
const throughput = new Counter('http_requests_total');
const errorRate = new Rate('http_errors');

// Test options
export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      gracefulStop: '30s',
    },
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 }, // Ramp up to 20 users
        { duration: '3m', target: 20 }, // Stay at 20 users
        { duration: '2m', target: 50 }, // Ramp up to 50 users
        { duration: '3m', target: 50 }, // Stay at 50 users
        { duration: '2m', target: 0 },  // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'http_errors': ['rate<0.05'], // Error rate should be less than 5%
    'page_load_time': ['p(95)<2000'], // 95% of page loads should be below 2s
    'api_response_time': ['p(95)<500'], // 95% of API responses should be below 500ms
  },
};

// Test data
const testEndpoints = [
  { name: 'Dashboard', url: '/dashboard', expectedStatus: 200 },
  { name: 'Projects API', url: '/api/projects', expectedStatus: 200 },
  { name: 'Tasks API', url: '/api/tasks', expectedStatus: 200 },
  { name: 'Analytics API', url: '/api/analytics', expectedStatus: 200 },
  { name: 'User Profile', url: '/api/profile', expectedStatus: 200 },
];

const testUsers = [
  { id: 'user1', role: 'admin', token: 'admin-token-123' },
  { id: 'user2', role: 'project_manager', token: 'pm-token-456' },
  { id: 'user3', role: 'team_member', token: 'member-token-789' },
];

export function setup() {
  // Setup code (run once before test)
  console.log('Starting load performance test');
  
  // Warm up the application
  const warmupRes = http.get('http://localhost:5173/health');
  check(warmupRes, {
    'warmup status is 200': (r) => r.status === 200,
  });
  
  return { startTime: Date.now() };
}

export default function (data) {
  // Select a random user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Select a random endpoint
  const endpoint = testEndpoints[Math.floor(Math.random() * testEndpoints.length)];
  
  group(`User: ${user.role} - ${endpoint.name}`, function () {
    const headers = {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'k6-performance-test/1.0',
    };
    
    // Measure page/API load time
    const start = Date.now();
    
    let res;
    if (endpoint.url.startsWith('/api/')) {
      // API request
      res = http.get(`http://localhost:5173${endpoint.url}`, { headers });
    } else {
      // Page request
      res = http.get(`http://localhost:5173${endpoint.url}`, { headers });
    }
    
    const duration = Date.now() - start;
    
    // Record metrics
    if (endpoint.url.startsWith('/api/')) {
      apiResponseTime.add(duration);
    } else {
      pageLoadTime.add(duration);
    }
    
    throughput.add(1);
    
    // Check response
    const result = check(res, {
      [`status is ${endpoint.expectedStatus}`]: (r) => r.status === endpoint.expectedStatus,
      'response time < 2s': () => duration < 2000,
    });
    
    if (!result) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    
    // Add some variability in user behavior
    if (Math.random() < 0.3) {
      // Simulate user thinking time
      sleep(Math.random() * 3 + 1); // 1-4 seconds
    }
  });
}

export function teardown(data) {
  // Teardown code (run once after test)
  const testDuration = Date.now() - data.startTime;
  console.log(`Load performance test completed in ${testDuration}ms`);
  
  // Report final metrics
  console.log(`\n=== FINAL METRICS ===`);
  console.log(`Total requests: ${throughput.value}`);
  console.log(`Average page load time: ${pageLoadTime.mean}ms`);
  console.log(`Average API response time: ${apiResponseTime.mean}ms`);
  console.log(`95th percentile page load: ${pageLoadTime.percentile(95)}ms`);
  console.log(`95th percentile API response: ${apiResponseTime.percentile(95)}ms`);
  console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
  
  // Performance recommendations
  if (pageLoadTime.percentile(95) > 2000) {
    console.log(`\n⚠️  PERFORMANCE WARNING: Page load times exceed 2s for 95% of users`);
    console.log(`   Recommendation: Optimize bundle size and implement code splitting`);
  }
  
  if (apiResponseTime.percentile(95) > 500) {
    console.log(`\n⚠️  PERFORMANCE WARNING: API response times exceed 500ms for 95% of requests`);
    console.log(`   Recommendation: Optimize database queries and implement caching`);
  }
  
  if (errorRate.rate > 0.05) {
    console.log(`\n⚠️  RELIABILITY WARNING: Error rate exceeds 5%`);
    console.log(`   Recommendation: Investigate failed requests and improve error handling`);
  }
}