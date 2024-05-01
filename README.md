# puppeteer-staircase

Staircase framework for puppeteer

## Example Use

``` typescript
  import Staircase from 'puppeteer-staircase';
  import { Browser } from "puppeteer";

  const step1 = new Staircase.Step('first-step', async (state: Staircase.State<{info?:string}, {res?:string}>, browser: Browser) => {

    const page = (await browser.pages())[0]; // example DOM interaction
    await page?.goto('https://github.com');

    console.log(state.data, state.result); // prints {info: 'foo'} and {res: null} as in the module initialState

    state.data = {...state.data, info: 'bar'} // state data change

    return state; // always return state for persistence
  })

  const step2 = new Staircase.Step('second-step', async (state: Staircase.State<{info?:string}, {res?:string}>, browser: Browser) => {

    console.log(state.data, state.result); // prints {info: 'bar'} and {res: null}

    state.result = {...state.result, res: 'some return'} // state result change

    return state; // return state for persistence
  })

  const module = new Staircase.Module<{info?:string}, {res:null}>('module-name', [step1, step2], undefined, {result:{res: null}})

  const data = module.start({info:'foo'}) //start state input
    .then(res => { console.log(result) }) // prints {res: 'some return'}
```

---

## Definitions

### Object: State \<`T`, `K`\>

The data collection that is persistent through steps.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

---

### Object: Logger

Object that contains a pair of functions as properties. Must be filled to enable built-in behaviour logging.

#### Types

| Type | Signature |
| :------ | :------ |
| `info` | `(message:string) => void` |
| `error` | `(message:string) => void` |

---

### Object: ModuleConfig\<T, K\>

Object that contains the options and methods of a module's setup.

#### Types

| Type | Signature | Description |
| :------ | :------ | :------ |
| `preSetupFn` | `(state:State<T, K>) => Promise\<{ state:State\<T, K\>, launchOptions?:Partial\<PuppeteerLaunchOptions\> }\>` | Pre browser launch setup function, state and lanchOptions returned are persisted |
| `PostSetupFn` | `(browser: Browser, state:State<T, K>) => Promise\<State\<T, K\>\>` | Post browser launch setup function, state returned is persisted and has access to browser instance. |
| `onError` | `(error:any, state:State<T, K>) => Promise<void>` | Method called on module's execution fail. |
| `onSccess` | `(state:State<T, K>) => Promise<void>` | Method called on module's execution succeed. |
| `launchOptions` | `PuppeteerLaunchOptions` | LaunchOptions for puppeteer |

---

### Class: Step \<`T`, `K`\>

The cornerstone class of this framework, the base of the DOM interaction via the `implementation` parameter.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :----- |
| `id` | `string` | Unique name of a step |
| `implementation` | `StepFn`\<`T`, `K`\> | A Function with acces to browser and state, the most basic step type and the one where should happen DOM interaction |
| `logger?` | `Logger` | Optional two log functions that enable loggin of internal behaviour ( recommended ) |
| `proxy?` | ``"on"`` \| ``"off"`` | Turns on or off the use of the proxy set in the PROXY_URL env variable |

---

### Class: Action \<`T`, `K`\>

A group of steps that should be executed.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :----- |
| `id` | `string` | Unique name of a step |
| `steps` | `IStep\<T, K\>[]` | Array of Steps to be executed |
| `logger?` | `Logger` | Optional two log functions that enable loggin of internal behaviour ( recommended ) |

---

### Class: Repeat \<`T`, `K`\>

A group of steps that will execute again in case of error, up to a limit of attempts.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :----- |
| `id` | `string` | Unique name of a step |
| `steps` | `IStep\<T, K\>[]` | Array of Steps to be executed |
| `logger?` | `Logger` | Optional two log functions that enable loggin of internal behaviour ( recommended ) |
| `limit?` | `number` | Ammount of attempts allowed throwing the error. defaults to 3. |

---

### Class: Decision \<`T`, `K`\>

A step that may execute differents steps depending on a evaluation function `decisionFn`.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :----- |
| `id` | `string` | Unique name of a step |
| `decisionFn` | `(state?:State<T, K>, browser?: Browser) => Promise<string>` | A function with access to browser and state that returns a string representing an avaliable key in the 'actionMap' |
| `actionMap` | `Record<string, IStep<T, K>[]>` | A Dictionary-like structure to map a key to an array of steps |
| `logger?` | `Logger` | Optional two log functions that enable loggin of internal behaviour ( recommended ) |

---

### Class: Module \<`T`, `K`\>

The core class that starts the state object, setup of the browser and execution of the collection of steps.

#### Types

| Type | Description |
| :------ | :------ |
| `T` | Input data that is needed for execution, can be changed during runtime. |
| `K` | Output data that is returned at the end of a module, should be changed during runtime. |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :----- |
| `mId` | `string` | Unique name of a module |
| `steps` | `IStep\<T, K\>[]` | Array of Steps to be executed |
| `logger?` | `Logger` | Optional two log functions that enable loggin of internal behaviour ( recommended ) |
| `initialState?` | `Omit\<State\<T, K\>, onExec\|success\|startTime\>` | The state before the execution starts. |
| `config?` | `ModuleConfig\<T, K\>` | The state before the execution starts. |
