// var container = document.getElementById('container');
var cycNodeColor = "#ce5c5c";  // 气旋颜色，红色
var anticycNodeColor = "#51689b";  // 反气旋颜色，蓝色
var cycFlag = '气旋';
var anticycFlag = '反气旋';



var path_gui;
var path_gui_opt;
var scaleFactor = 1;


var path_option;




var tex_pps_day = 60;

var data = [];
var edges = [];
var index_arr = [];
for(let i=0; i<40; i++){
    index_arr.push(i);
}

var existedNodesMap = new Map();

var schema = [
    {name: 'cx', index: 0, text:'cx'},
    {name: 'cy', index: 1, text:'cy'},
    {name: 'radius', index: 2, text:'radius'},
    {name: 'circ', index: 3, text:'circ'},
    {name: 'color', index: 4, text:'color'},
    {name: 'name', index: 5, text:'name'},
    {name: 'live', index: 6, text:'live'},
];

// 便于通过name来找index
var fieldIndices = schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});




init();

function init(){


    loadAll();

    
    path_window.setOption(path_option = getOption(data));

    

    var guiTopoContainer = document.getElementById('gui_path');
    guiTopoContainer.appendChild(path_gui.domElement);
    path_container.appendChild(guiTopoContainer);
}





function loadAll(){
    data = [];
    edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curDepth, curVort,  curCirc, curColor, curFontColor;
    var nextId = 0;

    var firstName;  // 新生涡旋起始名字
    var live = 1;

    for(var num=0; num<liveInfo.length; num++){
        firstName = liveInfo[num]['name'];
        live = liveInfo[num]['live'];

        queue.push(firstName);  // 把当前涡旋的名称放进去
        idQueue.push(nextId);
        existedNodesMap.set(firstName, nextId);
        
        nextId++;

        var row = [];  // 每个节点的参数数组

        while(queue.length!=0){  // 当队列不为空
        
            curId = idQueue[0];
            curName = queue[0];

            queue.shift();  // 当前节点出队
            idQueue.shift();

            var d = parseInt(curName.split("-")[0]);
            var index = parseInt(curName.split("-")[1]);

            [curX, curY] = getCurPos(d, index);
            
            curRadius = getCurRadius(d, index);
            curCirc = getCurCirc(d, index);
            // curColor = getCurColor(d, index);
            curColor = getCurColorByLive(live);

            // 把当前节点放到nodes中
            row = [curX, curY, curRadius, curCirc, curColor, curName, live];
            data.push(row);


            var forwards = eddyForwards[d][index];  // 得到它后继列表
            var tempId;
            for(let i=0; i<forwards.length; i++){
                var tarName = forwards[i];

                if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                    tempId = nextId;  // 比末尾的节点id再大1
                    queue.push(tarName);  // 涡旋入队
                    idQueue.push(tempId);
                    existedNodesMap.set(tarName, tempId);
                    nextId++;
                }
                else{  // 不用入队
                    tempId = existedNodesMap.get(tarName);
                }
                

                // 添加边，现在不用添加点！
                edges.push({
                    source: curId,
                    target: tempId,
                });
            }

            // 向前追踪时，不用添加边。因为其前驱在向后追踪时会添加。
            var backwards = eddyBackwards[d][index];  // 得到它后继下标
            var tempId;

            for(let i=0; i<backwards.length; i++){
                var tarName = backwards[i];

                if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                    tempId = nextId;  // 比末尾的节点id再大1
                    queue.push(tarName);  // 涡旋入队
                    idQueue.push(tempId);
                    existedNodesMap.set(tarName, tempId);
                    nextId++;
                }
                else{  // 不用入队
                    tempId = existedNodesMap.get(tarName);
                }
            }
        }
    }    
}

