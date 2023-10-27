import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from "@heroicons/react/24/solid"
import cx from "clsx"
import KekkaiLogo from "data-base64:~assets/icon-dark.png"
import cssText from "data-text:~styles.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchor,
  PlasmoGetStyle
} from "plasmo"
import { useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"

import mockContractExplanation from "~assets/mock-explan.json"
import mockContractVulnerability from "~assets/mock-vulner.json"
import type { Explanation, Vulnerability } from "~background/messages/contract"

export const config: PlasmoCSConfig = {
  matches: ["https://evm.ngd.network/address/*"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const contractDetailsPanelSelector = ".address-overview"

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector(contractDetailsPanelSelector)

const riskDeductionScores = {
  low: 3,
  middle: 7,
  high: 10
}

const calculateScore = (vulners?: Vulnerability[]) => {
  if (typeof vulners === "undefined") {
    return "-"
  }

  if (!vulners.length) {
    return 100
  }

  let score = vulners.some((x) => x.score > 14)
    ? 70
    : vulners.some((x) => x.score > 9)
    ? 85
    : 100

  vulners.forEach(
    (x) =>
      (score -=
        x.score > 14
          ? riskDeductionScores.high
          : x.score > 9
          ? riskDeductionScores.middle
          : riskDeductionScores.low)
  )

  return score
}

type ContractData = {
  explanation: Explanation[]
  vulnerability: Vulnerability[]
}

const DEMO_DATA = {
  ["0xc33Eb839f461aa6e48eEb672F97437b172ef2231".toLowerCase()]: {
    explanation: mockContractExplanation,
    vulnerability: mockContractVulnerability
  }
}

const ContractPanels = () => {
  const [isLoading, setIsLoading] = useState(false)
  const address = location.pathname.match(/0x[\d\w]{40}/)?.[0]?.toLowerCase()

  const [
    storageContractData,
    setStorageContractData,
    { setRenderValue: setRenderStorageContractData }
  ] = useStorage<Record<string, ContractData>>(
    "__kekkai_contract_data__",
    DEMO_DATA
  )
  const currentContractData = storageContractData?.[address]
  const isContractVerified = !!currentContractData?.explanation.length
  const score = calculateScore(currentContractData?.vulnerability)
  const alarms =
    currentContractData?.vulnerability.filter((x) => x.score === 3).length ??
    "-"
  const warns =
    currentContractData?.vulnerability.filter((x) => x.score === 2).length ??
    "-"

  const loadingRef = useRef(false)

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  useEffect(() => {
    if (!address || currentContractData || loadingRef.current || !isMounted) {
      return
    }

    ;(async () => {
      setIsLoading(true)
      loadingRef.current = true
      const contractData = (await sendToBackground({
        name: "contract",
        body: {
          contractAddress: address
        }
      })) as ContractData

      if (!contractData) {
        setIsLoading(false)
        loadingRef.current = false
        return
      }

      // comparing
      await setStorageContractData((xs) => {
        let normalizedData;

        if (
          !contractData.explanation.some((x) =>
            x.content.toLowerCase().includes("error")
          )
        ) {
          normalizedData = {
            ...normalizedData,
            explanation: contractData?.explanation
              ?.map((x) => ({
                ...x,
                // Remove brackets tokens
                func: x.func.replace(/\(.*\)/, "")
              }))
              // Remove private accessor that starts with '_'
              ?.filter((x) => !x.func.startsWith("_"))
          }
        }

        if (
          !contractData.vulnerability.some((x) =>
            x.content.toLowerCase().includes("error")
          )
        ) {
          normalizedData = {
            ...normalizedData,
            vulnerability: contractData.vulnerability.sort(
              (a, b) => b.score - a.score
            )
          }
        }

        if (normalizedData) {
          const data = {
            ...xs,
            [address]: normalizedData
          }
  
          return data
        }
      })
      setIsLoading(false)
      loadingRef.current = false
    })()
  }, [address, currentContractData])

  // const hasNoData =
  //   !currentContractData?.explanation.length &&
  //   !currentContractData?.vulnerability.length

  return (
    <div className="kekkai-flex kekkai-flex-wrap kekkai-min-w-full">
      <div className="kekkai-flex-1 kekkai-bg-black kekkai-text-white kekkai-p-[30px] kekkai-mb-12 kekkai-mr-4 kekkai-rounded-[10px] kekkai-flex kekkai-flex-wrap kekkai-gap-6 kekkai-min-h-[14rem]">
        <div className="kekkai-flex kekkai-flex-col kekkai-gap-2">
          <div>
            <h2 className="kekkai-text-lg">Risk Detection</h2>
            <div className="kekkai-text-[#6c757d] kekkai-flex kekkai-items-center">
              <p>Powered by KEKKAI</p>
              <a
                href="https://kekkai.io/"
                target="_blank"
                className="kekkai-cursor-pointer">
                <img
                  src={KekkaiLogo}
                  alt="Kekkai Logo"
                  className="kekkai-w-10 kekkai-h-10 kekkai-object-contain"
                />
              </a>
            </div>
            <div className="kekkai-flex kekkai-items-center kekkai-gap-1 kekkai-mt-2 kekkai-text-red-500">
              <BellAlertIcon className="kekkai-w-4 kekkai-h-4" />
              <p className="kekkai-capitalize kekkai-align-middle">
                Alarm <span className="kekkai-text-white">{alarms}</span>
              </p>
            </div>
            <div className="kekkai-flex kekkai-items-center kekkai-gap-1 kekkai-mt-2 kekkai-text-yellow-500">
              <ExclamationTriangleIcon className="kekkai-w-4 kekkai-h-4" />
              <p className="kekkai-capitalize kekkai-align-middle">
                Warn <span className="kekkai-text-white">{warns}</span>
              </p>
            </div>
          </div>
        </div>
        {/* Transaction analysis panel */}
        {/* <div className="kekkai-flex kekkai-flex-col kekkai-gap-2 kekkai-bg-[#252530] kekkai-rounded kekkai-p-4 kekkai-border-l-[1px] kekkai-border-l-[#dee2e6] kekkai-flex-1 kekkai-min-w-fit">
          <h2 className="kekkai-text-lg">Transaction analysis</h2>

          <div className="kekkai-flex kekkai-flex-col kekkai-flex-wrap kekkai-gap-1 kekkai-mt-1">
            {isContractVerified ? (
              <div className="kekkai-flex kekkai-items-center kekkai-gap-1">
                <CheckCircleIcon className="kekkai-w-4 kekkai-h-4 kekkai-text-green-500" />
                <p className="kekkai-capitalize">Contract Verified</p>
              </div>
            ) : (
              <div className="kekkai-flex kekkai-items-center kekkai-gap-1">
                <XCircleIcon className="kekkai-w-4 kekkai-h-4 kekkai-text-red-500" />
                <p className="kekkai-capitalize">Contract is Not Verified</p>
              </div>
            )}
            {hasNoData && <p>---</p>}
          </div>
        </div> */}

        {/* Contract analysis panel */}
        <div className="kekkai-flex kekkai-flex-col kekkai-gap-2 kekkai-bg-[#252530] kekkai-rounded kekkai-p-4 kekkai-border-l-[1px] kekkai-border-l-[#dee2e6] kekkai-flex-1 kekkai-min-w-fit">
          <h2 className="kekkai-text-lg">Contract analysis</h2>
          {/* List */}
          <div className="kekkai-flex kekkai-flex-col kekkai-flex-wrap kekkai-gap-1 kekkai-mt-1">
            {isLoading &&
              Array.from({ length: 12 })
                .fill(0)
                .map((_, i) => (
                  <div
                    className="kekkai-flex kekkai-items-center kekkai-gap-1 kekkai-animate-pulse kekkai-mb-1 kekkai-w-1/2 kekkai-pr-8"
                    key={`list skeleton ${i}`}>
                    <div className="kekkai-h-4 kekkai-w-4 kekkai-bg-slate-500 kekkai-rounded-full" />
                    <div className="kekkai-h-4 kekkai-w-full kekkai-bg-slate-500 kekkai-rounded" />
                  </div>
                ))}

            {/* Has data which means is verified */}
            {!isLoading && isContractVerified && (
              <div className="kekkai-flex kekkai-items-center kekkai-gap-1 kekkai-w-1/2 kekkai-pr-8">
                <CheckCircleIcon className="kekkai-w-4 kekkai-h-4 kekkai-text-green-500" />
                <p className="kekkai-capitalize">Contract Verified</p>
              </div>
            )}
            {!isLoading && !isContractVerified && (
              <div className="kekkai-flex kekkai-items-center kekkai-gap-1 kekkai-w-1/2 kekkai-pr-8">
                <XCircleIcon className="kekkai-w-4 kekkai-h-4 kekkai-text-red-500" />
                <p className="kekkai-capitalize">Contract is Not Verified</p>
              </div>
            )}
            {currentContractData?.vulnerability?.map((v) => (
              <div
                className="kekkai-flex kekkai-items-start kekkai-gap-1 kekkai-w-1/2 kekkai-pr-8"
                key={`vulnerability ${v.content}`}>
                <XCircleIcon
                  className={cx(
                    "kekkai-w-4 kekkai-h-4",
                    v.score > 14
                      ? "kekkai-text-red-500"
                      : v.score > 9
                      ? "kekkai-text-yellow-500"
                      : "kekkai-text-lime-600"
                  )}
                />
                <p className="kekkai-capitalize kekkai-flex-1 kekkai-break-words">
                  {v.content}
                </p>
              </div>
            ))}
            {/* {hasNoData && <p>---</p>} */}
          </div>
        </div>
      </div>

      <div className="kekkai-bg-black kekkai-text-white kekkai-p-[30px] kekkai-mb-12 kekkai-rounded-[10px] kekkai-flex kekkai-flex-col kekkai-flex-wrap kekkai-gap-6 kekkai-h-fit">
        <div className="kekkai-inline-flex kekkai-items-center kekkai-gap-6 kekkai-justify-between">
          <div className="kekkai-text-[#6c757d] kekkai-flex kekkai-items-center">
            <p>Powered by KEKKAI</p>
            <a
              href="https://kekkai.io/"
              target="_blank"
              className="kekkai-cursor-pointer">
              <img
                src={KekkaiLogo}
                alt="Kekkai Logo"
                className="kekkai-w-10 kekkai-h-10 kekkai-object-contain"
              />
            </a>
          </div>

          <h4 className="kekkai-font-bold kekkai-text-2xl">Safety Score</h4>
        </div>

        <div className="kekkai-inline-flex kekkai-justify-end">
          {isLoading ? (
            <div className="kekkai-w-24 kekkai-h-24 kekkai-bg-slate-500 kekkai-animate-pulse kekkai-rounded-lg" />
          ) : (
            <span className="kekkai-text-8xl">{score}</span>
          )}
        </div>

        <div className="kekkai-w-full kekkai-px-2">
          <div
            className="kekkai-w-full kekkai-h-6 kekkai-rounded-full kekkai-relative"
            style={{
              background: `linear-gradient(90deg, #DB694E 0%, #D7F86E 100%)`
            }}>
            <div
              className="kekkai-h-8 kekkai-w-8 kekkai-border-4 kekkai-border-white kekkai-absolute kekkai-top-1/2 transform -kekkai-translate-y-1/2 -kekkai-translate-x-1/2 kekkai-transition-all"
              style={{ left: `${typeof score === "number" ? score : 50}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractPanels
