<template>
  <div class="dilivery">
    <div v-if="formShow" class="main-args">
      <div class="title">查询{{ form.range }}公里范围内商店</div>
      <div class="form">
        <el-form ref="formRef" size="small" :rules="rules" :model="form">
          <el-form-item label="商店名称">
            <el-input v-model.trim="form.name"></el-input>
          </el-form-item>
          <el-form-item label="查询范围" prop="range">
            <el-input
              v-model.number="form.range"
              type="number"
              placeholder="默认为3公里"
              min="0"
            ></el-input>
          </el-form-item>
          <el-form-item label="查询个数" prop="shopNum">
            <el-input
              v-model.number="form.shopNum"
              type="number"
              placeholder="默认为10个"
              min="0"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="searchFitShop">查询</el-button>
            <el-button type="primary" @click="reset(formRef)">重置</el-button>
            <el-button type="primary" @click="formShow = false">返回</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div v-else class="querybtn">
      <div class="title">添加配送点</div>
      <div class="btn">
        <el-popover placement="bottom" width="50" trigger="hover" content="请添加配送点">
          <template #reference>
            <Draw
              v-if="props.map"
              :map="props.map"
              :drawBtns="queryBtn"
              @markerLayer="markerLayer"
            ></Draw>
          </template>
        </el-popover>
        <el-button size="small" @click="clearLayer">清除图层</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import Draw from "@/components/Draw"
  import {
    greenIcon,
    eventIcon,
    aimIcon,
    searchByGeometry,
    bufferAnalyst,
    closestFacilitiesAnalyst,
  } from "@/utils/map.js"
  import { arrFeatureToGeoJson } from "@/utils/tool.js"
  import { getServiceArea, getfacilitiesPoint, getfacilitiesRoute } from "@/utils/analyst.js"
  import { nextTick, onUnmounted, reactive, ref, shallowReactive } from "vue"
  const props = defineProps({ map: { type: Object, default: () => null } })
  const emits = defineEmits(["listLoading", "shopData"])
  const formShow = ref(false)
  // const formRef = ref()
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
    loading: false,
    aimMarkerLayer: null,
  })
  const layers = shallowReactive({
    aimMarker: null,
    regionMarkers: null,
  })
  const form = reactive({
    name: "",
    range: 3,
    shopNum: 10,
  })
  const checkNum = (rule, value, callback) => {
    // console.log(rule, value)
    if (!value) {
      callback()
    }
    setTimeout(() => {
      // console.log(value)
      if (value <= 0) {
        callback(new Error("请输入大于0的数字"))
      }
      callback()
    }, 700)
  }
  const rules = reactive({
    range: [{ validator: checkNum, trigger: "change" }],
    shopNum: [{ validator: checkNum, trigger: "change" }],
  })
  const queryBtn = [
    {
      id: 0,
      name: "物流配送",
      type: "marker",
    },
  ]

  MyCustomMap.editableLayers = L.featureGroup().addTo(props.map)
  layers.aimMarker = L.featureGroup().addTo(MyCustomMap.editableLayers)
  layers.regionMarkers = L.featureGroup()

  let myRenderer = L.svg({ padding: 0.5 })

  MyCustomMap.editableLayers
    .on("mouseover", e => {
      // console.log(e)
      // e.target.popupopen()
      e.layer.openPopup()
    })
    .on("mouseout", e => e.layer.closePopup())
    .on("click", e => {
      // console.log(e)
      e.layer.openPopup()
    })
    .on("contextmenu", e => {})

  const markerLayer = resultLayer => {
    layers.aimMarker.clearLayers()
    clearLayer()
    MyCustomMap.aimMarkerLayer = null
    MyCustomMap.aimMarkerLayer = resultLayer
    formShow.value = true
    // console.log(resultLayer)
    // MyCustomMap.editableLayers.addTo(props.map)
    // 3公里范围缓冲区
    // L.marker(resultLayer._latlng, { icon: eventIcon })
    // console.log(bufferLayer)
    let markerLayerBind = resultLayer.bindPopup("配送点").openPopup()
    layers.aimMarker.addLayer(markerLayerBind)
  }

  // 搜索符合条件的门店
  const searchFitShop = async () => {
    clearLayer()
    layers.regionMarkers.clearLayers()
    if (!MyCustomMap.aimMarkerLayer) {
      ElMessage({
        showClose: true,
        message: `请先选择配送点`,
        type: "warning",
      })
      return
    }

    let bufferLayer = await bindBuffer()

    // 范围内门店图层和坐标数组
    let [geometryLayer, latlngArray, fitResultLayerArr] = await getBufferInerShop(bufferLayer)
    formatShopData(fitResultLayerArr)
    // console.log(latlngArray, fitResultLayerArr)
    let fitResultLayer = arrFeatureToGeoJson(fitResultLayerArr)
    // console.log(fitResultLayer)
    let fitResultLayerBind = geoJsonBind(fitResultLayer)

    layers.regionMarkers.addLayer(fitResultLayerBind).addTo(MyCustomMap.editableLayers)
    // layers.regionMarkers.addLayer(fitResultLayerBind)
    // layers.regionMarkers.addLayer(fitResultLayerBind).addTo(props.map)

    let routelayer = await diliveryRouteAnalyst(latlngArray)

    routelayer.addTo(MyCustomMap.editableLayers)
  }

  const reset = formRef => {
    // if()
    // form = null
    console.log(formRef)
    formRef.resetFields()
  }

  const bindBuffer = async () => {
    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: MyCustomMap.aimMarkerLayer,
      distance: form.range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer)
      .bindPopup("三公里", { autoClose: false, closeOnClick: false })
      .openPopup()
    MyCustomMap.editableLayers.addLayer(bufferLayerBind)
    return await Promise.resolve(bufferLayer)
  }

  // 获取缓冲区内的门店
  const getBufferInerShop = async bufferLayer => {
    try {
      // 缓冲区内的商店
      let geometryLayer = await searchByGeometry({ geometry: bufferLayer, count: form.shopNum })
      if (geometryLayer.features.length === 0) {
        let error = `对不起，您周围${form.range}公里范围内未搜索到商店,请扩大搜索范围或更换目标点`
        props.map.flyTo([30.67, 104.07], 12)
        throw new Error(error)
      }

      // console.log(geometryLayer)
      // 商店坐标
      let { latlngArray, fitResultLayerArr } = await getServiceArea({
        serviceArea: geometryLayer,
        name: form.name,
      })
      if (latlngArray) {
        ElMessage({
          showClose: true,
          message: `已查询到${latlngArray.length}家商店`,
          type: "success",
        })
      }

      return await Promise.resolve([geometryLayer, latlngArray, fitResultLayerArr])
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

  const diliveryRouteAnalyst = async serviceAreaLatlng => {
    // 最近设施分析
    let facilityPathList = await closestFacilitiesAnalyst({
      eventPoint: MyCustomMap.aimMarkerLayer._latlng,
      facilityPonit: serviceAreaLatlng,
      facilityNum: 1,
    })
    // console.log(serviceAreaLatlng)
    let facilitiesLayer = await getDeliveryRoute(facilityPathList)
    return facilitiesLayer
  }

  // 获取配送路线
  const getDeliveryRoute = async facilityPathList => {
    try {
      let facilities = await getfacilitiesPoint(facilityPathList)
      // console.log(facilityPathList)

      // 路线导航
      let pathGuideItemsPromise = facilityPathList.map(facilityPath => {
        let geojson = L.geoJSON(facilityPath.pathGuideItems, {
          pointToLayer: (point, latlng) => {
            let a = MyCustomMap.aimMarkerLayer.getLatLng()
            // 引用类型
            if (a.lat === latlng.lat && a.lng === latlng.lng) {
              // console.log("object")
              return
            }
            return L.marker(latlng, { icon: aimIcon })
          },
          style: () => {
            return { color: "#ffb676", weight: 8 }
          },
          onEachFeature: (feature, layer) => {
            // console.log(feature, layer)
            return L.polygon([feature.properties.bounds], {
              color: "#ffb676",
            })
          },
        }).bindPopup(function (layer) {
          // console.log(layer)
          return `${layer.feature.properties.description}\n${layer.feature.properties.distance}米`
        })
        // .openPopup()
        // .on("mousemove", e => {
        //   e.layer.openPopup()
        // })
        // .on("mouseout", e => e.layer.closePopup())
        // .on("click", e => {
        //   // console.log(e)
        // })
        return geojson
      })
      let pathGuideItems = await Promise.all(pathGuideItemsPromise)
      // console.log([...pathGuideItems])

      let facilitiesRoute = await getfacilitiesRoute(facilityPathList)
      // return L.featureGroup([...facilities, ...pathGuideItems, ...facilitiesRoute])
      return await Promise.resolve(L.featureGroup([...pathGuideItems]))
    } catch (error) {
      ElMessage({
        showClose: true,
        message: `${error}`,
        type: "warning",
      })
      return error
    }
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: (feature, latLng) => {
        let latlng = [latLng.lat, latLng.lng].reverse()
        return L.marker(latlng, { icon: greenIcon }).bindPopup(`
  <div class="shop">
  <p>店名：${feature.properties.NAME}</p>
  <p>品类：${feature.properties.CATEGORY}</p>
  <p>价格：${feature.properties.PRICE}元/kg</p>
  </div>
  `)
      },
    })
  }

  const formatShopData = async features => {
    let data = await Promise.resolve(
      features.map(feature => {
        return { ...feature.properties }
      })
    )
    emits("shopData", data)
  }

  const clearLayer = () => {
    if (!MyCustomMap.editableLayers) return
    props.map.removeLayer(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.clearLayers()
    layers.regionMarkers.clearLayers()
    layers.aimMarker.addTo(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.addTo(props.map)
  }

  const clearAllLayer = () => {
    if (!MyCustomMap.editableLayers) return
    props.map.removeLayer(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.clearLayers()
    layers.aimMarker.clearLayers()
    layers.regionMarkers.clearLayers()
    MyCustomMap.editableLayers.addTo(props.map)
  }

  // onUnmounted(() => {
  //   clearAllLayer()
  // })
</script>

<style lang="less" scoped>
  .dilivery {
    width: 250px;
    .title {
      width: 100%;
      font-size: 14px;
      font-weight: bold;
      color: grey;
      background: #e4eef6;
    }
    .main-args {
      .form {
        text-align: center;
      }
      /deep/ .el-form-item__content {
        justify-content: center;
      }
    }
    .querybtn {
      width: 100%;
      // height: 60px;
      display: flex;
      flex-direction: column;
      .btn {
        display: flex;
        justify-content: space-around;
        align-content: center;
        padding: 5px 0;
        .draw-btn {
          width: 50%;
          flex-direction: row;
          .el-button {
            width: 20px;
          }
        }
      }
    }
  }
</style>
