import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/sign-in'} />;
}
