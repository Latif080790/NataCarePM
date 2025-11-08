/**
 * Resource Allocation View
 *
 * Manages resource allocation for tasks with visualization
 * Shows resource utilization, conflicts, and optimization opportunities
 *
 * @component ResourceAllocationView
 */

import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { ResourceAllocation } from '@/types/ai-resource.types';
import { enhancedTaskService } from '@/api/taskService.enhanced';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import {
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  Download,
  RefreshCw,
} from 'lucide-react';

interface ResourceAllocationViewProps {
  projectId: string;
  tasks: Task[];
  onTaskSelect?: (taskId: string) => void;
}

interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  allocatedHours: number;
  availableHours: number;
  utilizationRate: number;
  conflicts: number;
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({
  projectId,
  tasks,
  onTaskSelect,
}) => {
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [utilization, setUtilization] = useState<ResourceUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadResourceAllocations();
  }, [projectId]);

  const loadResourceAllocations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all resource allocations for the project
      const allAllocations: ResourceAllocation[] = [];
      
      for (const task of tasks) {
        try {
          const response = await enhancedTaskService.getTaskResourceAllocations(
            projectId,
            task.id
          );
          if (response.success && response.data) {
            allAllocations.push(...response.data);
          }
        } catch (err) {
          console.warn(`Failed to load allocations for task ${task.id}:`, err);
        }
      }

      setAllocations(allAllocations);
      calculateUtilization(allAllocations);
    } catch (err) {
      console.error('Error loading resource allocations:', err);
      setError('Failed to load resource allocations');
    } finally {
      setLoading(false);
    }
  };

  const calculateUtilization = (allocations: ResourceAllocation[]) => {
    // Group allocations by resource
    const resourceMap = new Map<string, ResourceAllocation[]>();
    
    allocations.forEach(allocation => {
      if (!resourceMap.has(allocation.resourceId)) {
        resourceMap.set(allocation.resourceId, []);
      }
      resourceMap.get(allocation.resourceId)!.push(allocation);
    });

    // Calculate utilization for each resource
    const utilizationData: ResourceUtilization[] = [];
    
    resourceMap.forEach((resourceAllocations, resourceId) => {
      // Calculate total allocated hours
      const allocatedHours = resourceAllocations.reduce((total, allocation) => {
        const start = new Date(allocation.startDate);
        const end = new Date(allocation.endDate);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + (hours * allocation.allocationPercentage / 100);
      }, 0);

      // For demo purposes, assume 40 hours/week availability
      const availableHours = 40 * 4; // 4 weeks
      const utilizationRate = availableHours > 0 ? (allocatedHours / availableHours) * 100 : 0;
      
      // Count conflicts (over allocation)
      const conflicts = utilizationRate > 100 ? Math.ceil((utilizationRate - 100) / 10) : 0;

      utilizationData.push({
        resourceId,
        resourceName: `Resource ${resourceId.substring(0, 8)}`, // Placeholder name
        allocatedHours,
        availableHours,
        utilizationRate,
        conflicts,
      });
    });

    setUtilization(utilizationData);
  };

  const handleRefresh = () => {
    loadResourceAllocations();
  };

  const handleExport = () => {
    const csvContent = [
      ['Resource ID', 'Resource Name', 'Allocated Hours', 'Available Hours', 'Utilization %', 'Conflicts'],
      ...utilization.map(u => [
        u.resourceId,
        u.resourceName,
        u.allocatedHours.toFixed(2),
        u.availableHours.toFixed(2),
        u.utilizationRate.toFixed(2),
        u.conflicts.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resource-utilization-${projectId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return 'text-red-600 bg-red-50';
    if (rate > 80) return 'text-orange-600 bg-orange-50';
    if (rate > 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (allocation.taskId && tasks.find(t => t.id === allocation.taskId)?.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesResource = !filterResource || allocation.resourceId === filterResource;
    
    return matchesSearch && matchesResource;
  });

  const filteredUtilization = utilization.filter(u => 
    u.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resource allocations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Allocations</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Resources</p>
              <p className="text-2xl font-bold">{utilization.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Allocations</p>
              <p className="text-2xl font-bold">{allocations.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Over-allocated</p>
              <p className="text-2xl font-bold text-red-600">
                {utilization.filter(u => u.utilizationRate > 100).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Utilization</p>
              <p className="text-2xl font-bold">
                {utilization.length > 0 
                  ? `${(utilization.reduce((sum, u) => sum + u.utilizationRate, 0) / utilization.length).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Resource Allocation</h3>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {allocations.length} allocations
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resources or tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Resources</option>
              {utilization.map(u => (
                <option key={u.resourceId} value={u.resourceId}>
                  {u.resourceName}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Allocate Resource
            </Button>
          </div>
        </div>
      </Card>

      {/* Resource Utilization Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
        <div className="space-y-3">
          {filteredUtilization.map((resource) => (
            <div key={resource.resourceId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{resource.resourceName}</h4>
                  <p className="text-sm text-gray-600">{resource.resourceId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {resource.allocatedHours.toFixed(1)}h / {resource.availableHours}h
                  </p>
                  <p className="text-sm text-gray-600">
                    {resource.utilizationRate.toFixed(1)}% utilization
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full ${
                    resource.utilizationRate > 100
                      ? 'bg-red-600'
                      : resource.utilizationRate > 80
                      ? 'bg-orange-500'
                      : resource.utilizationRate > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(resource.utilizationRate, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">0h</span>
                <span className="text-gray-600">{resource.availableHours}h</span>
              </div>
              
              {resource.conflicts > 0 && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {resource.conflicts} conflict{resource.conflicts > 1 ? 's' : ''} detected
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {filteredUtilization.length === 0 && (
            <p className="text-gray-500 text-center py-4">No resource utilization data available</p>
          )}
        </div>
      </Card>

      {/* Resource Allocations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAllocations.map((allocation) => {
                const task = tasks.find(t => t.id === allocation.taskId);
                const resourceUtil = utilization.find(u => u.resourceId === allocation.resourceId);
                
                const startDate = new Date(allocation.startDate);
                const endDate = new Date(allocation.endDate);
                const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={allocation.allocationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {resourceUtil?.resourceName || allocation.resourceId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allocation.resourceType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task?.title || allocation.taskId || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {startDate.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {durationDays} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {allocation.allocationPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        allocation.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                        allocation.status === 'allocated' ? 'bg-blue-100 text-blue-800' :
                        allocation.status === 'in_use' ? 'bg-green-100 text-green-800' :
                        allocation.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {allocation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {resourceUtil && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUtilizationColor(resourceUtil.utilizationRate)}`}>
                          {resourceUtil.utilizationRate.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTaskSelect?.(allocation.taskId || '')}
                        disabled={!allocation.taskId}
                      >
                        View Task
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredAllocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No resource allocations found</p>
              <p className="text-sm mt-1">Create your first resource allocation to get started</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Allocate Resource
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      {utilization.filter(u => u.utilizationRate > 100).length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Resource Conflicts Detected
          </h3>
          <div className="space-y-2">
            <p className="text-red-800">
              <strong>{utilization.filter(u => u.utilizationRate > 100).length} resources</strong> are over-allocated.
            </p>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              <li>Review and adjust resource allocations to prevent burnout</li>
              <li>Consider adding additional resources to critical tasks</li>
              <li>Reschedule non-critical tasks to balance workload</li>
              <li>Prioritize tasks based on project critical path</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Create Allocation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Allocate Resource</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource
                </label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Select a resource</option>
                  {utilization.map(u => (
                    <option key={u.resourceId} value={u.resourceId}>
                      {u.resourceName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task
                </label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Select a task</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input type="date" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input type="date" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Percentage
                </label>
                <Input type="number" min="0" max="100" defaultValue="100" />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement allocation creation
                    setShowCreateModal(false);
                  }}
                >
                  Allocate
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResourceAllocationView;