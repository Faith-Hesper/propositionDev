<template>
  <div class="service-region">
    <div class="box-body">
      <div class="analystbtn">
        <!-- <div class="title">查询范围内商店</div> -->
        <el-button @click="showSearviceRegion">展示服务范围</el-button>
        <el-button @click="showHotMap">隐藏</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { searchBySql, serviceAreaAnalyst } from "@/utils/map.js"
  import { arrFeatureToGeoJson, randomColor } from "@/utils/tool.js"
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
    let { totalCount, features } = await searchBySql("", {
      fromIndex: sqlParam.fromIndex,
      toIndex: sqlParam.toIndex,
    })
    if (sqlParam.toIndex + 1 < totalCount) {
      sqlParam.fromIndex = sqlParam.toIndex + 1
      sqlParam.toIndex += 19
      setTimeout(() => {
        showSearviceRegion()
      }, 3000)
    }
    let serviceAreaArray = await getLatLngArr(features)
    // 服务区分析
    let serviceAreaList = await serviceAreaAnalyst(serviceAreaArray)
    let serviceRegion = serviceAreaList.map(serviceArea => {
      return serviceArea.serviceRegion
    })
    let geoServiceRegion = arrFeatureToGeoJson(serviceRegion)
    let serviceRegionLayer = await new Promise((resolve, reject) => {
      return L.geoJSON(geoServiceRegion, {
        style: () => {
          let color = randomColor()
          return { color: color, weight: 1 }
        },
      })
    })
    console.log(serviceRegionLayer)
    serviceObject.serviceLayer.addLayer(serviceRegionLayer)
  }

  const getLatLngArr = async features => {
    return await new Promise((resolve, reject) => {
      let latlngArray = []
      // console.log(feature)
      features.features.map(feature => {
        latlngArray.push(L.latLng(feature.geometry.coordinates.reverse()))
      })
      resolve(latlngArray)
    })
  }

  const showHotMap = async () => {
    let { totalCount, features } = await searchBySql("", {
      fromIndex: 0,
      toIndex: 155,
    })
    Myfeatures.push(features)
    let heatMapLayer = new L.supermap.HeatMapLayer("heatMap", {
      id: "heatmap",
      map: props.map,
      radius: 10,
      featureWeight: 10,
    })
    console.log(...Myfeatures)
    let geojson = Myfeatures[0]
    heatMapLayer.addFeatures(geojson)
    heatMapLayer.addTo(props.map)
  }
</script>

<style lang="less" scoped>
  .service-region {
    width: 250px;
    .box-body {
      width: 100%;
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
  }
</style>
