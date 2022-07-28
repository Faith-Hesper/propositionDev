<template>
  <div class="store">
    <div v-if="formShow" class="query-form">
      <div class="title">查询{{ form.range }}公里范围内商店</div>
      <el-form ref="formRef" size="small" status-icon :rules="rules" :model="form">
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
          <el-button type="primary" @click="searchFitShop">查询</el-button>
          <el-button type="primary" @click="reset">重置</el-button>
          <el-button type="primary" @click="formShow = false">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div v-else class="querybtn">
      <div class="title">查询范围内商店</div>
      <Draw
        v-if="props.map"
        :map="props.map"
        :drawBtns="queryBtn"
        @rectangleLayer="rectangleLayer"
        @polygonLayer="polygonLayer"
        @markerLayer="markerLayer"
      ></Draw>
    </div>
    <!-- </div> -->
  </div>
</template>

<script setup>
  import Draw from "@/components/Draw"
  import ShopForm from "@/components/ShopForm"
  import { greenIcon, searchByBounds, searchByGeometry, bufferAnalyst } from "@/utils/map.js"
  import { getBufferInnerShop } from "@/utils/analyst.js"
  import { walkIcon, pointIcon, marketIcon, startIcon } from "@/utils/Icon.js"
  import { arrFeatureToGeoJson, debounce } from "@/utils/tool.js"

  import { watch, reactive, ref, shallowReactive } from "vue"
  const props = defineProps({ map: { type: Object, default: () => null } })
  const emits = defineEmits(["listLoading", "shopData"])
  const formShow = ref(false)
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
    loading: false,
    aimMarkerLayer: null,
    bufferLayer: null,
    markersLayer: null,
  })
  const statusFitShop = ref(false)
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
  const reset = () => {
    form.name = ""
    form.range = 3
    form.shopNum = 10
  }
  const queryBtn = [
    {
      id: 0,
      name: "框选查询",
      type: "rectangle",
    },
    {
      id: 1,
      name: "多边形查询",
      type: "polygon",
    },
    {
      id: 2,
      name: "条件查询",
      type: "marker",
    },
  ]
  MyCustomMap.editableLayers = L.featureGroup().addTo(props.map)
  MyCustomMap.bufferLayer = L.featureGroup()
  MyCustomMap.markersLayer = L.featureGroup()

  MyCustomMap.editableLayers
    .on("mouseover", e => {
      e.layer.openPopup()
    })
    .on("mouseout", e => e.layer.closePopup())
    .on("click", e => {})

  // 框选查询
  const rectangleLayer = async resultLayer => {
    MyCustomMap.editableLayers.clearLayers()
    // 绘制图层
    MyCustomMap.editableLayers.addLayer(resultLayer)
    emits("listLoading", true)
    // 查询到的要素
    let { features } = await searchByBounds({ bounds: resultLayer._bounds })
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
  }

  // 多边形查询
  const polygonLayer = async resultLayer => {
    // fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer)
    emits("listLoading", true)
    // console.log(resultLayer)
    let { features } = await searchByGeometry({ geometry: L.polygon(resultLayer._latlngs) })
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
    // fullscreenLoading.value = false
  }

  const markerLayer = async resultLayer => {
    MyCustomMap.editableLayers.clearLayers()
    // console.log(bufferLayer)
    MyCustomMap.aimMarkerLayer = null
    MyCustomMap.aimMarkerLayer = resultLayer
    formShow.value = true
    let markerLayerBind = resultLayer
      .bindPopup("起始点", {
        className: "custom",
      })
      .openPopup()
    MyCustomMap.editableLayers.addLayer(markerLayerBind)
  }

  // 绑定缓冲区图层
  const bindBuffer = async range => {
    if (MyCustomMap.editableLayers.hasLayer(MyCustomMap.bufferLayer)) {
      MyCustomMap.editableLayers.removeLayer(MyCustomMap.bufferLayer)
    }
    MyCustomMap.bufferLayer.clearLayers()

    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: MyCustomMap.aimMarkerLayer,
      distance: range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer)
      .bindPopup("三公里", { autoClose: false, closeOnClick: false })
      .openPopup()
    props.map.fitBounds(bufferLayerBind.getBounds())
    MyCustomMap.bufferLayer.addLayer(bufferLayerBind).addTo(MyCustomMap.editableLayers)
    return await Promise.resolve(bufferLayerBind)
  }

  const searchFitShop = async () => {
    emits("listLoading", true)
    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: MyCustomMap.aimMarkerLayer,
      distance: form.range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer).bindPopup("三公里").openPopup()
    MyCustomMap.editableLayers.addLayer(bufferLayerBind)

    // 范围内门店图层和坐标数组
    let { latlngArray, fitResultLayerArr } = await getBufferInnerShop(
      bufferLayer,
      form.name,
      form.range,
      form.shopNum
    ).catch(err => {
      props.map.flyTo([30.67, 104.07], 12)
      throw new Error(err)
    })
    bindBufferShop(fitResultLayerArr)
  }

  // 绑定范围内门店图层 marker
  const bindBufferShop = fitResultLayerArr => {
    if (MyCustomMap.editableLayers.hasLayer(MyCustomMap.markersLayer)) {
      MyCustomMap.editableLayers.removeLayer(MyCustomMap.markersLayer)
    }
    MyCustomMap.markersLayer.clearLayers()

    emits("listLoading", true)

    formatShopData(fitResultLayerArr)
    // console.log(latlngArray, fitResultLayerArr)
    let fitResultLayer = arrFeatureToGeoJson(fitResultLayerArr)
    let fitResultLayerBind = geoJsonBind(fitResultLayer)
    console.log(fitResultLayerBind)

    MyCustomMap.markersLayer.addLayer(fitResultLayerBind).addTo(MyCustomMap.editableLayers)
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: (feature, latLng) => {
        let latlng = [latLng.lat, latLng.lng].reverse()
        let marker = L.marker(latlng, { icon: greenIcon }).bindPopup(`
    <div class="shop">
    <p>店名：${feature.properties.NAME}</p>
    <p>品类：${feature.properties.CATEGORY}</p>
    <p>价格：${feature.properties.PRICE}元/kg</p>
    </div>
    `)
        return marker
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
          newRange,
          form.shopNum
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
</script>

<style lang="less" scoped>
  .store {
    width: 250px;
    .title {
      width: 100%;
      font-size: 14px;
      font-weight: bold;
      color: grey;
      background: #e4eef6;
    }
    /deep/ .el-form-item__content {
      justify-content: center;
    }
    .querybtn {
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-content: space-around;
      .draw-btn {
        flex-direction: row;
        justify-content: space-around;
        .el-button {
          width: 20px;
        }
      }
    }
  }
</style>
