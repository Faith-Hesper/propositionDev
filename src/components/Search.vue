<template>
  <div class="search">
    <el-autocomplete
      v-model.trim="shopName"
      :fetch-suggestions="querySearch"
      @select="handleSelect"
      @keyup.native.enter="shopSearch"
      @change="change"
      popper-class="tips"
      clearable
      placeholder="请输入店名"
    >
    </el-autocomplete>
    <el-button type="primary" size="small" @click="shopSearch">搜索</el-button>
  </div>
</template>

<script setup>
  import { searchBySql, getFieldsName } from "@/utils/map.js"
  import { ref } from "vue"
  const emit = defineEmits(["shopDetail"])

  const Shops = ref([])
  const shopName = ref("")
  const querySearch = (queryString, callback) => {
    getShops(shopName.value)
    let result = queryString ? Shops.value.filter(createFilter(queryString)) : Shops.value
    callback(result)
  }

  const createFilter = queryString => {
    return shopName => {
      return shopName.value.indexOf(queryString) != -1
    }
  }

  const handleSelect = item => {
    shopSearch()
  }

  const change = item => {
    console.log(item)
  }

  // 搜索商店信息
  const shopSearch = async () => {
    if (!shopName.value) return
    let fetures = await searchBySql(shopName.value, { toIndex: 30 })
    emit("shopDetail", fetures)
  }

  // 获取商店数据
  const getShops = async shops => {
    let fetures = await searchBySql(shops)
    // console.log(fetures)
    Shops.value = fetures.features.map(data => {
      return { value: data.properties.NAME, name: data.properties.NAME }
    })
  }

  getShops(shopName.value)

  // const fields =async()=>{await getFieldsName()}
  // console.log(fields());
</script>

<style lang="less" scoped>
  .search {
    top: 0;
    // left: 50%;
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
