/*
 * @Author: Faith
 * @Date: 2022-06-04 16:32
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-31 11:21
 * @Description:
 */

// import { SuperMap, tiandituTileLayer } from "@supermap/iclient-leaflet"
import initIcon from "@/assets/images/init.png"
import market from "@/assets/images/bag-heart-fill.svg"
import icon1 from "@/assets/images/icon1.png"
import icon2 from "@/assets/images/icon2.png"
// import "leaflet-draw"
// import "@/utils/L.draw-local"
// leaflet-draw 1.0.4 绘制rectangle bug
window.type = true

let CustomIcon1 = L.Icon.extend({
  options: {
    iconUrl: initIcon,
    iconSize: [30, 41], // size of the icon
    shadowSize: [41, 41], // size of the shadow
    iconAnchor: [12, 30], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62], // the same for the shadow
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
  },
})

let greenIcon = new CustomIcon1({
  iconUrl: market,
})
let eventIcon = new CustomIcon1({
  iconUrl: icon1,
})
let aimIcon = new CustomIcon1({
  iconUrl: icon2,
})

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
async function searchByBounds({ bounds, fromIndex = 0, toIndex = 19, count = 20 } = {}) {
  toIndex = toIndex === 19 ? count - 1 : toIndex
  // 范围查询参数
  const boundsParam = await new Promise((resolve, reject) => {
    const params = new L.supermap.GetFeaturesByBoundsParameters({
      datasetNames: ["ChengduFresh:Shop"],
      bounds: bounds,
      fromIndex: fromIndex,
      toIndex: toIndex,
    })
    resolve(params)
  })

  return await new Promise((resolve, reject) => {
    L.supermap
      .featureService(BASE_CONFIG.BASEURL.dataUrl)
      .getFeaturesByBounds(boundsParam, function (serviceResult) {
        if (serviceResult.type === "processFailed") {
          ElMessage({
            showClose: true,
            message: `${serviceResult.error.errorMsg}`,
            type: "error",
          })
          reject(serviceResult.error)
        } else {
          if (serviceResult.result.totalCount < toIndex) {
            ElMessage({
              showClose: true,
              dangerouslyUseHTMLString: true,
              message: `<p>当前一共为您找到${serviceResult.result.featureCount}家商店</p><p>实际周围一共有${serviceResult.result.totalCount}家商店</p>`,
              type: "warning",
            })
          }
          resolve(serviceResult.result.features)
        }
      })
  })
  // return await Promise.all([boundsParam, resultLayer])
}

// 几何查询、根据绘制的几何对象查询几何对象对的图层 从数据服务中查询
async function searchByGeometry({ geometry, fromIndex = 0, toIndex = 19, count = 20 }) {
  toIndex = toIndex === 19 ? count - 1 : toIndex
  // 几何查询参数
  const geometryParam = await new Promise((resolve, reject) => {
    const params = new L.supermap.GetFeaturesByGeometryParameters({
      datasetNames: ["ChengduFresh:Shop"],
      geometry: geometry,
      fromIndex: fromIndex,
      toIndex: toIndex,
    })
    resolve(params)
  })

  return await new Promise((resolve, reject) => {
    L.supermap
      .featureService(BASE_CONFIG.BASEURL.dataUrl)
      .getFeaturesByGeometry(geometryParam, function (serviceResult) {
        // console.log(serviceResult)
        if (serviceResult.type === "processFailed") {
          ElMessage({
            showClose: true,
            message: `${serviceResult.error.errorMsg}`,
            type: "error",
          })
          reject(serviceResult.error)
        } else {
          // console.log(serviceResult.result)
          if (serviceResult.result.totalCount > toIndex && serviceResult.result.featureCount != 0) {
            ElMessage({
              showClose: true,
              dangerouslyUseHTMLString: true,
              message: `当前一共为您找到${serviceResult.result.featureCount}家商店</p><p>实际周围一共有${serviceResult.result.totalCount}家商店</p>`,
              type: "warning",
            })
          }
          resolve(serviceResult.result.features)
        }
      })
  })
}

