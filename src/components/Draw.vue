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
    <div v-if="cancel" class="markertip">右键取消</div>
  </div>
</template>

<script setup>
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { onUnmounted, ref, reactive } from "vue"
  import { eventIcon } from "@/utils/map.js"
  const props = defineProps({
    map: { type: Object, default: () => null },
    drawBtns: { type: Array, required: true, default: [] },
    options: { type: Object, default: null },
  })
  const emits = defineEmits(["drawResultLayer"])
  const cancel = ref(false)
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
    marker: {
      icon: eventIcon,
    },
  }

  Object.assign(options, props.options)

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
        if (draw.type === "marker") {
          cancel.value = false
        }
        index = 0
        props.map.off("draw:drawstop")
      }
    })
    props.map.on("contextmenu", () => {
      // props.map.off("draw:markercontext")
      if (draw.type === "marker") {
        cancel.value = false
      }
      draw.drawControl.disable()
    })
  }

  function drawEvent(type) {
    if (type === "marker") {
      cancel.value = true
    }
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
        draw.drawControl = new L.Draw.Marker(props.map, options.marker)
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
  .markertip {
    position: fixed;
    z-index: 5;
    top: 80px;
    left: 50%;
    font-size: 16px;
  }
  .draw-btn {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: end;
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
