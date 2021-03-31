// var container = document.getElementById('container');s
var cycNodeColor = "#faf955";  // 气旋颜色，黄色
var anticycNodeColor = "#382da1";  // 反气旋颜色，蓝紫色
var eddyFeature;  // 涡核信息数组

var gui;

var chartDom = document.getElementById('container');
var myChart = echarts.init(chartDom);
var option;


var eddyForwards;
var eddyBackwards;
var eddyInfo;
var tex_pps_day = 10;

var data = [];
var edges = [];

var existedNodesMap = new Map();

var info_desc = {  // 第0 1 16分别代表该节点的名字、类别、id
    name: 4,
    circ: 3,
    // id: 16,
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

var axisData = [0,1,2,3,4,5,6,7,8,9,10];



loadEddyFeatures();

preLoadTopo(2, 19);

myChart.setOption(option = getOption(data));
// init();

function init(){
    

    console.log(data);
    
    // data = [
    //     // 维度X   维度Y   大小  颜色...
    //     [0, Math.random()*100,   Math.random()*100,   cycNodeColor],
    //     [0, Math.random()*100,   Math.random()*100,   cycNodeColor],
    //     [2, Math.random()*100,   Math.random()*100,   anticycNodeColor],
    //     [5, Math.random()*100,   Math.random()*100,   anticycNodeColor],
    //     [4, Math.random()*100,   Math.random()*100,   anticycNodeColor],
    //     [3, Math.random()*100,   Math.random()*100,   anticycNodeColor]
    // ];

    var axisData = [0,1,2,3,4,5,6,7,8,9,10];


    option = {
        title: {
            text: '笛卡尔坐标系上的 Graph'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: axisData,
            
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                type: 'graph',
                layout: 'none',
                coordinateSystem: 'cartesian2d',
                symbolSize: 40,
                label: {
                    show: true,
                    formatter: function (params) {
                        // 假设此轴的 type 为 'time'。
                        return params.data[4];
                    }
                },
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],

                links: edges,
                data: data,

                // symbolSize:(rawValue, params) => {
                //     // console.log(params);
                //     params.symbolSize = params.data[2];
                //     return params.symbolSize
                // },

                lineStyle: {
                    color: '#2f4554'
                },
                // itemStyle:{
                //     normal : {
                //         color : function(params) {
                //             console.log(params);
                //             params.color = params.data[3];
                //             return params.color;
                //         }
                //     }
                // }
            }
        ]
    };

    option && myChart.setOption(option);
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


function preLoadTopo(currentMainDay, eddyIndex){
    data = [];
    edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName,curColor, curCirc, curEke, curArea, curFontColor;

    var nextId = 0;
    var fisrtName = String(currentMainDay)+"-"+String(eddyIndex);

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
        tooltip: {
            padding: 10,
            backgroundColor: '#5fb7fd',
            borderColor: '#777',
            borderWidth: 1,
            formatter: function (obj) {
                var value = obj.value;
                console.log(value);
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + '编号：'+ value[5]+ '</div>'

                    + schema[1].name + '：' + value[1] + '<br>'
                    + schema[2].name + '：' + value[2] + '<br>'
                    + schema[3].name + '：' + value[3] + '<br>';
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: axisData,
        },
        yAxis: {
            name: 'eke',
            splitLine: {show: false},
            type: 'value',
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
                    return [item[0], item[1], item[2], item[3], item[4], item[5], idx];  // [day, eke, area, circ, index]
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
        animationEasingUpdate: 'cubicInOut',
        animationDurationUpdate: 2000
    };
}

function setGUI(){
    gui = new dat.GUI({ autoPlace: false });

    
}