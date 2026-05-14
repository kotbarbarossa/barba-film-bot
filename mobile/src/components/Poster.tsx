import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

type Props = {
  width?: number;
  height?: number;
  aspectRatio?: number;
  label?: string;
  posterUrl?: string | null;
  style?: ViewStyle;
};

export function Poster({ width, height, aspectRatio = 2 / 3, label, posterUrl, style }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('poster.placeholder');
  return (
    <View
      style={[
        styles.root,
        {
          width: width ?? '100%',
          height,
          aspectRatio: height ? undefined : aspectRatio,
          backgroundColor: theme.paper2,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          <View style={[styles.stripes, { borderColor: theme.shade2 }]} pointerEvents="none" />
          <View style={[styles.label, { backgroundColor: theme.paper, borderColor: theme.line }]}>
            <Text style={[styles.labelText, { color: theme.inkFaint }]}>{resolvedLabel}</Text>
          </View>
        </>
      )}
    </View>
  );
}

type PendingMissingProps = {
  width?: number;
  height?: number;
  aspectRatio?: number;
  compact?: boolean;
  style?: ViewStyle;
};

export function PosterPending({ width, height, aspectRatio = 2 / 3, compact = false, style }: PendingMissingProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.root,
        {
          width: width ?? '100%',
          height,
          aspectRatio: height ? undefined : aspectRatio,
          backgroundColor: theme.paper2,
          borderColor: theme.ink,
        },
        style,
      ]}
    >
      <View style={[styles.center, { gap: compact ? 4 : 8, padding: compact ? 4 : 12 }]}>
        <Text style={{ fontSize: compact ? 18 : 46, lineHeight: compact ? 22 : 52 }}>⌛</Text>
        {!compact && (
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.ink }} />
            ))}
          </View>
        )}
        <View
          style={[
            styles.stamp,
            {
              backgroundColor: theme.accentYellow,
              borderColor: theme.ink,
              paddingHorizontal: compact ? 3 : 7,
              paddingVertical: compact ? 1 : 3,
              transform: [{ rotate: '-2deg' }],
            },
          ]}
        >
          <Text style={[styles.stampText, { color: theme.onYellow, fontSize: compact ? 6 : 9 }]}>
            {compact ? t('poster.pending_compact') : t('poster.pending_full')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Compact X: two crossed lines — no text glyph, no clipping issues
function MissingX({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.xLine, { width: size, backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.xLine, { width: size, backgroundColor: color, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

// Magnifying glass: lens (circle border) + ? text as absolute SIBLING — not inside the circle.
// This avoids Android borderRadius clipping of text.
// Handle position is calculated geometrically: starts at the 45° point on the lens edge.
function MissingLens({
  lensSize, handleW,
  inkColor, paperColor, orangeColor,
}: {
  lensSize: number; handleW: number;
  inkColor: string; paperColor: string; orangeColor: string;
}) {
  const fontSize = Math.round(lensSize * 0.58);
  const r = lensSize / 2;
  const sin45 = Math.SQRT1_2; // 1/√2

  // Point on lens edge at 45° (bottom-right corner of circle)
  const edgeX = r + r * sin45;
  const edgeY = r + r * sin45;

  // Handle rectangle center: extends from edge outward at 45°
  const hcx = edgeX + (handleW / 2) * sin45;
  const hcy = edgeY + (handleW / 2) * sin45;

  // Container must fit lens + handle endpoint
  const containerSize = Math.ceil(hcx + (handleW / 2) * sin45 + 3);

  return (
    <View style={{ width: containerSize, height: containerSize, position: 'relative' }}>
      {/* Lens circle — border only, NO text inside, NO overflow:hidden */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0,
        width: lensSize, height: lensSize,
        borderRadius: 999,
        borderWidth: 2.5,
        borderColor: inkColor,
        backgroundColor: paperColor,
      }} />
      {/* ? — sibling, absolutely centred over lens, NOT inside it */}
      <Text style={{
        position: 'absolute',
        top: 0, left: 0,
        width: lensSize, height: lensSize,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontFamily: 'Caveat-Bold',
        fontSize,
        color: orangeColor,
        includeFontPadding: false,
      }}>?</Text>
      {/* Handle — rectangle centred at (hcx, hcy), rotated 45° */}
      <View style={{
        position: 'absolute',
        top: hcy - 2.5,
        left: hcx - handleW / 2,
        width: handleW,
        height: 5,
        backgroundColor: inkColor,
        borderRadius: 3,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

const PERF_TOPS = ['18%', '33%', '49%', '64%', '80%'] as const;

export function PosterMissing({ width, height, aspectRatio = 2 / 3, compact = false, style }: PendingMissingProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const w = typeof width === 'number' ? width : 168;

  // Three size tiers based on poster width
  const isCompact = compact || w <= 50;   // 44px list items → X cross only
  const isMedium  = !isCompact && w <= 110; // 76px shelf → small lens + stamp
  const isFull    = !isCompact && !isMedium; // 168px detail card → full design

  return (
    <View
      style={[
        styles.root,
        {
          width: width ?? '100%',
          height,
          aspectRatio: height ? undefined : aspectRatio,
          backgroundColor: theme.paper,
          borderColor: theme.ink,
        },
        style,
      ]}
    >
      {/* X cross lines — always shown as background */}
      <View style={[styles.crossLine, { backgroundColor: theme.shade2, transform: [{ rotate: '56deg' }] }]} />
      <View style={[styles.crossLine, { backgroundColor: theme.shade2, transform: [{ rotate: '-56deg' }] }]} />

      {isCompact && (
        <View style={[styles.center, { padding: 6 }]}>
          <MissingX color={theme.accentOrange} size={22} />
        </View>
      )}

      {isMedium && (
        <View style={[styles.center, { gap: 6, padding: 8 }]}>
          <MissingLens
            lensSize={40} handleW={18}
            inkColor={theme.ink} paperColor={theme.paper2} orangeColor={theme.accentOrange}
          />
          <View style={[styles.stamp, {
            backgroundColor: theme.paper, borderColor: theme.ink,
            paddingHorizontal: 5, paddingVertical: 2,
            transform: [{ rotate: '1.5deg' }],
          }]}>
            <Text style={[styles.stampText, { color: theme.ink, fontSize: 7 }]}>{t('poster.missing')}</Text>
          </View>
        </View>
      )}

      {isFull && (
        <>
          {/* Film perforations — left & right */}
          {PERF_TOPS.map((top) => (
            <React.Fragment key={top}>
              <View style={[styles.perf, { top, left: 2, backgroundColor: theme.inkFaint }]} />
              <View style={[styles.perf, { top, right: 2, backgroundColor: theme.inkFaint }]} />
            </React.Fragment>
          ))}

          {/* Inner dashed frame */}
          <View style={[styles.innerFrame, { borderColor: theme.inkFaint }]} />

          <View style={[styles.center, { gap: 8 }]}>
            <MissingLens
              lensSize={68} handleW={30}
              inkColor={theme.ink} paperColor={theme.paper2} orangeColor={theme.accentOrange}
            />
            <View style={[styles.stamp, {
              backgroundColor: theme.paper, borderColor: theme.ink,
              paddingHorizontal: 8, paddingVertical: 3,
              transform: [{ rotate: '1.5deg' }],
            }]}>
              <Text style={[styles.stampText, { color: theme.ink, fontSize: 9 }]}>{t('poster.missing')}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  label: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 3,
  },
  labelText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stamp: {
    borderWidth: 1.5,
    borderRadius: 3,
  },
  stampText: {
    fontFamily: 'JetBrainsMono',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Cross lines for PosterMissing background
  crossLine: {
    position: 'absolute',
    width: '160%',
    height: 1,
  },
  // Compact X lines
  xLine: {
    position: 'absolute',
    width: 22,
    height: 2.5,
    borderRadius: 2,
  },
  // Film perforations
  perf: {
    position: 'absolute',
    width: 5,
    height: 9,
    borderRadius: 1,
  },
  // Inner dashed frame
  innerFrame: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 12,
    bottom: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
