<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import DrawMap from "@/components/DrawMap"
  import { mapControl } from "@/utils/map.js"
  import { nextTick, onMounted, reactive, ref } from "vue"

  defineProps({
    msg: String,
  })

  const fullscreenLoading = ref(false)
  const url = "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap"
  const MyCustomMap = reactive({
    map: null,
    control: null,
    editableLayers: null,
  })

  MyCustomMap.editableLayers = L.featureGroup()

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
    <div id="toolbar">
      <Search @shopDetail="getShops"></Search>
    </div>
    <DrawMap v-if="MyCustomMap.map" :map="MyCustomMap.map" style="position: absolute"></DrawMap>
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
  #toolbar {
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
  /* .draw-box {
    /* width: 200px;
  } */
  .button {
    margin-top: 50px;
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-content: center;
    align-items: center;
  }
  .el-button {
    width: 40px;
    margin-left: 0;
    margin-bottom: 3px;
  }
</style>
