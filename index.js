const {ChromeLauncher} = require('lighthouse/lighthouse-cli/chrome-launcher')
const CDP = require('chrome-remote-interface')
const fs = require('fs')
const getPort = require('get-port')

class ChromeDiff {
  constructor (options) {
    this.options = options || {}
    this.initialized = false
  }
  async init () {
    return await new Promise(async (resolve, reject) => {
      if (this.initialized) {
        return resolve(this)
      }
      this.options.port = this.options.port || await getPort()
      this.launcher = this.createChromeLauncher(this.options)
      await this.launcher.run()
      Object.assign(this.options, {
        target: (targets) => {
          return targets.filter(t => t.type === 'page').shift()
        }
      })
      CDP(this.options, async (client) => {
        this.client = client
        const {Network, Page, Runtime, Console} = client
        await Promise.all([Network.enable(), Page.enable(), Runtime.enable(), Console.enable()])

        const targets = await this.client.Target.getTargets()
        const page = targets.targetInfos.filter(t => t.type === 'page').shift()
        await this.client.Target.activateTarget({targetId: page.targetId})

        await this.client.Page.navigate({url: `file:///${__dirname}/resemblejscontainer.html`})
        await this.client.Page.loadEventFired()
        this.initialized = true
        resolve(this)
      })
    })
  }
  createChromeLauncher (options) {
    const flags = []
    flags.push('--disable-gpu')
    if (!options.visible) {
      flags.push('--headless')
    }
    if (options.additionalChromeFlags && Array.isArray(options.additionalChromeFlags)) {
      options.additionalChromeFlags.forEach(f => {
        if (f.indexOf('--') === -1) {
          throw new Error('chrome flag must start "--". flag: ' + f)
        }
        flags.push(f)
      })
    }
    return new ChromeLauncher({
      port: options.port,
      autoSelectChrome: true,
      additionalFlags: flags
    })
  }
  async close () {
    if (!this.client) {
      return false
    }
    await this.client.close()
    this.client = null
    if (this.launcher !== null) {
      await this.launcher.kill()
      this.launcher = null
    }
    return true
  }
  async compare (options) {
    let {baseFilePath, newFilePath, diffFilePath} = options
    await this.init()
    return await new Promise(async (resolve, reject) => {
      let documentNode = await this.client.DOM.getDocument()
      let baseFileNode = await this.client.DOM.querySelector({
        nodeId: documentNode.root.nodeId,
        selector: 'input[name=one]'
      })
      let newFileNode = await this.client.DOM.querySelector({
        nodeId: documentNode.root.nodeId,
        selector: 'input[name=two]'
      })
      await this.client.DOM.setFileInputFiles({nodeId: baseFileNode.nodeId, files: [baseFilePath]})
      await this.client.DOM.setFileInputFiles({nodeId: newFileNode.nodeId, files: [newFilePath]})
      let obj = await this.client.Runtime.evaluate({expression: 'run()', awaitPromise: true})
      let val = JSON.parse(obj.result.value)
      if (!parseFloat(val.data.misMatchPercentage)) {
        delete val.imgurl
        return resolve(val)
      }
      if (diffFilePath) {
        let imgBuf = new Buffer(val.imgurl.replace('data:image/png;base64,', ''), 'base64')
        fs.writeFileSync(diffFilePath, imgBuf)
        val.diffImgFilePath = diffFilePath
      }
      resolve(val)
    })
  }
}

module.exports = ChromeDiff
