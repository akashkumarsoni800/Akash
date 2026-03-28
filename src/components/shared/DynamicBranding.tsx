import { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const DynamicBranding = () => {
  useEffect(() => {
    let isSyncing = false;

    const applyBranding = (logoUrl: string, schoolName: string) => {
      const appTitle = document.getElementById('app-title');
      if (appTitle) appTitle.innerText = `Tekool | ${schoolName}`;
      else document.title = `Tekool | ${schoolName}`;

      const appleTitle = document.getElementById('apple-app-title');
      if (appleTitle) appleTitle.setAttribute('content', schoolName);

      const iconUrl = logoUrl || '/logo.png';

      const manifest = {
        name: schoolName,
        short_name: schoolName.substring(0, 12),
        description: `${schoolName} - Powered by Tekool`,
        start_url: './',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      };

      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      const manifestURL = URL.createObjectURL(blob);

      const manifestLink = document.getElementById('manifest-link');
      if (manifestLink) manifestLink.setAttribute('href', manifestURL);

      const faviconLink = document.getElementById('favicon-link');
      if (faviconLink) faviconLink.setAttribute('href', iconUrl);

      const appleIconLink = document.getElementById('apple-touch-icon');
      if (appleIconLink) appleIconLink.setAttribute('href', iconUrl);
    };

    const updateBranding = () => {
      const schoolName = localStorage.getItem('current_school_name') || 'Tekool';
      const schoolLogo = localStorage.getItem('current_school_logo') || '';
      applyBranding(schoolLogo, schoolName);
    };

    // Silent background DB sync — NO window.dispatchEvent to prevent infinite loops
    const syncBrandingFromDB = async () => {
      if (isSyncing) return;
      isSyncing = true;
      const schoolId = localStorage.getItem('current_school_id');
      if (!schoolId) { isSyncing = false; return; }

      try {
        const { data, error } = await supabase
          .from('schools')
          .select('name, logo_url')
          .eq('id', schoolId)
          .maybeSingle();

        if (data && !error) {
          const cachedLogo = localStorage.getItem('current_school_logo');
          const cachedName = localStorage.getItem('current_school_name');
          if (data.logo_url !== cachedLogo || data.name !== cachedName) {
            if (data.logo_url) localStorage.setItem('current_school_logo', data.logo_url);
            if (data.name) localStorage.setItem('current_school_name', data.name);
            // Apply directly — do NOT dispatch 'storage' event (causes infinite loop)
            applyBranding(data.logo_url || '', data.name || 'Tekool');
          }
        }
      } catch (_) {
        // Silent fail — branding is non-critical
      } finally {
        isSyncing = false;
      }
    };

    // Run on mount
    updateBranding();
    syncBrandingFromDB();

    // Only listen for storage events from OTHER tabs (cross-tab school switch)
    window.addEventListener('storage', updateBranding);

    // Sync from DB every 60 seconds (was 5s — too aggressive)
    const interval = setInterval(syncBrandingFromDB, 60000);

    return () => {
      window.removeEventListener('storage', updateBranding);
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default DynamicBranding;
