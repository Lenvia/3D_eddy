/**
 * 流线界面变量
 */
// 流线界面参数
var dynamic = false;  // 默认不准动





// 流线界面模型
var sea;  // 海
var seaFrame;  // 海框架
var channel;  // 峡谷地形
var surface;  // 表面陆地
var land_2d;  // 2d




/**
 * 主副窗口共享变量
 */

var tarArr = [];  // 鼠标最近的涡旋的下标、中心坐标【从主窗口触发】


init();

function init(){
    initToolbar();  // 初始化工具栏
    topoInit();
    pathInit();
    parallelInit();
    detectionInit();
}

 
function initToolbar(){
    exSteps.forEach(function(item, index){
        $("#step-selector").append("<option value='"+String(item)+"'>"+String(item)+"</option>");
    });
    currentMainStep = -1;
    lastStep = -1;

    topo_yAxis = $("#yAxis-selector").val();
    topo_sizeMap = $("#sizeMap-selector").val();
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

    // 流线页面刷新流线
    switchTimeSign = true;

    // 检测页面更新背景
    changeBackground(currentMainStep);

    // 检测页面更新数据（可能会有冲突）
    loadDectData(currentMainStep);
    detection_window.setOption({
        series: {data: detection_data}
    })
})

$("#index-selector").change(function(){
    currentMainIndex = parseInt($(this).val());

    if(currentMainStep==-1 || currentMainIndex== -1) return ;

    currentMainName = String(currentMainStep) + '-' + String(currentMainIndex);


    console.log("currentMainName: ", currentMainName);

    // 通知检测页面更新数据

    // 通知拓扑页面更新数据
    loadTopoData(currentMainName);
    flushTopo();

    
})

$("#yAxis-selector").change(function(){
    topo_yAxis = $(this).val();
    flushTopo();
})

$("#sizeMap-selector").change(function(){
    topo_sizeMap = $(this).val();
})


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

function flushTopo(){
    topo_window.setOption({
        series: {
            data:topo_data.map(function (item, idx) {
                return [
                    item[0],
                    item[topo_field_indices[topo_yAxis]],  // y轴的值
                    // item[topo_field_indices[topo_sizeMap]],
                    item[3],  // 舍弃sizeMap后，这个暂时用不到
                    item[1],
                    item[2],
                    item[3],
                    item[4],
                    item[5],
                    item[6], 
                    item[7], 
                    item[8],
                    item[9],
                    // idx
                ];
            }),
            links: topo_edges,
        }
    });
}