/**
 * Authentication and Session Management Tester
 * 
 * This script tests the application's authentication and session management
 * for common vulnerabilities.
 */

// Import required modules
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test credentials
const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};

// Weak passwords to test
const WEAK_PASSWORDS = [
  '123456',
  'password',
  'admin',
  'qwerty',
  'letmein',
  '123456789',
  'password123',
  'admin123'
];

// OWASP categories
const OWASP_CATEGORIES = {
  AUTH_FAILURES: 'A07:2021-Identification and Authentication Failures',
  SESSION_MGMT: 'A06:2021-Vulnerable and Outdated Components'
};

/**
 * Test weak password policies
 */
async function testWeakPasswordPolicies(baseUrl) {
  const results = [];
  
  for (const weakPassword of WEAK_PASSWORDS) {
    try {
      const response = await axios.post(`${baseUrl}/api/auth/register`, {
        email: `weaktest${Math.random()}@example.com`,
        password: weakPassword,
        name: 'Weak Password Test'
      }, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // If registration succeeds with weak password, it's a vulnerability
      if (response.status === 200 || response.status === 201) {
        results.push({
          password: weakPassword,
          status: response.status,
          vulnerability: 'Weak Password Policy',
          owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
          severity: 'HIGH',
          recommendation: 'Implement strong password policies with complexity requirements'
        });
      }
    } catch (error) {
      // Network errors are not vulnerabilities
    }
  }
  
  return results;
}

/**
 * Test brute force protection
 */
async function testBruteForceProtection(baseUrl) {
  const results = [];
  
  // Attempt multiple failed logins
  const maxAttempts = 10;
  let successfulAttempts = 0;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        email: TEST_CREDENTIALS.invalid.email,
        password: TEST_CREDENTIALS.invalid.password + i // Different password each time
      }, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // If we get a 200, the brute force protection failed
      if (response.status === 200) {
        successfulAttempts++;
      }
      
      // Check for rate limiting headers
      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'retry-after'
      ];
      
      const hasRateLimitHeaders = rateLimitHeaders.some(header => 
        response.headers[header] !== undefined
      );
      
      if (!hasRateLimitHeaders && i > 3) {
        results.push({
          attempt: i,
          status: response.status,
          vulnerability: 'Missing Rate Limiting',
          owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
          severity: 'MEDIUM',
          recommendation: 'Implement rate limiting for authentication endpoints'
        });
      }
    } catch (error) {
      // Network errors are not vulnerabilities
    }
  }
  
  // If too many attempts succeeded, brute force protection is weak
  if (successfulAttempts > 5) {
    results.push({
      attempts: successfulAttempts,
      maxAttempts: maxAttempts,
      vulnerability: 'Weak Brute Force Protection',
      owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
      severity: 'HIGH',
      recommendation: 'Implement account lockout or progressive delays after failed attempts'
    });
  }
  
  return results;
}

/**
 * Test session management
 */
