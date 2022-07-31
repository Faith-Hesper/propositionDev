/*
 * @Author: Faith
 * @Date: 2022-06-20 19:23
 * @LastAuthor: Faith
 * @LastEditTime: 2022-07-31 09:39
 * @Description:
 */
window.BASE_CONFIG = {
  key: "70c2475638a45e3fea8696df2f9917f8",
  MAP: {
    center: [30.67, 104.07],
    minZoom: 2,
    maxZoom: 18,
    zoom: 12,
    zoomControl: false,
    map_crs: "EPSG4326",
    // maxBounds: [],
    baseMapLayer: [
      {
        name: "天地图底图",
        key: "70c2475638a45e3fea8696df2f9917f8",
        isLabel: false,
        url: "http://t0.tianditu.gov.cn/vec_c/wmts?",
      },
      {
        name: "天地图注记",
        key: "70c2475638a45e3fea8696df2f9917f8",
        isLabel: true,
        url: "http://t0.tianditu.gov.cn/cva_c/wmts?",
      },
    ],
  },
  BASEURL: {
    mapUrl: "http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap",
    dataUrl: "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data",
    spatialAnalystUrl:
      "http://localhost:8090/iserver/services/spatialAnalysis-Changchun/restjsr/spatialanalyst",
    newworkServiceUrl:
      "http://localhost:8090/iserver/services/transportationAnalyst-ChengduFresh/rest/networkanalyst/Network@ChengduFresh",
    traffictransferanalystUrl:
      "http://localhost:8090/iserver/services/traffictransferanalyst-sample/restjsr/traffictransferanalyst/Traffic-Changchun",
  },
}
