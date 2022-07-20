<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import Draw from "@/components/Draw"
  import DrawMap from "@/components/DrawMap"
  import StoreQuery from "@/components/StoreQuery"
  import CardContainer from "@/components/CardContainer"
  import GoodsDilivery from "@/components/GoodsDilivery"
  import ServiceRegion from "@/components/ServiceRegion"
  import {
    CustomIcon,
    greenIcon,
    eventIcon,
    aimIcon,
    searchByBounds,
    searchByGeometry,
    bufferAnalyst,
    serviceAreaAnalyst,
    closestFacilitiesAnalyst,
  } from "@/utils/map.js"
  import { nextTick, onMounted, reactive, ref, shallowReactive } from "vue"

  const fullscreenLoading = ref(false)
  const listLoading = ref(false)
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
    listLoading: false,
    shopData: [],
    StoreQueryStatus: false,
  })

  MyCustomMap.editableLayers = L.featureGroup()

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

    MyCustomMap.control = L.control
      .layers(
        { "成都地图": overlayer },
        {
          "drawlayer": MyCustomMap.editableLayers,
        },
        { position: "topright", collapsed: true }
      )
      .addTo(MyCustomMap.map)
    // MyCustomMap.control.addBaseLayer(overlayer, "成都")
  }

  // 商店markers绑定数据
  const getShops = features => {
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    formatShopData(features)
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
    console.log(MyCustomMap.editableLayers._layers)
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    // console.log(resultLayer._bounds)
    let features = await searchByBounds(resultLayer._bounds)
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
    let features = await searchByGeometry(L.polygon(resultLayer._latlngs))
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
    fullscreenLoading.value = false
  }

  //
  const markerLayer = async resultLayer => {
    fullscreenLoading.value = true
    MyCustomMap.editableLayers.clearLayers()
    // 3公里范围缓冲区
    let bufferLayer = await bufferAnalyst(resultLayer)
    let buffer = L.geoJSON(bufferLayer)

    // 缓冲区内的商店
    let geometryLayer = await searchByGeometry(bufferLayer)
    let markerLayer = geoJsonBind(geometryLayer)

    // 商店坐标
    let serviceAreaLatlng = getServiceArea(geometryLayer)

    console.log(serviceAreaLatlng)
    let featureGroup = L.featureGroup([buffer, markerLayer])
    // console.log(resultLayer)

    // 服务区分析
    let serviceAreaList = await serviceAreaAnalyst(serviceAreaLatlng)
    let serviceRegion = serviceAreaList.map(serviceArea => {
      return serviceArea.serviceRegion
    })
    let routes = serviceAreaList.map(serviceArea => {
      return serviceArea.routes
    })

    // 最近设施分析
    let facilityPathList = await closestFacilitiesAnalyst(resultLayer._latlng, serviceAreaLatlng)
    let facilitiesLayer = getDeliveryRoute(facilityPathList)
    // console.log(facilities)
    MyCustomMap.editableLayers.addLayer(facilitiesLayer).addTo(MyCustomMap.map)
    // MyCustomMap.editableLayers.addLayer(L.featureGroup(facilitiesRoute)).addTo(MyCustomMap.map)
    MyCustomMap.editableLayers.addLayer(L.geoJSON(serviceRegion)).addTo(MyCustomMap.map)
    MyCustomMap.editableLayers.addLayer(L.geoJSON(routes)).addTo(MyCustomMap.map)
    // MyCustomMap.editableLayers.addLayer(featureGroup).addTo(MyCustomMap.map)
    fullscreenLoading.value = false
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: function (feature, latlng) {
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

  const showShopList = data => {
    MyCustomMap.shopData = data
    listLoading.value = false
  }

  const formatShopData = async features => {
    console.log(features)
    MyCustomMap.shopData = await Promise.resolve(
      features.features.map(feature => {
        return { ...feature.properties }
      })
    )
  }

  const flyTOAim = row => {
    // console.log(row)
    MyCustomMap.map.flyTo(row, 14)
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
              @listLoading="
                status => {
                  listLoading = status
                }
              "
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
              :map="MyCustomMap.map"
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
      <div class="serviceareabar">
        <ServiceRegion v-if="MyCustomMap.map" :map="MyCustomMap.map"></ServiceRegion>
      </div>
      <!-- <div class="showheat">
        <el-button @click="showHotMap"></el-button>
      </div> -->
    </div>
    <MapContainer
      v-loading.fullscreen.lock="!MyCustomMap.map"
      element-loading-text="地图加载中"
      @map-created="mapInit"
      style="position: absolute"
    >
    </MapContainer>
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
      margin: 30px 10px 10px 0;
      z-index: 5;
      .el-button {
        width: 50px;
      }
    }
    .querybar {
      position: absolute;
      left: 0;
      margin: 30px 0 0 10px;
      z-index: 5;
    }
    .store-list {
      position: absolute;
      width: 400px;
      margin: 0 10px;
      top: 200px;
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
      right: 300px;
      top: 300px;
      z-index: 5;
    }
    .serviceareabar {
      position: absolute;
      margin: 0 10px;
      right: 100px;
      top: 200px;
      z-index: 5;
    }
  }
</style>
