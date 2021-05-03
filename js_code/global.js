/**
 * 预设全局变量
 */
const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = edgeLen;  // 地形宽度
const scaleHeight = 20*edgeLen/200000; //高度缩放倍数
var boxHeight = 4000*scaleHeight;  // 海底深度（默认为4000m）
var tubeHeightFactor = 500;  // 控制流管高度

var stepLimit = 60;  // 暂定60为最大天数
var loadStepNum = 2;  // 3d流线加载多少天
var tex_pps_step = 60;  // 2d和pps加载天数



// 步数
const steps = [];  // 一共60步
const exSteps = [-1]; // 扩展步数，第一个是-1
for (var i =0; i<=59; i++){
    steps.push(i);
    exSteps.push(i);
}
var eddyIndices = [];

// 全局共享变量
var currentMainStep;  // 当前时间步
var currentMainIndex;  // 当前涡旋标签


/**
 * 预加载变量
 */
// 本地加载
var depth_array;  // 深度数组，dpeth_array[i]表示第i层的高度
var re_depth = new Map();  // 反向映射，通过高度映射第几层


var gui_container = document.getElementById('gui');


/**
 * 流线界面变量
 */
// 流线界面参数
var dynamic = false;  // 默认不准动

var lastStep;  // 上一日



// 流线界面模型
var sea;  // 海
var seaFrame;  // 海框架
var channel;  // 峡谷地形
var surface;  // 表面陆地
var land_2d;  // 2d

// 流线界面模型存放
var whole_models = [];


/**
 * 主副窗口共享变量
 */
var existedEddyIndices = [];  // 场上存在的涡旋的index
var tarArr = [];  // 鼠标最近的涡旋的下标、中心坐标【从主窗口触发】



/**
 * 更新信号
 */
// 主窗口触发
var pickUpdateSign = false;  // 主窗口选择涡旋了

var switchTimeSign = false;  // 如果为true，表示时间已改变


// 局部窗口触发
var restrainUpdateSign = false;  // 如果为true，说明是由局部窗口改变的时间步，这里不能再反过来清除局部窗口的元素
var dyeSign = false;  // 提醒主窗口去染色
// DOM组件绑定函数信号
var topoClickSign = false;  // 鼠标点击了拓扑图节点




loadDepth();  // 加载深度数组
loadEddyFeatures();  // 加载涡核信息数组

initToolbar();


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
    var eddies_feature_path = ("./resources/features/features.json");
     
    $.ajax({
        url: eddies_feature_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
        eddyFeature = res;  // 包含三个字段：info, forward, backward。其中info[天数][下标] = [cx, cy, ......]
        eddyInfo = eddyFeature['info'];
        eddyForwards = eddyFeature['forward'];  // 向未来追踪
        eddyBackwards = eddyFeature['backward'];  // 向以前回溯
        }
    })

    var live_path = ("./resources/features/live.json");
    $.ajax({
        url: live_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            liveInfo = res;
        }
    })
}
 
function initToolbar(){
    
    exSteps.forEach(function(item, index){
        $("#step-selector").append("<option value='"+String(item)+"'>"+String(item)+"</option>");
    });
    currentMainStep = -1;
    lastStep = -1;
}

/**
 * 全局触发
 */

// 时间步长选择器触发
$("#step-selector").change(function() {

    lastStep = currentMainStep;
    currentMainStep = parseInt($(this).val());

    // 清空index选择器
    $("#index-selector").empty();
    // 从info中添加index
    for(let i=0; i<eddyInfo[currentMainStep].length; i++){
        eddyIndices.push(i);
        $("#index-selector").append("<option value='"+String(i)+"'>"+String(i)+"</option>");
    }

    if(currentMainStep==-1) return ;

    // 并不能主动触发index选择器变化
    // 手动触发
    $("#index-selector").val(-1);
    $("#index-selector").val(0);
    $("#index-selector").change();

    // 通知流线页面刷新流线
    switchTimeSign = true;

    // 通知检测页面更新背景
    changeBackground(currentMainStep);
})

$("#index-selector").change(function(){
    currentMainIndex = parseInt($(this).val());

    if(currentMainStep==-1 || currentMainIndex== -1) return ;

    

    console.log("currentMainIndex: ", currentMainIndex);

    // 通知检测页面更新数据

    // 通知拓扑页面更新数据

})


/*
    辅助函数
*/


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


function deleteModel(mod){
    if(mod==undefined)
        return ;
    mod.geometry.dispose(); //删除几何体
    mod.material.dispose(); //删除材质
    // console.log(mod);
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

    if(currentMainStep<0)
        return;
    var info = eddyFeature['info'][currentMainStep];
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
    var stepForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
    return stepForwardsList[index];  // 返回index下标的延续下标集合
}

// 追踪d天时 curList所有涡旋的延续，并将所有结果放在一个数组中，并去重
// curList存储的都是第d天的下标
function trackAll(curList, d){
    var result = [];
    var stepForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
    for(let i=0; i<curList.length; i++){
        // console.log(stepForwardsList[curList[i]]);
        result = result.concat(stepForwardsList[curList[i]]);
    }
    // console.log(result);
    return dedupe(result);
}

function backtrackAll(curList, d){
    var result = [];
    var stepBackwardsList = eddyFeature['backward'][d];
    for(let i =0; i<curList.length; i++){
        result = result.concat(stepBackwardsList[curList[i]]);
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
    var oriz = parseFloat((-z/scaleHeight).toFixed(1));


    var i = Math.floor(orix/0.002);
    var j = Math.floor(oriy/0.002);
    var k = re_depth.get(oriz);

    if(k==undefined)
        console.log(oriz)
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

    console.log("mx, my:",mx, my)
    console.log("px, py:",px, py)
    return new Array(px, py);
}

// panel中的px py到坐标轴的x y
function pxy2xy(px, py){
    var x = (px/500 - 0.5)*edgeLen;
    var y = (py/500 - 0.5)*edgeWid;
    return new Array(x,y);
}



// 获得DOM的style
function getStyle(obj,attr){
    if(obj.currentStyle){//兼容IE
        return obj.currentStyle[attr];
    }else{
        return getComputedStyle(obj,false)[attr];
    }
}


/**
 * json 数组属性get
 */


function getCurPos(d, index){
    return [eddyInfo[d][index][0], eddyInfo[d][index][1]];
}

function getCurRadius(d, index){
    return eddyInfo[d][index][2]  // 半径
}

function getCurEke(d, index){
    return eddyInfo[d][index][3];  // 动能
}

function getCurAveEke(d, index){
    return eddyInfo[d][index][4];  // 平均动能
}

function getCurVort(d, index){
    return eddyInfo[d][index][5];  // 涡度
}

function getCurCirc(d, index){
    var temp = eddyInfo[d][index][6];  // 气旋方向
    if(temp==1)
        return cycFlag;
    else return anticycFlag;
}


/**
 * 局部容器jquery触发
 */

function changeBackground(step){
    var pic_path = root_pic_path+'step'+String(step)+'.png';

    $("#detection-container").css({
        "background-image":"url(" + pic_path + ")",
        "background-repeat": "no-repeat",
        "background-size" :"100% 100%",
        "-moz-background-size": "100% 100%",
    });
}