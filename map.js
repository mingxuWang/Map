// 依赖引入
// var $ = require('common:widget/ui/zepto/zepto.js');

// KEY值，可替换
var KEY = '9c9aefb35bc32899c6284b482007e3e4';
// 默认参数
var TOOL_OPTIONS = {
  Map: {
    // 地图显示的缩放级别
    zoom: 4,
    // 是否监控地图容器尺寸变化，默认值为false
    resizeEnable: false,
    // 地图是否可通过鼠标拖拽平移，默认为true
    dragEnable: true,
    // 地图是否可缩放，默认值为true
    zoomEnable: true
  },
  DrawTool: {
    // 点标记参数
    marker: {
      // marker偏移量
      offset: [-10, -34],
    },
    // 圆参数
    circle: {
      // 半径长度
      radius: 100,
      // 默认图层位置
      zIndex: 10,
      // 边界颜色
      strokeColor: "#3366FF",
      // 边界透明度
      strokeOpacity: 0.9,
      // 边界宽度
      strokeWeight: 1,
      // 边界样式
      strokeStyle: "solid",
      // 填充颜色
      fillColor: "#FFAA00",
      // 填充透明度
      fillOpacity: 0.9
    },
    // 折线参数
    polyline: {
      // 折线颜色
      strokeColor: "#3366FF"
    },
    // 多边形参数
    polygon: {
      // 多边形外边框颜色
      strokeColor: "#3366FF",
      // 多边形填充部分颜色
      fillColor: "#FFAA00"
    },
    // 麻点参数
    massMarks: {
      // 麻点图标地址mark_r.png为红色，mark_b.png为蓝色
      url: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
      // 图标显示位置偏移量
      anchor: [3, 7],
      // 图标尺寸
      size: [10, 14],
    }
  },
  // 信息窗体参数
  InfoWindow: {

  },
  // 行政区域查询默认参数
  District: {
    subdistrict: 1, //返回下一级行政区
    extensions: 'all', //返回行政区边界坐标组等具体信息
    level: 'district' //查询行政级别为 市
  },
  // 定位默认参数
  Locate: {
    // 是否使用高精度定位，默认:true
    enableHighAccuracy: true,
    // 超过10秒后停止定位，默认：无穷大
    timeout: 10000,
    //定位结果缓存0毫秒，默认：0
    maximumAge: 0,
    //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
    convert: true,
    //显示定位按钮，默认：true
    showButton: true,
    //定位按钮停靠位置，默认：'LB'，左下角
    buttonPosition: 'LB',
    //定位成功后在定位到的位置显示点标记，默认：true
    showMarker: true,
    //定位成功后用圆圈表示定位精度范围，默认：true
    showCircle: true,
    //定位成功后将定位到的位置作为地图中心点，默认：true
    panToLocation: true,
    //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
    zoomToAccuracy: true
  },
  // 插件列表，默认为空，根据用户选择功能增加相应插件加载
  plugin: [],
};

// 初始化函数的对应关系
var PLUGIN_INIT_REALTION = {
  // 地图
  Map: MapInit,
  // 覆盖物/图层绘制
  DrawTool: DrawToolInit,
  // 信息窗体
  InfoWindow: InfoWindowInit,
  // 行政区查询
  District: DistrictInit,
  // 鼠标绘制功能
  MouseTool: MouseToolInit,
  // 多边形/折线编辑功能
  PolyEditor: PolyEditorInit,
  // 定位功能
  Locate: LocateInit,
  // 事件绑定功能
  Events: EventsInit
};

// 功能与插件加载对应关系
var PLUGIN_LOADED_REALTION = {
  // 定位
  Locate: 'AMap.Geolocation',
  // 鼠标绘制
  MouseTool: 'AMap.MouseTool',
  // 行政区
  District: 'AMap.DistrictSearch',
  // 折线/多边形编辑
  PolyEditor: 'AMap.PolyEditor'
};

// 错误语句管理
var ERROR_MSG = {
  nameError: "插件名称错误，加载失败",
  mapContainerError: "未传入地图容器id，加载失败！",
  inputError: "未输入所需功能组件，加载失败",
  positionError: "绘制时输入的坐标点出现问题！",
  pluginError: "用户功能组件加载失败！",
  apiFailed: "高德API加载失败",
  mapDependenceError: "依赖Map功能，功能列表未传入Map功能，请重新组织功能参数！"
};

