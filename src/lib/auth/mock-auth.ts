/**
 * Mock authentication for development environment
 * This allows developers to work without AD/LDAP infrastructure
 */

interface MockUser {
  username: string;
  password: string;
  displayName: string;
  email: string;
  department?: string;
  title?: string;
  groups?: string[];
}

// Predefined mock users for development
const MOCK_USERS: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    displayName: '管理员',
    email: 'admin@example.com',
    department: 'IT部门',
    title: '系统管理员',
    groups: ['Administrators', 'IT Support']
  },
  {
    username: 'user',
    password: 'user123',
    displayName: '普通用户',
    email: 'user@example.com',
    department: '业务部门',
    title: '业务专员',
    groups: ['Users']
  },
  {
    username: 'test',
    password: 'test123',
    displayName: '测试用户',
    email: 'test@example.com',
    department: '测试部门',
    title: '测试工程师',
    groups: ['Users', 'Testers']
  }
];

export class MockAuth {
  /**
   * Authenticate user with mock credentials
   */
  async authenticate(username: string, password: string) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      return null;
    }

    // Return user data without password
    const { password: removedPassword, ...userData } = user;
    void removedPassword;
    return userData;
  }

  /**
   * Get available mock users (for development UI)
   */
  getAvailableUsers() {
    return MOCK_USERS.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      hint: `密码: ${u.password}`
    }));
  }
}

export function createMockAuth() {
  return new MockAuth();
}
