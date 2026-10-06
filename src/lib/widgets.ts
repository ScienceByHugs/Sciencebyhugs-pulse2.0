import { Platform } from 'react-native';

export async function updatePulseTodayWidget(dueCount: number, nextTime: string) {
  if (Platform.OS !== 'ios') return;

  try {
    const widget = (await import('../../widgets/PulseTodayWidget')).default;
    widget.updateSnapshot({ dueCount, nextTime });
  } catch {
    // Widgets require a development/native build. No-op in unsupported runtimes.
  }
}
