<template>
  <div class="service-region">
    <div class="analystbtn">
      <!-- <div class="title">查询范围内商店</div> -->
      <el-button @click="showSearviceRegion">展示服务范围</el-button>
      <el-button @click="showHotMap">隐藏</el-button>
    </div>
  </div>
</template>

<script setup>
  import { searchBySql, serviceAreaAnalyst } from "@/utils/map.js"
  import { arrFeatureToGeoJson, randomColor, cacheShopData } from "@/utils/tool.js"
  import { nextTick, onMounted, reactive, ref, shallowReactive } from "vue"

  const props = defineProps({ map: { type: Object, default: () => null } })
  const serviceObject = reactive({
    serviceLayer: null,
  })
  let sqlParam = {
    fromIndex: 0,
    toIndex: 20,
  }
  let Myfeatures = []

  serviceObject.serviceLayer = L.featureGroup().addTo(props.map)

  const showSearviceRegion = async () => {
    if (!featuresArr) {
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
            console.log(color)
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

  const showHotMap = async () => {
    if (!featuresArr) {
      // let { totalCount, features } = await searchBySql("", {
      //   fromIndex: 0,
      //   toIndex: 155,
      // })
      // console.log("获取数据")
      // Myfeatures.push(features)
      cacheShopData()
      let featuresData = localStorage.getItem("shopsFeatures")
      let geoFeature = JSON.parse(featuresData)
      Myfeatures = []
      Myfeatures.push(geoFeature)
    }
    let heatMapLayer = new L.supermap.HeatMapLayer("heatMap", {
      id: "heatmap",
      map: props.map,
      radius: 50,
      // featureWeight: 100,
    })
    console.log(Myfeatures)
    let geojson = Myfeatures[0]
    heatMapLayer.addFeatures(geojson)
    heatMapLayer.addTo(props.map)
    props.map.flyTo([30.67, 104.07], 12)
  }

  const featuresArr = localStorage.getItem("shopsFeatures")
  if (featuresArr) {
    let geoFeature = JSON.parse(featuresArr)
    Myfeatures.push(geoFeature)
  }
</script>

<style lang="less" scoped>
  .service-region {
    width: 250px;
    .title {
      width: 100%;
      font-size: 14px;
      font-weight: bold;
      color: grey;
      background: #e4eef6;
    }
    /deep/ .el-form-item__content {
      justify-content: center;
    }
    .analystbtn {
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-content: space-around;
      .draw-btn {
        flex-direction: row;
        .el-button {
          width: 20px;
        }
      }
    }
  }
</style>
