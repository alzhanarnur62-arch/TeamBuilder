import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<string, [IconName, IconName]> = {
  Projects: ['home', 'home-outline'],
  MyTeams: ['people', 'people-outline'],
  Chats: ['chatbubbles', 'chatbubbles-outline'],
  Profile: ['person', 'person-outline'],
};

const LINE_W = 44;

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const tabW = width / state.routes.length;

  useEffect(() => {
    if (!tabW) return;
    Animated.spring(x, {
      toValue: state.index * tabW + (tabW - LINE_W) / 2,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabW, x]);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {state.routes.map((route, i) => {
          const options = descriptors[route.key].options;
          const focused = state.index === i;
          const color = focused ? colors.primary : colors.textMuted;
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress}>
              <View>
                <Ionicons name={focused ? active : inactive} size={26} color={color} />
                {options.tabBarBadge != null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color, fontWeight: focused ? '800' : '600' }]}>
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}

        {tabW > 0 && (
          <Animated.View pointerEvents="none" style={[styles.line, { transform: [{ translateX: x }] }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  row: { flexDirection: 'row', paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  label: { fontSize: 12 },
  line: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: LINE_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});
