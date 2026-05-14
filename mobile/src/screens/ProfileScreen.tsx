import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useUpdateProfile } from '@/hooks/mutations/useUpdateProfile';
import { queryClient } from '@/lib/queryClient';
import type { Theme } from '@/theme';

// ─── local primitives ────────────────────────────────────────────────────────

function StatCell({ value, label, tone, theme }: {
  value: string | number;
  label: string;
  tone: 'orange' | 'yellow' | 'ink';
  theme: Theme;
}) {
  const bg = { orange: theme.accentOrange, yellow: theme.accentYellow, ink: theme.ink }[tone];
  const color = tone === 'yellow' ? theme.onYellow : theme.paper;
  return (
    <View style={[styles.statCell, { backgroundColor: bg, borderColor: theme.ink }]}>
      <H size="lg" color={color} style={{ fontSize: 30, lineHeight: 28 }}>{value}</H>
      <Body size={11} color={color} style={{ opacity: 0.85, marginTop: 4 }}>{label}</Body>
    </View>
  );
}

function SettingRow({ icon, title, value, danger, last, onPress, theme }: {
  icon: string;
  title: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.settingRow,
        !last && { borderBottomWidth: 1, borderBottomColor: theme.shade2 },
      ]}
    >
      <View style={[styles.settingIcon, { borderColor: theme.line, backgroundColor: theme.shade }]}>
        <Body size={13}>{icon}</Body>
      </View>
      <Body size={14} color={danger ? theme.accentOrange : theme.ink} style={{ flex: 1 }}>{title}</Body>
      {value !== undefined && (
        <Body size={12} color={theme.inkSoft} style={{ marginRight: 6 }}>{value}</Body>
      )}
      <H size="sm" color={theme.inkFaint} style={{ fontSize: 20, lineHeight: 22 }}>›</H>
    </Pressable>
  );
}

