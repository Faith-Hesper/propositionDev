<template>
  <el-table :data="props.shopList">
    <el-table-column prop="NAME" label="店名"></el-table-column>
    <el-table-column prop="ADNAME" label="区域"></el-table-column>
    <el-table-column prop="CATEGORY" label="商品"></el-table-column>
    <el-table-column prop="PRICE" label="价格"></el-table-column>
  </el-table>
</template>

<script setup>
  const props = defineProps({ shopList: { type: Array, default: [] } })
</script>

<style></style>
