/**
 * echarts 共享变量
 */
var cycNodeColor = "#ce5c5c";  // 气旋颜色，红色
var anticycNodeColor = "#51689b";  // 反气旋颜色，蓝色
var cycFlag = '气旋';
var anticycFlag = '反气旋';

/**
 * 预加载共享数组
 */

var eddyFeature;  // 涡核信息数组
var eddyInfo;
var eddyForwards;
var eddyBackwards;
var liveInfo;

// 预设路径
var root_pic_path = './resources/detect_pic/';  // detection背景根路径


/**
 * 组件绑定（容器内部各自的gui自己管理）
 */

var detection_container = document.getElementById('detection-container');
var detection_window = echarts.init(detection_container);

var frequency_container = document.getElementById('frequency-container');
var frequency_window = echarts.init(frequency_container);

var path_container = document.getElementById('path-container');
var path_window = echarts.init(path_container);

var topo_container = document.getElementById('topo-container');
var topo_window = echarts.init(topo_container);

var parallel_container = document.getElementById('parallel-container');
var parallel_window = echarts.init(parallel_container);




loadEddyFeatures();  // 加载涡核信息数组

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

function getCurColor(d, index){
    var temp = eddyInfo[d][index][6];  // 气旋方向
    if(temp==1)
        return cycNodeColor;
    else return anticycNodeColor;
}


function getCurColorByLive(live){
    var color = '#ff' + live2Hex(live) + '00';
    // console.log(color);
    return color;
}

function live2Hex(live){
    live = parseInt(256 - live*256/60);
    if(live<16){
        return '0' + live.toString(16);
    }
    else return live.toString(16);
}