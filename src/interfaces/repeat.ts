import { StepFn, IStep } from "./step";

export default interface IRepeat<T, K> extends IStep<T, K> {
  id: string;
  steps: IStep<T, K>[];
  limit: number;
  attempt:number;

  execute: StepFn<T, K>;
}
