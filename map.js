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
    enableHighAccuracy: true, //是否使用高精度定位，默认:true
    timeout: 10000, //超过10秒后停止定位，默认：无穷大
    maximumAge: 0, //定位结果缓存0毫秒，默认：0
    convert: true, //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
    showButton: true, //显示定位按钮，默认：true
    buttonPosition: 'LB', //定位按钮停靠位置，默认：'LB'，左下角
    showMarker: true, //定位成功后在定位到的位置显示点标记，默认：true
    showCircle: true, //定位成功后用圆圈表示定位精度范围，默认：true
    panToLocation: true, //定位成功后将定位到的位置作为地图中心点，默认：true
    zoomToAccuracy: true //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
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
  positionError: "坐标点绘制时出现问题！",
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
         * @param {Object} markerOpts - 点绘制参数
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
            console.error(positionError);
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
         * 点绘制方法
         * @param {Object} markerOpts - 点绘制参数
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
            console.error(positionError);
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
         * 点绘制方法
         * @param {Object} markerOpts - 点绘制参数
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
            console.error(positionError);
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
         * 点绘制方法
         * @param {Object} markerOpts - 点绘制参数
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
            console.error(positionError);
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
