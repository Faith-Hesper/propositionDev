<template>
  <div class="draggable">
    <transition name="slide-fade">
      <div v-if="status" class="card-show">
        <el-button @click=";(status = false), (draggable = true)">
          <slot name="icon"></slot>
        </el-button>
      </div>
      <div v-else v-dialogDrag:[draggable]="true" class="card-hidden">
        <div class="dialog_content">
          <!-- <el-card :body-style="{ padding: 0 }"> -->
          <div class="header dialog_header">
            <div class="title">{{ props.title }}</div>
            <el-button size="small" type="primary" @click=";(status = true), (draggable = false)"
              >隐藏</el-button
            >
          </div>
          <slot name="content"></slot>
          <!-- </el-card> -->
        </div>
      </div>
    </transition>
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
    customStatus: {
      type: Boolean,
      default: false,
    },
  })
  status.value = props.customStatus
</script>

<style lang="less" scoped>
  .draggable {
    width: 100px;
    height: 100%;
  }

  .card-hidden {
    position: relative;
    .header {
      width: 100%;
      height: 30px;
      background: #428bca;
      .title {
        font-size: 16px;
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
    border-radius: 4px;
    // box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12);
    // border: 1px solid #e4e7ed;
    background-color: #fff;
    overflow: hidden;
  }
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }
</style>
