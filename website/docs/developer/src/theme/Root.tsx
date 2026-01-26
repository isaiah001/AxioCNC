/**
 * Root component that wraps all pages
 * Used to initialize Aptabase and track page views globally
 * Based on: https://aptabase.com/blog/step-by-step-guide-setting-up-aptabase-docusaurus
 */
import React, { useEffect } from 'react';
import { useAptabase } from '../hooks/useAptabase';
import { trackEvent } from '@aptabase/web';
import { useLocation } from '@docusaurus/router';

export default function Root({ children }: { children: React.ReactNode }) {
  useAptabase(); // Initialize Aptabase
  const location = useLocation();

  useEffect(() => {
    // Track page views
    trackEvent('screen_view', {
      screen: location.pathname,
      site: 'dev_docs',
    });
  }, [location]); // Re-run when location changes

  return <>{children}</>;
}
