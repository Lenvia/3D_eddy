
var eddyFeature;
var eddyInfo;
var liveInfo;




var cycFlag = 1;
var anticycFlag = -1;

var chartDom = document.getElementById('topo-container');
var myChart = echarts.init(chartDom);
var option;




var schema = [
    {name: 'cx', index: 0, text: 'cx'},
    {name: 'cy', index: 1, text: 'cy'},
    {name: 'radius', index: 2, text: 'radius'},
    {name: 'eke', index: 3, text: 'eke'},
    {name: 'ave_eke', index: 4, text: 'ave_eke'},
    {name: 'vort', index: 5, text: 'vort'},
    {name: 'circ', index: 6, text: 'circ'},

    {name: 'live', index: 7, text:'live'},
    {name: 'start_day', index: 8, text:'start_day'},
    {name: 'end_day', index: 9, text:'end_day'},

    {name: 'max_radius', index: 10, text: 'max_radius'},
    {name: 'max_eke', index: 11, text: 'max_eke'},
    {name: 'max_ave_eke', index: 12, text: 'max_ave_eke'},
    
    {name: 'name', index: 13, text: 'name'},
];

// 便于通过name来找index
var fieldIndices = schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});

var CATEGORY_DIM = 12;
var NAME_DIM = 13;  // 名字所在的维度


var data = [
    // [cx, cy, r, eke, depth, vort, circ, ,live, start_day, end_day, name]
];


init();


function init(){
    loadEddyFeatures();

    loadAll();

    
    // option && myChart.setOption(option);
    
    myChart.setOption(option = getOption(data));

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

    var live_path = ("./resources/features/live.json");
    $.ajax({
        url: live_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            liveInfo = res;
        }
    })
}


function loadAll(){
    data = [];

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curDepth, curVort,  curCirc, curColor, curFontColor;

    var live = 1;
    var start_day, end_day;
    var max_radius, max_eke, max_ave_eke;

    for(var num=0; num<liveInfo.length; num++){

        var row = [];  // 每个节点的参数数组

        curName = liveInfo[num]['name'];
        live = liveInfo[num]['live'];
        start_day = liveInfo[num]['start_day'];
        end_day = liveInfo[num]['end_day'];
        max_radius = liveInfo[num]['max_radius'];
        max_eke = liveInfo[num]['max_eke'];
        max_ave_eke = liveInfo[num]['max_ave_eke'];
        


        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        [curX, curY] = getCurPos(d, index);
        
        curRadius = getCurRadius(d, index);
        curEke = getCurEke(d, index);
        curDepth = getCurDepth(d, index);
        curVort = getCurVort(d, index);
        curCirc = getCurCirc(d, index);

        if(curY<100) continue;



        // 把当前节点放到nodes中
        row = [curX, curY, curRadius, curEke, curDepth, curVort, curCirc, 
            live, start_day, end_day, max_radius, max_eke, max_ave_eke, curName];

        data.push(row);
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
    return eddyInfo[d][index][4];  // 深度
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





// var GAP = 2;
// var BASE_LEFT = 5;
// var BASE_TOP = 10;

// var GRID_WIDTH = (100 - BASE_LEFT - GAP) / CATEGORY_DIM_COUNT - GAP;
// var GRID_HEIGHT = (100 - BASE_TOP - GAP) / CATEGORY_DIM_COUNT - GAP;

// var SYMBOL_SIZE = 4;

function retrieveScatterData(data, dimX, dimY) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = [data[i][dimX], data[i][dimY]];

        item[CATEGORY_DIM] = data[i][CATEGORY_DIM];
        item[NAME_DIM] = data[i][NAME_DIM];
        result.push(item);
    }
    return result;
}


