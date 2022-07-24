<template>
  <el-table
    :data="props.shopList"
    max-height="400"
    :class="active"
    :header-cell-style="{
      textAlign: 'center',
      background: '#E4EEF6',
      height: '21px',
    }"
  >
    <el-table-column prop="NAME" label="店名"></el-table-column>
    <el-table-column prop="ADNAME" label="区域"></el-table-column>
    <el-table-column prop="CATEGORY" label="商品"></el-table-column>
    <el-table-column prop="PRICE" label="价格/kg" :formatter="formatterPrice"></el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <el-tag class="point" type="success" @click="clickRow(scope.row)">定位</el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
  import { ref } from "vue"
  const props = defineProps({ shopList: { type: Array, default: [] } })
  const emits = defineEmits(["flyTOAim"])
  const active = ref(false)
  const clickRow = row => {
    let lat = row.LAT
    let lng = row.LNG
    // console.log(row)
    emits("flyTOAim", [lat, lng])
  }
  const formatterPrice = row => {
    return Number(row.PRICE).toFixed(2)
  }
</script>

<style scoped>
  .el-table tr {
    cursor: pointer;
  }
  .point:hover {
    cursor: pointer;
  }
</style>
