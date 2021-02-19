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
var day_ctrl;
var dynamic = false;  // 默认不准动
var progress_bar;
var draggable_point;
var Timer;

var play_start_day = 0;  // 播放器起点（默认为0）
var loadDayNum = 5;  // 加载多少天

var appearFolder;
var attrFolder;
var colorFolder;
var opaFolder;
var funcFolder;

var whole_models = [];
var local_models = [];






var selected_pos = undefined;  // 被选中的pos，在singleEddy中查询是否有合适的进行显示
// 更新信号
// 仅selected_pos不为空还不行，必须updateSign也为true才能更新，并且更新后updateSign要设置为false。
// 当主窗口再次有效点击后才能把updateSign设置为true
var updateSign = false;

var eddyInfo;  // 涡核信息数组




// 加载深度数组
loadDepth();
// 加载涡核信息数组
loadEddyInfo();




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


function loadEddyInfo(){
    var eddis_info_path = ("./resources/track/eddies.json");
    
    $.ajax({
        url: eddis_info_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            eddyInfo = res;
        }
    })
}


/*
    转换后的xyz到数组i,j,k的映射
*/
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
function lll2xyz(lon, lat, level){
    var x = ((lon - 30.2072)/20 -0.5)*edgeLen;  // 20是经度跨度（下面纬度跨度 数据中也是20）
    var y = ((lat - 10.0271)/20 -0.5)*edgeWid;
    // var z = -depth_array[level];
    var z = 0;  // 还是用0吧

    return new Array(x, y, z);
}


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



function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}

function playAction() {
    console.log(Timer);
    
    var startDay = play_start_day;
    console.log(play_start_day);
    if(is3d){
        var oriDy = dynamic;  // 原始dynamic
        dynamic = true;  // 不管是不是dy，先设置成动态

        let i=startDay;
        day_ctrl.setValue(i);  // 先执行一次

        Timer = setInterval(function(){
            console.log(i+1);
            if(i+1<loadDayNum){
                i++;
                progress_bar.style.width = i/loadDayNum*100 + "%";
                draggable_point.style.left = i/loadDayNum*100 + "%";


                day_ctrl.setValue(i);
            }
            else{
                dynamic = oriDy;
                clearInterval(Timer);
            }
        },5000);
    }
}

function pauseAction(){
    clearInterval(Timer);
}