function loadTopo(firstName){
    data = [];
    edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curDepth, curVort,  curCirc, curColor, curFontColor;
    var nextId = 0;

    queue.push(firstName);  // 把当前涡旋的名称放进去
    idQueue.push(nextId);
    existedNodesMap.set(firstName, nextId);
    
    nextId++;

    var row = [];  // 每个节点的参数数组

    while(queue.length!=0){  // 当队列不为空
    
        curId = idQueue[0];
        curName = queue[0];

        queue.shift();  // 当前节点出队
        idQueue.shift();

        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        [curX, curY] = getCurPos(d, index);
        
        curRadius = getCurRadius(d, index);
        curCirc = getCurCirc(d, index);
        curColor = getCurColor(d, index);

        // 把当前节点放到nodes中
        row = [curX, curY, curRadius, curCirc, curColor, curName];
        data.push(row);


        var forwards = eddyForwards[d][index];  // 得到它后继列表
        var tempId;
        for(let i=0; i<forwards.length; i++){
            var tarName = forwards[i];

            if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                tempId = nextId;  // 比末尾的节点id再大1
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                existedNodesMap.set(tarName, tempId);
                nextId++;
            }
            else{  // 不用入队
                tempId = existedNodesMap.get(tarName);
            }
            

            // 添加边，现在不用添加点！
            edges.push({
                source: curId,
                target: tempId,
            });
        }

        // 向前追踪时，不用添加边。因为其前驱在向后追踪时会添加。
        var backwards = eddyBackwards[d][index];  // 得到它后继下标
        var tempId;

        for(let i=0; i<backwards.length; i++){
            var tarName = backwards[i];

            if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                tempId = nextId;  // 比末尾的节点id再大1
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                existedNodesMap.set(tarName, tempId);
                nextId++;
            }
            else{  // 不用入队
                tempId = existedNodesMap.get(tarName);
            }
        }
    }
}


function getCurPos(d, index){
    return [eddyInfo[d][index][0], eddyInfo[d][index][1]];
}

function getCurRadius(d, index){
    return eddyInfo[d][index][2]  // 半径
}

function getCurEke(d, index){
    return eddyInfo[d][index][3];  // 能量
}

function getCurDepth(d, index){
    return eddyInfo[d][index][4];  // 能量
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
    console.log(color);
    return color;
}

function live2Hex(live){
    live = parseInt(256 - live*256/60);
    if(live<16){
        return '0' + live.toString(16);
    }
    else return live.toString(16);
}


function getOption(data) {
    
    return {
        backgroundColor: new echarts.graphic.RadialGradient(0.3, 0.3, 0.8, [{
            offset: 0,
            color: '#f7f8fa'
        }, 

        ]),
        tooltip: {
            padding: 10,
            backgroundColor: '#5fb7fd',
            borderColor: '#777',
            borderWidth: 1,
            formatter: function (obj) {
                var value = obj.value;
                
                console.log(value);
                console.log(fieldIndices);
                var returnStr = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + '编号：'+ value[fieldIndices['name']]+ '</div>';
                
                // // 加上y轴意义、大小的意义、类型
                // returnStr = returnStr
                //     + schema[fieldIndices[path_gui_opt.yAxis]].name + '：' + value[1] + '<br>'
                //     + schema[fieldIndices[path_gui_opt.symbolSize]].name + '：' + value[2] + '<br>'
                //     + schema[1].name + '：' + value[3] + '<br>'
                //     + schema[2].name + '：' + value[4] + '<br>'
                //     + schema[5].name + '：' + value[5] + '<br>'
                //     + schema[6].name + '：' + value[6] + '<br>'
                //     + schema[7].name + '：' + value[7] + '<br>';
                    
                return returnStr;
            }
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: 500,
            name: 'lon',
            splitLine: {
                show: true,
                lineStyle: {
                    type:'dashed',
                }
            },
            // scale: true,
        },
        yAxis: {
            name: 'lat',
            min: 0,
            max: 500,
            splitLine: {
                show: true,
                lineStyle: {
                    type:'dashed',
                }
            },
            type: 'value',
            // scale: true,
        },
       
        series: [
            {
                zlevel: 1,
                name: 'xxx',
                type: 'graph',
                // type:'scatter',
                coordinateSystem: 'cartesian2d',
                // label: {
                //     show: true,
                //     formatter: function (params) {  // 显示文字
                //         // console.log(params.data);
                //         return params.data[fieldIndices['name']];
                //     }
                // },
                data: data,

                symbolSize:(rawValue, params) => {  // 默认半径作为size
                    params.symbolSize = params.data[fieldIndices['radius']];
                    // console.log(params.symbolSize);
                    return Math.sqrt(params.symbolSize)*0.5;
                },

                itemStyle:{
                    normal : {
                        color : function(params) {
                            params.color = params.data[fieldIndices['color']];
                            
                            return params.color;
                        }
                    }
                },

                edgeSymbol: ['circle', 'arrow'],
                // edgeSymbolSize: [4, 10],
                edgeSymbolSize: [2, 2],

                links: edges,

                lineStyle: {
                    color: '#2f4554'
                },

                // animationThreshold: 5000,
                // progressiveThreshold: 5000
            }
        ],
        grid: {
            // left: '8%',
            // right: '0',
           bottom: '8%',
           containLabel: true
        },
        animationEasingUpdate: 'cubicInOut',
        animationDurationUpdate: 2000
    };
}
