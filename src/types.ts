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
}

export interface ChapterData {
  id: string;
  chapter: string;
  num: string;
  title: string;
  count: string;
  cards: CardData[];
}
