import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

type IconName = keyof typeof Ionicons.glyphMap;

const slides = (): { icon: IconName; title: string; text: string }[] => [
  {
    icon: 'person-circle',
    title: t('onb.s1.title'),
    text: t('onb.s1.text'),
  },
  {
    icon: 'bulb',
    title: t('onb.s2.title'),
    text: t('onb.s2.text'),
  },
  {
    icon: 'people',
    title: t('onb.s3.title'),
    text: t('onb.s3.text'),
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  useLang();
  const SLIDES = slides();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const next = () => {
    Haptics.selectionAsync();
    if (last) onDone();
    else setI(i + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topRow}>
        <LanguageSwitcher />
        <Pressable onPress={onDone} hitSlop={12} style={styles.skip}>
          {!last && <Text style={styles.skipText}>{t('onb.skip')}</Text>}
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={72} color={colors.primary} />
        </View>
        <Text style={styles.step}>{i + 1} / {SLIDES.length}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, k) => (
          <View key={k} style={[styles.dot, k === i && styles.dotActive]} />
        ))}
      </View>

      <Pressable style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{last ? t('onb.start') : t('onb.next')}</Text>
        <Ionicons name={last ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip: { minHeight: 24 },
  skipText: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  iconWrap: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...shadow,
  },
  step: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.textMuted, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },
  button: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 17,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
