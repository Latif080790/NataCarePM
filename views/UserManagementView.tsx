import React from 'react';
import { User } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { UserPlus } from 'lucide-react';
import { ROLES_CONFIG, hasPermission } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface UserManagementViewProps {
  users: User[];
}

export default function UserManagementView({ users }: UserManagementViewProps) {
  const { currentUser } = useAuth();
  
  const getRoleById = (roleId: string) => ROLES_CONFIG.find(r => r.id === roleId);

  const getRoleColor = (roleName: string = '') => {
    switch(roleName) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Project Manager': return 'bg-blue-100 text-blue-800';
      case 'Site Manager': return 'bg-yellow-100 text-yellow-800';
      case 'Finance': return 'bg-green-100 text-green-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-violet-essence';
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Manajemen Pengguna</CardTitle>
          <CardDescription>Kelola akses dan peran pengguna untuk proyek ini.</CardDescription>
        </div>
        {hasPermission(currentUser, 'manage_users') && (
          <Button><UserPlus className="w-4 h-4 mr-2"/>Undang User Baru</Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-night-black">
            <thead className="bg-violet-essence/50 text-xs uppercase">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const role = getRoleById(user.roleId);
                return (
                  <tr key={user.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getRoleColor(role?.name)}`}>
                          {role?.name || 'Unknown Role'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                       {hasPermission(currentUser, 'manage_users') && (
                          <Button variant="outline" size="sm">Edit</Button>
                       )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
