<template>
  <div class="search">
    <el-autocomplete
      v-model="search"
      :fetch-suggestions="querySearch"
      @select="handleSelect"
      popper-class="tips"
      clearable
      placeholder="地区"
    >
    </el-autocomplete>
    <el-button type="primary" size="small" @click="shopSearch">搜索</el-button>
  </div>
</template>

<script setup>
import { searchBySql,getFieldsName } from '@/utils/map.js'
import { ref } from 'vue'
const emit = defineEmits(['shopDetail'])
const Shops = ref([])
const querySearch = (queryString, callback) => {
  // console.log(queryString)
  let result = queryString ? Shops.value.filter(createFilter(queryString))
  : Shops.value
  callback(result)
  console.log(Shops.value);
  console.log(result);
}

const createFilter = (queryString)=>{
  return(shopName)=>{
    return shopName.value.indexOf(queryString) != -1
  }
}

const handleSelect = ()=>{
  
}

const shopSearch = async () => {
  let fetures = await searchBySql()
  console.log(fetures)
  Shops.value = fetures.features.map((data)=> {return {value:data.properties.NAME,latlng:data.geometry.coordinates}})
  console.log(Shops.value);
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
  emit('shopDetail', resultlayer)
}
// const fields =async()=>{await getFieldsName()}
// console.log(fields());
</script>

<script>
export default {
  data() {
    return {
      search: '',
    }
  },
}
</script>

<style scoped>
.search {
  top: 0;
  left: 50%;
  /* width: 320px; */
  padding-bottom: 5px;
  display: flex;
  align-items: center;
}
.el-autocomplete {
  flex: 1;
}
.el-button {
  margin-left: 15px;
}
</style>
