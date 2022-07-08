<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import DrawMap from "@/components/DrawMap"
  import DrawMapBtn from "@/components/DrawMapBtn"
  import { searchByBounds, searchByGeometry } from "@/utils/map.js"
  import { nextTick, onMounted, reactive, ref, shallowReactive } from "vue"

  const fullscreenLoading = ref(false)
  const show = ref(true)
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
  })

  MyCustomMap.editableLayers = L.featureGroup()

  // 添加图层切换控件
  const mapInit = mapObject => {
    MyCustomMap.map = mapObject.map

    let overlayer = L.supermap
      .tiledMapLayer(url, {
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
    MyCustomMap.editableLayers.clearLayers()

    let layers = geoJsonBind(features)

    fullscreenLoading.value = false
    MyCustomMap.map.flyTo(L.latLng(features.features[0].geometry.coordinates.reverse()), 12)
    MyCustomMap.editableLayers.addLayer(layers)
    MyCustomMap.editableLayers.addTo(MyCustomMap.map)
  }

  const drawLayer = resultLayer => {
    show.value = true
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
  }

  // 框选查询
  const rectangleLayer = async resultLayer => {
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    // console.log(resultLayer._bounds)
    let features = await searchByBounds(resultLayer._bounds)
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
  }

  // 多边形查询
  const polygonLayer = async resultLayer => {
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    // console.log(resultLayer)
    let features = await searchByGeometry(L.polygon(resultLayer._latlngs))
    let layer = geoJsonBind(features)
    MyCustomMap.editableLayers.addLayer(layer)
  }

  const markerLayer = async resultLayer => {
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
  }

  const geoJsonBind = features => {
    return L.geoJSON(features, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng).bindPopup(`
  <div class="shop">
  <p>店名：${feature.properties.NAME}</p>
  <p>品类：${feature.properties.CATEGORY}</p>
  <p>价格：${feature.properties.PRICE}元/kg</p>
  </div>
  `)
      },
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
      <Search @shopDetail="getShops"></Search>
    </div>
    <div class="drawBar">
      <DrawMapBtn
        v-if="MyCustomMap.map"
        :map="MyCustomMap.map"
        @rectangleLayer="rectangleLayer"
        @polygonLayer="polygonLayer"
        @markerLayer="markerLayer"
      ></DrawMapBtn>
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

<style scoped>
  .main {
    width: 100%;
    height: 700px;
  }
  .toolbar {
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
  .drawBar {
    position: absolute;
    right: 0;
    margin: 30px 0 10px 0;
    z-index: 5;
  }
</style>
