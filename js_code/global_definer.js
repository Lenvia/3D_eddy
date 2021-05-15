/**
 * 预设全局变量
 */
const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = edgeLen;  // 地形宽度
const cameraHeight = 3000;  // 相机高度
const scaleHeight = 20*edgeLen/200000; //高度缩放倍数
var boxHeight = 4000*scaleHeight;  // 海底深度（默认为4000m）
var tubeHeightFactor = 500;  // 控制流管高度

var stepLimit = 60;  // 暂定60为最大天数
var loadStepNum = 1;  // 3d流线加载多少天
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
var lastStep;  // 上一时间步
var currentMainIndex;  // 当前涡旋标签
var existedEddyIndices = [];  // 场上存在的涡旋的index
var currentMainName;  // 当前被选中的涡旋编号（currentMainStep与currentMainIndex的结合）
var currentAttr;  // 当前属性

/**
 * 预加载变量
 */
// 本地加载
var depth_array;  // 深度数组，dpeth_array[i]表示第i层的高度
var re_depth = new Map();  // 反向映射，通过高度映射第几层

var gui_container = document.getElementById('gui');


/**
 * 更新信号
 */
// 主窗口触发
var pickMode = false;  // 主窗口进入选择模式
var streamlineClickSign = 0;  // 主窗口选择涡旋
var switchTimeSign = false;  // 如果为true，表示时间已改变

var loadFinished = 0;  // 主窗口流线加载完毕


// 局部窗口触发
var requirePick = false;  // 请求流线视图移动相机和染色指示器

var dyeSign = false;  // 提醒主窗口去染色



loadDepth();  // 加载深度数组

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