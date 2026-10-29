import type { Player } from "./actions/player";

type ChangeListener = (actionId: string, playing: boolean) => void;

/**
 * Keeps track of every sound currently played by the plugin, grouped by the
 * Stream Deck action instance (its unique context id) that started it.
 *
 * Grouping by action id rather than by key coordinates avoids collisions between
 * keys at the same position on different pages, profiles or devices, and keeping
 * the exact Player instance lets overlapping sounds all be stopped later.
 */
export class SoundRegistry {
  private readonly players = new Map<string, Set<Player>>();
  private readonly listeners: ChangeListener[] = [];

  add(actionId: string, player: Player): void {
    let set = this.players.get(actionId);
    const wasPlaying = !!set?.size;
    if (!set) {
      set = new Set();
      this.players.set(actionId, set);
    }
    set.add(player);
    if (!wasPlaying) {
      this.notify(actionId, true);
    }
  }

  /** Removes one specific player; a no-op if it was already removed. */
  remove(actionId: string, player: Player): void {
    const set = this.players.get(actionId);
    if (!set?.delete(player)) {
      return;
    }
    if (set.size === 0) {
      this.players.delete(actionId);
      this.notify(actionId, false);
    }
  }

  isPlaying(actionId: string): boolean {
    return !!this.players.get(actionId)?.size;
  }

  /** Stops every sound started by one action. Returns how many were stopped. */
  stopAction(actionId: string): number {
    const set = this.players.get(actionId);
    if (!set?.size) {
      return 0;
    }
    const count = set.size;
    for (const player of [...set]) {
      player.stop();
    }
    this.players.delete(actionId);
    this.notify(actionId, false);
    return count;
  }

  /** Stops every sound started by the plugin. Returns how many were stopped. */
  stopAll(): number {
    let count = 0;
    for (const actionId of [...this.players.keys()]) {
      count += this.stopAction(actionId);
    }
    return count;
  }

  onChange(listener: ChangeListener): void {
    this.listeners.push(listener);
  }

  private notify(actionId: string, playing: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(actionId, playing);
      } catch {
        // A failing listener must never break playback bookkeeping.
      }
    }
  }
}