// 定义全局变量
var plugin = {
  // 地图生成后会存储在plugin中，方便其他功能组件使用
  map: null,
  infoWindow: null
};
// 用户传入所需功能数组
var pluginList = [];
// 每个功能的deferred对象数组
var pluginDeferredsList = [];
// MapTool的Deferred对象
var mapDeferred = new $.Deferred();

// Map对象组织
var MapTool = function(userPluginList, opts) {
  // 设置用户所需功能
  this.pluginList = pluginList = userPluginList || [];
  this.opts = opts || {};
  this.deferred = mapDeferred;
  // 地图工具初始化
  this._init();
  // 返回$.Deferred对象
  return this.deferred.promise();
};
MapTool.prototype = {
  /**
   * MapTool初始化方法
   */
  _init: function() {
    // 辅助方法，检查用户需要使用的功能是否需要单独加载高德插件，会根据 PLUGIN_LOADED_REALTION 对应关系判断
    AMapPluginCheck();
    // 处理用户输入参数与预设参数
    mergeUserOptions(this.opts);
    // 加载高德API
    this.loadAMapApi();
  },
  /**
   * 加载高德API方法
   */
  loadAMapApi: function() {
    var that = this;
    // 定义回调函数
    window.gdCallback = that.apiLoaded;
    // 加载高德API
    $.ajax({
      url: 'http://webapi.amap.com/maps?v=1.3&callback=gdCallback&key=' + KEY + '&plugin=' +
        TOOL_OPTIONS.plugin
        .join(','),
      dataType: 'script'
    }).done(function() {
      // that.apiLoaded();
    }).fail(function() {
      // 失败错误提示
      console.error(ERROR_MSG.apiFailed);
      mapDeferred.reject({
        msg: ERROR_MSG.apiFailed
      });
    });
  },
  /**
   * 高德API加载完成后执行的方法
   */
  apiLoaded: function() {
    // 根据用户输入的功能列表Array进行判断，若为空则判定为输入错误
    if (pluginList.length > 0) {
      $.each(pluginList, function(index, item) {
        // 遍历每一个功能，看是否有对应的初始化方法，如果没有则判断为名称输入错误
        if ($.isFunction(PLUGIN_INIT_REALTION[item])) {
          // 为每一个功能放入一个$.Deferred对象，当加载成功时调整状态为resolved并返回实例
          var deferred = new $.Deferred();
          PLUGIN_INIT_REALTION[item](deferred);
          // 将$.Deferred对象集中管理起来，后续通过$.when方式来进行监听
          pluginDeferredsList.push(deferred);
        } else {
          console.error(item + ERROR_MSG.nameError);
        }
      });
    } else {
      console.error(ERROR_MSG.inputError);
    }

    // 此处进行监听，当所有功能都加载完成时会将相应实例返回
    $.when.apply($, pluginDeferredsList).then(function() {
      // 加载成功
      mapDeferred.resolve(arguments);
    }).fail(function() {
      // 错误处理
      console.error(ERROR_MSG.pluginError);
      mapDeferred.reject(arguments);
    });
  }
};


// 各功能初始化方法

/**
 * 地图初始化
 */
function MapInit($Deferred) {
  // 如果未传入地图容器，则认为输入错误，不再进行地图初始化后续工作
  if (!TOOL_OPTIONS.Map.container) {
    console.error(ERROR_MSG.mapContainerError);
    $Deferred.reject({
      msg: ERROR_MSG.mapContainerError
    });
  } else {
    // 生成一个地图实例
    var Map = new AMap.Map(TOOL_OPTIONS.Map.container, TOOL_OPTIONS.Map);
    // 将Map挂载到plugin对象上，其余功能可能会用到
    plugin.map = Map;
    // 向地图添加比例尺和工具栏插件
    Map.addControl(new AMap.ToolBar({
      position: "LB",
      offset: new AMap.Pixel(0, 40)
    }));
    Map.addControl(new AMap.Scale());
    // 返回Map实例
    $Deferred.resolve(Map);
  }

}

/**
 * 绘制功能初始化
 */
