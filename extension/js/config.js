/**
 * FILEFLUX EXTENSION CONFIGURATION
 * 
 * USER: Edit this file to point the extension to your deployed Vercel dashboard.
 * If you haven't deployed the dashboard yet, leave these as they are, 
 * but analytics and feedback will not be saved.
 */

export const CONFIG = {
  // 1. Replace with your actual Vercel Dashboard URL
  // Example: 'https://fileflux-dashboard-yourname.vercel.app'
  DASHBOARD_URL: 'https://fileflus-22t7enx8n-evil-monk-s-projects.vercel.app/',

  // Note: No trailing slash (/) at the end of the URL
};

export function getApiUrl(endpoint) {
  return `${CONFIG.DASHBOARD_URL}${endpoint}`;
}
