<template>
  <div id="map" style="width: 100%"></div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import mapObject, { mapControl, draw, startSearch } from '@/utils/map.js'

const url = 'http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap'
const map = ref(null)
const props = defineProps({
  crs: { type: String, default: 'EPSG4326' },
  control: { type: Boolean,default:true},
  baseLayers: { type: Array, default: () => [] },
  options: { type: Object, default: null },
})
const emit = defineEmits(['map-created'])

onMounted(() => {
  const { baseMapLayer, map_crs, ...option } = BASE_CONFIG
  const crs = typeof props.crs === 'string' ? L.CRS[props.crs] : L.CRS[map_crs]
  if (crs === undefined) throw new Error('不支持坐标系', props.crs)
  let layers = []
  if (props.baseLayers > 1) {
    layers = props.baseLayers
  } else {
    layers = baseMapLayer.map((layer) => L.supermap.tiandituTileLayer(layer))
  }
  const options = { layers, crs, ...option }
  Object.assign(options, props.options)
  map.value = L.map('map', options)
  // mapInit.map = await mapObject('map')
  // let control = mapControl(mapInit.map)
  props.control ? L.control.layers(layers).addTo(map.value) : null
  layers.forEach(layer => map.value.addLayer(layer));
  L.supermap
    .tiledMapLayer(url, {
      cacheEnabled: true,
      transparent: true,
      opacity: 0.7,
    })
    .addTo(map.value)
  emit('map-created', map.value)
  // let editableLayers = draw(map.value)
})
</script>

<style scoped>
#map {
  height: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
}
</style>
