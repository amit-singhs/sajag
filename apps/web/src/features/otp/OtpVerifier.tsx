import { useMutation } from '@tanstack/react-query';
import { INDIAN_MOBILE_REGEX, normalizeMobileInput, type OtpPurpose, type OtpRequestResult } from '@sajag/shared';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ErrorNotice, Notice } from '../../components/ui/Feedback';
import { TextField } from '../../components/ui/Field';
import { otpApi } from '../../lib/api/endpoints';

interface OtpVerifierProps {
  purpose: OtpPurpose;
  mobile: string;
  onMobileChange: (mobile: string) => void;
  onVerified: (token: string) => void;
  mobileLabel?: string;
  verified?: boolean;
}

/** Two-step mobile verification (send code → confirm). Reused by guardian consent and "My data". */
export function OtpVerifier({ purpose, mobile, onMobileChange, onVerified, mobileLabel = 'मोबाइल नंबर', verified }: OtpVerifierProps) {
  const [challenge, setChallenge] = useState<OtpRequestResult | null>(null);
  const [code, setCode] = useState('');

  const send = useMutation({
    mutationFn: () => otpApi.request({ mobile, purpose }),
    onSuccess: (result) => {
      setChallenge(result);
      setCode('');
    },
  });
  const verify = useMutation({
    mutationFn: () => {
      if (!challenge) throw new Error('पहले OTP भेजें');
      return otpApi.verify({ challengeId: challenge.challengeId, code });
    },
    onSuccess: (result) => onVerified(result.token),
  });

  if (verified) return <Notice tone="success">मोबाइल नंबर सत्यापित हो गया।</Notice>;

  const mobileValid = INDIAN_MOBILE_REGEX.test(mobile);
  return (
    <div className="stack-md">
      <div className="row-end">
        <TextField
          label={mobileLabel}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10 अंक"
          value={mobile}
          onChange={(e) => {
            onMobileChange(normalizeMobileInput(e.target.value));
            setChallenge(null);
          }}
        />
        <Button variant="ghost" onClick={() => send.mutate()} disabled={!mobileValid} loading={send.isPending}>
          {challenge ? 'फिर भेजें' : 'OTP भेजें'}
        </Button>
      </div>
      {send.error && <ErrorNotice error={send.error} />}
      {challenge && (
        <>
          {challenge.devCode && <Notice tone="warn">डेवलपमेंट मोड: OTP {challenge.devCode} है (SMS नहीं भेजा गया)।</Notice>}
          <div className="row-end">
            <TextField
              label="OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 अंक"
              className="mono"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Button onClick={() => verify.mutate()} disabled={code.length !== 6} loading={verify.isPending}>
              सत्यापित करें
            </Button>
          </div>
          {verify.error && <ErrorNotice error={verify.error} />}
        </>
      )}
    </div>
  );
}
