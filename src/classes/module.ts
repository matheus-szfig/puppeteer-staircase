import { Browser } from "puppeteer";
import { IStep, Logger } from "../interfaces/step";
import IModule, { ModuleConfig } from "../interfaces/module";
import puppeteer from 'puppeteer';
import { State, StateGetter, StateSetter } from "../interfaces/state";
import { getBrowser, getLevel, setBrowser, startState } from "./state";
import proxyConfig from "../config/proxy";
import useProxy from "puppeteer-page-proxy";

/**
 * A group of steps that should be executed.
 * @param mId Unique name of a module
 * @param steps Array of Steps to be executed
 * @param logger Optional of two log functions that enable loggin of internal behaviour ( recommended )
 * @param initialState the state when the execution starts
 * @param config the configuration options for a module
 */
export default class Module<T, K> implements IModule<T, K> {
  mId:string;
  steps: IStep<T, K>[];

  setState: StateSetter<T, K>;
  getState: StateGetter<T, K>;
  getBrowser: () => Browser | undefined;
  setBrowser: (browser: Browser) => void;

  config: ModuleConfig<T, K> = {};
  logger?: Logger;
  constructor (mId:string, steps: IStep<T, K>[], logger?:Logger, initialState?:Omit<State<T, K>, "onExec"|"success"|"startTime">, config?:ModuleConfig<T, K>) {
    this.mId = mId;
    this.steps = steps;

    [this.getState, this.setState] = startState<T, K>({
      onExec: false,
      success: true,
      level: 0,
      ...initialState
    })

    this.getBrowser = getBrowser;
    this.setBrowser = setBrowser;

    if(config?.preSetupFn) this.config.preSetupFn = config.preSetupFn;
    if(config?.postSetupFn) this.config.postSetupFn = config.postSetupFn;
    if(config?.launchOptions) this.config.launchOptions = config.launchOptions;
    if(config?.onError) this.config.onError = config.onError;
    if(config?.onSuccess) this.config.onSuccess = config.onSuccess;

    if (logger) {
      this.logger = {
        info: (msg:string) => logger.info('    '.repeat(getLevel()) + msg),
        error: (msg:string) => logger.error('    '.repeat(getLevel()) + msg)
      }
    }
  }

  start = async (data: T): Promise<K> => {

    try{

      if (this.logger) this.logger.info(`Starting module '${this.mId}'.`);
      this.setState({...this.getState(), data, startTime: new Date().getTime()});

      if(this.config.preSetupFn) {
        if (this.logger) this.logger.info(`Executing pre-setup.`);
        const {state, launchOptions} = await this.config.preSetupFn(this.getState());

        if (this.logger) this.logger.info(`Updating state.`);
        this.setState(state);
        this.config.launchOptions = {...this.config.launchOptions, ...launchOptions};
      }

      if (this.logger) this.logger.info(`Creating browser instance.`);

      let browser = await puppeteer.launch(this.config.launchOptions);
      this.setBrowser(browser);

      browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if(page){
          page?.on('request', async (req) => {
            if(proxyConfig.getState()){
              await useProxy(req, `${proxyConfig.getAddress()}`);
            }else{
              await req.continue();
            }
          });
        }
      })


      if (this.logger) this.logger.info(`DONE. Browser instance created.`);

      if(this.config.postSetupFn) {
        if (this.logger) this.logger.info(`Executing post-setup.`);
        const state = await this.config.postSetupFn(browser, this.getState());

        if (this.logger) this.logger.info(`Updating state.`);
        this.setState({...this.getState(), ...state});
      }

      await this.execute();

    }catch(e:any){

      this.setState({...this.getState(), success: false})
      const browser = this.getBrowser();
      if(browser) await (await browser.pages())[0]?.screenshot({path:'tmp/screenshot.jpeg', type:'jpeg'});

      if(!this.getState().onExec) {
        if (this.logger) this.logger.error(`Module '${this.mId}' failed to START.`);
      }else{
        if (this.logger) this.logger.error(`Module '${this.mId}' failed to EXECUTE.`);
        if (this.logger) this.logger.error(`Error on step: ${this.getState().ongoingStep}.`);
      }

      if (this.logger) this.logger.error(`Error code: ${e['code']}.`);
      if (this.logger) this.logger.error(`Error message: ${e['message']}.`);
      
      if(this.config.onError){
        await this.config.onError(this.getState())
      }

    }finally{
      
      await this.getBrowser()?.close();

      if(this.getState().success && this.config.onSuccess){
        this.config.onSuccess(this.getState());
      }

      if (this.logger) this.logger.error(`Module '${this.mId}' ended successfully.`);

      return {...this.getState().result} as K;
    }
  }

  execute = async (): Promise<void> => {

    if (this.logger) this.logger.info(`Module execution starting.`);
    this.setState({...this.getState(), onExec: true})

    try{

      for(let i in this.steps){
        this.setState({...this.getState(), ongoingStep: (this.steps[i] as IStep<T,K>).id})
        let s = await (this.steps[i] as IStep<T,K>).execute()
        this.setState(s as State<T, K>);
      }

    }catch(e:any){

      throw e;

    }
  }

}