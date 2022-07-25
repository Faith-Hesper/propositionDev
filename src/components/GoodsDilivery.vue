<template>
  <div class="dilivery">
    <div v-if="formShow" class="main-args" :v-loading="loading" element-loading-text="数据加载中">
      <div class="title">查询{{ form.range }}公里范围内最近{{ form.name }}门店</div>
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
              min="1"
            ></el-input>
          </el-form-item>
          <el-form-item label="查询个数" prop="shopNum">
            <el-input
              v-model.number="form.shopNum"
              type="number"
              placeholder="默认为10个"
              min="1"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="searchFitShop(form.name, form.range)"
              >查询</el-button
            >
            <el-button type="primary" @click="reset">重置</el-button>
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
        <el-button size="small" @click="clearAllLayer">清除图层</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import Draw from "@/components/Draw"
  import { antPath } from "leaflet-ant-path"
  import {
    // greenIcon,
    eventIcon,
    // aimIcon,
    searchByGeometry,
    bufferAnalyst,
    closestFacilitiesAnalyst,
  } from "@/utils/map.js"
  import { walkIcon, pointIcon, marketIcon, startIcon } from "@/utils/Icon.js"
  import "@/utils/animate"
  import { arrFeatureToGeoJson, debounce } from "@/utils/tool.js"
  import {
    getBufferInnerShop,
    getServiceArea,
    getfacilitiesPoint,
    getfacilitiesRoute,
    getRouteGuide,
  } from "@/utils/analyst.js"
  import { nextTick, onUnmounted, onUpdated, reactive, ref, shallowReactive, watch } from "vue"
  const props = defineProps({ map: { type: Object, default: () => null } })
  const emits = defineEmits(["listLoading", "shopData"])
  const formShow = ref(false)
  const statusFitShop = ref(false)
  const loading = ref(false)
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
  })
  const layers = shallowReactive({
    aimMarker: null,
    bufferRegion: null,
    regionMarkers: null,
    animateMarker: null,
  })
  const fitResult = reactive({
    geometryLayer: null,
    latlngArray: null,
    fitResultLayerArr: null,
  })
  const form = reactive({
    name: "",
    range: 3,
    shopNum: 10,
  })

  const options = {
    delay: 400,
    dashArray: [10, 20],
    weight: 5,
    color: "#0000FF",
    pulseColor: "#FFFFFF",
    paused: false,
    reverse: false,
    hardwareAccelerated: true,
  }

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
    }, 600)
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

  layers.regionMarkers = L.featureGroup()
    // .on("mouseover", e => {
    //   e.layer.openPopup()
    // })
    // .on("mouseout", e => e.layer.closePopup())
    .on("click", e => {
      // console.log(e)
      e.layer.openPopup()
      let latlng = e.sourceTarget.getLatLng()
      document.querySelector(".pre").onclick = function () {
        // console.log(latlng)
        layers.bufferRegion.clearLayers()
        diliveryRouteAnalyst([latlng])
      }
    })
    .on("popupopen", e => {
      // console.log(e)
      // let latlng = e.sourceTarget.getLatLng()
      // document.querySelector(".pre").onclick = function () {
      //   // console.log(latlng)
      //   layers.bufferRegion.clearLayers()
      //   diliveryRouteAnalyst([latlng])
      // }
    })

  layers.bufferRegion = L.featureGroup()

  // .on("contextmenu", e => {})

  const markerLayer = async resultLayer => {
    try {
      if (layers.aimMarker) {
        MyCustomMap.editableLayers.removeLayer(layers.aimMarker)
        // layers.aimMarker.remove()
      }
      // clearLayer()
      layers.aimMarker = null
      // MyCustomMap.aimMarker = resultLayer
      form.range = 3
      formShow.value = true
      loading.value = true

      const latlng = resultLayer.getLatLng()
      layers.aimMarker = L.marker(latlng, { icon: eventIcon, draggable: true })
        .bindPopup("配送点")
        .openPopup()
        .addTo(MyCustomMap.editableLayers)
        .on("mouseover", e => {
          // e.layer.openPopup()
        })
        .on("mouseout", e => {
          console.log(e)
        })

      // 3公里范围缓冲区
      let bufferLayer = await bindBuffer()
      statusFitShop.value = true
      MyCustomMap.editableLayers.addLayer(bufferLayer)

      let { latlngArray, fitResultLayerArr } = await getBufferInnerShop(
        bufferLayer,
        form.name,
        form.range
      ).catch(err => {
        props.map.flyTo([30.67, 104.07], 12)
        throw new Error(err)
      })
      bindBufferShop(fitResultLayerArr)

      fitResult.latlngArray = latlngArray
      fitResult.fitResultLayerArr = fitResultLayerArr
    } catch (error) {}
  }

  // 搜索符合条件的门店
  const searchFitShop = async (name, range) => {
    console.log(layers.aimMarker)
    // clearLayer()
    layers.bufferRegion.clearLayers()
    // layers.regionMarkers.clearLayers()
    if (!layers.aimMarker) {
      ElMessage({
        showClose: true,
        message: `请先选择配送点`,
        type: "warning",
      })
      return
    }

    emits("listLoading", true)
    if (!statusFitShop.value || !fitResult.latlngArray || !fitResult.fitResultLayerArr) {
      let bufferLayer = await bindBuffer(form.range)
      let { geometryLayer, latlngArray, fitResultLayerArr } = await getBufferInnerShop(
        bufferLayer,
        name,
        range
      )
      fitResult.latlngArray = latlngArray
      fitResult.fitResultLayerArr = fitResultLayerArr
      Promise.all([bindBufferShop(fitResultLayerArr), diliveryRouteAnalyst(latlngArray)])
    } else {
      diliveryRouteAnalyst(fitResult.latlngArray)
    }

    // 范围内门店图层和坐标数组
    // bindBufferShop(fitResultLayerArr)

    // let [routelayer, guide] =
    // await diliveryRouteAnalyst(latlngArray)

    // console.log(routelayer, guide)
    // routelayer.addTo(MyCustomMap.editableLayers)
  }

  const reset = () => {
    form.name = ""
    form.range = 3
    form.shopNum = 10
  }

  // 绑定缓冲区图层
  const bindBuffer = async range => {
    if (MyCustomMap.editableLayers.hasLayer(layers.bufferRegion)) {
      MyCustomMap.editableLayers.removeLayer(layers.bufferRegion)
    }
    layers.bufferRegion.clearLayers()

    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: layers.aimMarker,
      distance: range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer)
      .bindPopup("三公里", { autoClose: false, closeOnClick: false })
      .openPopup()
    props.map.fitBounds(bufferLayerBind.getBounds())
    layers.bufferRegion.addLayer(bufferLayerBind).addTo(MyCustomMap.editableLayers)
    return await Promise.resolve(bufferLayerBind)
  }

  // 绑定范围内门店图层 marker
  const bindBufferShop = fitResultLayerArr => {
    if (MyCustomMap.editableLayers.hasLayer(layers.regionMarkers)) {
      MyCustomMap.editableLayers.removeLayer(layers.regionMarkers)
    }
    layers.regionMarkers.clearLayers()

    emits("listLoading", true)

    formatShopData(fitResultLayerArr)
    // console.log(latlngArray, fitResultLayerArr)
    let fitResultLayer = arrFeatureToGeoJson(fitResultLayerArr)
    // console.log(fitResultLayer)
    let fitResultLayerBind = geoJSONBind(fitResultLayer)

    layers.regionMarkers.addLayer(fitResultLayerBind).addTo(MyCustomMap.editableLayers)

    loading.value = false
  }

  const diliveryRouteAnalyst = async serviceAreaLatlng => {
    if (layers.animateMarker) {
      layers.animateMarker.stop()
      MyCustomMap.editableLayers.removeLayer(layers.animateMarker)
    }

    // 最近设施分析
    let facilityPathList = await closestFacilitiesAnalyst({
      eventPoint: layers.aimMarker.getLatLng(),
      facilityPonit: serviceAreaLatlng,
      facilityNum: 1,
    })
    // console.log(serviceAreaLatlng)
    let [route, guide] = await getDeliveryRoute(facilityPathList)

    route[0].unshift(guide[0].latlngs[0])
    route[0].push(guide[0].latlngs[1])
    // let ant = antPath([guide[0].latlngs])
    // console.log(layers.aimMarker)
    console.log(route, guide)
    props.map.fitBounds(guide[0].guideLayer.getBounds())
    // MyCustomMap.editableLayers.addLayer(ant)
    // console.log(route)
    // let routeLine = L.polyline(route[0]).addTo(props.map)
    // let ant = antPath(route, options)
    // props.map.addLayer(ant)
    // console.log(routeLine)
    layers.animateMarker = L.animatedMarker(route[0], {
      icon: walkIcon,
      interval: 400,
      isPlay: true,
      autoStart: true,
    }).addTo(MyCustomMap.editableLayers)
  }

  // 获取配送路线
  const getDeliveryRoute = async facilityPathList => {
    try {
      // let facilities = await getfacilitiesPoint(facilityPathList)
      // console.log(facilities)

      // let pathGuideItems = await Promise.all(pathGuideItemsPromise)
      // console.log([...pathGuideItems])

      // getfacilitiesRoute(facilityPathList)
      // facilitiesRoute[0].addTo(props.map)
      // console.log(facilitiesRoute)
      // return L.featureGroup([...facilities, ...pathGuideItems, ...facilitiesRoute])
      // return await Promise.resolve(L.featureGroup([...pathGuideItems]))
      return await Promise.all([
        getfacilitiesRoute(facilityPathList),
        getRouteGuide(facilityPathList, MyCustomMap.editableLayers, layers.aimMarker.getLatLng()),
      ]).catch(err => Promise.reject(err))
      // return await Promise.resolve(allRoute)
    } catch (error) {
      ElMessage({
        showClose: true,
        message: `${error}`,
        type: "warning",
      })
      return Promise.reject(error)
    }
  }

  const geoJSONBind = features => {
    return L.geoJSON(features, {
      pointToLayer: (feature, latLng) => {
        let latlng = [latLng.lat, latLng.lng].reverse()
        return L.marker(latlng, { icon: marketIcon, title: "门店" }).bindPopup(
          `
        <div class="pop">
        <div class="title">商店</div>
          <div class="content">
            <p>店名：${feature.properties.NAME}</p>
            <p>品类：${feature.properties.CATEGORY}</p>
            <p>价格：${Number(feature.properties.PRICE).toFixed(2)}元/kg</p>
          </div>
        <div class="footer">
          <button class="pre">设为配送商店</button>
        </div>
        </div>
  `,
          {
            className: "custom-pop",
          }
        )
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
    if (layers.animateMarker) {
      layers.animateMarker.stop()
    }
    // layers.aimMarker.clearLayers()
    layers.aimMarker.addTo(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.addTo(props.map)
  }

  const clearAllLayer = () => {
    if (!MyCustomMap.editableLayers) return
    props.map.removeLayer(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.clearLayers()
    // layers.aimMarker.clearLayers()
    layers.regionMarkers.clearLayers()
    MyCustomMap.editableLayers.addTo(props.map)
  }

  watch(
    () => form.range,
    debounce(async function (newRange) {
      if (newRange < 0 || !newRange) return
      let bufferLayer = await bindBuffer(newRange)
      // MyCustomMap.editableLayers.addLayer(bufferLayer)
      setTimeout(async () => {
        let { latlngArray, fitResultLayerArr } = await getBufferInnerShop(
          bufferLayer,
          form.name,
          newRange
        ).catch(err => {
          props.map.flyTo([30.67, 104.07], 12)
          throw new Error(err)
        })
        statusFitShop.value = true
        bindBufferShop(fitResultLayerArr)
        fitResult.latlngArray = latlngArray
        fitResult.fitResultLayerArr = fitResultLayerArr
      }, 500)
    }, 800)
  )

  onUpdated(() => {
    console.log("onUpdated")
  })

  onUnmounted(() => {
    clearAllLayer()
  })
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
          width: fit-content;
          flex-direction: row;
          justify-content: center;
          .el-button {
            width: 20px;
          }
        }
      }
    }
  }
</style>
