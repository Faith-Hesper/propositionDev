/*
 * @Author: Faith
 * @Date: 2022-07-16 21:33
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-16 21:35
 * @Description:
 */

// 获取缓冲区内的门店
const getBufferShop = async bufferLayer => {
  try {
    // 缓冲区内的商店
    let geometryLayer = await searchByGeometry({ geometry: bufferLayer })
    if (geometryLayer.features.length === 0) {
      Promise.reject(`对不起，您周围${form.range}公里范围内未搜索到商店,请扩大搜索范围或更换目标点`)
    }

    // console.log(geometryLayer)
    // 商店坐标
    let { latlngArray, fitResultLayer } = await getServiceArea(geometryLayer)
    if (latlngArray) {
      ElMessage({
        showClose: true,
        message: `已查询到${latlngArray.length}个商店`,
        type: "success",
      })
    }

    return await Promise.all([geometryLayer, latlngArray, fitResultLayer])
  } catch (error) {
    ElMessage({
      showClose: true,
      message: `${error}`,
      type: "warning",
    })
    return error
    // console.log(error)
  }
}

// 获取服务站点坐标 array 数据
const getServiceArea = async serviceArea => {
  return await new Promise((resolve, reject) => {
    let latlngArray = []
    let fitResultLayer = serviceArea.features.filter(feature => {
      // console.log(feature)
      // 筛选符合搜索名称的商店
      if (form.name) {
        if (feature.properties.NAME.indexOf(form.name) != -1) {
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
    resolve({ latlngArray, fitResultLayer })
  })
}

export { getBufferShop, getServiceArea }
