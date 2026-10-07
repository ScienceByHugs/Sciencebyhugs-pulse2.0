import { Host, Icon } from '@expo/ui';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

const tabIcons = {
  index: Icon.select({
    ios: 'house.fill',
    android: require('../../assets/icons/today.xml')
  }),
  protocol: Icon.select({
    ios: 'list.bullet.rectangle.fill',
    android: require('../../assets/icons/protocol.xml')
  }),
  log: Icon.select({
    ios: 'clock.fill',
    android: require('../../assets/icons/timeline.xml')
  }),
  insights: Icon.select({
    ios: 'chart.bar.fill',
    android: require('../../assets/icons/insights.xml')
  }),
  you: Icon.select({
    ios: 'person.crop.circle.fill',
    android: require('../../assets/icons/you.xml')
  })
} as const;

function TabIcon({ routeName, color }: { routeName: string; color: any }) {
  const name = tabIcons[routeName as keyof typeof tabIcons] ?? tabIcons.index;
  return (
    <Host matchContents>
      <Icon name={name} size={19} color={color} />
    </Host>
  );
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
