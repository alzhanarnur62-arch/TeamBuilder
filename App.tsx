import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './src/theme';
import { RootStackParamList } from './src/types/navigation';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import CreateIdeaScreen from './src/screens/CreateIdeaScreen';
import TeamScreen from './src/screens/TeamScreen';
import ChatScreen from './src/screens/ChatScreen';
import CandidateScreen from './src/screens/CandidateScreen';
import NewsScreen from './src/screens/NewsScreen';
import NewsDetailsScreen from './src/screens/NewsDetailsScreen';
import EventRegistrationScreen from './src/screens/EventRegistrationScreen';
import SavedDetailsScreen from './src/screens/SavedDetailsScreen';
import MainTabs from './src/navigation/MainTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import { ChatsProvider } from './src/context/ChatsContext';
import { LanguageProvider, useLang, t } from './src/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDED_KEY = 'teambuilder_onboarded_v1';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};


function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function Root() {
  const { session, loading, signOut } = useAuth();
  useLang();
  const back = { headerShown: true, headerBackTitle: t('common.back') } as const;
  const { hasProfile, loaded } = useProfile();
  const [onboardReady, setOnboardReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => {})
      .finally(() => setOnboardReady(true));
  }, []);

  const finishOnboarding = () => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  };

  // Кіргеннен кейін базадан деректер жүктелгенше күтеміз.
  if (loading || !onboardReady || (session && !loaded)) return <Loading />;

  const email = session?.user.email ?? '';
  const needsProfile = !!session && !hasProfile;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={finishOnboarding} />}
          </Stack.Screen>
        ) : !session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : needsProfile ? (
          <Stack.Screen name="ProfileSetup">
            {() => <ProfileSetupScreen email={email} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Tabs">
              {() => <MainTabs onLogout={signOut} />}
            </Stack.Screen>
            <Stack.Screen name="Project" component={ProjectScreen} options={{ ...back, title: t('nav.project') }} />
            <Stack.Screen name="CreateIdea" component={CreateIdeaScreen} options={{ ...back, title: t('nav.newIdea') }} />
            <Stack.Screen name="Team" component={TeamScreen} options={{ ...back, title: t('nav.team') }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ ...back, title: t('nav.chat') }} />
            <Stack.Screen name="Candidate" component={CandidateScreen} options={{ ...back, title: t('nav.profile') }} />
            <Stack.Screen name="News" component={NewsScreen} options={{ ...back, title: t('news.title') }} />
            <Stack.Screen name="NewsDetails" component={NewsDetailsScreen} options={{ ...back, title: t('news.details') }} />
            <Stack.Screen name="EventRegistration" component={EventRegistrationScreen} options={{ ...back, title: t('ev.navTitle') }} />
            <Stack.Screen name="SavedDetails" component={SavedDetailsScreen} options={{ ...back, title: t('fav.details') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/** Аккаунт ауысқанда (кіру/шығу) барлық деректер провайдерлері таза күйден басталады. */
function UserScope() {
  const { session } = useAuth();
  return (
    <DataProvider key={session?.user.id ?? 'guest'}>
      <ProfileProvider>
        <ChatsProvider>
          <Root />
        </ChatsProvider>
      </ProfileProvider>
    </DataProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <UserScope />
      </AuthProvider>
    </LanguageProvider>
  );
}
