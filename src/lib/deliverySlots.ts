export interface DeliverySlotDefinition {
  id: '09:00-10:00' | '10:00-11:00' | '18:00-19:00' | '19:00-20:00';
  label: string;
  shortLabel: string;
  period: 'Morning' | 'Evening';
  startHour: number; // 24-hour IST
  endHour: number;   // 24-hour IST
}

export const DELIVERY_SLOTS: readonly DeliverySlotDefinition[] = [
  {
    id: '09:00-10:00',
    label: '9:00 AM – 10:00 AM',
    shortLabel: '9–10 AM',
    period: 'Morning',
    startHour: 9,
    endHour: 10,
  },
  {
    id: '10:00-11:00',
    label: '10:00 AM – 11:00 AM',
    shortLabel: '10–11 AM',
    period: 'Morning',
    startHour: 10,
    endHour: 11,
  },
  {
    id: '18:00-19:00',
    label: '6:00 PM – 7:00 PM',
    shortLabel: '6–7 PM',
    period: 'Evening',
    startHour: 18,
    endHour: 19,
  },
  {
    id: '19:00-20:00',
    label: '7:00 PM – 8:00 PM',
    shortLabel: '7–8 PM',
    period: 'Evening',
    startHour: 19,
    endHour: 20,
  },
] as const;

export type DeliverySlotId = DeliverySlotDefinition['id'];
export type DeliveryDayType = 'TODAY' | 'TOMORROW';
export type SlotAvailabilityStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'PASSED';

export interface IstClockInfo {
  dateKey: string;      // e.g. '2026-11-21'
  displayDate: string;  // e.g. '21 Nov 2026'
  shortDate: string;    // e.g. '21 Nov'
  hour: number;         // 0..23
  minute: number;       // 0..59
  totalMinutes: number; // hour * 60 + minute
}

