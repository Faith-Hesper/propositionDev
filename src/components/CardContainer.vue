<template>
  <div v-dialogDrag:[draggable]="true">
    <div class="dialog_content">
      <div v-if="status" class="card-show">
        <el-button @click=";(status = false), (draggable = true)">
          <slot name="icon"></slot>
        </el-button>
      </div>
      <div v-else class="card-hidden">
        <el-card :body-style="{ padding: 0 }">
          <div class="header dialog_header">
            <div class="title">{{ props.title }}</div>
            <el-button size="small" type="primary" @click=";(status = true), (draggable = false)"
              >隐藏</el-button
            >
          </div>
          <slot name="content"></slot>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
  import directives from "@/utils/directive"
  import { ref } from "vue"
  const status = ref(false)
  const draggable = ref(true)
  const props = defineProps({
    title: {
      type: String,
      default: "工具栏",
    },
  })
</script>

<style lang="less" scoped>
  .card-hidden {
    position: relative;
    .header {
      width: 100%;
      height: 30px;
      background: #428bca;
      .title {
        font-style: 14px;
        line-height: 30px;
        color: white;
      }
    }
    .el-button {
      position: absolute;
      height: 30px;
      top: 0;
      left: 0;
    }
  }
  .dialog_content {
    position: fixed;
    z-index: 5;
  }
</style>
