/**
 * Simple performance profiler for tracking execution time
 */
export class Profiler {
  private startTime: number;
  private checkpoints: Map<string, number>;
  private lastCheckpoint: number;
  private enabled: boolean;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
    this.startTime = Date.now();
    this.lastCheckpoint = this.startTime;
    this.checkpoints = new Map();
  }

  /**
   * Mark a checkpoint and return time since last checkpoint
   * Does nothing if profiler is disabled
   */
  checkpoint(label: string): number {
    if (!this.enabled) return 0;

    const now = Date.now();
    const duration = now - this.lastCheckpoint;
    this.checkpoints.set(label, duration);
    this.lastCheckpoint = now;
    return duration;
  }

  /**
   * Get total elapsed time since profiler started
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get formatted report of all checkpoints
   * Logs to console if profiler is enabled, does nothing if disabled
   */
  report(method?: string, path?: string): void {
    if (!this.enabled) return;

    const lines: string[] = [];

    // Add request info if provided
    if (method && path) {
      lines.push(`\n[${method} ${path}]`);
    }

    lines.push(`\n=== Performance Profile (Total: ${this.elapsed()}ms) ===`);

    let index = 1;
    for (const [label, duration] of this.checkpoints.entries()) {
      const percentage = ((duration / this.elapsed()) * 100).toFixed(1);
      lines.push(`  ${index}. ${label}: ${duration}ms (${percentage}%)`);
      index++;
    }

    lines.push('==========================================\n');
    console.log(lines.join('\n'));
  }

  /**
   * Get JSON report of all checkpoints
   */
  toJSON(): Record<string, number> {
    const data: Record<string, number> = {
      total: this.elapsed(),
    };

    for (const [label, duration] of this.checkpoints.entries()) {
      data[label] = duration;
    }

    return data;
  }
}
