import { Host, Icon } from '@expo/ui';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, SafeAreaView, Text } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

const sfSymbols = {
  index: 'house.fill',
  protocol: 'list.bullet.clipboard.fill',
  log: 'clock.arrow.circlepath',
  insights: 'chart.xyaxis.line',
  you: 'person.crop.circle.fill'
} as const;

const fallbacks: Record<string, string> = {
  index: '⌂',
  protocol: '▤',
  log: '◷',
  insights: '⌁',
  you: '○'
};

function TabIcon({ routeName, color }: { routeName: string; color: string }) {
  if (Platform.OS === 'ios') {
    const name = sfSymbols[routeName as keyof typeof sfSymbols] ?? 'circle.fill';
    return (
      <Host matchContents>
        <Icon name={name} size={19} color={color} />
      </Host>
    );
  }

  return <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{fallbacks[routeName] ?? '·'}</Text>;
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtle,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color }) => <TabIcon routeName={route.name} color={color} />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#08131E',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 14
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 }
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="protocol" options={{ title: 'Protocol' }} />
      <Tabs.Screen name="log" options={{ title: 'Timeline' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
