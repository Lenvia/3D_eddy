// import * as echarts from 'echarts';

// 其中info[天数][下标] = [cx, cy, r, circ, vort, eke]
var eddyFeature;
loadEddyFeatures();
var eddyInfo = eddyFeature['info'];

var cycFlag = 1;

var chartDom = document.getElementById('topo-container');
var myChart = echarts.init(chartDom);
var option;

function loadEddyFeatures(){
    var eddis_feature_path = ("./resources/features/features.json");
    
    $.ajax({
        url: eddis_feature_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            eddyFeature = res;  // 包含三个字段：info, forward, backward。
            // console.log(eddyFeature);
        }
    })
}


// Schema:
// date,AQIindex,PM2.5,PM10,CO,NO2,SO2
// var schema = [
//     {name: 'AQIindex', index: 1, text: 'AQI'},
//     {name: 'PM25', index: 2, text: 'PM 2.5'},
//     {name: 'PM10', index: 3, text: 'PM 10'},
//     {name: 'CO', index: 4, text: 'CO'},
//     {name: 'NO2', index: 5, text: 'NO₂'},
//     {name: 'SO2', index: 6, text: 'SO₂'},
//     {name: '等级', index: 7, text: '等级'}
// ];

var bias = 0;

var schema = [
    {name: 'day', index: 0, text: 'day'},
    {name: 'cx', index: 1+bias, text: 'cx'},
    {name: 'cy', index: 2+bias, text: 'cy'},
    {name: 'radius', index: 3+bias, text: 'radius'},
    {name: 'eke', index: 4+bias, text: 'eke'},
    {name: 'depth', index: 5+bias, text: 'depth'},
    {name: 'vort', index: 6+bias, text: 'vort'},
    
    {name: 'circ', index: 7+bias, text: 'circ'},
    {name: 'name', index: 8+bias, text: 'name'},
];

var rawData = [
    // [55,9,56,0.46,18,6,"良", "北京"],

    // [(day), cx, cy, r, eke, depth, vort, circ, name]
];

for(let i=0; i<eddyInfo.length; i++){
    for(let j=0; j<eddyInfo[i].length; j++){
        var row = eddyInfo[i][j];
        // cx, cy, r, depth, vort, eke, circ

        row = [i].concat(row);

        row = row.concat([String(i)+'-'+String(j)]);

        // [(day), cx, cy, r, depth, vort, eke, circ, name]

        rawData.push(row);
    }
}


var CATEGORY_DIM_COUNT = 7;
var GAP = 2;
var BASE_LEFT = 5;
var BASE_TOP = 10;
// var GRID_WIDTH = 220;
// var GRID_HEIGHT = 220;
var GRID_WIDTH = (100 - BASE_LEFT - GAP) / CATEGORY_DIM_COUNT - GAP;
var GRID_HEIGHT = (100 - BASE_TOP - GAP) / CATEGORY_DIM_COUNT - GAP;
var CATEGORY_DIM = 7;  // 分类的维度
var NAME_DIM = 8;  // 名字所在的维度
var SYMBOL_SIZE = 4;

function retrieveScatterData(data, dimX, dimY) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = [data[i][dimX], data[i][dimY]];
        item[CATEGORY_DIM] = data[i][CATEGORY_DIM];

        item[NAME_DIM] = data[i][NAME_DIM];

        // console.log(item[CATEGORY_DIM]);
        result.push(item);
    }
    return result;
}

// CATEGORY_DIM_COUNT = 5
function generateGrids(option) {
    var index = 0;

    for (var i = 0; i < CATEGORY_DIM_COUNT; i++) {
        for (var j = 0; j < CATEGORY_DIM_COUNT; j++) {
            // if i <= j  continue;

            // if(i==CATEGORY_DIM || j==CATEGORY_DIM) continue;
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


var option = {
    animation: false,
    brush: {
        brushLink: 'all',
        xAxisIndex: [],
        yAxisIndex: [],
        inBrush: {
            opacity: 1
        }
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
            // return 'aaaa' + value; // 范围标签显示内容。
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

            // if(value[1]!=undefined)
            //     result += schema[1].text + '：' + value[1] + '<br>'
            // if(value[2]!=undefined)
            //     result += schema[2].text + '：' + value[2] + '<br>'
            // if(value[3]!=undefined)
            //     result += schema[3].text + '：' + value[3] + '<br>'
            // if(value[4]!=undefined)
            //     result += schema[4].text + '：' + value[4] + '<br>'
            // if(value[5]!=undefined)
            //     result += schema[5].text + '：' + value[5] + '<br>'
            // if(value[6]!=undefined)
            //     result += schema[6].text + '：' + value[6] + '<br>'
            if(value[NAME_DIM]!=undefined)
                result += schema[NAME_DIM].text + '：' + value[NAME_DIM] + '<br>'
            return result;
        }
    },
    parallelAxis: [
        {dim: 0, name: schema[0].text},
        {dim: 1, name: schema[1].text},
        {dim: 2, name: schema[2].text},
        {dim: 3, name: schema[3].text},
        {dim: 4, name: schema[4].text},
        {dim: 5, name: schema[5].text},
        {dim: 6, name: schema[6].text},
    ],
    parallel: {
        bottom: '5%',
        left: '2%',
        height: '30%',
        width: '55%',
        parallelAxisDefault: {
            type: 'value',
            name: 'radius',
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
                opacity: 0.3
            },
            data: rawData
        }
    ]
};

generateGrids(option);

option && myChart.setOption(option);
