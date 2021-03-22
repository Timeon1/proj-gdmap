module.exports = {
  configureWebpack: {
    externals: {
      AMap: "window.AMap"
    }
  }
};