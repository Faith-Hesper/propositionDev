/*
 * @Author: Faith
 * @Date: 2022-06-04 16:32
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-09 18:09
 * @Description:
 */

import { SuperMap, tiandituTileLayer } from "@supermap/iclient-leaflet"
// import "leaflet-draw"
// import "@/utils/L.draw-local"
// leaflet-draw 1.0.4 绘制rectangle bug
window.type = true

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

// 范围查询、根据绘制的矩形查询矩形内的图层 从数据服务中查询
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
    L.supermap
      .featureService(BASE_CONFIG.BASEURL.dataUrl)
      .getFeaturesByBounds(boundsParam, function (serviceResult) {
        resolve(serviceResult.result.features)
      })
  })
  // return await Promise.all([boundsParam, resultLayer])
}

// 几何查询、根据绘制的几何对象查询几何对象对的图层 从数据服务中查询
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
      .featureService(BASE_CONFIG.BASEURL.dataUrl)
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
    fromIndex: 0,
    toIndex: 19,
  }
  Object.assign(sqlParameters, ...args)
  const sqlParam = await new Promise(resolve => {
    const params = new L.supermap.GetFeaturesBySQLParameters(sqlParameters)
    resolve(params)
  })

  return await new Promise(resolve =>
    new L.supermap.FeatureService(BASE_CONFIG.BASEURL.dataUrl).getFeaturesBySQL(
      sqlParam,
      serviceResult => {
        resolve({
          totalCount: serviceResult.result.totalCount,
          features: serviceResult.result.features,
        })
      }
    )
  )
}

// 查询字段信息
async function getFieldsName(url = "") {
  url = url == "" ? BASE_CONFIG.BASEURL.dataUrl : url
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

// 几何对象缓冲区分析
async function bufferAnalyst(geometry) {
  // 空间分析服务
  let bufferAnalystService = new L.supermap.SpatialAnalystService(
    BASE_CONFIG.BASEURL.spatialAnalystUrl
  )
  // 缓冲区分析参数
  let bufferSettings = new L.supermap.BufferSetting({
    endType: L.supermap.BufferEndType.ROUND,
    leftDistance: new L.supermap.BufferDistance({ value: 3 }),
    rightDistance: new L.supermap.BufferDistance({ value: 3 }),
    radiusUnit: L.supermap.BufferRadiusUnit.KILOMETER,
    semicircleLineSegment: 100,
  })
  // 几何对象缓冲区参数
  let geoBufferAnalystParams = new L.supermap.GeometryBufferAnalystParameters({
    sourceGeometry: geometry,
    sourceGeometrySRID: 4326,
    bufferSetting: bufferSettings,
  })

  // 获取缓冲区geojson数据
  return await new Promise(resolve => {
    bufferAnalystService.bufferAnalysis(geoBufferAnalystParams, serviceResult => {
      console.log(serviceResult)
      resolve(serviceResult.result.resultGeometry)
    })
  })
}

function transportationAnalystParameter() {
  // 交通网络分析结果返回内容
  let resultSetting = new L.supermap.TransportationAnalystResultSetting({
    returnEdgeFeatures: true,
    returnEdgeGeometry: true,
    returnEdgeIDs: true,
    returnNodeFeatures: true,
    returnNodeGeometry: true,
    returnNodeIDs: true,
    returnPathGuides: true,
    returnRoutes: true,
  })

  // 交通网络分析参数
  let AnalystParameter = new L.supermap.TransportationAnalystParameter({
    resultSetting: resultSetting,
    weightFieldName: "SmLength",
  })
  return AnalystParameter
}

// 服务区分析
async function serviceAreaAnalyst(latlng) {
  let parameter = transportationAnalystParameter()
  // 服务区分析参数
  let serviceAreaAnalystParameters = new L.supermap.FindServiceAreasParameters({
    weights: [3000],
    centers: latlng,
    isAnalyzeById: false,
    parameter: parameter,
  })
  console.log(latlng)
  // 网络分析服务类
  let networkAnalystService = new L.supermap.NetworkAnalystService(
    BASE_CONFIG.BASEURL.newworkServiceUrl
  )

  return await new Promise(resolve => {
    // 服务区分析
    networkAnalystService.findServiceAreas(serviceAreaAnalystParameters, serviceResult => {
      // console.log(serviceResult.result.serviceAreaList)
      // let serviceAreaLists = serviceResult.result.serviceAreaList.map(serviceArea => {
      //   return serviceArea.serviceRegion
      // })
      // resolve(serviceAreaLists)
      resolve(serviceResult.result.serviceAreaList)
    })
  })
}

async function closestFacilitiesAnalyst(eventPoint, facilityPonit) {
  let parameter = transportationAnalystParameter()
  // 最近设施服务参数
  let closestFacilitiesAnalystParameters = new L.supermap.FindClosestFacilitiesParameters({
    //事件点,必设参数
    event: eventPoint,
    //要查找的设施点数量。默认值为1
    expectFacilityCount: 10,
    //设施点集合,必设
    facilities: facilityPonit,
    isAnalyzeById: false,
    parameter: parameter,
  })

  // 网络分析服务类
  let networkAnalystService = new L.supermap.NetworkAnalystService(
    BASE_CONFIG.BASEURL.newworkServiceUrl
  )

  return await new Promise(resolve => {
    // 最近设施分析
    networkAnalystService.findClosestFacilities(
      closestFacilitiesAnalystParameters,
      serviceResult => {
        console.log(serviceResult)
        // let serviceAreaLists = serviceResult.result.serviceAreaList.map(serviceArea => {
        //   return serviceArea.serviceRegion
        // })
        // resolve(serviceAreaLists)
        resolve(serviceResult.result.facilityPathList)
      }
    )
  })
}

export default mapObject
export {
  searchByBounds,
  searchByGeometry,
  searchBySql,
  getFieldsName,
  bufferAnalyst,
  serviceAreaAnalyst,
  closestFacilitiesAnalyst,
}
