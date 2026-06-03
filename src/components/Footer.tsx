import React from 'react';

interface FooterProps {
  onOpenCmdk: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCmdk }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid footer-menu">
          <div className="footer-brand">
            <img className="footer-logo" src="/logo.png" alt="DEVLIB — Bibliotecas para desenvolvedores" width="118" height="64" decoding="async" loading="lazy" />
            <p>Acervo curado de 133 bibliotecas, protocolos e skills para quem constrói com agentes. Modularizado em React e Vite.</p>
            <button className="footer-command" type="button" onClick={onOpenCmdk}>Search <kbd>⌘K</kbd></button>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#acervo">Todos os componentes</a></li>
              <li><a href="#interface-components">Interface &amp; UI kits</a></li>
              <li><a href="#agentes">Agentes</a></li>
              <li><a href="#mcp">MCP</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Build</h4>
            <ul>
              <li><a href="#server-db">Backend stack</a></li>
              <li><a href="#seguranca">Segurança</a></li>
              <li><a href="#build">Build &amp; observability</a></li>
              <li><a href="#apps">Apps &amp; produtos</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Reference</h4>
            <ul>
              <li><a href="#indice">Índice</a></li>
              <li><a href="#metodo">Método</a></li>
              <li><a href="#trade">Trade</a></li>
              <li><a href="jogos.html">Arcade · Jogos</a></li>
              <li><a href="#top">Voltar ao topo</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-base">
          <span>© {currentYear} · DEVLIB — Edição 03 (React)</span>
          <span>Arquitetura de Componentes · Sem tracker · Compilado via Vite</span>
        </div>
      </div>
    </footer>
  );
};
