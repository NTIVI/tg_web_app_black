interface PurchaseListProps {
  purchases: any[];
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const PurchaseList = ({ purchases, onUpdateStatus, onDelete }: PurchaseListProps) => {
  if (purchases.length === 0) return <p>No purchases yet.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {purchases.map(p => (
        <li key={p._id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ color: 'white', fontSize: '16px' }}>{p.item_name}</strong>
            <span style={{ color: p.status === 'approved' ? '#4caf50' : p.status === 'rejected' ? '#f44336' : 'var(--gold-color)', fontWeight: 'bold' }}>
              {p.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            By @{p.username} (ID: {p.telegram_id}) • {new Date(p.purchased_at).toLocaleString()}
          </div>
          {p.status !== 'approved' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#4caf50', flex: 1 }}
                onClick={() => onUpdateStatus(p._id, 'approved')}
              >
                Confirm
              </button>
              <button 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#f44336', flex: 1 }}
                onClick={() => onDelete(p._id)}
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default PurchaseList;
