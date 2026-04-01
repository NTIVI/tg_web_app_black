interface AdsConfigProps {
  adsEnabled: boolean;
  setAdsEnabled: (v: boolean) => void;
  adsClientId: string;
  setAdsClientId: (v: string) => void;
  adsSlotId: string;
  setAdsSlotId: (v: string) => void;
  adsgramBlockId: string;
  setAdsgramBlockId: (v: string) => void;
  rewardedAdProvider: 'adsgram' | 'google';
  setRewardedAdProvider: (v: 'adsgram' | 'google') => void;
  onSave: () => void;
  saveMessage: string;
}

const AdsConfig = ({
  adsEnabled, setAdsEnabled,
  adsClientId, setAdsClientId,
  adsSlotId, setAdsSlotId,
  adsgramBlockId, setAdsgramBlockId,
  rewardedAdProvider, setRewardedAdProvider,
  onSave, saveMessage
}: AdsConfigProps) => {
  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Google AdSense Configuration</h2>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={adsEnabled} 
            onChange={(e) => setAdsEnabled(e.target.checked)} 
            style={{ width: '20px', height: '20px', accentColor: 'var(--primary-color)' }}
          />
          Enable Google Ads
        </label>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Client ID (e.g., ca-pub-12345...)</label>
        <input 
          type="text" 
          className="input-field" 
          value={adsClientId} 
          onChange={(e) => setAdsClientId(e.target.value)} 
          placeholder="ca-pub-XXXXXXXXX" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Slot ID</label>
        <input 
          type="text" 
          className="input-field" 
          value={adsSlotId} 
          onChange={(e) => setAdsSlotId(e.target.value)} 
          placeholder="1234567890" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }}
        />
      </div>
      <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--gold-color)' }}>Rewarded Ad Provider</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="provider" value="adsgram" checked={rewardedAdProvider === 'adsgram'} onChange={() => setRewardedAdProvider('adsgram')} />
            AdsGram
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="provider" value="google" checked={rewardedAdProvider === 'google'} onChange={() => setRewardedAdProvider('google')} />
            Google Ads (H5)
          </label>
        </div>
        
        {rewardedAdProvider === 'adsgram' ? (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>AdsGram Block ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={adsgramBlockId} 
              onChange={(e) => setAdsgramBlockId(e.target.value)} 
              placeholder="int-XXXXXX" 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }}
            />
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Google AdSense H5 Rewarded Ads will use the <strong>Client ID</strong> and <strong>Slot ID</strong> provided above.
          </p>
        )}
      </div>
      <button className="btn-primary" onClick={onSave} style={{ width: '100%' }}>Save Ads Settings</button>
      {saveMessage && <p style={{ color: '#4caf50', marginTop: '12px', textAlign: 'center' }}>{saveMessage}</p>}
    </div>
  );
};

export default AdsConfig;
