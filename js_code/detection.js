// 预设变量






init();

function init(){

    

    loadDectData(0);
    detection_window.setOption(detection_option = getOption(detection_data));
    // changeBackground(0);
}


function loadDectData(step){
    detection_data = [];

    detection_node_map.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curCirc;

    for(var index=0; index<eddyInfo[step].length; index++){
        curName = String(step)+'-'+String(index);

        var row = [];  // 每个节点的参数数组

        var d = step;

        [curX, curY] = getCurPos(d, index);
        
        curRadius = getCurRadius(d, index);
        curCirc = getCurCirc(d, index);



        // 把当前节点放到nodes中
        row = [curX, curY, curRadius, curCirc, curName];
        detection_data.push(row);
    }   
    // console.log(detection_data); 
}



function getCurCirc(d, index){
    var temp = eddyInfo[d][index][6];  // 气旋方向
    if(temp==1)
        return cycFlag;
    else return anticycFlag;
}


function getOption(data) {
    return {

        // backgroundColor: 'transparent',

        tooltip: {
            backgroundColor: ['rgba(255,255,255,0.7)'],
            
            formatter: function (obj) {

                var value = obj.value;

                var returnStr = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + '编号：'+ value[detection_field_indices['name']]+ '</div>';
                
                // // 加上y轴意义、大小的意义、类型
                // returnStr = returnStr
                //     + detection_schema[detection_field_indices[detection_gui_opt.yAxis]].name + '：' + value[1] + '<br>'
                //     + detection_schema[detection_field_indices[detection_gui_opt.symbolSize]].name + '：' + value[2] + '<br>'
                //     + detection_schema[1].name + '：' + value[3] + '<br>'
                //     + detection_schema[2].name + '：' + value[4] + '<br>'
                //     + detection_schema[5].name + '：' + value[5] + '<br>'
                //     + detection_schema[6].name + '：' + value[6] + '<br>'
                //     + detection_schema[7].name + '：' + value[7] + '<br>';
                    
                return returnStr;
            }
        },
        visualMap: {
            type: 'piecewise',
            categories: [anticycFlag, cycFlag],
            dimension: 3,
            orient: 'horizontal',
            top: 0,
            left: 'center',
            inRange: {
                // color: ['#51689b', '#ce5c5c']
                color: '#ffff00',
            },
            outOfRange: {
                color: '#ddd'
            },
            seriesIndex: [0],
            show: false,
            // formatter: function (value) { //标签的格式化工具。
            //     return value;
            // }
        },

        xAxis: {
            show: false,
            type: 'value',
            min: 0,
            max: 500,
            name: 'lon',
        },
        yAxis: {
            show: false,
            name: 'lat',
            min: 0,
            max: 500,
            type: 'value',
        },
       
        series: [
            {
                zlevel: 1,
                name: 'xxx',
                type: 'effectScatter',
                // symbolSize: 50,
                data: data,

                symbolSize:(rawValue, params) => {  // 默认半径作为size
                    // console.log(params)
                    params.symbolSize = params.data[detection_field_indices['radius']];
                    return Math.sqrt(params.symbolSize)*0.8;
                },



                // animationThreshold: 5000,
                // progressiveThreshold: 5000
            }
        ],
        grid: {
            left: '0',
            right: '0',
            bottom: '0',
            top:'0',
            containLabel: false,
        },
        animationEasingUpdate: 'cubicInOut',
        animationDurationUpdate: 2000
    };
}


