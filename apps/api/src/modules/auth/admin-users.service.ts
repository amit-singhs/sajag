import bcrypt from 'bcryptjs';
import type { AdminUser } from '@prisma/client';
import { ADMIN_ROLES, type AdminCreateInput, type AdminRole, type AdminUpdateInput, type AdminUserView, type ChangePasswordInput } from '@sajag/shared';
import { BCRYPT_ROUNDS } from '../../db/bootstrap';
import { prisma } from '../../db/prisma';
import { toIso } from '../../lib/dates';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';

const asRole = (value: string): AdminRole => ((ADMIN_ROLES as readonly string[]).includes(value) ? (value as AdminRole) : 'analyst');

function toView(u: AdminUser): AdminUserView {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: asRole(u.role),
    isActive: u.isActive,
    lastLoginAt: toIso(u.lastLoginAt),
    createdAt: u.createdAt.toISOString(),
  };
}

/** There must always be at least one active owner, or nobody could manage the system. */
async function assertKeepsAnOwner(target: AdminUser, next: { role: AdminRole; isActive: boolean }): Promise<void> {
  const losesOwner = target.role === 'owner' && target.isActive && (next.role !== 'owner' || !next.isActive);
  if (!losesOwner) return;
  const owners = await prisma.adminUser.count({ where: { role: 'owner', isActive: true } });
  if (owners <= 1) throw Errors.conflict('At least one active owner is required');
}

export const adminUsersService = {
  async list(): Promise<AdminUserView[]> {
    const users = await prisma.adminUser.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }] });
    return users.map(toView);
  },

  async create(input: AdminCreateInput, actorId: string): Promise<AdminUserView> {
    if (await prisma.adminUser.findUnique({ where: { email: input.email } })) {
      throw Errors.conflict('An admin with this e-mail already exists');
    }
    const user = await prisma.adminUser.create({
      data: { name: input.name, email: input.email, role: input.role, passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS) },
    });
    await recordAudit({ actorId, action: 'admin.create', entity: 'admin', entityId: user.id, meta: { role: input.role } });
    return toView(user);
  },

  async update(id: string, input: AdminUpdateInput, actorId: string): Promise<AdminUserView> {
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw Errors.notFound('Admin');
    if (id === actorId && input.isActive === false) throw Errors.conflict('You cannot deactivate your own account');
    await assertKeepsAnOwner(target, { role: input.role ?? asRole(target.role), isActive: input.isActive ?? target.isActive });

    const user = await prisma.adminUser.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.password !== undefined ? { passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS) } : {}),
      },
    });
    const changed = Object.keys(input).filter((k) => input[k as keyof AdminUpdateInput] !== undefined && k !== 'password');
    await recordAudit({ actorId, action: input.password ? 'admin.password_reset' : 'admin.update', entity: 'admin', entityId: id, meta: { changed } });
    return toView(user);
  },

  async changeOwnPassword(id: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw Errors.badRequest('Current password is incorrect');
    }
    await prisma.adminUser.update({ where: { id }, data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) } });
    await recordAudit({ actorId: id, action: 'admin.password_change', entity: 'admin', entityId: id });
  },
};
