import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang } from '../i18n';
import {
  validate, eventTypes, emptyForm, normalizePhone,
  MIN_COUNT, MAX_COUNT, COMMENT_MAX,
  type EventType, type FormErrors, type FormValues,
} from '../utils/eventForm';

/** Іс-шараға тіркелу формасы (Зертханалық жұмыс 9). */
export default function EventRegistrationScreen() {
  useLang();
  const [fullName, setFullName] = useState('');
  const [group, setGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState<EventType>('');
  const [eventDate, setEventDate] = useState('');
  const [participants, setParticipants] = useState('1');
  const [comment, setComment] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  // Қосымша тапсырма: сәтті тіркелудің қорытындысы
  const [done, setDone] = useState<FormValues | null>(null);

  /** Өріс өзгергенде — тек сол өрістің қатесін тазалаймыз. */
  const clear = (field: keyof FormErrors) => setErrors((current) => ({ ...current, [field]: undefined }));

  const values: FormValues = { fullName, group, phone, email, eventType, eventDate, participants, comment, accepted };

  function handleSubmit() {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('ev.successTitle'), t('ev.successText'));
    setDone(values);
    // Қосымша тапсырма: қате жоқ болса — форманы тазалаймыз
    setFullName(emptyForm.fullName);
    setGroup(emptyForm.group);
    setPhone(emptyForm.phone);
    setEmail(emptyForm.email);
    setEventType(emptyForm.eventType);
    setEventDate(emptyForm.eventDate);
    setParticipants(emptyForm.participants);
    setComment(emptyForm.comment);
    setAccepted(emptyForm.accepted);
  }

  // Қосымша тапсырма: +/− батырмалары
  const changeCount = (delta: number) => {
    const current = Number(participants);
    const base = Number.isInteger(current) ? current : MIN_COUNT;
    setParticipants(String(Math.min(MAX_COUNT, Math.max(MIN_COUNT, base + delta))));
    clear('participants');
    Haptics.selectionAsync();
  };

  const err = (field: keyof FormErrors) =>
    errors[field] ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle" size={14} color={colors.danger} />
        <Text style={styles.error}>{t(errors[field]!)}</Text>
      </View>
    ) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('ev.title')}</Text>
        <Text style={styles.sub}>{t('ev.sub')}</Text>

        {done && (
          <View style={styles.summary}>
            <View style={styles.summaryHead}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.summaryTitle}>{t('ev.summary')}</Text>
            </View>
            <Text style={styles.summaryLine}>{t('ev.name')}: {done.fullName.trim()}</Text>
            <Text style={styles.summaryLine}>{t('ev.group')}: {done.group.trim()}</Text>
            <Text style={styles.summaryLine}>{t('ev.type')}: {done.eventType && t(`ev.type.${done.eventType}`)}</Text>
            <Text style={styles.summaryLine}>{t('ev.date')}: {done.eventDate}</Text>
            <Text style={styles.summaryLine}>{t('ev.count')}: {done.participants}</Text>
            <Text style={styles.summaryLine}>{t('ev.phone')}: {normalizePhone(done.phone)}</Text>
            <Text style={styles.summaryLine}>Email: {done.email.trim()}</Text>
            <Pressable onPress={() => setDone(null)} hitSlop={8}>
              <Text style={styles.summaryLink}>{t('ev.newOne')}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>{t('ev.name')}</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            value={fullName}
            onChangeText={(value) => { setFullName(value); clear('fullName'); }}
            placeholder={t('ev.namePh')}
            placeholderTextColor={colors.textMuted}
            maxLength={80}
          />
          {err('fullName')}

          <Text style={styles.label}>{t('ev.group')}</Text>
          <TextInput
            style={[styles.input, errors.group && styles.inputError]}
            value={group}
            onChangeText={(value) => { setGroup(value); clear('group'); }}
            placeholder={t('ev.groupPh')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={30}
          />
          {err('group')}

          <Text style={styles.label}>{t('ev.phone')}</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={phone}
            onChangeText={(value) => { setPhone(value); clear('phone'); }}
            placeholder="+7 701 234 56 78"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            maxLength={20}
          />
          {err('phone')}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={(value) => { setEmail(value); clear('email'); }}
            placeholder="name@mail.kz"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={80}
          />
          {err('email')}

          <Text style={styles.label}>{t('ev.type')}</Text>
          <View style={styles.options}>
            {eventTypes.map((item) => (
              <Pressable
                key={item}
                onPress={() => { setEventType(item); clear('eventType'); Haptics.selectionAsync(); }}
                style={[styles.option, eventType === item && styles.optionActive]}
              >
                <Text style={[styles.optionText, eventType === item && styles.optionTextActive]}>
                  {t(`ev.type.${item}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {err('eventType')}

          <Text style={styles.label}>{t('ev.date')}</Text>
          <TextInput
            style={[styles.input, errors.eventDate && styles.inputError]}
            value={eventDate}
            onChangeText={(value) => { setEventDate(value); clear('eventDate'); }}
            placeholder={t('ev.datePh')}
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {err('eventDate')}

          <Text style={styles.label}>{t('ev.count')}</Text>
          <View style={styles.counter}>
            <Pressable style={styles.countBtn} onPress={() => changeCount(-1)} accessibilityLabel="−">
              <Ionicons name="remove" size={22} color={colors.primary} />
            </Pressable>
            <TextInput
              style={[styles.input, styles.countInput, errors.participants && styles.inputError]}
              value={participants}
              onChangeText={(value) => { setParticipants(value); clear('participants'); }}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Pressable style={styles.countBtn} onPress={() => changeCount(1)} accessibilityLabel="+">
              <Ionicons name="add" size={22} color={colors.primary} />
            </Pressable>
          </View>
          {err('participants')}

          <Text style={styles.label}>{t('ev.comment')}</Text>
          <TextInput
            style={[styles.input, styles.multiline, errors.comment && styles.inputError]}
            value={comment}
            onChangeText={(value) => { setComment(value); clear('comment'); }}
            placeholder={t('ev.commentPh')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={COMMENT_MAX}
          />
          <Text style={styles.counterText}>{comment.length}/{COMMENT_MAX}</Text>
          {err('comment')}

          <Pressable
            style={styles.checkRow}
            onPress={() => { setAccepted(!accepted); clear('accepted'); Haptics.selectionAsync(); }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxOn, errors.accepted && styles.inputError]}>
              {accepted && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkText}>{t('ev.accept')}</Text>
          </Pressable>
          {err('accepted')}
        </View>

        <Pressable style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>{t('ev.submit')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 60, gap: 10, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginBottom: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 16, gap: 8, ...shadow },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14,
    backgroundColor: colors.background, fontSize: 16, color: colors.text,
  },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 },
  options: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primarySoft },
  optionActive: { backgroundColor: colors.primary },
  optionText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  optionTextActive: { color: '#fff' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  countInput: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  counterText: { alignSelf: 'flex-end', color: colors.textMuted, fontSize: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, fontSize: 15, color: colors.text },
  submit: {
    backgroundColor: colors.primary, borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  summary: { backgroundColor: colors.successSoft, borderRadius: 18, padding: 16, gap: 4 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: colors.success },
  summaryLine: { fontSize: 14, color: colors.text },
  summaryLink: { color: colors.primary, fontWeight: '800', marginTop: 8 },
});
