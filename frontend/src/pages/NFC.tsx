import { Smartphone } from 'lucide-react';

const NFC = () => {
  return (
    <div className="page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Smartphone size={40} color="var(--primary-color)" />
      </div>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>NFC Модуль</h1>
      <p style={{ opacity: 0.6, maxWidth: '280px', fontSize: '14px' }}>
        Данный раздел находится в разработке. Скоро здесь появится возможность работы с NFC метками.
      </p>
    </div>
  );
};

export default NFC;
