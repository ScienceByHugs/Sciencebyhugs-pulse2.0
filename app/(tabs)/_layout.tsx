import { Host, Icon } from '@expo/ui';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, type ColorValue } from 'react-native';
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

function TabIcon({ routeName, color, focused }: { routeName: string; color: ColorValue; focused: boolean }) {
  const name = tabIcons[routeName as keyof typeof tabIcons] ?? tabIcons.index;
  return (
    <View style={styles.iconShell}>
      {focused ? <View style={styles.signalHalo} /> : null}
      <View style={[styles.iconCore, focused && styles.iconCoreActive]}>
        <Host matchContents>
          <Icon name={name} size={18} color={color} />
        </Host>
      </View>
      <View style={[styles.signalNode, focused && styles.signalNodeActive]} />
    </View>
  );
}

function TabLabel({ label, focused, color }: { label: string; focused: boolean; color: ColorValue }) {
  return <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>{label.toUpperCase()}</Text>;
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
        tabBarIcon: ({ color, focused }) => <TabIcon routeName={route.name} color={color} focused={focused} />,
        tabBarLabel: ({ color, focused }) => <TabLabel label={({ index: 'Today', protocol: 'Protocol', log: 'Timeline', insights: 'Insights', you: 'You' } as Record<string, string>)[route.name] ?? route.name} focused={focused} color={color} />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 7,
          paddingBottom: 12
        }
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

const styles = StyleSheet.create({
  iconShell: { width: 42, height: 34, alignItems: 'center', justifyContent: 'center' },
  signalHalo: { position: 'absolute', top: 1, width: 34, height: 26, borderRadius: 13, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder },
  iconCore: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center', opacity: .78 },
  iconCoreActive: { opacity: 1 },
  signalNode: { position: 'absolute', bottom: 0, width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border },
  signalNodeActive: { width: 13, backgroundColor: colors.accent },
  tabLabel: { fontSize: 8, fontWeight: '800', letterSpacing: .75, marginTop: 1 },
  tabLabelActive: { fontWeight: '900' }
});
