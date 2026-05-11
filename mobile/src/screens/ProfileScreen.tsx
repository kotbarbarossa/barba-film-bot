import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useUpdateProfile } from '@/hooks/mutations/useUpdateProfile';
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

function formatSince(iso: string) {
  const d = new Date(iso);
  return `С ${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitial(first?: string | null, username?: string | null): string {
  if (first) return first[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return '?';
}

function getDisplayName(first?: string | null, last?: string | null, username?: string | null): string {
  if (first && last) return `${first} ${last[0]}.`;
  if (first) return first;
  if (username) return `@${username}`;
  return 'Пользователь';
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { theme, mode, setMode } = useTheme();
  const { signOut } = useAuthStore();
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editUsername, setEditUsername] = useState('');

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
  const displayName = getDisplayName(profile?.first_name, profile?.last_name, profile?.username);

  return (
    <Phone>
      {/* Header */}
      <View style={styles.header}>
        <H size="lg">Профиль</H>
        <Pressable hitSlop={8} onPress={openEdit}>
          <H size="sm" color={theme.accentOrange}>изм.</H>
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
                {profile.username ? `@${profile.username} · ` : ''}{formatSince(profile.created_at)}
              </Mono>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCell value={stats.watched} label="посмотрел" tone="orange" theme={theme} />
          <StatCell value={stats.want}    label="хочу"      tone="yellow" theme={theme} />
          <StatCell value={stats.total}   label="всего"     tone="ink"    theme={theme} />
        </View>

        {/* Settings */}
        <GroupCard label="НАСТРОЙКИ" theme={theme}>
          <SettingRow
            icon="◐"
            title="Тема"
            value={mode === 'dark' ? 'тёмная' : 'светлая'}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            theme={theme}
          />
          <SettingRow icon="🌐" title="Язык" value="русский" theme={theme} />
          <SettingRow icon="🔔" title="Уведомления" value="вкл." last theme={theme} />
        </GroupCard>

        {/* About */}
        <GroupCard label="О ПРИЛОЖЕНИИ" theme={theme}>
          <SettingRow icon="★" title="Оценить приложение" theme={theme} />
          <SettingRow icon="§" title="Политика и условия" last theme={theme} />
        </GroupCard>

        {/* Sign out */}
        <View style={{ marginBottom: 8 }}>
          <Button
            title="Выйти из аккаунта"
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
              удалить аккаунт
            </Body>
          </Pressable>
          <Mono size={9} style={{ marginTop: 6 }}>КИНОКОПИЛКА · v1.0.0</Mono>
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
              <H size="md" style={{ marginBottom: 18 }}>Редактировать</H>

              <Mono size={10} style={{ marginBottom: 4 }}>ИМЯ</Mono>
              <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <TextInput
                  value={editFirst}
                  onChangeText={setEditFirst}
                  placeholder="Имя"
                  placeholderTextColor={theme.inkFaint}
                  style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
                />
              </View>

              <Mono size={10} style={{ marginTop: 12, marginBottom: 4 }}>ФАМИЛИЯ</Mono>
              <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <TextInput
                  value={editLast}
                  onChangeText={setEditLast}
                  placeholder="Фамилия"
                  placeholderTextColor={theme.inkFaint}
                  style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
                />
              </View>

              <Mono size={10} style={{ marginTop: 12, marginBottom: 4 }}>ПСЕВДОНИМ</Mono>
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
                title={isSaving ? 'Сохраняем…' : 'Сохранить'}
                variant="accent"
                full
                disabled={isSaving}
                onPress={handleSave}
                style={{ marginTop: 20, marginBottom: 8 }}
              />
              <Button
                title="Отмена"
                variant="ghost"
                full
                onPress={() => setShowEdit(false)}
              />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
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
            <H size="lg" style={{ textAlign: 'center', lineHeight: 32, marginBottom: 6 }}>Выйти?</H>
            <ArtNote style={{ textAlign: 'center' }}>
              Коллекция останется в облаке —{'\n'}войдёшь снова и она вернётся.
            </ArtNote>
            {profile && (
              <View style={[styles.sheetUser, { backgroundColor: theme.shade, borderColor: theme.line }]}>
                <View style={[styles.sheetAvatar, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
                  <H size="md" color={theme.onYellow}>{initial}</H>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body size={13} weight="bold">{displayName}</Body>
                  <Mono size={10}>
                    {profile.username ? `@${profile.username} · ` : ''}{stats.total} фильмов
                  </Mono>
                </View>
              </View>
            )}
            <Button
              title="Да, выйти"
              variant="accent"
              full
              onPress={() => { setShowLogout(false); signOut(); }}
              style={{ marginBottom: 8 }}
            />
            <Button
              title="Отмена"
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
