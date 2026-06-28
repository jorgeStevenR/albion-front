export interface AvalonCountdown {
  label: string;
  started: boolean;
  totalMinutes: number;
}

/** Returns countdown text updating minute-by-minute until scheduledAt. */
export function getAvalonCountdown(scheduledAt: string | undefined | null): AvalonCountdown | null {
  if (!scheduledAt) {
    return null;
  }

  const target = new Date(scheduledAt).getTime();
  if (Number.isNaN(target)) {
    return null;
  }

  const diffMs = target - Date.now();
  if (diffMs <= 0) {
    return { label: '¡Es hora del ping!', started: true, totalMinutes: 0 };
  }

  const totalMinutes = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return {
      label: `Faltan ${hours}h ${minutes}min`,
      started: false,
      totalMinutes,
    };
  }

  return {
    label: `Faltan ${totalMinutes} min`,
    started: false,
    totalMinutes,
  };
}
