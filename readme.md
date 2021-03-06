# Map组件设计文档

## 组件设计目的

分析当前各业务方向(销售端、商城、数据可视化、TMS)内地图相关应用的地图功能使用情况，封装Map组件供给各业务向进行使用。

将高德地图API进行二次封装，降低地图相关功能学习代价，方便地图相关应用开发。

---

## 适用场景

* 用户定位
    * 销售端 商城 中进行的用户位置确定，坐标上传等 
* 地物的地理位置展示(点 路径折线 多边形)
    * MIS中 销售校准点 销售坐标点 超市注册点等点位置展示
    * TMS中 订单(超市)位置展示 排线线路展示
* 手动进行覆盖物绘制与编辑(点 线 面)
    * MIS中 客服校准点标注；区域限制售卖 区域绘制与编辑
* 行政区域范围查询
    * TMS中 配送方案中区域选择

---

## 组件特性

* 组件化的使用方式，按需加载相关功能并返回实例

---


## 组件使用方法

* 组件依赖`jQuery`或`zepto`，需要在组件头部引入(或像数据平台一样在jquery之后引入亦可)
* 组件暴露一个`$.Deferred对象`，即`module.exports = MapTool;`，使得用户的使用方式更简单，具体使用方式如下：

```
// 先引入组件
var MapTool = require("common:widget/map/mapTool.js");
// 在顶部先定义相应功能变量
var map,drawTool,infoWindow;

        // 需要传入用到的地图功能，会按需加载
new MapTool(["Map","DrawTool","InfoWindow"],
        // 传入用户配置参数，非必填(组件内预设默认参数)；
        {
            Map:{
                center:[116.397428, 39.90923],
                zoom:12
                }
        }
    ).then(function(toolList){
    // 加载成功后会按顺序返回相应的功能实例
    map = toolList[0];
    drawTool = toolList[1];
    infoWindow = toolList[2];
    // 此时可以开始执行与地图加载有关的操作，回调函数无需传入
    action();
    }).fail(function(){
    // 失败处理的内容
    var error = arguments[0][0];
    console.log(error.msg);
    })
```

---

## API

### 功能列表

功能名称 | 说明
--------- | -------------
`Map` | 提供地图显示功能，返回一个`AMap.Map`的实例对象
`DrawTool` | 提供覆盖物的绘制功能，包括点 圆 折线 多边形 麻点 右键菜单的绘制，调用相关方法进行绘制后会返回相应的绘制对象 **依赖Map功能**
`InfoWindow` | 提供信息窗体展示功能，返回一个 `AMap.InfoWindow`的实例对象，提供常用的打开窗体、设置窗体内容等功能 **依赖Map功能**
`District` | 提供行政区查询服务，提供全国各省、市、县、区的中心点经纬度、行政区边界坐标组、下级行政区等信息
`MouseTool` | 提供地图上的手动绘制功能，可包括点 折线 面等覆盖物 **依赖Map功能**
`PolyEditor` | 提供多边形、折线编辑功能 **依赖Map功能**
`Locate` | 提供定位功能
`Events` | 提供事件绑定功能


### MapTool

构造函数 | 返回值 | 说明
--------- | ------------- | -------------
`MapTool(pluginList:Array,options:Object)` | `$.Deferred` | 构造一个Map组件实例对象，第一个参数是需要使用的功能名称数组，第二个参数是使用功能的预设参数(具体参数见各功能)；此时会返回一个$.Deferred对象，加载完成后按传入顺序返回功能实例
例：

```
        // 需要传入用到的地图功能，会按需加载
new MapTool(["Map","DrawTool","InfoWindow"],
        // 传入用户配置参数，非必填(组件内预设默认参数)；
        {
            Map:{
                center:[116.397428, 39.90923],
                zoom:12
                }
        }
    ).then(function(toolList){
    // 加载成功后会按顺序返回相应的功能实例
    map = toolList[0];
    drawTool = toolList[1];
    infoWindow = toolList[2];
    // 此时可以开始执行与地图加载有关的操作，回调函数无需传入
    action();
    }).fail(function(){
    // 失败处理的内容
    var error = arguments[0][0];
    console.log(error.msg);
    });
```

