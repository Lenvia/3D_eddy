// var container = document.getElementById('container');s
var cycNodeColor = "#faf955";  // 气旋颜色，黄色
var anticycNodeColor = "#382da1";  // 反气旋颜色，蓝紫色
var eddyFeature;  // 涡核信息数组

var topo_gui;
var topo_gui_opt;

var topo_container = document.getElementById('topo-container');
var topo_window = echarts.init(topo_container);
var topo_option;



var eddyForwards;
var eddyBackwards;
var eddyInfo;
var tex_pps_day = 10;

var data = [];
var edges = [];

var existedNodesMap = new Map();

var info_desc = {  // 第5 3分别代表该节点的名字、类别
    name: 5,
    circ: 3,
};

var schema = [
    {name: 'day', index: 0},
    {name: 'eke', index: 1},
    {name: 'surface area', index: 2},
    {name: 'type', index: 3},
    {name: 'color', index: 4},
    {name: 'name', index: 5},
];

var fieldIndices = schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});



var groupColors = [cycNodeColor, anticycNodeColor];


var xAxisData = [];
for(let i=0; i<tex_pps_day; i++){
    xAxisData.push(i);
}





init();

function init(){
    loadEddyFeatures();
    setTopoGUI();

    loadTopo(2, 19);
    topo_window.setOption(topo_option = getOption(data));

    

    var guiTopoContainer = document.getElementById('gui_topo');
    guiTopoContainer.appendChild(topo_gui.domElement);
    topo_container.appendChild(guiTopoContainer);
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
            eddyInfo = eddyFeature['info'];
            eddyForwards = eddyFeature['forward'];  // 向未来追踪
            eddyBackwards = eddyFeature['backward'];  // 向以前回溯
        }
    })
}


function loadTopo(curDay, curIndex){
    data = [];
    edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName,curColor, curCirc, curEke, curArea, curFontColor;

    var nextId = 0;
    var fisrtName = String(curDay)+"-"+String(curIndex);

    queue.push(fisrtName);  // 把当前涡旋的名称放进去
    idQueue.push(nextId);
    
    nextId++;

    var row = [];  // 每个节点的参数数组

    while(queue.length!=0){  // 当队列不为空
    
        curId = idQueue[0];
        curName = queue[0];

        queue.shift();  // 当前节点出队
        idQueue.shift();

        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        
        curCirc = getCurCirc(d, index);
        
        curEke = getCurEke(d, index);
        curArea = getCurArea(d, index);

        curColor = getCurColor(d, index);

        // 把当前节点放到nodes中
        row = [d,  curEke, curArea, curCirc,curColor, curName];
        data.push(row);


        if(d+1>=tex_pps_day)  // 不用向后追踪了，这时候不能break，因为可能还有同一天的节点
            continue;
        

        var forwards = eddyForwards[d][index];  // 得到它后继下标
        var tempId;
        for(let i=0; i<forwards.length; i++){
            var tarName = String(d+1)+"-"+String(forwards[i]);

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

            // console.log(queue.length);
            // console.log(curName , "->" , tarName);
        }
    }

    // 当上一个循环结束后，nextId就是接下来要放的id
    // 再把首节点放进去
    queue.push(fisrtName);  // 把当前涡旋的名称放进去
    idQueue.push(0);

    while(queue.length!=0){  // 当队列不为空
        curId = idQueue[0];
        curName = queue[0];

        queue.shift();  // 当前节点出队
        idQueue.shift();


        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        // 把当前节点放到nodes中，如果是首节点就不用了
        if(curId!=0){
            // 把当前节点放到nodes中
            curCirc = getCurCirc(d, index);
            curEke = getCurEke(d, index);
            curArea = getCurArea(d, index);
            curColor = getCurColor(d, index);

            row = [d,  curEke, curArea, curCirc,curColor, curName];
            data.push(row);
        }

        
        if(d-1<0)  // 不用向前追踪了
            continue;
        

        var backwards = eddyBackwards[d][index];  // 得到它后继下标
        var tempId;

        for(let i=0; i<backwards.length; i++){
            var tarName = String(d-1)+"-"+String(backwards[i]);

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

            edges.push({
                source: tempId,
                target: curId,
            });

            // console.log(tarName , "->" , curName);
        }
    }

    // console.log(edges);
}



function getCurEke(d, index){
    return eddyInfo[d][index][7];  // 能量
}

function getCurCirc(d, index){
    var temp = eddyInfo[d][index][6];  // 气旋方向
    if(temp==1)
        return '气旋';
    else return '反气旋';
}

function getCurArea(d, index){
    return eddyInfo[d][index][2]  // 面积
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
        // {
        //     offset: 1,
        //     color: '#cdd0d5'
        // }
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
                + '编号：'+ value[5]+ '</div>';
                
                // 加上y轴意义、大小的意义、类型
                returnStr = returnStr
                    + schema[fieldIndices[topo_gui_opt.yAxis]].name + '：' + value[1] + '<br>'
                    + schema[fieldIndices[topo_gui_opt.symbolSize]].name + '：' + value[2] + '<br>'
                    + schema[3].name + '：' + value[3] + '<br>';
                    
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
                coordinateSystem: 'cartesian2d',
                label: {
                    show: true,
                    formatter: function (params) {
                        // 假设此轴的 type 为 'time'。
                        // console.log(params);
                        return params.data[5];
                    }
                },
                data: data.map(function (item, idx) {
                    // [day, eke, area, circ, color, name, index]
                    return [item[0], item[1], item[2], item[3], item[4], item[5], idx];
                }),

                symbolSize:(rawValue, params) => {
                    params.symbolSize = params.data[2];
                    // console.log(params.symbolSize);
                    return Math.sqrt(params.symbolSize)*3;
                },

                itemStyle:{
                    normal : {
                        color : function(params) {
                            params.color = params.data[4];
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

                

                animationThreshold: 5000,
                progressiveThreshold: 5000
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
    topo_gui = new dat.GUI({ autoPlace: false });

    topo_gui_opt = new function(){
        this.yAxis = 'eke';
        this.symbolSize = 'surface area';
    };

    // y轴映射
    topo_gui.add(topo_gui_opt, 'yAxis', ['eke', 'surface area']).onChange(function(){
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
                            item[3],
                            item[4],
                            item[5],
                            idx
                        ];
                    })
                }
            });
        }
    });

    // 结点大小映射
    topo_gui.add(topo_gui_opt, 'symbolSize', ['surface area', 'eke']).onChange(function(){
        if (data) {
            topo_window.setOption({
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[3],
                            item[4],
                            item[5],
                            idx
                        ];
                    })
                }
            });
        }
    });
}