import { IStep } from "./step";

export default interface IAction<T, K> extends IStep<T, K> {
  id: string;

  execute: () => Promise<void>;
}