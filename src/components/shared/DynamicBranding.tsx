import { useEffect } from 'react';

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

      generateManifest();
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
