<template>
  <div class="search">
    <el-autocomplete
      v-model="search"
      :fetch-suggestions="querySearch"
      @select="handleSelect"
      @keyup.native.enter="shopSearch"
      popper-class="tips"
      clearable
      placeholder="地区"
    >
    </el-autocomplete>
    <el-button type="primary" size="small" @click="shopSearch">搜索</el-button>
  </div>
</template>

<script setup>
  import { searchBySql, getFieldsName } from "@/utils/map.js"
  import { ref, onMounted } from "vue"
  const emit = defineEmits(["shopDetail"])
  const Shops = ref([])
  const search = ref("")
  const querySearch = (queryString, callback) => {
    // console.log(queryString)
    let result = queryString ? Shops.value.filter(createFilter(queryString)) : Shops.value
    callback(result)
    console.log(Shops.value)
    console.log(result)
  }

  const createFilter = queryString => {
    return shopName => {
      return shopName.value.indexOf(queryString) != -1
    }
  }

  const handleSelect = item => {
    console.log(item)
  }

  const shopSearch = async () => {
    if (!search.value) return
    let fetures = getShops()
    console.log(Shops.value)
    let resultlayer = L.geoJSON(fetures, {
      pointToLayer: function (point, latlng) {
        // console.log(point, latlng)
        return L.marker(latlng).bindPopup(`
  <div class="shop">
  <p>店名：${point.properties.NAME}</p>
  <p>品类：${point.properties.品类}</p>
  <p>价格元KG：${point.properties.价格元KG}</p>
  </div>
  `)
      },
    })
    emit("shopDetail", resultlayer)
  }

  // 获取商店数据
  const getShops = async () => {
    let fetures = await searchBySql().catch(err => console.log(err))
    // console.log(fetures)
    Shops.value = fetures.features.map(data => {
      return { value: data.properties.NAME, latlng: data.geometry.coordinates }
    })
    return fetures
  }

  onMounted(() => {
    getShops()
  })
  // const fields =async()=>{await getFieldsName()}
  // console.log(fields());
</script>

<style lang="less" scoped>
  .search {
    top: 0;
    // left: 50%;
    /* width: 320px; */
    margin-right: 200px;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    .el-autocomplete {
      flex: 1;
    }
    .el-button {
      margin-left: 15px;
    }
  }
</style>
