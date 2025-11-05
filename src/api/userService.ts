import { User } from '@/types';

// Mock user data
let users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    roleId: '1',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    roleId: '2',
  },
];

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(users);
      }, 500);
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = users.length;
        users = users.filter((user) => user.id !== userId);
        if (users.length < initialLength) {
          resolve();
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },
};
