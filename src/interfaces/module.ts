import { Browser, PuppeteerLaunchOptions } from "puppeteer";
import { IStep } from "./step";
import { State } from "./state";

export type PreSetupFn<T, K> = (state:State<T, K>) => Promise<{
  state:State<T, K>
  launchOptions?:Partial<PuppeteerLaunchOptions>
}>
export type PostSetupFn<T, K> = (browser: Browser, state:State<T, K>) => Promise<State<T, K>>;

export type ErrorFn<T, K> = (state:State<T, K>) => Promise<void>;
export type EndFn<T, K> = (state:State<T, K>) => Promise<void>;

export type ModuleConfig<T, K> = {
  preSetupFn?: PreSetupFn<T, K>,
  postSetupFn?: PostSetupFn<T, K>,
  onError?: ErrorFn<T, K>,
  onSuccess?: EndFn<T, K>,
  launchOptions?: PuppeteerLaunchOptions
}

export default interface IModule<T, K> {
  mId: string;
  steps: IStep<T, K>[];
  config?: ModuleConfig<T, K>;

  start: (data: T) => Promise<K>;
  execute: () => Promise<void>;
}