### Map

#### 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`container` | `String` | 地图容器id **必填**
`zoom` | `Number` | 地图显示的缩放级别默认4
`zooms` | `Array` | 地图显示的缩放级别范围，PC默认[3-18],移动端默认[3-19]
`center` | `Array` | 地图中心点坐标值[lng:经度,lat:纬度]，默认显示用户所在城市范围
`resizeEnable` | `Boolean` | 是否监控地图容器尺寸变化，默认值为false
`dragEnable` | `Boolean` | 地图是否可通过鼠标拖拽平移，默认为true
`zoomEnable` | `Boolean` | 地图是否可缩放，默认值为true

#### 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setZoom(level:Number)` | ` ` | 设置地图显示的缩放级别
`setCenter(position:Array)` | ` ` | 设置地图显示的中心点
`setZoomAndCenter(zoomLevel:Number,center:Array)` | `无` | 地图缩放至指定级别并以指定点为地图显示中心点
`setCity(city:String，callback:Functon)` | ` ` | 按照行政区名称设置地图显示的中心点，行政区名称支持中国、省、市、区/县
`setDefaultCursor(cursor:String)` | ` ` | 设置鼠标指针默认样式，参数cursor应符合CSS的cursor属性规范。可为CSS标注中的光标样式，如：setCursor(“pointer”)等；或者自定义的光标样式，如： setCursor("url('url地址'),pointer")
`panTo(positon:Array)` | ` ` | 地图中心点平移至指定点位置
`setFitView(overlayList:Array)` | ` ` | 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别，参数overlayList默认为当前地图上添加的所有覆盖物图层
`clearMap( )` | ` ` | 删除地图上所有的覆盖物
`destroy( )` | ` ` | 注销地图对象，并清空地图容器
`plugin(name:String/Array,callback:Function)` | ` ` | 插件加载方法**(如果用到了组件未提供的功能插件时可以使用)**。参数name中指定需要加载的插件类型，同时加载多个插件时，以字符串数组的形式添加。在Callback回调函数中进行地图插件的创建、插件事件的绑定等操作；插件为地图功能的扩展，按需加载

#### 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`complete` | ` ` | 地图图块加载完成后触发事件
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`rightclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标右键单击事件
`mapmove` | ` ` | 地图平移时触发
`zoomchange` | ` ` | 地图缩放级别更改后触发
`mousemove` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在地图上移动时触发
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移入地图容器内时触发
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出地图容器时触发
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在地图上单击抬起时触发
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在地图上单击按下时触发
`resize` | ` ` | 地图容器大小改变事件
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备

### DrawTool

提供点标记(marker)、圆(circle)、折线(polyline)、多边形(polygon)、海量点(massmarks)与右键菜单(contextMenu)的绘制方法

#### 预设参数

示例：

```
new Map(["map","drawTool"],
        // 传入用户配置参数，非必填(组件内预设默认参数)；
        {
            drawTool:{
                marker:{
                // 详细参数
                },
                polyline:{
                // 详细参数
                },
                ...
            }
        }
    )
