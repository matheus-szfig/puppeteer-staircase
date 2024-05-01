import IAction from "../interfaces/action";
import { getLevel, useState } from "./state";
import { IStep, Logger } from "../interfaces/step";

/**
 * A group of steps that should be executed.
 * @param {string} id Unique name of a step
 * @param {IStep[]} steps Array of Steps to be executed
 * @param {Logger} logger Optional two log functions that enable loggin of internal behaviour ( recommended )
 */
export default class Action<T, K> implements IAction<T, K> {
  id: string;
  steps: IStep<T, K>[];
  logger?: {
    info: (message:string) => void;
    error: (message:string) => void;
  };

  constructor(id: string, steps: IStep<T, K>[], logger: Logger) {
    this.id = `ACTION-${id}`;
    this.steps = steps;
    if (logger) {
      this.logger = {
        info: (msg:string) => logger.info('    '.repeat(getLevel()) + msg),
        error: (msg:string) => logger.error('    '.repeat(getLevel()) + msg)
      }
    }
  }

  execute = async (): Promise<void> => {

    const [getState, setState] = useState<T, K>();

    try {

      setState({
        level:(getState().level as number)+1
      })

      if (this.logger) this.logger.info(`Action '${this.id}' start.`);

      for (let step of this.steps) {
        const state = await step.execute();
      }
      
      if (this.logger) this.logger.info(`Action '${this.id}' end.`);
      setState({
        level:(getState().level as number)-1
      })
    } catch (e: any) {
      throw e;
    }
  }
}
