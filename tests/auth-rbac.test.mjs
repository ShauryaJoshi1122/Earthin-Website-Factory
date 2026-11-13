import test from 'node:test';
import assert from 'node:assert/strict';

function checkPermission(user, requiredPermission) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(requiredPermission);
}

function checkRole(user, allowedRoles) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}

test('RBAC permission evaluation matrix', () => {
  const superAdmin = { id: 1, role: 'SUPER_ADMIN', permissions: ['*'] };
  const admin = { id: 2, role: 'ADMIN', permissions: ['websites.create', 'websites.edit', 'hosting.manage'] };
  const operator = { id: 3, role: 'WEBSITE_OPERATOR', permissions: ['websites.create'] };
  const viewer = { id: 4, role: 'VIEWER', permissions: ['websites.view'] };

  // SUPER_ADMIN has access to everything
  assert.equal(checkPermission(superAdmin, 'websites.delete'), true);
  assert.equal(checkPermission(superAdmin, 'team.manage'), true);

  // ADMIN can manage hosting, but not team
  assert.equal(checkPermission(admin, 'hosting.manage'), true);
  assert.equal(checkPermission(admin, 'team.manage'), false);

  // WEBSITE_OPERATOR can create websites, but not manage hosting
  assert.equal(checkPermission(operator, 'websites.create'), true);
  assert.equal(checkPermission(operator, 'hosting.manage'), false);

  // VIEWER cannot create websites
  assert.equal(checkPermission(viewer, 'websites.create'), false);
  assert.equal(checkPermission(viewer, 'websites.view'), true);

  // Unauthenticated user
  assert.equal(checkPermission(null, 'websites.view'), false);
});

