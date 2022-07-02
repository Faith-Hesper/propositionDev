<template>
  <div class="draw-btn">
    <el-button plain size="small" @click="rectangleSearch">框选</el-button>
    <el-button plain size="small" @click="polygonSearch">多边形</el-button>
    <el-button plain size="small" @click="rectangleSearch">框选</el-button>
  </div>
</template>

<script>
  // import * as L from 'leaflet'
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { mapControl, draw, startSearch } from "@/utils/map.js"
  export default {
    props: {
      map: { type: Object, default: () => null },
    },
    data() {
      return {
        editableLayers: null,
        drawControl: null,
      }
    },
    methods: {},
    created() {
      console.log(this.map)
      this.editableLayers = new L.featureGroup().addTo(this.map)
      this.drawControl = new L.Control.Draw({
        draw: {
          polygon: false,
          poliline: false,
        },
      })
      var tooltip = new L.Draw.Tooltip(this.map)
      console.log(tooltip)
      this.map.addControl(this.drawControl)
      this.map.on("draw:created", this.drawCallBack)
      this.map.on("draw:drawstop", this.drawCallBack)
    },
    methods: {
      async rectangleSearch() {
        let a = new L.Draw.Rectangle(this.map, { metric: false }).enable()
        console.log(a)
        // await startSearch(this.map, this.editableLayers, "rectangle")
        new L.Draw.Rectangle(this.map).disable()
      },
      async polygonSearch() {
        await startSearch(this.map, this.editableLayers, "polygon")
        new L.Draw.Polygon(map).disable()
      },
      drawCallBack(e) {
        this.editableLayers.addLayer(e.layer)
        // console.log(e.layer)
        // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
        this.map.off("dblclick")
        this.map.off("draw:drawstart")
        // e.layer.addTo(this.)
        // let layer = { type: e.layerType, layer: e.layer }
        // getSearchLayer(layer)
        // e.layer.bindPopup("11")
      },
    },
  }
</script>

<style scoped>
  .draw-btn {
    display: inline-flex;
    flex-direction: column;
    margin: 40px 10px 10px 0;
    right: 0;
    z-index: 5;
  }
  .el-button {
    width: 48px;
    margin: 2px 0;
  }
</style>
