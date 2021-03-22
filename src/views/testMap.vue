<template>
 <div class="map-box">
   <div class="left"></div>
   <div class="right">
    <div id="container"></div>

   </div>
 </div>
</template>
<script>
// eslint-disable-next-line
/*global AMapUI */
import AMap from "AMap";
export default {
 name: "Index",
 data() {
  return {
    map: null,
    polyline: null,
    routeForm: {},
    dataP: {"areaIds":["d33a6c3e9c54419c8496066e2e642717"],"cityCode":"021","adName":"上海市","districtCode":"","districtName":"","track":"","stops":[{"stopId":"e4f9fa7c9c79490cacfa3b4727e424d0","stopName":"荆门市钟祥市文集镇人民政府","stopType":1,"fleetId":"3C45AD1E8EB347F2B678B392B89AA4B2","fleetName":"飞路车队","interval":0,"stopOrder":0,"lonLat":"112.536813,31.157075","stopTypeOn":1},{"stopId":"66b4053d1b1d4d20be05ef76c3dd9045","stopName":"金科路哈雷路公交站-lc","stopType":2,"fleetId":"3C45AD1E8EB347F2B678B392B89AA4B2","fleetName":"飞路车队","interval":0,"stopOrder":30,"lonLat":"121.605779,31.205142","stopTypeOn":1},{"stopId":"c3ce4299f8f849a1851f196f04849b18","stopName":"广兰路地铁站-lc","stopType":2,"fleetId":"3C45AD1E8EB347F2B678B392B89AA4B2","fleetName":"飞路车队","interval":0,"stopOrder":31,"lonLat":"121.620780,31.211176","stopTypeOn":2},{"stopId":"9bf7bf6be14e45069b9ef52e614ec617","stopName":"张江家乐福公交站-lc","stopType":3,"fleetId":"3C45AD1E8EB347F2B678B392B89AA4B2","fleetName":"飞路车队","interval":0,"stopOrder":32,"lonLat":"121.639441,31.204713","stopTypeOn":2}],"cityAreaList":[{"cityCode":"021","cityAdCode":"310000","cityName":"上海市","districtAdCode":"310115","districtName":"浦东新区"},{"cityCode":"020","cityAdCode":"440100","cityName":"广州市","districtAdCode":"440113","districtName":"番禺区"},{"cityCode":"023","cityAdCode":"500100","cityName":"重庆城区","districtAdCode":"500151","districtName":"铜梁区"},{"cityCode":"1558","cityAdCode":"341200","cityName":"阜阳市","districtAdCode":"341204","districtName":"颍泉区"}],"id":"015a7f7d75d046bba58a233a02dffd9b","sobId":"01f99b962cc4468aab3d711b454bd67e","totalDistance":695910}
  };
 },
  mounted() {
    //实例化地图
    this.map = new AMap.Map("container", {
      mapStyle: 'amap://styles/macaron',
      zooms: [10, 20],
      resizeEnable: true,
      rotateEnable: true,
      pitchEnable: true,
      showIndoorMap: false,
      pitch: 30,
      rotation: 0,
      showBuildingBlock: true,
      expandZoomRange: true,
    });

    this.map.on("complete", () => this.draw());

     
  },
  methods:{
        //规划路径
    createdPolyline(path) {
      this.polyline = new AMap.Polyline({
        path: path,
        strokeColor: "#3366FF",
        zIndex: 1
      });
      this.polyline.setMap(this.map);
      this.showPath(path);
    },
    draw() {
      this.pathAuto = [];
      this.pathEdit = [];
      this.startPos = [];
      this.endPos = [];
      this.routeForm = {};
      this.markers = [];

      this.routeForm = this.dataP;
      this.autoFn();

    },
    //自动规划路线
    autoFn() {
      //准备自动规划路线数据
      this.routeForm.stops.forEach(item => {
        this.pathAuto.push(
          typeof item.lonLat === "undefined"
            ? item.lonlat.split(",")
            : item.lonLat.split(",")
        );
      });
      //获取起点和终点坐标
      this.startPos = this.pathAuto[0];
      this.endPos = this.pathAuto[this.pathAuto.length - 1];
      //创建自动规划
      this.createDrag(this.pathAuto);
      //显示途径点和起点终点
      this.createPoints();
      this.edit = false;
      this.loading = false;
    },
    //创建拖拽规划
    //AMap.DrivingPolicy.LEAST_TIME     最快捷模式
    //AMap.DrivingPolicy.LEAST_FEE      最经济模式
    //AMap.DrivingPolicy.LEAST_DISTANCE 最短距离模式
    //AMap.DrivingPolicy.REAL_TRAFFIC   考虑实时路况
    createDrag(path) {
      this.markers = [];
      this.map.plugin("AMap.DragRoute", () => {
        this.route = new AMap.DragRoute(
          this.map,
          path,
          AMap.DrivingPolicy.LEAST_FEE,
          {
            startMarkerOptions: {
              visible: false
            },
            midMarkerOptions: {
              visible: true
            },
            endMarkerOptions: {
              visible: false
            }
          }
        ); //构造拖拽导航类
        this.route.search(); //查询导航路径并开启拖拽导航
        AMap.event.addListener(this.route, "complete", this.dragRouteCallback); //返回导航查询结果
      });
    },
    //创建路线上的点，包括起点和终点
    createPoints() {
      if (this.routeForm != null) {
        var points = this.routeForm.stops;
        //起点和终点
        var iconS = "https://webapi.amap.com/theme/v1.3/markers/n/start.png";
        var iconM = "/static/img/mid.png";
        var iconE = "https://webapi.amap.com/theme/v1.3/markers/n/end.png";
        points.forEach((item, index) => {
          //记录创建的点
          this.markers.push(
            new AMap.Marker({
              icon:
                index == 0 ? iconS : index == points.length - 1 ? iconE : iconM,
              position:
                typeof item.lonLat === "undefined"
                  ? item.lonlat.split(",")
                  : item.lonLat.split(","),
              map: this.map,
              zIndex: 1100,
              topWhenClick: true,
              label: {
                content:
                  typeof item.stopName === "undefined"
                    ? item.name
                    : item.stopName,
                offset: new AMap.Pixel(0, -23)
              }
            })
          );
        });
      }
    },
  }
};
</script>
<style scoped>
.map-box {
  height: 100%;
  width: 100%;
  display: flex;
}
.left {
  width: 300px;
  height: 600px;
  border: 1px solid #ccc;
}
.map-box .right,
#container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

</style>