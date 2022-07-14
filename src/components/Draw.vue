<template>
  <div class="draw-btn">
    <el-button
      v-for="draw in drawBtns"
      :key="draw.id"
      plain
      size="small"
      @click="drawEvent(draw.type)"
      >{{ draw.name }}</el-button
    >
  </div>
</template>

<script setup>
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { onUnmounted, reactive } from "vue"
  const props = defineProps({
    map: { type: Object, default: () => null },
    drawBtns: { type: Array, required: true, default: [] },
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

  let index = 0
  function watchDraw() {
    // 监听绘制事件 vue3Proxy原因
    props.map.on("draw:created", drawCallBack)
    props.map.on("draw:drawstop", () => {
      if (index) {
        // 取消前面 绘制、dbclick事件监听
        props.map.off("draw:created", drawCallBack)
        props.map.off("dblclick", complete)
        // props.map.off("draw:drawstop")
        draw.drawControl.disable()
        emitLayer(draw.type, draw.editableLayers)
        index = 0
        props.map.off("draw:drawstop")
      }
    })
  }

  function drawEvent(type) {
    // draw.drawControl = this.enableDraw(type)
    watchDraw()
    enableDraw(type)
    draw.drawControl.enable()
    draw.type = type
    if (type === "polygon") {
      props.map.on("dblclick", complete)
    }
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
    index++
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
</script>

<style lang="less" scoped>
  .draw-btn {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: space-around;
    align-content: space-around;
    flex-wrap: wrap;
    right: 0;
    z-index: 5;
    .el-button {
      margin: 0;
      border-radius: 5px;
    }
  }
</style>
