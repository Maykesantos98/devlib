declare module 'virtual:content-frontmatter' {
  interface ContentManifest {
    libraries: unknown[];
    recipes: unknown[];
    guides: unknown[];
  }
  const manifest: ContentManifest;
  export default manifest;
}
