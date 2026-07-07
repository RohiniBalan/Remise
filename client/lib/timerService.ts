// Dedicated countdown-timer service. Framework-agnostic (no React), so it
// can back any UI countdown (resend cooldowns, expiring codes/links, etc.)
// via the useCountdownTimer hook in app/hooks.
export class CountdownTimer {
  private endTime: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly durationSeconds: number) {}

  start(onTick?: (secondsLeft: number) => void, onExpire?: () => void): void {
    this.stop();
    this.endTime = Date.now() + this.durationSeconds * 1000;

    const tick = () => {
      const secondsLeft = this.getSecondsLeft();
      onTick?.(secondsLeft);
      if (secondsLeft <= 0) {
        this.stop();
        onExpire?.();
      }
    };

    tick();
    this.intervalId = setInterval(tick, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getSecondsLeft(): number {
    if (this.endTime === null) return 0;
    return Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