// sql查询
async function searchBySql(shop = "店", ...args) {
  let queryParameter = {
    name: "Shop",
    attributeFilter: `Name like '%${shop}%'`,
  }
  // console.log(args)
  let sqlParameters = {
    queryParameter,
    datasetNames: ["ChengduFresh:Shop"],
    fromIndex: 0,
    toIndex: 19,
  }
  Object.assign(sqlParameters, ...args)
  const sqlParam = await new Promise((resolve, reject) => {
    const params = new L.supermap.GetFeaturesBySQLParameters(sqlParameters)
    resolve(params)
  })

  return await new Promise((resolve, reject) =>
    new L.supermap.FeatureService(BASE_CONFIG.BASEURL.dataUrl).getFeaturesBySQL(
      sqlParam,
      serviceResult => {
        if (serviceResult.type === "processFailed") {
          ElMessage({
            showClose: true,
            message: `${serviceResult.error}`,
            type: "error",
          })
          reject(serviceResult.error)
        } else {
          resolve({
            totalCount: serviceResult.result.totalCount,
            features: serviceResult.result.features,
          })
        }
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

function bufferAnalystParams(distance) {
  // 空间分析服务
  let bufferAnalystService = new L.supermap.SpatialAnalystService(
    BASE_CONFIG.BASEURL.spatialAnalystUrl
  )
  // 缓冲区分析参数
  let bufferSettings = new L.supermap.BufferSetting({
    endType: L.supermap.BufferEndType.ROUND,
    leftDistance: new L.supermap.BufferDistance({ value: distance }),
    rightDistance: new L.supermap.BufferDistance({ value: distance }),
    radiusUnit: L.supermap.BufferRadiusUnit.KILOMETER,
    semicircleLineSegment: 100,
  })
  return { bufferAnalystService, bufferSettings }
}

// 几何对象缓冲区分析
async function bufferAnalyst({ geometry, distance = 3 } = {}) {
  let { bufferAnalystService, bufferSettings } = bufferAnalystParams(distance)
  // 几何对象缓冲区参数
  let geoBufferAnalystParams = new L.supermap.GeometryBufferAnalystParameters({
    sourceGeometry: geometry,
    sourceGeometrySRID: 4326,
    bufferSetting: bufferSettings,
  })

  // 获取缓冲区geojson数据
  return await new Promise((resolve, reject) => {
    bufferAnalystService.bufferAnalysis(geoBufferAnalystParams, serviceResult => {
      // console.log(serviceResult)
      if (serviceResult.type === "processFailed") {
        ElMessage({
          showClose: true,
          message: `${serviceResult.error.errorMsg}`,
          type: "error",
        })
        reject(serviceResult.error)
      } else {
        resolve(serviceResult.result.resultGeometry)
      }
    })
  })
}

// 交通网络分析参数
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
  let weights = []
  latlng.map(() => {
    weights.push(3000)
  })
  // 服务区分析参数
  let serviceAreaAnalystParameters = new L.supermap.FindServiceAreasParameters({
    weights: weights,
    centers: latlng,
    isAnalyzeById: false,
    parameter: parameter,
  })
  // console.log(latlng)
  // 网络分析服务类
  let networkAnalystService = new L.supermap.NetworkAnalystService(
    BASE_CONFIG.BASEURL.newworkServiceUrl
  )

  return await new Promise((resolve, reject) => {
    // 服务区分析
    networkAnalystService.findServiceAreas(serviceAreaAnalystParameters, serviceResult => {
      // console.log(serviceResult.result.serviceAreaList)
      // let serviceAreaLists = serviceResult.result.serviceAreaList.map(serviceArea => {
      //   return serviceArea.serviceRegion
      // })
      // resolve(serviceAreaLists)
      if (serviceResult.type === "processFailed") {
        ElMessage({
          showClose: true,
          message: `${serviceResult.error.errorMsg}`,
          type: "error",
        })
        reject(serviceResult.error)
      } else {
        resolve(serviceResult.result.serviceAreaList)
      }
    })
  })
}

// 最近设施服务分析
async function closestFacilitiesAnalyst({ eventPoint, facilityPonit, facilityNum = 1 } = {}) {
  let parameter = transportationAnalystParameter()
  // 最近设施服务参数
  let closestFacilitiesAnalystParameters = new L.supermap.FindClosestFacilitiesParameters({
    //事件点,必设参数
    event: eventPoint,
    //要查找的设施点数量。默认值为1
    expectFacilityCount: facilityNum,
    //设施点集合,必设
    facilities: facilityPonit,
    isAnalyzeById: false,
    parameter: parameter,
  })

  // 网络分析服务类
  let networkAnalystService = new L.supermap.NetworkAnalystService(
    BASE_CONFIG.BASEURL.newworkServiceUrl
  )

  return await new Promise((resolve, reject) => {
    // 最近设施分析
    networkAnalystService.findClosestFacilities(
      closestFacilitiesAnalystParameters,
      serviceResult => {
        console.log(serviceResult)
        // let serviceAreaLists = serviceResult.result.serviceAreaList.map(serviceArea => {
        //   return serviceArea.serviceRegion
        // })
        // resolve(serviceAreaLists)
        if (serviceResult.type === "processFailed") {
          ElMessage({
            showClose: true,
            message: `${serviceResult.error}`,
            type: "error",
          })
          reject(serviceResult.error.errorMsg)
        } else {
          resolve(serviceResult.result.facilityPathList)
        }
      }
    )
  })
}

// 交通换乘分析方案
async function trafficTransferAnalyst({ points, tactic = "LESS_TIME" } = {}) {
  let poi = points.map(item => {
    console.log(item)
    return { x: item.lat, y: item.lng }
  })
  console.log(poi)
  const params = new L.supermap.TransferSolutionParameters({
    solutionCount: 6, //最大换乘导引数量
    transferTactic: tactic, //公交换乘策略类型
    walkingRatio: 10, //步行与公交的消耗权重比
    points: poi, //起始点坐标
  })

  let trafficTransferService = new L.supermap.TrafficTransferAnalystService(
    BASE_CONFIG.BASEURL.traffictransferanalystUrl
  )
  return await new Promise((resolve, reject) => {
    trafficTransferService.analysisTransferSolution(params, serviceResult => {
      if (serviceResult.type === "processFailed") {
        ElMessage({
          showClose: true,
          message: `${serviceResult.error}`,
          type: "error",
        })
        reject(serviceResult.error.errorMsg)
      }
      console.log(serviceResult.result)
      resolve(serviceResult.result)
    })
  })
}

export default mapObject
export {
  CustomIcon1,
  greenIcon,
  eventIcon,
  aimIcon,
  searchByBounds,
  searchByGeometry,
  searchBySql,
  getFieldsName,
  bufferAnalyst,
  serviceAreaAnalyst,
  closestFacilitiesAnalyst,
  trafficTransferAnalyst,
}
