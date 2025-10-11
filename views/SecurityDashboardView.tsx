import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import { SecurityEvent, SecurityMetrics } from '../types/components';
import { useSecurityManager, usePerformanceMonitor } from '../hooks/useSecurityAndPerformance';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
    Shield, Lock, Eye, Activity, Cpu, MemoryStick, 
    Clock, AlertTriangle, CheckCircle, TrendingUp, 
    Download, Settings, Users, Globe, Database
} from 'lucide-react';

export default function SecurityDashboard() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { 
        securityConfig, 
        securityMetrics, 
        setSecurityConfig, 
        validatePassword,
        logSecurityEvent
    } = useSecurityManager();
    const { 
        performanceMetrics, 
        generatePerformanceReport,
        performanceConfig,
        setPerformanceConfig
    } = usePerformanceMonitor();

    const [activeTab, setActiveTab] = useState<'security' | 'performance' | 'audit'>('security');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });

    // Validate password on change
    useEffect(() => {
        if (newPassword) {
            setPasswordValidation(validatePassword(newPassword));
        }
    }, [newPassword, validatePassword]);

    const handlePasswordUpdate = async () => {
        if (!passwordValidation.isValid) {
            addToast('Password does not meet security requirements', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast('Passwords do not match', 'error');
            return;
        }

        try {
            // In a real app, this would call an API to update the password
            logSecurityEvent('password_change', { userId: currentUser?.id }, currentUser?.id);
            addToast('Password updated successfully', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            addToast(`Error updating password: ${error.message}`, 'error');
        }
    };

    const handleSecurityConfigUpdate = (updates: Partial<typeof securityConfig>) => {
        setSecurityConfig(prev => ({ ...prev, ...updates }));
        logSecurityEvent('config_change', { changes: updates }, currentUser?.id);
        addToast('Security configuration updated', 'success');
    };

    const handlePerformanceConfigUpdate = (updates: Partial<typeof performanceConfig>) => {
        setPerformanceConfig(prev => ({ ...prev, ...updates }));
        addToast('Performance configuration updated', 'success');
    };

    const exportReport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            security: {
                config: securityConfig,
                metrics: securityMetrics,
                activeSessions: Object.keys(securityMetrics.activeSessions).length,
                recentEvents: securityMetrics.securityEvents.slice(0, 20)
            },
            performance: {
                config: performanceConfig,
                metrics: performanceMetrics,
                report: generatePerformanceReport()
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-performance-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast('Report exported successfully', 'success');
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-night-black">Security & Performance</h1>
                    <p className="text-palladium">Monitor system security and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={exportReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'security' 
                            ? 'bg-white text-violet-essence shadow-sm' 
                            : 'text-palladium hover:text-night-black'
                    }`}
                >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'performance' 
                            ? 'bg-white text-violet-essence shadow-sm' 
                            : 'text-palladium hover:text-night-black'
                    }`}
                >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Performance
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'audit' 
                            ? 'bg-white text-violet-essence shadow-sm' 
                            : 'text-palladium hover:text-night-black'
                    }`}
                >
                    <Eye className="w-4 h-4 inline mr-2" />
                    Audit Trail
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        {/* Security Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Active Sessions</p>
                                            <p className="text-2xl font-bold">{Object.keys(securityMetrics.activeSessions).length}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Failed Logins</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {Object.values(securityMetrics.failedLoginAttempts).reduce((sum, user) => sum + user.count, 0)}
                                            </p>
                                        </div>
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Security Events</p>
                                            <p className="text-2xl font-bold">{securityMetrics.securityEvents.length}</p>
                                        </div>
                                        <Eye className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Session Timeout</p>
                                            <p className="text-2xl font-bold">{securityConfig.sessionTimeout}m</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Security Configuration */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Password Policy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Minimum Length</label>
                                        <Input
                                            type="number"
                                            min="6"
                                            max="20"
                                            value={securityConfig.passwordPolicy.minLength}
                                            onChange={(e) => handleSecurityConfigUpdate({
                                                passwordPolicy: {
                                                    ...securityConfig.passwordPolicy,
                                                    minLength: parseInt(e.target.value)
                                                }
                                            })}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={securityConfig.passwordPolicy.requireUppercase}
                                                onChange={(e) => handleSecurityConfigUpdate({
                                                    passwordPolicy: {
                                                        ...securityConfig.passwordPolicy,
                                                        requireUppercase: e.target.checked
                                                    }
                                                })}
                                            />
                                            <span className="text-sm">Require uppercase letters</span>
                                        </label>
                                        
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={securityConfig.passwordPolicy.requireNumbers}
                                                onChange={(e) => handleSecurityConfigUpdate({
                                                    passwordPolicy: {
                                                        ...securityConfig.passwordPolicy,
                                                        requireNumbers: e.target.checked
                                                    }
                                                })}
                                            />
                                            <span className="text-sm">Require numbers</span>
                                        </label>
                                        
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={securityConfig.passwordPolicy.requireSpecialChars}
                                                onChange={(e) => handleSecurityConfigUpdate({
                                                    passwordPolicy: {
                                                        ...securityConfig.passwordPolicy,
                                                        requireSpecialChars: e.target.checked
                                                    }
                                                })}
                                            />
                                            <span className="text-sm">Require special characters</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Change Password
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">New Password</label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                        />
                                        {newPassword && !passwordValidation.isValid && (
                                            <div className="mt-2 space-y-1">
                                                {passwordValidation.errors.map((error, index) => (
                                                    <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {error}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {newPassword && passwordValidation.isValid && (
                                            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Password meets all requirements
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    
                                    <Button 
                                        onClick={handlePasswordUpdate}
                                        disabled={!passwordValidation.isValid || newPassword !== confirmPassword}
                                        className="w-full"
                                    >
                                        Update Password
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        {/* Performance Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Memory Usage</p>
                                            <p className="text-2xl font-bold">
                                                {performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1]?.toFixed(1) || 0} MB
                                            </p>
                                        </div>
                                        <MemoryStick className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Active Users</p>
                                            <p className="text-2xl font-bold">{performanceMetrics.userEngagement.activeUsers}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Cache Timeout</p>
                                            <p className="text-2xl font-bold">{performanceConfig.cacheTimeout}m</p>
                                        </div>
                                        <Database className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-palladium">Page Size</p>
                                            <p className="text-2xl font-bold">{performanceConfig.dataPageSize}</p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Performance Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Cache Timeout (minutes)</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={performanceConfig.cacheTimeout}
                                            onChange={(e) => handlePerformanceConfigUpdate({
                                                cacheTimeout: parseInt(e.target.value)
                                            })}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Data Page Size</label>
                                        <Input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={performanceConfig.dataPageSize}
                                            onChange={(e) => handlePerformanceConfigUpdate({
                                                dataPageSize: parseInt(e.target.value)
                                            })}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max Concurrent Requests</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={performanceConfig.maxConcurrentRequests}
                                            onChange={(e) => handlePerformanceConfigUpdate({
                                                maxConcurrentRequests: parseInt(e.target.value)
                                            })}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="lazyLoading"
                                            checked={performanceConfig.enableLazyLoading}
                                            onChange={(e) => handlePerformanceConfigUpdate({
                                                enableLazyLoading: e.target.checked
                                            })}
                                        />
                                        <label htmlFor="lazyLoading" className="text-sm">Enable Lazy Loading</label>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="virtualization"
                                            checked={performanceConfig.enableVirtualization}
                                            onChange={(e) => handlePerformanceConfigUpdate({
                                                enableVirtualization: e.target.checked
                                            })}
                                        />
                                        <label htmlFor="virtualization" className="text-sm">Enable Virtualization</label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Recent Security Events
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {securityMetrics.securityEvents.map((event, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                            <div className={`w-3 h-3 rounded-full mt-1 ${
                                                event.type === 'login_success' ? 'bg-green-500' :
                                                event.type === 'login_failure' ? 'bg-red-500' :
                                                event.type === 'password_change' ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }`} />
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-sm">{event.type.replace('_', ' ').toUpperCase()}</p>
                                                    <span className="text-xs text-palladium">
                                                        {event.timestamp.toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-palladium mt-1">
                                                    IP: {event.ipAddress} | User: {event.userId || 'Anonymous'}
                                                </p>
                                                {event.details && (
                                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                                                        {JSON.stringify(event.details, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {securityMetrics.securityEvents.length === 0 && (
                                        <div className="text-center py-8 text-palladium">
                                            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No security events recorded</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}