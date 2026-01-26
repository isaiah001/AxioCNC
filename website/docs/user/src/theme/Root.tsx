/**
 * Root component that wraps all pages
 * Used to initialize Aptabase and track page views globally
 * Based on: https://aptabase.com/blog/step-by-step-guide-setting-up-aptabase-docusaurus
 */
import React, { useEffect } from 'react';
import { useAptabase } from '../hooks/useAptabase';
import { trackEvent } from '@aptabase/web';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Root({ children }: { children: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const { aptabaseAppKey } = (siteConfig?.customFields || {}) as {
    aptabaseAppKey?: string;
  };
  
  useAptabase(); // Initialize Aptabase
  const location = useLocation();

  useEffect(() => {
    // Only track if Aptabase is initialized (has a key)
    if (aptabaseAppKey && aptabaseAppKey.trim()) {
      try {
        trackEvent('screen_view', {
          screen: location.pathname,
          site: 'user_docs',
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Aptabase] Tracked screen_view:', location.pathname);
        }
      } catch (error) {
        console.error('[Aptabase] Failed to track screen_view:', error);
      }
    }
  }, [location, aptabaseAppKey]); // Re-run when location or key changes

  return <>{children}</>;
}
