import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function scrollToId(id: string, behavior: ScrollBehavior = 'smooth'): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior, block: 'start' });
  return true;
}

/**
 * Link to a section of the landing page (e.g. "#abhiyan"). Scrolls smoothly when already on the page —
 * including repeated clicks on the same link — and navigates home first from any other page.
 */
export function HashLink({ to, className, children }: { to: `#${string}`; className?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = to.slice(1);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let the browser open new tabs
    e.preventDefault();
    if (pathname === '/' && scrollToId(id)) {
      window.history.replaceState(null, '', `/${to}`);
      return;
    }
    navigate(`/${to}`);
  };

  return (
    <a href={`/${to}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

/** After navigating to "/#section", waits for the section to render (data may still be loading), then scrolls. */
export function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      if (scrollToId(id) || ++tries > 20) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
}
