<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import DrawMap from "@/components/DrawMap"
  import DrawMapBtn from "@/components/DrawMapBtn"
  import { mapControl, searchByBounds, searchByGeometry } from "@/utils/map.js"
  import { nextTick, onMounted, reactive, ref } from "vue"

  const fullscreenLoading = ref(false)
  const show = ref(true)
  const url = "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap"
  const drawBtns = [
    {
      id: 0,
      btnName: "框选",
      btnType: "rectangle",
    },
    {
      id: 1,
      btnName: "多边形",
      btnType: "polygon",
    },
    {
      id: 2,
      btnName: "marker",
      btnType: "marker",
    },
  ]

  const MyCustomMap = reactive({
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

    let layers = L.geoJSON(features, {
      pointToLayer: function (point, latlng) {
        return L.marker(latlng).bindPopup(`
  <div class="shop">
  <p>店名：${point.properties.NAME}</p>
  <p>品类：${point.properties.CATEGORY}</p>
  <p>价格：${point.properties.PRICE}元/kg</p>
  </div>
  `)
      },
    })

    fullscreenLoading.value = false
    MyCustomMap.map.flyTo(L.latLng(features.features[0].geometry.coordinates.reverse()), 12)
    MyCustomMap.editableLayers.addLayer(layers)
    MyCustomMap.editableLayers.addTo(MyCustomMap.map)
  }

  const drawLayer = resultLayer => {
    show.value = true
    MyCustomMap.map.doubleClickZoom.enable()
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
  }

  const rectangleLayer = async resultLayer => {
    // show.value = true
    // MyCustomMap.map.doubleClickZoom.enable()

    // MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    console.log(resultLayer._bounds)
    let features = await searchByBounds(resultLayer._bounds)
    let layer = L.geoJSON(features, {
      onEachFeature: function (feature, layer) {
        // console.log(feature.properties);
        layer.bindPopup(feature.properties.NAME)
      },
    })
    MyCustomMap.editableLayers.addLayer(layer)
  }
  const polygonLayer = async resultLayer => {
    // MyCustomMap.map.doubleClickZoom.enable()
    // MyCustomMap.map.off("draw:drawstop")
    // MyCustomMap.map.off("dblclick")
    // MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
    let features = await searchByGeometry(resultLayer._latlngs)
    let layer = L.geoJSON(features, {
      onEachFeature: function (feature, layer) {
        // console.log(feature.properties);
        layer.bindPopup(feature.properties.NAME)
      },
    })
    MyCustomMap.editableLayers.addLayer(layer)
  }
  const markerLayer = async resultLayer => {
    MyCustomMap.map.doubleClickZoom.enable()
    MyCustomMap.map.off("draw:drawstop")
    MyCustomMap.map.off("dblclick")
    MyCustomMap.editableLayers.addLayer(resultLayer).addTo(MyCustomMap.map)
  }

  const showdraw = () => {
    show.value = false
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
    <!-- <DrawMap v-if="MyCustomMap.map" :map="MyCustomMap.map" style="position: absolute"></DrawMap> -->
    <div class="drawBar">
      <div v-if="show" style="z-index: 5">
        <button @click="showdraw">展示</button>
      </div>
      <div v-else style="z-index: 5">
        <DrawMapBtn
          v-if="MyCustomMap.map"
          :map="MyCustomMap.map"
          :drawBtnName="drawBtns[0].btnName"
          :drawLayerType="drawBtns[0].btnType"
          @click="rectangleLayer"
          @drawResultLayer="drawLayer"
        ></DrawMapBtn>
        <DrawMapBtn
          v-if="MyCustomMap.map"
          :map="MyCustomMap.map"
          :drawBtnName="drawBtns[1].btnName"
          :drawLayerType="drawBtns[1].btnType"
          @click="polygonLayer"
          @drawResultLayer="drawLayer"
        ></DrawMapBtn>
        <DrawMapBtn
          v-if="MyCustomMap.map"
          :map="MyCustomMap.map"
          :drawBtnName="drawBtns[2].btnName"
          :drawLayerType="drawBtns[2].btnType"
          @drawResultLayer="markerLayer"
        ></DrawMapBtn>
      </div>
    </div>
    <MapContainer
      v-loading.fullscreen.lock="!MyCustomMap.map"
      element-loading-text="地图加载中"
      @map-created="mapInit"
      style="position: absolute"
    >
    </MapContainer>
    <!-- <div id="map" style="width: 800px; height: 600px;"></div> -->
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
    display: flex;
    position: relative;
    flex-direction: column;
    right: -88%;
    margin: 30px 10px 10px 0;
    width: 100px;
    align-items: flex-end;
  }
</style>