function DrawToolInit($Deferred) {
  // 绘制功能依赖于Map对象，因此先判断用户是否再不需地图的情况下单独使用了DrawTool功能
  if (pluginList.indexOf("Map") === -1) {
    console.error("绘制功能DrawTool" + ERROR_MSG.mapDependenceError);
    $Deferred.reject({
      msg: "绘制功能DrawTool" + ERROR_MSG.mapDependenceError
    });
  } else {
    // 定义DrawTool对象
    var DrawTool = {
      /**
       * marker绘制点标记
       * @param {Object/Array} opts - 有两种可能，当是Object时为绘制一个点 当为Array时需要一组点集中绘制
       * @return {Object/Array} 返回marker点对象或点对象数组
       */
      marker: function(opts) {
        // 判断如果是数组时，提供集中绘制的方法
        if ($.isArray(opts)) {
          var markerList = [];
          $.each(opts, function(index, item) {
            markerList.push(drawMarker(item));
          });
          return markerList;
        } else {
          // 否则直接绘制一个点就可以了
          return drawMarker(opts);
        }
        /**
         * 点绘制方法
         * @param  {Object} markerOpts - 点绘制参数
         * @param   {Array} markerOpts.position - 必填参数，marker绘制位置
         * @param   {Array} markerOpts.offset - 点标记显示位置偏移量，默认值为[-10,-34]，选填
         * @param  {String} markerOpts.icon - 需在点标记中显示的图标。可以是一个本地图标地址，有合法的content内容时，此属性无效，默认为http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png 蓝色标志
         * @param  {String} markerOpts.content - 点标记显示内容，可以是HTML要素字符串。content有效时，icon属性将被覆盖
         * @param {Boolean} markerOpts.topWhenClick - 鼠标点击时marker是否置顶，默认false ，不置顶
         * @param {Boolean} markerOpts.draggable - 设置点标记是否可拖拽移动，默认为false
         * @param {Boolean} markerOpts.raiseOnDrag - 设置拖拽点标记时是否开启点标记离开地图的效果，默认为false
         * @param  {Number} markerOpts.zIndex - 点标记的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认zIndex：100
         * @param  {String} markerOpts.title - 鼠标滑过点标记时的文字提示，不设置则鼠标滑过点标无文字提示
         * @param {Boolean} markerOpts.clickable - 点标记是否可点击，默认true
         * @param {Anytype} markerOpts.extData - 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
         */
        function drawMarker(markerOpts) {
          // 判断坐标是否有问题
          if ($.isArray(markerOpts.position)) {
            // 合并用户输入参数与默认参数
            var options = $.extend(true, {}, TOOL_OPTIONS.DrawTool.marker, markerOpts);
            options.offset = new AMap.Pixel(options.offset[0], options.offset[1]);
            options.map = plugin.map;
            var marker = new AMap.Marker(options);
            return marker;
          } else {
            // 输出坐标错误提示
            console.error("Marker" + positionError);
          }
        }
      },
      /**
       * circle绘制圆
       * @param {Object/Array} opts - 有两种可能，当是Object时为绘制一个圆 当为Array时需要一组圆集中绘制
       * @return {Object/Array} 返回marker点对象或点对象数组
       */
      circle: function(opts) {
        // 判断如果是数组时，提供集中绘制的方法
        if ($.isArray(opts)) {
          var circleList = [];
          $.each(opts, function(index, item) {
            circleList.push(drawCircle(item));
          });
          return circleList;
        } else {
          // 否则直接绘制一个点就可以了
          return drawCircle(opts);
        }
        /**
         * 圆绘制方法
         * @param  {Object} circleOpts - 圆绘制参数
         * @param   {Array} circleOpts.center - 必填参数，circle绘制位置
         * @param   {Array} circleOpts.radius - 圆半径，单位:米，默认100
         * @param  {Number} circleOpts.zIndex - 圆的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认10
         * @param  {String} circleOpts.strokeColor - 外边界颜色，使用16进制颜色代码赋值。默认值为#3366FF[亮蓝色]
         * @param  {Number} circleOpts.strokeOpacity - 外边界透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
         * @param  {Number} circleOpts.strokeWeight - 外边界宽度，单位：像素，默认为3
         * @param  {String} circleOpts.strokeStyle - 外边界样式，实线:solid，虚线:dashed，默认solid
         * @param  {String} circleOpts.fillColor - 圆填充颜色，使用16进制颜色代码赋值。默认值为#FFAA00[亮黄色]
         * @param  {Number} circleOpts.fillOpacity - 圆填充透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
         * @param {Anytype} circleOpts.extData - 用户自定义属性，支持JavaScript API任意数据类型，如Circle的id等
         */
        function drawCircle(circleOpts) {
          // 判断坐标是否有问题
          if ($.isArray(circleOpts.center)) {
            // 合并用户输入参数与默认参数
            var options = $.extend(true, {}, TOOL_OPTIONS.DrawTool.circle, circleOpts);
            options.map = plugin.map;
            var circle = new AMap.Circle(options);
            return circle;
          } else {
            // 输出坐标错误提示
            console.error("Circle" + positionError);
          }
        }
      },
      /**
       * polyline绘制折线
       * @param {Object/Array} opts - 有两种可能，当是Object时为绘制一条折线 当为Array时需要一组折线集中绘制
       * @return {Object/Array} 返回polyline对象或点对象数组
       */
      polyline: function(opts) {
        // 判断如果是数组时，提供集中绘制的方法
        if ($.isArray(opts)) {
          var polylineList = [];
          $.each(opts, function(index, item) {
            polylineList.push(drawPolyline(item));
          });
          return polylineList;
        } else {
          // 否则直接绘制一个就可以了
          return drawPolyline(opts);
        }
        /**
         * 折线绘制方法
         * @param  {Object} polylineOpts - 折线绘制参数
         * @param   {Array} polylineOpts.path - 必填参数，折线的节点坐标数组
         * @param  {String} polylineOpts.strokeColor - 线条颜色，使用16进制颜色代码赋值。默认值为#3366FF[亮蓝色]
         * @param  {Number} polylineOpts.strokeOpacity - 线条透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
         * @param  {Number} polylineOpts.strokeWeight - 线条宽度，单位：像素，默认3
         * @param  {String} polylineOpts.strokeStyle - 线样式，实线:solid，虚线:dashed,默认solid
         * @param  {Number} polylineOpts.zIndex - 折线的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认50
         * @param {Anytype} polylineOpts.extData - 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
         */
        function drawPolyline(polylineOpts) {
          // 判断坐标是否有问题
          if ($.isArray(polylineOpts.path)) {
            // 合并用户输入参数与默认参数
            var options = $.extend(true, {}, TOOL_OPTIONS.DrawTool.polyline, polylineOpts);
            options.map = plugin.map;
            var polyline = new AMap.Polyline(options);
            return polyline;
          } else {
            // 输出坐标错误提示
            console.error("Polyline" + positionError);
          }
        }
      },
      /**
       * polygon绘制折线
       * @param {Object/Array} opts - 有两种可能，当是Object时为绘制一个多边形 当为Array时需要一组多边形集中绘制
       * @return {Object/Array} 返回polygon对象或点对象数组
       */
      polygon: function(opts) {
        // 判断如果是数组时，提供集中绘制的方法
        if ($.isArray(opts)) {
          var polygonList = [];
          $.each(opts, function(index, item) {
            polygonList.push(drawPolygon(item));
          });
          return polygonList;
        } else {
          // 否则直接绘制一个就可以了
          return drawPolygon(opts);
        }
        /**
         * 多边形绘制方法
         * @param  {Object} polygonOpts - 多边形绘制参数
         * @param   {Array} polygonOpts.path - 必填参数，多边形的节点坐标数组
         * @param  {String} polygonOpts.strokeColor - 外边界颜色，使用16进制颜色代码赋值。默认值为#3366FF[亮蓝色]
         * @param  {Number} polygonOpts.strokeOpacity - 外边界透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
         * @param  {Number} polygonOpts.strokeWeight - 外边界宽度，单位：像素，默认为3
         * @param  {String} polygonOpts.strokeStyle - 外边界样式，实线:solid，虚线:dashed，默认solid
         * @param  {String} polygonOpts.fillColor - 多边形填充颜色，使用16进制颜色代码赋值。默认值为#FFAA00[亮黄色]
         * @param  {Number} polygonOpts.fillOpacity - 多边形填充透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
         * @param  {Number} polygonOpts.zIndex - 多边形的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认50
         * @param {Anytype} polygonOpts.extData - 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
         */
        function drawPolygon(polygonOpts) {
          // 判断坐标是否有问题
          if ($.isArray(polygonOpts.path)) {
            // 合并用户输入参数与默认参数
            var options = $.extend(true, {}, TOOL_OPTIONS.DrawTool.polygon, polygonOpts);
            options.map = plugin.map;
            var polyline = new AMap.Polygon(options);
            return polyline;
          } else {
            // 输出坐标错误提示
            console.error("Polygon" + positionError);
          }
        }
      },
      /**
       * massMarks绘制麻点标记
       * @param {Object/Array} opts - 有两种可能，当是Object时为绘制一组麻点 当为Array时需要多组麻点集中绘制
       * @return {Object/Array} 返回massMarks对象或点对象数组
       */
      massMarks: function(opts) {
        // 判断如果是数组时，提供集中绘制的方法
        if ($.isArray(opts)) {
          var massMarksList = [];
          $.each(opts, function(index, item) {
            massMarksList.push(drawMassMarks(item));
          });
          return massMarksList;
        } else {
          // 否则直接绘制一个点就可以了
          return drawMassMarks(opts);
        }
        /**
         * 麻点绘制方法
         * @param  {Object} massOpts - 麻点绘制参数
         * @param  {String} massOpts.url - 必填参数，图标的地址,默认为http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png 红色标志
         * @param   {Array} massOpts.size - 必填参数，图标的尺寸，默认[10, 14]
         * @param   {Array} massOpts.anchor - 必填参数，图标显示位置偏移量，以图标的左上角为基准点（0,0）点，默认[3, 7]
         * @param  {Number} massOpts.zIndex - 图层叠加的顺序值，0表示最底层。默认5
         * @param  {Number} massOpts.opacity - 图层的透明度，取值范围[0,1]，1代表完全不透明，0代表完全透明
         * @param   {Array} massOpts.zooms - 支持的缩放级别范围，默认范围[3-18]，在PC上，取值范围为[3-18]；在移动设备上，取值范围为[3-19]
         * @param {Boolean} massOpts.alwaysRender - 表示是否在拖拽缩放过程中实时重绘，默认true，建议超过10000的时候设置false
         */
        function drawMassMarks(massOpts) {
          // 判断坐标是否有问题
          if ($.isArray(massOpts.data)) {
            // 合并用户输入参数与默认参数
            var options = $.extend(true, {}, TOOL_OPTIONS.DrawTool.massMarks, massOpts.opts);
            options.achor = new AMap.Pixel(options.achor[0], options.achor[1]);
            options.size = new AMap.Size(options.size[0], options.size[1]);
            options.map = plugin.map;
            var massMarks = new AMap.MassMarks(massOpts.data, options);
            return massMarks;
          } else {
            // 输出坐标错误提示
            console.error("Massmarks" + positionError);
          }
        }
      },
      /**
       * contextMenu右键菜单绘制
       * @param {Object} opts - 右键菜单绘制参数
       * @return {Object/Array} 返回右键菜单对象
       */
      contextMenu: function(menuOpts) {

        return drawContextMenu(menuOpts);
        /**
         * 右键菜单绘制方法
         * @param  {Object} menuOpts - 右键菜单绘制参数
         * @param   {Array} menuOpts.position - 右键菜单显示的位置，初始化一般不填，会在开启时传入参数
         * @param  {String} menuOpts.content - 右键菜单内容，初始化一般不填，调用方法增加
         * @param  {Number} menuOpts.width - 右键菜单宽度，初始化一般不填，会自动设置
         */
        function drawContextMenu(menuOpts) {
          var options = {};
          if (menuOpts && menuOpts.content !== undefined) {
            options = menuOpts;
          }
          return new AMap.ContextMenu(options);
        }
      }
    };

    $Deferred.resolve(DrawTool);
  }

}

