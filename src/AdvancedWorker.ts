export interface AdvancedWorker extends Worker {
  once<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, event: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  once(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

  removeAllListeners<K extends keyof WorkerEventMap>(type: K): void;
  removeAllListeners(type: string): void;
}

export function createAdvancedWorker(worker: Worker): AdvancedWorker {
  const listenerMap = new Map<string, Map<EventListenerOrEventListenerObject, boolean | AddEventListenerOptions>>();

  const advancedWorker: AdvancedWorker = Object.create(Object.create(worker));

  Object.defineProperties(Object.getPrototypeOf(advancedWorker), {
    postMessage: {
      configurable: false,
      enumerable: false,
      writable: false,
      value(...args: [any, any]) {
        return worker.postMessage(...args);
      }
    },
    addEventListener: {
      configurable: false,
      enumerable: false,
      writable: false,
      value(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        if (!listenerMap.has(type)) listenerMap.set(type, new Map());
        listenerMap.get(type).set(listener, options);

        return worker.addEventListener(type, listener, options);
      }
    },
    once: {
      configurable: false,
      enumerable: false,
      writable: false,
      value<K extends keyof WorkerEventMap>(
        type: K,
        listener: (this: Worker, event: WorkerEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
      ) {
        const wrappedListener = (event: WorkerEventMap[K]) => {
          advancedWorker.removeEventListener(type, wrappedListener, options);
          return listener.call(advancedWorker, event);
        };
        advancedWorker.addEventListener<K>(type, wrappedListener, options);
      }
    },
    removeEventListener: {
      configurable: false,
      enumerable: false,
      writable: false,
      value(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        if (listenerMap.has(type)) listenerMap.get(type).delete(listener);

        return worker.removeEventListener(type, listener, options);
      }
    },
    removeAllListeners: {
      configurable: false,
      enumerable: false,
      writable: false,
      value(type: string) {
        if (listenerMap.has(type)) {
          listenerMap
            .get(type)
            .forEach((options, listener) => advancedWorker.removeEventListener(type, listener, options));
        }
      }
    }
  });

  return advancedWorker;
}
