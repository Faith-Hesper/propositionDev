<template>
  <div class="draw-btn">
    <el-button plain size="small" @click="drawBtn">{{ props.drawBtnName }}</el-button>
  </div>
</template>

<script setup>
  // import * as L from 'leaflet'
  import "leaflet-draw"
  import "@/utils/L.draw-local"
  import { onBeforeUpdate, onUnmounted, reactive } from "vue"

  const props = defineProps({
    map: { type: Object, default: () => null },
    drawBtnName: { type: String, required: true },
    drawLayerType: { type: String, required: true },
  })

  const emits = defineEmits(["drawResultLayer"])

  const draw = reactive({
    editableLayers: null,
    drawControl: null,
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
  // draw.editableLayers = new L.featureGroup()
  // 将图层添加到map对象中
  // props.map.addLayer(draw.editableLayers)
  // 监听绘制事件
  props.map.on("draw:created", drawCallBack)

  props.map.on("draw:drawstop", () => {
    // 取消前面 绘制、dbclick事件监听
    props.map.off("draw:drawstart")
    console.log("drawstop")
    props.map.off("dblclick")
    // 开启双击 zoomin
    props.map.doubleClickZoom.enable()

    emits("drawResultLayer", draw.editableLayers)
  })

  // draw 开启对应绘制 新建draw 对象
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

  // 框选查询
  async function drawBtn() {
    // leaflet.draw 坑点：必须先创建 draw对应对象再 enable 否则报 ._tooltip is null
    enableDraw(props.drawLayerType)
    draw.drawControl.enable()
    if (props.drawLayerType === "polygon") {
      props.map.doubleClickZoom.disable()
      props.map.on("dblclick", () => {
        // 双击完成多边形绘制
        draw.drawControl.completeShape()
      })
    }
  }

  // 将绘制的图层添加到绘制图层中，并保存图层信息
  function drawCallBack(e) {
    // draw.editableLayers.addLayer(e.layer)
    draw.editableLayers = e.layer
    // const bounds = L.Util.transform(e.layer._bounds,L.CRS.EPSG3857,L.CRS.EPSG4326)
  }

  onBeforeUpdate(() => {
    draw.drawControl.disable()
    props.map.off("draw:drawstop")
    props.map.off("dblclick")
    console.log("onUpdated")
    props.map.doubleClickZoom.enable()
    // props.map.removeLayer(draw.editableLayers)
  })

  onUnmounted(() => {
    // draw.drawControl.disable()
    props.map.off("draw:drawstop")
    props.map.off("dblclick")
    console.log("onUnmounted")
    props.map.doubleClickZoom.enable()
    // props.map.removeLayer(draw.editableLayers)
  })
</script>

<style scoped>
  .draw-btn {
    margin: 2px 0;
    width: 60px;
    z-index: 5;
  }
  .el-button {
    width: 100%;
    border-radius: 5px;
  }
</style>

/* TODo: 绘制控件 点击popup关闭后，改变zoom报 Uncaught TypeError: this._map is null * */
