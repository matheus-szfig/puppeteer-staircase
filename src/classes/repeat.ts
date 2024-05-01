import { IStep, Logger } from "../interfaces/step";
import IRepeat from "../interfaces/repeat";
import { getLevel, useState } from "./state";

/**
 * A group of steps that will execute again in case of error, up to a limit of attempts.
 * @param id Unique name of a step
 * @param steps Array of Steps to be executed
 * @param limit Ammount of attempts allowed before throwing the error
 * @param logger Optional of two log functions that enable loggin of internal behaviour ( recommended )
 */
export default class Repeat<T, K> implements IRepeat<T, K> {
  id: string;
  steps: IStep<T, K>[];
  limit: number;
  attempt: number;
  logger?: {
    info: (...args: string[]) => void;
    error: (...args: string[]) => void;
  }

  constructor(id: string, steps: IStep<T, K>[], logger?:Logger, limit: number = 3) {
    this.id = `REPEAT-${id}`;
    this.steps = steps;
    this.limit = limit;
    this.attempt = 1

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

      
      if (this.attempt === 1) {
        setState({
          level:getState().level+1
        })
        if (this.logger) this.logger.info(`'${this.id}' starting.`);
      }

      for (let step of this.steps) {
        await step.execute();
      }

      if (this.logger) this.logger.info(`Repeat '${this.id}' ended.`);
      setState({
        level:getState().level-1
      })

    } catch (e: any) {

      if (this.logger) this.logger.error(`Repeat '${this.id}' attempt ${this.attempt} failed.`);
      if (this.attempt < this.limit) {
        this.attempt -= 1
        const browserReturn = await this.execute();
        return browserReturn;
      } else {
        throw e;
      }
      
    }
  }

}
