<template>
  <div id="map" style="width: 100%"></div>
</template>

<script setup>
  import { reactive, ref, onMounted } from "vue"
  import { SuperMap, tiandituTileLayer } from "@supermap/iclient-leaflet"

  const url = "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap"
  const map = ref(null)
  const props = defineProps({
    crs: { type: String, default: "EPSG4326" },
    control: { type: Boolean, default: true },
    baseLayers: { type: Array, default: () => [] },
    options: { type: Object, default: null },
  })
  const emit = defineEmits(["map-created"])

  onMounted(() => {
    const { baseMapLayer, map_crs, ...option } = BASE_CONFIG
    const crs = typeof props.crs === "string" ? L.CRS[props.crs] : L.CRS[map_crs]
    if (crs === undefined) throw new Error("不支持坐标系", props.crs)
    let layers = []
    if (props.baseLayers > 1) {
      layers = props.baseLayers
    } else {
      layers = baseMapLayer.map(layer => new L.supermap.tiandituTileLayer(layer))
    }
    const options = { layers, crs, ...option }
    // 将传入的options 复制到 options中
    Object.assign(options, props.options)
    map.value = L.map("map", options)
    let baselayer = {
      "中国地图": L.featureGroup(layers).addTo(map.value),
    }
    let overlayer = L.featureGroup()
    layers.map(layer => map.value.addLayer(layer))
    props.control
      ? L.control
          .layers(baselayer, { "drawlayer": overlayer }, { position: "topright", collapsed: true })
          .addTo(map.value)
      : null
    // L.control.layers(baselayer).addTo(map.value)
    emit("map-created", map.value)
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
  .leaflet-control-layers-list {
    position: absolute;
  }
</style>
