/**
*
* @template T Input data that is needed for execution, can be changed during runtime.
*
* @template K Output data, can be changed during runtime.
*
* */
export type State<T, K> = {
  data?: T;
  result?: K;
  startTime?: number;
  onExec: boolean;
  success: boolean;
  ongoingStep?: string;
  level?: number;
};

export type StateSetter<T, K> = (value: Partial<State<T, K>>) => void;

export type StateGetter<T, K> = () => State<T, K>;
