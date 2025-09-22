import type { DataSource } from 'typeorm';

import * as bcrypt from 'bcryptjs';

const PERMISSIONS = {
  USERS: ['users:create', 'users:read', 'users:update', 'users:delete'],
  ROLES: ['roles:create', 'roles:read', 'roles:update', 'roles:delete'],
  TENANTS: ['tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete'],
  PERMISSIONS: [
    'permissions:create',
    'permissions:read',
    'permissions:update',
    'permissions:delete',
  ],
} as const;

export async function seedDevelopmentData(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository('Tenant');
  const userRepository = dataSource.getRepository('User');
  const roleRepository = dataSource.getRepository('Role');
  const userRoleRepository = dataSource.getRepository('UserRole');
  const permissionRepository = dataSource.getRepository('Permission');

  // Create default tenant
  const defaultTenant = await tenantRepository.save({
    id: '00000000-0000-0000-0000-000000000000',
    tenant_id: '00000000-0000-0000-0000-000000000000',
    name: 'AI-BOS ERP',
    subdomain: 'demo',
    domain: 'demo.aibos-erp.com',
    company_name: 'AI-BOS ERP Demo Company',
    company_email: 'admin@aibos-erp.com',
    company_phone: '+1-555-0123',
    company_address: '123 ERP Street, Business City, BC 12345',
    company_website: 'https://aibos-erp.com',
    default_locale: 'en',
    default_timezone: 'UTC',
    default_currency: 'USD',
    subscription_plan: 'enterprise',
    is_active: true,
  });

  console.log('✅ Created default tenant:', defaultTenant.name);

  // Create system roles
  const adminRole = await roleRepository.save({
    tenant_id: defaultTenant.id,
    name: 'System Administrator',
    code: 'admin',
    description: 'Full system access with all permissions',
    is_system_role: true,
    sort_order: 1,
    permissions: [
      ...PERMISSIONS.USERS,
      ...PERMISSIONS.ROLES,
      ...PERMISSIONS.TENANTS,
      ...PERMISSIONS.PERMISSIONS,
    ],
  });

  const managerRole = await roleRepository.save({
    tenant_id: defaultTenant.id,
    name: 'Manager',
    code: 'manager',
    description: 'Management access with user and role management',
    is_system_role: true,
    sort_order: 2,
    permissions: [...PERMISSIONS.USERS, 'roles:read'],
  });

  const userRole = await roleRepository.save({
    tenant_id: defaultTenant.id,
    name: 'User',
    code: 'user',
    description: 'Standard user access',
    is_system_role: true,
    sort_order: 3,
    permissions: ['users:read'],
  });

  console.log('✅ Created system roles:', [adminRole.name, managerRole.name, userRole.name]);

  // Create system permissions
  const permissions = [
    { resource: 'users', action: 'create', description: 'Create new users' },
    { resource: 'users', action: 'read', description: 'View user information' },
    {
      resource: 'users',
      action: 'update',
      description: 'Update user information',
    },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'roles', action: 'create', description: 'Create new roles' },
    { resource: 'roles', action: 'read', description: 'View role information' },
    {
      resource: 'roles',
      action: 'update',
      description: 'Update role information',
    },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    {
      resource: 'tenants',
      action: 'create',
      description: 'Create new tenants',
    },
    {
      resource: 'tenants',
      action: 'read',
      description: 'View tenant information',
    },
    {
      resource: 'tenants',
      action: 'update',
      description: 'Update tenant information',
    },
    { resource: 'tenants', action: 'delete', description: 'Delete tenants' },
    {
      resource: 'permissions',
      action: 'create',
      description: 'Create new permissions',
    },
    {
      resource: 'permissions',
      action: 'read',
      description: 'View permission information',
    },
    {
      resource: 'permissions',
      action: 'update',
      description: 'Update permission information',
    },
    {
      resource: 'permissions',
      action: 'delete',
      description: 'Delete permissions',
    },
  ];

  for (const perm of permissions) {
    await permissionRepository.save({
      tenant_id: defaultTenant.id,
      ...perm,
      is_system_permission: true,
    });
  }

  console.log('✅ Created system permissions:', permissions.length);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await userRepository.save({
    tenant_id: defaultTenant.id,
    username: 'admin',
    email: 'admin@aibos-erp.com',
    first_name: 'System',
    last_name: 'Administrator',
    password_hash: hashedPassword,
    email_verified: true,
    is_enabled: true,
    locale: 'en',
    timezone: 'UTC',
  });

  // Assign admin role to admin user
  await userRoleRepository.save({
    tenant_id: defaultTenant.id,
    user_id: adminUser.id,
    role_id: adminRole.id,
    assigned_at: new Date(),
    is_active: true,
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create demo users
  const demoUsers = [
    {
      username: 'manager1',
      email: 'manager@aibos-erp.com',
      first_name: 'John',
      last_name: 'Manager',
      role: managerRole,
    },
    {
      username: 'user1',
      email: 'user@aibos-erp.com',
      first_name: 'Jane',
      last_name: 'User',
      role: userRole,
    },
  ];

  for (const demoUser of demoUsers) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = await userRepository.save({
      tenant_id: defaultTenant.id,
      username: demoUser.username,
      email: demoUser.email,
      first_name: demoUser.first_name,
      last_name: demoUser.last_name,
      password_hash: hashedPassword,
      email_verified: true,
      is_enabled: true,
      locale: 'en',
      timezone: 'UTC',
    });

    await userRoleRepository.save({
      tenant_id: defaultTenant.id,
      user_id: user.id,
      role_id: demoUser.role.id,
      assigned_at: new Date(),
      is_active: true,
    });

    console.log('✅ Created demo user:', user.email);
  }

  console.log('🎉 Development seed data created successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@aibos-erp.com / admin123');
  console.log('   Manager: manager@aibos-erp.com / demo123');
  console.log('   User: user@aibos-erp.com / demo123');
}
