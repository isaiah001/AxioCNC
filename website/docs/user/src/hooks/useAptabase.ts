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
    if (typeof window !== 'undefined') {
      if (aptabaseAppKey && aptabaseAppKey.trim()) {
        try {
          init(aptabaseAppKey.trim(), {
            host: aptabaseHost || 'https://us.aptabase.com',
            isDebug: process.env.NODE_ENV !== 'production', // Enable debug logs in development
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Aptabase] Initialized for user_docs site', {
              hasKey: !!aptabaseAppKey,
              keyLength: aptabaseAppKey?.length,
              host: aptabaseHost || 'https://us.aptabase.com',
            });
          }
        } catch (error) {
          console.error('[Aptabase] Failed to initialize:', error);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Aptabase] No app key provided for user_docs site');
        }
      }
    }
  }, [aptabaseAppKey, aptabaseHost]); // Re-run if key or host changes
};