/**
 * 信息窗体初始化
 */
function InfoWindowInit($Deferred) {
  // 信息窗体功能依赖于Map对象，因此先判断用户是否再不需地图的情况下单独使用了InfoWindow功能
  if (pluginList.indexOf("Map") === -1) {
    console.error("信息窗体功能InfoWindow" + ERROR_MSG.mapDependenceError);
    $Deferred.reject({
      msg: "信息窗体功能InfoWindow" + ERROR_MSG.mapDependenceError
    });
  } else {
    // 生成一个InfoWindow实例并返回
    var infoWindow = new AMap.InfoWindow();
    $Deferred.resolve(infoWindow);
  }

}

/**
 * 行政区查询初始化
 */
function DistrictInit($Deferred) {
  if (AMap && AMap.DistrictSearch) {
    var district = new AMap.DistrictSearch(TOOL_OPTIONS.District);
    $Deferred.resolve(district);
  } else {
    console.error(ERROR_MSG.apiFailed);
    $Deferred.reject({
      msg: ERROR_MSG.apiFailed
    });
  }

}

/**
 * 鼠标绘制功能初始化
 */
function MouseToolInit($Deferred) {
  // 鼠标绘制功能依赖于Map对象，因此先判断用户是否再不需地图的情况下单独使用了MouseTool功能
  if (pluginList.indexOf("Map") === -1) {
    console.error("鼠标绘制功能MouseTool" + ERROR_MSG.mapDependenceError);
    $Deferred.reject({
      msg: "鼠标绘制功能MouseTool" + ERROR_MSG.mapDependenceError
    });
  } else {
    if (AMap && AMap.MouseTool) {
      var mousetool = new AMap.MouseTool(plugin.map);
      $Deferred.resolve(mousetool);
    } else {
      console.error(ERROR_MSG.apiFailed);
      $Deferred.reject({
        msg: ERROR_MSG.apiFailed
      });
    }

  }

}

