import { prisma, type DbClient } from '../../db/prisma';

export interface AuditEvent {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}

/** Append-only processing log (DPDP Rules: logs retained for at least one year). Never put personal data in `meta`. */
export async function recordAudit(event: AuditEvent, client: DbClient = prisma): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId ?? null,
      meta: event.meta ? JSON.stringify(event.meta) : null,
    },
  });
}