function generateGrids(option) {
    var index = 0;

    for (var i = 0; i < CATEGORY_DIM_COUNT; i++) {
        for (var j = 0; j < CATEGORY_DIM_COUNT; j++) {
            if (CATEGORY_DIM_COUNT - i + j >= CATEGORY_DIM_COUNT) {
                continue;
            }

            option.grid.push({
                left: BASE_LEFT + i * (GRID_WIDTH + GAP) + '%',
                top: BASE_TOP + j * (GRID_HEIGHT + GAP) + '%',
                width: GRID_WIDTH + '%',
                height: GRID_HEIGHT + '%'
            });

            option.brush.xAxisIndex && option.brush.xAxisIndex.push(index);
            option.brush.yAxisIndex && option.brush.yAxisIndex.push(index);

            // 只在第0行才显示x轴的name，line， tick， label
            // 由于name显示不能用表达式判断，只好提出来了
            if(j===0){  
                option.xAxis.push({  
                    splitNumber: 3,
                    position: 'top',
                    name: schema[i].text,
                    nameLocation:'middle',
                    
                    nameGap:20,
                    
                    axisLine: {
                        show: j === 0,
                        onZero: false
                    },
                    axisTick: {
                        show: j === 0,
                        inside: true
                    },
                    axisLabel: {
                        show: j === 0
                    },
                    type: 'value',
                    gridIndex: index,
                    scale: true
                });
                
            }
            else{
                option.xAxis.push({  // 只在第0行才显示x轴
                    splitNumber: 3,
                    position: 'top',
    
                    axisLine: {
                        show: j === 0,
                        onZero: false
                    },
                    axisTick: {
                        show: j === 0,
                        inside: true
                    },
                    axisLabel: {
                        show: j === 0
                    },
                    type: 'value',
                    gridIndex: index,
                    scale: true
                });
            }
            

            if(i === CATEGORY_DIM_COUNT - 1){
                option.yAxis.push({
                    splitNumber: 3,
                    position: 'right',
                    name: schema[j].text,
                    nameLocation:'middle',

                    nameGap:30,

                    axisLine: {
                        show: i === CATEGORY_DIM_COUNT - 1,
                        onZero: false
                    },
                    axisTick: {
                        show: i === CATEGORY_DIM_COUNT - 1,
                        inside: true
                    },
                    axisLabel: {
                        show: i === CATEGORY_DIM_COUNT - 1
                    },
                    type: 'value',
                    gridIndex: index,
                    scale: true
                });
            }
            else{
                option.yAxis.push({
                    splitNumber: 3,
                    position: 'right',
                    axisLine: {
                        show: i === CATEGORY_DIM_COUNT - 1,
                        onZero: false
                    },
                    axisTick: {
                        show: i === CATEGORY_DIM_COUNT - 1,
                        inside: true
                    },
                    axisLabel: {
                        show: i === CATEGORY_DIM_COUNT - 1
                    },
                    type: 'value',
                    gridIndex: index,
                    scale: true
                });
            }
            

            option.series.push({
                type: 'scatter',
                symbolSize: SYMBOL_SIZE,
                xAxisIndex: index,
                yAxisIndex: index,
                data: retrieveScatterData(rawData, i, j)
            });

            option.visualMap.seriesIndex.push(option.series.length - 1);

            index++;
        }
    }
}

function getOption(data){
    var option = {
        animation: false,
        brush: {
            brushLink: 'all',
            xAxisIndex: [],
            yAxisIndex: [],
            inBrush: {
                opacity: 1
            },
        },
        visualMap: {
            type: 'piecewise',
            categories: [-1, 1],
            dimension: CATEGORY_DIM,
            orient: 'horizontal',
            top: 0,
            left: 'center',
            inRange: {
                color: ['#51689b', '#ce5c5c']
            },
            outOfRange: {
                color: '#ddd'
            },
            seriesIndex: [0],
    
            formatter: function (value) { //标签的格式化工具。
                if(value===cycFlag){
                    return '气旋';
                }
                else return '反气旋';
            }
        },
        tooltip: {
            // trigger: 'item',
            // axisPointer:{
            //     type: 'cross',
            // }
            formatter: function (obj) {
                var value = obj.value;
                // console.log(value);
                var result = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">' + '</div>';
    
                if(value[NAME_DIM]!=undefined)
                    result += schema[NAME_DIM].text + '：' + value[NAME_DIM] + '<br>'
                return result;
            }
        },
        parallelAxis: [
            {dim: 0, name: schema[fieldIndices['start_day']].text},
            {dim: 1, name: schema[fieldIndices['end_day']].text},
            {dim: 2, name: schema[fieldIndices['live']].text},
    
            {dim: 3, name: schema[fieldIndices['radius']].text},
            {dim: 4, name: schema[fieldIndices['eke']].text},
            {dim: 5, name: schema[fieldIndices['ave_eke']].text},
            {dim: 6, name: schema[fieldIndices['live']].text},

            {dim: 7, name: schema[fieldIndices['max_radius']].text},
            {dim: 8, name: schema[fieldIndices['max_eke']].text},
            {dim: 9, name: schema[fieldIndices['max_ave_eke']].text},
    
            // {dim: 7, name: schema[fieldIndices['cx']].text},
            // {dim: 8, name: schema[fieldIndices['cy']].text},
    
        ],
        parallel: {
            bottom: '5%',
            left: '2%',
            height: '30%',
            width: '55%',
            parallelAxisDefault: {
                type: 'value',
                name: 'live',
                nameLocation: 'end',
                nameGap: 20,
                splitNumber: 3,
                nameTextStyle: {
                    fontSize: 14
                },
                axisLine: {
                    lineStyle: {
                        color: '#555'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#555'
                    }
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    color: '#555'
                }
            }
        },
        grid: [],
        xAxis: [],
        yAxis: [],
        series: [
            {
                name: 'parallel',
                type: 'parallel',
                smooth: true,
                lineStyle: {
                    width: 1,
                    opacity: 0.5
                },
                data: data.map(function (item) {
                    // [start_day, end_day, live, radius, eke, ave_eke, vort, max_radius, max_eke, max_ave_eke, cx, cy, circ, name]
                    return [item[8], item[9], item[7]/2,  
                        item[2], item[3], item[4], item[7]/2, 
                        item[10], item[11], item[12],
                        item[0], item[1],  item[6], item[13]];
                }),
            }
        ]
    };

    return option;
}


// generateGrids(option);


