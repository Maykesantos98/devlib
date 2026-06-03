/**
 * React 19 lifts <title> and <meta> to <head> automatically when rendered.
 * No react-helmet needed.
 */
interface SeoProps {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}

export function Seo({ title, description, ogImage, canonical }: SeoProps) {
  const fullTitle = title.includes('DEVLIB') ? title : `${title} · DEVLIB`;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <link rel="canonical" href={canonical} />}
    </>
  );
}
