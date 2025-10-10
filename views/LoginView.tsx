import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/FormControls';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_USERS } from '../mockData'; // In a real app, you wouldn't import this here
import { LogIn } from 'lucide-react';
import { Spinner } from '../components/Spinner';

export default function LoginView() {
    const { login, loading: authLoading } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState(MOCK_USERS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        setIsSubmitting(true);
        const user = MOCK_USERS.find(u => u.id === selectedUserId);
        if (user) {
            await login(user.email, 'password'); 
        }
        setIsSubmitting(false);
    };
    
    const isLoading = authLoading || isSubmitting;

    return (
        <div className="flex items-center justify-center min-h-screen bg-alabaster">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">NATA'CARA</CardTitle>
                    <CardDescription>Silakan login untuk mengakses proyek Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="user-select" className="block text-sm font-medium text-palladium mb-1">
                                Login sebagai:
                            </label>
                            <Select
                                id="user-select"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={isLoading}
                            >
                                {MOCK_USERS.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.roleId.charAt(0).toUpperCase() + user.roleId.slice(1)})
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {/* In a real app, you would have email and password fields */}
                        <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
                             {isLoading ? <Spinner size="sm" /> : <LogIn className="w-4 h-4 mr-2"/>}
                            {isLoading ? 'Memuat...' : 'Masuk'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}