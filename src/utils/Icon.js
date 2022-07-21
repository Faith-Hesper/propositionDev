/*
 * @Author: Faith
 * @Date: 2022-07-21 20:10
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-21 21:31
 * @Description:
 */

// import { icon } from "leaflet"

import initIcon from "@/assets/images/init.png"
import market from "@/assets/images/bag-heart-fill.svg"
import icon1 from "@/assets/images/icon1.png"
import icon2 from "@/assets/images/icon2.png"
import point from "@/assets/images/dian2.svg"
import startPoint from "@/assets/images/qidian.svg"
import startPoint2 from "@/assets/images/qidian2.svg"
import startPoint3 from "@/assets/images/qidian3.svg"
import endPoint from "@/assets/images/iconfontzhongdian.svg"
import endPoint2 from "@/assets/images/zhongdian.svg"
import superMarket from "@/assets/images/chaoshi.png"
import walk from "@/assets/images/walking.svg"

let CustomIcon = L.Icon.extend({
  options: {
    iconUrl: initIcon,
    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [20, 50], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62], // the same for the shadow
    popupAnchor: [1, -16], // point from which the popup should open relative to the iconAnchor
  },
})

let greenIcon = new CustomIcon({
  iconUrl: market,
})
let eventIcon = new CustomIcon({
  iconUrl: icon1,
})
let aimIcon = new CustomIcon({
  iconUrl: icon2,
})

let startIcon = new CustomIcon({
  iconUrl: startPoint,
})
let startIcon2 = new CustomIcon({
  iconUrl: startPoint2,
})
let startIcon3 = new CustomIcon({
  iconUrl: startPoint3,
})
let endIcon = new CustomIcon({
  iconUrl: endPoint,
})
let endIcon2 = new CustomIcon({
  iconUrl: endPoint2,
})
let marketIcon = new CustomIcon({
  iconUrl: superMarket,
})
let pointIcon = new CustomIcon({
  iconUrl: point,
})
let walkIcon = new CustomIcon({
  iconUrl: walk,
})

export default CustomIcon

export {
  greenIcon,
  eventIcon,
  aimIcon,
  startIcon,
  startIcon2,
  startIcon3,
  endIcon,
  endIcon2,
  marketIcon,
  pointIcon,
  walkIcon,
}
