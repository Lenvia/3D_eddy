// var container = document.getElementById('container');
var cycNodeColor = "#ce5c5c";  // 气旋颜色，红色
var anticycNodeColor = "#51689b";  // 反气旋颜色，蓝色
var cycFlag = '气旋';
var anticycFlag = '反气旋';

var eddyFeature;  // 涡核信息数组

var topo_gui;
var topo_gui_opt;
var scaleFactor = 1;

var topo_container = document.getElementById('topo-container');
var topo_window = echarts.init(topo_container);
var topo_option;

var eddyForwards;
var eddyBackwards;
var eddyInfo;
var tex_pps_day = 60;

var data = [];
var edges = [];
var index_arr = [];
for(let i=0; i<40; i++){
    index_arr.push(i);
}

var existedNodesMap = new Map();

// 原始数据schema，并非传递给series的数据下表
var schema = [
    {name: 'day', index: 0, text:'day'},
    {name: 'cx', index: 1, text:'cx'},
    {name: 'cy', index: 2, text:'cy'},
    {name: 'radius', index: 3, text:'radius'},
    {name: 'eke', index: 4, text:'eke'},
    {name: 'depth', index:5, text:'depth'},
    {name: 'vort', index: 6, text:'vort'},
    
    
    {name: 'circ', index: 7, text:'circ'},
    {name: 'color', index: 8, text:'color'},
    {name: 'name', index: 9, text:'name'},
    
];

// 便于通过name来找index
var fieldIndices = schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


var xAxisData = [];
for(let i=0; i<tex_pps_day; i++){
    xAxisData.push(i);
}





init();

function init(){
    loadEddyFeatures();
    loadTopo('0-0');
    setTopoGUI();

    
    topo_window.setOption(topo_option = getOption(data));

    

    var guiTopoContainer = document.getElementById('gui_topo');
    guiTopoContainer.appendChild(topo_gui.domElement);
    topo_container.appendChild(guiTopoContainer);
}




function loadEddyFeatures(){
    var eddies_feature_path = ("./resources/features/features.json");
    
    $.ajax({
        url: eddies_feature_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            eddyFeature = res;  // 包含三个字段：info, forward, backward。其中info[天数][下标] = [cx, cy, area, bx, by, br]
            // console.log(eddyFeature);
            eddyInfo = eddyFeature['info'];
            eddyForwards = eddyFeature['forward'];  // 向未来追踪
            eddyBackwards = eddyFeature['backward'];  // 向以前回溯
        }
    })
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
        curEke = getCurEke(d, index);
        curDepth = getCurDepth(d, index);
        curVort = getCurVort(d, index);
        curCirc = getCurCirc(d, index);
        curColor = getCurColor(d, index);

        // 把当前节点放到nodes中
        row = [d,  curX, curY, curRadius, curEke, curDepth, curVort, curCirc, curColor, curName];
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
                
                // console.log(value);
                var returnStr = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + '编号：'+ value[9]+ '</div>';
                
                // 加上y轴意义、大小的意义、类型
                returnStr = returnStr
                    + schema[fieldIndices[topo_gui_opt.yAxis]].name + '：' + value[1] + '<br>'
                    + schema[fieldIndices[topo_gui_opt.symbolSize]].name + '：' + value[2] + '<br>'
                    + schema[1].name + '：' + value[3] + '<br>'
                    + schema[2].name + '：' + value[4] + '<br>'
                    + schema[5].name + '：' + value[5] + '<br>'
                    + schema[6].name + '：' + value[6] + '<br>'
                    + schema[7].name + '：' + value[7] + '<br>';
                    
                return returnStr;
            }
        },
        xAxis: {
            type: 'category',
            // boundaryGap: false,
            data: xAxisData,
        },
        yAxis: {
            name: 'eke',
            splitLine: {
                show: true,
                lineStyle: {
                    type:'dashed',
                }
            },
            type: 'value',
            scale: true,
        },
       
        series: [
            {
                zlevel: 1,
                name: 'xxx',
                type: 'graph',
                // type:'scatter',
                coordinateSystem: 'cartesian2d',
                label: {
                    show: true,
                    formatter: function (params) {  // 显示文字
                        // console.log(params.data);
                        return params.data[9];
                    }
                },
                data: data.map(function (item) {
                    // [day, eke, radius, cx, cy, depth, vort,  circ, color, name]
                    return [item[0], item[4], item[3], item[1], item[2], item[5], item[6], item[7], item[8], item[9]];
                }),

                // data: fakeData,

                symbolSize:(rawValue, params) => {  // 默认半径作为size
                    params.symbolSize = params.data[2];
                    console.log(params.symbolSize);
                    return Math.sqrt(params.symbolSize)*3;
                },

                itemStyle:{
                    normal : {
                        color : function(params) {
                            params.color = params.data[8];
                            
                            return params.color;
                        }
                    }
                },

                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],

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

function setTopoGUI(){
    var indexCtrl;
    topo_gui = new dat.GUI({ autoPlace: false });

    topo_gui_opt = new function(){
        this.yAxis = 'eke';
        this.symbolSize = 'radius';
        this.day = 0;
        this.index = 0;
        this.scaleFactor = 1;
    };

    topo_gui.add(topo_gui_opt, 'day', xAxisData).onChange(function(){
        // 如果改变了日期，index默认回归0
        loadTopo(String(topo_gui_opt.day)+'-'+'0');
        indexCtrl.setValue(0);
        // console.log(indexCtrl);
        if (data) {
            topo_window.setOption({
                yAxis: {
                    name: topo_gui_opt.yAxis,
                },
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],  // y轴的值
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7], 
                            item[8],
                            item[9],
                            // idx
                        ];
                    }),
                    links: edges,
                }
            });
        }
    });

    indexCtrl = topo_gui.add(topo_gui_opt, 'index', index_arr).onChange(function(){
        loadTopo(String(topo_gui_opt.day)+'-'+String(topo_gui_opt.index));
        if (data) {
            topo_window.setOption({
                yAxis: {
                    name: topo_gui_opt.yAxis,
                },
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],  // y轴的值
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7], 
                            item[8],
                            item[9],
                            // idx
                        ];
                    }),
                    links: edges,
                }
            });
        }
    }).listen();

    // y轴映射
    topo_gui.add(topo_gui_opt, 'yAxis', ['eke', 'radius', 'depth', 'vort', 'cx', 'cy']).onChange(function(){
        if (data) {
            topo_window.setOption({
                yAxis: {
                    name: topo_gui_opt.yAxis,
                },
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],  // y轴的值
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7], 
                            item[8],
                            item[9],
                            // idx
                        ];
                    })
                }
            });
        }
    });

    // 结点大小映射
    topo_gui.add(topo_gui_opt, 'symbolSize', ['radius','eke', 'cx', 'cy']).onChange(function(){
        if (data) {
            topo_window.setOption({
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],  // y轴的值
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7],
                            item[8],
                            item[9],  
                            // idx
                        ];
                    }),
                }
            });
        }
    });

    // 结点缩放映射
    topo_gui.add(topo_gui_opt, 'scaleFactor', [0.01, 0.1, 0.2, 0.33, 0.5, 1, 2, 3, 5, 10, 100]).onChange(function(){
        if (data) {
            scaleFactor = topo_gui_opt.scaleFactor;
            topo_window.setOption({
                series: {
                    symbolSize:(rawValue, params) => {
                        params.symbolSize = scaleFactor*Math.sqrt(params.data[2]);
                        return (params.symbolSize);
                    },
                }
            });
        }
    });
}