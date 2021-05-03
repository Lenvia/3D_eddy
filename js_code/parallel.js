// 配置
var parallel_data = [];
var parallel_option;

var parallel_schema = [
    {name: 'cx', index: 0, text: 'cx'},
    {name: 'cy', index: 1, text: 'cy'},
    {name: 'radius', index: 2, text: 'radius'},
    {name: 'eke', index: 3, text: 'eke'},
    {name: 'ave_eke', index: 4, text: 'ave_eke'},
    {name: 'vort', index: 5, text: 'vort'},
    {name: 'circ', index: 6, text: 'circ'},

    {name: 'live', index: 7, text:'live'},
    {name: 'start_step', index: 8, text:'start_step'},
    {name: 'end_step', index: 9, text:'end_step'},

    {name: 'max_radius', index: 10, text: 'max_radius'},
    {name: 'max_eke', index: 11, text: 'max_eke'},
    {name: 'max_ave_eke', index: 12, text: 'max_ave_eke'},
    
    {name: 'name', index: 13, text: 'name'},
];

// 便于通过name来找index
var parallel_field_indices = parallel_schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


var CATEGORY_DIM = 11;  // 不是生数据的，是series中map后的数据
var NAME_DIM = 12; // 同




parallelInit();


function parallelInit(){
    loadParallelData();
    parallel_window.setOption(parallel_option = getParallelOption(parallel_data));
}




function loadParallelData(){
    parallel_data = [];

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curAveEke, curVort,  curCirc, curColor, curFontColor;

    var live = 1;
    var start_step, end_step;
    var max_radius, max_eke, max_ave_eke;

    for(var num=0; num<liveInfo.length; num++){

        var row = [];  // 每个节点的参数数组

        curName = liveInfo[num]['name'];
        live = liveInfo[num]['live'];
        start_step = liveInfo[num]['start_day'];
        end_step = liveInfo[num]['end_day'];
        max_radius = liveInfo[num]['max_radius'];
        max_eke = liveInfo[num]['max_eke'];
        max_ave_eke = liveInfo[num]['max_ave_eke'];
        


        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        [curX, curY] = getCurPos(d, index);
        
        curRadius = getCurRadius(d, index);
        curEke = getCurEke(d, index);
        curAveEke = getCurAveEke(d, index);
        curVort = getCurVort(d, index);
        curCirc = getCurCirc(d, index);

        if(curY<100) continue;



        // 把当前节点放到nodes中
        row = [curX, curY, curRadius, curEke, curAveEke, curVort, curCirc, 
            live, start_step, end_step, max_radius, max_eke, max_ave_eke, curName];

        parallel_data.push(row);
    }
}





function getParallelOption(data){
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
            categories: [anticycFlag, cycFlag],
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
                return value;
            }
        },
        tooltip: {
            // trigger: 'item',
            // axisPointer:{
            //     type: 'cross',
            // }
            formatter: function (obj) {
                // console.log(obj);
                var value = obj.value;
                
                var result = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">' + '</div>';
    
                if(value[NAME_DIM]!=undefined)
                    result += parallel_schema[parallel_field_indices['name']].text + '：' + value[NAME_DIM] + '<br>'
                return result;
            }
        },
        parallelAxis: [
            {dim: 0, name: parallel_schema[parallel_field_indices['start_step']].text},
            {dim: 1, name: parallel_schema[parallel_field_indices['end_step']].text},
            {dim: 2, name: parallel_schema[parallel_field_indices['live']].text},
    
            {dim: 3, name: parallel_schema[parallel_field_indices['radius']].text},
            {dim: 4, name: parallel_schema[parallel_field_indices['eke']].text},
            {dim: 5, name: parallel_schema[parallel_field_indices['ave_eke']].text},

            {dim: 6, name: parallel_schema[parallel_field_indices['max_radius']].text},
            {dim: 7, name: parallel_schema[parallel_field_indices['max_eke']].text},
            {dim: 8, name: parallel_schema[parallel_field_indices['max_ave_eke']].text},
    
            // {dim: 7, name: parallel_schema[parallel_field_indices['cx']].text},
            // {dim: 8, name: parallel_schema[parallel_field_indices['cy']].text},
    
        ],
        parallel: {
            // top: '25%',
            bottom: '15%',
            left: '8%',
            height: '60%',
            width: '80%',
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
                    // [start_step, end_step, live, 
                    // radius, eke, ave_eke, 
                    // max_radius, max_eke, max_ave_eke, 
                    // cx, cy, circ, name]
                    return [item[8], item[9], item[7]/2,  
                        item[2], item[3], item[4],
                        item[10], item[11], item[12],
                        item[0], item[1],  item[6], item[13]];
                }),
            }
        ]
    };

    return option;
}





