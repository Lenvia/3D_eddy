updateEcharts();

function updateEcharts(){
    var attr_data_path = ("./echarts/OW/OW_0.json");
    
    $.ajax({
        url: attr_data_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            // 指定图表的配置项和数据
            var option = {
                title: {
                    // text: 'ECharts 实例'
                },
                tooltip: {},
                legend: {  // 图例
                    // data:['销量']
                },
                xAxis: {
                    data: res['columns'],
                },
                yAxis: {},
                series: [{
                    // name: '属性值',
                    type: 'bar',
                    data: res['values']
                }]
            };

            // 使用刚指定的配置项和数据显示图表。
            frequency_window.setOption(option);
        }
    })
}

