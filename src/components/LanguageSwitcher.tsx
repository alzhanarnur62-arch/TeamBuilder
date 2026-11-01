import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { LANGS, useLang } from '../i18n';

/** Қаз / Рус / Eng ауыстырғышы. */
export default function LanguageSwitcher({ full = false }: { full?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <View style={[styles.row, full && { alignSelf: 'stretch' }]}>
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <Pressable
            key={l.code}
            onPress={() => {
              Haptics.selectionAsync();
              setLang(l.code);
            }}
            style={[styles.pill, full && { flex: 1 }, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={l.name}
          >
            <Text style={[styles.text, active && styles.textActive]}>{full ? l.name : l.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: 4, backgroundColor: colors.card, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start',
  },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  pillActive: { backgroundColor: colors.primary },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  textActive: { color: '#fff' },
});
