export type AppleHealthSnapshot = {
  available: boolean;
  bodyMassKg?: number;
  bodyFatPercent?: number;
  heartRateBpm?: number;
  steps?: number;
};

// HealthKit is intentionally staged out until React Native 0.88 stable is published.
// Keeping this boundary lets the native bridge land without changing app architecture.
export async function readAppleHealthSnapshot(): Promise<AppleHealthSnapshot> {
  return { available: false };
}
