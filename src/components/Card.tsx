import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { CardData } from '../types';

interface CardProps {
  data: CardData;
  isInStack: boolean;
  onToggleStack: (title: string) => void;
  onClick: () => void;
}

const getCompatBadges = (tags: string[] = [], kind: string = '') => {
  const compat: string[] = [];
  const allTags = [...tags, kind].map(t => t.toLowerCase());
  
  if (allTags.some(t => t.includes('python') || t.includes('pip') || t.includes('fastmcp'))) compat.push('Python');
  if (allTags.some(t => t.includes('typescript') || t.includes('ts') || t.includes('npm') || t.includes('react') || t.includes('node') || t.includes('next.js'))) compat.push('Node.js');
  if (allTags.some(t => t.includes('rust') || t.includes('cargo') || t.includes('rs'))) compat.push('Rust');
  if (allTags.some(t => t.includes('go') || t.includes('golang'))) compat.push('Go');
  
  // Default fallback if nothing else matches
  if (compat.length === 0) compat.push('Web');
  
  return compat;
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14
    }
  }
};

export const Card: React.FC<CardProps> = ({ data, isInStack, onToggleStack, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleCardActivate = () => {
    if (data.slug) {
      // v05: card click navigates to permalink detail page.
      navigate(`/biblioteca/${data.slug}`);
    } else {
      // Fallback for items without an MDX slug — open legacy modal.
      onClick();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    // Respect reduced-motion: skip the 3D tilt entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = card.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    const px = lx / rect.width;
    const py = ly / rect.height;

    const TILT_DEG = 6;
    card.style.setProperty('--rx', `${(py - 0.5) * -TILT_DEG}deg`);
    card.style.setProperty('--ry', `${(px - 0.5) * TILT_DEG}deg`);
    card.style.setProperty('--mx', `${lx}px`);
    card.style.setProperty('--my', `${ly}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--mx', '-200px');
    card.style.setProperty('--my', '-200px');
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStack(data.title);
  };

  const style = {
    transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(0px)',
    transition: 'transform 0.15s ease-out, border-color var(--dur-fast), box-shadow var(--dur-fast)',
  } as React.CSSProperties;

  const tags = (data.tags && data.tags.length) ? data.tags : (data.kind || '').split(' ');
  const compatBadges = getCompatBadges(data.tags, data.kind);

  return (
    <motion.article
      ref={cardRef}
      className={`card in ${data.classes}`}
      data-kind={data.kind}
      data-tone={data.tone}
      style={style}
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardActivate}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardActivate();
        }
      }}
    >
      <button
        className={`card-stack-add-btn ${isInStack ? 'in-stack' : ''}`}
        onClick={handleAddClick}
        aria-label={isInStack ? 'Remover da Stack' : 'Adicionar à Stack'}
        title={isInStack ? 'Remover da Stack' : 'Adicionar à Stack'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {isInStack ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M12 5v14M5 12h14" />
          )}
        </svg>
      </button>

      <div className="card-head">
        <span className="card-meta">
          <span className="dot"></span>
          {data.meta || data.kind}
        </span>
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {compatBadges.map((badgeText, idx) => (
            <span 
              key={idx} 
              className="card-badge" 
              style={{ 
                fontSize: '0.62rem', 
                padding: '0.15rem 0.4rem', 
                border: '1px solid var(--border-bright)',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-soft)'
              }}
            >
              {badgeText}
            </span>
          ))}
          {data.badge && <span className="card-badge">{data.badge}</span>}
        </div>
      </div>

      <h3 className="card-title">{data.title}</h3>
      <p className="card-body">{data.body}</p>

      <div className="card-tags">
        {tags.map((tag, idx) => (
          <span key={idx}>{tag}</span>
        ))}
      </div>

      <div className="card-spotlight" aria-hidden="true" />
      <div className="card-visual" aria-hidden="true" />
    </motion.article>
  );
};
