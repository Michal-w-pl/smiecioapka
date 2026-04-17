import { ScheduleEntry } from '@/lib/types';

export const DEMO_SCHEDULES: Record<string, ScheduleEntry[]> = {
  'warszawa|mokotow': [
    { date: '2026-04-20', fraction: 'Zmieszane' },
    { date: '2026-04-21', fraction: 'Bio' },
    { date: '2026-04-23', fraction: 'Papier' },
    { date: '2026-04-24', fraction: 'Szkło' },
    { date: '2026-04-25', fraction: 'Metale i tworzywa' },
  ],
  'paszowice|paszowice': [
    { date: '2026-04-21', fraction: 'Zmieszane' },
    { date: '2026-04-21', fraction: 'Bio' },
    { date: '2026-04-28', fraction: 'Papier' },
    { date: '2026-04-28', fraction: 'Szkło' },
  ],
  'kobylka|kobylka': [
    { date: '2026-04-18', fraction: 'Zmieszane' },
    { date: '2026-04-22', fraction: 'Bio' },
    { date: '2026-04-29', fraction: 'Szkło' },
  ],
};
