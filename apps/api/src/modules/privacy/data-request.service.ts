import { DATA_REQUEST_SLA_DAYS, maskMobile, type DataRequestInput, type DataRequestReceipt } from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { encrypt, keyedHash } from '../../lib/crypto';
import { addDays } from '../../lib/dates';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';
import { referenceOf } from './privacy.mappers';

const MAX_OPEN_PER_MOBILE = 5;

/**
 * Records a data-principal request filed with just a mobile number (no OTP/SMS yet).
 * An owner verifies the person by calling back on that number before acting on it.
 */
export const dataRequestService = {
  async file(input: DataRequestInput): Promise<DataRequestReceipt> {
    const mobileHash = keyedHash(input.mobile);
    const open = await prisma.dataRequest.count({ where: { mobileHash, status: { in: ['open', 'in_progress'] } } });
    if (open >= MAX_OPEN_PER_MOBILE) {
      throw Errors.tooMany('इस मोबाइल नंबर से पहले ही कई अनुरोध खुले हैं। कृपया उनके उत्तर की प्रतीक्षा करें।');
    }
    const request = await prisma.dataRequest.create({
      data: {
        mobileHash,
        mobileEnc: encrypt(input.mobile),
        mobileMasked: maskMobile(input.mobile),
        type: input.type,
        details: input.details || null,
        dueAt: addDays(new Date(), DATA_REQUEST_SLA_DAYS),
      },
    });
    await recordAudit({ actorId: null, action: 'rights.request', entity: 'data_request', entityId: request.id, meta: { type: input.type } });
    return { reference: referenceOf(request.id), dueAt: request.dueAt.toISOString() };
  },
};
