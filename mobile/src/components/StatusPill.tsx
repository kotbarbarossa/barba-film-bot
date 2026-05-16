import React from 'react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/Chip';

type Status = 'want' | 'watching' | 'watched' | 'dropped';

const TONE: Record<Status, 'yellow' | 'blue' | 'orange' | undefined> = {
  want:     'yellow',
  watching: 'blue',
  watched:  'orange',
  dropped:  undefined,
};

const KEY: Record<Status, string> = {
  want:     'status.want',
  watching: 'status.watching',
  watched:  'status.watched',
  dropped:  'status.dropped',
};

export function StatusPill({ status, size }: { status: Status; size?: number }) {
  const { t } = useTranslation();
  return <Chip label={t(KEY[status])} tone={TONE[status]} size={size} />;
}
