import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  action?: string;
  onVerify: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  resetKey?: number | string;
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  action = 'booking',
  onVerify,
  onError,
  onExpire,
  resetKey,
  theme = 'auto',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Nếu script đã có sẵn trên trang
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setScriptLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    // Xóa widget cũ nếu có trước khi render mới
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (err) {
        // Ignored
      }
      widgetIdRef.current = null;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey || '0x4AAAAAAFD6cbdGSfQ4qeog',
        action,
        theme,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': (code?: string) => {
          console.warn('Turnstile error:', code);
          onError?.(code);
        },
        'expired-callback': () => {
          console.warn('Turnstile token expired');
          onExpire?.();
        },
      });
      widgetIdRef.current = id;
    } catch (err) {
      console.error('Failed to render Turnstile widget:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          // Ignored
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, action, theme, resetKey]);

  return (
    <div className={`turnstile-container flex items-center justify-center my-3 ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}
