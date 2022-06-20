<script setup>
import MapContainer from '@/components/MapContainer'
import Search from '@/components/Search'
import { mapControl, draw, startSearch } from '@/utils/map.js'
import { nextTick, onMounted, reactive, ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
const url = 'http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap'
const map = ref({})
const editableLayers = ref({})
// let map=null, editableLayers=null

// 框选查询
async function rectangleSearch() {
  await startSearch(map.value, editableLayers.value, 'rectangle')
}

// 几何多边形查询
async function polygonSearch() {
  await startSearch(map.value, editableLayers.value, 'polygon')
}
const getShops = (layer) => {
  console.log(layer)
  layer.addTo(map.value)
}
const mapInit = (map) => {
  map.value = map
}
onMounted(() => {
  // map = await mapObject('map')
  // let control = mapControl(map)
  // L.supermap
  //   .tiledMapLayer(url, {
  //     cacheEnabled: true,
  //     transparent: true,
  //     opacity: 0.7,
  //   })
  //   .addTo(map)
  nextTick(()=>{

    editableLayers.value = draw(map.value)
  })
})
</script>

<template>
  <div class="main">
    <div id="toolbar">
      <Search @shopDetail="getShops"></Search>
      <!-- <el-card class="draw-box"> -->
        <div class="button">
          <el-button plain size="small" @click="rectangleSearch">框选</el-button>
          <el-button type="primary" size="small" @click="polygonSearch">多边形</el-button>
        </div>
      <!-- </el-card> -->
    </div>
    <map-container @map-created="mapInit" style="position:absolute"></map-container>
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
  z-index: 500;
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
.el-button{
  width: 40px;
  margin-left: 0;
  margin-bottom: 3px;
}
</style>
