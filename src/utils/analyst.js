/*
 * @Author: Faith
 * @Date: 2022-07-16 21:33
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-24 14:12
 * @Description:
 */

import { aimIcon, searchByGeometry } from "@/utils/map.js"
import { walkIcon, pointIcon, marketIcon, startIcon } from "@/utils/Icon.js"

// 获取缓冲区内的门店 marker latlng
const getBufferInnerShop = async (bufferLayer, name, range) => {
  try {
    // 缓冲区内的商店 原始
    let geometryLayer = await searchByGeometry({ geometry: bufferLayer, count: 145 })
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
  return await new Promise((resolve, reject) => {
    // 最近设施点
    let facilities = facilityPathList.map(facilityPath => {
      // console.log(facilityPath)
      let facility = facilityPath.facility
      let facilityMarkers = L.marker([facility.y, facility.x], { icon: aimIcon })
      // console.log(facility)
      return facilityMarkers
    })
    resolve(facilities)
  })
}

// 获取路线 主干线路
const getfacilitiesRoute = async (facilityPathList, map) => {
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
const getRouteGuide = async (facilityPathList, map, aimLatLng) => {
  let promiseRoute = facilityPathList.map(facilityPath => {
    let route = [],
      index = 0,
      routeLatLngs = []
    L.geoJSON(facilityPath.pathGuideItems, {
      onEachFeature: (feature, layer) => {
        console.log(feature, layer)

        // 路线指引描述
        route.push({
          distance: feature.properties.distance,
          length: feature.properties.length,
          description: feature.properties.description,
        })
      },
      pointToLayer: (point, latlng) => {
        routeLatLngs.push(latlng)
        index++
        // 引用类型
        // if (index === 1 || (aimLatLng.lat === latlng.lat && aimLatLng.lng === latlng.lng)) return
        // console.log(point)
        return L.marker(latlng, { icon: pointIcon })
      },
      style: () => {
        return { color: "#ffb676", weight: 8 }
      },
    })
      .bindPopup(layer => {
        // console.log(layer)
        return `${layer.feature.properties.description}`
      })
      .addTo(map)
    // console.log(routeLatLngs)
    return { routeGuide: route, latlngs: routeLatLngs }
  })
  return await Promise.all(promiseRoute)
}

export { getBufferInnerShop, getServiceArea, getfacilitiesPoint, getfacilitiesRoute, getRouteGuide }
