import { v4 } from "uuid";
import { AdvancedWorker } from "./AdvancedWorker";

interface WorkerItem {
  uuid: string;
  worker: AdvancedWorker;
  active: boolean;
}

interface Task<Data extends object = any, Result = any> {
  getData: () => Data | Promise<Data>;
  callback: (error: any, result?: Result) => void;
}

export class WorkerPool {
  private taskQueue = new Array<Task>();

  private pool = new Array<WorkerItem>();

  private terminated = false;

  constructor(spawnWorker: () => AdvancedWorker, public readonly size: number) {
    for (let i = 0; i < size; i++) {
      this.pool.push({
        uuid: v4(),
        worker: spawnWorker(),
        active: false
      });
    }
  }

  public async run<Data extends object, Result>(getData: () => Data) {
    if (this.terminated) throw new Error("WorkerPool is terminated!");

    return new Promise((resolve, reject) => {
      const availableWorkerItem = this.getInactiveWorkerItem();
      const task: Task<Data, Result> = {
        getData,
        callback: (error: any, result: Result) => (error ? reject(error) : resolve(result))
      };

      if (availableWorkerItem) {
        this.runWorker<Data, Result>(availableWorkerItem, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  public terminate() {
    this.pool.forEach((workerItem) => workerItem.worker.terminate());
    this.terminated = true;
  }

  private async runWorker<Data extends object, Result>(workerItem: WorkerItem, task: Task<Data, Result>) {
    workerItem.active = true;

    const refresh = () => {
      workerItem.worker.removeAllListeners("message");
      workerItem.worker.removeAllListeners("error");
      workerItem.active = false;

      if (this.taskQueue.length) {
        this.runWorker(workerItem, this.taskQueue.shift());
      }
    };

    workerItem.worker.once("message", (event: MessageEvent<Result>) => {
      task.callback(null, event.data);
      refresh();
    });
    workerItem.worker.once("error", (event: ErrorEvent) => {
      task.callback(event);
      refresh();
    });

    workerItem.worker.postMessage({
      ...(await task.getData()),
      uuid: workerItem.uuid
    });
  }

  private getInactiveWorkerItem() {
    return this.pool.find((workerItem) => !workerItem.active);
  }
}
