import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from 'react-router-dom';
import { publicApi, queryKeys } from '../../lib/api/endpoints';
import { Wordmark } from '../ui/Seal';

/** Person credited as running the campaign (shown in the footer). */
const CAMPAIGN_DIRECTOR = 'संजय डाबी';

export function usePublicConfig() {
  return useQuery({ queryKey: queryKeys.config, queryFn: publicApi.config, staleTime: 60 * 60 * 1000 });
}

function PublicHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Wordmark sub="SAJAG · नागरिक पहल" />
        <nav className="site-nav" aria-label="मुख्य">
          <Link to="/#abhiyan" className="site-nav__link site-nav__link--wide">
            अभियान
          </Link>
          <Link to="/#help" className="site-nav__link site-nav__link--wide">
            हेल्पलाइन
          </Link>
          <Link to="/my-data" className="site-nav__link">
            मेरा डेटा
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  const { data: config } = usePublicConfig();
  const officer = config?.grievanceOfficer;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__row">
          <div className="stack-md site-footer__about">
            <span className="wordmark__name">सजग</span>
            <p className="muted">
              सजग एक स्वतंत्र सामाजिक जागरूकता पहल है। यह किसी सरकारी या पुलिस विभाग की आधिकारिक वेबसाइट नहीं है। प्रश्नावली केवल जानकारी के लिए है, कानूनी
              सलाह नहीं।
            </p>
            <p className="credit">
              <span className="credit__label">अभियान संचालक :</span> <span className="credit__name">{CAMPAIGN_DIRECTOR}</span>
            </p>
          </div>
          <nav className="stack-sm site-footer__links" aria-label="फ़ुटर">
            <Link to="/my-data">मेरा डेटा — देखें, सुधारें, मिटवाएँ</Link>
            <Link to="/privacy">गोपनीयता सूचना</Link>
            <span className="muted">
              शिकायत अधिकारी: {officer?.name || '[नाम]'} · {officer?.email || '[ईमेल]'} · {officer?.phone || '[फ़ोन]'}
            </span>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} सजग</span>
          <Link to="/admin/login" className="site-footer__admin">
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="page">
      <a href="#main" className="skip-link">
        मुख्य सामग्री पर जाएँ
      </a>
      <PublicHeader />
      <main id="main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
