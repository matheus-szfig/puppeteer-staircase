import { Browser } from "puppeteer";
import { State } from "./state";

export type StepFn<T, K> =  (state:State<T, K>, browser: Browser) => Promise<State<T, K> | void>

export interface Logger {
  info: (...args: string[]) => void;
  error: (...args: string[]) => void;
}

export interface IStep<T, K> {
  id: string;
  logger?:{
    info: (...args:string[]) => void
    error: (...args:string[]) => void
  }
  execute: (...args:any) => Promise<any>;
}

export default interface IStepImpl<T, K> extends IStep<T, K> {
  execute: StepFn<T, K>;
}