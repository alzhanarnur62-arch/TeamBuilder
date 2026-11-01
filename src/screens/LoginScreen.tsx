import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';
import { t, useLang } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SEC = 60;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { sendCode, verifyCode } = useAuth();
  useLang();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const cleanEmail = email.trim().toLowerCase();
  const emailOk = EMAIL_RE.test(cleanEmail);
  const codeOk = /^\d{6,8}$/.test(code);

  const requestCode = async () => {
    if (!emailOk || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendCode(cleanEmail);
    setBusy(false);
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('code');
    setCode('');
    setWait(RESEND_SEC);
  };

  const confirm = async () => {
    if (!codeOk || busy) return;
    setBusy(true);
    setError(null);
    const err = await verifyCode(cleanEmail, code);
    setBusy(false);
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Сессия пайда болғанда App өзі келесі экранға өтеді.
    }
  };

  const isEmail = step === 'email';
  const canSubmit = isEmail ? emailOk : codeOk;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.langRow}>
          <LanguageSwitcher />
        </View>
        <View style={styles.card}>
          <View style={styles.logo}>
            <Ionicons name="people" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>{isEmail ? t('login.welcome') : t('login.enterCode')}</Text>
          <Text style={styles.subtitle}>
            {isEmail
              ? t('login.emailHint')
              : t('login.codeSent', { email: cleanEmail })}
          </Text>

          {isEmail ? (
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={requestCode}
              />
            </View>
          ) : (
            <TextInput
              style={styles.codeInput}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={(t) => { setCode(t.replace(/\D/g, '').slice(0, 8)); setError(null); }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={8}
              autoFocus
              onSubmitEditing={confirm}
            />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, (!canSubmit || busy) && { opacity: 0.45 }]}
            onPress={isEmail ? requestCode : confirm}
            disabled={!canSubmit || busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isEmail ? t('login.sendCode') : t('login.signIn')}</Text>
            )}
          </Pressable>

          {!isEmail && (
            <View style={styles.links}>
              <Pressable onPress={requestCode} disabled={wait > 0 || busy} hitSlop={8}>
                <Text style={[styles.link, wait > 0 && { color: colors.textMuted }]}>
                  {wait > 0 ? t('login.resendIn', { n: wait }) : t('login.resend')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setStep('email'); setError(null); setCode(''); }}
                hitSlop={8}
              >
                <Text style={styles.link}>{t('login.changeEmail')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.footer}>TeamBuilder AI · {t('common.tagline')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
  langRow: { alignItems: 'center', marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 28, padding: 24, alignItems: 'center', ...shadow },
  logo: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21,
    marginTop: 8, marginBottom: 22,
  },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    borderWidth: 1, borderColor: colors.border, borderRadius: 18,
    paddingHorizontal: 16, height: 56, backgroundColor: colors.background,
  },
  input: { flex: 1, fontSize: 16, color: colors.text },
  codeInput: {
    alignSelf: 'stretch', height: 64, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, textAlign: 'center', fontSize: 30, fontWeight: '800',
    letterSpacing: 10, color: colors.text,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch',
    backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 12, marginTop: 14,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 14, fontWeight: '600' },
  button: {
    alignSelf: 'stretch', height: 56, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 18,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  links: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 18 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  footer: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 24 },
});
