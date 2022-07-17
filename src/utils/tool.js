/*
 * @Author: Faith
 * @Date: 2022-07-17 14:05
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-17 14:07
 * @Description:
 */

function arrFeatureToGeoJson(arr) {
  return {
    type: "FeatureCollection",
    features: arr,
  }
}

export { arrFeatureToGeoJson }
