import React, { useState } from 'react';
import { X, ArrowRightLeft, Gem, Wallet, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

interface ExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
    setBalance: (val: number | ((prev: number) => number)) => void;
    setAdamants: (val: number | ((prev: number) => number)) => void;
}

const ADAMANTS_PRICE = 10000; // 10,000 cents = 1 adamant

const ExchangeModal: React.FC<ExchangeModalProps> = ({ isOpen, onClose, balance, setBalance, setAdamants }) => {
    const [amount, setAmount] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const totalCost = amount * ADAMANTS_PRICE;
    const canAfford = balance >= totalCost;

    const handleExchange = async () => {
        if (!canAfford) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/exchange/adamants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.success) {
                setBalance(data.balance);
                setAdamants(data.adamants);
                onClose();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="glass-panel modal-content" style={{ padding: '24px', position: 'relative', maxWidth: '400px', width: '90%' }}>
                <button 
                  onClick={onClose} 
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid var(--primary-color)' }}>
                        <ArrowRightLeft size={32} color="var(--primary-color)" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Обмен валюты</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Обменивайте монеты на премиум адаманты</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div className="glass-panel" style={{ padding: '12px', margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>У вас есть</div>
                        <div style={{ color: 'var(--gold-color)', fontWeight: '800' }}>${(balance / 100).toFixed(2)}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '12px', margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Курс 1 шт.</div>
                        <div style={{ color: 'var(--primary-color)', fontWeight: '800' }}>$100.00</div>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Количество адамантов:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            className="btn-secondary-luxury" 
                            style={{ width: '48px', height: '48px', padding: 0 }}
                            onClick={() => setAmount(Math.max(1, amount - 1))}
                        >-</button>
                        <div style={{ flex: 1, height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {amount}
                        </div>
                        <button 
                            className="btn-secondary-luxury" 
                            style={{ width: '48px', height: '48px', padding: 0 }}
                            onClick={() => setAmount(amount + 1)}
                        >+</button>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Стоимость:</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: canAfford ? '#fff' : 'var(--error-color)' }}>
                            ${(totalCost / 100).toFixed(2)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>К получению:</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#00f2ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Gem size={14} /> {amount} шт.
                        </span>
                    </div>
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)', fontSize: '13px', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <button 
                    className="btn-primary" 
                    style={{ width: '100%', height: '54px' }}
                    onClick={handleExchange}
                    disabled={!canAfford || loading}
                >
                    {loading ? 'Обработка...' : 'Подтвердить обмен'}
                </button>
            </div>
        </div>
    );
};

export default ExchangeModal;
