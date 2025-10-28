/**
 * Injection Vulnerability Tester
 * 
 * This script tests the application for various injection vulnerabilities
 * including SQL injection, NoSQL injection, command injection, etc.
 */

// Import required modules
const axios = require('axios');

// Test payloads for different injection types
const INJECTION_PAYLOADS = {
  // SQL Injection payloads
  sql: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT username, password FROM users --",
    "1'; EXEC xp_cmdshell('dir'); --",
    "' OR 1=1--",
    "' OR 'x'='x",
    "'; EXEC master..xp_cmdshell 'ping 127.0.0.1'--"
  ],
  
  // NoSQL Injection payloads (for MongoDB)
  nosql: [
    "{ $ne: '' }",
    "{ $gt: '' }",
    "{ $where: '1==1' }",
    "{ $or: [{ username: 'admin' }] }",
    "{ $and: [{ username: 'admin' }, { password: { $ne: 'xxx' } }] }"
  ],
  
  // XSS payloads
  xss: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg/onload=alert('XSS')>",
    "';alert(String.fromCharCode(88,83,83))//",
    "<IMG SRC=j&#X41vascript:alert('XSS')>"
  ],
  
  // Command injection payloads
  command: [
    "; ls -la",
    "| cat /etc/passwd",
    "&& dir",
    "`cat /etc/passwd`",
    "$(cat /etc/passwd)"
  ],
  
  // LDAP injection payloads
  ldap: [
    "*)(uid=*))(|(uid=*)",
    "*",
    "*)(&",
    "admin*)(uid=*))(|(uid=*)"
  ]
};

// Test endpoints
const TEST_ENDPOINTS = [
  '/api/auth/login',
  '/api/projects',
  '/api/users/search',
  '/api/documents',
  '/api/purchase-orders'
];

// OWASP categories
const OWASP_CATEGORIES = {
  INJECTION: 'A03:2021-Injection',
  XSS: 'A07:2021-Cross-Site Scripting',
  BROKEN_ACCESS: 'A01:2021-Broken Access Control'
};

/**
 * Test for SQL injection vulnerabilities
 */
async function testSQLInjection(baseUrl) {
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    for (const payload of INJECTION_PAYLOADS.sql) {
      try {
        const response = await axios.post(`${baseUrl}${endpoint}`, {
          username: payload,
          password: 'test'
        }, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        // Check for SQL error messages in response
        const responseBody = JSON.stringify(response.data) + response.headers.toString();
        const sqlErrors = [
          'SQL syntax',
          'mysql_fetch',
          'ORA-',
          'PostgreSQL',
          'SQLite',
          'ODBC',
          'JDBC'
        ];
        
        const hasSQLError = sqlErrors.some(error => responseBody.includes(error));
        
        if (hasSQLError || response.status === 500) {
          results.push({
            endpoint: endpoint,
            payload: payload,
            status: response.status,
            vulnerability: 'SQL Injection',
            owaspCategory: OWASP_CATEGORIES.INJECTION,
            severity: 'HIGH',
            recommendation: 'Use parameterized queries and input validation'
          });
        }
      } catch (error) {
        // Network errors or timeouts
        results.push({
          endpoint: endpoint,
          payload: payload,
          error: error.message,
          vulnerability: 'SQL Injection',
          owaspCategory: OWASP_CATEGORIES.INJECTION,
          severity: 'MEDIUM',
          recommendation: 'Implement proper error handling'
        });
      }
    }
  }
  
  return results;
}

/**
 * Test for XSS vulnerabilities
 */
async function testXSS(baseUrl) {
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    for (const payload of INJECTION_PAYLOADS.xss) {
      try {
        const response = await axios.post(`${baseUrl}${endpoint}`, {
          search: payload,
          name: payload,
          description: payload
        }, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        // Check if payload is reflected in response
        const responseBody = JSON.stringify(response.data) + response.headers.toString();
        
        if (responseBody.includes(payload)) {
          results.push({
            endpoint: endpoint,
            payload: payload,
            status: response.status,
            vulnerability: 'Cross-Site Scripting (XSS)',
            owaspCategory: OWASP_CATEGORIES.XSS,
            severity: 'HIGH',
            recommendation: 'Implement proper output encoding and Content Security Policy'
          });
        }
      } catch (error) {
        // Network errors or timeouts
        results.push({
          endpoint: endpoint,
          payload: payload,
          error: error.message,
          vulnerability: 'Cross-Site Scripting (XSS)',
          owaspCategory: OWASP_CATEGORIES.XSS,
          severity: 'MEDIUM',
          recommendation: 'Implement proper error handling'
        });
      }
    }
  }
  
  return results;
}

/**
 * Test for broken access control
 */
async function testBrokenAccessControl(baseUrl) {
  const results = [];
  
  // Test accessing resources without authentication
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // If we can access protected resources without auth, it's a vulnerability
      if (response.status === 200) {
        results.push({
          endpoint: endpoint,
          status: response.status,
          vulnerability: 'Broken Access Control',
          owaspCategory: OWASP_CATEGORIES.BROKEN_ACCESS,
          severity: 'HIGH',
          recommendation: 'Implement proper authentication and authorization checks'
        });
      }
    } catch (error) {
      // Network errors are not vulnerabilities
    }
  }
  
  return results;
}

/**
 * Generate injection test report
 */
function generateInjectionReport(sqlResults, xssResults, accessResults) {
  const allResults = [...sqlResults, ...xssResults, ...accessResults];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalVulnerabilities: allResults.length,
      sqlInjection: sqlResults.length,
      xss: xssResults.length,
      brokenAccess: accessResults.length
    },
    vulnerabilities: allResults
  };
  
  return report;
}

/**
 * Main function
 */
async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
  
  console.log(`Starting injection vulnerability tests against ${baseUrl}...`);
  
  try {
    // Test SQL injection
    console.log('Testing for SQL injection vulnerabilities...');
    const sqlResults = await testSQLInjection(baseUrl);
    
    // Test XSS
    console.log('Testing for XSS vulnerabilities...');
    const xssResults = await testXSS(baseUrl);
    
    // Test broken access control
    console.log('Testing for broken access control...');
    const accessResults = await testBrokenAccessControl(baseUrl);
    
    // Generate report
    const report = generateInjectionReport(sqlResults, xssResults, accessResults);
    
    // Save report
    require('fs').writeFileSync(
      './security-reports/injection-vulnerability-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('Injection vulnerability tests completed.');
    console.log(`Found ${report.summary.totalVulnerabilities} potential vulnerabilities:`);
    console.log(`  SQL Injection: ${report.summary.sqlInjection}`);
    console.log(`  XSS: ${report.summary.xss}`);
    console.log(`  Broken Access: ${report.summary.brokenAccess}`);
    
    // Exit with appropriate code
    if (report.summary.totalVulnerabilities > 0) {
      process.exit(1); // Fail build for vulnerabilities
    }
    
    process.exit(0); // Success
  } catch (error) {
    console.error('Error during injection tests:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testSQLInjection,
  testXSS,
  testBrokenAccessControl,
  generateInjectionReport
};