import { Address } from '@celo/utils/lib/address'
import abi, { ABIDefinition } from 'web3-eth-abi'
import { Block, Transaction } from 'web3/eth/types'
import { PROXY_ABI } from '../governance/proxy'
import { ContractKit } from '../kit'
import { parseDecodedParams } from '../utils/web3-utils'
import { ContractDetails, mapFromPairs, obtainKitContractDetails } from './base'

export interface CallDetails {
  contract: string
  function: string
  paramMap: Record<string, any>
  argList: any[]
}

export interface ParsedTx {
  callDetails: CallDetails
  tx: Transaction
}

export interface ParsedBlock {
  block: Block
  parsedTx: ParsedTx[]
}

interface ContractMapping {
  details: ContractDetails
  fnMapping: Map<string, ABIDefinition>
}

export async function newBlockExplorer(kit: ContractKit) {
  return new BlockExplorer(kit, await obtainKitContractDetails(kit))
}

export class BlockExplorer {
  private addressMapping: Map<Address, ContractMapping>

  constructor(private kit: ContractKit, readonly contractDetails: ContractDetails[]) {
    this.addressMapping = mapFromPairs(
      contractDetails.map((cd) => [
        cd.address,
        {
          details: cd,
          fnMapping: mapFromPairs(
            (cd.jsonInterface.concat(PROXY_ABI) as ABIDefinition[])
              .filter((ad) => ad.type === 'function')
              .map((ad) => [ad.signature, ad])
          ),
        },
      ])
    )
  }

  async fetchBlockByHash(blockHash: string): Promise<Block> {
    // TODO fix typing: eth.getBlock support hashes and numbers
    return this.kit.web3.eth.getBlock(blockHash as any, true)
  }
  async fetchBlock(blockNumber: number): Promise<Block> {
    return this.kit.web3.eth.getBlock(blockNumber, true)
  }

  async fetchBlockRange(from: number, to: number): Promise<Block[]> {
    const results: Block[] = []
    for (let i = from; i < to; i++) {
      results.push(await this.fetchBlock(i))
    }
    return results
  }

  parseBlock(block: Block): ParsedBlock {
    const parsedTx: ParsedTx[] = []
    for (const tx of block.transactions) {
      const maybeKnownCall = this.tryParseTx(tx)
      if (maybeKnownCall != null) {
        parsedTx.push(maybeKnownCall)
      }
    }

    return {
      block,
      parsedTx,
    }
  }

  tryParseTx(tx: Transaction): null | ParsedTx {
    const contractMapping = this.addressMapping.get(tx.to)
    if (contractMapping == null) {
      return null
    }

    const callSignature = tx.input.slice(0, 10)
    const encodedParameters = tx.input.slice(10)

    const matchedAbi = contractMapping.fnMapping.get(callSignature)
    if (matchedAbi == null) {
      return null
    }

    const { args, params } = parseDecodedParams(
      abi.decodeParameters(matchedAbi.inputs!, encodedParameters)
    )

    const callDetails: CallDetails = {
      contract: contractMapping.details.name,
      function: matchedAbi.name!,
      paramMap: params,
      argList: args,
    }

    return {
      tx,
      callDetails,
    }
  }
}
