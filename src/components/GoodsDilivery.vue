<template>
  <div class="dilivery">
    <div v-if="formShow" class="main-args">
      <div class="title">查询{{ form.range }}公里范围内最近{{ form.name }}门店</div>
      <div class="form">
        <el-form
          size="small"
          :rules="rules"
          :model="form"
          v-loading="loading"
          element-loading-text="数据加载中"
        >
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
    <div v-if="treeselect.diliveryPoint != undefined" class="start-end">
      <el-collapse v-model="activeNames" accordion>
        <el-collapse-item class="start" :title="'起点:' + treeselect.shopName" name="start">
          <div>商店:{{ treeselect.shopName }}</div>
          <el-steps direction="vertical" :active="active" finish-status="success">
            <el-step
              class="step"
              :space="50"
              :title="item.description"
              @mouseover="nowActive(index)"
              @mouseleave="clearActive(index)"
              v-for="(item, index) in treeselect.diliveryShop"
            >
            </el-step>
          </el-steps>
        </el-collapse-item>
        <el-collapse-item class="end" title="配送点" name="end">
          <div class="latlg">
            <div>纬度:{{ treeselect.diliveryPoint.lat }}</div>
            <div>经度:{{ treeselect.diliveryPoint.lng }}</div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
  import Draw from "@/components/Draw"
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
  import { arrFeatureToGeoJson, debounce, throttle } from "@/utils/tool.js"
  import {
    getBufferInnerShop,
    getServiceArea,
    getfacilitiesPoint,
    getfacilitiesRoute,
    getRouteGuide,
    getSearviceRegion,
  } from "@/utils/analyst.js"
  import {
    computed,
    nextTick,
    onMounted,
    onUnmounted,
    onUpdated,
    reactive,
    ref,
    shallowReactive,
    watch,
  } from "vue"

  const props = defineProps({
    map: { type: Object, default: () => null },
    status: { type: Boolean, default: false },
  })
  const emits = defineEmits(["listLoading", "shopData"])
  const active = ref(0)
  const formShow = ref(false)
  const statusFitShop = ref(false)
  const loading = ref(false)
  const activeNames = ref(["end"])
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
  })
  const layers = shallowReactive({
    aimMarker: null,
    bufferRegion: null,
    regionMarkers: null,
    animateMarker: null,
    guideLayer: null,
    searviceRegion: null,
    tempLayer: null,
  })
  const fitResult = reactive({
    geometryLayer: null,
    latlngArray: null,
    fitResultLayerArr: null,
  })
  const form = reactive({
    name: "",
    range: 3,
  })

  const treeselect = reactive({
    shopName: "",
    data: [],
    diliveryPoint: null,
    diliveryShop: [],
  })

  const nowActive = index => {
    active.value = index
    if (!layers.tempLayer) return
    layers.tempLayer.clearLayers()
    // props.map.flyTo()
    let layer = L.geoJSON(treeselect.data[index], {
      style: feature => {
        return { color: "#2a81ff", weight: 12 }
      },
    })
      .bindTooltip(`${treeselect.diliveryShop[index].description}`, {
        direction: "top",
        permanent: true,
      })
      .openPopup()

    layers.tempLayer.addLayer(layer).addTo(MyCustomMap.editableLayers)

    // console.log()
  }
  const clearActive = () => {
    if (!layers.tempLayer) return
    layers.tempLayer.clearLayers()
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
  })
  const queryBtn = [
    {
      id: 0,
      name: "物流配送",
      type: "marker",
    },
  ]

  MyCustomMap.editableLayers = L.featureGroup().addTo(props.map)
  layers.searviceRegion = L.featureGroup()
  layers.tempLayer = L.featureGroup()
  layers.regionMarkers = L.featureGroup()
    .on("mouseover", e => {
      // e.layer.openPopup()
    })
    .on("click", e => {
      e.layer.openPopup()
      let latlng = e.sourceTarget.getLatLng()

      treeselect.diliveryShop = latlng
      document.querySelector(".pre").onclick = function () {
        // console.log(latlng)
        setTimeout(() => {
          e.sourceTarget.closePopup()
        }, 1000)
        layers.bufferRegion.clearLayers()
        diliveryRouteAnalyst([latlng])
      }
      document.querySelector(".range").onclick = async function () {
        // console.log(latlng)
        layers.searviceRegion.clearLayers()
        let layer = await getSearviceRegion(latlng)
        layers.searviceRegion.addLayer(layer).addTo(MyCustomMap.editableLayers)
        setTimeout(() => {
          e.sourceTarget.closePopup()
        }, 1000)
        // console.log(layer)
      }
    })

  layers.bufferRegion = L.featureGroup()
  layers.searviceRegion = L.featureGroup()

  // .on("contextmenu", e => {})

  const markerLayer = async resultLayer => {
    try {
      if (!props.map.hasLayer(MyCustomMap.editableLayers)) {
        MyCustomMap.editableLayers.clearLayers()
        MyCustomMap.editableLayers.addTo(props.map)
      }
      if (layers.aimMarker) {
        MyCustomMap.editableLayers.removeLayer(layers.aimMarker)
        props.map.removeLayer(layers.aimMarker)
        // layers.aimMarker.remove()
      }
      // clearLayer()
      layers.aimMarker = null
      // MyCustomMap.aimMarker = resultLayer
      form.range = 3
      formShow.value = true
      loading.value = true

      const latlng = resultLayer.getLatLng()
      treeselect.diliveryPoint = latlng
      layers.aimMarker = L.marker(latlng, { icon: eventIcon, draggable: true })
        .bindPopup("配送点")
        .openPopup()
        .addTo(MyCustomMap.editableLayers)
        .on("move", e => {
          let context = e
          throttle(changeLatLng(context), 1000)
        })
        .on("dragend", e => {
          let context = e
          throttle(changeLatLng(context), 500)
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
    if (!props.map.hasLayer(MyCustomMap.editableLayers)) {
      MyCustomMap.editableLayers.clearLayers()
      MyCustomMap.editableLayers.addTo(props.map)
    }
    // console.log(layers.aimMarker)
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
  }

  // 绑定缓冲区图层
  const bindBuffer = async range => {
    if (MyCustomMap.editableLayers.hasLayer(layers.bufferRegion)) {
      MyCustomMap.editableLayers.removeLayer(layers.bufferRegion)
      props.map.removeLayer(layers.bufferRegion)
    }
    layers.bufferRegion.clearLayers()

    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: layers.aimMarker,
      distance: range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer)
      .bindTooltip("三公里", { offset: L.point([40, 40]), direction: "top", permanent: true })
      .openPopup()
    props.map.fitBounds(bufferLayerBind.getBounds())
    layers.bufferRegion.addLayer(bufferLayerBind).addTo(MyCustomMap.editableLayers)
    return await Promise.resolve(bufferLayerBind)
  }

  // 绑定范围内门店图层 marker
  const bindBufferShop = fitResultLayerArr => {
    if (MyCustomMap.editableLayers.hasLayer(layers.regionMarkers)) {
      MyCustomMap.editableLayers.removeLayer(layers.regionMarkers)
      props.map.removeLayer(layers.regionMarkers)
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
    if (layers.animateMarker && layers.guideLayer) {
      layers.animateMarker.stop()
      MyCustomMap.editableLayers.removeLayer(layers.animateMarker)
      MyCustomMap.editableLayers.removeLayer(layers.guideLayer)
      props.map.removeLayer(layers.animateMarker)
      props.map.removeLayer(layers.guideLayer)
    }

    const aimLatLng = layers.aimMarker.getLatLng()
    activeNames.value = ["start"]
    // console.log(aimLatLng)
    // 最近设施分析
    let facilityPathList = await closestFacilitiesAnalyst({
      eventPoint: aimLatLng,
      facilityPonit: serviceAreaLatlng,
      facilityNum: 1,
    })

    treeselect.data = facilityPathList[0].pathGuideItems.features
    // console.log(facilityPathList)
    let [point, route, guide] = await getDeliveryRoute(facilityPathList)
    treeselect.shopName = point[0].name

    // 为人物移动添加首尾坐标
    route[0].unshift(guide[0].latlngs[0])
    route[0].push(guide[0].latlngs[1])

    // console.log(layers.aimMarker)
    console.log(route, guide)
    treeselect.diliveryShop = guide[0].routeGuide
    layers.guideLayer = guide[0].guideLayer

    props.map.fitBounds(layers.guideLayer.getBounds())

    layers.guideLayer
      .bindPopup(layer => {
        // console.log(layer)
        return `${layer.feature.properties.description}`
      })
      .addTo(MyCustomMap.editableLayers)

    layers.animateMarker = L.animatedMarker(route[0], {
      icon: walkIcon,
      interval: 400,
      loop: false,
      isPlay: true,
      autoStart: true,
    })
      .on("mouseover", () => {
        layers.animateMarker.pause()
      })
      .on("mouseout", () => {
        layers.animateMarker.start()
      })
      .addTo(MyCustomMap.editableLayers)
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
        getfacilitiesPoint(facilityPathList),
        getfacilitiesRoute(facilityPathList),
        getRouteGuide(facilityPathList, layers.aimMarker.getLatLng()),
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
          <button class="range">商店服务范围</button>
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
    emits("shopData", null)
    treeselect.diliveryPoint = null
    active.value = 0
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
    emits("shopData", null)
    treeselect.diliveryPoint = null
    active.value = 0
    props.map.removeLayer(MyCustomMap.editableLayers)
    MyCustomMap.editableLayers.clearLayers()
    // layers.aimMarker.clearLayers()
    layers.regionMarkers.clearLayers()
    MyCustomMap.editableLayers.addTo(props.map)
  }

  const changeLatLng = e => {
    // console.log(e)
    let latlng = e.target.getLatLng()
    treeselect.diliveryPoint = latlng
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

        layers.guideLayer.clearLayers()
        treeselect.data = []
        treeselect.shopName = ""
        treeselect.diliveryShop = []
        bindBufferShop(fitResultLayerArr)
        fitResult.latlngArray = latlngArray
        fitResult.fitResultLayerArr = fitResultLayerArr
      }, 500)
    }, 800)
  )

  // const change = computed(() => {
  //   console.log(props.status)
  //   formShow.value = false
  //   return props.status + "1"
  // })

  onUpdated(() => {
    if (!props.map.hasLayer(MyCustomMap.editableLayers)) {
      MyCustomMap.editableLayers.clearLayers()
      MyCustomMap.editableLayers.addTo(props.map)
    }
    console.log("onUpdated")
  })

  onMounted(() => {})

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
    .start-end {
      position: fixed;
      min-width: 400px;
      overflow-y: auto;
      background: #fff;
      height: 200px;
      margin: 0 10px;
      left: 45%;
      bottom: 15px;
      z-index: 5;
      .start {
        text-align: left;
        padding-left: 5px;
        .step:hover {
          cursor: pointer;
          background-color: rgb(244, 244, 244);
        }
        .latlng {
        }
      }
      .end {
        text-align: left;
        padding-left: 5px;
      }
    }
  }
</style>
