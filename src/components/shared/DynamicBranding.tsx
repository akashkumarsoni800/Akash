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

      const iconUrl = schoolLogo || '/logo.png';

      // 3. Dynamic Manifest Generation
        const generateManifest = () => {
          const manifest = {
            "name": schoolName,
            "short_name": schoolName.substring(0, 12),
            "description": `${schoolName} - Powered by Tekool`,
            "start_url": "./",
            "scope": "/",
            "display": "standalone",
            "orientation": "portrait",
            "background_color": "#ffffff",
            "theme_color": "#0f172a",
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
          const blob = new Blob([stringManifest], { type: 'application/manifest+json' });
          const manifestURL = URL.createObjectURL(blob);

          const manifestLink = document.getElementById('manifest-link');
          if (manifestLink) {
            manifestLink.setAttribute('href', manifestURL);
            console.log("Manifest link updated:", manifestURL);
          } else {
            console.warn("Manifest link element not found.");
          }

        // Update Favicon and Apple Touch Icon too
        const faviconLink = document.getElementById('favicon-link');
        if (faviconLink) {
          faviconLink.setAttribute('href', iconUrl);
          console.log("Favicon updated:", iconUrl);
        } else {
          console.warn("Favicon link element not found.");
        }

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

            if (data.logo_url !== cachedLogo || data.name !== cachedName) {
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
              setTimeout(() => updateBranding(), 100);
            }
          }
        } catch (err) {
          console.error("Branding sync failed:", err);
        }
      };

      console.log("Branding System: Active Logo", iconUrl);
      generateManifest();
      fetchLatestBranding();
    };

    // Run on mount
    updateBranding();

    // Listen for storage changes (school switch or same-tab dispatch)
    window.addEventListener('storage', updateBranding);

    // Periodic check for absolute certainty
    const interval = setInterval(updateBranding, 5000);

    return () => {
      window.removeEventListener('storage', updateBranding);
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default DynamicBranding;
