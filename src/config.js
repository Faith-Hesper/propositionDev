/*
 * @Author: Faith
 * @Date: 2022-06-20 19:23
 * @LastAuthor: Faith
 * @LastEditTime: 2022-06-20 19:59
 * @Description:
 */
window.BASE_CONFIG = {
  center: [30.67, 104.07],
  minZoom: 2,
  maxZoom: 18,
  zoom: 12,
  map_crs: 'EPSG4326',
  key: '70c2475638a45e3fea8696df2f9917f8',
  baseMapLayer: [
    {
      name: '天地图底图',
      key: '70c2475638a45e3fea8696df2f9917f8',
      isLabel: false,
      url: 'http://t0.tianditu.gov.cn/vec_c/wmts?',
    },
    {
      name: '天地图注记',
      key: '70c2475638a45e3fea8696df2f9917f8',
      isLabel: true,
      url: 'http://t0.tianditu.gov.cn/cva_c/wmts?',
    },
  ],
}
