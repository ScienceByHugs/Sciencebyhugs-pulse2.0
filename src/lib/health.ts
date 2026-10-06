import { Platform } from 'react-native';

export type AppleHealthSnapshot = {
  available: boolean;
  bodyMassKg?: number;
  bodyFatPercent?: number;
  heartRateBpm?: number;
  steps?: number;
};

export async function readAppleHealthSnapshot(): Promise<AppleHealthSnapshot> {
  if (Platform.OS !== 'ios') return { available: false };

  const HealthKit = await import('@kingstinct/react-native-healthkit');
  const available = await HealthKit.isHealthDataAvailable();
  if (!available) return { available: false };

  await HealthKit.requestAuthorization({
    toRead: [
      'HKQuantityTypeIdentifierBodyMass',
      'HKQuantityTypeIdentifierBodyFatPercentage',
      'HKQuantityTypeIdentifierHeartRate',
      'HKQuantityTypeIdentifierStepCount'
    ]
  });

  const [bodyMass, bodyFat, heartRate, steps] = await Promise.all([
    HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass').catch(() => null),
    HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyFatPercentage').catch(() => null),
    HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierHeartRate').catch(() => null),
    HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierStepCount').catch(() => null)
  ]);

  return {
    available: true,
    bodyMassKg: bodyMass?.quantity,
    bodyFatPercent: bodyFat ? bodyFat.quantity * (bodyFat.unit === '%' ? 1 : 100) : undefined,
    heartRateBpm: heartRate?.quantity,
    steps: steps?.quantity
  };
}