/**
 * 多边形编辑功能初始化
 */
function PolyEditorInit($Deferred) {
  // 多边形编辑功能依赖于Map对象，因此先判断用户是否再不需地图的情况下单独使用了MouseTool功能
  if (pluginList.indexOf("Map") === -1) {
    console.error("多边形功能PolyEditor" + ERROR_MSG.mapDependenceError);
    $Deferred.reject({
      msg: "多边形功能PolyEditor" + ERROR_MSG.mapDependenceError
    });
  } else {
    if (AMap && AMap.PolyEditor) {
      var polyEditor = {
        get: function(poly) {
          return new AMap.PolyEditor(plugin.map, poly);
        }
      };
      $Deferred.resolve(polyEditor);
    } else {
      console.error(ERROR_MSG.apiFailed);
      $Deferred.reject({
        msg: ERROR_MSG.apiFailed
      });
    }
  }
}

/**
 * 定位功能初始化
 */
function LocateInit($Deferred) {
  if (AMap && AMap.Geolocation) {
    var locate = new AMap.Geolocation(TOOL_OPTIONS.Geolocation);
    $Deferred.resolve(locate);
  } else {
    console.error(ERROR_MSG.apiFailed);
    $Deferred.reject({
      msg: ERROR_MSG.apiFailed
    });
  }

}

