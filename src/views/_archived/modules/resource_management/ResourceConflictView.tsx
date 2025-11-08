/**
 * Resource Conflict Detection View
 *
 * Comprehensive resource conflict management interface with:
 * - Conflict visualization
 * - Resolution suggestions
 * - Severity filtering
 * - Resource utilization analytics
 *
 * @component ResourceConflictView
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ResourceConflict, Resource } from '@/types/resource.types';
import { resourceConflictService } from '@/api/resourceConflictService';
import { resourceService } from '@/api/resourceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select } from '@/components/FormControls';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Wrench,
  Calendar,
  Filter,
  RefreshCw,
  Target,
  BarChart3,
} from 'lucide-react';
import { formatDate } from '@/constants';

interface ResourceConflictViewProps {
  projectId: string;
}

export const ResourceConflictView: React.FC<ResourceConflictViewProps> = ({ projectId }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'all' | ResourceConflict['severity']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceConflict['conflictType']>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [resolutionSuggestions, setResolutionSuggestions] = useState<any[]>([]);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);

  // Load data
  useEffect(() => {
    loadConflictData();
  }, [projectId]);

  const loadConflictData = async () => {
    if (!projectId || !currentUser) return;

    try {
      setLoading(true);
      
      // Detect project conflicts
      const conflictResponse = await resourceConflictService.detectProjectConflicts(projectId);
      
      if (conflictResponse.success && conflictResponse.data) {
        setConflicts(conflictResponse.data.conflicts);
        setUtilizationData(conflictResponse.data.resourceUtilization);
      }

      // Load resources
      const resourcesResponse = await resourceService.getResources();
      if (resourcesResponse) {
        setResources(resourcesResponse);
      }

      // Generate resolution suggestions
      if (conflictResponse.success && conflictResponse.data) {
        const suggestionsResponse = await resourceConflictService.generateResolutionSuggestions(
          conflictResponse.data.conflicts
        );
        
        if (suggestionsResponse.success) {
          setResolutionSuggestions(suggestionsResponse.data || []);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error loading conflict data:', err);
      setError('Failed to load conflict data');
      addToast('Failed to load conflict data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts.filter(conflict => {
      const matchesSeverity = severityFilter === 'all' || conflict.severity === severityFilter;
      const matchesType = typeFilter === 'all' || conflict.conflictType === typeFilter;
      const matchesResource = resourceFilter === 'all' || conflict.resourceId === resourceFilter;
      
      return matchesSeverity && matchesType && matchesResource;
    });
  }, [conflicts, severityFilter, typeFilter, resourceFilter]);

  // Get severity color
  const getSeverityColor = (severity: ResourceConflict['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get conflict type icon
  const getConflictTypeIcon = (type: ResourceConflict['conflictType']) => {
    switch (type) {
      case 'overallocation':
        return <Users className="w-4 h-4" />;
      case 'unavailability':
        return <Clock className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Get conflict type label
  const getConflictTypeLabel = (type: ResourceConflict['conflictType']) => {
    switch (type) {
      case 'overallocation':
        return 'Overallocation';
      case 'unavailability':
        return 'Unavailability';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Other';
    }
  };

  // Handle resolve conflict
  const handleResolveConflict = async (conflictId: string) => {
    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    try {
      // Find the suggestion for this conflict
      const suggestion = resolutionSuggestions.find(s => s.conflictId === conflictId);
      if (!suggestion) {
        addToast('No resolution suggestion found', 'error');
        return;
      }

      const response = await resourceConflictService.resolveConflict(
        conflictId,
        suggestion,
        currentUser.id
      );

      if (response.success) {
        addToast('Conflict resolved successfully', 'success');
        loadConflictData(); // Refresh data
      } else {
        addToast(response.error?.message || 'Failed to resolve conflict', 'error');
      }
    } catch (err) {
      console.error('Error resolving conflict:', err);
      addToast('Failed to resolve conflict', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Detecting resource conflicts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Conflict Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadConflictData}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Conflict Detection</h1>
          <p className="text-gray-600">Identify and resolve resource allocation conflicts</p>
        </div>
        <Button onClick={loadConflictData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Conflicts
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conflicts</p>
              <p className="text-2xl font-bold">{conflicts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {conflicts.filter(c => c.severity === 'critical').length}
              </p>
            </div>
            <Target className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">
                {conflicts.filter(c => c.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overallocation</p>
              <p className="text-2xl font-bold text-purple-600">
                {conflicts.filter(c => c.conflictType === 'overallocation').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resources</p>
              <p className="text-2xl font-bold">{resources.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="w-full sm:w-auto"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="overallocation">Overallocation</option>
            <option value="unavailability">Unavailability</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          
          <Select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full sm:w-auto"
          >
            <option value="all">All Resources</option>
            {resources.map(resource => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Resource Utilization Chart */}
      {utilizationData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Resource Utilization</h2>
          <div className="space-y-3">
            {utilizationData.map((util, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{util.resourceName}</h3>
                    <p className="text-sm text-gray-600">{util.resourceId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {util.utilizationRate.toFixed(1)}% utilization
                    </p>
                    <p className="text-sm text-gray-600">
                      {util.conflictsCount} conflict{util.conflictsCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${
                      util.utilizationRate > 100
                        ? 'bg-red-600'
                        : util.utilizationRate > 80
                        ? 'bg-orange-500'
                        : util.utilizationRate > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(util.utilizationRate, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">0%</span>
                  <span className="text-gray-600">100%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conflicts List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Conflicts</h3>
            <p className="text-gray-500">All resources are properly allocated</p>
          </Card>
        ) : (
          filteredConflicts.map((conflict, index) => (
            <Card key={index} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-lg ${getSeverityColor(conflict.severity)}`}>
                        {getConflictTypeIcon(conflict.conflictType)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getConflictTypeLabel(conflict.conflictType)} Conflict
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getSeverityColor(conflict.severity)}`}>
                          {conflict.severity}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {conflict.suggestedResolution || 'No resolution suggestion available'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{conflict.resourceName}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(conflict.conflictPeriod.start.toString())} -{' '}
                            {formatDate(conflict.conflictPeriod.end.toString())}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>
                            {conflict.allocations.length} allocation
                            {conflict.allocations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      {/* Allocations */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Affected Allocations:</p>
                        <div className="flex flex-wrap gap-2">
                          {conflict.allocations.slice(0, 3).map((alloc, allocIndex) => (
                            <span
                              key={allocIndex}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                            >
                              {alloc.projectName} ({formatDate(alloc.startDate.toString())})
                            </span>
                          ))}
                          {conflict.allocations.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              +{conflict.allocations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveConflict(`${conflict.resourceId}-${Date.now()}`)}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Resolution Suggestions */}
      {resolutionSuggestions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Resolution Suggestions</h2>
          <div className="space-y-3">
            {resolutionSuggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">
                      {suggestion.suggestedAction}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Priority: {suggestion.priority}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
            {resolutionSuggestions.length > 3 && (
              <div className="text-center text-sm text-gray-500">
                +{resolutionSuggestions.length - 3} more suggestions
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResourceConflictView;