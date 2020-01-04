/**
 * Created by kingsae1004@gmail.com on 2019/12/28
 * Github : https://github.com/kingsae1
 */
/**
 * removeComment
 * @param str
 * @returns 주석이 제거된 str
 */
const removeComment = (str) => {
  // 주석 제거 함수
  const RegExpDS1 = /\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/g
  return str.replace(RegExpDS1, '')
}

/**
 * checkString
 * @param str
 * @returns 변수에서 사용될 파싱된 str
 */
const checkString = (str) => {
  // 변수 탐색 함수
  if (str.includes('var')) {
    return str
  } else if (/[\w]--/.test(str)) {
    return str
  }

  if (str.includes('{')) {
    str = str.split('{')[1].trim()
  }

  if (str.includes('*/')) {
    const splitArr = str.split('*/')

    splitArr.forEach((text, index) => {
      if (text.includes('--')) {
        str = str[index]
      }
    })
  }

  if (str.indexOf('--') <= 0) {
    return str
  } else {
    return checkString(str)
  }
}

/**
 * cssVarsWorker
 * To use vars with css files (styles tag) in IE Browsers.
 *
 * @author seewan.park
 * @onmessage : 객체에서 전달받은 메세지
 * @postmessage : 연산된 값을 전달할 메세지
 */

onmessage = ({ data }) => {
  const message = data.message ? JSON.parse(data.message) : null
  const reference = data.reference ? JSON.parse(data.reference) : null
  const target = data.target || null

  switch (data.key) {
    case 'parseItem':
      let cssItem = {}
      const cloneItem = {}
      const keyMap = {}

      // 변수 선언 로드
      message
        .filter(({ content }) => {
          // Filter ('--' string)
          return content.includes('--') &&
            !content.includes('Bootstrap')
        }).forEach(({ content, id }) => {
        content = removeComment(content)
        // Parse style css files
        const convertStyle = {}
        let uniqueId = ''

        // Find uniqueId in string
        if (content.includes('{')) {
          const split = content.split('{')
          const styleString = split[1].trim()
          /* eslint unicorn/prefer-starts-ends-with: "off" */
          if (/^--/.test(styleString) && split) {
            const string = split[0]
            if (string.includes('*/')) {
              uniqueId = string.split('*/')[1].trim()
            } else {
              uniqueId = split[0].trim()
            }
          }
        }

        if (uniqueId) {
          // Parse styles to string
          keyMap[uniqueId] = id

          content
            .split(';')
            .map(str => str.trim())
            .forEach((item) => {
              if (uniqueId === ':root' || uniqueId === ':root.default' || uniqueId === target) {
                let styleString = item
                styleString = checkString(styleString)

                const decl = styleString.split(':').map(val => val.trim())
                const prop = decl[0]
                const val = decl[1]

                if (prop.indexOf('--') === 0) {
                  convertStyle[prop] = val
                }
              }
            })
        }

        if (uniqueId === ':root' || uniqueId === ':root.global' || uniqueId === target) {
          cssItem = { ...cssItem, ...convertStyle }
        }
      })

      // root내에 변수 선언 처리
      for (const property in cssItem) {
        // console.log(property, cssItem[property])
        let value = cssItem[property]
        if (value.includes('var')) {
          value = value.replace('var(', '')
          value = value.replace(')', '')

          if (cssItem[value]) {
            cloneItem[property] = cssItem[value]
          }
        }
      }

      postMessage({
        key: 'parseItem',
        message: { ...cssItem, ...cloneItem },
        map: keyMap
      })
      break

    case 'setItem' :
      const cloneCss = {}
      reference
        .filter(({ content }) => {
          return content.includes('var(')
        }).forEach(({ content, id }) => {
        content = removeComment(content)
        for (const property in message) {
          content = content.replace(new RegExp(`var[(]${property}[)]`, 'gi'), message[property])
        }
        cloneCss[id] = content
      })

      postMessage({
        key: 'setItem',
        message: cloneCss
      })
      break

    default:
      break
  }
}
