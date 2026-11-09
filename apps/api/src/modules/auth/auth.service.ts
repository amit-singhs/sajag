import bcrypt from 'bcryptjs';
import { ADMIN_ROLES, type AdminProfile, type AdminRole, type LoginInput, type LoginResult } from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { Errors } from '../../lib/errors';
import { ADMIN_TOKEN_TTL_SECONDS, expiryIso, tokens } from '../../lib/tokens';
import { recordAudit } from '../audit/audit.service';

// Compared against when the e-mail is unknown, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 12);

function toRole(value: string): AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value) ? (value as AdminRole) : 'analyst';
}

function toProfile(user: { id: string; email: string; name: string; role: string }): AdminProfile {
  return { id: user.id, email: user.email, name: user.name, role: toRole(user.role) };
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await prisma.adminUser.findUnique({ where: { email: input.email } });
    const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.isActive || !valid) throw Errors.unauthorized('Incorrect e-mail or password');

    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAudit({ actorId: user.id, action: 'admin.login', entity: 'admin', entityId: user.id });

    const admin = toProfile(user);
    return {
      token: tokens.signAdmin({ sub: admin.id, role: admin.role }),
      expiresAt: expiryIso(ADMIN_TOKEN_TTL_SECONDS),
      admin,
    };
  },

  async profile(id: string): Promise<AdminProfile> {
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user || !user.isActive) throw Errors.unauthorized();
    return toProfile(user);
  },
};
