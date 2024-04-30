class ProxyConfig {
  on: boolean;
  proxyAddress: string;

  constructor(state: boolean, address: string){
    this.on = state;
    this.proxyAddress = address;

  }

  setOn = () => {
    this.on = true;
  }

  setOff = () => {
    this.on = false;
  }

  getState = () => {
    return this.on;
  }

  getAddress = () => {
    return this.proxyAddress;
  }

}

const proxyConfig = new ProxyConfig(false, process.env.PROXY_URL || '');

export default proxyConfig;