/*
 * @Author: Faith
 * @Date: 2022-07-17 14:05
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-18 21:35
 * @Description:
 */

function arrFeatureToGeoJson(arr) {
  return {
    type: "FeatureCollection",
    features: arr,
  }
}

function randomColor() {
  let color = "#"
  for (let i = 0; i < 8; i++) {
    color += parseInt(Math.random() * 16).toString()
  }
  return color
}

export { arrFeatureToGeoJson, randomColor }
