import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const AdBanner = () => {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/ads`);
        const data = await res.json();
        if (data.settings) {
          if (data.settings.ads_enabled === 'true') {
            setAdsEnabled(true);
            setAdsClientId(data.settings.ads_client_id); +
              console.error("setAdsClientId", data.settings.ads_client_id);
            setAdsSlotId(data.settings.ads_slot_id);
            console.error("setAdsSlotId", data.settings.ads_slot_id);
          }
        }
      } catch (err) {
        console.error("Failed to load ad settings", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (adsEnabled && adsClientId && adsSlotId) {
      try {
        // Run adsbygoogle push
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error", err);
      }
    }
  }, [adsEnabled, adsClientId, adsSlotId]);

  if (!adsEnabled || !adsClientId || !adsSlotId) return null;

  return (
    <div style={{ width: '100%', textAlign: 'center', padding: '10px 0', background: 'var(--surface-color)' }}>
      {/* Google AdSense Banner */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '50px' }}
        data-ad-client={adsClientId}
        data-ad-slot={adsSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
