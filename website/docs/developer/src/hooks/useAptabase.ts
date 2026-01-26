/**
 * Custom hook to initialize Aptabase analytics
 * Based on: https://aptabase.com/blog/step-by-step-guide-setting-up-aptabase-docusaurus
 */
import { useEffect } from 'react';
import { init } from '@aptabase/web';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export const useAptabase = () => {
  const { siteConfig } = useDocusaurusContext();
  const { aptabaseAppKey, aptabaseHost } = (siteConfig?.customFields || {}) as {
    aptabaseAppKey?: string;
    aptabaseHost?: string;
  };

  useEffect(() => {
    // Only initialize on the client side
    if (typeof window !== 'undefined' && aptabaseAppKey) {
      init(aptabaseAppKey, {
        host: aptabaseHost || 'https://us.aptabase.com',
        isDebug: process.env.NODE_ENV !== 'production', // Enable debug logs in development
      });
    }
  }, [aptabaseAppKey, aptabaseHost]); // Re-run if key or host changes
};
