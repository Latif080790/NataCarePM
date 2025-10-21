// System Health Check and Status Report
const { mockServices } = require('./setup');

async function performHealthCheck() {
  console.log('🏥 Intelligent Document System - Health Check');
  console.log('=============================================');

  const startTime = Date.now();
  const healthMetrics = {
    systemStatus: 'HEALTHY',
    timestamp: new Date().toISOString(),
    services: [],
    performance: {},
    security: {},
    dataIntegrity: {},
    recommendations: [],
  };

  console.log('📊 Checking system components...\n');

  // 1. Service Availability Check
  console.log('🔧 Service Availability:');
  const services = [
    'intelligentDocumentService.createDocument',
    'intelligentDocumentService.getDocument',
    'intelligentDocumentService.updateDocument',
    'intelligentDocumentService.deleteDocument',
    'intelligentDocumentService.searchDocuments',
    'intelligentDocumentService.generateDocumentAnalytics',
    'intelligentDocumentService.getProcessingMetrics',
  ];

  let serviceIssues = 0;
  for (const service of services) {
    try {
      const isAvailable = checkServiceAvailability(service);
      const status = isAvailable ? '✅ AVAILABLE' : '❌ UNAVAILABLE';
      console.log(`  ${service}: ${status}`);

      healthMetrics.services.push({
        name: service,
        status: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      });

      if (!isAvailable) serviceIssues++;
    } catch (error) {
      console.log(`  ${service}: ❌ ERROR - ${error.message}`);
      serviceIssues++;
    }
  }

  // 2. Performance Metrics
  console.log('\n⚡ Performance Metrics:');
  try {
    const perfStart = Date.now();

    // Test document creation performance
    const testFile = new File(['Health check test'], 'health.txt', { type: 'text/plain' });
    const document = await mockServices.intelligentDocumentService.createDocument(
      'Health Check Document',
      'System health validation',
      'report',
      'health_check_project',
      'health_check_user',
      testFile,
      null,
      { enableOCR: true, enableAIProcessing: true }
    );

    const createTime = Date.now() - perfStart;
    console.log(
      `  Document Creation: ${createTime}ms ${createTime < 1000 ? '✅' : createTime < 3000 ? '⚠️' : '❌'}`
    );

    // Test retrieval performance
    const retrieveStart = Date.now();
    await mockServices.intelligentDocumentService.getDocument(document.id);
    const retrieveTime = Date.now() - retrieveStart;
    console.log(
      `  Document Retrieval: ${retrieveTime}ms ${retrieveTime < 500 ? '✅' : retrieveTime < 1500 ? '⚠️' : '❌'}`
    );

    // Test search performance
    const searchStart = Date.now();
    await mockServices.intelligentDocumentService.searchDocuments(
      'Health Check',
      'health_check_project'
    );
    const searchTime = Date.now() - searchStart;
    console.log(
      `  Document Search: ${searchTime}ms ${searchTime < 800 ? '✅' : searchTime < 2000 ? '⚠️' : '❌'}`
    );

    // Get system metrics
    const metrics = await mockServices.intelligentDocumentService.getProcessingMetrics();
    console.log(
      `  Processing Success Rate: ${(metrics.successRate * 100).toFixed(1)}% ${metrics.successRate > 0.9 ? '✅' : metrics.successRate > 0.8 ? '⚠️' : '❌'}`
    );
    console.log(
      `  OCR Accuracy: ${(metrics.ocrAccuracy * 100).toFixed(1)}% ${metrics.ocrAccuracy > 0.9 ? '✅' : metrics.ocrAccuracy > 0.8 ? '⚠️' : '❌'}`
    );

    healthMetrics.performance = {
      documentCreation: createTime,
      documentRetrieval: retrieveTime,
      documentSearch: searchTime,
      successRate: metrics.successRate,
      ocrAccuracy: metrics.ocrAccuracy,
    };

    // Cleanup
    await mockServices.intelligentDocumentService.deleteDocument(document.id, 'health_check_user');
  } catch (error) {
    console.log(`  ❌ Performance test failed: ${error.message}`);
    healthMetrics.performance = { error: error.message };
  }

  // 3. Security Check
  console.log('\n🔒 Security Status:');
  try {
    // Test access control
    const testFile = new File(['Security test'], 'security.txt', { type: 'text/plain' });
    const secDoc = await mockServices.intelligentDocumentService.createDocument(
      'Security Test',
      'Testing access control',
      'confidential',
      'health_check_project',
      'health_check_user',
      testFile
    );

    // Test unauthorized access
    let accessControlWorking = false;
    try {
      await mockServices.intelligentDocumentService.updateDocument(
        secDoc.id,
        { title: 'Unauthorized Access Attempt' },
        'unauthorized_user',
        'Should be blocked'
      );
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        accessControlWorking = true;
      }
    }

    console.log(`  Access Control: ${accessControlWorking ? '✅ WORKING' : '❌ VULNERABLE'}`);

    // Test encryption
    await mockServices.intelligentDocumentService.encryptDocument(secDoc.id, 'health_check_user');
    const encryptedDoc = await mockServices.intelligentDocumentService.getDocument(secDoc.id);
    const encryptionWorking = encryptedDoc.encryptionStatus.isEncrypted;

    console.log(`  Encryption: ${encryptionWorking ? '✅ WORKING' : '❌ FAILED'}`);

    healthMetrics.security = {
      accessControl: accessControlWorking,
      encryption: encryptionWorking,
    };

    // Cleanup
    await mockServices.intelligentDocumentService.deleteDocument(secDoc.id, 'health_check_user');
  } catch (error) {
    console.log(`  ❌ Security check failed: ${error.message}`);
    healthMetrics.security = { error: error.message };
  }

  // 4. Data Integrity Check
  console.log('\n📊 Data Integrity:');
  try {
    const testFile = new File(['Integrity test'], 'integrity.txt', { type: 'text/plain' });
    const integrityDoc = await mockServices.intelligentDocumentService.createDocument(
      'Integrity Test',
      'Testing data consistency',
      'report',
      'health_check_project',
      'health_check_user',
      testFile
    );

    // Check required fields
    const requiredFields = ['id', 'title', 'createdAt', 'updatedAt', 'status', 'auditTrail'];
    const missingFields = requiredFields.filter(
      (field) => !(field in integrityDoc) || integrityDoc[field] === undefined
    );

    console.log(
      `  Schema Validation: ${missingFields.length === 0 ? '✅ VALID' : `❌ MISSING: ${missingFields.join(', ')}`}`
    );

    // Test data consistency
    const originalTitle = integrityDoc.title;
    const updatedDoc = await mockServices.intelligentDocumentService.updateDocument(
      integrityDoc.id,
      { title: 'Updated Title' },
      'health_check_user',
      'Health check update'
    );

    const consistencyOk = updatedDoc.id === integrityDoc.id && updatedDoc.title === 'Updated Title';
    console.log(`  Data Consistency: ${consistencyOk ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);

    // Check audit trail
    const auditOk = updatedDoc.auditTrail && updatedDoc.auditTrail.length >= 2;
    console.log(`  Audit Trail: ${auditOk ? '✅ TRACKED' : '❌ MISSING'}`);

    healthMetrics.dataIntegrity = {
      schemaValid: missingFields.length === 0,
      dataConsistent: consistencyOk,
      auditTracked: auditOk,
    };

    // Cleanup
    await mockServices.intelligentDocumentService.deleteDocument(
      integrityDoc.id,
      'health_check_user'
    );
  } catch (error) {
    console.log(`  ❌ Data integrity check failed: ${error.message}`);
    healthMetrics.dataIntegrity = { error: error.message };
  }

  // 5. System Analytics
  console.log('\n📈 System Analytics:');
  try {
    const analytics = await mockServices.intelligentDocumentService.generateDocumentAnalytics();

    console.log(`  Total Documents: ${analytics.totalDocuments}`);
    console.log(
      `  Average Processing Time: ${analytics.processingMetrics.averageProcessingTime}ms`
    );
    console.log(`  Success Rate: ${(analytics.processingMetrics.successRate * 100).toFixed(1)}%`);
    console.log(`  OCR Accuracy: ${(analytics.processingMetrics.ocrAccuracy * 100).toFixed(1)}%`);

    const categories = Object.keys(analytics.documentsByCategory);
    console.log(`  Document Categories: ${categories.join(', ')}`);
  } catch (error) {
    console.log(`  ❌ Analytics unavailable: ${error.message}`);
  }

  // Determine overall system status
  const totalTime = Date.now() - startTime;

  let systemIssues = 0;
  systemIssues += serviceIssues;
  systemIssues += healthMetrics.performance.error ? 1 : 0;
  systemIssues += healthMetrics.security.error ? 1 : 0;
  systemIssues += healthMetrics.dataIntegrity.error ? 1 : 0;

  if (systemIssues === 0) {
    healthMetrics.systemStatus = 'HEALTHY';
  } else if (systemIssues <= 2) {
    healthMetrics.systemStatus = 'DEGRADED';
  } else {
    healthMetrics.systemStatus = 'CRITICAL';
  }

  // Generate recommendations
  if (serviceIssues > 0) {
    healthMetrics.recommendations.push('🔧 Check service availability and dependencies');
  }

  if (healthMetrics.performance.error) {
    healthMetrics.recommendations.push('⚡ Investigate performance issues');
  }

  if (healthMetrics.security.error) {
    healthMetrics.recommendations.push('🔒 Review security configuration');
  }

  if (healthMetrics.dataIntegrity.error) {
    healthMetrics.recommendations.push('📊 Validate data integrity and consistency');
  }

  if (systemIssues === 0) {
    healthMetrics.recommendations.push('✅ System is operating normally');
    healthMetrics.recommendations.push('🔄 Continue regular monitoring');
  }

  // Final Report
  console.log('\n🎯 HEALTH CHECK SUMMARY');
  console.log('========================');

  const statusIcon =
    healthMetrics.systemStatus === 'HEALTHY'
      ? '✅'
      : healthMetrics.systemStatus === 'DEGRADED'
        ? '⚠️'
        : '❌';
  console.log(`Overall Status: ${statusIcon} ${healthMetrics.systemStatus}`);
  console.log(`Check Duration: ${totalTime}ms`);
  console.log(`Services Checked: ${services.length}`);
  console.log(`Issues Found: ${systemIssues}`);

  console.log('\n💡 Recommendations:');
  for (const recommendation of healthMetrics.recommendations) {
    console.log(`  ${recommendation}`);
  }

  console.log('\n🏁 Health Check Complete');
  console.log('=========================');

  return healthMetrics;
}

function checkServiceAvailability(servicePath) {
  try {
    const pathParts = servicePath.split('.');
    let obj = mockServices;

    for (const part of pathParts) {
      if (obj && typeof obj === 'object' && part in obj) {
        obj = obj[part];
      } else {
        return false;
      }
    }

    return typeof obj === 'function';
  } catch {
    return false;
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  performHealthCheck()
    .then((metrics) => {
      process.exit(metrics.systemStatus === 'HEALTHY' ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

module.exports = { performHealthCheck };
