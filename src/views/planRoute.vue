<template>
 <div class="map-box">
   <div class="left">
      
     <el-button type="primary" v-for="item in routePlayTypes" :key="item.value" @click="changeRouteMode($event,item.value)">{{item.label}}</el-button>
   </div>
   <div class="right">
    <div id="container"></div>

   </div>
 </div>
</template>
<script>
// eslint-disable-next-line
import AMap from "AMap";
export default {
 name: "Index",
 data() {
  return {
    map: null,
    route: null,
    lineArr: [],
    polyline: null,
    routeForm: {},
    pathAuto: [],
    routePlayTypes: [
      {label: '最快捷路线', value: 'AMap.DrivingPolicy.LEAST_TIME'},
      {label: '最经济模式', value: 'AMap.DrivingPolicy.LEAST_FEE'},
      {label: '最短距离模式', value: 'AMap.DrivingPolicy.LEAST_DISTANCE'},
      {label: '考虑实时路况', value: 'AMap.DrivingPolicy.REAL_TRAFFIC'},
    ],
    dataP: {"stops":[{"stopName":"高科西路--下南路","stopType":1,"lonLat":"121.552198,31.203649","stopTypeOn":1},{"stopName":"景明路--碧波路572弄","stopType":2,"lonLat":"121.579135,31.202102","stopTypeOn":1},{"stopName":"广兰路地铁站-lc","stopType":2,"lonLat":"121.620780,31.211176","stopTypeOn":2},{"stopName":"张江家乐福公交站-lc","stopType":3,"lonLat":"121.639441,31.204713","stopTypeOn":2}]}
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
      // this.showPath(path);
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
    changeRouteMode(e,value){
      this.createDrag(this.pathAuto,value)
    },
    //创建拖拽规划
    //AMap.DrivingPolicy.LEAST_TIME     最快捷模式
    //AMap.DrivingPolicy.LEAST_FEE      最经济模式
    //AMap.DrivingPolicy.LEAST_DISTANCE 最短距离模式
    //AMap.DrivingPolicy.REAL_TRAFFIC   考虑实时路况
    createDrag(path, type = 'AMap.DrivingPolicy.LEAST_TIME') {
      this.markers = [];
      this.map.plugin("AMap.DragRoute", () => {
        this.route = new AMap.DragRoute(
          this.map,
          path,
          type,
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
        );
        this.route.search(); //查询导航路径并开启拖拽导航
        AMap.event.addListener(this.route, "complete", this.dragRouteCallback); //返回导航查询结果
      });
    },
    //拖拽规划回调
    dragRouteCallback() {
      if (this.polyline) {
        this.polyline.setMap();
        this.lineArr = [];
        this.polylineEditor = null;
      }
      //导航路径上的所有点
      var routPoints = this.route.getRoute();
      var points = [];
      if (routPoints && routPoints.length > 0) {
        for (var i = 0; i < routPoints.length; i++) {
          if (
            i == 0 &&
            routPoints[i].getLng() != this.startPos[0] &&
            routPoints[i].getLat() != this.startPos[1]
          ) {
            points.push(this.startPos); //加入起点
          }
          points.push([routPoints[i].getLng(), routPoints[i].getLat()]);
          if (
            i == routPoints.length - 1 &&
            routPoints[i].getLng() != this.endPos[0] &&
            routPoints[i].getLat() != this.endPos[1]
          ) {
            points.push(this.endPos); //加入终点
          }
        }
      }

      var x1 = points[0][1]; //上一个采纳点
      var y1 = points[0][0];
      var ang1 = null,
        ang2 = null;
      var y2 = 0,
        x2 = 0;
      var criticalAngle = 3.5;

      //上一个遍历点
      var preX = x1,
        preY = y1;

      for (let i = 0; i < points.length; i++) {
        (y2 = points[i][0]), (x2 = points[i][1]);
        if (x1 != preX && y1 != preY) {
          ang1 = this.getAngle(x1, y1, preX, preY);
        }
        if (i >= 2) {
          ang2 = this.getAngle(preX, preY, x2, y2);
        }
        if (
          i == 0 ||
          (ang2 != null &&
            (ang2 - ang1 > criticalAngle || ang2 - ang1 < -criticalAngle))
        ) {
          this.lineArr.push([preY, preX]);
          x1 = preX;
          y1 = preY;
        }
        (preX = x2), (preY = y2);
      }
      this.lineArr.push(this.endPos);
      this.createdPolyline(this.lineArr);
    },
    //获取偏移角
    getAngle(x1, y1, x2, y2) {
      // 直角的边长
      var x = Math.abs(x1 - x2),
        y = Math.abs(y1 - y2),
        // 斜边长
        z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
        // 余弦
        cos = y / z,
        // 弧度
        radina = Math.acos(cos);
      // 角度
      return 180 / (Math.PI / radina);
    },
    //创建路线上的点，包括起点和终点
    createPoints() {
      if (this.routeForm != null) {
        var points = this.routeForm.stops;
        //起点和终点
        var iconS = "https://webapi.amap.com/theme/v1.3/markers/n/start.png";
        var iconM = "https://webapi.amap.com/theme/v1.3/markers/n/mid.png";
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
  width: 350px;
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