```

##### DrawTool.marker 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`position` | `Array` | marker绘制位置，必填
`offset` | `Array` | 点标记显示位置偏移量，默认值为[-10,-34]
`icon` | `String` | 需在点标记中显示的图标。可以是一个本地图标地址，有合法的content内容时，此属性无效，默认为http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png 蓝色标志
`content` | `String` | 点标记显示内容，可以是HTML要素字符串。content有效时，icon属性将被覆盖
`topWhenClick` | `Boolean` | 鼠标点击时marker是否置顶，默认false ，不置顶
`draggable` | `Boolean` | 设置点标记是否可拖拽移动，默认为false
`raiseOnDrag` | `Boolean` | 设置拖拽点标记时是否开启点标记离开地图的效果，默认为false
`zIndex` | `Number` | 点标记的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认zIndex：100
`title` | `String` | 鼠标滑过点标记时的文字提示，不设置则鼠标滑过点标无文字提示
`clickable` | `Boolean` | 点标记是否可点击，默认true
`extData` | `任意` | 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等


##### marker 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setClickable(clickable:Boolean )` | ` ` | 设置点标记是支持鼠标单击事件
`getPosition( )` | <a href="#Lnglat">`Lnglat`</a> | 获取点标记的位置
`setPosition(lnglat:Array)` | ` ` | 设置点标记位置例[116.082562,39.9329]
`setzIndex(index:Number)` | ` ` | 设置点标记的叠加顺序，默认最先添加的点标记在最底层
`hide( )` | ` ` | 点标记隐藏
`show( )` | ` ` | 点标记显示
`setContent(html:String|htmlDOM)` | ` ` | 设置点标记显示内容，可以是HTML要素字符串
`getContent( )` | `String` | 获取点标记内容
`moveAlong(path:Array, speed:Number, f:Function, circlable:Boolean)` | ` ` | 以指定的速度，点标记沿指定的路径移动。参数path为路径坐标串；speed为指定速度，单位：千米/小时；回调函数f为变化曲线函数，缺省为function(k){return k}；参数circlable表明是否循环执行动画，默认为false
`moveTo(lnglat:Array,speed:Number,f:Function)` | ` ` | 以给定速度移动点标记到指定位置。参数lnglat为指定位置，必设；speed为指定速度，单位：千米/小时；回调函数f为变化曲线函数，缺省为function(k){return k}
`stopMove( )` | ` ` | 点标记停止动画
`pauseMove()` | ` ` | 暂停点标记的动画效果
`resumeMove()` | ` ` | 重新开始点标记的动画效果
`setExtData(ext:Any)` | ` ` | 设置用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
`getExtData( )` | `任意` | 获取用户自定义属性

##### marker 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`rightclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标右键单击事件
`mousemove` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移动
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移进点标记时触发事件
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出点标记时触发事件
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在点标记上按下后抬起时触发事件
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在点标记上按下时触发事件
`dragstart` | <a href="#MapsEvent">`MapsEvent`</a> | 开始拖拽点标记时触发事件
`dragging` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标拖拽移动点标记时触发事件
`dragend` | <a href="#MapsEvent">`MapsEvent`</a> | 点标记拖拽移动结束触发事件
`moving` | `Object` | 点标记在执行moveTo，moveAlong动画时触发事件，Object对象的格式是{passedPath:Array.<LngLat>}。其中passedPath为Marker对象在moveAlong或者moveTo过程中已经走过的路径。
`moveend` | ` ` | 点标记执行moveTo动画结束时触发事件，也可以由moveAlong方法触发
`movealong` | ` ` | 点标记执行moveAlong动画一次后触发事件
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备

##### DrawTool.circle 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`center` | `Array` | 圆心位置，必填
`radius` | `Number` | 圆半径，单位:米,默认100
`zIndex` | `Number` | 圆的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认10
`strokeColor` | `String` | 外边界颜色，使用16进制颜色代码赋值。默认值为<span style="background-color:#3366FF;color:white">#3366FF[亮蓝色]</span>
`strokeOpacity` | `Number` | 外边界透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
`strokeWeight` | `Number` | 外边界宽度，单位：像素，默认1
`strokeStyle` | `String` | 外边界样式，实线:solid，虚线:dashed，默认solid
`fillColor` | `String` | 圆填充颜色，使用16进制颜色代码赋值。默认值为<span style="background-color:#FFAA00;color:white">#FFAA00[亮黄色]</span>
`fillOpacity` | `Number` | 圆填充透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
`extData` | `任意` | 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等

##### circle 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setCenter(lnglat:Array)` | ` ` | 设置圆的中心点
`getCenter( )` | <a href="#Lnglat">`Lnglat`</a> | 获取圆中心点
`getBounds( )` | <a href="#Bounds">`Bounds`</a> | 获取圆外切矩形范围
`setRadius(radius:Number)` | ` ` | 设置圆形的半径
`getRadius( )` | `Number` | 获取圆的半径
`setOptions(opt:circleOptions)` | ` ` | 修改圆的属性
`getOptions( )` | `Object` | 获取圆的属性
`hide( )` | ` ` | 圆隐藏
`show( )` | ` ` | 圆显示
`setExtData(ext:Any)` | ` ` | 设置用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
`getExtData( )` | `任意` | 获取用户自定义属性
`contains(point:Array)` | `Boolean` | 判断指定点坐标是否在圆内

