<template>
  <div class="hotmap">
    <input type="checkbox" id="checkMap" @click="changeCheck" />
    <label for="checkMap">热力图</label>
  </div>
</template>

<script setup>
  import { onMounted, ref, watch } from "vue"
  import { cacheShopData, debounce } from "@/utils/tool.js"

  const props = defineProps({ map: { type: Object, default: () => null } })
  let check = ref(false)
  const featuresArr = ref()
  const heatMapLayer = ref(null)
  let Myfeatures = []

  const changeCheck = () => {
    check.value = check.value === true ? false : true
  }

  const showHotMap = () => {
    if (!featuresArr.value) {
      cacheShopData()
      let featuresData = localStorage.getItem("shopsFeatures")
      let geoFeature = JSON.parse(featuresData)
      Myfeatures = []
      Myfeatures.push(geoFeature)
    }

    if (heatMapLayer.value) {
      props.map.removeLayer(heatMapLayer.value)
      // heatMapLayer.value = null
    }

    heatMapLayer.value = new L.supermap.HeatMapLayer("heatMap", {
      id: "heatmap",
      map: props.map,
      radius: 50,
      // featureWeight: 100,
    })
    // console.log(Myfeatures)
    let geojson = Myfeatures[0]
    heatMapLayer.value.addFeatures(geojson)
    heatMapLayer.value.addTo(props.map)
    props.map.flyTo([30.67, 104.07], 12)
  }

  watch(
    check,
    debounce(newValue => {
      if (newValue) {
        if (!heatMapLayer.value) {
          showHotMap()
        } else {
          heatMapLayer.value.addTo(props.map)
        }
      } else {
        props.map.removeLayer(heatMapLayer.value)
      }
    }, 200)
  )

  onMounted(() => {
    featuresArr.value = localStorage.getItem("shopsFeatures")
    if (featuresArr.value) {
      let geoFeature = JSON.parse(featuresArr.value)
      Myfeatures.push(geoFeature)
    }
  })
</script>

<style lang="less" scoped>
  .hotmap {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: relative;
    height: 30px;
    padding: 0 5px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #fff;
    label {
      font-size: 12px;
      line-height: 24px;
    }
  }
  input::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    margin: -9px;
    cursor: pointer;
  }
</style>
