import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

type CategoryArt = {
  accent: string;
  dim: string;
  mark: string;
  index: string;
};

const categoryArt: Record<string, CategoryArt> = {
  peptide: { accent: '#62CCFF', dim: '#102F43', mark: 'P', index: '01' },
  'glp-1': { accent: '#80E6D0', dim: '#103A39', mark: 'G', index: '02' },
  anabolic: { accent: '#D7B6FF', dim: '#2F2348', mark: 'A', index: '03' },
  medication: { accent: '#B4CCFF', dim: '#1C2D4A', mark: 'M', index: '04' },
  vitamin: { accent: '#F4CA8C', dim: '#423421', mark: 'V', index: '05' },
  supplement: { accent: '#A2D9A5', dim: '#203B2B', mark: 'S', index: '06' },
  other: { accent: '#A9BDCF', dim: '#23323E', mark: '•', index: '07' }
};

export function SubstanceArtwork({ category, inactive = false }: { category?: string | null; inactive?: boolean }) {
  const art = categoryArt[category?.trim().toLowerCase() || ''] ?? categoryArt.other!;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { backgroundColor: art.dim, borderColor: art.accent + '66' }, inactive && styles.inactive]}
    >
      <View style={[styles.orbitOuter, { borderColor: art.accent + '50' }]} />
      <View style={[styles.orbitInner, { borderColor: art.accent + '85' }]} />
      <View style={[styles.signal, { backgroundColor: art.accent }]} />
      <Text style={[styles.mark, { color: art.accent }]}>{art.mark}</Text>
      <Text style={[styles.index, { color: art.accent }]}>{art.index}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 90,
    height: 90,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orbitOuter: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderWidth: 1,
    borderRadius: 56,
    left: 21,
    top: -28
  },
  orbitInner: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderWidth: 1,
    borderRadius: 31,
    left: 15,
    top: 12
  },
  signal: { position: 'absolute', width: 30, height: 3, bottom: 14, left: 13, borderRadius: 2 },
  mark: { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
  index: { position: 'absolute', right: 8, bottom: 8, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  inactive: { opacity: 0.55 }
});