##### circle 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`rightclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标右键单击事件
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标经过时触发事件
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出时触发事件
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标后抬起时触发事件
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标按下时触发事件
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备
`hide` | `{type, target}` | 隐藏事件
`show` | `{type, target}` | 显示事件
`change` | ` ` | 属性发生变化时

##### DrawTool.polyline 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`path` | `Array` | 折线的节点坐标数组，必填
`strokeColor` | `String` | 线条颜色，使用16进制颜色代码赋值。默认值为<span style="background-color:#3366FF;color:white">#3366FF[亮蓝色]</span>
`strokeOpacity` | `Number` | 线条透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
`strokeWeight` | `Number` | 线条宽度，单位：像素，默认3
`strokeStyle` | `String` | 线样式，实线:solid，虚线:dashed,默认实线
`zIndex` | `Number` | 折线的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认50
`extData` | `任意` | 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等

##### polyline 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setPath(path:Array)` | ` ` | 设置组成该折线的节点数组
`getPath( )` | `Array` | 获取折线路径的节点数组
`setOptions(opt:PolylineOptions)` | ` ` | 修改折线属性
`getOptions( )` | `Object` | 获取折线的属性
`hide( )` | ` ` | 折线隐藏
`show( )` | ` ` | 折线显示
`getLength( )` | `Number` | 获取折线的总长度（单位：米）
`getBounds( )` | <a href="#Bounds">`Bounds`</a> | 获取当前折线的矩形范围对象
`setExtData(ext:Any)` | ` ` | 设置用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
`getExtData( )` | `任意` | 获取用户自定义属性

##### polyline 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`rightclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标右键单击事件
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标经过时触发事件
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出时触发事件
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标后抬起时触发事件
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标按下时触发事件
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备
`hide` | `{type, target}` | 隐藏事件
`show` | `{type, target}` | 显示事件
`change` | ` ` | 属性发生变化时

##### DrawTool.polygon 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`path` | `Array` | 多边形的节点坐标数组，必填
`strokeColor` | `String` | 外边界颜色，使用16进制颜色代码赋值。默认值为<span style="background-color:#3366FF;color:white">#3366FF[亮蓝色]</span>
`strokeOpacity` | `Number` | 外边界透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
`strokeWeight` | `Number` | 外边界宽度，单位：像素，默认3
`strokeStyle` | `String` | 外边界样式，实线:solid，虚线:dashed，默认solid
`fillColor` | `String` | 多边形填充颜色，使用16进制颜色代码赋值。默认值为<span style="background-color:#FFAA00;color:white">#FFAA00[亮黄色]</span>
`fillOpacity` | `Number` | 多边形填充透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
`zIndex` | `Number` | 多边形的叠加顺序。地图上存在多个点标记叠加时，通过该属性使级别较高的点标记在上层显示，默认50
`extData` | `任意` | 用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等

##### polygon 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setPath(path:Array)` | ` ` | 设置组成该折线的节点数组
`getPath( )` | `Array` | 获取折线路径的节点数组
`setOptions(opt:PolygonOptions)` | ` ` | 修改多边形属性
`getOptions( )` | `Object` | 获取多边形的属性
`hide( )` | ` ` | 多边形隐藏
`show( )` | ` ` | 多边形显示
`getArea( )` | `Number` | 获取多边形的面积（单位：平方米）
`getBounds( )` | <a href="#Bounds">`Bounds`</a> | 获取当前折线的矩形范围对象
`setExtData(ext:Any)` | ` ` | 设置用户自定义属性，支持JavaScript API任意数据类型，如Marker的id等
`getExtData( )` | `任意` | 获取用户自定义属性
`contains(point:Array)` | `Boolean` | 判断指定点坐标是否在多边形范围内

##### polygon 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`rightclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标右键单击事件
`mousemove` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移动
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标经过时触发事件
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出时触发事件
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标后抬起时触发事件
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标按下时触发事件
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备
`hide` | `{type, target}` | 隐藏事件
`show` | `{type, target}` | 显示事件
`change` | ` ` | 属性发生变化时

##### DrawTool.massMarks 预设参数

例：

