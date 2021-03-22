<template>
  <div class="map-box" v-loading="loading">
    <div class="left">
      <p style="font-size:13px;color:#888;">可鼠标拖拽调整路线。文本框中ctrl+A全选，ctrl+C复制。</p>
      <p style="font-size:13px;color:#888;">
        <i class="el-icon-location"></i> 采点个数：
        <span class="badge">{{number}}</span>
      </p>
      <p>
        <span :class="{'select':!edit}" class="select-label">自动规划路线</span>
        <i-switch v-model="edit" inactive-text="自动规划路线" active-text="手动编辑位置点" @on-change="change"></i-switch>
        <span :class="{'select':edit}" class="select-label">手动编辑位置点</span>
      </p>
      <el-input
        :rows="20"
        type="textarea"
        placeholder="ctrl+A全选，ctrl+C复制"
        v-model="textarea"
        readonly
      ></el-input>
    </div>
    <div class="right">
      <div id="container"></div>
    </div>
  </div>
</template>
<script>

import { code } from "../../libs/error";
import { getRouteReal, routeDetail, getRouteExpected } from "../../libs/api";

export default {
  data() {
    return {
      map: null,
      route: null,
      polyline: null,
      polylineEditor: null,
      number: 0,
      textarea: "",
      pathAuto: [],
      pathEdit: [],
      lineArr: [],
      edit: true,
      startPos: [],
      endPos: [],
      routeForm: {},
      markers: [],
      loading: true,
      mapType: false
    };
  },
  mounted() {
    AMapUI.loadUI(["control/BasicControl"], BasicControl => {
      var layerCtrl = new BasicControl.LayerSwitcher({
        position: {
          right: "40px",
          top: "120px"
        }
      });
      //实例化地图
      this.map = new AMap.Map("container", {
        zooms: [10, 20],
        resizeEnable: true,
        rotateEnable: true,
        pitchEnable: true,
        showIndoorMap: false,
        pitch: 30,
        rotation: 0,
        viewMode: "3D", //开启3D视图,默认为关闭
        buildingAnimation: true, //楼块出现是否带动画
        showBuildingBlock: true,
        expandZoomRange: true,
        layers: layerCtrl.getEnabledLayers()
      });
      //添加比例尺
      this.map.addControl(new AMap.Scale());
      //添加3d控件
      this.map.addControl(
        new AMap.ControlBar({
          showZoomBar: false,
          showControlButton: true,
          position: {
            right: "10px",
            top: "10px"
          }
        })
      );
      //添加一个缩放控件
      this.map.addControl(
        new BasicControl.Zoom({
          position: {
            right: "40px",
            top: "180px"
          }
        })
      );
      //添加图层切换控件
      this.map.addControl(layerCtrl);
      //绘制轨迹
      this.map.on("complete", () => {
        // if (JSON.stringify(this.$route.query) === "{}") {
        //   this.loading = false;
        //   return;
        // }
        this.draw();
      });
    });
  },
  methods: {
    //手动编辑点打点
    unAutoFn(driver) {
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
      //准备编辑规划路线数据
      if (!driver) {
        this.routeForm.track.split("|").forEach(item => {
          
          if(item != '' && item.indexOf(',') != -1){
            this.pathEdit.push(item.split(","));
          }
        });
      } else {
        this.routeForm.track.forEach(item => {
          if(item != '' && item.indexOf(',') != -1){
            this.pathEdit.push(item.split(","));
          }
        });
      }

      //创建编辑规划路线
      this.createdPolyline(this.pathEdit);
      this.map.setFitView(this.polyline);
      this.pointEdit();
      //显示途径点和起点终点
      this.createPoints();
      this.edit = true;
      this.loading = false;
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
    draw() {
      this.pathAuto = [];
      this.pathEdit = [];
      this.startPos = [];
      this.endPos = [];
      this.routeForm = {};
      this.markers = [];
      //添加-》展示自动规划路线
      if (this.$route.query.active === "add") {
        //途径点数据
      }
      this.routeForm = JSON.parse(window.localStorage.getItem("_p_"));
      // this.autoFn();
      if(this.routeForm.track){
        this.unAutoFn();
      }else {
        this.autoFn();
      }
      //编辑-》手动编辑位置点
      //   if (
      //     typeof this.$route.query.routeId !== "undefined" &&
      //     this.$route.query.active === "edit"
      //   ) {
      //     routeDetail({ routeId: this.$route.query.routeId })
      //       .then(res => {
      //         if (res.data.code == 0) {
      //           this.routeForm = res.data.data;
      //           //没有路线轨迹则转为自动规划
      //           typeof this.routeForm.track === "undefined"
      //             ? this.autoFn()
      //             : this.unAutoFn();
      //         } else {
      //           this.$message.error(code(res.data.code));
      //         }
      //         this.loading = false;
      //       })
      //       .catch(err => {
      //         this.loading = false;
      //       });
      //   }

      //根据班次id查询司机上传轨迹
      // if (typeof this.$route.query.scheId !== 'undefined' && typeof this.$route.query.shiftId !== 'undefined') {
      if (typeof this.$route.query.scheId !== "undefined") {
        this.edit = true;
        //获取司机上传轨迹
        getRouteReal({ scheId: this.$route.query.scheId })
          .then(res => {
            if (res.data.code == 0) {
              this.routeForm.track = res.data.data.traceList;

              //预计轨迹
              // getRouteExpected({shiftId: this.$route.query.shiftId}).then((res) => {
              getRouteExpected({ scheId: this.$route.query.scheId }).then(
                res => {
                  if (res.data.code == 0) {
                    //预计途径点数据
                    this.routeForm.stops = res.data.data.stops;
                    this.unAutoFn(true);
                  } else {
                    this.$message.error(code(res.data.code));
                  }
                }
              );
            } else {
              this.loading = false;
              this.$message.error(code(res.data.code));
            }
          })
          .catch(err => {
            this.loading = false;
          });
      }
    },
    //改变编辑方式
    change(type) {
      if (type) {
        this.pointEdit();
      } else {
        this.$confirm(
          "切换到自动规划您之前设置的路线将被重置，是否继续操作？",
          "提示",
          {
            confirmButtonText: "确认自动规划",
            cancelButtonText: "取消",
            type: "warning"
          }
        )
          .then(() => {
            this.polylineEditor.close();
            this.createDrag(this.pathAuto);
          })
          .catch(() => {
            this.edit = true;
          });
      }
    },
    //手动编辑点
    pointEdit() {
      if (this.route) {
        this.route.destroy();
      }
      if (this.polyline) {
        this.showPath(this.polyline.getPath());
      }
      //显示位置点
      this.map.plugin(["AMap.PolyEditor"], () => {
        this.polylineEditor = new AMap.PolyEditor(this.map, this.polyline);
        this.polylineEditor.open();
        AMap.event.addListener(this.polylineEditor, "adjust", res => {
          this.showPath(res.target.getPath());
        });
        AMap.event.addListener(this.polylineEditor, "addnode", res => {
          this.showPath(res.target.getPath());
        });
        AMap.event.addListener(this.polylineEditor, "removenode", res => {
          this.showPath(res.target.getPath());
        });
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
    //拖拽规划回调
    dragRouteCallback(type, target, data) {
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

      for (var i = 0; i < points.length; i++) {
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
    //规划路径
    createdPolyline(path) {
      this.polyline = new AMap.Polyline({
        path: path,
        strokeColor: "#3366FF",
        zIndex: 1
      });
      this.polyline.setMap(this.map);
      //                this.map.setFitView(this.polyline);
      this.showPath(path);
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
    //显示结果
    showPath(path) {
      var str = "";
      for (var i = 0; i < path.length; i++) {
        str += path[i] + "|";
      }
      this.number = path.length;
      this.textarea = str.substring(0, str.length - 1);
    }
  }
};
</script>
<style scoped>
.select-label {
  padding: 0 5px;
  display: inline-block;
}
.select {
  color: #54d4a1;
}
.map-box {
  padding-left: 380px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
}
.map-box .left {
  width: 380px;
  margin-left: -380px;
  box-sizing: border-box;
  padding: 20px;
  border-right: 1px solid #eee;
}
.map-box .left p {
  margin-bottom: 10px;
}
.map-box .right,
#container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
</style>
