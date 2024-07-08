export abstract class DataService {
  abstract init(): Promise<void>;
  abstract onListening(): void;
  abstract getStatus(): object;
}
