// 徽章图标名 -> lucide 组件映射（BadgesView / BadgeToast 共用）
import {
  Trophy, Flame, Clock, Ticket, Target, Dumbbell, BrickWall, Swords, Flag, Hand,
  Medal, Coins, Gem, Hourglass, Star, Moon, Sunrise, Fish, Tickets, Sofa, Laugh, Undo2, Sparkles,
} from 'lucide-react';

const BADGE_ICON_MAP = {
  trophy: Trophy,
  flame: Flame,
  clock: Clock,
  ticket: Ticket,
  target: Target,
  dumbbell: Dumbbell,
  'brick-wall': BrickWall,
  swords: Swords,
  flag: Flag,
  hand: Hand,
  medal: Medal,
  coins: Coins,
  gem: Gem,
  hourglass: Hourglass,
  star: Star,
  moon: Moon,
  sunrise: Sunrise,
  fish: Fish,
  tickets: Tickets,
  sofa: Sofa,
  laugh: Laugh,
  'undo-2': Undo2,
};

export function badgeIcon(name) {
  return BADGE_ICON_MAP[name] || Sparkles;
}
