import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Server, 
  Calendar,
  RefreshCw,
  Trash2,
  Eye,
  Merge,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select, Input } from '@/components/FormControls';
import { conflictResolutionService } from '@/api';
import type { DataConflict, ConflictType, ConflictResolutionStrategy } from '@/api/conflictResolutionService';

// Conflict type badge component
const ConflictTypeBadge: React.FC<{ type: ConflictType }> = ({ type }) => {
  const typeStyles = {
    'data_version': 'bg-blue-100 text-blue-800',
    'concurrent_modification': 'bg-purple-100 text-purple-800',
    'schema_mismatch': 'bg-orange-100 text-orange-800',
    'validation_error': 'bg-red-100 text-red-800',
    'integration_error': 'bg-yellow-100 text-yellow-800'
  };

  const typeLabels = {
    'data_version': 'Data Version',
    'concurrent_modification': 'Concurrent Modification',
    'schema_mismatch': 'Schema Mismatch',
    'validation_error': 'Validation Error',
    'integration_error': 'Integration Error'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyles[type]}`}>
      {typeLabels[type] || type}
    </span>
  );
};

// Severity badge component
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const severityStyles = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800'
  };

  const severityLabels = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityStyles[severity as keyof typeof severityStyles]}`}>
      {severityLabels[severity as keyof typeof severityLabels] || severity}
    </span>
  );
};

// Source badge component
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const sourceStyles = {
    'NataCarePM': 'bg-primary/10 text-primary',
    'Microsoft Project': 'bg-blue-100 text-blue-800',
    'Primavera': 'bg-purple-100 text-purple-800',
    'SAP': 'bg-green-100 text-green-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sourceStyles[source as keyof typeof sourceStyles] || 'bg-gray-100 text-gray-800'}`}>
      {source}
    </span>
  );
};

