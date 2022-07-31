<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import Draw from "@/components/Draw"
  import DrawMap from "@/components/DrawMap"
  import StoreQuery from "@/components/StoreQuery"
  import CardContainer from "@/components/CardContainer"
  import GoodsDilivery from "@/components/GoodsDilivery"
  import ServiceRegion from "@/components/ServiceRegion"
  import HotLayer from "@/components/HotLayer"
  import {
    searchByBounds,
    searchByGeometry,
    bufferAnalyst,
    serviceAreaAnalyst,
    closestFacilitiesAnalyst,
  } from "@/utils/map.js"
  import { walkIcon, pointIcon, marketIcon } from "@/utils/Icon.js"
  import { nextTick, onMounted, reactive, ref, shallowReactive } from "vue"

  const fullscreenLoading = ref(false)
  const listLoading = ref(false)
  const diliveryClear = ref(false)
  const url = "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap"

  const drawBtns = [
    {
      id: 0,
      name: "框选",
      type: "rectangle",
    },
    {
      id: 1,
      name: "多边形",
      type: "polygon",
    },
    {
      id: 2,
      name: "marker",
      type: "marker",
    },
  ]

  const MyCustomMap = shallowReactive({
    map: null,
    control: null,
    editableLayers: null,
    shopData: [],
  })
  MyCustomMap.editableLayers = L.featureGroup()
  const hotLayer = L.featureGroup()
  MyCustomMap.editableLayers

  // 添加图层切换控件
  const mapInit = mapObject => {
    MyCustomMap.map = mapObject.map
    let overlayer = L.supermap
      .tiledMapLayer(BASE_CONFIG.BASEURL.mapUrl, {
        cacheEnabled: true,
        transparent: true,
        opacity: 0.7,
      })
      .addTo(MyCustomMap.map)

    MyCustomMap.control = L.control.layers(
      { "成都地图": overlayer },
      {
        "drawlayer": MyCustomMap.editableLayers,
      },
      { position: "topright", collapsed: true }
    )
    // .addTo(MyCustomMap.map)
    // MyCustomMap.control.addBaseLayer(overlayer, "成都")
  }

  // 商店markers绑定数据
  const getShops = features => {
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()

    formatShopData(features.features)
    let layers = geoJsonBind(features)

    MyCustomMap.map.flyTo(L.latLng(features.features[0].geometry.coordinates.reverse()), 14)
    MyCustomMap.editableLayers.addLayer(layers)
    MyCustomMap.editableLayers.addTo(MyCustomMap.map)
    fullscreenLoading.value = false
  }

  const drawLayer = resultLayer => {
    show.value = true
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
  }

  // 框选查询
  const rectangleLayer = async resultLayer => {
    // console.log(MyCustomMap.editableLayers._layers)
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    // console.log(resultLayer._bounds)
    let { features } = await searchByBounds({ bounds: resultLayer._bounds })
    if (features.length === 0) {
      fullscreenLoading.value = false
      return
    }
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
    fullscreenLoading.value = false
  }

  // 多边形查询
  const polygonLayer = async resultLayer => {
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    // console.log(resultLayer)
    let { features } = await searchByGeometry({ geometry: L.polygon(resultLayer._latlngs) })
    if (features.length === 0) {
      fullscreenLoading.value = false
      return
    }
    // console.log(features)
    formatShopData(features)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
    fullscreenLoading.value = false
  }

  //
  const markerLayer = resultLayer => {
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer)
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: marketIcon }).bindPopup(`
  <div class="shop">
  <p>店名：${feature.properties.NAME}</p>
  <p>品类：${feature.properties.CATEGORY}</p>
  <p>价格：${feature.properties.PRICE}元/kg</p>
  </div>
  `)
      },
    })
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

  const bindNetAnaLayer = serviceResult => {
    // 服务区域
    let serviceRegion = serviceResult.map(serviceArea => {
      return serviceArea.serviceRegion
    })

    let routes = serviceResult.map(serviceArea => {
      return serviceArea.routes
    })
  }

  // 获取配送路线
  const getDeliveryRoute = facilityPathList => {
    let facilities = facilityPathList.map(facilityPath => {
      // console.log(facilityPath.facility)
      let facility = facilityPath.facility
      return L.marker([facility.y, facility.x])
    })
    let facilitiesRoute = facilityPathList.map(facilityPath => {
      return L.geoJSON(facilityPath.route, {
        style: () => {
          return { color: "#ff7800", weight: 5, opacity: 0.65 }
        },
      })
    })

    return L.featureGroup([...facilities, ...facilitiesRoute])
  }

  const changeLoading = status => {
    // console.log(status)
    listLoading.value = status
  }

  const showShopList = data => {
    if (!data) {
      MyCustomMap.shopData = []
      listLoading.value = false
    }
    MyCustomMap.shopData = data
    listLoading.value = false
  }

  const formatShopData = async features => {
    // console.log(features.features)
    if (!features) return
    MyCustomMap.shopData = await Promise.resolve(
      features.map(feature => {
        return { ...feature.properties }
      })
    )
  }

  const flyTOAim = row => {
    // console.log(row)
    MyCustomMap.map.flyTo(row, 14)
  }

  // 清除所有图层
  const clearAll = () => {
    MyCustomMap.editableLayers.clearLayers()
    let layerIndex = 0
    MyCustomMap.shopData = []
    MyCustomMap.map.eachLayer(layer => {
      layerIndex++
      if (layerIndex >= 4) {
        // let layers = layer.getLayers()
        // console.log(layer)
        if (layer._layers) {
          // layer.clearLayers()
          diliveryClear.value = true
        }
        MyCustomMap.map.removeLayer(layer)
      }
      // console.log(layer)
    })
  }
  onMounted(() => {
    // map = await mapObject('map')
    // let control = mapControl(map)

    nextTick(() => {
      // editableLayers.value = draw(map.value)
    })
  })
