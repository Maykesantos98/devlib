/**
 * Baixa loops de fundo do Pixabay para o hero.
 *
 * Regras deste projeto:
 *   - Nenhuma pessoa identificável, nenhuma marca. A licença do Pixabay exige
 *     model release para uso comercial com rostos, e a responsabilidade é de
 *     quem publica.
 *   - Resolução pequena de propósito. O vídeo aparece desfocado, escurecido e
 *     atrás do texto; 1080p só adicionaria megabytes invisíveis.
 *   - Créditos gravados em public/video/CREDITS.md.
 *
 * Uso: node scripts/fetch-video-bg.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = 'public/video';

/** Acima disto o loop não vale o custo de banda. */
const MAX_BYTES = 1_400_000;

// Um loop só. Cada clipe custa ~1,2 MB; dois seriam o dobro do peso da página
// inteira em troca de nada, já que apenas o hero usa vídeo.
const QUERIES = [{ slug: 'hero-loop', q: 'abstract particles dark' }];

async function loadKey() {
  const env = await readFile('.env', 'utf8');
  const key = env.match(/PIXABAY_API_KEY=(.+)/)?.[1]?.trim();
  if (!key) throw new Error('PIXABAY_API_KEY ausente em .env');
  return key;
}

async function search(key, q) {
  const url = new URL('https://pixabay.com/api/videos/');
  url.searchParams.set('key', key);
  url.searchParams.set('q', q);
  url.searchParams.set('safesearch', 'true');
  url.searchParams.set('per_page', '20');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay ${res.status} para "${q}"`);

  const { hits } = await res.json();
  if (!hits?.length) throw new Error(`Sem resultados para "${q}"`);
  return hits;
}

/** Menor variante que ainda tem largura utilizável, dentro do teto de bytes. */
function pickVariant(hit) {
  const order = ['tiny', 'small', 'medium', 'large'];
  for (const name of order) {
    const v = hit.videos?.[name];
    if (!v?.url) continue;
    if (v.size && v.size > MAX_BYTES) continue;
    if (v.width && v.width < 480) continue;
    return { name, ...v };
  }
  return null;
}

const key = await loadKey();
await mkdir(OUT_DIR, { recursive: true });

const rows = [];

for (const { slug, q } of QUERIES) {
  const hits = await search(key, q);

  let chosen = null;
  for (const hit of hits) {
    const variant = pickVariant(hit);
    if (variant) {
      chosen = { hit, variant };
      break;
    }
  }

  if (!chosen) {
    console.warn(`pulado: "${q}" — nenhum resultado abaixo de ${MAX_BYTES} bytes`);
    continue;
  }

  const { hit, variant } = chosen;

  const res = await fetch(variant.url);
  if (!res.ok) throw new Error(`Download falhou: ${variant.url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `${slug}.mp4`), bytes);

  // Poster: a API entrega o still da própria variante. Sem ele o hero pisca
  // preto até o primeiro frame decodificar.
  const posterUrl = variant.thumbnail;
  if (!posterUrl) throw new Error(`Sem thumbnail para "${slug}" — o poster é obrigatório`);

  const poster = await fetch(posterUrl);
  if (!poster.ok) throw new Error(`Poster falhou (${poster.status}): ${posterUrl}`);
  await writeFile(join(OUT_DIR, `${slug}.jpg`), Buffer.from(await poster.arrayBuffer()));

  const kb = Math.round(bytes.length / 1024);
  rows.push(`| \`${slug}.mp4\` | ${q} | ${variant.name} ${variant.width}×${variant.height} | ${kb} kB | ${hit.user} | ${hit.pageURL} |`);
  console.log(`ok  ${slug}.mp4  ${variant.name} ${variant.width}x${variant.height}  ${kb} kB  <- ${hit.user}`);
}

await writeFile(
  join(OUT_DIR, 'CREDITS.md'),
  [
    '# Créditos de vídeo',
    '',
    'Pixabay Content License. Uso comercial livre, atribuição não exigida —',
    'registrada aqui por higiene. Nenhum clipe contém pessoa identificável.',
    '',
    '| Arquivo | Busca | Variante | Peso | Autor | Origem |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n'),
);

console.log(`\n${rows.length} loop(s) em ${OUT_DIR}/`);
