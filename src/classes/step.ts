import { Browser } from "puppeteer";
import { Logger, StepFn } from "../interfaces/step";
import proxyConfig from "../config/proxy";
import { State } from "../interfaces/state";
import { getBrowser, getLevel, useState } from "./state";
import IStepImpl from "../interfaces/step";

/**
 * A group of steps that should be executed.
 * @param {string} id Unique name of a step
 * @param {StepFn} stepFn A Function with acces to browser and state, the most basic step type and the one where should happen DOM interaction
 * @param {Logger} logger Optional two log functions that enable loggin of internal behaviour ( recommended )
 * @param {"on" | "off"} proxy Turns on or off the use of the proxy set in the PROXY_URL env variable
 */
export default class Step<T, K> implements IStepImpl<T, K> {
  id: string;
  stepFn: StepFn<T, K>;
  proxy?: "on" | "off";

  logger?: {
    info: (message:string) => void;
    error: (message:string) => void;
  };

  constructor(id: string, implementation: StepFn<T, K>, logger?: Logger, proxy?: "on" | "off") {
    this.id = `STEP-${id}`;
    this.stepFn = implementation;
    this.proxy = proxy;
    if (logger) {
      this.logger = {
        info: (msg:string) => logger.info('    '.repeat(getLevel()) + msg),
        error: (msg:string) => logger.error('    '.repeat(getLevel()) + msg)
      }
    }
  }

  execute = async (): Promise<State<T, K>> => {

    const [getState, setState] = useState<T, K>();

    try {

      setState({
        level:(getState().level as number)+1
      })
      if (this.logger) this.logger.info(`Step '${this.id}' starting`);
      

      switch (this.proxy) {
        case "on":
          proxyConfig.setOn();
          if (this.logger) this.logger.info(`Step '${this.id}' turned proxy on`);
          break;
        case "off":
          proxyConfig.setOff();
          if (this.logger) this.logger.info(`Step '${this.id}' turned proxy off`);
          break;
      }

      const res = await this.stepFn(getState() as State<T, K>, getBrowser() as Browser);
      
      if (this.logger) this.logger.info(`Step '${this.id}' ended.`);
      setState({
        level:(getState().level as number)-1
      })

      return res as State<T, K>;

    } catch (e: any) {
      throw e;
    }
  }
}
