import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const AdBanner = () => {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [bannerId, setBannerId] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/ads`);
        const data = await res.json();
        if (data.settings) {
          if (data.settings.ads_enabled === 'true') {
            setAdsEnabled(true);
            setBannerId(data.settings.adsgram_banner_id || 'task-26664');
          }
        }
      } catch (err) {
        console.error("Failed to load ad settings", err);
      }
    };
    fetchSettings();
  }, []);

  if (!adsEnabled || !bannerId) return null;

  return (
    <div style={{ width: '100%', textAlign: 'center', padding: '10px 0', background: 'var(--surface-color)' }}>
      {/* Adsgram Task Banner */}
      {/* @ts-ignore */}
      <adsgram-task
        data-block-id={bannerId}
        style={{ display: 'inline-block' }}
      >
        <span slot="reward">50 coins</span>
        <div slot="button">Go</div>
        <div slot="claim">Claim</div>
        <div slot="done">Done</div>
      {/* @ts-ignore */}
      </adsgram-task>
    </div>
  );
};

export default AdBanner;
