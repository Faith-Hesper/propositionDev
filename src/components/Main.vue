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
  // let map=null, editableLayers=null

  // 框选查询
  async function rectangleSearch() {
    await startSearch(map.value, editableLayers.value, "rectangle")
  }

  // 几何多边形查询
  async function polygonSearch() {
    await startSearch(map.value, editableLayers.value, "polygon")
  }
  const getShops = layer => {
    console.log(layer)
    console.log(map.value)
    fullscreenLoading.value = false
    layer.addTo(map.value)
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
    console.log("object")
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
</style>
