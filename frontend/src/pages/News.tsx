import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { API_URL } from '../config';

interface Banner {
  id: number;
  image_url: string;
  link_url: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

const News = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, postsRes] = await Promise.all([
          fetch(`${API_URL}/news/banners`),
          fetch(`${API_URL}/news/posts`)
        ]);
        const bannersData = await bannersRes.json();
        const postsData = await postsRes.json();
        if (bannersData.banners) setBanners(bannersData.banners);
        if (postsData.posts) setPosts(postsData.posts);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Banner carousel effect
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Newspaper size={32} color="var(--primary-color)" />
          Новости
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Будьте в курсе последних событий</p>
      </div>

      {/* Banners Carousel */}
      {banners.length > 0 && (
        <div style={{ position: 'relative', width: '100%', height: '220px', marginBottom: '32px', overflow: 'hidden' }}>
          {banners.map((banner, idx) => (
            <div 
              key={banner.id}
              onClick={() => { if (banner.link_url) window.location.href = banner.link_url; }}
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                opacity: idx === currentBanner ? 1 : 0,
                transform: `translateX(${(idx - currentBanner) * 100}%)`,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: banner.link_url ? 'pointer' : 'default',
                backgroundImage: `url(${banner.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 -50px 50px -20px rgba(0,0,0,0.8)'
              }}
            >
              {banner.link_url && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
                   <ExternalLink size={16} color="white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Carousel dots */}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {banners.map((_, idx) => (
                <div 
                  key={idx}
                  style={{
                    width: idx === currentBanner ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: idx === currentBanner ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Последние посты</h3>
        
        {posts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', opacity: 0.7 }}>
            <Newspaper size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <p>Новостей пока нет.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <div key={post.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {post.image_url && (
                  <div style={{ 
                    width: '100%', 
                    height: '180px', 
                    backgroundImage: `url(${post.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }} />
                )}
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', lineHeight: '1.3' }}>{post.title}</h4>
                  {post.content && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
