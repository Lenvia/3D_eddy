/*
    整个html下的全局变量
*/

const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = edgeLen;  // 地形宽度
const scaleHeight = 0.5; //缩放高度

// 主界面变量
var is3d = true;
var sea;  // 海
var channel;  // 峡谷地形
var surface;  // 表面陆地
var land_2d;  // 2d

var biasZ = 2000;  // 海底山脉向下移动（默认为2000，如果生成地形这个值会更新）
var depth_array;  // 深度数组，dpeth_array[i]表示第i层的高度
var re_depth = new Map();  // 反向映射，通过高度映射第几层

var currentMainDay;  // （主面板）当前日期
var lastDay;  // （主面板）上一日

var day_ctrl;
var dynamic = false;  // 默认不准动

var progress_bar;
var draggable_point;

var dayLimit = 60;  // 暂定60为最大天数
var play_start_day = 0;  // 播放器起点（默认为0）
var loadDayNum = 3;  // 3d流线加载多少天
var tex_pps_day = 10;  // 2d和pps加载天数

var appearFolder;
var attrFolder;
var colorFolder;
var opaFolder;
var funcFolder;

var whole_models = [];
var local_models = [];

var topo_container = document.getElementById('topo-container');
var echarts_container = document.getElementById('echarts-container');
var echarts_window = echarts.init(echarts_container);


var tarArr = [];  // 鼠标最近的涡旋的下标、中心坐标




var existedEddyIndices = [];  // 场上存在的涡旋的index

var eddyFeature;  // 涡核信息数组

var network;  // 拓扑图

// 更新信号
// 主窗口触发
var pitchUpdateSign = false;  // 主窗口选择涡旋了
var switchUpdateSign = false;  // 如果为true，表示主界面切换日期而引起局部涡旋的更新


// 局部窗口触发
var restrainUpdateSign = false;  // 如果为true，说明是由局部窗口改变的日期，这里不能再反过来清除局部窗口的元素
var dyeSign = false;  // 提醒主窗口去染色

// DOM组件绑定函数信号
var showNextEddiesSign = false;  // DOM点击响应标记，用来控制localEddy.js中showNextEddies()函数
var showPreEddiesSign = false;  // showPreEddiesSign()响应
var playActionSign = false;  // DOM点击响应标记，表示播放迹线
var pauseActionSign = false;  // 暂停播放
var topoClickSign = false;  // 鼠标点击了拓扑图节点



// 加载深度数组
loadDepth();
// 加载涡核信息数组
loadEddyFeatures();

/*
    预加载
*/
function loadDepth(){
    var depth_path = ("./resources/depth.json");
    var json_data;
    $.ajax({
        url: depth_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) {//请求成功完成后要执行的方法 
            json_data = res;
            depth_array = json_data["depth"];

            // 反向映射
            for(let i=0; i<depth_array.length; i++){
                re_depth.set(depth_array[i], i);
            }
            // console.log(re_depth);
        }
    })
}

function loadEddyFeatures(){
    var eddis_feature_path = ("./resources/features/features.json");
    
    $.ajax({
        url: eddis_feature_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            eddyFeature = res;  // 包含三个字段：info, forward, backward。其中info[天数][下标] = [cx, cy, area, bx, by, br]
            // console.log(eddyFeature);
        }
    })
}

/*
    触发函数
*/

function changeView(){
    // 这个顺序不能倒
    switchView(); 
    flashDay();
}

function flashDay(){
    // 直接setValue也会改变currentMainDay的值
    var temp = currentMainDay;
    day_ctrl.setValue(-1);
    day_ctrl.setValue(temp);
}

function switchView(){
    if(is3d){
        is3d = false;  // 切换成2d

        echarts_container.style.zIndex = 1;
        topo_container.style.zIndex = 2;

        if(sea!=undefined)
            sea.visible = false;
        if(surface!=undefined)
            surface.visible = false;
        if(channel!=undefined)
            channel.visible = false;
        if(land_2d!=undefined)
            land_2d.visible = true;

        

        appearFolder.domElement.style="display:none;";
        colorFolder.domElement.style="display:none;";
        opaFolder.domElement.style="display:none;";
        attrFolder.domElement.style="display:none;";
        funcFolder.domElement.style="display:none;";

    }
    else{
        is3d = true;

        echarts_container.style.zIndex = 2;
        topo_container.style.zIndex = 1;

        if(sea!=undefined)
            sea.visible = true;
        if(surface!=undefined)
            surface.visible = true;
        if(channel!=undefined)
            channel.visible = true;
        if(land_2d!=undefined)
            land_2d.visible = false;
        
        
        
        appearFolder.domElement.style="display:";
        colorFolder.domElement.style="display:";
        opaFolder.domElement.style="display:";
        attrFolder.domElement.style="display:";
        funcFolder.domElement.style="display:";
    }
}


//numberMillis 毫秒
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}

