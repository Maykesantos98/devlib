/**
 * Editorial principles — kept as static content; rarely changes.
 */
export function Method() {
  return (
    <section className="method shell" id="metodo" aria-labelledby="metodo-title">
      <span className="section-eyebrow">— Método</span>
      <h2 className="section-title" id="metodo-title">
        Como <em>usamos.</em>
      </h2>
      <p className="section-desc">
        Quatro princípios que organizam o uso deste acervo no dia a dia. Pequenos hábitos, grande
        diferença na qualidade do que entregamos.
      </p>

      <ol className="principles">
        <li className="principle">
          <span className="principle-num">01</span>
          <h3>Pesquise antes de codar.</h3>
          <p>
            Use Context7 ou docs oficiais para confirmar APIs, versões e exemplos atuais antes de
            qualquer implementação.
          </p>
        </li>
        <li className="principle">
          <span className="principle-num">02</span>
          <h3>Verifique com docs ao vivo.</h3>
          <p>
            Treine ceticismo: bibliotecas evoluem, e código baseado em versões antigas é fonte
            comum de bugs sutis.
          </p>
        </li>
        <li className="principle">
          <span className="principle-num">03</span>
          <h3>Teste como o usuário.</h3>
          <p>
            Use webapp-testing ou Playwright para validar o fluxo real no navegador antes de
            declarar pronto.
          </p>
        </li>
        <li className="principle">
          <span className="principle-num">04</span>
          <h3>Entregue em passos pequenos.</h3>
          <p>
            Commits atômicos, deploys focados, rollback fácil. A coreografia invisível que mantém
            o produto vivo.
          </p>
        </li>
      </ol>
    </section>
  );
}
