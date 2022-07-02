<template>
  <div class="draw-btn">
    <el-button plain size="small" @click="rectangleSearch">框选</el-button>
    <el-button plain size="small" @click="polygonSearch">多边形</el-button>
    <el-button plain size="small" @click="rectangleSearch">画圆</el-button>
  </div>
</template>

<script>
  // import * as L from 'leaflet'
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { mapControl, draw, startSearch, getSearchLayer } from "@/utils/map.js"
  export default {
    props: {
      map: { type: Object, default: () => null },
    },
    data() {
      return {
        editableLayers: null,
        drawControl: null,
        drawlayer: null,
      }
    },
    methods: {},
    created() {
      // console.log(this.map)
      this.editableLayers = new L.featureGroup()
      this.map.addLayer(this.editableLayers)
      // this.drawControl = new L.Control.Draw({
      //   position: "topright",
      //   draw: {
      //     rectangle: true,
      //     polygon: true,
      //     polyline: false,
      //     marker: false,
      //     circle: false,
      //     circlemarker: false,
      //   },
      // })
      // var tooltip = new L.Draw.Tooltip(this.map)
      // console.log(tooltip)
      // this.map.addControl(this.drawControl)
      this.map.on("draw:created", this.drawCallBack)
      this.map.on("draw:drawstop", e => {
        // 取消前面 绘制、dbclick事件监听
        this.map.off("draw:drawstart")
        console.log(this.drawlayer)
        getSearchLayer(this.drawlayer).then(layer => layer.addTo(this.map))
        this.map.off("dblclick")
        this.drawControl.disable()
        // 开启双击 zoomin
        this.map.doubleClickZoom.enable()
      })
    },
    methods: {
      async rectangleSearch() {
        // let a = new L.Draw.Rectangle(this.map, { metric: false })
        this.enableDraw("rectangle")
        this.drawControl.enable()
        // await startSearch(this.map, this.editableLayers, "rectangle")
      },
      async polygonSearch() {
        // await startSearch(this.map, this.editableLayers, "polygon")
        this.enableDraw("polygon")
        this.map.doubleClickZoom.disable()

        this.drawControl.enable()
        this.map.on("dblclick", e => {
          // 双击完成多边形绘制
          this.drawControl.completeShape()
        })
      },
      enableDraw(type) {
        switch (type) {
          case "rectangle":
            this.drawControl = new L.Draw.Rectangle(this.map, {
              metric: false,
              showArea: false,
              shapeOptions: {
                stroke: true,
                color: "#0000FF",
                weight: 4,
                opacity: 0.5,
                fill: true,
                fillColor: null, //same as color by default
                fillOpacity: 0.2,
                clickable: true,
              },
            })
            break
          case "polygon":
            this.drawControl = new L.Draw.Polygon(this.map)
            break
          case "circle":
            this.drawControl = new L.Draw.Circle(this.map)
            break
          default:
            break
        }
      },
      drawCallBack(e) {
        this.drawlayer = { type: e.layerType, layer: e.layer }
        this.editableLayers.addLayer(e.layer)
        // console.log(e.layer)
        // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
        this.map.doubleClickZoom.disable()
        // 取消前面dbclick事件监听
        // this.map.off("dblclick")
        this.map.on("dblclick", e => {
          // 双击完成多边形绘制
          this.drawControl.completeShape()
        })
      },
    },

    beforeUnmount() {
      this.map.off("draw:drawstop")
      this.map.doubleClickZoom.enable()
      this.map.removeLayer(this.editableLayers)
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
  .leaflet-draw-draw-polygon {
    background-image: none;
  }
</style>
