import { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const DynamicBranding = () => {
  useEffect(() => {
    const updateBranding = () => {
      const schoolName = localStorage.getItem('current_school_name') || 'Tekool';
      const schoolLogo = localStorage.getItem('current_school_logo');
      const schoolCode = localStorage.getItem('current_school_code');

      // 1. Update Document Title
      const appTitle = document.getElementById('app-title');
      if (appTitle) {
        appTitle.innerText = `Tekool | ${schoolName}`;
      } else {
        document.title = `Tekool | ${schoolName}`;
      }

      // 2. Update Apple App Title
      const appleTitle = document.getElementById('apple-app-title');
      if (appleTitle) {
        appleTitle.setAttribute('content', schoolName);
      }

      // 3. Dynamic Manifest Generation
      const generateManifest = async () => {
        const iconUrl = schoolLogo || '/logo.png';

        const manifest = {
          "name": schoolName,
          "short_name": schoolName,
          "description": `${schoolName} - Powered by Tekool`,
          "start_url": window.location.origin + "/",
          "display": "standalone",
          "background_color": "#ffffff",
          "theme_color": "#ffffff",
          "icons": [
            {
              "src": iconUrl,
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "any maskable"
            },
            {
              "src": iconUrl,
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "any maskable"
            }
          ]
        };

        const stringManifest = JSON.stringify(manifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);

        const manifestLink = document.getElementById('manifest-link');
        if (manifestLink) {
          manifestLink.setAttribute('href', manifestURL);
        }

        // Update Favicon and Apple Touch Icon too
        const faviconLink = document.getElementById('favicon-link');
        if (faviconLink) faviconLink.setAttribute('href', iconUrl);

        const appleIconLink = document.getElementById('apple-touch-icon');
        if (appleIconLink) appleIconLink.setAttribute('href', iconUrl);
      };

      // 4. Silent Synchronization with Database
      const fetchLatestBranding = async () => {
        const schoolId = localStorage.getItem('current_school_id');
        if (!schoolId) return;

        try {
          const { data, error } = await supabase
            .from('schools')
            .select('name, logo_url')
            .eq('id', schoolId)
            .maybeSingle();

          if (data && !error) {
            const cachedLogo = localStorage.getItem('current_school_logo');
            const cachedName = localStorage.getItem('current_school_name');

            if (data.logo_url) {
              console.log("Branding Sync: New logo detected", data.logo_url);
              localStorage.setItem('current_school_logo', data.logo_url);
            }
            if (data.name) {
              console.log("Branding Sync: New name detected", data.name);
              localStorage.setItem('current_school_name', data.name);
            }
            // Dispatch manual storage event for same-tab reactivity
            window.dispatchEvent(new Event('storage'));
            updateBranding();
          }
        } catch (err) {
          console.error("Branding sync failed:", err);
        }
      };

      console.log("Setting PWA Icon:", iconUrl);
      generateManifest();
      fetchLatestBranding();
    };

    // Run on mount
    updateBranding();

    // Listen for storage changes (school switch)
    window.addEventListener('storage', updateBranding);

    // Also check every few seconds just in case (localStorage isn't reactive in same tab)
    const interval = setInterval(updateBranding, 3000);

    return () => {
      window.removeEventListener('storage', updateBranding);
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default DynamicBranding;
