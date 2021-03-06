import debugFactory from 'debug'
import { CeloContract } from './base'
import { newAccounts } from './generated/Accounts'
import { newAttestations } from './generated/Attestations'
import { newBlockchainParameters } from './generated/BlockchainParameters'
import { newDoubleSigningSlasher } from './generated/DoubleSigningSlasher'
import { newDowntimeSlasher } from './generated/DowntimeSlasher'
import { newElection } from './generated/Election'
import { newEpochRewards } from './generated/EpochRewards'
import { newEscrow } from './generated/Escrow'
import { newExchange } from './generated/Exchange'
import { newFeeCurrencyWhitelist } from './generated/FeeCurrencyWhitelist'
import { newFreezer } from './generated/Freezer'
import { newGasPriceMinimum } from './generated/GasPriceMinimum'
import { newGoldToken } from './generated/GoldToken'
import { newGovernance } from './generated/Governance'
import { newLockedGold } from './generated/LockedGold'
import { newRandom } from './generated/Random'
import { newRegistry } from './generated/Registry'
import { newReserve } from './generated/Reserve'
import { newSortedOracles } from './generated/SortedOracles'
import { newStableToken } from './generated/StableToken'
import { newTransferWhitelist } from './generated/TransferWhitelist'
import { newValidators } from './generated/Validators'
import { ContractKit } from './kit'

const debug = debugFactory('kit:web3-contract-cache')

const ContractFactories = {
  [CeloContract.Accounts]: newAccounts,
  [CeloContract.Attestations]: newAttestations,
  [CeloContract.BlockchainParameters]: newBlockchainParameters,
  [CeloContract.DoubleSigningSlasher]: newDoubleSigningSlasher,
  [CeloContract.DowntimeSlasher]: newDowntimeSlasher,
  [CeloContract.Election]: newElection,
  [CeloContract.EpochRewards]: newEpochRewards,
  [CeloContract.Escrow]: newEscrow,
  [CeloContract.Exchange]: newExchange,
  [CeloContract.FeeCurrencyWhitelist]: newFeeCurrencyWhitelist,
  [CeloContract.Freezer]: newFreezer,
  [CeloContract.GasPriceMinimum]: newGasPriceMinimum,
  [CeloContract.GoldToken]: newGoldToken,
  [CeloContract.Governance]: newGovernance,
  [CeloContract.LockedGold]: newLockedGold,
  [CeloContract.Random]: newRandom,
  [CeloContract.Registry]: newRegistry,
  [CeloContract.Reserve]: newReserve,
  [CeloContract.SortedOracles]: newSortedOracles,
  [CeloContract.StableToken]: newStableToken,
  [CeloContract.TransferWhitelist]: newTransferWhitelist,
  [CeloContract.Validators]: newValidators,
}

type CFType = typeof ContractFactories
type ContractCacheMap = { [K in keyof CFType]?: ReturnType<CFType[K]> }

/**
 * Native Web3 contracts factory and cache.
 *
 * Exposes accessors to all `CeloContract` web3 contracts.
 *
 * Mostly a private cache, kit users would normally use
 * a contract wrapper
 */
export class Web3ContractCache {
  private cacheMap: ContractCacheMap = {}

  constructor(readonly kit: ContractKit) {}
  getAccounts() {
    return this.getContract(CeloContract.Accounts)
  }
  getAttestations() {
    return this.getContract(CeloContract.Attestations)
  }
  getBlockchainParameters() {
    return this.getContract(CeloContract.BlockchainParameters)
  }
  getDoubleSigningSlasher() {
    return this.getContract(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher() {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
  getElection() {
    return this.getContract(CeloContract.Election)
  }
  getEpochRewards() {
    return this.getContract(CeloContract.EpochRewards)
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow)
  }
  getExchange() {
    return this.getContract(CeloContract.Exchange)
  }
  getFeeCurrencyWhitelist() {
    return this.getContract(CeloContract.FeeCurrencyWhitelist)
  }
  getFreezer() {
    return this.getContract(CeloContract.Freezer)
  }
  getGasPriceMinimum() {
    return this.getContract(CeloContract.GasPriceMinimum)
  }
  getGoldToken() {
    return this.getContract(CeloContract.GoldToken)
  }
  getGovernance() {
    return this.getContract(CeloContract.Governance)
  }
  getLockedGold() {
    return this.getContract(CeloContract.LockedGold)
  }
  getRandom() {
    return this.getContract(CeloContract.Random)
  }
  getRegistry() {
    return this.getContract(CeloContract.Registry)
  }
  getReserve() {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles)
  }
  getStableToken() {
    return this.getContract(CeloContract.StableToken)
  }
  getTransferWhitelist() {
    return this.getContract(CeloContract.TransferWhitelist)
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
  }

  /**
   * Get native web3 contract wrapper
   */
  async getContract<C extends keyof typeof ContractFactories>(contract: C) {
    if (this.cacheMap[contract] == null) {
      debug('Initiating contract %s', contract)
      const createFn = ContractFactories[contract] as CFType[C]
      // @ts-ignore: Too compplex union type
      this.cacheMap[contract] = createFn(
        this.kit.web3,
        await this.kit.registry.addressFor(contract)
      ) as NonNullable<ContractCacheMap[C]>
    }
    // we know it's defined (thus the !)
    return this.cacheMap[contract]!
  }
}
