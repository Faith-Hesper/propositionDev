<script setup>
import mapObject, { mapControl, draw, startSearch } from '@/utils/map.js'
import { onMounted, ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
const url = 'http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap'
let map, editableLayers

// 框选查询
async function rectangleSearch() {
  startSearch(map, editableLayers, 'rectangle')
}

// 几何多边形查询
async function polygonSearch() {
  startSearch(map, editableLayers, 'polygon')
}

onMounted(async () => {
  map = await mapObject('map')
  let control = mapControl(map)
  L.supermap
    .tiledMapLayer(url, {
      cacheEnabled: true,
      transparent: true,
      opacity: 0.7,
    })
    .addTo(map)
  editableLayers = draw(map)
})
</script>

<template>
  <div id="toolbar">
    <el-card>
      <el-button type="primary" @click="rectangleSearch">框选</el-button>
      <el-button type="primary" @click="polygonSearch">多边形</el-button>
    </el-card>
  </div>
  <div id="map" style="width: 1000px; height: 600px"></div>
</template>

<style scoped>
#toolbar {
  position: relative;
  top: 150px;
  left: 60%;
  width: 100px;
  text-align: center;
  z-index: 500;
  border-radius: 4px;
}
</style>
