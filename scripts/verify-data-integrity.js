/**
 * Data Integrity Verification Tool
 * Validates Firestore data structure, referential integrity, and data types
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Data validation rules
const VALIDATION_RULES = {
  users: {
    required: ['email', 'name', 'roleId', 'createdAt'],
    types: {
      email: 'string',
      name: 'string',
      roleId: 'string',
      phone: 'string',
      photoURL: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    constraints: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      name: (value) => value.length >= 2 && value.length <= 100,
      roleId: (value) => ['admin', 'manager', 'user', 'viewer'].includes(value),
    },
  },
  projects: {
    required: ['name', 'createdBy', 'createdAt', 'status'],
    types: {
      name: 'string',
      description: 'string',
      createdBy: 'string',
      status: 'string',
      startDate: 'timestamp',
      endDate: 'timestamp',
      budget: 'number',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    constraints: {
      name: (value) => value.length >= 3 && value.length <= 200,
      status: (value) => ['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(value),
      budget: (value) => value >= 0,
    },
    references: {
      createdBy: { collection: 'users', field: 'uid' },
    },
  },
  transactions: {
    required: ['type', 'amount', 'date', 'createdBy', 'createdAt'],
    types: {
      type: 'string',
      amount: 'number',
      date: 'timestamp',
      description: 'string',
      category: 'string',
      createdBy: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    constraints: {
      type: (value) => ['income', 'expense', 'transfer'].includes(value),
      amount: (value) => value > 0 && value <= 10000000000,
    },
    references: {
      createdBy: { collection: 'users', field: 'uid' },
    },
  },
  purchaseOrders: {
    required: ['poNumber', 'vendor', 'totalAmount', 'createdBy', 'createdAt'],
    types: {
      poNumber: 'string',
      vendor: 'string',
      totalAmount: 'number',
      status: 'string',
      items: 'array',
      createdBy: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    constraints: {
      totalAmount: (value) => value >= 0,
      status: (value) => ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(value),
    },
  },
};

class DataIntegrityVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalDocuments: 0,
      validDocuments: 0,
      invalidDocuments: 0,
      missingReferences: 0,
      typeErrors: 0,
      constraintViolations: 0,
    };
  }

  /**
   * Run full integrity check
   */
  async verifyAll() {
    console.log('Starting Data Integrity Verification...\n');

    for (const [collectionName, rules] of Object.entries(VALIDATION_RULES)) {
      console.log(`\n📋 Verifying collection: ${collectionName}`);
      await this.verifyCollection(collectionName, rules);
    }

    // Check for orphaned documents
    console.log('\n🔍 Checking for orphaned documents...');
    await this.checkOrphanedDocuments();

    // Generate report
    this.generateReport();

    return {
      errors: this.errors,
      warnings: this.warnings,
      stats: this.stats,
    };
  }

  /**
   * Verify a single collection
   */
  async verifyCollection(collectionName, rules) {
    try {
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`  ℹ️  Collection is empty`);
        return;
      }

      console.log(`  Found ${snapshot.size} documents`);
      this.stats.totalDocuments += snapshot.size;

      let validCount = 0;
      let invalidCount = 0;

      for (const doc of snapshot.docs) {
        const isValid = await this.verifyDocument(collectionName, doc, rules);
        if (isValid) {
          validCount++;
          this.stats.validDocuments++;
        } else {
          invalidCount++;
          this.stats.invalidDocuments++;
        }
      }

      console.log(`  ✓ Valid: ${validCount}`);
      if (invalidCount > 0) {
        console.log(`  ✗ Invalid: ${invalidCount}`);
      }
    } catch (error) {
      this.errors.push({
        collection: collectionName,
        error: `Failed to verify collection: ${error.message}`,
      });
      console.error(`  ✗ Error: ${error.message}`);
    }
  }

  /**
   * Verify a single document
   */
  async verifyDocument(collectionName, doc, rules) {
    const data = doc.data();
    let isValid = true;

    // Check required fields
    for (const field of rules.required || []) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        this.errors.push({
          collection: collectionName,
          docId: doc.id,
          field,
          error: `Required field '${field}' is missing`,
        });
        isValid = false;
      }
    }

    // Check field types
    for (const [field, expectedType] of Object.entries(rules.types || {})) {
      if (field in data && data[field] !== null) {
        const actualType = this.getFieldType(data[field]);
        if (actualType !== expectedType) {
          this.errors.push({
            collection: collectionName,
            docId: doc.id,
            field,
            error: `Type mismatch: expected '${expectedType}', got '${actualType}'`,
          });
          this.stats.typeErrors++;
          isValid = false;
        }
      }
    }

    // Check constraints
    for (const [field, constraint] of Object.entries(rules.constraints || {})) {
      if (field in data && data[field] !== null) {
        if (!constraint(data[field])) {
          this.warnings.push({
            collection: collectionName,
            docId: doc.id,
            field,
            warning: `Constraint violation for field '${field}': ${data[field]}`,
          });
          this.stats.constraintViolations++;
        }
      }
    }

    // Check references
    if (rules.references) {
      for (const [field, reference] of Object.entries(rules.references)) {
        if (field in data && data[field]) {
          const refExists = await this.checkReference(reference.collection, data[field]);
          if (!refExists) {
            this.errors.push({
              collection: collectionName,
              docId: doc.id,
              field,
              error: `Referenced document not found in '${reference.collection}': ${data[field]}`,
            });
            this.stats.missingReferences++;
            isValid = false;
          }
        }
      }
    }

    return isValid;
  }

  /**
   * Get field type
   */
  getFieldType(value) {
    if (value instanceof admin.firestore.Timestamp) return 'timestamp';
    if (Array.isArray(value)) return 'array';
    if (value && typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Check if referenced document exists
   */
  async checkReference(collection, docId) {
    try {
      const doc = await db.collection(collection).doc(docId).get();
      return doc.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for orphaned documents
   */
  async checkOrphanedDocuments() {
    // Check for projects with no members
    const projectsSnapshot = await db.collection('projects').get();
    
    for (const projectDoc of projectsSnapshot.docs) {
      const membersSnapshot = await db
        .collection('projects')
        .doc(projectDoc.id)
        .collection('members')
        .get();

      if (membersSnapshot.empty) {
        this.warnings.push({
          collection: 'projects',
          docId: projectDoc.id,
          warning: 'Project has no members',
        });
      }
    }

    // Check for users not in any project
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const projectsWithUser = await db
        .collectionGroup('members')
        .where('userId', '==', userDoc.id)
        .limit(1)
        .get();

      if (projectsWithUser.empty) {
        this.warnings.push({
          collection: 'users',
          docId: userDoc.id,
          warning: 'User is not a member of any project',
        });
      }
    }
  }

  /**
   * Generate verification report
   */
  generateReport() {
    console.log('\n\n' + '='.repeat(60));
    console.log('DATA INTEGRITY VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 STATISTICS:');
    console.log(`  Total Documents:         ${this.stats.totalDocuments}`);
    console.log(`  Valid Documents:         ${this.stats.validDocuments}`);
    console.log(`  Invalid Documents:       ${this.stats.invalidDocuments}`);
    console.log(`  Missing References:      ${this.stats.missingReferences}`);
    console.log(`  Type Errors:             ${this.stats.typeErrors}`);
    console.log(`  Constraint Violations:   ${this.stats.constraintViolations}`);

    const successRate = ((this.stats.validDocuments / this.stats.totalDocuments) * 100).toFixed(2);
    console.log(`\n  Success Rate:            ${successRate}%`);

    if (this.errors.length > 0) {
      console.log(`\n\n❌ ERRORS (${this.errors.length}):`);
      this.errors.slice(0, 10).forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.collection}/${error.docId}`);
        console.log(`   Field: ${error.field || 'N/A'}`);
        console.log(`   Error: ${error.error}`);
      });

      if (this.errors.length > 10) {
        console.log(`\n   ... and ${this.errors.length - 10} more errors`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\n\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.collection}/${warning.docId}`);
        console.log(`   Field: ${warning.field || 'N/A'}`);
        console.log(`   Warning: ${warning.warning}`);
      });

      if (this.warnings.length > 10) {
        console.log(`\n   ... and ${this.warnings.length - 10} more warnings`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
    };

    const reportPath = path.join(__dirname, `integrity-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }

  /**
   * Fix common issues (dry-run mode)
   */
  async suggestFixes() {
    console.log('\n\n💡 SUGGESTED FIXES:');

    const fixes = [];

    // Suggest fixes for missing required fields
    const missingFieldErrors = this.errors.filter(e => e.error.includes('missing'));
    if (missingFieldErrors.length > 0) {
      fixes.push({
        issue: 'Missing required fields',
        count: missingFieldErrors.length,
        suggestion: 'Run migration script to add default values for required fields',
      });
    }

    // Suggest fixes for type mismatches
    const typeErrors = this.errors.filter(e => e.error.includes('Type mismatch'));
    if (typeErrors.length > 0) {
      fixes.push({
        issue: 'Type mismatches',
        count: typeErrors.length,
        suggestion: 'Run data migration to convert fields to correct types',
      });
    }

    // Suggest fixes for missing references
    const refErrors = this.errors.filter(e => e.error.includes('Referenced document not found'));
    if (refErrors.length > 0) {
      fixes.push({
        issue: 'Missing references',
        count: refErrors.length,
        suggestion: 'Either delete orphaned documents or fix references',
      });
    }

    fixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.issue} (${fix.count} occurrences)`);
      console.log(`   → ${fix.suggestion}`);
    });
  }
}

// CLI execution
if (require.main === module) {
  const verifier = new DataIntegrityVerifier();
  
  verifier.verifyAll()
    .then(async (result) => {
      await verifier.suggestFixes();
      
      const exitCode = result.errors.length > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = DataIntegrityVerifier;
