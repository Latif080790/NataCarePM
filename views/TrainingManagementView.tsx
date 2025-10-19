import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GraduationCap, Plus, Search, Filter, Calendar, Users, CheckCircle, 
  XCircle, Clock, Award, TrendingUp, AlertCircle, FileText, Download 
} from 'lucide-react';
import { useSafety } from '@/contexts/SafetyContext';
import { TrainingForm } from '@/components/safety/TrainingForm';
import type { SafetyTraining, TrainingStatus, TrainingType } from '@/types/safety.types';

interface TrainingManagementViewProps {
  projectId: string;
}

export const TrainingManagementView: React.FC<TrainingManagementViewProps> = ({ projectId }) => {
  const {
    training,
    trainingLoading,
    trainingError,
    fetchTraining,
    createTraining,
    updateTraining,
    getUpcomingTraining,
  } = useSafety();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TrainingType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TrainingStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<SafetyTraining | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch training data
  useEffect(() => {
    fetchTraining(projectId);
  }, [projectId, fetchTraining]);

  // Filter training
  const filteredTraining = useMemo(() => {
    return training.filter(session => {
      const matchesSearch = !searchQuery || 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || session.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [training, searchQuery, selectedType, selectedStatus]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalSessions = training.length;
    const completedSessions = training.filter(t => t.status === 'completed').length;
    const upcomingSessions = getUpcomingTraining().length;
    const totalAttendees = training.reduce((sum, t) => sum + t.attendees.length, 0);
    const certifiedWorkers = training.reduce((sum, t) => 
      sum + t.attendees.filter(a => a.certificateIssued).length, 0
    );
    const averageScore = training
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => {
        const scores = t.attendees.filter(a => a.score !== undefined).map(a => a.score!);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return sum + avgScore;
      }, 0) / (completedSessions || 1);

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalAttendees,
      certifiedWorkers,
      averageScore: Math.round(averageScore),
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  }, [training, getUpcomingTraining]);

  // Handle create training
  const handleCreateTraining = useCallback(async (trainingData: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      await createTraining(trainingData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating training:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [createTraining]);

  // Handle update training
  const handleUpdateTraining = useCallback(async (trainingData: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedTraining) return;
    
    setIsSubmitting(true);
    try {
      await updateTraining(selectedTraining.id, trainingData);
      setSelectedTraining(null);
    } catch (error) {
      console.error('Error updating training:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTraining, updateTraining]);

  // Get status color
  const getStatusColor = (status: TrainingStatus): string => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    };
    return colors[status];
  };

  // Get status icon
  const getStatusIcon = (status: TrainingStatus) => {
    const icons = {
      scheduled: Clock,
      in_progress: Users,
      completed: CheckCircle,
      expired: XCircle,
      cancelled: XCircle,
    };
    return icons[status];
  };

  if (trainingError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{trainingError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Training Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Schedule and track safety training sessions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Training
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.totalSessions}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {statistics.completionRate}% completion rate
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.upcomingSessions}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sessions this month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Certified Workers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.certifiedWorkers}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Active certifications
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.averageScore}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Assessment performance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search training sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="safety_orientation">Safety Orientation</option>
            <option value="fall_protection">Fall Protection</option>
            <option value="confined_space">Confined Space</option>
            <option value="hot_work">Hot Work</option>
            <option value="scaffolding">Scaffolding</option>
            <option value="crane_operation">Crane Operation</option>
            <option value="excavation">Excavation</option>
            <option value="hazmat">Hazmat</option>
            <option value="first_aid">First Aid</option>
            <option value="fire_safety">Fire Safety</option>
            <option value="ppe_usage">PPE Usage</option>
            <option value="custom">Custom</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Training List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {trainingLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading training sessions...</p>
          </div>
        ) : filteredTraining.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No training sessions found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Click "Schedule Training" to create your first training session'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Training
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTraining.map((session) => {
                  const StatusIcon = getStatusIcon(session.status);
                  const attendeeCount = session.attendees.length;
                  const maxAttendees = session.maxAttendees || 0;
                  const attendanceRate = session.status === 'completed' && attendeeCount > 0
                    ? Math.round((session.attendees.filter(a => a.attended).length / attendeeCount) * 100)
                    : null;

                  return (
                    <tr 
                      key={session.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTraining(session)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{session.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.trainingNumber} • {session.duration}h
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{session.instructor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.location}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(session.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {attendeeCount}{maxAttendees > 0 && `/${maxAttendees}`}
                          </span>
                        </div>
                        {attendanceRate !== null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {attendanceRate}% attended
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {session.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTraining(session);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || selectedTraining) && (
        <TrainingForm
          projectId={projectId}
          initialData={selectedTraining || undefined}
          onSubmit={selectedTraining ? handleUpdateTraining : handleCreateTraining}
          onCancel={() => {
            setShowCreateForm(false);
            setSelectedTraining(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
