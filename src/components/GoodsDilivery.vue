<template>
  <div class="dilivery">
    <div class="box-card">
      <!-- <div class="box-header">
        <span>物流配送</span>
      </div> -->
      <div class="box-body">
        <div class="main-args">
          <el-form>
            <el-form-item label="商店名称">
              <el-input v-model="form.name"></el-input>
            </el-form-item>
            <el-form-item label="查询范围">
              <el-input
                v-model="form.range"
                type="number"
                placeholder="默认为3公里"
                min="0"
              ></el-input>
            </el-form-item>
            <el-form-item label="查询个数">
              <el-input
                v-model="form.shopNum"
                type="number"
                placeholder="默认为10个"
                min="0"
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchFitShop">查询</el-button>
              <el-button type="primary" @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="querybtn">
          <el-popover placement="bottom" :width="50" trigger="hover" content="请选择目标点">
            <template #reference>
              <Draw
                v-if="props.map"
                :map="props.map"
                :drawBtns="queryBtn"
                @markerLayer="markerLayer"
              ></Draw>
            </template>
          </el-popover>
        </div>
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
  import { nextTick, reactive, ref, shallowReactive } from "vue"
  const props = defineProps({ map: { type: Object, default: () => null } })
  const emits = defineEmits(["listLoading", "shopData"])
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
    loading: false,
    aimMarkerLayer: null,
    aimMarker: null,
  })
  const form = reactive({
    name: "",
    range: 3,
    shopNum: 10,
  })
  const queryBtn = [
    {
      id: 0,
      name: "物流配送",
      type: "marker",
    },
  ]
  MyCustomMap.editableLayers = L.featureGroup().addTo(props.map)
  MyCustomMap.aimMarker = L.featureGroup()

  let myRenderer = L.svg({ padding: 0.5 })

  MyCustomMap.editableLayers
    .on("mousemove", e => {
      // console.log(e)
      // e.target.popupopen()
      e.layer.openPopup()
    })
    .on("mouseout", e => e.layer.closePopup())
    .on("click", e => {
      // console.log(e)
    })

  const markerLayer = async resultLayer => {
    MyCustomMap.aimMarker.clearLayers()
    MyCustomMap.aimMarkerLayer = null
    MyCustomMap.aimMarkerLayer = resultLayer
    // console.log(resultLayer)
    // MyCustomMap.editableLayers.addTo(props.map)
    // 3公里范围缓冲区

    // console.log(bufferLayer)
    let markerLayerBind = L.marker(resultLayer._latlng, { icon: eventIcon })
      .bindPopup("起始点")
      .openPopup()
    MyCustomMap.aimMarker.addLayer(markerLayerBind).addTo(props.map)
  }

  // 搜索符合条件的门店
  const searchFitShop = async () => {
    MyCustomMap.editableLayers.clearLayers()
    // 缓冲区图层
    let bufferLayer = await bufferAnalyst({
      geometry: MyCustomMap.aimMarkerLayer,
      distance: form.range,
    })
    let bufferLayerBind = L.geoJSON(bufferLayer).bindPopup("三公里").openPopup()
    MyCustomMap.editableLayers.addLayer(bufferLayerBind)

    let a = await getBufferShop()
    console.log(a)

    // 最近设施分析
    // let facilityPathList = await closestFacilitiesAnalyst({
    //   eventPoint: MyCustomMap.aimMarkerLayer._latlng,
    //   facilityPonit: serviceAreaLatlng,
    // })
    // // console.log(facilityPathList)
    // let facilitiesLayer = getDeliveryRoute(facilityPathList)
    // MyCustomMap.editableLayers.addLayer(facilitiesLayer)
  }

  const reset = () => {
    // if()
    form = null
  }

  const getBufferShop = async () => {
    try {
      let bufferLayer = await bufferAnalyst({
        geometry: MyCustomMap.aimMarkerLayer,
        distance: form.range,
      })
      let bufferLayerBind = L.geoJSON(bufferLayer).bindPopup("三公里").openPopup()

      // 缓冲区内的商店
      let geometryLayer = await searchByGeometry(bufferLayer)
      if (geometryLayer.features.length === 0) {
        Promise.reject(
          `对不起，您周围${form.range}公里范围内未搜索到商店,请扩大搜索范围或更换目标点`
        )
      }

      // console.log(geometryLayer)
      // 商店坐标
      let serviceAreaLatlng = await getServiceArea(geometryLayer)

      return await Promise.all([bufferLayer, geometryLayer, serviceAreaLatlng])
    } catch (error) {
      ElMessage({
        showClose: true,
        message: `${error}`,
        type: "error",
      })
      return "cw"
      // console.log(error)
    }
  }

  // const getFitNameShop = (geometryLayer)=>{
  //   if(form.name){
  //     return geometryLayer.
  //   }
  // }

  // 获取服务站点坐标 array 数据
  const getServiceArea = async serviceArea => {
    return await new Promise((resolve, reject) => {
      let resultArray = serviceArea.features.filter(feature => {
        // console.log(feature)
        // 筛选符合搜索名称的商店
        if (form.name) {
          if (feature.properties.NAME.indexOf(form.name) != -1) {
            return L.latLng(feature.geometry.coordinates.reverse())
          }
        } else {
          return L.latLng(feature.geometry.coordinates.reverse())
        }
      })

      if (resultArray.length === 0) {
        reject("未查询到该商店,请重新输入商店名称")
      }
      resolve(resultArray)
    })
  }

  // 获取配送路线
  const getDeliveryRoute = facilityPathList => {
    // 最近设施点
    let facilities = facilityPathList.map(facilityPath => {
      // console.log(facilityPath)
      let facility = facilityPath.facility
      let facilityMarkers = L.marker([facility.y, facility.x], { icon: aimIcon })
      // console.log(facility)
      return facilityMarkers
    })
    console.log(facilityPathList)
    let pathGuideItems = facilityPathList.map(facilityPath => {
      let geojson = L.geoJSON(facilityPath.pathGuideItems, {
        style: () => {
          return { color: "#ffb676", weight: 5 }
        },
        onEachFeature: (feature, layer) => {
          // console.log(feature, layer)
          return L.polygon([feature.properties.bounds], {
            color: "#ffb676",
          })
        },
      })
        .bindPopup(function (layer) {
          // console.log(layer)
          return `${layer.feature.properties.description}\n${layer.feature.properties.distance}`
        })
        .openPopup()
        .on("mousemove", e => {
          e.layer.openPopup()
        })
        .on("mouseout", e => e.layer.closePopup())
        .on("click", e => {
          // console.log(e)
        })
      return geojson
    })

    // 路线
    let facilitiesRoute = facilityPathList.map(facilityPath => {
      return L.geoJSON(facilityPath.route, {
        style: () => {
          return { color: "#ff7800", weight: 5, opacity: 0.65 }
        },
      })
    })

    // return L.featureGroup([...facilities, ...pathGuideItems, ...facilitiesRoute])
    return L.featureGroup([...pathGuideItems])
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: (feature, latlng) => {
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
</script>

<style lang="less" scoped>
  .dilivery {
    .box-card {
      width: 250px;
      .box-header {
        height: 25px;
        background: #428bca;
        span {
          font-style: 14px;
          line-height: 25px;
          color: white;
        }
      }
      .box-body {
        width: 100%;
        .querybtn {
          width: 100%;
          height: 50px;
          .draw-btn {
            flex-direction: row;
            .el-button {
              width: 20px;
            }
          }
        }
      }
    }
  }
</style>
