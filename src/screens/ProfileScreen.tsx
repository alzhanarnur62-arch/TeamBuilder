import { useState } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { t, useLang, roleName, slotName } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { students } from '../data/mock';
import type { Role } from '../types';

const ROLES: Role[] = ['Frontend', 'Backend', 'Дизайнер', 'Тестілеуші', 'Менеджер'];
const ALL_SKILLS = Array.from(new Set(students.flatMap((s) => s.skills)));
const ALL_INTERESTS = Array.from(new Set(students.flatMap((s) => s.interests)));
const ALL_SLOTS = Array.from(new Set(students.flatMap((s) => s.freeSlots)));

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Chips({
  options, selected, onToggle, label = (x) => x,
}: { options: string[]; selected: string[]; onToggle?: (x: string) => void; label?: (x: string) => string }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <Pressable
            key={o}
            disabled={!onToggle}
            onPress={() => {
              Haptics.selectionAsync();
              onToggle?.(o);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { profile, update, addAchievement, removeAchievement, setPhoto, uploading } = useProfile();
  useLang();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');
  const [role, setRole] = useState<Role>(profile.role);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const skillOptions = Array.from(new Set([...ALL_SKILLS, ...profile.skills, ...skills]));
  const interestOptions = Array.from(new Set([...ALL_INTERESTS, ...profile.interests]));
  const slotOptions = Array.from(new Set([...ALL_SLOTS, ...profile.freeSlots]));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setNewSkill('');
  };

  const [adding, setAdding] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('profile.permTitle'), t('profile.permText'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPhoto(res.assets[0].uri);
    }
  };

  const startEdit = () => {
    setName(profile.name);
    setAge(profile.age);
    setCity(profile.city);
    setAbout(profile.about);
    setRole(profile.role);
    setSkills(profile.skills);
    setInterests(profile.interests);
    setSlots(profile.freeSlots);
    setEditing(true);
  };

  const saveEdit = () => {
    update({
      name: name.trim() || profile.name,
      age: age.trim(),
      city: city.trim(),
      about: about.trim(),
      role,
      skills,
      interests,
      freeSlots: slots,
    });
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveAchievement = () => {
    if (!aTitle.trim()) return;
    addAchievement({
      title: aTitle.trim(),
      description: aDesc.trim(),
      date: new Date().toLocaleDateString('ru-RU'),
    });
    setATitle('');
    setADesc('');
    setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmRemove = (id: string) => {
    Alert.alert(t('common.delete'), t('profile.deleteAch'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => removeAchievement(id) },
    ]);
  };

  const info = [profile.age ? t('common.age', { n: profile.age }) : '', profile.city].filter(Boolean).join(' · ');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingTop: 70, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('profile.title')}</Text>

        <View style={styles.card}>
          <Pressable onPress={pickPhoto} style={styles.avatarWrap} disabled={uploading}>
            {profile.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={44} color={colors.primary} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploading}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.camera}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>

          {editing ? (
            <View style={{ width: '100%', gap: 10 }}>
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder={t('profile.fullName')} placeholderTextColor={colors.textMuted} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} value={age} onChangeText={setAge}
                  placeholder={t('profile.age')} placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
                <TextInput style={[styles.input, { flex: 2 }]} value={city} onChangeText={setCity}
                  placeholder={t('profile.city')} placeholderTextColor={colors.textMuted} />
              </View>
              <TextInput style={[styles.input, styles.multiline]} value={about} onChangeText={setAbout}
                placeholder={t('profile.about')} placeholderTextColor={colors.textMuted} multiline />

              <Text style={styles.label}>{t('profile.myRole')}</Text>
              <Chips options={ROLES} selected={[role]} onToggle={(r) => setRole(r as Role)} label={roleName} />

              <Text style={styles.label}>{t('profile.mySkills')}</Text>
              <Chips options={skillOptions} selected={skills} onToggle={(x) => setSkills(toggle(skills, x))} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} value={newSkill} onChangeText={setNewSkill}
                  placeholder={t('common.otherSkill')} placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addSkill} />
                <Pressable onPress={addSkill} hitSlop={10} style={{ justifyContent: 'center' }}>
                  <Ionicons name="add-circle" size={38} color={colors.primary} />
                </Pressable>
              </View>

              <Text style={styles.label}>{t('profile.myInterests')}</Text>
              <Chips options={interestOptions} selected={interests}
                onToggle={(x) => setInterests(toggle(interests, x))} />

              <Text style={styles.label}>{t('profile.mySlots')}</Text>
              <Chips options={slotOptions} selected={slots} onToggle={(x) => setSlots(toggle(slots, x))} label={slotName} />

              <View style={styles.row}>
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(false)}>
                  <Text style={styles.btnGhostText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={saveEdit}>
                  <Text style={styles.btnText}>{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.email ? <Text style={styles.muted}>{profile.email}</Text> : null}
              {info ? <Text style={styles.muted}>{info}</Text> : null}
              <Text style={styles.about}>
                {profile.about || t('profile.aboutEmpty')}
              </Text>

              <View style={styles.compet}>
                <Text style={styles.label}>{t('profile.myRole')}</Text>
                <Chips options={[profile.role]} selected={[profile.role]} label={roleName} />
                <Text style={styles.label}>{t('profile.mySkills')}</Text>
                {profile.skills.length > 0
                  ? <Chips options={profile.skills} selected={[]} />
                  : <Text style={styles.hint}>{t('profile.noSkills')}</Text>}
                <Text style={styles.label}>{t('profile.myInterests')}</Text>
                {profile.interests.length > 0
                  ? <Chips options={profile.interests} selected={[]} />
                  : <Text style={styles.hint}>{t('common.notSet')}</Text>}
                <Text style={styles.label}>{t('profile.mySlots')}</Text>
                {profile.freeSlots.length > 0
                  ? <Chips options={profile.freeSlots} selected={[]} label={slotName} />
                  : <Text style={styles.hint}>{t('common.notSet')}</Text>}
              </View>
              <Pressable style={[styles.btn, styles.btnGhost, { alignSelf: 'stretch' }]} onPress={startEdit}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.btnGhostText}>{t('profile.edit')}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>{t('profile.achievements')}</Text>
          <Pressable onPress={() => setAdding(!adding)} hitSlop={10}>
            <Ionicons name={adding ? 'close-circle' : 'add-circle'} size={30} color={colors.primary} />
          </Pressable>
        </View>

        {adding && (
          <View style={styles.card}>
            <TextInput style={[styles.input, { alignSelf: 'stretch' }]} value={aTitle} onChangeText={setATitle}
              placeholder={t('profile.achTitle')} placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.input, styles.multiline, { alignSelf: 'stretch' }]} value={aDesc}
              onChangeText={setADesc} placeholder={t('profile.description')} placeholderTextColor={colors.textMuted} multiline />
            <Pressable style={[styles.btn, styles.btnPrimary, { alignSelf: 'stretch' }]} onPress={saveAchievement}>
              <Text style={styles.btnText}>{t('common.add')}</Text>
            </Pressable>
          </View>
        )}

        {profile.achievements.length === 0 && !adding && (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={34} color={colors.textMuted} />
            <Text style={styles.muted}>{t('profile.noAch')}</Text>
          </View>
        )}

        {profile.achievements.map((a) => (
          <View key={a.id} style={styles.achievement}>
            <View style={styles.trophy}>
              <Ionicons name="trophy" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.achTitle}>{a.title}</Text>
              {a.description ? <Text style={styles.achDesc}>{a.description}</Text> : null}
              <Text style={styles.achDate}>{a.date}</Text>
            </View>
            <Pressable onPress={() => confirmRemove(a.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ))}

        <Text style={[styles.section, { marginTop: 20, marginBottom: 10 }]}>{t('common.language')}</Text>
        <LanguageSwitcher full />

        <Pressable
          style={styles.logout}
          onPress={() =>
            Alert.alert(t('profile.logout'), t('profile.logoutAsk'), [
              { text: t('common.no'), style: 'cancel' },
              { text: t('profile.logout'), style: 'destructive', onPress: onLogout },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 20 },
  card: {
    backgroundColor: colors.card, borderRadius: 20,
    padding: 20, alignItems: 'center', gap: 10, marginBottom: 16, ...shadow,
  },
  avatarWrap: { marginBottom: 6 },
  uploading: {
    ...StyleSheet.absoluteFill, borderRadius: 55, backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 110, height: 110, borderRadius: 55 },
  camera: {
    position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.card,
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  about: { fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 22, marginVertical: 6 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    padding: 14, fontSize: 16, color: colors.text,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  btn: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, padding: 14,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', gap: 8, padding: 24 },
  achievement: {
    flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 18, padding: 14, marginBottom: 10, ...shadow,
  },
  trophy: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  achTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  achDesc: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  achDate: { fontSize: 12, color: colors.accent, marginTop: 4, fontWeight: '700' },
  logout: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.danger, borderRadius: 18, padding: 16, marginTop: 20,
  },
  logoutText: { color: colors.danger, fontSize: 17, fontWeight: '800' },
  compet: { alignSelf: 'stretch', marginBottom: 8 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '800', marginTop: 10, marginBottom: 6, alignSelf: 'flex-start' },
  hint: { color: colors.textMuted, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.primarySoft,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
});