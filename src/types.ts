export interface CardData {
  title: string;
  classes: string;
  kind: string;
  tone: string;
  meta: string;
  badge: string;
  body: string;
  tags: string[];
  link_text: string;
  link_url: string;
  /** v05: slug of the underlying Library MDX, used to route to /biblioteca/:slug */
  slug?: string;
}

export interface ChapterData {
  id: string;
  chapter: string;
  num: string;
  title: string;
  count: string;
  cards: CardData[];
}
