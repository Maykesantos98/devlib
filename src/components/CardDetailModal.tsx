import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { getInstallCommand } from './Dock';

interface CardDetailModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  if (!card) return null;

  const installCmd = getInstallCommand(card.title);

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  };

  const tags = (card.tags && card.tags.length) ? card.tags : (card.kind || '').split(' ');

  return (
    <dialog
      ref={dialogRef}
      className="card-detail-modal"
      id="cardDetailModal"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-box">
        <header className="modal-header">
          <div className="modal-header-meta">
            <span className="modal-meta-text" id="modalMeta">
              {card.meta || 'Biblioteca'}
            </span>
            {card.badge && (
              <span className="modal-badge-tag" id="modalBadge">
                {card.badge}
              </span>
            )}
          </div>
          <button className="modal-close" type="button" aria-label="Fechar" onClick={onClose}>
            &times;
          </button>
        </header>

        <div className="modal-body">
          <h2 className="modal-title" id="modalTitle">
            {card.title}
          </h2>
          <p className="modal-desc" id="modalDesc">
            {card.body}
          </p>
          <div className="modal-tags" id="modalTags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="modal-install-section" id="modalInstallSection">
            <h4>Instalação rápida:</h4>
            <div className="cmd-code-wrapper">
              <code id="modalInstallCode">{installCmd}</code>
              <button className={`btn-copy ${isCopied ? 'copied' : ''}`} onClick={handleCopy}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.586-1.414l-2.242-2.242A2 2 0 0 0 15.758 3H10a2 2 0 0 0-2 2z" />
                  <path d="M16 18H6a2 2 0 0 1-2-2V6" />
                </svg>
                <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <a className="modal-link-btn" id="modalLinkBtn" href={card.link_url} target="_blank" rel="noopener">
            Visitar repositório / site oficial
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </footer>
      </div>
    </dialog>
  );
};
