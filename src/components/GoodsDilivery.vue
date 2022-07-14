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
              <el-input v-model="form.range"></el-input>
            </el-form-item>
            <el-form-item label="查询个数">
              <el-input v-model="form.shopNum"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchFitShop">查询</el-button>
              <el-button type="primary" @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="querybtn">
          <Draw
            v-if="props.map"
            :map="props.map"
            :drawBtns="queryBtn"
            @markerLayer="markerLayer"
          ></Draw>
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
    form: null,
  })
  const form = reactive({
    name: "",
    range: "",
    shopNum: "",
  })
  const queryBtn = [
    {
      id: 0,
      name: "物流配送",
      type: "marker",
    },
  ]
  MyCustomMap.editableLayers = L.featureGroup()
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
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addTo(props.map)
    // 3公里范围缓冲区

    // console.log(bufferLayer)
    let rectangleLayerBind = L.marker(resultLayer._latlng, { icon: eventIcon }).bindPopup("起始点")
    // MyCustomMap.editableLayers.addLayer(bufferLayerBind)
    MyCustomMap.editableLayers.addLayer(rectangleLayerBind)

    // // 最近设施分析
    // let facilityPathList = await closestFacilitiesAnalyst(resultLayer._latlng, serviceAreaLatlng)
    // let facilitiesLayer = getDeliveryRoute(facilityPathList)
    // // console.log(facilities)
    // MyCustomMap.editableLayers.addLayer(facilitiesLayer)
  }

  const searchFitShop = () => {}

  const reset = () => {
    form = null
  }

  const getBufferShop = async () => {
    let bufferLayer = await bufferAnalyst(resultLayer)
    let bufferLayerBind = L.geoJSON(bufferLayer).bindPopup("三公里").openPopup()

    // 缓冲区内的商店
    let geometryLayer = await searchByGeometry(bufferLayer)
    // 商店坐标
    let serviceAreaLatlng = getServiceArea(geometryLayer)
  }

  // 获取服务站点坐标 array 数据
  const getServiceArea = serviceArea => {
    return serviceArea.features.map(feature => {
      // console.log(feature)
      let latlng = L.latLng(feature.geometry.coordinates.reverse())
      // console.log(latlng)
      return latlng
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
