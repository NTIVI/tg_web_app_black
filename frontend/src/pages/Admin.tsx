import { useState, useEffect } from 'react';

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'purchases'>('purchases');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, purchasesRes] = await Promise.all([
          fetch('https://tg-web-app-black.onrender.com/api/admin/users'),
          fetch('https://tg-web-app-black.onrender.com/api/admin/purchases')
        ]);
        
        const usersData = await usersRes.json();
        const purchasesData = await purchasesRes.json();
        
        setUsers(usersData.users || []);
        setPurchases(purchasesData.purchases || []);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]); // Refresh on tab switch

  if (isLoading) return <div className="page"><div className="loader-container"><div className="spinner"></div></div></div>;

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <p>Manage users and purchases.</p>

      <div style={{ display: 'flex', gap: '8px', marginTop: '24px', marginBottom: '24px' }}>
        <button 
          className={`btn-primary ${activeTab === 'purchases' ? '' : 'inactive'}`} 
          style={{ flex: 1, background: activeTab === 'purchases' ? 'var(--primary-color)' : 'var(--surface-color)' }}
          onClick={() => setActiveTab('purchases')}
        >
          Purchases
        </button>
        <button 
          className={`btn-primary ${activeTab === 'users' ? '' : 'inactive'}`} 
          style={{ flex: 1, background: activeTab === 'users' ? 'var(--primary-color)' : 'var(--surface-color)' }}
          onClick={() => setActiveTab('users')}
        >
          Users Data
        </button>
      </div>

      <div className="glass-panel">
        {activeTab === 'purchases' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Purchases</h2>
            {purchases.length === 0 ? <p>No purchases yet.</p> : (
              <ul style={{ listStyle: 'none' }}>
                {purchases.map(p => (
                  <li key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'white' }}>{p.item_name}</strong>
                      <span style={{ color: 'var(--gold-color)' }}>{p.price} Coins</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      By @{p.username} (ID: {p.telegram_id}) • {new Date(p.purchased_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Registered Users</h2>
            {users.length === 0 ? <p>No users yet.</p> : (
              <ul style={{ listStyle: 'none' }}>
                {users.map(u => (
                  <li key={u.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'white' }}>@{u.username}</strong>
                      <span style={{ color: 'var(--gold-color)' }}>Bal: {u.balance}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ID: {u.telegram_id} <br/>
                      Phone: {u.phone || 'Not set'} • Email: {u.email || 'Not set'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
