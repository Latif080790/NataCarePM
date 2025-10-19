# Safety Management System - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Safety Dashboard](#safety-dashboard)
4. [Incident Management](#incident-management)
5. [Training & Certifications](#training--certifications)
6. [PPE Management](#ppe-management)
7. [Safety Audits](#safety-audits)
8. [Reports & Analytics](#reports--analytics)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is the Safety Management System?

The Safety Management System is a comprehensive OSHA-compliant platform designed to help construction project teams track, manage, and improve workplace safety. It provides real-time visibility into safety metrics, incident tracking, training management, and compliance reporting.

### Key Features

- **OSHA-Compliant Incident Tracking**: Record and investigate workplace incidents with full regulatory compliance
- **Real-Time Safety Metrics**: Monitor TRIR, LTIFR, DART, and other critical safety KPIs
- **Training Management**: Track certifications, schedule training sessions, and manage expirations
- **PPE Management**: Inventory tracking, assignment management, and compliance monitoring
- **Safety Audits**: Conduct inspections with digital checklists and automated compliance scoring
- **Mobile-Ready**: Access safety features on any device, with offline capability for field workers

### Who Should Use This System?

- **Safety Managers**: Full system access for incident management and compliance reporting
- **Project Managers**: Dashboard visibility and safety oversight
- **Field Workers**: Incident reporting and safety observations
- **Executives**: High-level safety metrics and KPI dashboards
- **Compliance Officers**: OSHA reporting and regulatory compliance

---

## Getting Started

### Accessing the System

1. **Login**: Navigate to the application and log in with your credentials
2. **Navigate to Safety**: Click on "Safety" in the main navigation menu
3. **Dashboard**: You'll see the Safety Dashboard as your home screen

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet**: Required for real-time sync (offline mode available for inspections)
- **Permissions**: Appropriate role-based access (configured by administrator)

### Quick Start Checklist

- [ ] Review the Safety Dashboard to understand current safety status
- [ ] Familiarize yourself with incident reporting process
- [ ] Check upcoming training sessions
- [ ] Review open safety findings
- [ ] Set up notifications (optional)

---

## Safety Dashboard

### Overview

The Safety Dashboard provides a real-time snapshot of your project's safety performance.

### Dashboard Components

#### 1. Current Status Cards

Four key metrics displayed at the top:

- **Days Since Last Incident**: 
  - Green (30+ days): Excellent safety performance
  - Yellow (7-29 days): Maintain vigilance
  - Red (<7 days): Requires immediate attention

- **Active Incidents**: 
  - Count of incidents currently being investigated or in corrective action

- **Critical Incidents**: 
  - Fatal or critical severity incidents requiring immediate executive attention

- **Open Findings**: 
  - Unresolved findings from safety audits

#### 2. OSHA Safety Rates

Three primary OSHA metrics:

**TRIR (Total Recordable Incident Rate)**
- Formula: (Recordable Incidents × 200,000) / Total Work Hours
- Target: < 2.0 (Industry average: 3.2)
- Color Coding:
  - Green: < 2.0 (Excellent)
  - Yellow: 2.0-4.0 (Needs Improvement)
  - Red: > 4.0 (Critical)

**LTIFR (Lost Time Injury Frequency Rate)**
- Formula: (Lost Time Injuries × 200,000) / Total Work Hours
- Target: < 1.0 (Industry average: 1.8)
- Color Coding:
  - Green: < 1.0 (Excellent)
  - Yellow: 1.0-2.0 (Needs Improvement)
  - Red: > 2.0 (Critical)

**Near Miss Frequency Rate**
- Formula: (Near Misses × 200,000) / Total Work Hours
- Note: Higher reporting is positive (indicates proactive safety culture)

#### 3. Incidents by Severity

Visual breakdown of incidents:
- Fatal (Red)
- Critical (Dark Orange)
- Major (Orange)
- Minor (Yellow)
- Near Miss (Green)

#### 4. Training & Compliance

- **Training Completion Rate**: Percentage of workers with current certifications
- **Total Sessions**: Training sessions conducted this period
- **Total Attendees**: Number of workers trained
- **Expired Certifications**: Workers with expired certificates (immediate action required)
- **Expiring Soon**: Certifications expiring within 30 days

#### 5. Audit Performance

- **Average Compliance Rate**: Overall compliance across all audits
- **Total Audits**: Number of audits conducted
- **Critical Findings**: High-priority issues requiring immediate correction
- **Open Findings**: Unresolved audit findings

### Using the Dashboard

#### Filtering Data

- **Period Selector**: Choose "This Month", "This Quarter", or "Year to Date"
- **Refresh**: Click refresh button to update data manually

#### Interpreting Metrics

- **Green Indicators**: Performance meets or exceeds targets
- **Yellow Indicators**: Performance acceptable but needs monitoring
- **Red Indicators**: Performance below target, immediate action required

#### Taking Action

1. **Review Alerts**: Check for any critical incidents or expiring certifications
2. **Identify Trends**: Look for patterns in incident severity or types
3. **Follow Up**: Click on metrics to view detailed information
4. **Export Data**: Use export functions for reports (if available)

---

## Incident Management

### Reporting an Incident

#### Step 1: Access Incident Management
1. Click "Safety" in main navigation
2. Select "Incidents" from submenu
3. Click "Report Incident" button (red button, top right)

#### Step 2: Basic Information
- **Incident Type**: Select from dropdown
  - Fall
  - Struck By
  - Caught In/Between
  - Electrical
  - Chemical
  - Fire
  - Equipment
  - Environmental
  - Ergonomic
  - Other
  
- **Severity**: Select appropriate level
  - **Fatal**: Death occurred
  - **Critical**: Life-threatening injury or major property damage
  - **Major**: Serious injury requiring hospital treatment
  - **Minor**: First aid treatment required
  - **Near Miss**: No injury but potential for harm

- **Title**: Brief descriptive title (e.g., "Worker fell from ladder")
- **Description**: Detailed description of what happened

#### Step 3: Location & Time
- **Location**: Specific location on site (e.g., "Building A, 3rd Floor")
- **Date & Time**: When the incident occurred
- **Reported By**: Your name (auto-filled)

#### Step 4: People Involved

**Injured Persons** (if applicable):
- Name and role
- Type of injury
- Severity of injury (Fatal, Major, Minor, None)
- Medical treatment received
- Hospital name (if transported)
- Expected days lost

**Witnesses**:
- Name and role
- Contact information
- Statement (optional at this stage)

#### Step 5: Evidence
- **Photos**: Upload photos of incident scene, injuries (if appropriate), equipment
- **Documents**: Attach medical reports, witness statements, etc.
- **Videos**: Upload video evidence if available

#### Step 6: OSHA Classification
- **OSHA Recordable**: Check if incident meets OSHA recording criteria
  - Death
  - Days away from work
  - Restricted work or job transfer
  - Medical treatment beyond first aid
  - Loss of consciousness
  - Diagnosis of significant injury or illness
  
- **Authorities Notified**: Indicate if OSHA or other authorities were contacted

#### Step 7: Submit
- Review all information for accuracy
- Click "Submit Incident Report"
- System generates unique incident number (e.g., INC-2024-001)

### Managing Incidents

#### Incident List View

**Filters**:
- Search by incident number, title, location
- Filter by severity
- Filter by status
- Date range selection

**Status Indicators**:
- **Reported** (Blue): Newly reported, awaiting investigation
- **Investigating** (Yellow): Investigation in progress
- **Corrective Action** (Purple): Corrective actions being implemented
- **Closed** (Green): Investigation complete, all actions closed
- **Reopened** (Orange): Reopened for additional investigation

**View Modes**:
- **List View**: Detailed list with key information
- **Grid View**: Card-based layout for visual scanning

#### Incident Details

Click on any incident to view full details:

**Overview Tab**:
- Complete incident information
- Injured persons details
- Witness statements
- Evidence (photos, documents)

**Investigation Tab**:
- Investigation lead and team
- Investigation timeline
- Root cause analysis
- Contributing factors

**Corrective Actions Tab**:
- List of corrective actions
- Responsible person
- Target completion date
- Status and progress
- Completion evidence

**Cost Impact Tab**:
- Medical costs
- Property damage costs
- Productivity loss costs
- Total cost impact

### Investigation Process

#### Step 1: Assign Investigation Lead
- Designated safety professional or manager
- Must have investigation training

#### Step 2: Gather Evidence
- Interview witnesses
- Photograph scene
- Collect physical evidence
- Review procedures and training records

#### Step 3: Root Cause Analysis
- Use 5 Whys technique
- Identify immediate causes
- Identify root causes
- Identify contributing factors

#### Step 4: Develop Corrective Actions
- Actions to prevent recurrence
- Assign responsibility
- Set target dates
- Document preventive measures

#### Step 5: Close Investigation
- Review findings
- Approve corrective action plan
- Submit to management
- Close incident when all actions complete

### OSHA Reporting

#### When to Report to OSHA

**Within 8 Hours**:
- Any work-related fatality

**Within 24 Hours**:
- Any work-related inpatient hospitalization
- Any work-related amputation
- Any work-related loss of an eye

#### How to Report
1. Mark incident as "OSHA Recordable" in system
2. System flags for regulatory reporting
3. Follow company procedures for OSHA notification
4. Document OSHA report number in system

---

## Training & Certifications

### Training Dashboard

View all training sessions and certification status:
- Upcoming training sessions
- Past training history
- Certification expirations
- Training compliance rate

### Scheduling Training

#### Step 1: Create Training Session
1. Navigate to Safety > Training
2. Click "Schedule Training"
3. Fill in details:
   - Training type (e.g., Fall Protection, Confined Space)
   - Title and description
   - Instructor name
   - Duration (hours)
   - Date and time
   - Location
   - Maximum attendees

#### Step 2: Add Attendees
- Search and select workers
- Or upload attendance list
- System checks for certification expiry

#### Step 3: Training Materials
- Upload training materials
- Add reference documents
- Link to online resources

#### Step 4: Assessment (if required)
- Create assessment questions
- Set passing score
- Configure certificate issuance

#### Step 5: Confirm
- Review all details
- Click "Schedule Training"
- System sends notifications to attendees

### During Training

#### Attendance
- Mark attendees as present/absent
- System tracks no-shows

#### Assessment
- Administer assessment (paper or digital)
- Enter scores
- System auto-generates pass/fail

#### Certificates
- System auto-generates certificates for passed attendees
- Includes unique certificate number
- Sets expiry date based on training type

### After Training

#### Update Records
- All attendee records updated automatically
- Certifications issued
- Compliance status updated

#### Follow-Up
- System sends certificates to attendees
- Notifications for failed assessments
- Recommendations for retraining

### Managing Certifications

#### Certification Tracking
- View all certifications by worker
- Filter by certification type
- Sort by expiry date

#### Expiration Alerts
- 90 days: First warning
- 60 days: Second warning
- 30 days: Final warning
- 0 days: Expired (red flag)

#### Bulk Operations
- Export certification reports
- Schedule bulk retraining
- Generate compliance reports

---

## PPE Management

### PPE Inventory

#### Adding PPE Items
1. Navigate to Safety > PPE > Inventory
2. Click "Add PPE Item"
3. Enter details:
   - Type (hard hat, safety glasses, etc.)
   - Brand and model
   - Quantity
   - Specifications
   - Certifications (ANSI, CSA, etc.)
   - Unit cost
   - Storage location
   - Reorder level

#### Managing Inventory
- View total quantity, available, assigned, damaged
- Track inspection dates
- Monitor expiry dates
- Set reorder alerts

### PPE Assignment

#### Assigning PPE to Workers
1. Click "Assign PPE"
2. Select worker
3. Select PPE item
4. Enter details:
   - Quantity
   - Condition (new, good, fair)
   - Serial numbers (if tracked)
   - Expected return date

#### Return Process
1. Worker returns PPE
2. Inspect condition
3. Update status:
   - Good: Return to available stock
   - Damaged: Mark as damaged, schedule repair/disposal
   - Lost: Update inventory, charge worker (if applicable)

### PPE Compliance

#### Compliance Checking
- System tracks which workers have required PPE
- Flags workers without proper equipment
- Generates compliance reports

#### Site Access Control
- Integration with site access system (if available)
- Prevents site entry without required PPE
- Logs compliance violations

---

## Safety Audits

### Conducting an Audit

#### Step 1: Create Audit
1. Navigate to Safety > Audits
2. Click "New Audit"
3. Select audit type:
   - Routine inspection
   - Spot check
   - Incident investigation
   - Regulatory compliance

#### Step 2: Audit Details
- Auditor name and certification
- Date and time
- Location and scope
- Compliance standards (OSHA, ISO, etc.)

#### Step 3: Checklist
- Load pre-defined checklist or create custom
- Categories: Housekeeping, PPE, Equipment, Procedures, etc.
- For each item:
  - Mark as Compliant/Non-Compliant/N/A
  - Add evidence (photos)
  - Enter comments

#### Step 4: Findings
For each non-compliance:
- Describe finding
- Assign severity (Critical, Major, Minor)
- Recommend corrective action
- Set due date
- Assign responsibility

#### Step 5: Complete Audit
- Review all items
- Calculate compliance rate
- Generate report
- Submit for approval

### Audit Results

#### Compliance Rate
- System calculates: (Compliant Items / Total Items) × 100
- Color coding:
  - Green: ≥ 90%
  - Yellow: 75-89%
  - Red: < 75%

#### Follow-Up Actions
- System creates corrective action items
- Assigns to responsible persons
- Tracks completion
- Verifies effectiveness

---

## Reports & Analytics

### Available Reports

1. **Incident Summary Report**
   - All incidents by period
   - Severity breakdown
   - Cost impact analysis
   
2. **OSHA Report**
   - OSHA 300 Log format
   - All recordable incidents
   - Regulatory submission ready

3. **Training Compliance Report**
   - Worker certification status
   - Expired certifications
   - Upcoming expirations

4. **PPE Compliance Report**
   - PPE assignment status
   - Inventory levels
   - Cost analysis

5. **Audit Summary Report**
   - Compliance trends
   - Open findings
   - Corrective action status

### Generating Reports

1. Navigate to Safety > Reports
2. Select report type
3. Configure parameters:
   - Date range
   - Filters
   - Format (PDF, Excel, CSV)
4. Click "Generate"
5. Download or email report

---

## Best Practices

### Daily Safety Practices

1. **Start-of-Day Safety Brief**
   - Review yesterday's incidents
   - Discuss today's hazards
   - Remind workers of PPE requirements

2. **Ongoing Monitoring**
   - Walk the site regularly
   - Observe work practices
   - Document safety observations

3. **End-of-Day Review**
   - Report any incidents immediately
   - Document near misses
   - Plan next day's safety focus

### Incident Reporting

1. **Report Immediately**: Don't delay incident reporting
2. **Be Thorough**: Include all details, even if they seem minor
3. **Preserve Evidence**: Don't clean up scene until documented
4. **Interview Quickly**: Talk to witnesses while memory is fresh
5. **Follow Up**: Track corrective actions to completion

### Training Management

1. **Plan Ahead**: Schedule training before certifications expire
2. **Document Everything**: Keep all training records and materials
3. **Verify Learning**: Use assessments to ensure comprehension
4. **Refresh Regularly**: Don't wait for expiry to retrain

### PPE Management

1. **Inspect Regularly**: Check PPE condition before each use
2. **Replace Promptly**: Don't use damaged or expired PPE
3. **Train Workers**: Ensure proper use and maintenance
4. **Monitor Compliance**: Regular checks to ensure usage

---

## Troubleshooting

### Common Issues

#### "I can't report an incident"
- **Check permissions**: Ensure you have incident reporting rights
- **Try different browser**: Some features require modern browsers
- **Contact support**: Your safety manager or IT support

#### "My certification shows as expired but it's current"
- **Upload new certificate**: Attach updated certification document
- **Contact training coordinator**: They can manually update
- **Check expiry date**: Verify the date in the system

#### "OSHA rates seem incorrect"
- **Verify work hours**: Ensure total work hours are accurate
- **Check incident classification**: Verify OSHA recordable status
- **Review calculation**: OSHA rates use 200,000 hour denominator

#### "I can't find an incident"
- **Check filters**: Remove all filters and search again
- **Verify spelling**: Check incident number or title spelling
- **Check date range**: Expand date range in search
- **Contact administrator**: Incident may be archived

### Getting Help

- **Online Help**: Click ? icon in any screen
- **Safety Manager**: Your designated safety manager
- **IT Support**: For technical issues
- **Training**: Request additional training if needed

---

## Appendix

### OSHA Incident Recordkeeping

**What incidents must be recorded?**
- Work-related deaths
- Work-related injuries and illnesses that result in:
  - Days away from work
  - Restricted work or job transfer
  - Medical treatment beyond first aid
  - Loss of consciousness
  - Significant injury/illness diagnosed by physician

**What is NOT recordable?**
- First aid treatment only
- Non-work-related incidents
- Minor injuries (cuts, bruises requiring only first aid)

### Safety Terminology

- **DART**: Days Away, Restricted, or Transferred
- **EMR**: Experience Modification Rate
- **Hazard**: Potential source of harm
- **Incident**: Unplanned event that caused or could have caused injury
- **LTIFR**: Lost Time Injury Frequency Rate
- **Near Miss**: Incident with no injury but potential for harm
- **PPE**: Personal Protective Equipment
- **Root Cause**: Underlying reason an incident occurred
- **TRIR**: Total Recordable Incident Rate

### Keyboard Shortcuts

- **Ctrl + N**: New incident report
- **Ctrl + S**: Save current form
- **Ctrl + F**: Search incidents
- **Esc**: Close modal/dialog

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: March 2025

For additional support, contact your Safety Manager or visit the internal help portal.