/**
 * 事件模块初始化
 */
function EventsInit($Deferred) {
  if (AMap) {
    var Events = {
      /**
       * 给地图上的元素增加监听事件
       * @param [AMap Object] target 需要被监听事件的地图元素
       * @param [String] eventName 需要监听的事件
       * @param [Function] callback 需要执行的函数
       * @param [Object] context 事件上下文
       */
      on: function(target, eventName, callback, context) {
        AMap.event.addListener(target, eventName, function(e) {
          callback(e);
        }, context);
      }
    };
    $Deferred.resolve(Events);
  } else {
    console.error(ERROR_MSG.apiFailed);
    $Deferred.reject({
      msg: ERROR_MSG.apiFailed
    });
  }

}

// 辅助方法

/**
 * 判断是否需要另行加载插件
 */
function AMapPluginCheck() {
  if (pluginList.length > 0) {
    $.each(pluginList, function(index, item) {
      if (item === "Map") {
        TOOL_OPTIONS.plugin.push('AMap.ToolBar');
        TOOL_OPTIONS.plugin.push('AMap.Scale');
      }
      if (PLUGIN_LOADED_REALTION[item] !== undefined) {
        TOOL_OPTIONS.plugin.push(PLUGIN_LOADED_REALTION[item]);
      }
    });
  }
}

/**
 * 合并用户输入参数与预设参数
 * @param {Object} userOptions - 用户输入参数
 */
function mergeUserOptions(userOptions) {
  if (!$.isEmptyObject(userOptions)) {
    TOOL_OPTIONS = $.extend(true, {}, TOOL_OPTIONS, userOptions);
  }
}
