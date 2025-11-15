/**
 * Custom Report Builder View
 * NataCarePM - Advanced Reporting System
 * 
 * Interactive UI for building custom reports with drag-and-drop functionality,
 * data source selection, field configuration, and visualization setup
 */

import React, { useState, useEffect } from 'react';
import { enhancedReportingService } from '@/api/enhancedReportingService';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro } from '@/components/DesignSystem';
import { 
  Plus, 
  Trash2, 
  Play, 
  Database, 
  Filter,
  BarChart3,
  Table,
  Download
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'tasks' | 'expenses' | 'resources' | 'workers' | 'rab' | 'dailyReports';
  fields: FieldOption[];
}

interface FieldOption {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
}

interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  source: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

interface ReportVisualization {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table' | 'heatmap' | 'gauge' | 'scatter';
  title: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  options: any;
}

const CustomReportBuilderView: React.FC = React.memo(() => {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [fields, setFields] = useState<ReportField[]>([]);
  const [groupings, setGroupings] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [visualizations, setVisualizations] = useState<ReportVisualization[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize available data sources
  useEffect(() => {
    const sources: DataSource[] = [
      {
        id: 'tasks',
        name: 'Project Tasks',
        type: 'tasks',
        fields: [
          { id: 'name', name: 'taskName', label: 'Task Name', type: 'string' },
          { id: 'status', name: 'taskStatus', label: 'Status', type: 'string' },
          { id: 'startDate', name: 'startDate', label: 'Start Date', type: 'date' },
          { id: 'endDate', name: 'endDate', label: 'End Date', type: 'date' },
          { id: 'progress', name: 'progress', label: 'Progress %', type: 'number' },
          { id: 'assignedTo', name: 'assignedTo', label: 'Assigned To', type: 'string' }
        ]
      },
      {
        id: 'expenses',
        name: 'Project Expenses',
        type: 'expenses',
        fields: [
          { id: 'description', name: 'expenseDescription', label: 'Description', type: 'string' },
          { id: 'amount', name: 'amount', label: 'Amount', type: 'currency' },
          { id: 'date', name: 'expenseDate', label: 'Date', type: 'date' },
          { id: 'category', name: 'category', label: 'Category', type: 'string' },
          { id: 'vendor', name: 'vendor', label: 'Vendor', type: 'string' }
        ]
      },
      {
        id: 'resources',
        name: 'Project Resources',
        type: 'resources',
        fields: [
          { id: 'name', name: 'resourceName', label: 'Resource Name', type: 'string' },
          { id: 'type', name: 'resourceType', label: 'Type', type: 'string' },
          { id: 'quantity', name: 'quantity', label: 'Quantity', type: 'number' },
          { id: 'unit', name: 'unit', label: 'Unit', type: 'string' },
          { id: 'cost', name: 'cost', label: 'Cost', type: 'currency' }
        ]
      },
      {
        id: 'rab',
        name: 'RAB Items',
        type: 'rab',
        fields: [
          { id: 'uraian', name: 'itemDescription', label: 'Description', type: 'string' },
          { id: 'volume', name: 'volume', label: 'Volume', type: 'number' },
          { id: 'satuan', name: 'unit', label: 'Unit', type: 'string' },
          { id: 'hargaSatuan', name: 'unitPrice', label: 'Unit Price', type: 'currency' },
          { id: 'total', name: 'total', label: 'Total', type: 'currency' }
        ]
      }
    ];
    
    setDataSources(sources);
  }, []);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        name: '',
        label: '',
        type: 'string',
        source: ''
      }
    ]);
  };

  const updateField = (index: number, field: keyof ReportField, value: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        field: '',
        operator: 'equals',
        value: '',
        label: ''
      }
    ]);
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addVisualization = () => {
    setVisualizations([
      ...visualizations,
      {
        id: `viz-${Date.now()}`,
        type: 'bar',
        title: '',
        options: {}
      }
    ]);
  };

  const updateVisualization = (index: number, field: keyof ReportVisualization, value: any) => {
    const updatedVisualizations = [...visualizations];
    updatedVisualizations[index] = { ...updatedVisualizations[index], [field]: value };
    setVisualizations(updatedVisualizations);
  };

  const removeVisualization = (index: number) => {
    setVisualizations(visualizations.filter((_, i) => i !== index));
  };

  const toggleGrouping = (fieldId: string) => {
    if (groupings.includes(fieldId)) {
      setGroupings(groupings.filter(id => id !== fieldId));
    } else {
      setGroupings([...groupings, fieldId]);
    }
  };

  const generateReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    if (fields.length === 0) {
      setError('Please add at least one field to the report');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Create report builder configuration
      const builder = {
        name: reportName,
        description: reportDescription,
        dataSources: selectedDataSources,
        fields,
        groupings,
        filters,
        visualizations
      };

      // Generate mock data for demonstration
      const mockData = generateMockData(selectedDataSources);

      // Generate the report
      const result = await enhancedReportingService.generateCustomReport(builder, mockData);
      
      if (result.success && result.data) {
        setGeneratedReport(result.data);
      } else {
        setError(result.error?.message || 'Failed to generate report');
      }
    } catch (err) {
      setError('An error occurred while generating the report');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockData = (sources: string[]): any[] => {
    const data: any[] = [];
    
    // Generate 20 sample records
    for (let i = 0; i < 20; i++) {
      const record: any = {};
      
      sources.forEach(sourceId => {
        const source = dataSources.find(s => s.id === sourceId);
        if (source) {
          source.fields.forEach(field => {
            switch (field.type) {
              case 'string':
                record[field.id] = `${field.label} ${i + 1}`;
                break;
              case 'number':
              case 'currency':
                record[field.id] = Math.floor(Math.random() * 1000) + 1;
                break;
              case 'date':
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                record[field.id] = date.toISOString().split('T')[0];
                break;
              case 'boolean':
                record[field.id] = Math.random() > 0.5;
                break;
            }
          });
        }
      });
      
      data.push(record);
    }
    
    return data;
  };

  const exportReport = (format: 'pdf' | 'excel' | 'html' | 'json') => {
    if (!generatedReport) return;
    
    // In a real implementation, this would call the export service
    alert(`Exporting report as ${format.toUpperCase()}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
          <p className="text-gray-600 mt-1">Create custom reports with your selected data sources and visualizations</p>
        </div>
        <div className="flex gap-2">
          <ButtonPro 
            onClick={generateReport} 
            disabled={isGenerating}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </ButtonPro>
          {generatedReport && (
            <ButtonPro 
              onClick={() => exportReport('pdf')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </ButtonPro>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Info */}
          <CardPro>
            <div className="p-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Report Information
              </h3>
            </div>
            <div className="p-6 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                <InputPro 
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>
            </div>
          </CardPro>

          {/* Data Sources */}
          <CardPro>
            <div className="p-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Sources
              </h3>
            </div>
            <div className="p-6 pt-4 space-y-4">
              <div className="space-y-2">
                {dataSources.map((source) => (
                  <label key={source.id} className="flex items-center">
                    <InputPro 
                      type="checkbox"
                      checked={selectedDataSources.includes(source.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataSources([...selectedDataSources, source.id]);
                        } else {
                          setSelectedDataSources(selectedDataSources.filter(id => id !== source.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardPro>

          {/* Fields Configuration */}
          <CardPro>
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Report Fields
                </h3>
                <ButtonPro onClick={addField} variant="outline" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Field
                </ButtonPro>
              </div>
            </div>
            <div className="p-6 pt-4 space-y-4">
              {fields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No fields added yet</p>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Field {index + 1}</h3>
                      <button 
                        onClick={() => removeField(index)} 
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Field Label</label>
                        <InputPro 
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          placeholder="Enter label"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Data Source</label>
                        <select 
                          value={field.source}
                          onChange={(e) => updateField(index, 'source', e.target.value)}
                        >
                          <option value="">Select field</option>
                          {dataSources
                            .filter(source => selectedDataSources.includes(source.id))
                            .flatMap(source => 
                              source.fields.map(f => (
                                <option key={`${source.id}-${f.id}`} value={`${source.id}.${f.id}`}>
                                  {source.name} - {f.label}
                                </option>
                              ))
                            )}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Aggregation</label>
                        <select 
                          value={field.aggregation || ''}
                          onChange={(e) => updateField(index, 'aggregation', e.target.value || undefined)}
                        >
                          <option value="">None</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Minimum</option>
                          <option value="max">Maximum</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <InputPro 
                            type="checkbox"
                            checked={groupings.includes(field.id)}
                            onChange={() => toggleGrouping(field.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Group By</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardPro>

          {/* Filters */}
          <CardPro>
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
                <ButtonPro onClick={addFilter} variant="outline" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Filter
                </ButtonPro>
              </div>
            </div>
            <div className="p-6 pt-4 space-y-4">
              {filters.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No filters added yet</p>
              ) : (
                filters.map((filter, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Filter {index + 1}</h3>
                      <button 
                        onClick={() => removeFilter(index)} 
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Field</label>
                        <select 
                          value={filter.field}
                          onChange={(e) => updateFilter(index, 'field', e.target.value)}
                        >
                          <option value="">Select field</option>
                          {fields.map((field, i) => (
                            <option key={i} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Operator</label>
                        <select 
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, 'operator', e.target.value as any)}
                        >
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="between">Between</option>
                          <option value="in">In</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                      <InputPro 
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardPro>
        </div>

        {/* Preview and Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visualizations */}
          <CardPro>
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Visualizations
                </h3>
                <ButtonPro onClick={addVisualization} variant="outline" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Visualization
                </ButtonPro>
              </div>
            </div>
            <div className="p-6 pt-4 space-y-4">
              {visualizations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No visualizations added yet</p>
              ) : (
                visualizations.map((viz, index) => (
                  <div key={viz.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Visualization {index + 1}</h3>
                      <button 
                        onClick={() => removeVisualization(index)} 
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                        <InputPro 
                          value={viz.title}
                          onChange={(e) => updateVisualization(index, 'title', e.target.value)}
                          placeholder="Enter title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                        <select 
                          value={viz.type}
                          onChange={(e) => updateVisualization(index, 'type', e.target.value as any)}
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="table">Table</option>
                          <option value="heatmap">Heatmap</option>
                          <option value="gauge">Gauge</option>
                          <option value="scatter">Scatter Plot</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">X-Axis</label>
                        <select 
                          value={viz.xAxis || ''}
                          onChange={(e) => updateVisualization(index, 'xAxis', e.target.value || undefined)}
                        >
                          <option value="">Select field</option>
                          {fields.map((field, i) => (
                            <option key={i} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Y-Axis</label>
                        <select 
                          value={viz.yAxis || ''}
                          onChange={(e) => updateVisualization(index, 'yAxis', e.target.value || undefined)}
                        >
                          <option value="">Select field</option>
                          {fields.map((field, i) => (
                            <option key={i} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardPro>

          {/* Preview */}
          {generatedReport && (
            <CardPro>
              <div className="p-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
              </div>
              <div className="p-6 pt-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">{generatedReport.name}</h3>
                  <p className="text-gray-600 mb-4">{generatedReport.data.description}</p>
                  
                  {generatedReport.data.visualizations && generatedReport.data.visualizations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Visualizations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedReport.data.visualizations.map((viz: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded p-3">
                            <h5 className="font-medium">{viz.title}</h5>
                            <p className="text-sm text-gray-500">Type: {viz.type}</p>
                            <div className="mt-2 h-32 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-500">Visualization Preview</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded p-4">
                    <h4 className="font-semibold mb-2">Sample Data</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            {fields.slice(0, 3).map((field, index) => (
                              <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {generatedReport.data.data.slice(0, 5).map((row: any, rowIndex: number) => (
                            <tr key={rowIndex}>
                              {fields.slice(0, 3).map((field, fieldIndex) => (
                                <td key={fieldIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {row[field.id]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardPro>
          )}
        </div>
      </div>
    </div>
  );
});

CustomReportBuilderView.displayName = 'CustomReportBuilderView';

export default CustomReportBuilderView;


