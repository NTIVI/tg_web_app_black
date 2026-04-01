interface UserListProps {
  users: any[];
  onUpdateBalance: (id: string, amount: string, action: 'add' | 'remove') => void;
}

const UserList = ({ users, onUpdateBalance }: UserListProps) => {
  if (users.length === 0) return <p>No users yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {users.map(u => (
        <div key={u.telegram_id} className="glass-panel" style={{ padding: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>
                {u.first_name} {u.last_name} 
                <span style={{ fontWeight: 'normal', color: 'var(--primary-color)', marginLeft: '8px', fontSize: '14px' }}>
                  @{u.username || 'no_username'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ID: {u.telegram_id}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--gold-color)', fontWeight: 'bold', fontSize: '16px' }}>{u.balance} Coins</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Balance</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Contact Info</div>
              <div style={{ color: 'white' }}>📞 {u.phone || 'Not set'}</div>
              <div style={{ color: 'white' }}>✉️ {u.email || 'Not set'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Activity Log</div>
              <div style={{ color: 'white' }}>Joined: {new Date(u.registered_at).toLocaleDateString()}</div>
              <div style={{ color: 'white' }}>Seen: {new Date(u.last_seen).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="Amount" 
              id={`balance-input-${u.telegram_id}`}
              style={{ 
                width: '80px', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '6px 10px', 
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button 
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: '12px', background: '#4caf50' }}
              onClick={() => {
                const input = document.getElementById(`balance-input-${u.telegram_id}`) as HTMLInputElement;
                onUpdateBalance(u.telegram_id, input.value, 'add');
                input.value = '';
              }}
            >
              + Add
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: '12px', background: '#f44336' }}
              onClick={() => {
                const input = document.getElementById(`balance-input-${u.telegram_id}`) as HTMLInputElement;
                onUpdateBalance(u.telegram_id, input.value, 'remove');
                input.value = '';
              }}
            >
              - Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;
