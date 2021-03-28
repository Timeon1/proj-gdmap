# proj-gdmap

> 地图站点路线规划 可拖拽微调 不同策略切换



- webpack中引入高德Api

  ```javascript
  // 1 public => index.html (注意: 放在body之前 )
   <script type="text/javascript"
     src="https://webapi.amap.com/maps?v=1.4.15&key=your高德key">
   </script>
  
  //项目根目录 新建 vue.config.js
  module.exports = {
    configureWebpack: {
      externals: {
        AMap: "window.AMap"
      }
    }
  };
  
  // map.vue 
  import Amap from 'Amap'
  
  
  ```

  

```javascript
git clone 
npm install
npm run serve
```

