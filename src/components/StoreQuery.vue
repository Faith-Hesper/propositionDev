<template>
  <div class="store">
    <el-card class="box-card" :body-style="{ padding: 0 }">
      <div class="box-header">
        <span>门店查询</span>
      </div>
      <div class="box-body">
        <div class="querybtn">
          <Draw
            v-if="props.map"
            :map="props.map"
            :drawBtns="queryBtn"
            @rectangleLayer="rectangleLayer"
            @polygonLayer="polygonLayer"
          ></Draw>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
  import Draw from "@/components/Draw"
  import ShopForm from "@/components/ShopForm"
  import {
    greenIcon,
    searchByBounds,
    searchByGeometry,
    bufferAnalyst,
    serviceAreaAnalyst,
    closestFacilitiesAnalyst,
  } from "@/utils/map.js"
  import { nextTick, reactive, ref, shallowReactive } from "vue"
  const props = defineProps({ map: { type: Object, default: () => null } })
  const emits = defineEmits(["listLoading", "shopData"])
  const MyCustomMap = shallowReactive({
    control: null,
    editableLayers: null,
    loading: false,
  })
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
  ]
  MyCustomMap.editableLayers = L.featureGroup()
  // 框选查询
  const rectangleLayer = async resultLayer => {
    MyCustomMap.editableLayers.clearLayers()
    // 绘制图层
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(props.map)
    emits("listLoading", true)
    // 查询到的要素
    let { features } = await searchByBounds(resultLayer._bounds)
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
  }

  // 多边形查询
  const polygonLayer = async resultLayer => {
    // fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(props.map)
    emits("listLoading", true)
    // console.log(resultLayer)
    let { features } = await searchByGeometry(L.polygon(resultLayer._latlngs))
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
    // fullscreenLoading.value = false
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
  .store {
    .box-card {
      width: 200px;
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
