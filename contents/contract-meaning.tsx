import cssText from "data-text:~styles.css"
import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetInlineAnchorList,
  PlasmoGetStyle
} from "plasmo"

import mockContractExplanation from "~assets/mock-explan.json"

export const config: PlasmoCSConfig = {
  matches: [
    "https://evm.ngd.network/address/*/read-contract*",
    "https://evm.ngd.network/address/*/write-contract*"
  ]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const readContractContainers = document.querySelectorAll("#verified > div")
  return readContractContainers
}

const getMatchExplanation = (element: Element) => {
  // if match explanation content
  return mockContractExplanation.find((x) =>
    element.textContent
      .toLowerCase()
      .includes(x.func.toLowerCase().replace(/\(.*\)/, ""))
  )
}

const ContractMeaning = ({ anchor }: PlasmoCSUIProps) => {
  const explanation = getMatchExplanation(anchor.element)

  if (!explanation) {
    return null
  }

  return (
    <div className="-kekkai-mt-1 kekkai-pb-6 kekkai-mb-2 kekkai-gap-4 kekkai-bg-black kekkai-w-full kekkai-border-b kekkai-border-b-[#e2e5ec] kekkai-flex kekkai-flex-wrap">
      <div className="kekkai-flex kekkai-flex-col kekkai-gap-2 kekkai-bg-[#252530] kekkai-text-white kekkai-rounded kekkai-p-4 kekkai-border-l-[1px] kekkai-border-l-[#dee2e6] kekkai-flex-1 kekkai-min-w-max">
        <h2 className="kekkai-text-base kekkai-text-green-500"># Meaning</h2>
        <p className="">{explanation.desc}</p>
      </div>

      <div className="kekkai-flex kekkai-flex-col kekkai-gap-2 kekkai-bg-[#252530] kekkai-text-white kekkai-rounded kekkai-p-4 kekkai-border-l-[1px] kekkai-border-l-[#dee2e6] kekkai-flex-1 kekkai-min-w-max">
        <h2 className="kekkai-text-base kekkai-text-green-500">
          # How it works
        </h2>
        <p className="">{explanation.content}</p>
      </div>

      <div className="kekkai-flex kekkai-flex-col kekkai-gap-2 kekkai-bg-[#252530] kekkai-text-white kekkai-rounded kekkai-p-4 kekkai-border-l-[1px] kekkai-border-l-[#dee2e6] kekkai-flex-1 kekkai-min-w-max">
        <h2 className="kekkai-text-base kekkai-text-green-500"># Code</h2>
        <p className="">{explanation.func}</p>
      </div>
    </div>
  )
}

export default ContractMeaning
