import { useQuery } from '@tanstack/react-query';
import type { HealthStatus } from '@sajag/shared';
import { ApiError } from '../../lib/api/client';
import { publicApi, queryKeys } from '../../lib/api/endpoints';
import { Notice } from '../ui/Feedback';

function isHealthStatus(value: unknown): value is HealthStatus {
  return typeof value === 'object' && value !== null && 'sql' in value && 'documentDb' in value;
}

/** Admin-only banner: silent while both databases answer, explicit about which one is down otherwise. */
export function SystemStatus() {
  const { error } = useQuery({ queryKey: queryKeys.health, queryFn: publicApi.health, refetchInterval: 5 * 60_000, retry: false });
  if (!error) return null;

  const status = error instanceof ApiError && isHealthStatus(error.details) ? error.details : null;
  const down = status
    ? [status.sql === 'down' && 'Azure SQL', status.documentDb === 'down' && 'Azure DocumentDB'].filter(Boolean).join(' और ')
    : 'API सर्वर';
  return (
    <Notice tone="error" title="डेटाबेस से संपर्क नहीं हो पा रहा">
      {down} उपलब्ध नहीं है। जानकारी अधूरी दिख सकती है — Azure में फ़ायरवॉल / नेटवर्क सेटिंग जाँचें। हर 5 मिनट में फिर से जाँचा जा रहा है। (निःशुल्क Azure SQL रुकने के बाद शुरू होने में लगभग एक मिनट ले सकता है।)
    </Notice>
  );
}
