/*
 * @Author: Faith
 * @Date: 2022-06-04 16:32
 * @LastAuthor: Faith
 * @LastEditTime: 2022-06-05 22:33
 * @Description:
 */

import { SuperMap, tiandituTileLayer } from '@supermap/iclient-leaflet'
import 'leaflet-draw'
// leaflet-draw 1.0.4 绘制rectangle bug
window.type = true
const url = 'http://t0.tianditu.gov.cn/vec_c/wmts?'
const dataUrl = 'http://localhost:8090/iserver/services/data-ChengduFresh/rest/data'
let resultLayer

// 初始化地图对象
async function mapObject(id) {
  return await new Promise((resolve, reject) => {
    const map = L.map(id, {
      center: [30.67, 104.07],
      minZoom: 2,
      maxZoom: 18,
      zoom: 12,
      crs: L.CRS.EPSG4326,
    })

    resolve(map)
  }).catch((err) => console.log(err))
}

async function mapControl(map) {
  return await new Promise((resolve, reject) => {
    // 这两个底图变量必须定义在函数内部，否则不显示地图
    const baseMapLayer = L.supermap.tiandituTileLayer({
      url: url,
      key: '70c2475638a45e3fea8696df2f9917f8',
    })

    // 地图标签
    const MapLabel = L.supermap.tiandituTileLayer({
      isLabel: true,
      key: '70c2475638a45e3fea8696df2f9917f8',
    })

    console.log(map)
    map.addLayer(baseMapLayer)
    map.addLayer(MapLabel)
    let baseMap = {
      中国底图: baseMapLayer,
      // '矢量标记': MapLabel
    }
    let control = L.control.layers(baseMap).addTo(map)
    L.control
      .scale({
        imperial: false,
        maxWidth: 200,
      })
      .addTo(map)
    resolve(control)
  }).catch((err) => console.log(err))
}

// 绘制
function draw(map) {
  // 新建编辑图层
  const editableLayers = new L.featureGroup()
  map.addLayer(editableLayers)

  // const drawControl = new L.Control.Draw({
  //   draw: {
  //     //绘制线
  //     polyline: true,
  //     //绘制多边形
  //     polygon: true,
  //     //绘制矩形
  //     rectangle: {
  //       shapeOptions: {
  //         color: '#0000FF',
  //       },
  //     },
  //     //绘制圆
  //     circle: true,
  //     //绘制标注
  //     marker: false,
  //     //绘制圆形标注
  //     circlemarker: false,
  //   },
  //   edit: {
  //     featureGroup: editableLayers,
  //   },
  // })

  // // 添加绘制控件
  // map.addControl(drawControl)

  return editableLayers

  // console.log(drawLayer);
}

// 查询出绘制范围内地物
async function startSearch(map, editableLayers, type) {
  // 清除前面已绘制图层和图标
  editableLayers.clearLayers()
  resultLayer !== undefined ? resultLayer.clearLayers() : true
  switch (type) {
    case 'rectangle':
      new L.Draw.Rectangle(map).enable()
      break
    case 'polygon':
      new L.Draw.Polygon(map).enable()
      break
    default:
      break
  }
  const layerInfo = await drawLayer(map, editableLayers)
  resultLayer = await getSearchLayer(layerInfo)
  resultLayer.addTo(map)
}

// 获取绘制的图形的坐标
async function drawLayer(map, editableLayers) {
  return await new Promise((resolve) => {
    map.on(L.Draw.Event.CREATED, function (e) {
      editableLayers.addLayer(e.layer)
      // console.log(e.layer)
      // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
      let layer = { type: e.layerType, layer: e.layer }
      resolve(layer)
    })
  })
}

// 范围查询
async function searchByBounds(bounds) {
  // 范围查询参数
  const boundsParam = await new Promise((resolve) => {
    const params = new L.supermap.GetFeaturesByBoundsParameters({
      datasetNames: ['ChengduFresh:Shop'],
      bounds: bounds,
    })
    resolve(params)
  })

  return await new Promise((resolve) => {
    L.supermap.featureService(dataUrl).getFeaturesByBounds(boundsParam, function (serviceResult) {
      resolve(serviceResult.result.features)
    })
  })
  // return await Promise.all([boundsParam, resultLayer])
}

// 几何查询
async function searchByGeometry(polygon) {
  // 几何查询参数
  const geometryParam = await new Promise((resolve) => {
    const params = new L.supermap.GetFeaturesByGeometryParameters({
      datasetNames: ['ChengduFresh:Shop'],
      geometry: polygon,
    })
    resolve(params)
  })

  return await new Promise((resolve) => {
    L.supermap
      .featureService(dataUrl)
      .getFeaturesByGeometry(geometryParam, function (serviceResult) {
        resolve(serviceResult.result.features)
      })
  })
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
    case 'rectangle':
      features = await searchByBounds(drawLayer.layer._bounds)
      break
    case 'polygon':
      features = await searchByGeometry(L.polygon(drawLayer.layer._latlngs))
      break
    default:
      break
  }

  if (features == undefined) return
  return await new Promise((resolve) => {
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

function searchButton() {
  const btnView = L.control({ position: 'topright' })
  btnView.onAdd = function () {
    L.DomUtil.create('div', '')
  }
}

export default mapObject
export { mapControl, draw, drawLayer, startSearch, getSearchLayer }
