import IDecision, { ActionMap, IDecisionFn } from "../interfaces/decision";
import { IStep, Logger } from "../interfaces/step";
import { getBrowser, getLevel, useState } from "./state";

/**
 * A group of steps that should be executed.
 * @param id Unique name of a step
 * @param decisionFn A function with access to browser and state that returns a string representing an avaliable key in the 'actionMap'
 * @param actionMap A Dictionary-like structure to map a key to an array of steps
 * @param logger Optional of two log functions that enable loggin of internal behaviour ( recommended )
 */
export default class Decision<T, K> implements IDecision<T, K> {
  id: string;
  decisionFn: IDecisionFn<T, K>;
  actionMap: ActionMap<T, K>;

  logger?: {
    info: (...args: string[]) => void;
    error: (...args: string[]) => void;
  };

  constructor(id: string, decisionFn: IDecisionFn<T, K>, actionMap: ActionMap<T, K>, logger: Logger) {
    this.id = `DECISION-${id}`;
    this.decisionFn = decisionFn;
    this.actionMap = actionMap;
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

      if (this.logger) this.logger.info(`Decision '${this.id}' starting.`);

      let k: string;

      k = await this.decisionFn(getState(), getBrowser());

      if (this.actionMap[k]) {
        for (let step of (this.actionMap[k] as IStep<T, K>[])) {
          await step.execute();
        }
      } else if (this.logger) {
        this.logger.error(`No actions found for key '${k}'.`);
      }

      if (this.logger) this.logger.info(`Decision '${this.id}' ended.`);
      setState({
        level:(getState().level as number)-1
      })

    } catch (e: any) {
      e['step'] = e['step'] ? `'${this.id}'>'${e['step']}'` : this.id;
      throw e;
    }
  }
}