```
DrawTool.massMarks(
    data:Array,// data 为麻点数据，例 data: [{lnglat: [116.405285, 39.904989], name: i,id:1},{}, …]
    opts:Object// opts 为麻点参数，如下所示
    )
```

名称 | 参数类型 |说明
--------- | ------------- | -------------
`url` | `String` | 必填参数,图标的地址,默认为http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png 红色标志
`size` | `Array` | 必填参数，图标的尺寸，默认[10, 14]
`anchor` | `Array` | 必填参数，图标显示位置偏移量，以图标的左上角为基准点（0,0）点，默认[3, 7]
`zIndex` | `Number` | 图层叠加的顺序值，0表示最底层。默认5
`opacity` | `Number` | 图层的透明度，取值范围[0,1]，1代表完全不透明，0代表完全透明
`zooms` | `Array` | 支持的缩放级别范围，默认范围[3-18]，在PC上，取值范围为[3-18]；在移动设备上，取值范围为[3-19]
`alwaysRender` | `Boolean` | 表示是否在拖拽缩放过程中实时重绘，默认true，建议超过10000的时候设置false


##### massMarks 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setData(data:Object)` | ` ` | 设置massMark展现的数据集，数据集格式为：, data: Array 坐标数据集. 例：data: [{lnglat: [116.405285, 39.904989], name: i,id:1},{}, …],{}, …]}
`getData()` | `Object` | 输出massMark的数据集，数据结构同setDatas中的数据集
`hide( )` | ` ` | 麻点标记隐藏
`show( )` | ` ` | 麻点标记显示

##### massmarks 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`complete` | ` ` | 海量点加载完成事件
`click` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键单击事件
`dblclick` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标左键双击事件
`mouseover` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移入海量点图标时触发
`mouseout` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标移出海量点图标时触发
`mouseup` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在海量点图标上单击抬起时触发
`mousedown` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标在海量点图标上单击按下时触发
`touchstart` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸开始时触发事件，仅适用移动设备
`touchmove` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸移动进行中时触发事件，仅适用移动设备
`touchend` | <a href="#MapsEvent">`MapsEvent`</a> | 触摸结束时触发事件，仅适用移动设备

##### DrawTool.contextMenu 预设参数

例：

```
var menu = DrawTool.contextMenu({
                position:,
                content:,
                width:
            });
```

名称 | 参数类型 |说明
--------- | ------------- | -------------
`position` | `Array` | 右键菜单显示的位置，初始化一般不填，开启时传入参数
`content` | `String` | 右键菜单内容，初始化一般不填，调用方法增加
`width` | `Number` | 右键菜单宽度，初始化一般不填，会自动设置


##### contextMenu 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`addItem(text:String,fn:Function,num:Number)` | ` ` | 右键菜单中添加菜单项。参数text:菜单显示内容；fn：该菜单下需进行的操作；num：当前菜单项在右键菜单中的排序位置，以0开始
`removeItem(text:String,fn:Function)` | ` ` | 删除一个菜单项
`open(map:Map,position:Array)` | ` ` | 在地图的指定位置打开右键菜单。
`close( )` | ` ` | 关闭右键菜单

##### 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`open` | `{type, target}` | 右键菜单打开事件
`close` | `{type, target}` | 右键菜单关闭事件

### InfoWindow

例：

```
new MapTool(["Map","InfoWindow"],
        // 传入用户配置参数，非必填(组件内预设默认参数)；
        {
            InfoWindow:{
                center:[116.397428, 39.90923],
                zoom:12
                }
        }
    )

```

#### 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`isCustom` | `Boolean` | 是否自定义窗体。设为true时，信息窗体外框及内容完全按照content所设的值添加，默认false
`autoMove` | `Boolean` | 是否自动调整窗体到视野内（当信息窗体超出视野范围时，通过该属性设置是否自动平移地图，使信息窗体完全显示），默认true
`closeWhenClickMap` | `Boolean` | 控制是否在鼠标点击地图后关闭信息窗体，默认false
`content` | `String` | 显示内容，可以是HTML要素字符串
`offset` | `Array` | 相对于基点的偏移量
`position` | `Array` | 信息窗体显示基点位置
`showShadow` | `Boolean` | Boolean 控制是否显示信息窗体阴影，取值false时不显示窗体阴影，取值true时显示窗体阴影，默认false

