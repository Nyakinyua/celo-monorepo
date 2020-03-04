import { assert } from 'chai'
import Web3 from 'web3'
import { connectPeers, initAndStartGeth, tailLogFile } from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, killInstance, waitForBlock, waitToFinishInstanceSyncing } from './utils'

const TMP_PATH = '/tmp/e2e'
const verbose = false

describe('sync tests', function(this: any) {
  this.timeout(0)

  const gethConfig: GethRunConfig = {
    networkId: 1101,
    network: 'local',
    runPath: TMP_PATH,
    migrate: true,
    verbosity: 1,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30305,
        rpcport: 8547,
      },
      {
        name: 'validator2',
        validating: true,
        syncmode: 'full',
        port: 30307,
        rpcport: 8549,
      },
      {
        name: 'validator3',
        validating: true,
        syncmode: 'full',
        port: 30309,
        rpcport: 8551,
      },
    ],
  }

  const fullNode: GethInstanceConfig = {
    name: 'txfull',
    validating: false,
    syncmode: 'full',
    lightserv: true,
    port: 30311,
    rpcport: 8553,
  }

  const hooks = getHooks(gethConfig)

  before(async () => {
    // Start validator nodes and migrate contracts.
    // await hooks.before()
    // Restart validator nodes.
    await hooks.restart()

    await initAndStartGeth(gethConfig, hooks.gethBinaryPath, fullNode, verbose)
    await connectPeers([...gethConfig.instances, fullNode], verbose)
    await waitToFinishInstanceSyncing(fullNode)
  })

  after(hooks.after)

  const syncModes = ['full', 'fast', 'light', 'lightest']
  for (const syncmode of syncModes) {
    describe(`when syncing with a ${syncmode} node`, () => {
      let syncNode: GethInstanceConfig

      beforeEach(async () => {
        syncNode = {
          name: syncmode,
          validating: false,
          syncmode,
          port: 30313,
          wsport: 9555,
          rpcport: 8555,
          lightserv: syncmode !== 'light' && syncmode !== 'lightest',
        }
        const retries = 3
        for (let i = 1; i <= retries; i++) {
          try {
            await initAndStartGeth(gethConfig, hooks.gethBinaryPath, syncNode, verbose)
            await connectPeers([fullNode, syncNode], verbose)
            await waitToFinishInstanceSyncing(syncNode)
            break
          } catch (error) {
            console.info(`Syncmode ${syncmode} error: ${error}`)
            console.info(await tailLogFile(gethConfig.runPath, syncNode, 50))
            if (i == retries) {
              console.info(`Retrying ${i}/${retries} ...`)
              killInstance(syncNode)
              continue
            } else {
              throw error
            }
          }
        }
      })

      afterEach(() => killInstance(syncNode))

      it('should sync the latest block', async () => {
        const validatingWeb3 = new Web3(`http://localhost:8545`)
        const validatingFirstBlock = await validatingWeb3.eth.getBlockNumber()
        await waitForBlock(validatingWeb3, validatingFirstBlock + 1)
        const validatingLatestBlock = await validatingWeb3.eth.getBlockNumber()

        const syncWeb3 = new Web3(`http://localhost:8555`)
        await waitForBlock(syncWeb3, validatingFirstBlock + 1)
        const syncLatestBlock = await syncWeb3.eth.getBlockNumber()

        assert.isAbove(validatingLatestBlock, 1)
        // Assert that the validator is still producing blocks.
        assert.isAbove(validatingLatestBlock, validatingFirstBlock)
        // Assert that the syncing node has synced with the validator.
        assert.isAtLeast(syncLatestBlock, validatingLatestBlock)
      })
    })
  }
  describe(`when a validator's data directory is deleted`, () => {
    let web3: any
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      web3 = new Web3('http://localhost:8545')
      await hooks.restart()
    })

    it('should continue to block produce', async function(this: any) {
      this.timeout(0)
      const instance: GethInstanceConfig = gethConfig.instances[0]
      await killInstance(instance)
      // copy instance
      const additionalInstance = { ...instance }
      await initAndStartGeth(gethConfig, hooks.gethBinaryPath, additionalInstance, verbose)
      await connectPeers([gethConfig.instances[0], additionalInstance], verbose)
      await waitToFinishInstanceSyncing(additionalInstance)

      const address = (await web3.eth.getAccounts())[0]
      const currentBlock = await web3.eth.getBlock('latest')
      for (let i = 1; i < 500; i++) {
        await waitForBlock(web3, currentBlock.number + i)
        if ((await web3.eth.getBlock(currentBlock.number + i)).miner === address) {
          return // A block proposed by validator who lost randomness was found, hence randomness was recovered
        }
      }
      assert.fail('Reset validator did not propose any new blocks')
    })
  })
})
