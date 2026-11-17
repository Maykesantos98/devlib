import {
  Atom,
  Bot,
  BookOpen,
  Boxes,
  Database,
  FlaskConical,
  Folder,
  LineChart,
  Plug,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkle,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CategoryId } from '../lib/schema';

export type ContentIconKind = 'library' | 'recipe' | 'guide' | 'category' | 'action' | 'series';

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  'ai-agents': Bot,
  mcp: Plug,
  'frontend-ui': Sparkle,
  'frontend-frameworks': Atom,
  'backend-data': Database,
  'backend-toolkit': Wrench,
  'mobile-ai': Smartphone,
  security: ShieldCheck,
  devops: Rocket,
  'trade-quant': LineChart,
};

const CONTENT_ICONS: Record<ContentIconKind, LucideIcon> = {
  library: Boxes,
  recipe: FlaskConical,
  guide: BookOpen,
  category: Folder,
  action: Sparkle,
  series: BookOpen,
};

interface IconProps {
  id?: CategoryId;
  kind?: ContentIconKind;
  className?: string;
  size?: number;
}

export function CategoryIcon({ id, className, size = 16 }: IconProps) {
  const Icon = id ? CATEGORY_ICONS[id] : Folder;
  return <Icon className={className} size={size} aria-hidden="true" strokeWidth={1.9} />;
}

export function ContentIcon({ kind = 'library', className, size = 16 }: IconProps) {
  const Icon = CONTENT_ICONS[kind];
  return <Icon className={className} size={size} aria-hidden="true" strokeWidth={1.9} />;
}
