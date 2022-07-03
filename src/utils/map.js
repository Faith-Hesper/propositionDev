/*
 * @Author: Faith
 * @Date: 2022-06-04 16:32
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-02 17:23
 * @Description:
 */

import { SuperMap, tiandituTileLayer } from "@supermap/iclient-leaflet"
import "leaflet-draw"
// import "@/utils/L.draw-local"
// leaflet-draw 1.0.4 绘制rectangle bug
window.type = true
const url = "http://t0.tianditu.gov.cn/vec_c/wmts?"
const dataUrl = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data"
// let resultLayer

// 初始化地图对象
async function mapObject(id) {
  return await new Promise((resolve, reject) => {
    const { baseMapLayer, map_crs, ...option } = BASE_CONFIG
    const crs = L.CRS[map_crs]
    const layers = baseMapLayer.map(layer => L.supermap.tiandituTileLayer(layer))
    const options = { layers, crs, ...option }
    const map = L.map(id, options)

    resolve(map)
  }).catch(err => console.log(err))
}

async function mapControl(map) {
  return await new Promise((resolve, reject) => {
    // // 这两个底图变量必须定义在函数内部，否则不显示地图
    // const baseMapLayer = L.supermap.tiandituTileLayer({
    //   url: url,
    //   key: '70c2475638a45e3fea8696df2f9917f8',
    // })

    // // 地图标签
    // const MapLabel = L.supermap.tiandituTileLayer({
    //   isLabel: true,
    //   key: '70c2475638a45e3fea8696df2f9917f8',
    // })

    // // console.log(map)
    // map.addLayer(baseMapLayer)
    // map.addLayer(MapLabel)
    // let baseMap = {
    //   中国底图: baseMapLayer,
    //   // '矢量标记': MapLabel
    // }
    // let control = L.control.layers(baseMap).addTo(map)
    let control = L.control
      .scale({
        imperial: false,
        maxWidth: 200,
      })
      .addTo(map)
    resolve(control)
  }).catch(err => console.log(err))
}

/**
 *
 * @param {*} drawLayer 绘制的图层
 * @returns 绘制范围内搜索到的结果图层
 */
async function getSearchLayer(drawLayer) {
  // 根据绘制图形进行范围查询
  let features
  switch (drawLayer.type) {
    case "rectangle":
      features = await searchByBounds(drawLayer.layer._bounds)
      break
    case "polygon":
      features = await searchByGeometry(L.polygon(drawLayer.layer._latlngs))
      break
    default:
      break
  }

  if (features == undefined) return
  return await new Promise(resolve => {
    let resultLayer = L.geoJSON(features, {
      onEachFeature: function (feature, layer) {
        // console.log(feature.properties);
        layer.bindPopup(feature.properties.NAME)
      },
    })
    // console.log(resultLayer);
    // resultLayer.addTo(map)
    resolve(resultLayer)
  })
}

// 范围查询
async function searchByBounds(bounds) {
  // 范围查询参数
  const boundsParam = await new Promise(resolve => {
    const params = new L.supermap.GetFeaturesByBoundsParameters({
      datasetNames: ["ChengduFresh:Shop"],
      bounds: bounds,
    })
    resolve(params)
  })

  return await new Promise(resolve => {
    L.supermap.featureService(dataUrl).getFeaturesByBounds(boundsParam, function (serviceResult) {
      resolve(serviceResult.result.features)
    })
  })
  // return await Promise.all([boundsParam, resultLayer])
}

// 几何查询
async function searchByGeometry(polygon) {
  // 几何查询参数
  const geometryParam = await new Promise(resolve => {
    const params = new L.supermap.GetFeaturesByGeometryParameters({
      datasetNames: ["ChengduFresh:Shop"],
      geometry: polygon,
    })
    resolve(params)
  })

  return await new Promise(resolve => {
    L.supermap
      .featureService(dataUrl)
      .getFeaturesByGeometry(geometryParam, function (serviceResult) {
        resolve(serviceResult.result.features)
      })
  })
}

// sql查询
async function searchBySql(shop = "店", ...args) {
  let queryParameter = {
    name: "Shop",
    attributeFilter: `Name like '%${shop}%'`,
  }
  let sqlParameters = {
    queryParameter,
    datasetNames: ["ChengduFresh:Shop"],
  }
  Object.assign(sqlParameters, ...args)
  const sqlParam = await new Promise(resolve => {
    const params = new L.supermap.GetFeaturesBySQLParameters(sqlParameters)
    resolve(params)
  })

  return await new Promise(resolve =>
    new L.supermap.FeatureService(dataUrl).getFeaturesBySQL(sqlParam, function (serviceResult) {
      resolve(serviceResult.result.features)
    })
  )
}

// 查询字段信息
async function getFieldsName(url = "") {
  url = url == "" ? dataUrl : url
  return await new Promise((resolve, reject) => {
    const fieldsParam = new SuperMap.FieldParameters({
      datasource: "ChengduFresh",
      dataset: "Shop",
    })
    L.supermap.fieldService(url).getFields(fieldsParam, serviceResult => {
      resolve(serviceResult.result.fieldNames)
    })
  }).catch(err => console.log(err))
}

function searchButton() {
  const btnView = L.control({ position: "topright" })
  btnView.onAdd = function () {
    L.DomUtil.create("div", "")
  }
}

export default mapObject
export { mapControl, getSearchLayer, searchBySql, getFieldsName }
