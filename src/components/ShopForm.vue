<template>
  <el-table
    :data="props.shopList"
    max-height="400"
    :header-cell-style="{
      textAlign: 'center',
      background: '#E4EEF6',
      height: '21px',
    }"
  >
    <el-table-column prop="NAME" label="店名"></el-table-column>
    <el-table-column prop="ADNAME" label="区域"></el-table-column>
    <el-table-column prop="CATEGORY" label="商品"></el-table-column>
    <el-table-column prop="PRICE" label="价格/kg"></el-table-column>
  </el-table>
</template>

<script setup>
  const props = defineProps({ shopList: { type: Array, default: [] } })
</script>

<style></style>