function GroupCard({ label, children, theme }: {
  label: string;
  children: React.ReactNode;
  theme: Theme;
}) {
  return (
    <View style={styles.groupCard}>
      <View style={{ paddingHorizontal: 4, marginBottom: 4 }}>
        <Mono size={10}>{label}</Mono>
      </View>
      <View style={[styles.groupBox, { backgroundColor: theme.paper2, borderColor: theme.line }]}>
        {children}
      </View>
    </View>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const RU_MONTHS = [
  'ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
  'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ',
];
const EN_MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso);
  if (lang === 'en') return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitial(first?: string | null, username?: string | null): string {
  if (first) return first[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return '?';
}

function getDisplayName(first?: string | null, last?: string | null, username?: string | null, fallback?: string): string {
  if (first && last) return `${first} ${last[0]}.`;
  if (first) return first;
  if (username) return `@${username}`;
  return fallback ?? 'User';
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, mode, setMode } = useTheme();
  const { signOut } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editUsername, setEditUsername] = useState('');

  const appState = useRef(AppState.currentState);

  const refreshNotifStatus = useCallback(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifGranted(status === 'granted');
    });
  }, []);

  useEffect(() => {
    refreshNotifStatus();
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refreshNotifStatus();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [refreshNotifStatus]);

  const handleNotifications = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'undetermined') {
      const result = await Notifications.requestPermissionsAsync();
      setNotifGranted(result.status === 'granted');
    } else {
      Linking.openSettings();
    }
  }, []);

  const handleRateApp = useCallback(() => {
    const androidUrl = 'market://details?id=com.barbarossa.flickbook';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.barbarossa.flickbook';
    Linking.canOpenURL(androidUrl)
      .then(supported => Linking.openURL(supported ? androidUrl : webUrl))
      .catch(() => Linking.openURL(webUrl));
  }, []);

  const { data: profile } = useUserProfile();
  const { data: movies = [] } = useMyMovies();
  const { mutateAsync: saveProfile, isPending: isSaving } = useUpdateProfile();

  const openEdit = () => {
    setEditFirst(profile?.first_name ?? '');
    setEditLast(profile?.last_name ?? '');
    setEditUsername(profile?.username ?? '');
    setShowEdit(true);
  };

  const handleSave = async () => {
    await saveProfile({
      first_name: editFirst.trim() || null,
      last_name: editLast.trim() || null,
      username: editUsername.trim() || null,
    });
    setShowEdit(false);
  };

  const stats = useMemo(() => ({
    watched: movies.filter(m => m.status === 'watched').length,
    want:    movies.filter(m => m.status === 'want').length,
    total:   movies.length,
  }), [movies]);

  const initial     = getInitial(profile?.first_name, profile?.username);
  const displayName = getDisplayName(profile?.first_name, profile?.last_name, profile?.username, t('profile.user_default'));

  return (
    <Phone>
      {/* Header */}
      <View style={styles.header}>
        <H size="lg" style={{ flex: 1 }}>{t('profile.title')}</H>
        <Pressable hitSlop={8} onPress={openEdit}>
          <H size="sm" color={theme.accentOrange}>{t('profile.edit')}</H>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <View style={[styles.avatar, { borderColor: theme.line, backgroundColor: theme.accentYellow, shadowColor: theme.shade2 }]}>
            <H size="xl" color={theme.onYellow}>{initial}</H>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <H size="md" style={{ lineHeight: 24 }}>{displayName}</H>
            {profile && (
              <Mono size={10} style={{ marginTop: 4 }}>
                {profile.username ? `@${profile.username} · ` : ''}{t('profile.since', { date: formatDate(profile.created_at, language) })}
              </Mono>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCell value={stats.watched} label={t('profile.watched_label')} tone="orange" theme={theme} />
          <StatCell value={stats.want}    label={t('profile.want_label')}    tone="yellow" theme={theme} />
          <StatCell value={stats.total}   label={t('profile.total_label')}   tone="ink"    theme={theme} />
        </View>

        {/* Settings */}
        <GroupCard label={t('profile.settings')} theme={theme}>
          <SettingRow
            icon="◐"
            title={t('profile.theme')}
            value={mode === 'dark' ? t('profile.theme_dark') : t('profile.theme_light')}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            theme={theme}
          />
          <SettingRow
            icon="🌐"
            title={t('profile.language')}
            value={language === 'ru' ? t('profile.language_ru') : t('profile.language_en')}
            onPress={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            theme={theme}
          />
          <SettingRow
            icon="🔔"
            title={t('profile.notifications')}
            value={notifGranted === null ? undefined : notifGranted ? t('profile.notif_on') : t('profile.notif_off')}
            onPress={handleNotifications}
            last
            theme={theme}
          />
        </GroupCard>

        {/* About */}
        <GroupCard label={t('profile.about')} theme={theme}>
          <SettingRow icon="★" title={t('profile.rate_app')} onPress={handleRateApp} theme={theme} />
          <SettingRow icon="§" title={t('profile.policy')} onPress={() => setShowPolicy(true)} last theme={theme} />
        </GroupCard>

        {/* Sign out */}
        <View style={{ marginBottom: 8 }}>
          <Button
            title={t('profile.sign_out')}
            variant="ghost"
            full
            style={{ borderColor: theme.accentOrange }}
            textStyle={{ color: theme.accentOrange }}
            onPress={() => setShowLogout(true)}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable hitSlop={8}>
            <Body size={11} color={theme.inkFaint} style={{ textDecorationLine: 'underline' }}>
              {t('profile.delete_account')}
            </Body>
          </Pressable>
          <Mono size={9} style={{ marginTop: 6 }}>{t('profile.app_name')} · {t('profile.app_version')}</Mono>
        </View>
      </ScrollView>

      {/* Edit profile sheet */}
      <Modal
        visible={showEdit}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowEdit(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowEdit(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable
              style={[styles.sheet, { backgroundColor: theme.paper, borderTopColor: theme.line }]}
              onPress={() => {}}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.inkFaint }]} />
              <H size="md" style={{ marginBottom: 18 }}>{t('profile.edit_title')}</H>

              <Mono size={10} style={{ marginBottom: 4 }}>{t('profile.first_name_label')}</Mono>
              <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <TextInput
                  value={editFirst}
                  onChangeText={setEditFirst}
                  placeholder={t('profile.first_name_placeholder')}
                  placeholderTextColor={theme.inkFaint}
                  style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
                />
              </View>

              <Mono size={10} style={{ marginTop: 12, marginBottom: 4 }}>{t('profile.last_name_label')}</Mono>
              <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <TextInput
                  value={editLast}
                  onChangeText={setEditLast}
                  placeholder={t('profile.last_name_placeholder')}
                  placeholderTextColor={theme.inkFaint}
                  style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
                />
              </View>

              <Mono size={10} style={{ marginTop: 12, marginBottom: 4 }}>{t('profile.username_label')}</Mono>
              <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <TextInput
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="@username"
                  placeholderTextColor={theme.inkFaint}
                  autoCapitalize="none"
                  style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
                />
              </View>

              <Button
                title={isSaving ? t('profile.saving') : t('profile.save')}
                variant="accent"
                full
                disabled={isSaving}
                onPress={handleSave}
                style={{ marginTop: 20, marginBottom: 8 }}
              />
              <Button
                title={t('profile.cancel')}
                variant="ghost"
                full
                onPress={() => setShowEdit(false)}
              />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Policy bottom sheet */}
      <Modal
        visible={showPolicy}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowPolicy(false)}
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => setShowPolicy(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          <View style={[styles.sheet, { backgroundColor: theme.paper, borderTopColor: theme.line }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.inkFaint }]} />
            <H size="md" style={{ marginBottom: 14 }}>{t('profile.policy_title')}</H>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.policyScroll}
            >
              <Body size={13} color={theme.inkSoft} style={{ lineHeight: 20 }}>
                {t('profile.policy_content')}
              </Body>
            </ScrollView>
            <Button
              title={t('profile.policy_ok')}
              variant="accent"
              full
              onPress={() => setShowPolicy(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Logout bottom sheet */}
      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLogout(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowLogout(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.paper, borderTopColor: theme.line }]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.inkFaint }]} />
            <H size="lg" style={{ textAlign: 'center', lineHeight: 32, marginBottom: 6 }}>{t('profile.logout_title')}</H>
            <ArtNote style={{ textAlign: 'center' }}>
              {t('profile.logout_body')}
            </ArtNote>
            {profile && (
              <View style={[styles.sheetUser, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <View style={[styles.sheetAvatar, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
                  <H size="md" color={theme.onYellow}>{initial}</H>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body size={13} weight="bold">{displayName}</Body>
                  <Mono size={10}>
                    {profile.username ? `@${profile.username} · ` : ''}{t('profile.movies_count', { count: stats.total })}
                  </Mono>
                </View>
              </View>
            )}
            <Button
              title={t('profile.logout_confirm')}
              variant="accent"
              full
              onPress={() => { setShowLogout(false); queryClient.clear(); signOut(); }}
              style={{ marginBottom: 8 }}
            />
            <Button
              title={t('profile.cancel')}
              variant="ghost"
              full
              onPress={() => setShowLogout(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Phone>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statCell: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
  },
  groupCard: {
    marginBottom: 14,
  },
  groupBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  settingIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  field: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,20,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 4,
  },
  policyScroll: {
    maxHeight: 380,
    marginBottom: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
  },
  sheetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
