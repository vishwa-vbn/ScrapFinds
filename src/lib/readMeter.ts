let total = 0;

export function meterRead(count: number, label: string) {
  if (!import.meta.env.DEV) return;
  total += count;
  console.debug(`[readMeter] +${count} (${label}) → total: ${total}`);
}

export function resetMeter() {
  if (!import.meta.env.DEV) return;
  total = 0;
  console.debug('[readMeter] reset');
}

export function getMeterTotal() {
  return total;
}
