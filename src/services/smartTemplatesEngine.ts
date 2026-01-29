import {
  DocumentTemplate,
  TemplateCategory,
  OutputFormat,
  TemplateMetadata,
  AutoGenerationSettings,
  DistributionSettings,
} from '@/types';

// Smart Templates Engine for Auto-generating Reports
export class SmartTemplatesEngine {
  private templates: Map<string, DocumentTemplate> = new Map();
  private compiledTemplates: Map<string, CompiledTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Initialize default construction industry templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: DocumentTemplate[] = [
      this.createProgressReportTemplate(),
      this.createFinancialReportTemplate(),
      this.createSafetyReportTemplate(),
      this.createQualityReportTemplate(),
      this.createMaterialReportTemplate(),
      this.createComplianceReportTemplate(),
      this.createContractDocumentTemplate(),
      this.createInspectionReportTemplate(),
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.id, template);
      this.compileTemplate(template);
    });
  }

  // Create Progress Report Template
  private createProgressReportTemplate(): DocumentTemplate {
    return {
      id: 'progress_report_v1',
      name: 'Project Progress Report',
      category: 'progress_report',
      description: 'Comprehensive project progress tracking report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'header',
            title: 'Project Overview',
            order: 1,
            type: 'dynamic',
            dataSource: 'project',
            isRequired: true,
            conditions: [],
            formatting: {
              alignment: 'left',
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          {
            id: 'timeline',
            title: 'Timeline Status',
            order: 2,
            type: 'chart',
            dataSource: 'project.timeline',
            isRequired: true,
            conditions: [],
            formatting: {
              alignment: 'center',
            },
          },
          {
            id: 'tasks_completed',
            title: 'Completed Tasks',
            order: 3,
            type: 'table',
            dataSource: 'tasks.completed',
            isRequired: true,
            conditions: [],
            formatting: {
              alignment: 'left',
            },
          },
          {
            id: 'upcoming_milestones',
            title: 'Upcoming Milestones',
            order: 4,
            type: 'table',
            dataSource: 'milestones.upcoming',
            isRequired: true,
            conditions: [],
            formatting: {
              alignment: 'left',
            },
          },
          {
            id: 'risks_issues',
            title: 'Risks and Issues',
            order: 5,
            type: 'dynamic',
            dataSource: 'risks',
            isRequired: false,
            conditions: [
              {
                field: 'risks.count',
                operator: 'greater_than',
                value: 0,
                action: 'show',
              },
            ],
            formatting: {
              alignment: 'left',
            },
          },
          {
            id: 'signature_section',
            title: 'Approvals',
            order: 6,
            type: 'signature',
            isRequired: true,
            conditions: [],
            formatting: {
              alignment: 'right',
            },
          },
        ],
        header: {
          content: '{{project.name}} - Progress Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: {
            alignment: 'center',
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        footer: {
          content: 'Generated automatically by NataCarePM System',
          includePageNumbers: true,
          includeSignatures: false,
          formatting: {
            alignment: 'center',
            fontSize: 10,
          },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [
        {
          templateFieldId: 'project.name',
          dataSource: 'project',
          fieldPath: 'name',
          validation: [
            {
              type: 'required',
              parameters: {},
              errorMessage: 'Project name is required',
            },
          ],
        },
        {
          templateFieldId: 'project.timeline',
          dataSource: 'project',
          fieldPath: 'timeline',
          transformation: {
            type: 'format',
            parameters: { format: 'gantt_chart' },
          },
        },
        {
          templateFieldId: 'tasks.completed',
          dataSource: 'tasks',
          fieldPath: 'status=completed',
          transformation: {
            type: 'filter',
            parameters: { status: 'completed' },
          },
        },
        {
          templateFieldId: 'milestones.upcoming',
          dataSource: 'milestones',
          fieldPath: 'dueDate>today',
          transformation: {
            type: 'filter',
            parameters: {
              field: 'dueDate',
              condition: 'greater_than',
              value: 'today',
            },
          },
        },
      ],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['progress', 'project', 'management', 'reporting'],
      metadata: {
        industry: 'construction',
        regulatory: ['ISO9001', 'PMI'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Financial Report Template
  private createFinancialReportTemplate(): DocumentTemplate {
    return {
      id: 'financial_report_v1',
      name: 'Financial Status Report',
      category: 'financial_report',
      description: 'Comprehensive financial analysis and cost tracking report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'budget_overview',
            title: 'Budget Overview',
            order: 1,
            type: 'chart',
            dataSource: 'financials.budget',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'cost_breakdown',
            title: 'Cost Breakdown by Category',
            order: 2,
            type: 'table',
            dataSource: 'financials.costs',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'evm_analysis',
            title: 'Earned Value Management',
            order: 3,
            type: 'dynamic',
            dataSource: 'evm',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'cash_flow',
            title: 'Cash Flow Projection',
            order: 4,
            type: 'chart',
            dataSource: 'financials.cashflow',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'variance_analysis',
            title: 'Budget Variance Analysis',
            order: 5,
            type: 'table',
            dataSource: 'financials.variance',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Financial Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Confidential Financial Information',
          includePageNumbers: true,
          includeSignatures: true,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#059669',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [
        {
          templateFieldId: 'financials.budget',
          dataSource: 'project',
          fieldPath: 'budget',
          transformation: {
            type: 'calculate',
            parameters: {
              operation: 'budget_vs_actual',
              format: 'pie_chart',
            },
          },
        },
        {
          templateFieldId: 'financials.costs',
          dataSource: 'expenses',
          fieldPath: 'all',
          transformation: {
            type: 'aggregate',
            parameters: {
              groupBy: 'category',
              operation: 'sum',
            },
          },
        },
      ],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['financial', 'budget', 'cost', 'evm'],
      metadata: {
        industry: 'construction',
        regulatory: ['GAAP', 'IFRS'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Safety Report Template
  private createSafetyReportTemplate(): DocumentTemplate {
    return {
      id: 'safety_report_v1',
      name: 'Safety Compliance Report',
      category: 'safety_report',
      description: 'Safety incidents, compliance, and training report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'safety_metrics',
            title: 'Safety Performance Metrics',
            order: 1,
            type: 'chart',
            dataSource: 'safety.metrics',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'incidents',
            title: 'Incident Reports',
            order: 2,
            type: 'table',
            dataSource: 'safety.incidents',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'training_status',
            title: 'Safety Training Status',
            order: 3,
            type: 'table',
            dataSource: 'safety.training',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'compliance_checklist',
            title: 'Compliance Checklist',
            order: 4,
            type: 'dynamic',
            dataSource: 'safety.compliance',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Safety Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Safety is our top priority',
          includePageNumbers: true,
          includeSignatures: true,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#dc2626',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [
        {
          templateFieldId: 'safety.metrics',
          dataSource: 'safety',
          fieldPath: 'metrics',
          transformation: {
            type: 'calculate',
            parameters: {
              metrics: ['incident_rate', 'training_completion', 'compliance_score'],
            },
          },
        },
      ],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['safety', 'compliance', 'incidents', 'training'],
      metadata: {
        industry: 'construction',
        regulatory: ['OSHA', 'ISO45001'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Quality Report Template
  private createQualityReportTemplate(): DocumentTemplate {
    return {
      id: 'quality_report_v1',
      name: 'Quality Assurance Report',
      category: 'quality_report',
      description: 'Quality control inspections and compliance report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'quality_metrics',
            title: 'Quality Performance Indicators',
            order: 1,
            type: 'chart',
            dataSource: 'quality.metrics',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'inspections',
            title: 'Inspection Results',
            order: 2,
            type: 'table',
            dataSource: 'quality.inspections',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'non_conformances',
            title: 'Non-Conformances',
            order: 3,
            type: 'table',
            dataSource: 'quality.nonconformances',
            isRequired: false,
            conditions: [
              {
                field: 'quality.nonconformances.count',
                operator: 'greater_than',
                value: 0,
                action: 'show',
              },
            ],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Quality Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Quality Excellence in Construction',
          includePageNumbers: true,
          includeSignatures: true,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#7c3aed',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['quality', 'inspection', 'compliance'],
      metadata: {
        industry: 'construction',
        regulatory: ['ISO9001'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Material Report Template
  private createMaterialReportTemplate(): DocumentTemplate {
    return {
      id: 'material_report_v1',
      name: 'Material Usage Report',
      category: 'material_report',
      description: 'Material consumption, inventory, and procurement report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'material_usage',
            title: 'Material Usage Summary',
            order: 1,
            type: 'chart',
            dataSource: 'materials.usage',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'inventory_status',
            title: 'Current Inventory Status',
            order: 2,
            type: 'table',
            dataSource: 'materials.inventory',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'procurement_schedule',
            title: 'Upcoming Procurements',
            order: 3,
            type: 'table',
            dataSource: 'materials.procurement',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Material Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Material Management System',
          includePageNumbers: true,
          includeSignatures: false,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#f59e0b',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['materials', 'inventory', 'procurement'],
      metadata: {
        industry: 'construction',
        regulatory: [],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Compliance Report Template
  private createComplianceReportTemplate(): DocumentTemplate {
    return {
      id: 'compliance_report_v1',
      name: 'Regulatory Compliance Report',
      category: 'compliance_report',
      description: 'Regulatory compliance status and audit findings',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'compliance_overview',
            title: 'Compliance Status Overview',
            order: 1,
            type: 'chart',
            dataSource: 'compliance.status',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'regulatory_requirements',
            title: 'Regulatory Requirements',
            order: 2,
            type: 'table',
            dataSource: 'compliance.requirements',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'audit_findings',
            title: 'Audit Findings',
            order: 3,
            type: 'table',
            dataSource: 'compliance.findings',
            isRequired: false,
            conditions: [
              {
                field: 'compliance.findings.count',
                operator: 'greater_than',
                value: 0,
                action: 'show',
              },
            ],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Compliance Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Regulatory Compliance Management',
          includePageNumbers: true,
          includeSignatures: true,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#0891b2',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['compliance', 'regulatory', 'audit'],
      metadata: {
        industry: 'construction',
        regulatory: ['EPA', 'OSHA', 'ADA'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Contract Document Template
  private createContractDocumentTemplate(): DocumentTemplate {
    return {
      id: 'contract_document_v1',
      name: 'Construction Contract',
      category: 'contract_document',
      description: 'Standard construction contract template',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'parties',
            title: 'Contracting Parties',
            order: 1,
            type: 'dynamic',
            dataSource: 'contract.parties',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'scope_of_work',
            title: 'Scope of Work',
            order: 2,
            type: 'dynamic',
            dataSource: 'contract.scope',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'terms_conditions',
            title: 'Terms and Conditions',
            order: 3,
            type: 'text',
            content: 'Standard terms and conditions...',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'payment_schedule',
            title: 'Payment Schedule',
            order: 4,
            type: 'table',
            dataSource: 'contract.payments',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'signatures',
            title: 'Signatures',
            order: 5,
            type: 'signature',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'center' },
          },
        ],
        header: {
          content: 'CONSTRUCTION CONTRACT',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: false,
          formatting: { alignment: 'center', fontSize: 20, fontWeight: 'bold' },
        },
        footer: {
          content: 'Legally Binding Document',
          includePageNumbers: true,
          includeSignatures: false,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Times New Roman, serif',
          fontSize: 12,
          lineHeight: 1.6,
          margins: { top: 30, right: 30, bottom: 30, left: 30 },
          colors: {
            primary: '#1f2937',
            secondary: '#374151',
            text: '#111827',
            background: '#ffffff',
          },
          spacing: { section: 25, paragraph: 12 },
        },
      },
      dataMapping: [],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['contract', 'legal', 'agreement'],
      metadata: {
        industry: 'construction',
        regulatory: ['Commercial Law'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Create Inspection Report Template
  private createInspectionReportTemplate(): DocumentTemplate {
    return {
      id: 'inspection_report_v1',
      name: 'Site Inspection Report',
      category: 'inspection_report',
      description: 'Detailed site inspection and findings report',
      version: '1.0.0',
      structure: {
        sections: [
          {
            id: 'inspection_details',
            title: 'Inspection Details',
            order: 1,
            type: 'dynamic',
            dataSource: 'inspection.details',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'findings',
            title: 'Inspection Findings',
            order: 2,
            type: 'table',
            dataSource: 'inspection.findings',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
          {
            id: 'photos',
            title: 'Photographic Evidence',
            order: 3,
            type: 'image',
            dataSource: 'inspection.photos',
            isRequired: false,
            conditions: [],
            formatting: { alignment: 'center' },
          },
          {
            id: 'recommendations',
            title: 'Recommendations',
            order: 4,
            type: 'dynamic',
            dataSource: 'inspection.recommendations',
            isRequired: true,
            conditions: [],
            formatting: { alignment: 'left' },
          },
        ],
        header: {
          content: '{{project.name}} - Inspection Report',
          includeDate: true,
          includeLogo: true,
          includeProjectInfo: true,
          formatting: { alignment: 'center', fontSize: 18, fontWeight: 'bold' },
        },
        footer: {
          content: 'Professional Inspection Services',
          includePageNumbers: true,
          includeSignatures: true,
          formatting: { alignment: 'center', fontSize: 10 },
        },
        styling: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.5,
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
          colors: {
            primary: '#8b5cf6',
            secondary: '#64748b',
            text: '#1f2937',
            background: '#ffffff',
          },
          spacing: { section: 20, paragraph: 10 },
        },
      },
      dataMapping: [],
      outputFormat: 'pdf',
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: ['inspection', 'site', 'findings'],
      metadata: {
        industry: 'construction',
        regulatory: ['Building Codes'],
        language: 'en',
        region: 'global',
        usageCount: 0,
        rating: 5,
      },
    };
  }

  // Compile template for faster generation
  private compileTemplate(template: DocumentTemplate): CompiledTemplate {
    const compiled: CompiledTemplate = {
      id: template.id,
      compiledAt: new Date(),
      renderers: new Map(),
      dataSources: new Map(),
      validationRules: new Map(),
    };

    // Compile each section
    template.structure.sections.forEach((section) => {
      compiled.renderers.set(section.id, this.compileSection(section));
    });

    // Compile data mappings
    template.dataMapping.forEach((mapping) => {
      compiled.dataSources.set(mapping.templateFieldId, mapping);
      if (mapping.validation) {
        compiled.validationRules.set(mapping.templateFieldId, mapping.validation);
      }
    });

    this.compiledTemplates.set(template.id, compiled);
    return compiled;
  }

  // Compile individual section
  private compileSection(section: any): SectionRenderer {
    return {
      render: (data: any) => {
        switch (section.type) {
          case 'text':
            return this.renderText(section.content || '', data);
          case 'dynamic':
            return this.renderDynamic(section.dataSource, data);
          case 'table':
            return this.renderTable(section.dataSource, data);
          case 'chart':
            return this.renderChart(section.dataSource, data);
          case 'image':
            return this.renderImage(section.dataSource, data);
          case 'signature':
            return this.renderSignature(data);
          default:
            return '';
        }
      },
    };
  }

  // Render text content with variable substitution
  private renderText(content: string, data: any): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return this.getNestedValue(data, path) || match;
    });
  }

  // Render dynamic content
  private renderDynamic(dataSource: string, data: any): string {
    const sourceData = this.getNestedValue(data, dataSource);
    if (!sourceData) return '';

    if (typeof sourceData === 'object') {
      return JSON.stringify(sourceData, null, 2);
    }
    return String(sourceData);
  }

  // Render table
  private renderTable(dataSource: string, data: any): string {
    const tableData = this.getNestedValue(data, dataSource);
    if (!Array.isArray(tableData)) return '';

    let html = '<table border="1" style="border-collapse: collapse; width: 100%;">\n';

    if (tableData.length > 0) {
      // Generate headers
      const headers = Object.keys(tableData[0]);
      html += '<tr>';
      headers.forEach((header) => {
        html += `<th style="padding: 8px; background-color: #f3f4f6;">${header}</th>`;
      });
      html += '</tr>\n';

      // Generate rows
      tableData.forEach((row) => {
        html += '<tr>';
        headers.forEach((header) => {
          html += `<td style="padding: 8px;">${row[header] || ''}</td>`;
        });
        html += '</tr>\n';
      });
    }

    html += '</table>';
    return html;
  }

  // Render chart (placeholder)
  private renderChart(dataSource: string, data: any): string {
    const chartData = this.getNestedValue(data, dataSource);
    // In production, generate actual chart image or SVG
    return `<div style="border: 1px solid #ccc; padding: 20px; text-align: center; background-color: #f9f9f9;">
            <p>Chart: ${dataSource}</p>
            <p>Data: ${JSON.stringify(chartData)}</p>
        </div>`;
  }

  // Render image
  private renderImage(dataSource: string, data: any): string {
    const imageData = this.getNestedValue(data, dataSource);
    if (!imageData) return '';

    if (Array.isArray(imageData)) {
      return imageData
        .map((img) => `<img src="${img}" style="max-width: 100%; margin: 10px 0;" />`)
        .join('\n');
    }
    return `<img src="${imageData}" style="max-width: 100%; margin: 10px 0;" />`;
  }

  // Render signature placeholder
  private renderSignature(_data: any): string {
    return `<div style="margin-top: 40px;">
            <div style="display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px;"></div>
                    <p>Project Manager</p>
                    <p>Date: ___________</p>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px;"></div>
                    <p>Client Representative</p>
                    <p>Date: ___________</p>
                </div>
            </div>
        </div>`;
  }

  // Get nested value from object using dot notation
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Generate document from template
  async generateDocument(
    templateId: string,
    data: any,
    options?: GenerationOptions
  ): Promise<GeneratedDocument> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const compiled = this.compiledTemplates.get(templateId);
    if (!compiled) {
      throw new Error(`Compiled template not found: ${templateId}`);
    }

    // Validate data
    await this.validateData(compiled, data);

    // Generate content
    const content = await this.generateContent(template, compiled, data);

    // Apply post-processing
    const processedContent = await this.postProcessContent(content, template, options);

    const result: GeneratedDocument = {
      id: this.generateId(),
      templateId,
      templateVersion: template.version,
      generatedAt: new Date(),
      content: processedContent,
      format: template.outputFormat,
      metadata: {
        dataSnapshot: data,
        generationOptions: options || {},
        templateMetadata: template.metadata,
      },
    };

    // Update template usage statistics
    template.metadata.usageCount++;
    template.metadata.lastUsed = new Date();

    return result;
  }

  // Validate data against template requirements
  private async validateData(compiled: CompiledTemplate, data: any): Promise<void> {
    const errors: string[] = [];

    for (const [fieldId, rules] of compiled.validationRules) {
      const fieldValue = this.getNestedValue(data, fieldId);

      for (const rule of rules) {
        const isValid = await this.validateField(fieldValue, rule);
        if (!isValid) {
          errors.push(`${fieldId}: ${rule.errorMessage}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  // Validate individual field
  private async validateField(value: any, rule: any): Promise<boolean> {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
      case 'type':
        return typeof value === rule.parameters.type;
      case 'range':
        return value >= rule.parameters.min && value <= rule.parameters.max;
      case 'pattern':
        return new RegExp(rule.parameters.pattern).test(String(value));
      default:
        return true;
    }
  }

  // Generate content from template
  private async generateContent(
    template: DocumentTemplate,
    compiled: CompiledTemplate,
    data: any
  ): Promise<string> {
    let content = '';

    // Generate header
    if (template.structure.header) {
      content += this.generateHeader(template.structure.header, data);
    }

    // Generate sections
    const sortedSections = template.structure.sections.sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      // Check conditions
      if (!this.checkConditions(section.conditions || [], data)) {
        continue;
      }

      const renderer = compiled.renderers.get(section.id);
      if (renderer) {
        content += `<div class="section" id="${section.id}">`;
        content += `<h2>${section.title}</h2>`;
        content += renderer.render(data);
        content += '</div>\n';
      }
    }

    // Generate footer
    if (template.structure.footer) {
      content += this.generateFooter(template.structure.footer, data);
    }

    return content;
  }

  // Generate header
  private generateHeader(header: any, data: any): string {
    let headerContent = this.renderText(header.content, data);

    if (header.includeDate) {
      headerContent += `<p>Generated on: ${new Date().toLocaleDateString()}</p>`;
    }

    return `<header>${headerContent}</header>\n`;
  }

  // Generate footer
  private generateFooter(footer: any, data: any): string {
    let footerContent = this.renderText(footer.content, data);

    if (footer.includePageNumbers) {
      footerContent += '<div class="page-numbers"></div>';
    }

    return `<footer>${footerContent}</footer>\n`;
  }

  // Check section conditions
  private checkConditions(conditions: any[], data: any): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => {
      const fieldValue = this.getNestedValue(data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'exists':
          return fieldValue !== null && fieldValue !== undefined;
        default:
          return true;
      }
    });
  }

  // Post-process content
  private async postProcessContent(
    content: string,
    template: DocumentTemplate,
    options?: GenerationOptions
  ): Promise<string> {
    let processed = content;

    // Apply styling
    processed = this.applyStyleSheet(processed, template.structure.styling);

    // Apply custom transformations
    if (options?.customTransformations) {
      for (const transformation of options.customTransformations) {
        processed = await this.applyTransformation(processed, transformation);
      }
    }

    return processed;
  }

  // Apply stylesheet
  private applyStyleSheet(content: string, styling: any): string {
    const css = `
            <style>
                body {
                    font-family: ${styling.fontFamily};
                    font-size: ${styling.fontSize}px;
                    line-height: ${styling.lineHeight};
                    color: ${styling.colors.text};
                    background-color: ${styling.colors.background};
                    margin: ${styling.margins.top}px ${styling.margins.right}px ${styling.margins.bottom}px ${styling.margins.left}px;
                }
                .section {
                    margin-bottom: ${styling.spacing.section}px;
                }
                p {
                    margin-bottom: ${styling.spacing.paragraph}px;
                }
                h1, h2, h3 {
                    color: ${styling.colors.primary};
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid ${styling.colors.secondary};
                    padding: 8px;
                }
                th {
                    background-color: ${styling.colors.primary};
                    color: white;
                }
            </style>
        `;

    return `<!DOCTYPE html><html><head>${css}</head><body>${content}</body></html>`;
  }

  // Apply custom transformation
  private async applyTransformation(content: string, _transformation: any): Promise<string> {
    // Apply custom transformations as needed
    return content;
  }

  // Generate unique ID
  private generateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get template by ID
  getTemplate(id: string): DocumentTemplate | undefined {
    return this.templates.get(id);
  }

  // Create new template
  async createTemplate(
    template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DocumentTemplate> {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    console.log('Template created:', newTemplate.id);
    return newTemplate;
  }

  // Update existing template
  async updateTemplate(
    id: string,
    updates: Partial<DocumentTemplate>
  ): Promise<DocumentTemplate | undefined> {
    const template = this.templates.get(id);
    if (!template) {
      return undefined;
    }

    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(id, updatedTemplate);
    console.log('Template updated:', id);
    return updatedTemplate;
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    const success = this.templates.delete(id);
    if (success) {
      console.log('Template deleted:', id);
    }
    return success;
  }

  // List all templates
  listTemplates(category?: TemplateCategory): DocumentTemplate[] {
    const allTemplates = Array.from(this.templates.values());
    return category ? allTemplates.filter((t) => t.category === category) : allTemplates;
  }

  // Search templates
  searchTemplates(query: string): DocumentTemplate[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Auto-generate documents based on schedule
  async autoGenerate(settings: AutoGenerationSettings, data: any): Promise<GeneratedDocument[]> {
    const results: GeneratedDocument[] = [];

    // Check triggers
    for (const trigger of settings.triggers) {
      if (await this.checkTrigger(trigger, data)) {
        // Generate documents
        for (const templateId of settings.dataSources) {
          try {
            const document = await this.generateDocument(templateId, data);
            results.push(document);

            // Distribute if needed
            if (settings.distribution) {
              await this.distributeDocument(document, settings.distribution);
            }
          } catch (error) {
            console.error(`Failed to generate document from template ${templateId}:`, error);
          }
        }
      }
    }

    return results;
  }

  // Check if trigger condition is met
  private async checkTrigger(trigger: any, data: any): Promise<boolean> {
    switch (trigger.type) {
      case 'data_threshold':
        const value = this.getNestedValue(data, trigger.parameters.field);
        return value >= trigger.parameters.threshold;
      case 'time_based':
        // Check time-based conditions
        return true; // Simplified
      case 'event_based':
        // Check event-based conditions
        return true; // Simplified
      default:
        return false;
    }
  }

  // Distribute generated document
  private async distributeDocument(
    document: GeneratedDocument,
    distribution: DistributionSettings
  ): Promise<void> {
    // Implement distribution logic (email, portal, API, etc.)
    console.log(
      `Distributing document ${document.id} to ${distribution.recipients.length} recipients`
    );
  }
}

// Helper interfaces
interface CompiledTemplate {
  id: string;
  compiledAt: Date;
  renderers: Map<string, SectionRenderer>;
  dataSources: Map<string, any>;
  validationRules: Map<string, any[]>;
}

interface SectionRenderer {
  render: (data: any) => string;
}

interface GeneratedDocument {
  id: string;
  templateId: string;
  templateVersion: string;
  generatedAt: Date;
  content: string;
  format: OutputFormat;
  metadata: {
    dataSnapshot: any;
    generationOptions: any;
    templateMetadata: TemplateMetadata;
  };
}

interface GenerationOptions {
  customTransformations?: any[];
  outputSettings?: any;
  distributionOverride?: DistributionSettings;
}

// Export singleton instance
export const smartTemplatesEngine = new SmartTemplatesEngine();