</script>

<template>
  <div class="main">
    <div class="toolbar">
      <div class="searchbar">
        <Search @shopDetail="getShops"></Search>
      </div>
      <div class="querybar">
        <CardContainer title="门店查询">
          <template v-slot:icon>
            <i>门店查询</i>
          </template>
          <template v-slot:content>
            <StoreQuery
              v-if="MyCustomMap.map"
              :map="MyCustomMap.map"
              @shopData="showShopList"
              @listLoading="changeLoading"
            ></StoreQuery>
          </template>
        </CardContainer>
      </div>
      <div class="store-list">
        <CardContainer title="查询结果">
          <template v-slot:icon>
            <span>查询结果</span>
          </template>
          <template v-slot:content>
            <ShopForm
              v-loading="listLoading"
              element-loading-text="列表数据加载中"
              @flyTOAim="flyTOAim"
              :shopList="MyCustomMap.shopData"
            ></ShopForm>
          </template>
        </CardContainer>
      </div>
      <div class="diliverybar">
        <CardContainer title="物流配送">
          <template v-slot:icon>
            <i>物流配送</i>
          </template>
          <template v-slot:content>
            <GoodsDilivery
              v-if="MyCustomMap.map"
              @shopData="showShopList"
              @listLoading="changeLoading"
              :map="MyCustomMap.map"
              :status="diliveryClear"
            ></GoodsDilivery>
          </template>
        </CardContainer>
      </div>
      <div class="drawbar">
        <Draw
          v-if="MyCustomMap.map"
          :map="MyCustomMap.map"
          :drawBtns="drawBtns"
          @rectangleLayer="rectangleLayer"
          @polygonLayer="polygonLayer"
          @markerLayer="markerLayer"
        ></Draw>
      </div>
      <div class="clearbar">
        <el-button plain size="small" @click="clearAll">清除图层</el-button>
      </div>
      <div class="hotLayerbar">
        <HotLayer v-if="MyCustomMap.map" :map="MyCustomMap.map"></HotLayer>
      </div>
      <div class="serviceareabar">
        <ServiceRegion v-if="MyCustomMap.map" :map="MyCustomMap.map"></ServiceRegion>
      </div>
      <!-- <div class="showheat">
        <el-button @click="showHotMap"></el-button>
      </div> -->
    </div>
    <MapContainer
      v-loading.fullscreen.lock="!MyCustomMap.map || fullscreenLoading"
      element-loading-text="地图加载中"
      @map-created="mapInit"
      style="position: absolute"
    >
    </MapContainer>
    <div class="route">
      <div>起点</div>
      <div>终点</div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .main {
    width: 100%;
    height: 700px;
  }
  .toolbar {
    .searchbar {
      position: relative;
      display: flex;
      left: 60%;
      width: 250px;
      flex-direction: column;
      padding: 5px 5px;
      align-items: center;
      text-align: center;
      z-index: 5;
    }
    .drawbar {
      width: 50px;
      height: 100px;
      position: absolute;
      right: 0;
      margin: 10px 10px 10px 0;
      z-index: 5;
      .el-button {
        width: 50px;
      }
    }
    .clearbar {
      position: absolute;
      top: 180px;
      right: 0;
      margin: 0 10px;
      z-index: 5;
      border-radius: 4px;
    }
    .querybar {
      position: absolute;
      left: 0;
      margin: 10px 0 0 10px;
      z-index: 5;
    }
    .store-list {
      position: absolute;
      width: 400px;
      margin: 0 10px;
      top: 250px;
      z-index: 5;
      .list-header {
        height: 25px;
        background: #428bca;
        span {
          font-style: 14px;
          line-height: 25px;
          color: white;
        }
      }
    }
    .diliverybar {
      position: absolute;
      margin: 0 10px;
      right: 150px;
      top: 300px;
      z-index: 5;
    }
    .hotLayerbar {
      position: absolute;
      margin: 0 10px;
      right: 0;
      top: 210px;
      z-index: 5;
    }
    .serviceareabar {
      position: absolute;
      margin: 0 10px;
      right: 0px;
      top: 250px;
      z-index: 5;
    }
  }
  .route {
    position: absolute;
    margin: 0 10px;
    right: 100px;
    bottom: 200px;
    z-index: 5;
  }
</style>
