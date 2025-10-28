import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const loginFailRate = new Rate('login_failures');

// Test options
export const options = {
  // Ramp up VUs over time
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users over 30s
    { duration: '1m', target: 50 },    // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  
  // Define thresholds
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    login_failures: ['rate<0.1'],     // Error rate should be less than 10%
    http_req_failed: ['rate<0.1'],    // HTTP error rate should be less than 10%
  },
};

// Test data
const BASE_URL = 'http://localhost:5173';
const LOGIN_ENDPOINT = '/api/auth/login';

export default function () {
  // Simulate user login
  const credentials = {
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  const res = http.post(`${BASE_URL}${LOGIN_ENDPOINT}`, JSON.stringify(credentials), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Check response
  const loginSuccess = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json().token !== undefined,
  });

  // Track failure rate
  loginFailRate.add(!loginSuccess);

  // Simulate user think time
  sleep(1);
}