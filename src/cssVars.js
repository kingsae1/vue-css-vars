/**
 * Created by kingsae1004@gmail.com on 2019/12/28
 * Github : https://github.com/kingsae1
 */
/**
 * cssVars Plugin
 * To use vars with css files (styles tag) in IE Browsers.
 *
 * @author seewan.park
 * @return plugin
 * @usages Vue.$cssVars (setter/getter)
 */
/* eslint import/no-webpack-loader-syntax: "off" */
import Worker from 'worker-loader!./cssVarsWorker'

let cssVarsWorker = null
let cssVarsOptions = null
const cssVarsItem = []
let cssVarsStyle = []
let cssVarsMap = {}
let cssConvertedRule = {}

const isIE = () => {
  const ua = navigator.userAgent;
  /* MSIE used to detect old browsers and Trident used to newer ones*/
  return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
}

export default {
  install (Vue, options) {
    cssVarsOptions = options
    cssVarsStyle = [...document.getElementsByTagName('style')]

    cssVarsStyle
      .filter((item, index) => {
        const id = Date.now() + index
        item.setAttribute('id', id)
        item.setAttribute('css-rules', 'in')

        cssVarsItem.push({
          id,
          content: item.textContent
        })
      })

    Vue.prototype.__defineGetter__('$cssVars', () => cssConvertedRule)
    Vue.prototype.__defineSetter__('$cssVars', key => this.change(Vue, key))
  },
  change (Vue, key) {
    // 클래스변경
    const className = key.split('.')

    if (className.length > 1) {
      document.documentElement.className = className[1]
    } else {
      document.documentElement.className = ''
    }

    if (cssVarsOptions && cssVarsOptions.onlyLegacy && isIE()) {
      // Worker 구동
      cssVarsWorker = new Worker()
      cssVarsWorker.onmessage = ({ data }) => {
        if (data.key === 'parseItem') {
          cssConvertedRule = data.message
          cssVarsMap = data.map

          cssVarsWorker.postMessage({
            key: 'setItem',
            message: JSON.stringify(cssConvertedRule),
            reference: JSON.stringify(cssVarsItem)
          })
        } else if (data.key === 'setItem') {
          const head = document.getElementsByTagName('head')[0]

          // 기존 변수선언된 스타일 제거
          Object.keys(cssVarsMap).forEach((id) => {
            const target = document.getElementById(cssVarsMap[id])
            head.removeChild(target)
          })

          // 룰에 해당하는 스타일 적용
          Object.keys(data.message).forEach(async (id) => {
            const style = document.createElement('style')
            style.setAttribute('id', id)
            style.setAttribute('type', 'text/css')
            style.setAttribute('css-rules', 'out')

            if (style.styleSheet) {
              // Support IE Browser
              style.styleSheet.cssText = data.message[id]
            } else {
              // Support another Browsers
              const css = document.createTextNode(data.message[id])
              await style.appendChild(css)
            }

            await head.appendChild(style)
          })
          this.terminate()
        }
      }

      cssVarsWorker.postMessage({
        key: 'parseItem',
        target: key,
        message: JSON.stringify(cssVarsItem)
      })
    }
  },
  terminate () {
    // Terminate WebWorker
    if (cssVarsWorker) {
      cssVarsWorker.terminate()
      cssVarsWorker = null
    }
  }
}
