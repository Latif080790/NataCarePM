import React from 'react';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select, Textarea } from './FormControls';
import { Task, Subtask, TaskComment } from '../types';
import { taskService } from '../api/taskService';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { Spinner } from './Spinner';
import { Progress } from './Progress';
import { 
    Calendar, Tag, AlertCircle, Plus, X, 
    Edit, Save, CheckCircle, Clock, MessageCircle, Users,
    Trash2
} from 'lucide-react';
import { formatDate } from '../constants';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onTaskUpdated?: (task: Task) => void;
    onTaskDeleted?: (taskId: string) => void;
}

export default function TaskDetailModal({ 
    isOpen, 
    onClose, 
    task, 
    onTaskUpdated, 
    onTaskDeleted 
}: TaskDetailModalProps) {
    const { currentUser } = useAuth();
    const { currentProject } = useProject();
    const { addToast } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [taskData, setTaskData] = useState<Task>(task);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Real-time comments
    useEffect(() => {
        if (!isOpen || !currentProject) return;
        
        const unsubscribe = taskService.streamTaskComments(
            currentProject.id, 
            task.id,
            setComments
        );
        
        return () => unsubscribe();
    }, [isOpen, currentProject, task.id]);

    // Update local task data when prop changes
    useEffect(() => {
        setTaskData(task);
    }, [task]);

    const handleUpdateTask = async (updates: Partial<Task>) => {
        if (!currentProject || !currentUser) return;
        
        setIsLoading(true);
        try {
            await taskService.updateTask(currentProject.id, task.id, updates, currentUser);
            
            const updatedTask = { ...taskData, ...updates };
            setTaskData(updatedTask);
            
            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
            }
            
            addToast('Task berhasil diperbarui', 'success');
        } catch (error: any) {
            console.error('Error updating task:', error);
            addToast(`Gagal memperbarui task: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!currentProject || !currentUser) return;
        
        setIsLoading(true);
        try {
            await taskService.deleteTask(currentProject.id, task.id, currentUser);
            
            if (onTaskDeleted) {
                onTaskDeleted(task.id);
            }
            
            addToast('Task berhasil dihapus', 'success');
            onClose();
        } catch (error: any) {
            console.error('Error deleting task:', error);
            addToast(`Gagal menghapus task: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim() || !currentProject || !currentUser) return;
        
        setIsLoading(true);
        try {
            const subtaskData: Omit<Subtask, 'id'> = {
                title: newSubtask.trim(),
                completed: false,
                assignedTo: currentUser.id,
            };
            
            await taskService.addSubtask(currentProject.id, task.id, subtaskData);
            setNewSubtask('');
            addToast('Subtask berhasil ditambahkan', 'success');
            
            // Refresh task data to get updated subtasks and progress
            const updatedTaskResponse = await taskService.getTaskById(currentProject.id, task.id);
            const updatedTask = updatedTaskResponse.success ? updatedTaskResponse.data : null;
            if (updatedTask) {
                setTaskData(updatedTask);
                if (onTaskUpdated) onTaskUpdated(updatedTask);
            }
        } catch (error: any) {
            console.error('Error adding subtask:', error);
            addToast(`Gagal menambahkan subtask: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
        if (!currentProject || !currentUser) return;
        
        try {
            await taskService.updateSubtask(
                currentProject.id, 
                task.id, 
                subtaskId, 
                { completed }
            );
            
            // Refresh task data
            const updatedTaskResponse = await taskService.getTaskById(currentProject.id, task.id);
            const updatedTask = updatedTaskResponse.success ? updatedTaskResponse.data : null;
            if (updatedTask) {
                setTaskData(updatedTask);
                if (onTaskUpdated) onTaskUpdated(updatedTask);
            }
        } catch (error: any) {
            console.error('Error updating subtask:', error);
            addToast(`Gagal memperbarui subtask: ${error.message}`, 'error');
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        if (!currentProject || !currentUser) return;
        
        try {
            await taskService.deleteSubtask(currentProject.id, task.id, subtaskId);
            
            // Refresh task data
            const updatedTaskResponse = await taskService.getTaskById(currentProject.id, task.id);
            const updatedTask = updatedTaskResponse.success ? updatedTaskResponse.data : null;
            if (updatedTask) {
                setTaskData(updatedTask);
                if (onTaskUpdated) onTaskUpdated(updatedTask);
            }
            
            addToast('Subtask berhasil dihapus', 'success');
        } catch (error: any) {
            console.error('Error deleting subtask:', error);
            addToast(`Gagal menghapus subtask: ${error.message}`, 'error');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentProject || !currentUser) return;
        
        try {
            await taskService.addComment(currentProject.id, task.id, newComment, currentUser);
            setNewComment('');
            addToast('Komentar berhasil ditambahkan', 'success');
        } catch (error: any) {
            console.error('Error adding comment:', error);
            addToast(`Gagal menambahkan komentar: ${error.message}`, 'error');
        }
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'todo': return <Clock className="w-4 h-4 text-gray-500" />;
            case 'in-progress': return <AlertCircle className="w-4 h-4 text-blue-500" />;
            case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'blocked': return <X className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'done': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-600';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'critical': return 'bg-red-100 text-red-700';
        }
    };

    const isOverdue = new Date(taskData.dueDate) < new Date() && taskData.status !== 'done';
    const canEdit = currentUser && (
        taskData.createdBy === currentUser.id || 
        taskData.assignedTo.includes(currentUser.id) ||
        ['admin', 'pm'].includes(currentUser.roleId)
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={taskData.title} size="xl">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(taskData.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(taskData.status)}`}>
                                {taskData.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(taskData.priority)}`}>
                                {taskData.priority}
                            </span>
                            {isOverdue && (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    Overdue
                                </span>
                            )}
                        </div>
                        
                        <div className="text-sm text-palladium space-y-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {formatDate(taskData.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{taskData.assignedTo.length} assignee(s)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                <span>{comments.length} comment(s)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                    disabled={isLoading}
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    {isEditing ? 'Cancel' : 'Edit'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isLoading}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-violet-essence/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-lg font-bold">{taskData.progress}%</span>
                    </div>
                    <Progress value={taskData.progress} />
                    <p className="text-xs text-palladium mt-1">
                        {taskData.subtasks.filter(st => st.completed).length} dari {taskData.subtasks.length} subtasks selesai
                    </p>
                </div>

                {/* Description Section */}
                <div>
                    <h3 className="font-semibold mb-2">Deskripsi</h3>
                    {isEditing ? (
                        <div className="space-y-2">
                            <Textarea
                                value={taskData.description}
                                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                disabled={isLoading}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdateTask({ description: taskData.description })}
                                    disabled={isLoading}
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-palladium whitespace-pre-wrap">{taskData.description}</p>
                    )}
                </div>

                {/* Quick Actions */}
                {canEdit && !isEditing && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <Select
                                value={taskData.status}
                                onChange={(e) => handleUpdateTask({ status: e.target.value as Task['status'] })}
                                disabled={isLoading}
                            >
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <Select
                                value={taskData.priority}
                                onChange={(e) => handleUpdateTask({ priority: e.target.value as Task['priority'] })}
                                disabled={isLoading}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Subtasks Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Subtasks ({taskData.subtasks.length})</h3>
                        {canEdit && (
                            <Button size="sm" variant="outline" onClick={() => {}}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add Subtask
                            </Button>
                        )}
                    </div>
                    
                    {canEdit && (
                        <div className="flex gap-2 mb-3">
                            <Input
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                placeholder="Masukkan subtask baru..."
                                disabled={isLoading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtask();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleAddSubtask}
                                disabled={isLoading || !newSubtask.trim()}
                                size="sm"
                            >
                                Add
                            </Button>
                        </div>
                    )}
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {taskData.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2 p-2 border border-violet-essence rounded">
                                <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                                    disabled={isLoading || !canEdit}
                                    className="rounded border-gray-300"
                                />
                                <span className={`flex-1 ${subtask.completed ? 'line-through text-palladium' : ''}`}>
                                    {subtask.title}
                                </span>
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                        disabled={isLoading}
                                        className="text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {taskData.subtasks.length === 0 && (
                        <p className="text-palladium text-center py-4">Belum ada subtask</p>
                    )}
                </div>

                {/* Comments Section */}
                <div>
                    <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>
                    
                    {/* Add Comment */}
                    {currentUser && (
                        <div className="space-y-2 mb-4">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Tambahkan komentar..."
                                rows={3}
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={isLoading || !newComment.trim()}
                                size="sm"
                            >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Add Comment
                            </Button>
                        </div>
                    )}
                    
                    {/* Comments List */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded">
                                <img 
                                    src={comment.authorAvatar} 
                                    alt={comment.authorName}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{comment.authorName}</span>
                                        <span className="text-xs text-palladium">
                                            {formatDate(comment.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {comments.length === 0 && (
                        <p className="text-palladium text-center py-4">Belum ada komentar</p>
                    )}
                </div>

                {/* Tags */}
                {taskData.tags.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {taskData.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-1 bg-violet-essence text-night-black text-xs rounded-full"
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setShowDeleteConfirm(false)} 
                    title="Konfirmasi Hapus Task"
                >
                    <div className="space-y-4">
                        <p>Apakah Anda yakin ingin menghapus task ini? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleDeleteTask}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isLoading ? <Spinner size="sm" /> : 'Hapus Task'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}
