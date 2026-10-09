import { isDueOnDate, localDateKey } from '@/domain/schedule';
import type { TimelineEntry, TodayItem } from '@/services/pulse';

export function calculateSevenDayConsistency(items: TodayItem[], logs: TimelineEntry[]) {
  const due = new Set<string>();
  const completed = new Set<string>();
  const today = new Date();

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = localDateKey(day);

    for (const item of items) {
      // A newly tracked item cannot be due before it was created.
      if (item.created_at && key < localDateKey(new Date(item.created_at))) continue;
      if (isDueOnDate(item.schedule, day)) due.add(`${item.id}:${key}`);
    }
  }

  for (const log of logs) {
    if (log.status !== 'completed' || !log.protocol_item_id) continue;
    const day = new Date(log.logged_at);
    const ageMs = today.getTime() - day.getTime();
    if (ageMs < 0 || ageMs > 8 * 86400000) continue;
    completed.add(`${log.protocol_item_id}:${localDateKey(day)}`);
  }

  let completedDue = 0;
  for (const key of due) if (completed.has(key)) completedDue += 1;

  return {
    due: due.size,
    completed: completedDue,
    percent: due.size ? Math.round((completedDue / due.size) * 100) : 100
  };
}

export function calculateSupplyForecast(items: TodayItem[]) {
  const forecasts = items.flatMap((item) => {
    const containers = (item.inventory_containers ?? []).filter((container) =>
      container.is_active && container.unit === item.dose_unit &&
      Number.isFinite(Number(container.remaining_amount)) &&
      Number.isFinite(Number(container.low_threshold))
    );
    if (!containers.length || item.dose_amount <= 0) return [];

    const remainingInitial = containers.reduce((sum, container) => sum + Number(container.remaining_amount), 0);
    const total = containers.reduce((sum, container) => sum + Number(container.total_amount), 0);
    const threshold = containers.reduce((sum, container) => sum + Number(container.low_threshold), 0);
    const dosesRemaining = Math.floor(remainingInitial / item.dose_amount);
    let projectedLowInDays: number | null = remainingInitial <= threshold ? 0 : null;
    let remaining = remainingInitial;
    const today = new Date();

    if (projectedLowInDays === null) {
      for (let offset = 0; offset <= 365; offset += 1) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
        day.setDate(day.getDate() + offset);
        if (!isDueOnDate(item.schedule, day)) continue;
        remaining -= item.dose_amount;
        if (remaining <= threshold) {
          projectedLowInDays = offset;
          break;
        }
      }
    }

    return [{
      itemId: item.id,
      name: item.name,
      unit: item.dose_unit,
      remaining: remainingInitial,
      total,
      dosesRemaining,
      projectedLowInDays
    }];
  });

  forecasts.sort((a, b) => (a.projectedLowInDays ?? Number.MAX_SAFE_INTEGER) - (b.projectedLowInDays ?? Number.MAX_SAFE_INTEGER));
  return forecasts;
}

export function siteRotationSummary(logs: TimelineEntry[]) {
  const recent = logs.filter((log) => log.site).slice(0, 30);
  return {
    uniqueSites: new Set(recent.map((log) => log.site)).size,
    administrations: recent.length
  };
}
