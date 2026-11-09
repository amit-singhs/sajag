import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ErrorNotice } from '../../../components/ui/Feedback';
import { PasswordField, TextField } from '../../../components/ui/Field';
import { Wordmark } from '../../../components/ui/Seal';
import { adminApi } from '../../../lib/api/endpoints';
import { adminTokenStore } from '../../../lib/auth/token-store';
import { useAdminSession } from '../../../lib/auth/useAdminSession';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const login = useMutation({
    mutationFn: () => adminApi.login({ email, password }),
    onSuccess: (result) => {
      adminTokenStore.set(result.token);
      navigate(from, { replace: true });
    },
  });

  if (session.token && session.profile) return <Navigate to={from} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <div className="login">
      <aside className="login__aside">
        <Wordmark inverse />
        <div className="stack-md">
          <span className="eyebrow eyebrow--light">व्यवस्थापक क्षेत्र</span>
          <p className="display-3">हर उत्तर बताता है कि जागरूकता कहाँ सबसे ज़्यादा चाहिए।</p>
          <p className="lead lead--light">प्रतिक्रियाओं का विश्लेषण, फ़ॉर्म बिल्डर और गोपनीयता अनुपालन — केवल अधिकृत व्यवस्थापकों के लिए।</p>
        </div>
      </aside>
      <main className="login__main" id="main">
        <form className="login__form stack-lg" onSubmit={onSubmit}>
          <h1 className="display-2">लॉगिन करें</h1>
          <TextField label="ईमेल" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordField label="पासवर्ड" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {login.error && <ErrorNotice error={login.error} />}
          <Button type="submit" block loading={login.isPending} iconAfter="arrowRight">
            डैशबोर्ड खोलें
          </Button>
          <Link to="/">मुखपृष्ठ पर लौटें</Link>
        </form>
      </main>
    </div>
  );
}