function updateEcharts(attr, d){
    if(d==-1)
        return ;
    // exp: ./echarts/OW/OW_0.json
    var attr_data_path = ("./echarts/".concat(attr, "/", attr, "_", d, ".json"));

    console.log(attr_data_path);
    
    $.ajax({
        url: attr_data_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            // 指定图表的配置项和数据
            var option = {
                title: {
                    text: attr+"_"+d
                },
                tooltip: {},
                legend: {  // 图例
                    // data:['销量']
                },
                xAxis: {
                    data: res['columns'],
                },
                yAxis: {},
                series: [{
                    // name: '属性值',
                    type: 'bar',
                    data: res['values']
                }]
            };

            // 使用刚指定的配置项和数据显示图表。
            echarts_window.setOption(option);
        }
    })
}

function deleteModel(mod){
    if(mod==undefined)
        return ;
    mod.geometry.dispose(); //删除几何体
    mod.material.dispose(); //删除材质
}

// 暂时先用最简单的点距
function getDisdance(px1, py1, px2, py2){
    return Math.pow((px1-px2), 2) + Math.pow((py1-py2), 2);
}

// 找出当前位置最近的涡旋
function getNearestEddy(px, py){
    var minDis = 250000; // 最大不会超过250000的
    var minIndex = undefined;
    var tarCpx, tarCpy;

    if(currentMainDay<0)
        return;
    var info = eddyFeature['info'][currentMainDay];
    for(let i=0; i<info.length; i++){

        var px2 = info[i][0];
        var py2 = info[i][1];
        var currentDis = getDisdance(px, py, px2, py2);
        // console.log(i, currentDis);

        if(minDis>currentDis){
            minDis = currentDis;
            minIndex = i;
            tarCpx = px2;
            tarCpy = py2;
        }
    }
    return new Array(minIndex, tarCpx, tarCpy);
}

// 对于第d天的index下标涡旋进行追踪，返回一个数组，表示下一天该涡旋的延续
function track(d, index){
    var dayForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
    return dayForwardsList[index];  // 返回index下标的延续下标集合
}

// 追踪d天时 curList所有涡旋的延续，并将所有结果放在一个数组中，并去重
// curList存储的都是第d天的下标
function trackAll(curList, d){
    var result = [];
    var dayForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
    for(let i=0; i<curList.length; i++){
        // console.log(dayForwardsList[curList[i]]);
        result = result.concat(dayForwardsList[curList[i]]);
    }
    // console.log(result);
    return dedupe(result);
}

function backtrackAll(curList, d){
    var result = [];
    var dayBackwardsList = eddyFeature['backward'][d];
    for(let i =0; i<curList.length; i++){
        result = result.concat(dayBackwardsList[curList[i]]);
    }
    return dedupe(result);
}

// 数组去重
function dedupe(array){
    return Array.from(new Set(array));
    //这里的 Array.from（）方法是将两类对象转为真正的数组：类似数组的对象和可遍历的对象（包括es6新增的数据结构Set和Map）
}

/**
 * 坐标转换函数集合！
 */

//转换后的xyz到数组i,j,k的映射
function xyz2ijk(x, y, z){
    var orix = x/edgeLen + 0.5;
    var oriy = y/edgeWid + 0.5;
    var oriz = -z/scaleHeight;


    var i = Math.floor(orix/0.002);
    var j = Math.floor(oriy/0.002);
    var k = re_depth.get(oriz);
    // console.log(oriz);

    return new Array(i, j, k);
}

// 经度、纬度、深度转xyz
// 这里的坐标就代表三维坐标轴里的
function lll2xyz(lon, lat, level){
    var x = ((lon - 30.2072)/20 -0.5)*edgeLen;  // 20是经度跨度（下面纬度跨度 数据中也是20）
    var y = ((lat - 10.0271)/20 -0.5)*edgeWid;
    // var z = -depth_array[level];
    var z = 0;  // 还是用0吧

    return new Array(x, y, z);
}

// 传递过来的鼠标坐标mx,my 到panel中的px,py（panel大小为500*500）
// 这里mx my和在三维坐标轴里的x y含义一样
function mxy2pxy(mx, my){
    var px = (mx/edgeLen+0.5)*500;
    var py = (my/edgeWid+0.5)*500;

    // console.log("mx, my:",mx, my)
    // console.log("px, py:",px, py)
    return new Array(px, py);
}

// panel中的px py到坐标轴的x y
function pxy2xy(px, py){
    var x = (px/500 - 0.5)*edgeLen;
    var y = (py/500 - 0.5)*edgeWid;
    return new Array(x,y);
}

/**
 * 来自DOM触发的信号
 */
// 标记开放函数
function openShowNextEddiesSign(){
    showNextEddiesSign = true;
}
function openShowPreEddiesSign(){
    showPreEddiesSign = true;
}


function openPlayActionSign(){
    playActionSign = true;
}

function openPauseAction(){
    pauseActionSign = true;
}

// 获得DOM的style
function getStyle(obj,attr){
    if(obj.currentStyle){//兼容IE
            return obj.currentStyle[attr];
    }else{
            return getComputedStyle(obj,false)[attr];
    }
}