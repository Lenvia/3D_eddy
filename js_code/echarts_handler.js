/**
 * echarts 共享变量
 */
var cycNodeColor = "#ce5c5c";  // 气旋颜色，红色
var anticycNodeColor = "#51689b";  // 反气旋颜色，蓝色
var cycFlag = '气旋';
var anticycFlag = '反气旋';

/**
 * 预加载共享数组
 */

var eddyFeature;  // 涡核信息数组
var eddyInfo;
var eddyForwards;
var eddyBackwards;
var liveInfo;

// 预设路径
var root_pic_path = './resources/detect_pic/';  // detection背景根路径


/**
 * 组件绑定（容器内部各自的gui自己管理）
 */

var detection_container = document.getElementById('detection-container');
var detection_window = echarts.init(detection_container);

var frequency_container = document.getElementById('frequency-container');
var frequency_window = echarts.init(frequency_container);

var path_container = document.getElementById('path-container');
var path_window = echarts.init(path_container);

var topo_container = document.getElementById('topo-container');
var topo_window = echarts.init(topo_container);

var parallel_container = document.getElementById('parallel-container');
var parallel_window = echarts.init(parallel_container);

/**
 * map, data, edges, option, schema
 */

// detection
var detection_node_map = new Map();
var detection_data = [];
var detection_edges = [];
var detection_option;

var detection_schema = [
    {name: 'cx', index: 0, text:'cx'},
    {name: 'cy', index: 1, text:'cy'},
    {name: 'radius', index: 2, text:'radius'},
    {name: 'circ', index: 3, text:'circ'},
    {name: 'name', index: 4, text:'name'},
];

// 便于通过name来找index
var detection_field_indices = detection_schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


// path
var path_node_map = new Map();
var path_data = [];
var path_edges = [];
var path_option;

var path_schema = [
    {name: 'cx', index: 0, text:'cx'},
    {name: 'cy', index: 1, text:'cy'},
    {name: 'radius', index: 2, text:'radius'},
    {name: 'circ', index: 3, text:'circ'},
    {name: 'color', index: 4, text:'color'},
    {name: 'name', index: 5, text:'name'},
    {name: 'live', index: 6, text:'live'},
];

// 便于通过name来找index
var path_field_indices = path_schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


// parallel
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


// topo
var topo_node_map = new Map();
var topo_data = [];
var topo_edges = [];
var topo_option;

// 原始数据topo_schema，并非传递给series的数据下表
var topo_schema = [
    {name: 'step', index: 0, text:'step'},
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
var topo_field_indices = topo_schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});