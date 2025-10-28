// k6 Configuration File
// This file contains configuration for running performance tests with k6

export default {
  // Test execution options
  execution: {
    // Local execution
    local: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    
    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '1m', target: 0 },
      ],
    },
    
    // Soak test
    soak: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30m',
    },
    
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 500 }, // Spike to 500 VUs
        { duration: '1m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },

  // Thresholds configuration
  thresholds: {
    // HTTP thresholds
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    
    // Custom metric thresholds
    login_failures: ['rate<0.01'],
    project_load_failures: ['rate<0.02'],
    create_project_failures: ['rate<0.03'],
    concurrent_failures: ['rate<0.03'],
    
    // Performance thresholds
    checks: ['rate>0.95'],
    iterations: ['count>100'],
  },

  // Options for different environments
  environments: {
    development: {
      host: 'http://localhost:5173',
      vus: 10,
      duration: '1m',
    },
    
    staging: {
      host: 'https://staging.natacarepm.com',
      vus: 50,
      duration: '10m',
    },
    
    production: {
      host: 'https://natacarepm.com',
      vus: 100,
      duration: '15m',
      thresholds: {
        http_req_duration: ['p(95)<800', 'p(99)<1500'],
        http_req_failed: ['rate<0.01'],
      },
    },
  },

  // Test data configuration
  testData: {
    users: [
      { email: 'admin@example.com', password: 'Admin123!', role: 'admin' },
      { email: 'pm@example.com', password: 'ProjectManager123!', role: 'project_manager' },
      { email: 'site@example.com', password: 'SiteSupervisor123!', role: 'site_supervisor' },
      { email: 'finance@example.com', password: 'Finance123!', role: 'finance_manager' },
      { email: 'logistics@example.com', password: 'Logistics123!', role: 'logistics_manager' },
    ],
    
    projects: [
      { name: 'Test Project 1', location: 'Jakarta', startDate: '2023-01-01' },
      { name: 'Test Project 2', location: 'Bandung', startDate: '2023-02-01' },
      { name: 'Test Project 3', location: 'Surabaya', startDate: '2023-03-01' },
    ],
  },

  // Output configuration
  outputs: {
    // InfluxDB output for time-series data
    influxdb: 'http://localhost:8086/k6',
    
    // JSON output for detailed results
    json: './perf-results/results.json',
    
    // CSV output for spreadsheet analysis
    csv: './perf-results/results.csv',
  },

  // Extensions
  extensions: {
    // WebSocket support
    ws: {
      maxConnections: 1000,
    },
    
    // gRPC support
    grpc: {
      maxConnections: 500,
    },
  },
};