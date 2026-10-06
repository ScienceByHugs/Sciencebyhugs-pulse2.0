import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

const schedule = [
  { name: 'BPC-157', detail: '250 mcg · Subcutaneous', time: '8:00 AM', state: 'due' },
  { name: 'Testosterone Cypionate', detail: '100 mg · Intramuscular', time: '8:00 PM', state: 'later' },
];

export default function TodayScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.eyebrow}>SCIENCE BY HUGS</Text>
            <Text style={styles.logo}>PULSE</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>AH</Text></View>
        </View>

        <Text style={styles.greeting}>Good morning.</Text>
        <Text style={styles.date}>Tuesday · October 6</Text>

        <Text style={styles.sectionLabel}>NEXT</Text>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.medName}>{schedule[0].name}</Text>
              <Text style={styles.detail}>{schedule[0].detail}</Text>
            </View>
            <View style={styles.duePill}><Text style={styles.dueText}>DUE NOW</Text></View>
          </View>
          <Text style={styles.time}>{schedule[0].time}</Text>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>LOG DOSE</Text>
          </Pressable>
          <Pressable><Text style={styles.secondaryAction}>Change details</Text></Pressable>
        </View>

        <Text style={styles.sectionLabel}>LATER TODAY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{schedule[1].name}</Text>
              <Text style={styles.detail}>{schedule[1].detail}</Text>
            </View>
            <Text style={styles.cardTime}>{schedule[1].time}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PULSE NOTICE</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Inventory forecast</Text>
          <Text style={styles.noticeText}>Your current BPC-157 vial has approximately 4 scheduled doses remaining.</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>93%</Text>
            <Text style={styles.metricLabel}>7-day consistency</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>4</Text>
            <Text style={styles.metricLabel}>doses remaining</Text>
          </View>
        </View>

        <View style={styles.nav}>
          {['Today', 'Protocol', 'Log', 'Insights', 'You'].map((item, i) => (
            <View key={item} style={styles.navItem}>
              <View style={[styles.navDot, i === 0 && styles.navDotActive]} />
              <Text style={[styles.navText, i === 0 && styles.navTextActive]}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 30, gap: spacing.sm },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.4, fontWeight: '700' },
  logo: { color: colors.text, fontSize: 28, letterSpacing: 6, fontWeight: '800' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.panel2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText: { color: colors.accent, fontWeight: '800' },
  greeting: { color: colors.text, fontSize: type.hero, fontWeight: '700', letterSpacing: -1 },
  date: { color: colors.muted, fontSize: 14, marginBottom: spacing.md },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginTop: spacing.md, marginBottom: 2 },
  heroCard: { backgroundColor: colors.panel, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.accentBorder, gap: spacing.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  medName: { color: colors.text, fontSize: 22, fontWeight: '750' },
  detail: { color: colors.muted, marginTop: 4, fontSize: 13 },
  duePill: { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dueText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  time: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1.2, marginVertical: spacing.sm },
  primaryButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#03111f', fontWeight: '900', letterSpacing: 1.1 },
  secondaryAction: { color: colors.muted, textAlign: 'center', paddingTop: 4, fontWeight: '600' },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardTime: { color: colors.text, fontWeight: '800' },
  notice: { backgroundColor: colors.panel2, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  noticeTitle: { color: colors.accent, fontWeight: '800', marginBottom: 5 },
  noticeText: { color: colors.text, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metricCard: { flex: 1, backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  nav: { flexDirection: 'row', backgroundColor: colors.panel, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 8, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border },
  navItem: { flex: 1, alignItems: 'center', gap: 5 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  navDotActive: { backgroundColor: colors.accent },
  navText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  navTextActive: { color: colors.text }
});
