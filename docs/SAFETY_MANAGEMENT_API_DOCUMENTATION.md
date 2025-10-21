# Safety Management System - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Incident Management API](#incident-management-api)
4. [Training Management API](#training-management-api)
5. [PPE Management API](#ppe-management-api)
6. [Audit Management API](#audit-management-api)
7. [Metrics & Analytics API](#metrics--analytics-api)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)
10. [Code Examples](#code-examples)

---

## 1. Overview

The Safety Management System API provides a comprehensive interface for managing workplace safety, including incident reporting, training tracking, PPE inventory, safety audits, and OSHA compliance metrics.

**Base Module:** `api/safetyService.ts`

**Technology:** Firebase Firestore with TypeScript

**Response Format:** TypeScript objects (not REST endpoints)

---

## 2. Authentication

All API methods require Firebase Authentication. Users must be authenticated before calling any safety service methods.

```typescript
import { auth } from '@/firebase.config';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Authenticate user
await signInWithEmailAndPassword(auth, email, password);

// Now API calls will work
const incidents = await safetyService.getIncidents(projectId);
```

---

## 3. Incident Management API

### 3.1 Get All Incidents

Retrieves all safety incidents for a specific project.

**Method:** `getIncidents(projectId: string): Promise<SafetyIncident[]>`

**Parameters:**

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| projectId | string | Yes      | Unique identifier for the project |

**Returns:** `Promise<SafetyIncident[]>`

**Example:**

```typescript
import { safetyService } from '@/api/safetyService';

const incidents = await safetyService.getIncidents('project-123');
console.log(incidents);
// [
//   {
//     id: 'inc-001',
//     incidentNumber: 'INC-2024-001',
//     projectId: 'project-123',
//     type: 'injury',
//     severity: 'minor',
//     title: 'Slip and Fall',
//     ...
//   }
// ]
```

**Firestore Query:**

```typescript
const incidentsRef = collection(db, 'safetyIncidents');
const q = query(incidentsRef, where('projectId', '==', projectId), orderBy('occurredAt', 'desc'));
```

---

### 3.2 Get Incident by ID

Retrieves a single incident by its unique identifier.

**Method:** `getIncidentById(id: string): Promise<SafetyIncident>`

**Parameters:**

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| id        | string | Yes      | Unique incident identifier |

**Returns:** `Promise<SafetyIncident>`

**Throws:** Error if incident not found

**Example:**

```typescript
const incident = await safetyService.getIncidentById('inc-001');
console.log(incident.title); // "Slip and Fall"
```

---

### 3.3 Create Incident

Creates a new safety incident with auto-generated incident number.

**Method:** `createIncident(incident: Omit<SafetyIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>): Promise<SafetyIncident>`

**Parameters:**

```typescript
interface CreateIncidentRequest {
  projectId: string;
  type: IncidentType; // 'injury' | 'illness' | 'near_miss' | 'property_damage' | 'environmental' | 'security'
  severity: IncidentSeverity; // 'fatal' | 'critical' | 'major' | 'minor' | 'near_miss'
  status: IncidentStatus; // 'draft' | 'reported' | 'investigating' | 'resolved' | 'closed'
  title: string;
  description: string;
  location: string;
  occurredAt: Date;
  reportedAt: Date;
  reportedBy: string;
  injuredPersons: InjuredPerson[];
  witnesses: Witness[];
  correctiveActions: CorrectiveAction[];
  attachments: Attachment[];
  oshaRecordable: boolean;
  oshaClassification?: string;
  medicalCosts?: number;
  propertyCosts?: number;
  productivityCosts?: number;
}
```

**Returns:** `Promise<SafetyIncident>` - Created incident with auto-generated fields

**Auto-generated Fields:**

- `id`: Firestore document ID
- `incidentNumber`: Sequential number (e.g., "INC-2024-001")
- `createdAt`: Current timestamp
- `updatedAt`: Current timestamp

**Example:**

```typescript
const newIncident = await safetyService.createIncident({
  projectId: 'project-123',
  type: 'injury',
  severity: 'minor',
  status: 'reported',
  title: 'Worker slipped on wet floor',
  description: 'Employee slipped on wet floor in warehouse area',
  location: 'Warehouse Zone A',
  occurredAt: new Date('2024-10-15T10:30:00'),
  reportedAt: new Date(),
  reportedBy: 'user-456',
  injuredPersons: [
    {
      id: 'person-1',
      name: 'John Doe',
      role: 'Warehouse Worker',
      injuryType: 'Sprain',
      injurySeverity: 'minor',
      medicalTreatment: 'first_aid',
      daysLost: 0,
    },
  ],
  witnesses: [
    {
      id: 'witness-1',
      name: 'Jane Smith',
      role: 'Supervisor',
      statement: 'I saw the incident occur',
    },
  ],
  correctiveActions: [
    {
      id: 'action-1',
      action: 'Install warning signs in wet areas',
      responsibility: 'Facilities Manager',
      targetDate: new Date('2024-10-20'),
      status: 'pending',
      completedDate: undefined,
      notes: '',
    },
  ],
  attachments: [],
  oshaRecordable: false,
});

console.log(newIncident.incidentNumber); // "INC-2024-012"
```

---

### 3.4 Update Incident

Updates an existing incident with partial data.

**Method:** `updateIncident(id: string, updates: Partial<SafetyIncident>): Promise<void>`

**Parameters:**

| Parameter | Type                    | Required | Description           |
| --------- | ----------------------- | -------- | --------------------- |
| id        | string                  | Yes      | Incident ID to update |
| updates   | Partial<SafetyIncident> | Yes      | Fields to update      |

**Returns:** `Promise<void>`

**Example:**

```typescript
await safetyService.updateIncident('inc-001', {
  status: 'resolved',
  correctiveActions: [
    {
      id: 'action-1',
      action: 'Install warning signs',
      responsibility: 'Facilities',
      targetDate: new Date('2024-10-20'),
      status: 'completed',
      completedDate: new Date(),
      notes: 'Signs installed in all wet areas',
    },
  ],
});
```

---

### 3.5 Delete Incident

Deletes an incident from the system.

**Method:** `deleteIncident(id: string): Promise<void>`

**Parameters:**

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| id        | string | Yes      | Incident ID to delete |

**Returns:** `Promise<void>`

**Example:**

```typescript
await safetyService.deleteIncident('inc-001');
```

---

## 4. Training Management API

### 4.1 Get Training Sessions

Retrieves all training sessions for a project.

**Method:** `getTraining(projectId: string): Promise<SafetyTraining[]>`

**Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| projectId | string | Yes      | Project identifier |

**Returns:** `Promise<SafetyTraining[]>`

**Example:**

```typescript
const trainingSessions = await safetyService.getTraining('project-123');
console.log(trainingSessions);
// [
//   {
//     id: 'train-001',
//     trainingNumber: 'TRN-2024-001',
//     projectId: 'project-123',
//     title: 'Fall Protection Training',
//     type: 'fall_protection',
//     ...
//   }
// ]
```

---

### 4.2 Create Training Session

Creates a new training session with auto-generated training number.

**Method:** `createTraining(training: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>): Promise<SafetyTraining>`

**Parameters:**

```typescript
interface CreateTrainingRequest {
  projectId: string;
  title: string;
  type: TrainingType; // 'fall_protection' | 'confined_space' | 'hazard_communication' | 'ppe' | 'lockout_tagout' | 'first_aid' | 'fire_safety' | 'scaffolding' | 'other'
  description: string;
  instructor: string;
  scheduledDate: Date;
  duration: number; // minutes
  location: string;
  maxAttendees: number;
  status: TrainingStatus; // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  attendees: TrainingAttendee[];
  materials: TrainingMaterial[];
  certificationRequired: boolean;
  certificationValidityDays?: number;
}
```

**Returns:** `Promise<SafetyTraining>`

**Example:**

```typescript
const training = await safetyService.createTraining({
  projectId: 'project-123',
  title: 'Fall Protection Certification',
  type: 'fall_protection',
  description: 'OSHA-compliant fall protection training',
  instructor: 'Safety Officer John',
  scheduledDate: new Date('2024-11-01T09:00:00'),
  duration: 240, // 4 hours
  location: 'Training Room A',
  maxAttendees: 20,
  status: 'scheduled',
  attendees: [],
  materials: [
    {
      id: 'mat-1',
      title: 'Fall Protection Handbook',
      type: 'document',
      url: 'https://...',
      uploadedAt: new Date(),
    },
  ],
  certificationRequired: true,
  certificationValidityDays: 365,
});

console.log(training.trainingNumber); // "TRN-2024-005"
```

---

### 4.3 Record Training Attendance

Records an attendee for a training session.

**Method:** `recordAttendance(trainingId: string, attendee: TrainingAttendee): Promise<void>`

**Parameters:**

```typescript
interface TrainingAttendee {
  id: string;
  userId: string;
  name: string;
  role: string;
  attended: boolean;
  completedDate?: Date;
  score?: number; // Percentage (0-100)
  passed: boolean;
  certificateIssued: boolean;
  certificateNumber?: string;
  certificateExpiryDate?: Date;
  notes?: string;
}
```

**Returns:** `Promise<void>`

**Example:**

```typescript
await safetyService.recordAttendance('train-001', {
  id: 'att-1',
  userId: 'user-123',
  name: 'John Doe',
  role: 'Construction Worker',
  attended: true,
  completedDate: new Date(),
  score: 95,
  passed: true,
  certificateIssued: true,
  certificateNumber: 'CERT-2024-001',
  certificateExpiryDate: new Date('2025-11-01'),
  notes: 'Excellent performance',
});
```

---

## 5. PPE Management API

### 5.1 Get PPE Inventory

Retrieves all PPE inventory items for a project.

**Method:** `getPPEInventory(projectId: string): Promise<PPEInventory[]>`

**Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| projectId | string | Yes      | Project identifier |

**Returns:** `Promise<PPEInventory[]>`

**Example:**

```typescript
const ppeItems = await safetyService.getPPEInventory('project-123');
console.log(ppeItems);
// [
//   {
//     id: 'ppe-001',
//     projectId: 'project-123',
//     itemName: 'Hard Hat',
//     category: 'head_protection',
//     totalQuantity: 50,
//     availableQuantity: 20,
//     ...
//   }
// ]
```

---

### 5.2 Create PPE Item

Adds a new PPE item to inventory.

**Method:** `createPPEItem(item: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>): Promise<PPEInventory>`

**Parameters:**

```typescript
interface CreatePPEItemRequest {
  projectId: string;
  itemName: string;
  category: PPECategory; // 'head_protection' | 'eye_protection' | 'hearing_protection' | 'respiratory_protection' | 'hand_protection' | 'foot_protection' | 'body_protection' | 'fall_protection'
  manufacturer: string;
  model: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedQuantity: number;
  minimumStock: number;
  reorderPoint: number;
  unitCost: number;
  storageLocation: string;
  certificationStandard: string; // e.g., "ANSI Z89.1"
  expirationTracking: boolean;
  expirationDate?: Date;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
}
```

**Returns:** `Promise<PPEInventory>`

**Example:**

```typescript
const ppeItem = await safetyService.createPPEItem({
  projectId: 'project-123',
  itemName: 'Safety Goggles',
  category: 'eye_protection',
  manufacturer: 'SafetyPro',
  model: 'SG-2000',
  totalQuantity: 100,
  availableQuantity: 100,
  assignedQuantity: 0,
  minimumStock: 20,
  reorderPoint: 30,
  unitCost: 15.99,
  storageLocation: 'Warehouse Shelf B-3',
  certificationStandard: 'ANSI Z87.1',
  expirationTracking: false,
  lastInspectionDate: new Date(),
  nextInspectionDate: new Date('2025-01-01'),
});
```

---

### 5.3 Assign PPE

Assigns PPE to a worker.

**Method:** `assignPPE(assignment: Omit<PPEAssignment, 'id' | 'createdAt'>): Promise<PPEAssignment>`

**Parameters:**

```typescript
interface PPEAssignmentRequest {
  projectId: string;
  ppeItemId: string;
  userId: string;
  userName: string;
  userRole: string;
  quantity: number;
  assignedDate: Date;
  returnDate?: Date;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor';
  notes?: string;
}
```

**Returns:** `Promise<PPEAssignment>`

**Example:**

```typescript
const assignment = await safetyService.assignPPE({
  projectId: 'project-123',
  ppeItemId: 'ppe-001',
  userId: 'user-456',
  userName: 'John Doe',
  userRole: 'Construction Worker',
  quantity: 1,
  assignedDate: new Date(),
  status: 'assigned',
  condition: 'new',
  notes: 'Standard hard hat assignment',
});
```

---

### 5.4 Return PPE

Records the return of PPE from a worker.

**Method:** `returnPPE(assignmentId: string, condition: 'good' | 'fair' | 'poor' | 'damaged', notes?: string): Promise<void>`

**Parameters:**

| Parameter    | Type   | Required | Description           |
| ------------ | ------ | -------- | --------------------- |
| assignmentId | string | Yes      | PPE assignment ID     |
| condition    | string | Yes      | Condition upon return |
| notes        | string | No       | Additional notes      |

**Returns:** `Promise<void>`

**Example:**

```typescript
await safetyService.returnPPE('assign-001', 'good', 'Returned in excellent condition');
```

---

## 6. Audit Management API

### 6.1 Get Audits

Retrieves all safety audits for a project.

**Method:** `getAudits(projectId: string): Promise<SafetyAudit[]>`

**Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| projectId | string | Yes      | Project identifier |

**Returns:** `Promise<SafetyAudit[]>`

**Example:**

```typescript
const audits = await safetyService.getAudits('project-123');
```

---

### 6.2 Create Audit

Creates a new safety audit with auto-generated audit number.

**Method:** `createAudit(audit: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'>): Promise<SafetyAudit>`

**Parameters:**

```typescript
interface CreateAuditRequest {
  projectId: string;
  title: string;
  type: AuditType; // 'site_inspection' | 'compliance_review' | 'behavior_observation' | 'equipment_inspection' | 'documentation_review'
  auditor: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: AuditStatus; // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  checklist: AuditChecklistItem[];
  findings: AuditFinding[];
  overallScore: number; // Percentage 0-100
  complianceLevel: 'full_compliance' | 'minor_issues' | 'major_issues' | 'critical_issues';
  recommendations: string[];
}
```

**Returns:** `Promise<SafetyAudit>`

**Example:**

```typescript
const audit = await safetyService.createAudit({
  projectId: 'project-123',
  title: 'Monthly Site Safety Inspection',
  type: 'site_inspection',
  auditor: 'Safety Manager Sarah',
  scheduledDate: new Date('2024-11-01'),
  completedDate: new Date('2024-11-01'),
  status: 'completed',
  checklist: [
    {
      id: 'item-1',
      category: 'Fall Protection',
      item: 'Guardrails installed on elevated platforms',
      compliant: true,
      notes: 'All platforms have proper guardrails',
      evidence: [],
    },
    {
      id: 'item-2',
      category: 'PPE',
      item: 'Workers wearing hard hats in designated areas',
      compliant: false,
      notes: '2 workers found without hard hats',
      evidence: [],
    },
  ],
  findings: [
    {
      id: 'find-1',
      severity: 'minor',
      category: 'PPE',
      description: 'Workers not wearing hard hats',
      location: 'Zone B',
      correctiveAction: 'Retrain workers on PPE requirements',
      responsibility: 'Site Supervisor',
      targetDate: new Date('2024-11-05'),
      status: 'pending',
    },
  ],
  overallScore: 85,
  complianceLevel: 'minor_issues',
  recommendations: ['Increase PPE enforcement', 'Conduct additional training sessions'],
});

console.log(audit.auditNumber); // "AUD-2024-003"
```

---

## 7. Metrics & Analytics API

### 7.1 Calculate Safety Metrics

Calculates OSHA safety metrics for a specific time period.

**Method:** `calculateMetrics(projectId: string, periodStart: Date, periodEnd: Date): Promise<SafetyMetrics>`

**Parameters:**

| Parameter   | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| projectId   | string | Yes      | Project identifier   |
| periodStart | Date   | Yes      | Start date of period |
| periodEnd   | Date   | Yes      | End date of period   |

**Returns:** `Promise<SafetyMetrics>`

**Calculated Metrics:**

- **TRIR** (Total Recordable Incident Rate): `(Recordable Incidents × 200,000) / Total Work Hours`
- **LTIFR** (Lost Time Injury Frequency Rate): `(Lost Time Injuries × 200,000) / Total Work Hours`
- **DART** (Days Away, Restricted, Transfer Rate): `(DART Cases × 200,000) / Total Work Hours`
- **Near Miss Frequency Rate**: `(Near Misses × 200,000) / Total Work Hours`

**Example:**

```typescript
const metrics = await safetyService.calculateMetrics(
  'project-123',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log(metrics);
// {
//   projectId: 'project-123',
//   period: {
//     start: Date('2024-01-01'),
//     end: Date('2024-12-31')
//   },
//   totalWorkHours: 500000,
//   rates: {
//     totalRecordableIncidentRate: 2.4,
//     lostTimeInjuryFrequencyRate: 1.2,
//     daysAwayRestrictedTransferRate: 1.6,
//     nearMissFrequencyRate: 4.8
//   },
//   incidents: {
//     total: 15,
//     bySeverity: {
//       fatal: 0,
//       critical: 1,
//       major: 3,
//       minor: 8,
//       near_miss: 12
//     },
//     byType: {
//       injury: 10,
//       illness: 2,
//       near_miss: 12,
//       property_damage: 1,
//       environmental: 0,
//       security: 0
//     },
//     fatalCount: 0,
//     lostTimeInjuries: 3,
//     totalDaysLost: 45
//   },
//   costImpact: {
//     totalCosts: 125000,
//     medicalCosts: 75000,
//     propertyCosts: 25000,
//     productivityCosts: 25000
//   }
// }
```

---

### 7.2 Get Dashboard Summary

Retrieves a comprehensive dashboard summary with current status.

**Method:** `getDashboardSummary(projectId: string): Promise<SafetyDashboardSummary>`

**Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| projectId | string | Yes      | Project identifier |

**Returns:** `Promise<SafetyDashboardSummary>`

**Example:**

```typescript
const summary = await safetyService.getDashboardSummary('project-123');

console.log(summary);
// {
//   currentMetrics: SafetyMetrics,
//   previousMetrics: SafetyMetrics,
//   trends: {
//     trirTrend: 'improving', // or 'worsening' | 'stable'
//     ltifrTrend: 'stable',
//     incidentTrend: 'improving'
//   },
//   recentIncidents: SafetyIncident[],
//   criticalIncidents: SafetyIncident[],
//   openIncidents: SafetyIncident[],
//   upcomingTraining: SafetyTraining[],
//   ppeAlerts: {
//     lowStock: PPEInventory[],
//     expiringSoon: PPEInventory[],
//     needsInspection: PPEInventory[]
//   },
//   pendingAudits: SafetyAudit[],
//   complianceScore: number, // 0-100
//   daysWithoutLostTime: number
// }
```

---

## 8. Error Handling

All API methods may throw errors. Always wrap calls in try-catch blocks.

**Common Error Types:**

```typescript
try {
  const incident = await safetyService.getIncidentById('invalid-id');
} catch (error) {
  if (error.code === 'permission-denied') {
    // User doesn't have permission
    console.error('Access denied');
  } else if (error.code === 'not-found') {
    // Document doesn't exist
    console.error('Incident not found');
  } else if (error.code === 'unauthenticated') {
    // User not logged in
    console.error('Please log in');
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

**Error Codes:**

- `permission-denied`: User lacks required permissions
- `not-found`: Requested document doesn't exist
- `unauthenticated`: User not authenticated
- `invalid-argument`: Invalid parameter provided
- `deadline-exceeded`: Request timeout
- `already-exists`: Document already exists
- `resource-exhausted`: Quota exceeded

---

## 9. Rate Limits

Firebase Firestore has the following limits:

| Operation          | Limit       |
| ------------------ | ----------- |
| Writes per second  | 10,000      |
| Reads per second   | 50,000      |
| Document size      | 1 MB        |
| Field name size    | 1,500 bytes |
| Collection ID size | 1,500 bytes |

**Best Practices:**

- Implement pagination for large datasets
- Cache frequently accessed data
- Use batch operations when possible
- Avoid rapid sequential writes to same document

---

## 10. Code Examples

### Example 1: Complete Incident Workflow

```typescript
import { safetyService } from '@/api/safetyService';

async function completeIncidentWorkflow() {
  try {
    // 1. Create incident
    const incident = await safetyService.createIncident({
      projectId: 'project-123',
      type: 'injury',
      severity: 'minor',
      status: 'reported',
      title: 'Cut from sharp tool',
      description: 'Worker cut hand while using utility knife',
      location: 'Workshop',
      occurredAt: new Date(),
      reportedAt: new Date(),
      reportedBy: 'user-456',
      injuredPersons: [
        {
          id: 'person-1',
          name: 'John Doe',
          role: 'Carpenter',
          injuryType: 'Laceration',
          injurySeverity: 'minor',
          medicalTreatment: 'first_aid',
          daysLost: 0,
        },
      ],
      witnesses: [],
      correctiveActions: [
        {
          id: 'action-1',
          action: 'Provide cut-resistant gloves',
          responsibility: 'Safety Manager',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      ],
      attachments: [],
      oshaRecordable: false,
    });

    console.log('Incident created:', incident.incidentNumber);

    // 2. Update status to investigating
    await safetyService.updateIncident(incident.id, {
      status: 'investigating',
    });

    // 3. Complete corrective action
    await safetyService.updateIncident(incident.id, {
      status: 'resolved',
      correctiveActions: [
        {
          ...incident.correctiveActions[0],
          status: 'completed',
          completedDate: new Date(),
          notes: 'Cut-resistant gloves provided to all workers',
        },
      ],
    });

    // 4. Close incident
    await safetyService.updateIncident(incident.id, {
      status: 'closed',
    });

    console.log('Incident workflow completed');
  } catch (error) {
    console.error('Error in incident workflow:', error);
  }
}
```

### Example 2: Training Session Management

```typescript
async function manageTrainingSession() {
  try {
    // 1. Create training session
    const training = await safetyService.createTraining({
      projectId: 'project-123',
      title: 'Scaffolding Safety Training',
      type: 'scaffolding',
      description: 'OSHA-compliant scaffolding training',
      instructor: 'Safety Officer',
      scheduledDate: new Date('2024-11-15T09:00:00'),
      duration: 180,
      location: 'Training Center',
      maxAttendees: 15,
      status: 'scheduled',
      attendees: [],
      materials: [],
      certificationRequired: true,
      certificationValidityDays: 730, // 2 years
    });

    console.log('Training created:', training.trainingNumber);

    // 2. Record attendees
    const workers = ['user-1', 'user-2', 'user-3'];

    for (const userId of workers) {
      await safetyService.recordAttendance(training.id, {
        id: `att-${userId}`,
        userId: userId,
        name: `Worker ${userId}`,
        role: 'Construction Worker',
        attended: true,
        completedDate: new Date(),
        score: 90,
        passed: true,
        certificateIssued: true,
        certificateNumber: `CERT-${training.trainingNumber}-${userId}`,
        certificateExpiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      });
    }

    // 3. Mark training as completed
    await safetyService.updateTraining(training.id, {
      status: 'completed',
    });

    console.log('Training session completed');
  } catch (error) {
    console.error('Error managing training:', error);
  }
}
```

### Example 3: PPE Management

```typescript
async function managePPE() {
  try {
    // 1. Add PPE to inventory
    const hardHats = await safetyService.createPPEItem({
      projectId: 'project-123',
      itemName: 'Type I Hard Hat',
      category: 'head_protection',
      manufacturer: 'MSA',
      model: 'V-Gard',
      totalQuantity: 50,
      availableQuantity: 50,
      assignedQuantity: 0,
      minimumStock: 10,
      reorderPoint: 15,
      unitCost: 25.0,
      storageLocation: 'Equipment Room A',
      certificationStandard: 'ANSI Z89.1 Type I',
      expirationTracking: true,
      expirationDate: new Date('2029-12-31'),
      lastInspectionDate: new Date(),
      nextInspectionDate: new Date('2025-01-01'),
    });

    // 2. Assign PPE to worker
    const assignment = await safetyService.assignPPE({
      projectId: 'project-123',
      ppeItemId: hardHats.id,
      userId: 'user-456',
      userName: 'John Doe',
      userRole: 'Construction Worker',
      quantity: 1,
      assignedDate: new Date(),
      status: 'assigned',
      condition: 'new',
    });

    // 3. Check inventory levels
    const inventory = await safetyService.getPPEInventory('project-123');
    const lowStockItems = inventory.filter((item) => item.availableQuantity <= item.reorderPoint);

    if (lowStockItems.length > 0) {
      console.log(
        'Low stock alert:',
        lowStockItems.map((item) => item.itemName)
      );
    }

    // 4. Return PPE
    await safetyService.returnPPE(assignment.id, 'good', 'Normal wear and tear');
  } catch (error) {
    console.error('Error managing PPE:', error);
  }
}
```

### Example 4: Safety Metrics Dashboard

```typescript
async function displaySafetyMetrics() {
  try {
    // Get comprehensive dashboard
    const summary = await safetyService.getDashboardSummary('project-123');

    // Display current OSHA rates
    console.log('=== OSHA Safety Rates ===');
    console.log(`TRIR: ${summary.currentMetrics.rates.totalRecordableIncidentRate.toFixed(2)}`);
    console.log(`LTIFR: ${summary.currentMetrics.rates.lostTimeInjuryFrequencyRate.toFixed(2)}`);
    console.log(`DART: ${summary.currentMetrics.rates.daysAwayRestrictedTransferRate.toFixed(2)}`);

    // Display trends
    console.log('\n=== Trends ===');
    console.log(`TRIR Trend: ${summary.trends.trirTrend}`);
    console.log(`Incident Trend: ${summary.trends.incidentTrend}`);

    // Display critical incidents
    console.log('\n=== Critical Incidents ===');
    console.log(`Count: ${summary.criticalIncidents.length}`);
    summary.criticalIncidents.forEach((incident) => {
      console.log(`- ${incident.title} (${incident.severity})`);
    });

    // Display compliance score
    console.log('\n=== Compliance ===');
    console.log(`Overall Score: ${summary.complianceScore}%`);
    console.log(`Days Without Lost Time: ${summary.daysWithoutLostTime}`);

    // Display PPE alerts
    if (summary.ppeAlerts.lowStock.length > 0) {
      console.log('\n=== PPE Alerts ===');
      console.log('Low Stock Items:');
      summary.ppeAlerts.lowStock.forEach((item) => {
        console.log(`- ${item.itemName}: ${item.availableQuantity} remaining`);
      });
    }
  } catch (error) {
    console.error('Error displaying metrics:', error);
  }
}
```

---

## Appendix A: Type Definitions

All type definitions are located in `types/safety.types.ts`. Key types:

```typescript
// Core types
SafetyIncident;
SafetyTraining;
PPEInventory;
PPEAssignment;
SafetyAudit;
SafetyMetrics;
SafetyDashboardSummary;

// Enums
IncidentType;
IncidentSeverity;
IncidentStatus;
TrainingType;
TrainingStatus;
PPECategory;
AuditType;
AuditStatus;

// Supporting types
InjuredPerson;
Witness;
CorrectiveAction;
Attachment;
TrainingAttendee;
TrainingMaterial;
AuditChecklistItem;
AuditFinding;
```

---

## Appendix B: OSHA Reference

**OSHA Standards Implemented:**

- OSHA 1904 - Recordkeeping
- OSHA 1926 - Construction Safety
- ISO 45001 - Occupational Health & Safety Management

**Metric Formulas:**

- TRIR = (Recordable Incidents × 200,000) / Total Work Hours
- LTIFR = (Lost Time Injuries × 200,000) / Total Work Hours
- DART = (DART Cases × 200,000) / Total Work Hours

**Industry Benchmarks:**

- TRIR: < 2.0 (Excellent), 2.0-4.0 (Average), > 4.0 (Poor)
- LTIFR: < 1.0 (Excellent), 1.0-2.0 (Average), > 2.0 (Poor)

---

**Last Updated:** 2024-10-20  
**Version:** 1.0.0  
**Contact:** Safety Management Team
