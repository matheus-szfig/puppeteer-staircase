import { Browser } from 'puppeteer';
import { IStep } from "./step";
import { State } from "./state";

export type ActionMap<T, K> = Record<string, IStep<T, K>[]>

export type IDecisionFn<T, K>  = (state:State<T, K>, browser: Browser) => Promise<string>

export default interface IDecision<T, K> extends IStep<T, K> {
  id: string;
  actionMap: ActionMap<T, K>;
  decisionFn: IDecisionFn<T, K>

  execute: () => Promise<void>;
}