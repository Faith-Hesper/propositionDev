/*
 * @Author: Faith
 * @Date: 2022-07-17 14:05
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-19 20:44
 * @Description:
 */
import { searchBySql } from "@/utils/map.js"

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

function cacheShopData() {
  let sqlParam = {
    fromIndex: 0,
    toIndex: 19,
  }
  let Shops = []
  let shopFeatures = []
  localStorage.removeItem("shops")
  localStorage.removeItem("shopsFeatures")

  async function getShopsData(shops) {
    let { totalCount, features } = await searchBySql(shops, {
      fromIndex: sqlParam.fromIndex,
      toIndex: sqlParam.toIndex,
    })
    console.log(totalCount)
    if (sqlParam.toIndex + 1 < totalCount) {
      sqlParam.fromIndex = sqlParam.toIndex + 1
      sqlParam.toIndex += 19
      setTimeout(() => {
        getShopsData(shops)
      }, 500)
    }
    await new Promise((resolve, reject) => {
      let featureArr = features.features
      // console.log(featureArr)
      shopFeatures.push(...featureArr)
      let shopSuggestion = features.features.map(data => {
        return { value: data.properties.NAME, name: data.properties.NAME }
      })

      Shops.push(...shopSuggestion)
      resolve("")
    })
    if (sqlParam.toIndex + 1 > totalCount) {
      console.log("完成")
      let geofeatures = { features: shopFeatures, type: "FeatureCollection" }
      localStorage.setItem("shops", JSON.stringify(Shops))
      localStorage.setItem("shopsFeatures", JSON.stringify(geofeatures))
    }
  }
  getShopsData("").then(() => {
    // console.log("object")
    // localStorage.setItem("shops", JSON.stringify(Shops))
    // localStorage.setItem("shopsFeatures", JSON.stringify(shopFeatures))
  })
}

export { arrFeatureToGeoJson, randomColor, cacheShopData }
