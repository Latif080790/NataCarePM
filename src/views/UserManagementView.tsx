import { User } from '@/types';
import { CardPro, CardProContent, CardProHeader, CardProTitle, CardProDescription, ButtonPro } from '@/components/DesignSystem';
import { UserPlus, Trash2 } from 'lucide-react';
import { ROLES_CONFIG, hasPermission } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { userService } from '@/api/userService';
import { LoadingState } from '@/components/StateComponents';

export default function UserManagementView() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await userService.getUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Gagal memuat pengguna');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await userService.deleteUser(userToDelete.id);
        setUsers(users.filter((user) => user.id !== userToDelete.id));
        setUserToDelete(null);
      } catch (err) {
        setError('Gagal menghapus pengguna');
      }
    }
  };

  const getRoleById = (roleId: string) => ROLES_CONFIG.find((r) => r.id === roleId);

  const getRoleColor = (roleName: string = '') => {
    switch (roleName) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Project Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Site Manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'Finance':
        return 'bg-green-100 text-green-800';
      case 'Viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-violet-essence';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingState message="Memuat pengguna..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center p-4 bg-red-50 border border-red-200 rounded-lg">{error}</div>;
  }

  return (
    <>
      <CardPro variant="elevated" className="hover:shadow-lg transition-shadow">
        <CardProHeader>
          <div className="flex flex-row justify-between items-center w-full">
            <div>
              <CardProTitle>Manajemen Pengguna</CardProTitle>
              <CardProDescription>Kelola akses dan peran pengguna untuk proyek ini.</CardProDescription>
            </div>
            {hasPermission(currentUser, 'manage_users') && (
              <ButtonPro variant="primary" icon={UserPlus}>
                Undang User Baru
              </ButtonPro>
            )}
          </div>
        </CardProHeader>
        <CardProContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-900">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Peran (Role)</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const role = getRoleById(user.roleId);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full border-2 border-gray-200"
                          />
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${getRoleColor(
                            role?.name
                          )}`}
                        >
                          {role?.name || 'Unknown Role'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {hasPermission(currentUser, 'manage_users') && (
                          <div className="flex justify-center gap-2">
                            <ButtonPro variant="outline" size="sm">
                              Edit
                            </ButtonPro>
                            <ButtonPro
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDelete(user)}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardProContent>
      </CardPro>
      {userToDelete && (
        <ConfirmationDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={confirmDelete}
          title={`Hapus Pengguna ${userToDelete.name}`}
          description="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat diurungkan."/>
      )}
    </>
  );
}

