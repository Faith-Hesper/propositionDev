/*
 * @Author: Faith
 * @Date: 2022-07-16 21:33
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-31 16:31
 * @Description:
 */

import { aimIcon, searchByGeometry, serviceAreaAnalyst } from "@/utils/map.js"
import { walkIcon, pointIcon, marketIcon, startIcon } from "@/utils/Icon.js"
import { randomColor, cacheShopData } from "@/utils/tool.js"

// 获取缓冲区内的门店 marker latlng
const getBufferInnerShop = async (bufferLayer, name, range, count = 145) => {
  try {
    // 缓冲区内的商店 原始
    let geometryLayer = await searchByGeometry({ geometry: bufferLayer, count: count })
    if (geometryLayer.features.length === 0) {
      let error = `对不起，您周围${range}公里范围内未搜索到商店,请扩大搜索范围或更换目标点`
      throw new Error(error)
    }

    // console.log(geometryLayer)
    // 商店坐标 marker
    let { latlngArray, fitResultLayerArr } = await getServiceArea({
      serviceArea: geometryLayer,
      name: name,
    })

    if (latlngArray) {
      ElMessage({
        showClose: true,
        message: `已查询到${latlngArray.length}家商店`,
        type: "success",
      })
    }

    return await Promise.resolve({ geometryLayer, latlngArray, fitResultLayerArr })
  } catch (error) {
    ElMessage({
      showClose: true,
      message: `${error}`,
      type: "warning",
    })
    return Promise.reject(error)
    // console.log(error)
  }
}

// 获取服务站点坐标 array 数据
const getServiceArea = async ({ serviceArea, name = "" }) => {
  return await new Promise((resolve, reject) => {
    let latlngArray = []
    let fitResultLayerArr = serviceArea.features.filter(feature => {
      // console.log(feature)
      // 筛选符合搜索名称的商店
      if (name) {
        if (feature.properties.NAME.indexOf(name) != -1) {
          latlngArray.push(L.latLng(feature.geometry.coordinates.reverse()))
          return true
        }
      } else {
        latlngArray.push(L.latLng(feature.geometry.coordinates.reverse()))
        return true
      }
    })

    // console.log(latlngArray)
    if (latlngArray.length === 0) {
      reject("未查询到该商店,请重新输入商店名称")
    }
    resolve({ latlngArray, fitResultLayerArr })
  })
}

// 获取设施点 marker array
const getfacilitiesPoint = async facilityPathList => {
  // 最近设施点
  let facilities = facilityPathList.map(async facilityPath => {
    // console.log(facilityPath)
    let facility = facilityPath.facility
    let latlng = L.latLng(facility.y, facility.x)
    // console.log(latlng)
    let facilityMarkers = L.marker(latlng, { icon: aimIcon })
    let { features } = await searchByGeometry({ geometry: facilityMarkers })

    let name = features[0].properties.NAME

    return { name: name, latlng: latlng }
  })
  return await Promise.all(facilities)
  // console.log(facilities)
  // resolve(facilities)
}

// 获取路线 主干线路
const getfacilitiesRoute = async facilityPathList => {
  return await new Promise((resolve, reject) => {
    // 路线
    let facilitiesRoute = facilityPathList.map(facilityPath => {
      let routeLatLngs = []
      L.geoJSON(facilityPath.route, {
        style: () => {
          return { color: "#ff7800", weight: 5, opacity: 0.65 }
        },
        onEachFeature: (feature, layer) => {
          routeLatLngs.push(...layer.getLatLngs())
        },
      })
      return routeLatLngs
    })

    resolve(...facilitiesRoute)
  })
}

// 路线指引
const getRouteGuide = async (facilityPathList, aimLatLng) => {
  let promiseRoute = facilityPathList.map(facilityPath => {
    let index = 0,
      routeLatLngs = []

    let route = facilityPath.pathGuideItems.features.map(feature => {
      // 路线指引描述
      return {
        distance: feature.properties.distance,
        length: feature.properties.length,
        description: feature.properties.description,
      }
    })

    // 去除首尾部分的图层
    let guideLayer = L.geoJSON(facilityPath.pathGuideItems, {
      pointToLayer: (point, latlng) => {
        index++
        // 引用类型
        if (index === 1 || (aimLatLng.lat === latlng.lat && aimLatLng.lng === latlng.lng)) {
          // 首尾坐标
          routeLatLngs.push(latlng)
          return
        }
        // console.log(point)
        return L.marker(latlng, { icon: pointIcon })
      },
      style: () => {
        return { color: "#ffb676", weight: 10 }
      },
    })

    // console.log(routeLatLngs)

    return { routeGuide: route, latlngs: routeLatLngs, guideLayer: guideLayer }
  })
  return await Promise.all(promiseRoute)
}

const getSearviceRegion = async latlngArr => {
  // 服务区分析
  let [serviceAnalystData] = await serviceAreaAnalyst([latlngArr])
  let { serviceRegion } = serviceAnalystData
  console.log(serviceRegion)
  return await new Promise((resolve, reject) => {
    let result = L.geoJSON(serviceRegion, {
      style: () => {
        let color = randomColor()
        return { color: color }
      },
    })
    resolve(result)
  })
}

export {
  getBufferInnerShop,
  getServiceArea,
  getfacilitiesPoint,
  getfacilitiesRoute,
  getRouteGuide,
  getSearviceRegion,
}
