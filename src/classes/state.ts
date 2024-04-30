import { Browser } from "puppeteer";
import { State, StateGetter, StateSetter } from "../interfaces/state";

let stateMachine: {
  browser?: Browser,
  state: State<unknown, unknown>,
  get: <T, K>() => State<T, K>,
  update: <T, K>(value:Partial<State<T, K>>) => void,
}

export const getLevel = ():number => {
  try{
    const [getState] = useState();
    return getState()['level'] as number;
  }catch(e:any){
    return 0
  }
}

export function startState<T, K>(value:State<T, K>): [StateGetter<T, K>, StateSetter<T, K>]{

  const get = <T, K>() => stateMachine.state as State<T, K>;

  const update = <T, K>(value:Partial<State<T, K>>) => {
    stateMachine.state = {...stateMachine.state, ...value};
  }

  stateMachine = {state:value, get, update};

  return [get, update]

}

export function useState<T, K>(): [StateGetter<T, K>, StateSetter<T, K>] {
  return [stateMachine.get, stateMachine.update]
}

export const getBrowser = () => {
  return stateMachine.browser
}

export const setBrowser = (browser: Browser) => {
  stateMachine.browser = browser;
}