#### 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`open(map:Map,pos:Array)` | ` ` | 在地图的指定位置打开信息窗体
`close( )` | ` ` | 关闭信息窗体
`setContent(content:String)` | ` ` | 设置信息窗体内容，可通过该函数动态更新信息窗体中的信息
`getContent( )` | `String` | 获取信息窗体内容 ，结果以字符串方式返回
`setPosition(lnglat:Array)` | ` ` | 设置信息窗体显示基点位置

#### 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`open` | ` ` | 信息窗体打开事件
`close` | ` ` | 信息窗体关闭事件
`change` | ` ` | 属性发生变化时

### District

例：

```
new MapTool(["Map","District"],
        // 传入用户配置参数，非必填(组件内预设默认参数)；
        {
            District:{
                level:"district",// 行政区级别或商圈，默认区县
                showbiz:true,// 是否显示商圈，默认值true
                extensions: "all",// 是否返回行政区边界坐标点
                subdistrict: 1// 显示下级行政区级数
                }
        }
    )

```

#### 预设参数

名称 | 参数类型 |说明
--------- | ------------- | -------------
`level` | `String` | 关键字对应的行政区级别或商圈，可选值：country：国家；province：省/直辖市；city：市；district：区/县；biz_area：商圈，默认"district"
`showbiz` | `Boolean` | 是否显示商圈，默认true
`extensions` | `String` | 是否返回行政区边界坐标点，默认all，返回完整行政区边界坐标点；取值：base，不返回行政区边界坐标点
`subdistrict` | `Number` | 显示下级行政区级数（行政区级别包括：国家、省/直辖市、市、区/县4个级别），商圈为区/县下一级 可选值：0(不返回下级行政区)、1(返回下一级行政区)、2(返回下两级行政区)、3(返回下三级行政区)默认1

#### 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`setLevel(level:String)` | ` ` | 设置关键字对应的行政区级别或商圈，可选值如上
`setSubdistrict(district:Number)` | ` ` | 设置下级行政区级数，可选值如上
`search(keywords:String ,callback:function(status:String,result:infoDistrictSearchResult), opts:DistrictSearchOptions )` | ` ` | 根据关键字查询行政区或商圈信息 关键字支持：行政区名、citycode、adcode、商圈名默认值：“全国”当status为complete时，result为DistrictSearchResult；当status为error时，result为错误信息info；当status为no_data时，代表检索返回0结果

#### 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`complete` | <a href="#DistrictSearchResult">`DistrictSearchResult`</a> | 查询成功时触发此事件
`error` | <a href="http://lbs.amap.com/api/javascript-api/reference/errorcode/">`ErrorStatus`</a> | 当查询失败时触发此事件

### MouseTool


#### 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`marker( options：MarkerOptions )` | ` ` | 开启鼠标画点标注模式。鼠标在地图上单击绘制点标注，标注样式参考MarkerOptions设置
`polyline( options：PolylineOptions )` | ` ` | 开启鼠标画折线模式。鼠标在地图上点击绘制折线，鼠标左键双击或右键单击结束绘制，折线样式参考PolylineOptions设置
`polygon( options：PolygonOptions )` | ` ` | 开启鼠标画多边形模式。鼠标在地图上单击开始绘制多边形，鼠标左键双击或右键单击结束当前多边形的绘制，多边形样式参考PolygonOptions设置  
`rectangle( options：PolygonOptions )` | ` ` | 开启鼠标画矩形模式。鼠标在地图上拉框即可绘制相应的矩形。矩形样式参考PolygonOptions设置
`rectZoomIn( options：PolygonOptions )` | ` ` | 开启鼠标拉框放大模式。鼠标可在地图上拉框放大地图。矩形框样式参考PolygonOptions设置
`rectZoomOut( options：PolygonOptions )` | ` ` | 开启鼠标拉框缩小模式。鼠标可在地图上拉框缩小地图。矩形框样式参考PolygonOptions设置
`close( Boolean)` | ` ` | 关闭当前鼠标操作。参数arg设为true时，鼠标操作关闭的同时清除地图上绘制的所有覆盖物对象；设为false时，保留所绘制的覆盖物对象。默认false

