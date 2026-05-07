import React from 'react';
import { Chip } from '@/components/Chip';

type Status = 'want' | 'watching' | 'watched' | 'dropped';

const MAP: Record<Status, { label: string; tone: 'yellow' | 'blue' | 'orange' | undefined }> = {
  want:     { label: 'Хочу',         tone: 'yellow' },
  watching: { label: 'Смотрю',       tone: 'blue' },
  watched:  { label: 'Просмотрено',  tone: 'orange' },
  dropped:  { label: 'Исключён',     tone: undefined },
};

export function StatusPill({ status }: { status: Status }) {
  const m = MAP[status] ?? MAP.want;
  return <Chip label={m.label} tone={m.tone} />;
}
