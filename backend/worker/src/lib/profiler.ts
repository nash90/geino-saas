/**
 * Simple performance profiler for tracking execution time
 */
export class Profiler {
  private startTime: number;
  private checkpoints: Map<string, number>;
  private lastCheckpoint: number;

  constructor() {
    this.startTime = Date.now();
    this.lastCheckpoint = this.startTime;
    this.checkpoints = new Map();
  }

  /**
   * Mark a checkpoint and return time since last checkpoint
   */
  checkpoint(label: string): number {
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
   */
  report(): string {
    const lines: string[] = [];
    lines.push(`\n=== Performance Profile (Total: ${this.elapsed()}ms) ===`);

    let index = 1;
    for (const [label, duration] of this.checkpoints.entries()) {
      const percentage = ((duration / this.elapsed()) * 100).toFixed(1);
      lines.push(`  ${index}. ${label}: ${duration}ms (${percentage}%)`);
      index++;
    }

    lines.push('==========================================\n');
    return lines.join('\n');
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