#### 事件

事件名称 | 参数 | 说明
--------- | ------------- | -------------
`draw` | `{type,obj}` | 鼠标工具绘制覆盖物结束时触发此事件，obj对象为绘制出来的覆盖物对象

### PolyEditor

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`get( polygon/polyline:Object )` | `editor:Object` | 返回一个对应的编辑对象实例

#### editor 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`open` |  | 打开编辑功能。 功能开启后，多边形/折线上显示可编辑点，其中不透明点为实际结点，鼠标左键单击该类节点可进行删除操作；半透明点为虚拟节点，单击该类节点将为多边形/折线新增结点；实际结点和虚拟节点均可进行拖动操作，以改变多边形/折线的形状
`close` |  | 关闭编辑功能

#### 事件

事件名称 | 返回参数 | 说明
--------- | ------------- | -------------
`addnode` | <a href="#MapsEvent">`MapsEvent`</a> | 通过鼠标在折线上增加一个节点或在多边形上增加一个顶点时触发此事件
`adjust` | <a href="#MapsEvent">`MapsEvent`</a> | 鼠标调整折线上某个节点或多边形上某个顶点的位置时触发此事件
`removenode` | <a href="#MapsEvent">`MapsEvent`</a> | 通过鼠标在折线上删除一个节点或在多边形上删除一个顶点时触发此事件
`end` | `{type,target}` | 在调用close方法时，触发该事件，target即为编辑后的折线/多边形对象

### Locate

#### 预设参数

名称 | 参数类型 | 说明
--------- | ------------- | -------------
`enableHighAccuracy` |  `Boolean` | 是否采用高精度，默认true
`timeout` |  `Number` | 超时毫秒数，默认无穷大
`GeoLocationFirst` |  `Boolean` | 设置为true的时候可以调整PC端为优先使用浏览器定位，失败后使用IP定位，默认false
`showButton` |  `Boolean` | 是否显示定位按钮，默认true
`buttonDom` |  `String` | 自定义定位按钮的内容。可支持HTML代码，不设置该属性则使用默认按钮样式
`showMarker` |  `Boolean` | 定位成功时是否在定位位置显示一个Marker默认true
`markerOptions` |  `markerOptions` | 定位点Marker的配置，不设置该属性则使用默认Marker样式
`showCircle` |  `Boolean` | 定位成功并且有精度信息时，是否用一个圆圈circle表示精度范围，默认true
`panToLocation` |  `Boolean` | 定位成功后，是否把定位得到的坐标设置为地图中心点坐标，默认true
`zoomToAccuracy` |  `Boolean` | 定位成功且显示精度范围时，是否把地图视野调整到正好显示精度范围，默认false

#### 实例方法

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`isSupported` | `Boolean` | 是否支持浏览器定位，当不支持是getCurrentPosition也会使用尝试进行精确IP定位
`getCurrentPosition(callback:function(status,result){})` |  | 获取用户当前的精确位置信息当回调函数中的status为complete的时候表示定位成功，result为<a href="#GeolocationResult">GeolocationResult</a>对象;当回调函数中的status为error的时候表示定位失败，result为<a href="#GeolocationError">GeolocationError</a>对象； callback的方式和事件监听的方式二者选择一种即可。

#### 事件

事件名称 | 参数 | 说明
--------- | ------------- | -------------
`complete` | <a href="#GeolocationResult">`GeolocationResult`</a> | 定位成功时触发此事件
`error` | <a href="#GeolocationError">`GeolocationError`</a> | 定位失败时触发此事件

### Events 事件绑定与解绑

针对Map、覆盖物等常用类，可以直接使用类的对象的on、off成员方法来实现事件的简单绑定和移除
例：

