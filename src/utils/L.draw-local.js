/*
 * @Author: Faith
 * @Date: 2022-06-25 09:20
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-02 09:44
 * @Description:
 */
L.drawLocal = {
  draw: {
    toolbar: {
      // #TODO: this should be reorganized where actions are nested in actions
      // ex: actions.undo  or actions.cancel
      actions: {
        title: "取消绘制",
        text: "-取消",
      },
      finish: {
        title: "-完成绘制",
        text: "-完成",
      },
      undo: {
        title: "- your text-",
        text: "- your text-",
      },
      buttons: {
        polyline: "- 线-",
        polygon: "- 多边形-",
        rectangle: "- 矩形-",
        circle: "- your text-",
        marker: "- your text-",
        circlemarker: "- your text-",
      },
    },
    handlers: {
      circle: {
        tooltip: {
          start: "画圆",
        },
        radius: "- your text-",
      },
      circlemarker: {
        tooltip: {
          start: "- your text-.",
        },
      },
      marker: {
        tooltip: {
          start: "- your text-.",
        },
      },
      polygon: {
        tooltip: {
          start: "多边形",
          cont: "- your-.",
          end: "- your text-.",
        },
      },
      polyline: {
        error: "<strong>Error:</strong> shape edges cannot cross!",
        tooltip: {
          start: "Click to start drawing line.",
          cont: "Click to continue drawing line.",
          end: "Click last point to finish line.",
        },
      },
      rectangle: {
        tooltip: {
          start: "矩形",
        },
      },
      simpleshape: {
        tooltip: {
          end: "松开鼠标结束绘制",
        },
      },
    },
  },
  edit: {
    toolbar: {
      actions: {
        save: {
          title: "Save changes",
          text: "Save",
        },
        cancel: {
          title: "Cancel editing, discards all changes",
          text: "Cancel",
        },
        clearAll: {
          title: "Clear all layers",
          text: "Clear All",
        },
      },
      buttons: {
        edit: "Edit layers",
        editDisabled: "No layers to edit",
        remove: "Delete layers",
        removeDisabled: "No layers to delete",
      },
    },
    handlers: {
      edit: {
        tooltip: {
          text: "Drag handles or markers to edit features.",
          subtext: "Click cancel to undo changes.",
        },
      },
      remove: {
        tooltip: {
          text: "Click on a feature to remove.",
        },
      },
    },
  },
}
