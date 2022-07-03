<template>
  <div class="draw-btn">
    <el-button plain size="small" @click="rectangleSearch">框选</el-button>
    <el-button plain size="small" @click="polygonSearch">多边形</el-button>
    <el-button plain size="small" @click="rectangleSearch">画圆</el-button>
  </div>
</template>

<script setup>
  // import * as L from 'leaflet'
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { getSearchLayer } from "@/utils/map.js"
  import { onUnmounted, reactive } from "vue"
  const props = defineProps({
    map: { type: Object, default: () => null },
  })
  const draw = reactive({
    editableLayers: null,
    drawControl: null,
    drawlayer: null,
  })

  const options = {
    polygon: {
      allowIntersection: false, // Restricts shapes to simple polygons
      drawError: {
        color: "#e1e100", // Color the shape will turn when intersects
        message: "<strong>Oh snap!<strong> you can't draw that!", // Message that will show when intersect
      },
      shapeOptions: {
        color: "#bada55",
      },
    },
    rectangle: {
      metric: false,
      showArea: false,
      shapeOptions: {
        stroke: true,
        color: "#0000FF",
        weight: 4,
        opacity: 0.5,
        fill: true,
        fillColor: null,
        fillOpacity: 0.2,
        clickable: true,
      },
    },
  }

  // 新建绘制图层
  draw.editableLayers = new L.featureGroup()
  // 将图层添加到map对象中
  props.map.addLayer(draw.editableLayers)
  // 监听绘制事件
  props.map.on("draw:created", drawCallBack)
  props.map.on("draw:drawstop", () => {
    // 取消前面 绘制、dbclick事件监听
    props.map.off("draw:drawstart")
    console.log(draw.drawlayer)
    // 查询图层中商店
    getSearchLayer(draw.drawlayer).then(layer => draw.editableLayers.addLayer(layer))
    props.map.off("dblclick")
    draw.drawControl.disable()
    // 开启双击 zoomin
    props.map.doubleClickZoom.enable()
  })

  // draw 开启对应绘制
  const enableDraw = type => {
    switch (type) {
      case "rectangle":
        draw.drawControl = new L.Draw.Rectangle(props.map, options.rectangle)
        break
      case "polygon":
        draw.drawControl = new L.Draw.Polygon(props.map, options.polygon)
        break
      case "circle":
        draw.drawControl = new L.Draw.Circle(props.map)
        break
      default:
        break
    }
  }

  // 框选查询
  async function rectangleSearch() {
    // leaflet.draw 坑点：必须先创建 draw对应对象再 enable 否则报 ._tooltip is null
    enableDraw("rectangle")
    draw.drawControl.enable()
  }

  // 多边形查询
  async function polygonSearch() {
    enableDraw("polygon")
    props.map.doubleClickZoom.disable()

    draw.drawControl.enable()
    props.map.on("dblclick", e => {
      // 双击完成多边形绘制
      draw.drawControl.completeShape()
    })
  }

  // 将绘制的图层添加到绘制图层中，并保存图层信息
  function drawCallBack(e) {
    draw.drawlayer = { type: e.layerType, layer: e.layer }
    draw.editableLayers.addLayer(e.layer)
    // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
    props.map.on("dblclick", () => {
      // 双击完成多边形绘制
      draw.drawControl.completeShape()
    })
  }

  onUnmounted(() => {
    props.map.off("draw:drawstop")
    props.map.doubleClickZoom.enable()
    props.map.removeLayer(draw.editableLayers)
  })
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
    border-radius: 5px;
  }
</style>

/* TODo: 点击popup关闭后，改变zoom报 Uncaught TypeError: this._map is null * */
