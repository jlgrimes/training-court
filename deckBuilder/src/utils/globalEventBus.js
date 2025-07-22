// Simple event bus for deck builder
class GlobalEventBus extends EventTarget {
  emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

export const globalEventBus = new GlobalEventBus();