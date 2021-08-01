// 配置
var topo_node_map = new Map();
var topo_data = [];
var topo_edges = [];
var topo_option;

var topo_yAxis;
var topo_sizeMap;
var topo_showLabel;

// 原始数据topo_schema，并非传递给series的数据下表
var topo_schema = [
    {name: 'step', index: 0, text:'step'},
    {name: 'cx', index: 1, text:'cx'},
    {name: 'cy', index: 2, text:'cy'},
    {name: 'radius', index: 3, text:'radius'},
    {name: 'eke', index: 4, text:'EKE'},
    {name: 'ave_eke', index:5, text:'aveEKE'},
    {name: 'vort', index: 6, text:'vort'},
    
    {name: 'circ', index: 7, text:'circ'},
    {name: 'color', index: 8, text:'color'},
    {name: 'name', index: 9, text:'name'},

    {name: 'longitude', index: 10, text:'longitude'},
    {name: 'latitude', index: 11, text:'latitude'},
    
];

// 便于通过name来找index
var topo_field_indices = topo_schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


// gui
var topo_gui;
var topo_gui_opt;

var scaleFactor = 1;


var topoXAxisData = [];
for(let i=0; i<tex_pps_step; i++){
    topoXAxisData.push(i);
}





function topoInit(){

    loadTopoData('0-0');
    // setTopoGUI();

    topo_window.setOption(topo_option = getTopoOption(topo_data));

    topo_window.on('click',  function(param) {
        
        currentMainName = param.data[11];
        console.log(currentMainName);

        // 发送信号表示点击了拓扑图
        topoClickSign = 1;
        $("#topoClickSign").val(1);
        $("#topoClickSign").change();
    });
}





function loadTopoData(firstName){
    topo_data = [];
    topo_edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    topo_node_map.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curAveEke, curVort,  curCirc, curColor, curFontColor;
    var curLon, curLat;
    
    var nextId = 0;

    queue.push(firstName);  // 把当前涡旋的名称放进去
    idQueue.push(nextId);
    topo_node_map.set(firstName, nextId);
    
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
        curAveEke = getCurAveEke(d, index);
        curVort = getCurVort(d, index);
        curCirc = getCurCirc(d, index);
        curColor = getCurColor(d, index);

        [curLon, curLat] = pxy2ll(curX, curY);

        // 把当前节点放到nodes中
        row = [d,  curX, curY, curRadius, curEke, curAveEke, curVort, curCirc, curColor, curName, curLon, curLat];
        topo_data.push(row);


        var forwards = eddyForwards[d][index];  // 得到它后继列表
        var tempId;
        for(let i=0; i<forwards.length; i++){
            var tarName = forwards[i];

            if(topo_node_map.get(tarName)==undefined){  // 如果是个新的节点
                tempId = nextId;  // 比末尾的节点id再大1
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                topo_node_map.set(tarName, tempId);
                nextId++;
            }
            else{  // 不用入队
                tempId = topo_node_map.get(tarName);
            }
            

            // 添加边，现在不用添加点！
            topo_edges.push({
                source: curId,
                target: tempId,
            });
        }

        // 向前追踪时，不用添加边。因为其前驱在向后追踪时会添加。
        var backwards = eddyBackwards[d][index];  // 得到它后继下标
        var tempId;

        for(let i=0; i<backwards.length; i++){
            var tarName = backwards[i];

            if(topo_node_map.get(tarName)==undefined){  // 如果是个新的节点
                tempId = nextId;  // 比末尾的节点id再大1
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                topo_node_map.set(tarName, tempId);
                nextId++;
            }
            else{  // 不用入队
                tempId = topo_node_map.get(tarName);
            }
        }
    }
}






function getTopoOption(data) {
    var bias = 2;

    return {
        backgroundColor: new echarts.graphic.RadialGradient(0.3, 0.3, 0.8, [{
            offset: 0,
            color: '#f7f8fa'
        }, ]),
        tooltip: {
            backgroundColor: ['rgba(255,255,255,0.7)'],
            formatter: function (obj) {
                if(obj.value!=undefined){
                    var value = obj.value;
                    
                    // console.log(obj);

                    var returnStr = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + 'identifier：'+ state2identifier.get(value[9+bias])+'-'+String(value[0])+ '</div>';

                    
                    
                    // 加上y轴意义、大小的意义、类型
                    returnStr = returnStr
                        + topo_schema[10].text + '：' + value[10+bias] + '<br>'
                        + topo_schema[11].text + '：' + value[11+bias] + '<br>'
                        + topo_schema[3].text + '：' + value[3+bias] + '<br>'
                        + topo_schema[4].text + '：' + value[4+bias] + '<br>'
                        + topo_schema[5].text + '：' + value[5+bias] + '<br>'
                        + topo_schema[6].text + '：' + value[6+bias] + '<br>'
                        + topo_schema[7].text + '：' + value[7+bias] + '<br>';
                        
                    return returnStr;
                }
            }
        },
        title:{
            left: 'center',
            text: 'The state of each eddy at different time steps',
            textStyle:{
                fontSize: 15,
                // fontStyle:'italic',
                fontFamily: 'Microsoft YaHei',
            },
            
        },
        xAxis: {
            type: 'category',
            // boundaryGap: false,
            data: topoXAxisData,
        },
        yAxis: {
            name: 'EKE',
            splitLine: {
                show: true,
                lineStyle: {
                    type:'dashed',
                }
            },
            type: 'value',
            scale: true,
        },

        dataZoom: [
            {
                show: true,
                realtime: true,
                filterMode: 'filter',
                start: 0,
                end: 100,
                xAxisIndex: 0,
                orient:"horizontal",
            },
            {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: 0,
                zoomOnMouseWheel:true,
                moveOnMouseMove:true,
            }
        ],
       
        series: [
            {
                zlevel: 1,
                name: 'xxx',
                type: 'graph',
                coordinateSystem: 'cartesian2d',
                label: {
                    show: true,
                    formatter: function (params) {  // 显示标签
                        return state2identifier.get(params.data[11]);
                    }
                },
                data: data.map(function (item) {
                    // 第0位固定时间，第1位和第2位看情况。
                    // 然后把所有属性再重新放一遍
                    // [step, eke(yAxis), radius(symbolSize), cx, cy, radius, eke, ave_eke, vort,  circ, color, name]
                    return [item[0], item[4], item[3], item[1], item[2], item[3], item[4], item[5], item[6], item[7], item[8], item[9], item[10], item[11]];
                }),

                // data: fakeData,

                // symbolSize:(rawValue, params) => {  // 默认半径作为size
                //     params.symbolSize = params.data[2];
                //     // console.log(params.symbolSize);
                //     return Math.sqrt(params.symbolSize)*scaleFactor;
                // },

                symbolSize: 15,

                itemStyle:{
                    normal : {
                        color : function(params) {
                            params.color = params.data[10];
                            
                            // console.log(params.color);
                            return params.color;
                        }
                    }
                },

                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],

                links: topo_edges,

                lineStyle: {
                    color: '#2f4554'
                },

                // animationThreshold: 5000,
                // progressiveThreshold: 5000
            }
        ],
        grid: {
            top: '10%',
            left: '2%',
            right: '2%',
            bottom: '14%',
           containLabel: true
        },
        animationEasingUpdate: 'cubicInOut',
        animationDurationUpdate: 2000
    };
}