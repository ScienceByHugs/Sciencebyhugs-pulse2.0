import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

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
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>BPC-157</Text>
              <Text style={styles.detail}>250 mcg · Subcutaneous</Text>
            </View>
            <View style={styles.duePill}><Text style={styles.dueText}>DUE NOW</Text></View>
          </View>
          <Text style={styles.time}>8:00 AM</Text>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>LOG DOSE</Text>
          </Pressable>
          <Pressable><Text style={styles.secondaryAction}>Change details</Text></Pressable>
        </View>

        <Text style={styles.sectionLabel}>LATER TODAY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Testosterone Cypionate</Text>
              <Text style={styles.detail}>100 mg · Intramuscular</Text>
            </View>
            <Text style={styles.cardTime}>8:00 PM</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: spacing.lg, paddingBottom: 40, gap: spacing.sm },
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
  medName: { color: colors.text, fontSize: 22, fontWeight: '700' },
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
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 2 }
});
