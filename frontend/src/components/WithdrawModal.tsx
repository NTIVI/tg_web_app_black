import React, { useState } from 'react';
import { X, HandCoins, Gem, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    adamants: number;
    setAdamants: (val: number | ((prev: number) => number)) => void;
}

const MIN_WITHDRAW = 5;

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, adamants, setAdamants }) => {
    const [amount, setAmount] = useState<number>(MIN_WITHDRAW);
    const [payoutInfo, setPayoutInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleWithdraw = async () => {
        if (amount < MIN_WITHDRAW) {
            setError(`Минимальная сумма вывода: ${MIN_WITHDRAW} адамантов`);
            return;
        }
        if (!payoutInfo.trim()) {
            setError('Введите реквизиты для выплаты');
            return;
        }
        if (adamants < amount) {
            setError('Недостаточно адамантов');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ amount, payoutInfo })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.success) {
                setAdamants(data.adamants);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                }, 2000);
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

                {success ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid var(--success-color)' }}>
                            <CheckCircle2 size={48} color="var(--success-color)" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Заявка принята!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Ваша заявка на вывод будет обработана администратором в ближайшее время.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(30, 64, 175, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid var(--primary-color)' }}>
                                <HandCoins size={32} color="var(--primary-color)" />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Вывод средств</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Минимум для вывода: {MIN_WITHDRAW} адамантов</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', marginBottom: '24px', background: 'rgba(0, 242, 255, 0.05)', border: '1px solid rgba(0, 242, 255, 0.1)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>У вас в наличии</div>
                            <div style={{ color: '#00f2ff', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Gem size={24} /> {adamants}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Сумма вывода (в адамантах):</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(Number(e.target.value))}
                                style={{ width: '100%', height: '48px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '0 16px', fontSize: '16px' }}
                                min={MIN_WITHDRAW}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Реквизиты (Карта / СБП / USDT):</label>
                            <textarea 
                                value={payoutInfo} 
                                onChange={(e) => setPayoutInfo(e.target.value)}
                                placeholder="Введите номер карты или адрес кошелька..."
                                style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '12px 16px', fontSize: '14px', resize: 'none' }}
                            />
                        </div>

                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>К выплате (~):</span>
                                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--success-color)' }}>
                                    {amount * 100} ₽
                                </span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>* окончательная сумма уточняется админом</div>
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
                            onClick={handleWithdraw}
                            disabled={loading || adamants < amount}
                        >
                            {loading ? 'Отправка...' : 'Создать заявку'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default WithdrawModal;
