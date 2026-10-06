export type Schedule =
  | { type: 'daily'; time?: string }
  | { type: 'weekdays'; time?: string; days: number[] }
  | { type: 'interval'; time?: string; everyDays: number; startDate: string }
  | { type: 'cycle'; time?: string; onDays: number; offDays: number; startDate: string }
  | { type: 'as_needed' };

export type TemporarySchedule = {
  startDate: string;
  endDate: string;
  paused?: boolean;
  time?: string;
};

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: string) {
  const [rawY, rawM, rawD] = value.split('-').map(Number);
  const y = Number.isFinite(rawY) ? rawY : 1970;
  const m = Number.isFinite(rawM) ? rawM : 1;
  const d = Number.isFinite(rawD) ? rawD : 1;
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(a: Date, b: Date) {
  const ms = dateOnly(a).getTime() - dateOnly(b).getTime();
  return Math.floor(ms / 86400000);
}

export function scheduleTime(schedule: Record<string, unknown>) {
  const temp = schedule.temporary as TemporarySchedule | undefined;
  if (temp?.time) return temp.time;
  return typeof schedule.time === 'string' ? schedule.time : undefined;
}

export function isDueOnDate(schedule: Record<string, unknown>, date = new Date()) {
  if (!schedule || Object.keys(schedule).length === 0) return true;

  const temp = schedule.temporary as TemporarySchedule | undefined;
  if (temp?.startDate && temp?.endDate) {
    const start = parseLocalDate(temp.startDate);
    const end = parseLocalDate(temp.endDate);
    const day = dateOnly(date);
    if (day >= dateOnly(start) && day <= dateOnly(end) && temp.paused) return false;
  }

  const type = typeof schedule.type === 'string' ? schedule.type : 'daily';

  if (type === 'as_needed') return false;
  if (type === 'daily') return true;

  if (type === 'weekdays') {
    const days = Array.isArray(schedule.days) ? schedule.days.filter((v): v is number => typeof v === 'number') : [];
    return days.includes(date.getDay());
  }

  if (type === 'interval') {
    const everyDays = typeof schedule.everyDays === 'number' ? Math.max(1, Math.floor(schedule.everyDays)) : 1;
    const startDate = typeof schedule.startDate === 'string' ? parseLocalDate(schedule.startDate) : date;
    const diff = daysBetween(date, startDate);
    return diff >= 0 && diff % everyDays === 0;
  }

  if (type === 'cycle') {
    const onDays = typeof schedule.onDays === 'number' ? Math.max(1, Math.floor(schedule.onDays)) : 1;
    const offDays = typeof schedule.offDays === 'number' ? Math.max(0, Math.floor(schedule.offDays)) : 0;
    const startDate = typeof schedule.startDate === 'string' ? parseLocalDate(schedule.startDate) : date;
    const diff = daysBetween(date, startDate);
    if (diff < 0) return false;
    const length = onDays + offDays;
    return length > 0 && diff % length < onDays;
  }

  return true;
}

export function formatSchedule(schedule: Record<string, unknown>) {
  const type = typeof schedule.type === 'string' ? schedule.type : 'daily';
  const time = scheduleTime(schedule);

  if (type === 'daily') return time ? `Daily · ${time}` : 'Daily';
  if (type === 'weekdays') {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = Array.isArray(schedule.days) ? schedule.days as number[] : [];
    return `${days.map((d) => labels[d]).filter(Boolean).join(', ') || 'Selected days'}${time ? ` · ${time}` : ''}`;
  }
  if (type === 'interval') return `Every ${schedule.everyDays ?? 1} days${time ? ` · ${time}` : ''}`;
  if (type === 'cycle') return `${schedule.onDays ?? 1} on / ${schedule.offDays ?? 0} off${time ? ` · ${time}` : ''}`;
  return 'As needed';
}
