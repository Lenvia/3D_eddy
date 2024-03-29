

function updateAttrFrequency(){
    var attr_data_path = ("./echarts/".concat(currentAttr, "/", currentAttr, "_", currentMainStep, ".json"));
    console.log(attr_data_path);
    
    $.ajax({
        url: attr_data_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            // 指定图表的配置项和数据
            var option = {
                backgroundColor: new echarts.graphic.RadialGradient(0.3, 0.3, 0.8, [{
                    offset: 0,
                    color: '#f7f8fa'
                }, ]),
                title: {
                    // text: 'ECharts 实例'
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function (obj) {
                        obj = obj[0];  // 返回的是个数组，取出来元素
                        if(obj.value!=undefined){
                            // console.log(obj)
                            var returnStr = "value: "+ parseFloat(obj.axisValue).toExponential(4) + '<br>'+"frequency: " + obj.value.toExponential(4);
            
                            return returnStr;
                        }
                        
                    }
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
                        show: true,
                        realtime: true,
                        filterMode: 'filter',
                        start: 0,
                        end: 100,
                        xAxisIndex: 0,
                        orient:"horizontal",
                    },
                ],

                legend: {  // 图例
                    // data:['销量']
                },
                xAxis: {
                    // name: 'value',
                    data: res['columns'],
                },
                yAxis: {
                    name: 'frequency',
                },
                series: [{
                    // name: '属性值',
                    type: 'bar',
                    data: res['frequency']
                }],

                grid: {

                    left: '4%',
                    right: '6%',
                    bottom: '14%',
                    containLabel: true
                },
            };

            // 使用刚指定的配置项和数据显示图表。
            frequency_window.setOption(option);
        }
    })
}

