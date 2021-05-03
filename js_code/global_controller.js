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


initToolbar();  // 初始化工具栏
 
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