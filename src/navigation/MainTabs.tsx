import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GlassTabBar from '../components/GlassTabBar';
import IdeasScreen from '../screens/IdeasScreen';
import MyTeamsScreen from '../screens/MyTeamsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import { useChats } from '../context/ChatsContext';
import type { TabParamList } from '../types/navigation';
import { t, useLang } from '../i18n';

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs({ onLogout }: { onLogout: () => void }) {
  const { totalUnread } = useChats();
  useLang();

  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Projects" component={IdeasScreen} options={{ title: t('tab.home') }} />
      <Tab.Screen name="MyTeams" component={MyTeamsScreen} options={{ title: t('tab.teams') }} />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{ title: t('tab.chats'), tabBarBadge: totalUnread > 0 ? totalUnread : undefined }}
      />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('tab.favorites') }} />
      <Tab.Screen name="Profile" options={{ title: t('tab.profile') }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
