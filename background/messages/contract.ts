import ky from "ky"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import mockExplanation from "~assets/mock-explan.json"
import mockVulnerability from "~assets/mock-vulner.json"
import { queryGraph } from "~queryGraph"

interface Response {
  data: {
    address: {
      smartContract: {
        addressHash: string
        contractSourceCode: string
      }
    }
  }
}

const queryContract = async (contractAddress: string) => {
  const contractQuery = `
    query QueryContract($address: AddressHash!) {
      address(hash: $address) {
        smartContract {
          addressHash
          contractSourceCode
        }
      }
    }
  `

  const data = await queryGraph<Response>("https://evm.ngd.network/graphiql", {
    query: contractQuery,
    variables: {
      address: contractAddress
    }
  })

  return data?.data?.address?.smartContract
}

export type Explanation = {
  content: string
  desc: string
  func: string
}

const fetchExplanation = async ({
  contractContent,
  contractAddress
}): Promise<Explanation[]> => {
  const data = (await ky
    .post("http://20.121.119.48:9200/api/explain", {
      json: {
        contract_content: contractContent,
        contract_address: contractAddress
      },
      timeout: 1000 * 60 * 2
    })
    .json()) as { explanation: Explanation[] }
  return data?.explanation
}

export type Vulnerability = {
  content: string
  score: number
}

const fetchVulnerability = async ({
  contractContent,
  contractAddress
}): Promise<Vulnerability[]> => {
  const data = (await ky
    .post("http://20.121.119.48:9200/api/vulner", {
      json: {
        contract_content: contractContent,
        contract_address: contractAddress
      },
      timeout: 1000 * 60 * 2
    })
    .json()) as { vulners: Vulnerability[] }
  return data?.vulners
}

const handler: PlasmoMessaging.MessageHandler<
  { contractAddress: string },
  { explanation: Explanation[]; vulnerability: Vulnerability[] }
> = async (req, res) => {
  try {
    const contract = await queryContract(req.body.contractAddress)
    const data = {
      contractContent: contract.contractSourceCode,
      contractAddress: contract.addressHash
    }
    const [explanation, vulnerability] = await Promise.all([fetchExplanation(data), fetchVulnerability(data)])

    return res.send({
      explanation,
      vulnerability
    })
  } catch (error) {
    // Send mock data if is unavailable
    res.send({
      explanation: mockExplanation,
      vulnerability: mockVulnerability
    })
  }
}

export default handler
