/*
 * @Author: Faith
 * @Date: 2022-07-10 18:34
 * @LastAuthor: Faith
 * @LastEditTime: 2022-10-16 15:59
 * @Description:
 */

function dragEvent(el, binding) {
  {
    // 自定义属性，判断是否可拖拽
    if (!binding.value || !binding.arg) return
    // console.log(binding.arg)
    const dialogHeaderEl = el.querySelector(".dialog_header")
    // if(dialogHeaderEl)
    // console.log(dialogHeaderEl)
    const dragDom = el.querySelector(".dialog_content")
    // if (!dragDom) return
    dialogHeaderEl.style.cssText += ";cursor:move;"
    // dragDom.style.cssText += ';bottom:0px;'

    const zIndex = dragDom.style.zIndex

    // 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
    const sty = (function () {
      if (document.body.currentStyle) {
        // 在ie下兼容写法
        return (dom, attr) => dom.currentStyle[attr]
      }
      return (dom, attr) => getComputedStyle(dom, null)[attr]
    })()

    dialogHeaderEl.onmousedown = e => {
      // 鼠标按下，计算当前元素距离可视区的距离
      const disX = e.clientX - dialogHeaderEl.offsetLeft
      const disY = e.clientY - dialogHeaderEl.offsetTop
      const screenWidth = document.body.clientWidth // body当前宽度
      const screenHeight = document.documentElement.clientHeight // 可见区域高度(应为body高度，可某些环境下无法获取)

      const dragDomWidth = dragDom.offsetWidth // 对话框宽度
      const dragDomheight = dragDom.offsetHeight // 对话框高度

      const minDragDomLeft = dragDom.offsetLeft
      const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth

      const minDragDomTop = dragDom.offsetTop
      const maxDragDomTop = screenHeight - dragDom.offsetTop - dragDomheight

      dragDom.style.zIndex = 100

      // 获取到的值带px 正则匹配替换
      let styL = sty(dragDom, "left")
      // 为兼容ie
      if (styL === "auto") styL = "0px"
      let styT = sty(dragDom, "top")

      // console.log(styL)
      // 注意在ie中 第一次获取到的值为组件自带50% 移动之后赋值为px
      if (styL.includes("%")) {
        styL = +document.body.clientWidth * (+styL.replace(/%/g, "") / 100)
        styT = +document.body.clientHeight * (+styT.replace(/%/g, "") / 100)
      } else {
        styL = +styL.replace(/px/g, "")
        styT = +styT.replace(/px/g, "")
      }

      document.onmousemove = function (e) {
        // 通过事件委托，计算移动的距离
        let left = e.clientX - disX
        let top = e.clientY - disY
        // 边界处理
        if (-left > minDragDomLeft) {
          left = -minDragDomLeft
        } else if (left > maxDragDomLeft) {
          left = maxDragDomLeft
        }

        if (-top > minDragDomTop) {
          top = -minDragDomTop
        } else if (top > maxDragDomTop) {
          top = maxDragDomTop
        }

        // 移动当前元素
        dragDom.style.cssText += `;left:${left + styL}px;top:${top + styT}px;`
      }

      document.onmouseup = function (e) {
        document.onmousemove = null
        document.onmouseup = null
        dragDom.style.zIndex = zIndex
      }
      return false
    }
  }
}

// 拖拽的指令
const drag = {
  mounted(el, binding) {
    return dragEvent(el, binding)
  },
  // updated(el, binding) {
  //   return dragEvent(el, binding)
  // },
}
// 挂载，注册
const directives = {
  install: function (app) {
    app.directive("dialogDrag", drag)
  },
}
export default directives
