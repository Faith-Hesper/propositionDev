<template>
  <div class="dialog_content">
    <div v-if="status" class="card-show">
      <el-button @click="status = false">
        <slot name="icon"></slot>
      </el-button>
    </div>
    <div v-else class="card-hidden">
      <el-card class="dialog_header" :body-style="{ padding: 0 }">
        <el-button size="small" @click="status = true">隐藏</el-button>
        <slot name="content"></slot>
      </el-card>
    </div>
  </div>
</template>

<script setup>
  import { ref } from "vue"
  const status = ref(false)
</script>

<style lang="less" scoped>
  .card-hidden {
    position: relative;
    .el-button {
      position: absolute;
      top: 0;
      left: 0;
    }
  }
  .dialog_content {
    position: fixed;
  }
</style>