// Conflict resolution view component
const ConflictResolutionView: React.FC = () => {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [filteredConflicts, setFilteredConflicts] = useState<DataConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null);
  const [filterType, setFilterType] = useState<ConflictType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Fetch conflicts and statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, we would fetch actual conflicts
        // For now, we'll simulate some conflicts
        const simulatedConflicts: DataConflict[] = [
          {
            id: 'conflict-1',
            type: 'concurrent_modification',
            entityType: 'task',
            entityId: 'task-123',
            localVersion: {
              data: { name: 'Foundation Work', status: 'in_progress', progress: 75 },
              timestamp: new Date(Date.now() - 3600000), // 1 hour ago
              source: 'NataCarePM'
            },
            remoteVersion: {
              data: { name: 'Foundation Work', status: 'completed', progress: 100 },
              timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
              source: 'Microsoft Project'
            },
            resolutionStrategy: 'timestamp_wins',
            status: 'detected',
            severity: 'high',
            createdAt: new Date(Date.now() - 7200000), // 2 hours ago
            metadata: {
              detectionMethod: 'automatic',
              affectedFields: ['status', 'progress']
            }
          },
          {
            id: 'conflict-2',
            type: 'data_version',
            entityType: 'project',
            entityId: 'project-456',
            localVersion: {
              data: { name: 'Office Building', budget: 5000000, startDate: '2024-01-01' },
              timestamp: new Date(Date.now() - 86400000), // 1 day ago
              source: 'NataCarePM'
            },
            remoteVersion: {
              data: { name: 'Office Building', budget: 5200000, startDate: '2024-01-01' },
              timestamp: new Date(Date.now() - 43200000), // 12 hours ago
              source: 'Primavera'
            },
            resolutionStrategy: 'source_priority',
            status: 'detected',
            severity: 'medium',
            createdAt: new Date(Date.now() - 90000000), // 1 day 1 hour ago
            metadata: {
              detectionMethod: 'automatic',
              affectedFields: ['budget']
            }
          }
        ];

        setConflicts(simulatedConflicts);
        setFilteredConflicts(simulatedConflicts);

        // Fetch statistics
        const statsResult = await conflictResolutionService.getConflictStatistics();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      } catch (err) {
        setError('Failed to fetch conflict data');
        console.error('Error fetching conflict data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...conflicts];

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(conflict => conflict.type === filterType);
    }

    // Apply severity filter
    if (filterSeverity !== 'all') {
      result = result.filter(conflict => conflict.severity === filterSeverity);
    }

    // Apply source filter
    if (filterSource !== 'all') {
      result = result.filter(conflict => 
        conflict.localVersion.source === filterSource || 
        conflict.remoteVersion.source === filterSource
      );
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(conflict => 
        conflict.entityId.toLowerCase().includes(term) ||
        conflict.entityType.toLowerCase().includes(term) ||
        conflict.localVersion.source.toLowerCase().includes(term) ||
        conflict.remoteVersion.source.toLowerCase().includes(term)
      );
    }

    setFilteredConflicts(result);
  }, [conflicts, filterType, filterSeverity, filterSource, searchTerm]);

  // Handle conflict resolution
  const handleResolveConflict = async (conflictId: string, strategy: ConflictResolutionStrategy) => {
    try {
      const result = await conflictResolutionService.resolveConflict(conflictId, strategy);
      
      if (result.success) {
        // Update local state
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        setFilteredConflicts(prev => prev.filter(c => c.id !== conflictId));
        
        if (selectedConflict?.id === conflictId) {
          setSelectedConflict(null);
        }
        
        // Show success message
        alert('Conflict resolved successfully');
      } else {
        alert('Failed to resolve conflict: ' + result.error?.message);
      }
    } catch (err) {
      console.error('Error resolving conflict:', err);
      alert('Failed to resolve conflict');
    }
  };

  // Handle auto-resolution
  const handleAutoResolve = async () => {
    try {
      const result = await conflictResolutionService.autoResolveConflicts();
      
      if (result.success) {
        alert(`${result.data} conflicts auto-resolved`);
        // Refresh data
        window.location.reload();
      } else {
        alert('Failed to auto-resolve conflicts: ' + result.error?.message);
      }
    } catch (err) {
      console.error('Error auto-resolving conflicts:', err);
      alert('Failed to auto-resolve conflicts');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-500">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conflict Resolution</h1>
          <p className="text-gray-600 mt-1">
            Manage and resolve data conflicts between systems
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAutoResolve} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto Resolve
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Conflicts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalConflicts}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.resolvedConflicts}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingConflicts}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Auto Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.autoResolved}</p>
                </div>
                <div className="p-3 bg-info/10 rounded-full">
                  <RefreshCw className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Manual</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.manuallyResolved}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search conflicts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as ConflictType | 'all')}>
                <option value="all">All Types</option>
                <option value="data_version">Data Version</option>
                <option value="concurrent_modification">Concurrent Modification</option>
                <option value="schema_mismatch">Schema Mismatch</option>
                <option value="validation_error">Validation Error</option>
                <option value="integration_error">Integration Error</option>
              </Select>
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <Select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <option value="all">All Sources</option>
                <option value="NataCarePM">NataCarePM</option>
                <option value="Microsoft Project">Microsoft Project</option>
                <option value="Primavera">Primavera</option>
                <option value="SAP">SAP</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict List */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Conflicts</CardTitle>
          <CardDescription>
            {filteredConflicts.length} conflict{filteredConflicts.length !== 1 ? 's' : ''} detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredConflicts.length > 0 ? (
            <div className="space-y-4">
              {filteredConflicts.map((conflict) => (
                <div 
                  key={conflict.id} 
                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConflict?.id === conflict.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <ConflictTypeBadge type={conflict.type} />
                        <SeverityBadge severity={conflict.severity} />
                        <span className="text-sm text-gray-500">
                          {conflict.entityType} • {conflict.entityId}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(conflict.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Server className="w-4 h-4" />
                          <span>{conflict.localVersion.source} ↔ {conflict.remoteVersion.source}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">
                          Conflict in {conflict.entityType} {conflict.entityId}
                        </p>
                        {conflict.metadata.affectedFields && (
                          <p className="text-gray-600">
                            Affected fields: {conflict.metadata.affectedFields.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveConflict(conflict.id, 'timestamp_wins');
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Auto Resolve
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConflict(conflict);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Conflicts Found</h3>
              <p className="text-gray-500">
                All data is synchronized between systems.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflict Detail View */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Conflict Details</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedConflict(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Local Version */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Local Version
                      <SourceBadge source={selectedConflict.localVersion.source} />
                    </CardTitle>
                    <CardDescription>
                      Last modified: {new Date(selectedConflict.localVersion.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-64">
                        {JSON.stringify(selectedConflict.localVersion.data, null, 2)}
                      </pre>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleResolveConflict(selectedConflict.id, 'user_decision')}
                          >
                            <User className="w-4 h-4 mr-1" />
                            Use Local Version
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // In a real implementation, this would open a merge editor
                              alert('Merge functionality would be implemented here');
                            }}
                          >
                            <Merge className="w-4 h-4 mr-1" />
                            Merge Versions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Remote Version */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Remote Version
                      <SourceBadge source={selectedConflict.remoteVersion.source} />
                    </CardTitle>
                    <CardDescription>
                      Last modified: {new Date(selectedConflict.remoteVersion.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-64">
                        {JSON.stringify(selectedConflict.remoteVersion.data, null, 2)}
                      </pre>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleResolveConflict(selectedConflict.id, 'user_decision')}
                          >
                            <Server className="w-4 h-4 mr-1" />
                            Use Remote Version
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // In a real implementation, this would open a merge editor
                              alert('Merge functionality would be implemented here');
                            }}
                          >
                            <Merge className="w-4 h-4 mr-1" />
                            Merge Versions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Conflict Metadata */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Conflict Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-600">Conflict ID</dt>
                          <dd className="text-sm font-medium text-gray-900">{selectedConflict.id}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Entity Type</dt>
                          <dd className="text-sm font-medium text-gray-900">{selectedConflict.entityType}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Entity ID</dt>
                          <dd className="text-sm font-medium text-gray-900">{selectedConflict.entityId}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Detection Method</dt>
                          <dd className="text-sm font-medium text-gray-900 capitalize">
                            {selectedConflict.metadata.detectionMethod}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-600">Status</dt>
                          <dd className="text-sm font-medium text-gray-900 capitalize">
                            {selectedConflict.status}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Severity</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            <SeverityBadge severity={selectedConflict.severity} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Default Strategy</dt>
                          <dd className="text-sm font-medium text-gray-900 capitalize">
                            {selectedConflict.resolutionStrategy.replace('_', ' ')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-600">Created</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {new Date(selectedConflict.createdAt).toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {selectedConflict.metadata.affectedFields && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Affected Fields</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConflict.metadata.affectedFields.map((field, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <Button 
                variant="outline" 
                onClick={() => setSelectedConflict(null)}
              >
                Close
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to ignore this conflict?')) {
                    // In a real implementation, this would mark the conflict as ignored
                    setConflicts(prev => prev.filter(c => c.id !== selectedConflict.id));
                    setFilteredConflicts(prev => prev.filter(c => c.id !== selectedConflict.id));
                    setSelectedConflict(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ignore Conflict
              </Button>
              <Button 
                onClick={() => handleResolveConflict(selectedConflict.id, 'timestamp_wins')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve with Timestamp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictResolutionView;