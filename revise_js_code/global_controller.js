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

var pickInfo = [];  // 鼠标最近的涡旋的下标、中心坐标


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

    eddyIdentifiers.forEach(function(item, index){
        $("#eddy-selector").append("<option value='"+String(item)+"'>"+String(item)+"</option>");
    });

    $("#sizeMap-selector").val(15);
    $("#sizeMap-selector").change();

    currentMainStep = -1;
    lastStep = -1;
    currentAttr = "OW";

    topo_yAxis = $("#yAxis-selector").val();
    topo_sizeMap = $("#sizeMap-selector").val();
    topo_showLabel = $("#showLabel").is(':checked');
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


    // 属性频率统计图更新
    updateAttrFrequency();

    // let std = OW_std[currentMainStep].toExponential(6);
    // $("#std-label").html("OW_std: "+ String(std));
    // // OW_std刷新
    // if(currentAttr=="OW"){
    //     document.getElementById("std-label").style.display="block";
    // }
    // else{
    //     document.getElementById("std-label").style.display="none";//不可见
    // }
    
})

$("#index-selector").change(function(){
    currentMainIndex = parseInt($(this).val());

    if(currentMainStep==-1 || currentMainIndex== -1) return ;

    currentMainName = String(currentMainStep) + '-' + String(currentMainIndex);


    console.log("currentMainName: ", currentMainName);

    // 通知检测页面更新数据
    // 检测页面更新数据（可能会有冲突）
    loadDectData(currentMainStep);
    detection_window.setOption({
        series: {data: detection_data}
    })

    // 更改选择器，但不触发更新
    $("#eddy-selector").val(state2identifier.get(currentMainName));

    // 通知拓扑页面更新数据
    loadTopoData(currentMainName);
    flushTopo();
})

// 涡旋标识符选择器触发
$("#eddy-selector").change(function() {

    currentEddyIdentifier = parseInt($(this).val());

    var name = identifier2name.get(currentEddyIdentifier);
    var d = parseInt(name.split("-")[0]);
    var index = parseInt(name.split("-")[1]);

    // 并不能主动触发index选择器变化
    $("#step-selector").val(-1);
    $("#step-selector").val(d);
    $("#step-selector").change();

    // 手动触发
    $("#index-selector").val(-1);
    $("#index-selector").val(index);
    $("#index-selector").change();

    // 流线页面刷新流线
    switchTimeSign = true;

    // 检测页面更新背景
    changeBackground(currentMainStep);


    // 属性频率统计图更新
    updateAttrFrequency();

    // let std = OW_std[currentMainStep].toExponential(6);
    // $("#std-label").html("OW_std: "+ String(std));
    // // OW_std刷新
    // if(currentAttr=="OW"){
    //     document.getElementById("std-label").style.display="block";
    // }
    // else{
    //     document.getElementById("std-label").style.display="none";//不可见
    // }
    
})


$("#attribute-selector").change(function(){
    currentAttr = $(this).val();
    updateAttrFrequency();

    let std = OW_std[currentMainStep].toExponential(6);
    $("#std-label").html("OW_std: "+ String(std));
    // OW_std刷新
    if(currentAttr=="OW"){
        document.getElementById("std-label").style.display="block";
    }
    else{
        document.getElementById("std-label").style.display="none";//不可见
    }

    $("#lower-bound").val(0);
    $("#upper-bound").val(0);
})


$("#yAxis-selector").change(function(){
    topo_yAxis = $(this).val();
    flushTopo();
})

$("#sizeMap-selector").change(function(){
    topo_sizeMap = parseFloat($(this).val());
    // console.log(topo_sizeMap);
    flushTopo();
})

$("#showLabel").change(function(){
    topo_showLabel =  $('#showLabel').is(':checked');
    flushTopo();
})

$("#pick").change(function(){
    pickMode = $('#pick').is(':checked');
    console.log(pickMode);
})

/**
 * 隐藏组件绑定js变量触发
 */

 $("#detectionClickSign").change(function(){
    if($("#detectionClickSign").val()=="0")
        return ;
    
    // 刷新两个窗口
    var step = parseInt(currentMainName.split('-')[0]);
    var index = parseInt(currentMainName.split('-')[1]);

    $("#step-selector").val(step);
    $("#step-selector").change();

    $("#index-selector").val(index);
    $("#index-selector").change();
    

    highlightNode(index);

    // $("#step-selector").change() 会让streamline视图加载，加载完毕后触发更新
})

$("#topoClickSign").change(function(){
    if($("#topoClickSign").val()=="0")
        return ;
    
    // 刷新两个窗口
    var step = parseInt(currentMainName.split('-')[0]);
    var index = parseInt(currentMainName.split('-')[1]);

    $("#step-selector").val(step);
    $("#step-selector").change();

    $("#index-selector").val(index);
    $("#index-selector").change();
    

    highlightNode(index);

})

$("#streamlineClickSign").change(function(){
    if($("#streamlineClickSign").val()=="0")
        return ;
    
    // 刷新两个窗口
    var step = parseInt(currentMainName.split('-')[0]);
    var index = parseInt(currentMainName.split('-')[1]);

    $("#index-selector").val(index);
    $("#index-selector").change();

    highlightNode(index);

    streamlineClickSign = 0;
    $("#streamlineClickSign").val(0);
    $("#streamlineClickSign").change();

})

$("#loadFinished").change(function(){
    if($("#loadFinished").val()=="0")
        return;

    if(topoClickSign==1 || detectionClickSign ==1){
        // 刷新两个窗口
        var step = parseInt(currentMainName.split('-')[0]);
        var index = parseInt(currentMainName.split('-')[1]);
        // 在流线视图中移动相机
        pickInfo = [index, eddyInfo[step][index][0], eddyInfo[step][index][1]];
        requirePick = true;


        topoClickSign = 0;
        $("#topoClickSign").val(0);
        $("#topoClickSign").change();
        detectionClickSign = 0;
        $("#detectionClickSign").val(0);
        $("#detectionClickSign").change();
    }
    

    $("#loadFinished").val(0);
    $("#loadFinished").change();
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
        yAxis: {
            name: topo_yAxis,
        },
        series: {
            label: {
                show: topo_showLabel,
            },
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
                    item[10], 
                    item[11]
                ];
            }),
            links: topo_edges,
            symbolSize: topo_sizeMap,
        }
    });
}


function highlightNode(index){
    detection_data[index][detection_field_indices['selected']] = 1;
    // 将detction窗口对应节点染色，再次刷新
    detection_window.setOption({
        series: {data: detection_data}
    })
}