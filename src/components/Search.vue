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
  import { cacheShopData } from "@/utils/tool.js"
  import { ref } from "vue"
  const emit = defineEmits(["shopDetail"])

  const Shops = ref([])
  const shopName = ref("")
  let sqlParam = {
    fromIndex: 0,
    toIndex: 19,
  }
  const querySearch = (queryString, callback) => {
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

  const change = async item => {
    if (!Shops.value) {
      await getShopsData("")
    }
    console.log(item)
  }

  // 搜索商店信息
  const shopSearch = async () => {
    if (!shopName.value) return
    let { totalCount, features } = await searchBySql(shopName.value, { toIndex: 30 })
    emit("shopDetail", features)
  }

  // 输入框获取商店数据
  const getShops = async shops => {
    let { features } = await searchBySql(shops)
    // console.log(features)
    Shops.value = features.features.map(data => {
      return { value: data.properties.NAME, name: data.properties.NAME }
    })
  }

  // getShops(shopName.value)
  // 存储 商店名称
  const getShopsData = async shops => {
    let { totalCount, features } = await searchBySql(shops, {
      fromIndex: sqlParam.fromIndex,
      toIndex: sqlParam.toIndex,
    })
    if (sqlParam.toIndex + 1 < totalCount) {
      sqlParam.fromIndex = sqlParam.toIndex + 1
      sqlParam.toIndex += 19
      setTimeout(async () => {
        await getShopsData("")
      }, 1000)
    }
    return await new Promise((resolve, reject) => {
      let shopSuggestion = features.features.map(data => {
        return { value: data.properties.NAME, name: data.properties.NAME }
      })
      console.log("执行")
      Shops.value.push(...shopSuggestion)
      if (sqlParam.toIndex + 1 > totalCount) {
        console.log("ok")
        resolve("")
      }
    })
  }

  let nowTime = new Date().getTime()
  let oldTime = localStorage.getItem("timestamp")
  let time = (nowTime - oldTime) / (1000 * 60 * 60 * 24)
  if (!localStorage.getItem("shops") || time > 30 || !oldTime) {
    let timestamp = new Date().getTime()
    localStorage.setItem("timestamp", timestamp.toString())
    cacheShopData()
    // getShopsData("").then(() => {
    //   localStorage.setItem("shops", JSON.stringify(Shops.value))
    // })
    // console.log("执行")
  } else {
    let data = localStorage.getItem("shops")
    Shops.value = JSON.parse(data)
  }

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