```

var marker = drawTool.marker();
marker.on("click",function(e){
    e.target.getPosition();
})

```

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`on(eventName, handler, context)` | ` ` | 注册事件，给Map或者覆盖物对象注册事件。eventName：事件名称（必填），handler：事件回调函数（必填），context：事件回调中的上下文（可选，缺省时，handler中this为调用on方法的对象本身，否则this指向context引用的对象）<br>**注意：多次绑定时，当eventName、handler函数对象、context对象有任意一个不一样就会再次绑定**
`off(eventName, handler, context)` | ` ` | 移除事件绑定。eventName：事件名称（必填），handler：事件功能函数（必填），context：事件上下文（可选，缺省时为调用off方法的对象本身，否则为context引用的对象）<br>**注意：只有当off与on的eventName、handler函数对象、context对象完全一致时才能有效移除监听**

#### Events

mouseTool等工具需要借助这一方法进行事件绑定。

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`on(target,eventName, handler, context)` | `EventListener` | 注册事件，给Map或者覆盖物对象注册事件。target：注册事件对象，eventName：事件名称（必填），handler：事件回调函数（必填），context：事件回调中的上下文（可选，缺省时，handler中this为调用on方法的对象本身，否则this指向context引用的对象）<br>**注意：多次绑定时，当eventName、handler函数对象、context对象有任意一个不一样就会再次绑定**
`off(listener)` | ` ` | 删除由上述`on`方法传回的指定侦听器


---


## 附录

### 事件触发返回的对象 MapsEvent

<a name="MapsEvent">MapsEvent</a>

此对象用于表示地图、覆盖物、叠加层上的各种鼠标事件返回，包含以下字段：

名称 | 类型 | 说明
--------- | ------------- | -------------
`lnglat` | `LngLat` | 发生事件时光标所在处的经纬度坐标
`type` | `String` | 事件类型
`target` | `Object` | 发生事件的目标对象

### 地理位置 Lnglat

<a name="Lnglat">Lnglat</a>

经纬度坐标，确定地图上的一个点。

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`getLng( )` | `Number` | 获取经度值
`getLat( )` | `Number` | 获取纬度值
`toString( )` | `String` | LngLat对象以字符串的形式返回

### 范围对象 Bounds

<a name="Bounds">Bounds</a>

地物对象的经纬度矩形范围。

方法名称 | 返回值 | 说明
--------- | ------------- | -------------
`contains(point：Array)` | `Boolean` | 指定点坐标是否在矩形范围内
`getCenter( )` | <a href="#Lnglat">`Lnglat`</a> | 获取当前Bounds的中心点经纬度坐标

### 定位返回结果对象 GeolocationResult

<a name="GeolocationResult">GeolocationResult</a>

属性 | 类型 | 说明
--------- | ------------- | -------------
`position` |  <a href="#Lnglat">`Lnglat`</a> | 定位结果
`accuracy` |  `Number` | 精度范围，单位：米
`location_type` |  `String` | 定位结果的来源，可能的值有:'html5'、'ip'、'sdk'
`message` |  `String` | 形成当前定位结果的一些信息
`isConverted` |  `Boolean` | 是否经过坐标纠偏
`info` |  `String` | 状态信息 "SUCCESS"
`formattedAddress` |  `String` | 地址
`addressComponent` |  <a href="#addressComponent">`addressComponent`</a> | 地址信息

### 定位失败返回结果 GeolocationError

<a name="GeolocationError">GeolocationError</a>

属性 | 类型 | 说明
--------- | ------------- | -------------
`message` |  `String` | 造成定位失败结果的一些有用信息
`info` |  `String` | 错误信息 `NOT_SUPPORTED` 不支持定位；`FAILED`定位失败，具体原因见`message`

### 行政区查询结果 DistrictSearchResult

<a name="DistrictSearchResult">DistrictSearchResult</a>

属性 | 类型 | 说明
--------- | ------------- | -------------
`name` | `String` | 行政区名称
`center` | <a href="#Lnglat">`Lnglat`</a> | 城市中心点经纬度坐标
`citycode` | `String` | 行政编码
`adcode` | `String` | 区域编码
`level` | `String` | 行政区级别
`boundary` | `Array`<a href="#Lnglat">`[Lnglat]`</a> | extensions为“all”时，行政区边界坐标集合若行政区包含群岛，则坐标点为各岛的边界，岛间边界经纬度使用"\|"分隔
`districtList` | `Array`<a href="#Lnglat">`[Lnglat]`</a> | 下级行政区信息列表,subdistrict 为0时，不返回该对象


