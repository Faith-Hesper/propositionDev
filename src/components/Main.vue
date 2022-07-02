<script setup>
  import MapContainer from "@/components/MapContainer"
  import Search from "@/components/Search"
  import DrawMap from "@/components/DrawMap"
  import { mapControl, draw, startSearch } from "@/utils/map.js"
  import { nextTick, onMounted, reactive, ref } from "vue"

  defineProps({
    msg: String,
  })

  const fullscreenLoading = ref(false)
  const url = "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap"
  const map = ref(null)
  const editableLayers = ref(null)
  editableLayers.value = L.featureGroup()
  // let map=null, editableLayers=null

  // 框选查询
  async function rectangleSearch() {
    await startSearch(map.value, editableLayers.value, "rectangle")
  }

  // 几何多边形查询
  async function polygonSearch() {
    await startSearch(map.value, editableLayers.value, "polygon")
  }

  const getShops = features => {
    editableLayers.value.clearLayers()

    editableLayers.value = L.geoJSON(features, {
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

    map.value.flyTo(L.latLng(features.features[0].geometry.coordinates.reverse()), 12)
    fullscreenLoading.value = false
    editableLayers.value.addTo(map.value)
  }
  const mapInit = mapObject => {
    map.value = mapObject
    // console.log(map..value);
    L.supermap
      .tiledMapLayer(url, {
        cacheEnabled: true,
        transparent: true,
        opacity: 0.7,
      })
      .addTo(map.value)
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
    <draw-map
      v-loading.fullscreen.lock="!map"
      element-loading-text="地图加载中"
      v-if="map"
      :map="map"
      style="position: absolute"
    ></draw-map>
    <map-container @map-created="mapInit" style="position: absolute"></map-container>
    <!-- <div id="map" style="width: 800px; height: 600px;"></div> -->
  </div>
</template>

<style scoped>
  .main {
    width: 100%;
    height: 600px;
  }
  #toolbar {
    position: relative;
    display: flex;
    right: 0;
    flex-direction: column;
    padding: 0 5px;
    align-items: flex-end;
    text-align: center;
    z-index: 5;
    border-radius: 4px;
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
  .leaflet-draw-draw-polygon {
    background-image: none;
  }
</style>
