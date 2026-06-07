/**
 * FileFlux — Analytics Client
 * Lightweight, privacy-respecting analytics helper.
 */

const ANALYTICS_URL = 'https://fileflux-dashboard.vercel.app/api/analytics';

export const Analytics = {
  track(event, data = {}) {
    chrome.runtime.sendMessage({ action: 'trackEvent', event, data }).catch(() => {});
  }
};
