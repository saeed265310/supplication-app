
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ========================================
// PWA: Service Worker Registration
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// ========================================
// PWA: Install Prompt
// ========================================

let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();

  // Store the event so it can be triggered later
  deferredPrompt = e;

  // Show custom install banner
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('show');
  }

  console.log('[PWA] Install prompt available');
});

// Install button click handler
const installButton = document.getElementById('pwa-install-btn');
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response:', outcome);

    // Hide the banner
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
    }

    // Clear the deferredPrompt
    deferredPrompt = null;
  });
}

// Dismiss button click handler
const dismissButton = document.getElementById('pwa-dismiss-btn');
if (dismissButton) {
  dismissButton.addEventListener('click', () => {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
    }
  });
}

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');

  // Hide the banner
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.remove('show');
  }

  // Clear the deferredPrompt
  deferredPrompt = null;
});

// Detect if app is running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('[PWA] Running in standalone mode');
}

