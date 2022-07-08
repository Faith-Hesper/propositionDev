<template>
  <div class="draw-btn">
    <el-button plain size="small" @click="rectangleSearch">框选</el-button>
    <el-button plain size="small" @click="polygonSearch">多边形</el-button>
    <el-button plain size="small" @click="markerSearch">标记</el-button>
  </div>
</template>

<script setup>
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { onUnmounted, reactive } from "vue"
  const props = defineProps({
    map: { type: Object, default: () => null },
  })
  const emits = defineEmits(["drawResultLayer"])
  const draw = reactive({
    editableLayers: null,
    drawControl: null,
    type: "",
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

  // 监听绘制事件 vue3Proxy原因
  props.map.on("draw:created", drawCallBack)
  props.map.on("draw:drawstop", () => {
    // 取消前面 绘制、dbclick事件监听
    props.map.off("draw:drawstart", drawCallBack)
    props.map.off("dblclick", complete)
    // props.map.off("draw:drawstop")
    draw.drawControl.disable()
    emitLayer(draw.type, draw.editableLayers)
  })

  // 框选查询
  function rectangleSearch() {
    // leaflet.draw 坑点：必须先创建 draw对应对象再 enable 否则报 ._tooltip is null
    enableDraw("rectangle")
    draw.drawControl.enable()
  }

  // 多边形查询
  function polygonSearch() {
    enableDraw("polygon")
    props.map.on("dblclick", complete)
    draw.drawControl.enable()
  }

  function markerSearch() {
    enableDraw("marker")
    draw.drawControl.enable()
  }

  // draw 开启对应绘制
  const enableDraw = type => {
    switch (type) {
      case "rectangle":
        draw.drawControl = new L.Draw.Rectangle(props.map, options.rectangle)
        break
      case "polygon":
        draw.drawControl = new L.Draw.Polygon(props.map, options.polygon)
        break
      case "marker":
        draw.drawControl = new L.Draw.Marker(props.map)
        break
      default:
        break
    }
  }

  // 将绘制的图层添加到绘制图层中，并保存图层信息
  function drawCallBack(e) {
    draw.type = e.layerType
    draw.editableLayers = e.layer
    // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
  }

  // 双击完成绘制
  function complete(e) {
    draw.drawControl.completeShape()
  }

  // 发送绘制图层
  function emitLayer(type, editLayer) {
    switch (type) {
      case "rectangle":
        emits("rectangleLayer", editLayer)
        break
      case "polygon":
        emits("polygonLayer", editLayer)
        break
      case "marker":
        emits("markerLayer", editLayer)
        break
      default:
        break
    }
  }

  // onUnmounted(() => {
  //   props.map.off("draw:drawstop")
  //   props.map.doubleClickZoom.enable()
  //   props.map.removeLayer(draw.editableLayers)
  // })
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