export interface EvaluatedSlotOption {
  slot: DeliverySlotDefinition;
  dayType: DeliveryDayType;
  dateKey: string;
  displayDate: string;
  shortDate: string;
  status: SlotAvailabilityStatus;
  isSelectable: boolean;
  isNextAvailable: boolean;
  canonicalValue: string; // Stored in DB: e.g. '22 Nov 2026 • 9:00 AM – 10:00 AM'
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ParsedCanonicalSlot {
  dateKey: string;       // e.g. '2026-11-22'
  displayDate: string;   // e.g. '22 Nov 2026'
  shortDate: string;     // e.g. '22 Nov'
  slot: DeliverySlotDefinition;
  startEpochMs: number;  // UTC epoch ms when this slot starts in IST
  endEpochMs: number;    // UTC epoch ms when this slot ends in IST
}

function formatHour12(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}:00 ${period}`;
}

/**
 * Parses a canonical stored slot string such as '22 Nov 2026 • 6:00 PM – 7:00 PM'
 * into exact IST start/end epoch timestamps.
 */
export function parseCanonicalDeliverySlot(
  storedSlot?: string | null
): ParsedCanonicalSlot | null {
  if (!storedSlot) return null;
  const trimmed = storedSlot.trim();
  const sepIdx = trimmed.indexOf('•');
  if (sepIdx <= 0) return null;

  const datePart = trimmed.slice(0, sepIdx).trim();
  const labelPart = trimmed.slice(sepIdx + 1).trim();

  const dateMatch = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(datePart);
  if (!dateMatch) return null;

  const day = Number(dateMatch[1]);
  const monthIdx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === dateMatch[2].toLowerCase()
  );
  const year = Number(dateMatch[3]);
  if (monthIdx < 0 || !Number.isFinite(day) || day < 1 || day > 31) return null;

  const slot = DELIVERY_SLOTS.find(
    (s) => s.label.replace(/\s+/g, ' ') === labelPart.replace(/\s+/g, ' ')
  );
  if (!slot) return null;

  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateKey = `${year}-${mm}-${dd}`;
  const startHh = String(slot.startHour).padStart(2, '0');
  const endHh = String(slot.endHour).padStart(2, '0');

  const startEpochMs = Date.parse(`${dateKey}T${startHh}:00:00+05:30`);
  const endEpochMs = Date.parse(`${dateKey}T${endHh}:00:00+05:30`);
  if (Number.isNaN(startEpochMs) || Number.isNaN(endEpochMs)) return null;

  return {
    dateKey,
    displayDate: `${day} ${MONTH_NAMES[monthIdx]} ${year}`,
    shortDate: `${day} ${MONTH_NAMES[monthIdx]}`,
    slot,
    startEpochMs,
    endEpochMs,
  };
}

/**
 * True when the current IST clock has reached or passed the start of the order's chosen slot.
 */
export function isDeliverySlotStarted(
  storedSlot?: string | null,
  now: Date = new Date()
): boolean {
  const parsed = parseCanonicalDeliverySlot(storedSlot);
  if (!parsed) return false;
  return now.getTime() >= parsed.startEpochMs;
}

/**
 * Human-friendly payment deadline for a slot (e.g. 'Today, 6:00 PM' or 'Tomorrow, 9:00 AM').
 */
export function getSlotPaymentDeadlineText(
  storedSlot?: string | null,
  now: Date = new Date()
): string {
  const parsed = parseCanonicalDeliverySlot(storedSlot);
  if (!parsed) return '';

  const today = getIstClock(now);
  const tomorrow = getTomorrowIstDate(now);
  const timeText = formatHour12(parsed.slot.startHour);

  if (parsed.dateKey === today.dateKey) return `Today, ${timeText}`;
  if (parsed.dateKey === tomorrow.dateKey) return `Tomorrow, ${timeText}`;
  return `${parsed.shortDate}, ${timeText}`;
}

/**
 * Pure IST (Asia/Kolkata, UTC+05:30) date/time decomposition with zero DST ambiguity.
 */
export function getIstClock(now: Date = new Date()): IstClockInfo {
  const istMs = now.getTime() + IST_OFFSET_MS;
  const d = new Date(istMs);
  const year = d.getUTCFullYear();
  const monthIdx = d.getUTCMonth();
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();

  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const shortDate = `${day} ${MONTH_NAMES[monthIdx]}`;

  return {
    dateKey: `${year}-${mm}-${dd}`,
    displayDate: `${shortDate} ${year}`,
    shortDate,
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

export function getTomorrowIstDate(now: Date = new Date()): {
  dateKey: string;
  displayDate: string;
  shortDate: string;
} {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const clock = getIstClock(tomorrow);
  return {
    dateKey: clock.dateKey,
    displayDate: clock.displayDate,
    shortDate: clock.shortDate,
  };
}

export function getSlotById(slotId: string): DeliverySlotDefinition | undefined {
  return DELIVERY_SLOTS.find((s) => s.id === slotId);
}

/**
 * Rule: Customers CANNOT select a slot that is currently in progress OR has already passed.
 * A Today slot is available strictly when current IST time < slot start hour.
 * All Tomorrow slots are available.
 */
export function getSlotStatusForDay(
  slot: DeliverySlotDefinition,
  dayType: DeliveryDayType,
  now: Date = new Date()
): SlotAvailabilityStatus {
  if (dayType === 'TOMORROW') return 'AVAILABLE';
  const clock = getIstClock(now);
  const startMin = slot.startHour * 60;
  const endMin = slot.endHour * 60;

  if (clock.totalMinutes < startMin) return 'AVAILABLE';
  if (clock.totalMinutes < endMin) return 'IN_PROGRESS';
  return 'PASSED';
}

export function getSlotsForDay(
  dayType: DeliveryDayType,
  now: Date = new Date()
): EvaluatedSlotOption[] {
  const today = getIstClock(now);
  const tomorrow = getTomorrowIstDate(now);
  const dateInfo =
    dayType === 'TODAY'
      ? { dateKey: today.dateKey, displayDate: today.displayDate, shortDate: today.shortDate }
      : tomorrow;

  const nextOverall = getNextAvailableSlot(now);

  return DELIVERY_SLOTS.map((slot) => {
    const status = getSlotStatusForDay(slot, dayType, now);
    const isSelectable = status === 'AVAILABLE';
    const isNextAvailable =
      isSelectable &&
      nextOverall.dayType === dayType &&
      nextOverall.slot.id === slot.id;

    return {
      slot,
      dayType,
      dateKey: dateInfo.dateKey,
      displayDate: dateInfo.displayDate,
      shortDate: dateInfo.shortDate,
      status,
      isSelectable,
      isNextAvailable,
      canonicalValue: `${dateInfo.displayDate} • ${slot.label}`,
    };
  });
}

export function hasAnyAvailableSlotToday(now: Date = new Date()): boolean {
  return DELIVERY_SLOTS.some((slot) => getSlotStatusForDay(slot, 'TODAY', now) === 'AVAILABLE');
}

export function getNextAvailableSlot(now: Date = new Date()): {
  dayType: DeliveryDayType;
  dateKey: string;
  displayDate: string;
  shortDate: string;
  slot: DeliverySlotDefinition;
  canonicalValue: string;
  shortText: string;
  fullText: string;
} {
  const today = getIstClock(now);
  const todayMatch = DELIVERY_SLOTS.find(
    (slot) => getSlotStatusForDay(slot, 'TODAY', now) === 'AVAILABLE'
  );

  if (todayMatch) {
    return {
      dayType: 'TODAY',
      dateKey: today.dateKey,
      displayDate: today.displayDate,
      shortDate: today.shortDate,
      slot: todayMatch,
      canonicalValue: `${today.displayDate} • ${todayMatch.label}`,
      shortText: `Today, ${todayMatch.shortLabel}`,
      fullText: `Today (${today.shortDate}) • ${todayMatch.label}`,
    };
  }

  const tomorrow = getTomorrowIstDate(now);
  const firstTomorrow = DELIVERY_SLOTS[0];
  return {
    dayType: 'TOMORROW',
    dateKey: tomorrow.dateKey,
    displayDate: tomorrow.displayDate,
    shortDate: tomorrow.shortDate,
    slot: firstTomorrow,
    canonicalValue: `${tomorrow.displayDate} • ${firstTomorrow.label}`,
    shortText: `Tomorrow, ${firstTomorrow.shortLabel}`,
    fullText: `Tomorrow (${tomorrow.shortDate}) • ${firstTomorrow.label}`,
  };
}

/**
 * Formats a stored slot value (e.g. '21 Nov 2026 • 6:00 PM – 7:00 PM') with a
 * live '(Today)' or '(Tomorrow)' tag when viewed on or before that date.
 */
export function formatDeliverySlotForDisplay(
  storedSlot?: string | null,
  now: Date = new Date()
): string {
  if (!storedSlot) return '';
  const trimmed = storedSlot.trim();
  if (!trimmed) return '';

  const today = getIstClock(now);
  const tomorrow = getTomorrowIstDate(now);

  if (trimmed.startsWith(`${today.displayDate} • `)) {
    return `Today (${today.shortDate}) • ${trimmed.slice(today.displayDate.length + 3)}`;
  }
  if (trimmed.startsWith(`${tomorrow.displayDate} • `)) {
    return `Tomorrow (${tomorrow.shortDate}) • ${trimmed.slice(tomorrow.displayDate.length + 3)}`;
  }
  return trimmed;
}

/**
 * Server-side authoritative validation for Bhavnagar scheduled delivery slots.
 * Rejects past slots and any slot currently in progress (enforcing next-slot rule).
 */
export function validateDeliverySlotSelection(
  slotId: unknown,
  slotDateKey: unknown,
  now: Date = new Date(),
  allowAnyForAdmin = false
): { ok: true; canonicalValue: string } | { ok: false; error: string } {
  const cleanId = typeof slotId === 'string' ? slotId.trim() : '';
  const cleanDate = typeof slotDateKey === 'string' ? slotDateKey.trim() : '';

  const slot = getSlotById(cleanId);
  if (!slot) {
    return {
      ok: false,
      error: 'Please select a valid Bhavnagar delivery slot (9–10 AM, 10–11 AM, 6–7 PM, or 7–8 PM).',
    };
  }

  const today = getIstClock(now);
  const tomorrow = getTomorrowIstDate(now);

  if (cleanDate === today.dateKey) {
    const status = getSlotStatusForDay(slot, 'TODAY', now);
    if (!allowAnyForAdmin && status !== 'AVAILABLE') {
      const next = getNextAvailableSlot(now);
      return {
        ok: false,
        error:
          status === 'IN_PROGRESS'
            ? `The ${slot.label} slot is currently in progress and closed for new orders. Please choose the next slot (${next.shortText}).`
            : `The ${slot.label} slot for today has already passed. Please choose the next available slot (${next.shortText}).`,
      };
    }
    return { ok: true, canonicalValue: `${today.displayDate} • ${slot.label}` };
  }

  if (cleanDate === tomorrow.dateKey) {
    return { ok: true, canonicalValue: `${tomorrow.displayDate} • ${slot.label}` };
  }

  return {
    ok: false,
    error: 'Please choose a delivery slot for Today or Tomorrow.',
  };
}