async function testSessionManagement(baseUrl) {
  const results = [];
  
  try {
    // Login to get a token
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: TEST_CREDENTIALS.valid.email,
      password: TEST_CREDENTIALS.valid.password
    }, {
      timeout: 5000
    });
    
    const token = loginResponse.data.token;
    
    // Test token expiration
    if (token) {
      try {
        const decoded = jwt.decode(token, { complete: true });
        if (decoded && decoded.payload) {
          const exp = decoded.payload.exp;
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = exp - now;
          
          // If token expires in less than 1 hour, it might be too short
          if (expiresIn < 3600) {
            results.push({
              expiresIn: expiresIn,
              vulnerability: 'Short Session Expiration',
              owaspCategory: OWASP_CATEGORIES.SESSION_MGMT,
              severity: 'LOW',
              recommendation: 'Consider appropriate session expiration times'
            });
          }
          
          // If token expires in more than 30 days, it might be too long
          if (expiresIn > 2592000) { // 30 days
            results.push({
              expiresIn: expiresIn,
              vulnerability: 'Long Session Expiration',
              owaspCategory: OWASP_CATEGORIES.SESSION_MGMT,
              severity: 'MEDIUM',
              recommendation: 'Consider shorter session expiration times for security'
            });
          }
        }
      } catch (decodeError) {
        // Token decoding failed
        results.push({
          error: decodeError.message,
          vulnerability: 'Invalid JWT Token',
          owaspCategory: OWASP_CATEGORIES.SESSION_MGMT,
          severity: 'HIGH',
          recommendation: 'Ensure JWT tokens are properly formatted and signed'
        });
      }
    }
    
    // Test concurrent sessions
    const concurrentSessions = [];
    for (let i = 0; i < 3; i++) {
      try {
        const sessionResponse = await axios.post(`${baseUrl}/api/auth/login`, {
          email: TEST_CREDENTIALS.valid.email,
          password: TEST_CREDENTIALS.valid.password
        }, {
          timeout: 5000
        });
        
        concurrentSessions.push(sessionResponse.data.token);
      } catch (error) {
        // Network errors
      }
    }
    
    // Test if all sessions are still valid (should invalidate previous ones)
    for (const sessionToken of concurrentSessions) {
      try {
        await axios.get(`${baseUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          },
          timeout: 5000,
          validateStatus: () => true
        });
      } catch (error) {
        // Session invalidation working correctly
      }
    }
    
  } catch (error) {
    results.push({
      error: error.message,
      vulnerability: 'Authentication Endpoint Issues',
      owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
      severity: 'MEDIUM',
      recommendation: 'Ensure authentication endpoints are properly secured'
    });
  }
  
  return results;
}

/**
 * Test password reset functionality
 */
async function testPasswordReset(baseUrl) {
  const results = [];
  
  try {
    // Request password reset
    const resetResponse = await axios.post(`${baseUrl}/api/auth/reset-password`, {
      email: TEST_CREDENTIALS.valid.email
    }, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    // Check if reset token is exposed in response
    if (resetResponse.data && resetResponse.data.token) {
      results.push({
        vulnerability: 'Exposed Password Reset Token',
        owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
        severity: 'HIGH',
        recommendation: 'Password reset tokens should not be exposed in API responses'
      });
    }
    
    // Check if reset works for non-existent users (information leakage)
    const invalidResetResponse = await axios.post(`${baseUrl}/api/auth/reset-password`, {
      email: 'nonexistent@example.com'
    }, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    // If response differs significantly, it might leak information
    if (resetResponse.status !== invalidResetResponse.status) {
      results.push({
        vulnerability: 'Password Reset Information Leakage',
        owaspCategory: OWASP_CATEGORIES.AUTH_FAILURES,
        severity: 'MEDIUM',
        recommendation: 'Password reset should respond consistently for all email addresses'
      });
    }
    
  } catch (error) {
    // Network errors
  }
  
  return results;
}

/**
 * Generate authentication test report
 */
function generateAuthReport(weakPasswordResults, bruteForceResults, sessionResults, resetResults) {
  const allResults = [...weakPasswordResults, ...bruteForceResults, ...sessionResults, ...resetResults];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalVulnerabilities: allResults.length,
      weakPasswords: weakPasswordResults.length,
      bruteForce: bruteForceResults.length,
      sessionManagement: sessionResults.length,
      passwordReset: resetResults.length
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
  
  console.log(`Starting authentication and session management tests against ${baseUrl}...`);
  
  try {
    // Test weak password policies
    console.log('Testing weak password policies...');
    const weakPasswordResults = await testWeakPasswordPolicies(baseUrl);
    
    // Test brute force protection
    console.log('Testing brute force protection...');
    const bruteForceResults = await testBruteForceProtection(baseUrl);
    
    // Test session management
    console.log('Testing session management...');
    const sessionResults = await testSessionManagement(baseUrl);
    
    // Test password reset functionality
    console.log('Testing password reset functionality...');
    const resetResults = await testPasswordReset(baseUrl);
    
    // Generate report
    const report = generateAuthReport(weakPasswordResults, bruteForceResults, sessionResults, resetResults);
    
    // Save report
    require('fs').writeFileSync(
      './security-reports/auth-vulnerability-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('Authentication and session management tests completed.');
    console.log(`Found ${report.summary.totalVulnerabilities} potential vulnerabilities:`);
    console.log(`  Weak Passwords: ${report.summary.weakPasswords}`);
    console.log(`  Brute Force: ${report.summary.bruteForce}`);
    console.log(`  Session Management: ${report.summary.sessionManagement}`);
    console.log(`  Password Reset: ${report.summary.passwordReset}`);
    
    // Exit with appropriate code
    if (report.summary.totalVulnerabilities > 0) {
      process.exit(1); // Fail build for vulnerabilities
    }
    
    process.exit(0); // Success
  } catch (error) {
    console.error('Error during authentication tests:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testWeakPasswordPolicies,
  testBruteForceProtection,
  testSessionManagement,
  testPasswordReset,
  generateAuthReport
};