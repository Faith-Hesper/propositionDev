<template>
  <div class="service-region">
    <input type="checkbox" id="serviceMap" @click="changeCheck" />
    <label for="serviceMap">展示服务范围</label>
  </div>
</template>

<script setup>
  import { searchBySql, serviceAreaAnalyst } from "@/utils/map.js"
  import { arrFeatureToGeoJson, randomColor, cacheShopData, debounce } from "@/utils/tool.js"
  import { nextTick, onMounted, reactive, ref, shallowReactive, watch } from "vue"

  const props = defineProps({ map: { type: Object, default: () => null } })
  const serviceObject = shallowReactive({
    serviceLayer: null,
  })
  const check = ref(false)
  const changeCheck = () => {
    check.value = check.value === true ? false : true
  }
  let sqlParam = {
    fromIndex: 0,
    toIndex: 20,
  }
  const featuresArr = ref()
  let Myfeatures = []

  serviceObject.serviceLayer = L.featureGroup().addTo(props.map)

  const showSearviceRegion = async () => {
    if (!featuresArr.value) {
      cacheShopData()
      let featuresData = localStorage.getItem("shopsFeatures")
      let geoFeature = JSON.parse(featuresData)
      Myfeatures = []
      Myfeatures.push(geoFeature)
    }

    let serviceAreaArray = await getLatLngArr(Myfeatures[0])

    // 并发执行
    let analyst = serviceAreaArray.map(async arr => {
      // 服务区分析
      let serviceAreaList = await serviceAreaAnalyst([arr])
      let serviceRegion = await new Promise((resolve, reject) => {
        let result = serviceAreaList.map(serviceArea => {
          return serviceArea.serviceRegion
        })
        resolve(result)
      })
      let geoServiceRegion = await Promise.resolve(arrFeatureToGeoJson(serviceRegion))
      // let serviceRegionLayer =
      await new Promise((resolve, reject) => {
        let result = L.geoJSON(geoServiceRegion, {
          onEachFeature: (feature, layer) => {
            let color = randomColor()
            // console.log(color)
            // console.log(feature, layer)
            let serviceRegionLayer = L.geoJSON(feature.geometry, {
              style: () => {
                return { color: color }
              },
            })
            serviceObject.serviceLayer.addLayer(serviceRegionLayer)
            // console.log(a)
            // return
            // return { color: color, weight: 1 }
          },
        })
        resolve(result)
      })
      // .then(serviceRegionLayer => {
      // console.log(serviceRegionLayer)
      // serviceObject.serviceLayer.addLayer(serviceRegionLayer)
      // })
    })
    Promise.all(analyst)
    // })
    // resolve("")
    // })
  }

  // 坐标
  const getLatLngArr = async features => {
    return await new Promise((resolve, reject) => {
      let latlngArray = []
      // console.log(features)
      features.features.map(feature => {
        latlngArray.push(L.latLng(feature.geometry.coordinates.reverse()))
      })
      resolve(latlngArray)
    })
  }

  watch(
    check,
    debounce(newValue => {
      if (newValue) {
        if (serviceObject.serviceLayer.getLayers().length === 0) {
          showSearviceRegion()
        } else {
          serviceObject.serviceLayer.addTo(props.map)
        }
      } else {
        props.map.removeLayer(serviceObject.serviceLayer)
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
  .service-region {
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
    input::before {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      margin: -9px;
    }
  }
  .service-region:hover {
    cursor: pointer;
  }
</style>
