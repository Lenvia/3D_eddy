import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader3.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

/**
 * 框架组件
 */
var container;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器

/**
 * 预设变量
 */
// 窗口大小
var renderWidth , renderHeight;  // 不含单位px
var containerWidth, containerHeight;

// 特征
var eddyForwards = eddyFeature['forward'];  // 向未来追踪
var eddyBackwards = eddyFeature['backward'];  // 向以前回溯
var eddyInfo = eddyFeature['info'];



/**
 * 局部窗口
 */
var existedCones = [];  // 场上存在的标记
var existedPartNames = [];  // 场上存在的partName
var willBeAddPartNames = [];  // 需要添加的partName

/**
 * 拓扑窗口
 */

var data = [];  // 拓扑结点数据
var edges = [];  // 拓扑箭头
var topo_option;  // 拓扑图组件
// var chosenTopoNodeId;  // 被鼠标点击的拓扑节点id



// 原始数据schema，并非传递给series的数据下表
var schema = [
    {name: 'day', index: 0, text:'day'},
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
var fieldIndices = schema.reduce(function (obj, item) {
    obj[item.name] = item.index;
    return obj;
}, {});


var xAxisData = [];
for(let i=0; i<tex_pps_day; i++){
    xAxisData.push(i);
}


// 映射
var globalNodesMap = new Map();  // 涡旋名->拓扑图节点id； 用于去重，对于map里存在的，不让它入队
var existedNodesMap = new Map();  // 场上显示的节点map

// 拓扑gui
var topo_gui;
var topo_gui_opt;

var scaleFactor = 1;

var indexCtrl;
var index_arr = [];
for(let i=0; i<40; i++){
    index_arr.push(i);
}


// 拓扑组件样式
var cycNodeColor = "#ce5c5c";  // 气旋颜色，红色
var anticycNodeColor = "#51689b";  // 反气旋颜色，蓝色
var cycFlag = '气旋';
var anticycFlag = '反气旋';




init();


function init() {
    // container = document.getElementById( 'container2' );
    // container.innerHTML = "";

    // setRenderSize();

    // renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    // renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    // renderer.setSize( renderWidth, renderHeight );  // 尺寸


    // container.appendChild( renderer.domElement );

    // scene = new THREE.Scene();
    // // scene.background = new THREE.Color( 0x1b76dd );  // 深蓝色
    // scene.background = new THREE.Color( 0x000000 );

    // // PerspectiveCamera( fov, aspect, near, far )  视场、长宽比、渲染开始距离、结束距离
    // camera = new THREE.PerspectiveCamera( 60, renderWidth / renderHeight, 50, 20000 );
    // camera.position.z = 3000;
    // camera.position.x = edgeLen*0;
    // camera.position.y = edgeWid*0;


    // controls = new OrbitControls( camera, renderer.domElement );
    // controls.minDistance = 50;   // 最近距离
    // controls.maxDistance = 10000;  // 最远距离
    // // controls.maxPolarAngle = Math.PI / 2;  // 限制竖直方向上最大旋转角度。（y轴正向为0度）
    // controls.target.z = 0;
    // controls.update();


    // // 辅助坐标系
    // var axesHelper = new THREE.AxesHelper(1500);
    // scene.add(axesHelper);

    // // createSea();

    // // 环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    // var ambient = new THREE.AmbientLight(0xffffff);
    // scene.add(ambient);


    // var dayChangeButtonContainer = document.getElementById('day-change-button-container');
    // container.appendChild(dayChangeButtonContainer);

    setTopoGUI();

    var guiTopoContainer = document.getElementById('gui_topo');
    guiTopoContainer.appendChild(topo_gui.domElement);
    topo_container.appendChild(guiTopoContainer);

    topo_window.setOption(topo_option = getOption(data));


    // 窗口缩放时触发
    // window.addEventListener( 'resize', onWindowResize, false );
    animate();
}

function onWindowResize() {
    setRenderSize();
    camera.aspect = renderWidth / renderHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( renderWidth, renderHeight );
}



function createSea(){
    // 海水箱子的长、宽
    var boxLen = edgeLen, boxWid = edgeLen;
    const geometry2 = new THREE.BoxGeometry(boxLen, boxWid, boxHeight);
    const material2 = new THREE.MeshLambertMaterial({
        // color: 0x1E90FF,
        color: 0x191970,
        transparent: true,
        opacity: 0.2,
        depthWrite: false, 
        vertexColors: true,
    }); //材质对象Material

    geometry2.translate(0, 0, -boxHeight/2);
    var mesh2 = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    mesh2.position.set(0,0,0);
    // console.log(mesh2);
    scene.add(mesh2); //网格模型添加到场景中
}



// function getPartNameFromPxy(tarCpx, tarCpy){  // 根据目标涡旋中心坐标得到对应的partName
//     // var partIndex = choosePart(tarCpx, tarCpy);
//     // console.log(partIndex);
//     // var partName = String(currentMainDay)+"_"+String(partIndex);
//     var partName = "tube"+String(currentMainDay);
//     console.log(partName);

//     return partName;
// }



// 从本地vtk加载模型
function loadLocalEddy(partName){
    var promise = new Promise(function(resolve, reject) {
        var vtk_path = ("./resources/local_vtk_folder/force_2_pp_20000/".concat(partName,'.vtk'))
        console.log("正在加载"+partName);
        var loader = new VTKLoader();

        loader.load( vtk_path, function ( geometry ) {  // 异步加载
            geometry.translate(-0.5, -0.5, 0);
            
            var positions = geometry.attributes.position.array;

            var biasZ = [];
            for ( let j = 0;  j < positions.length; j += 3 ) {
                // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
                var realLayer = positions[j+2]*50;
                var apprLayer = Math.round(realLayer);  // 四舍五入
                biasZ.push(realLayer-apprLayer);  // 记录此后应当偏移多少
                positions[j+2] = -depth_array[apprLayer]+biasZ[j/3]*tubeHeightFactor;
            }

            geometry.scale(edgeLen, edgeWid, scaleHeight);
            positions = geometry.attributes.position.array;

            // console.log(biasZ);

            geometry.computeVertexNormals();
            geometry.normalizeNormals();


            let material = new THREE.MeshLambertMaterial({
                transparent: true, // 可定义透明度
                opacity: 0.6,
                depthWrite: false,
                side: THREE.DoubleSide,
                flatShading: true,
                // vertexColors: true,
                color: 0xffffff,
                emissive: new THREE.Color( 0x00ff00 ), 
            });

            var tube = new THREE.Mesh(geometry, material);
            
            tube.name = partName;
            // console.log(partName, "加载完毕");

            scene.add(tube);
            

            resolve(partName);
        });
    });
    promise.then(()=>{
        console.log("加载完毕");
        return ;
    })
}

// 显示当前涡旋的指示器
function showPointer(index) {
    var info = eddyInfo[currentMainDay];
    var cpx = info[index][0];  // cpx指的是在panel上的cx
    var cpy = info[index][1];

    var cxy = pxy2xy(cpx, cpy);

    // 在涡核处显示标记
    var geometryTri = new THREE.ConeGeometry( 30, 150, 3 );
    geometryTri.rotateX( -Math.PI / 2 );
    // 直接setPosition好像不行，还是平移吧
    geometryTri.translate(cxy[0], cxy[1], 75);
    
    var cone = new THREE.Mesh( geometryTri, new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.7
    }));
    cone.name = "pointer-"+String(currentMainDay)+"_"+String(index);
    existedCones.push(cone);
    scene.add( cone );
}

// 移除场上所有的指示器
function removePointers(){
    for(let i=0; i<existedCones.length; i++){
        var item = existedCones[i];
        deleteModel(item);
        scene.remove(item);
    }
    existedCones.length = 0;  // 清空数组
    
}

// 清空场上涡旋index数组
function clearEEI(){
    existedEddyIndices.length = 0;
}

// // 清空场上红色涡旋
// function clearSpecificNodes(){
//     for(let i=0; i<specificNodeNames.length; i++){
//         console.log("清理场上红色涡旋");
//         var curName = specificNodeNames[i];
//         var id = globalNodesMap.get(curName);
//         var d = parseInt(curName.split("-")[0]);
//         var index = parseInt(curName.split("-")[1]);
//         updateNodeColor(id, getCurColor(d, index));  // 更新颜色
//     }
// }

// // 显示当前场上涡旋的下一日延续
// function showNextEddies(){
//     if(existedEddyIndices.length==0)  // 如果场上根本没有涡旋，直接return
//         return;
//     if(currentMainDay+1>=dayLimit)  // 没有下一天了
//         return; 
//     if(!is3d){
//         // 清理一下拓扑图里的红色节点
//         for(let i=0; i<existedEddyIndices.length; i++){
//             var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
//             var id = globalNodesMap.get(name);
//             var curColor = getCurColor(currentMainDay, existedEddyIndices[i]);
//             updateNodeColor(id, curColor);
//         }
//         specificNodeNames.length = 0;  // 清空
//     }

//     removePointers(); // 清除场上所有标记

//     existedEddyIndices = trackAll(existedEddyIndices, currentMainDay); // 获得下一天的延续
//     console.log(existedEddyIndices);
    

//     // 更新curMainDay，但不让其影响局部窗口
//     restrainUpdateSign = true;
//     day_ctrl.setValue(currentMainDay+1);  // 设置为下一天

//     if(!is3d){
//         // 设置场上红色节点
//         for(let i=0; i<existedEddyIndices.length; i++){
//             var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
//             var id = globalNodesMap.get(name);
//             updateNodeColor(id, specificNodeColor);  // 变为红色
//             specificNodeNames.push(name);
//         }
//         // 更新topo图
//         network.redraw();
//     }

//     // 这时候currentMainDay已经更新为下一天了（下面showPointer需要用到currentMainDay）
//     for(let i=0; i<existedEddyIndices.length; i++){
//         showPointer(existedEddyIndices[i]);
//     }
// }
// // 回溯上一日涡旋
// function showPreEddies(){
//     if(existedEddyIndices.length==0)
//         return;
//     if(currentMainDay-1<0)
//         return;

//     if(!is3d){
//         // 清理一下拓扑图里的红色节点
//         for(let i=0; i<existedEddyIndices.length; i++){
//             var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
//             var id = globalNodesMap.get(name);

//             var curColor = getCurColor(currentMainDay, existedEddyIndices[i]);
//             updateNodeColor(id, curColor);
//             specificNodeNames.length = 0;
            
//         }
//     }

//     removePointers();
//     existedEddyIndices = backtrackAll(existedEddyIndices, currentMainDay);  // 获得上一天

//     restrainUpdateSign = true;
//     day_ctrl.setValue(currentMainDay-1);

//     if(!is3d){
//         // 设置场上红色节点
//         for(let i=0; i<existedEddyIndices.length; i++){
//             var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
//             var id = globalNodesMap.get(name);
//             updateNodeColor(id, specificNodeColor);  // 变为红色
//             specificNodeNames.push(name);
//         }
//         // 更新topo图
//         network.redraw();
//     }

//     for(let i =0; i<existedEddyIndices.length; i++){
//         showPointer(existedEddyIndices[i]);
//     }
// }

// // 计算涡旋属于哪一个part
// function choosePart(px, py){
//     if(py-px>125)  // 左上角
//         return 1;
//     else if(py-px<-125)  // 右下角
//         return 2;
//     else return 3;  // 中央
// }

// 更新part
// 在e数组中，保留与w重合的，其他的都删除，并添加w独有的
function updateParts(){
    console.log(existedPartNames);
    console.log(willBeAddPartNames);
    // 删除e中有的而w中没有的
    for(let i=0; i<existedPartNames.length; ){  // 注意这里不能简单的i++
        if(willBeAddPartNames.indexOf(existedPartNames[i]) == -1){  // 需要删除的
            var curPart = scene.getObjectByName(existedPartNames[i]);
            deleteModel(curPart);  // 删除模型的geometry和材质
            scene.remove(curPart);
            existedPartNames.splice(i, 1);  // 删除当前元素
        }
        else i++;
    }
    // 向e中添加w中独有的
    for(let i=0; i<willBeAddPartNames.length; i++){
        if(existedPartNames.indexOf(willBeAddPartNames[i])==-1){  // w中独有的，需要添加模型
            loadLocalEddy(willBeAddPartNames[i]);  // 加载模型
            existedPartNames.push(willBeAddPartNames[i]);  // 放入已加载数组
        }
    }

    willBeAddPartNames.length = 0;  // 清空待更新数组
}




function loadTopo(firstName){
    data = [];
    edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var curId, curName, curX, curY, curRadius, curEke, curDepth, curVort,  curCirc, curColor, curFontColor;
    var nextId = 0;

    queue.push(firstName);  // 把当前涡旋的名称放进去
    idQueue.push(nextId);
    existedNodesMap.set(firstName, nextId);
    
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
        curDepth = getCurDepth(d, index);
        curVort = getCurVort(d, index);
        curCirc = getCurCirc(d, index);
        curColor = getCurColor(d, index);

        // 把当前节点放到nodes中
        row = [d,  curX, curY, curRadius, curEke, curDepth, curVort, curCirc, curColor, curName];
        data.push(row);


        var forwards = eddyForwards[d][index];  // 得到它后继列表
        var tempId;
        for(let i=0; i<forwards.length; i++){
            var tarName = forwards[i];

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
        }

        // 向前追踪时，不用添加边。因为其前驱在向后追踪时会添加。
        var backwards = eddyBackwards[d][index];  // 得到它后继下标
        var tempId;

        for(let i=0; i<backwards.length; i++){
            var tarName = backwards[i];

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
        }
    }
    // 刷新
    flushData();
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
    return eddyInfo[d][index][4];  // 能量
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
                + '编号：'+ value[9]+ '</div>';
                
                // 加上y轴意义、大小的意义、类型
                returnStr = returnStr
                    + schema[fieldIndices[topo_gui_opt.yAxis]].name + '：' + value[1] + '<br>'
                    + schema[fieldIndices[topo_gui_opt.symbolSize]].name + '：' + value[2] + '<br>'
                    + schema[1].name + '：' + value[3] + '<br>'
                    + schema[2].name + '：' + value[4] + '<br>'
                    + schema[5].name + '：' + value[5] + '<br>'
                    + schema[6].name + '：' + value[6] + '<br>'
                    + schema[7].name + '：' + value[7] + '<br>';
                    
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
                // type:'scatter',
                coordinateSystem: 'cartesian2d',
                label: {
                    show: true,
                    formatter: function (params) {  // 显示文字
                        // console.log(params.data);
                        return params.data[9];
                    }
                },
                data: data.map(function (item) {
                    // [day, eke, radius, cx, cy, depth, vort,  circ, color, name]
                    return [item[0], item[4], item[3], item[1], item[2], item[5], item[6], item[7], item[8], item[9]];
                }),

                // data: fakeData,

                symbolSize:(rawValue, params) => {  // 默认半径作为size
                    params.symbolSize = params.data[2];
                    console.log(params.symbolSize);
                    return Math.sqrt(params.symbolSize)*3;
                },

                itemStyle:{
                    normal : {
                        color : function(params) {
                            params.color = params.data[8];
                            
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

                // animationThreshold: 5000,
                // progressiveThreshold: 5000
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
        this.symbolSize = 'radius';
        this.day = 0;
        this.index = 0;
        this.scaleFactor = 1;
    };

    topo_gui.add(topo_gui_opt, 'day', xAxisData).onChange(function(){
        // 如果改变了日期，index默认回归0
        loadTopo(String(topo_gui_opt.day)+'-'+'0');
        indexCtrl.setValue(0);
        // console.log(indexCtrl);
        flushData();
    });

    indexCtrl = topo_gui.add(topo_gui_opt, 'index', index_arr).onChange(function(){
        loadTopo(String(topo_gui_opt.day)+'-'+String(topo_gui_opt.index));
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
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7], 
                            item[8],
                            item[9],
                            // idx
                        ];
                    }),
                    links: edges,
                }
            });
        }
    }).listen();

    // y轴映射
    topo_gui.add(topo_gui_opt, 'yAxis', ['eke', 'radius', 'depth', 'vort', 'cx', 'cy']).onChange(function(){
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
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7], 
                            item[8],
                            item[9],
                            // idx
                        ];
                    })
                }
            });
        }
    });

    // 结点大小映射
    topo_gui.add(topo_gui_opt, 'symbolSize', ['radius','eke', 'cx', 'cy']).onChange(function(){
        if (data) {
            topo_window.setOption({
                series: {
                    data: data.map(function (item, idx) {
                        return [
                            item[0],
                            item[fieldIndices[topo_gui_opt.yAxis]],  // y轴的值
                            item[fieldIndices[topo_gui_opt.symbolSize]],
                            item[1],
                            item[2],
                            item[5],
                            item[6], 
                            item[7],
                            item[8],
                            item[9],  
                            // idx
                        ];
                    }),
                }
            });
        }
    });

    // 结点缩放映射
    topo_gui.add(topo_gui_opt, 'scaleFactor', [0.01, 0.1, 0.2, 0.33, 0.5, 1, 2, 3, 5, 10, 100]).onChange(function(){
        if (data) {
            scaleFactor = topo_gui_opt.scaleFactor;
            topo_window.setOption({
                series: {
                    symbolSize:(rawValue, params) => {
                        params.symbolSize = scaleFactor*Math.sqrt(params.data[2]);
                        return (params.symbolSize);
                    },
                }
            });
        }
    });
}


function animate() {
    requestAnimationFrame( animate );
    // 监测鼠标点击
    // tarArr 最近的涡旋的下标、中心坐标
    if(tarArr[0]!= undefined && pitchUpdateSign){  // 如果涡旋下标tarArr[0]不为空，并且收到更新信号
        pitchUpdateSign = false;  // 立刻消除更新信号
        var eddyIndex = tarArr[0];

        // removePointers();  // 清除原有显示
        clearEEI();  // 清空场上涡旋index数组

        // showSpecifiedArea(tarArr);
        // var tempName = getPartNameFromPxy(tarArr[1], tarArr[2]);  // 得到临近涡旋所属的partName
        // willBeAddPartNames.push(tempName);  // 放入exsitedPartNames数组等待添加

        // updateParts();

        // showPointer(eddyIndex);  // 显示该涡旋指示器
        existedEddyIndices.push(eddyIndex);  // 放入当前涡旋编号

        // chosenTopoNodeId = globalNodesMap.get(String(currentMainDay)+"-"+String(eddyIndex));
        // console.log(chosenTopoNodeId);

        if(!is3d)  // 只在2d视图加载拓扑
            loadTopo(String(currentMainDay)+'-'+String(eddyIndex));

    }

    if(switchUpdateSign){  // 如果主界面切换了天数
        console.log("刷新局部涡旋窗口")
        switchUpdateSign = false;  // 消除更新信号

        // 清空场上所有part
        willBeAddPartNames.length = 0;  // 清空待更新数组
        // updateParts();

        if(!is3d){
            // 初始化拓扑（不一定需要）
        }

        // removePointers();  // 清除原有显示
        clearEEI();  // 清空场上涡旋index数组
        // 不追踪！
    }

    // if(showNextEddiesSign){  // 在局部窗口点击了追踪下一天

    //     showNextEddiesSign = false; //清除标记
    //     showNextEddies();  // 执行完毕后currentMainDay已经增加了

    //     // console.log(existedEddyIndices);

    //     var info = eddyInfo[currentMainDay];
    //     // 这时候日期已经切换了
    //     for(let i=0; i<existedEddyIndices.length; i++){
    //         var tempName = getPartNameFromPxy(info[existedEddyIndices[i]][0], info[existedEddyIndices[i]][1]);
    //         willBeAddPartNames.push(tempName);
    //     }
    //     console.log(willBeAddPartNames);

    //     dyeSign = true;  // 提示主窗口去染色

    //     updateParts();
    // }

    // if(showPreEddiesSign){  // 在局部窗口点击了追踪上一天
    //     showPreEddiesSign = false;  // 清除标记
    //     showPreEddies();
    //     var info = eddyInfo[currentMainDay];
    //     // 这时候日期已经切换了
    //     for(let i=0; i<existedEddyIndices.length; i++){
    //         var tempName = getPartNameFromPxy(info[existedEddyIndices[i]][0], info[existedEddyIndices[i]][1]);
    //         willBeAddPartNames.push(tempName);
    //     }

    //     dyeSign = true;  // 提示主窗口去染色

    //     updateParts();
    // }

    // if(!is3d && topoClickSign){  // 点击了拓扑图上的节点，并且是2d视图
    //     topoClickSign = false;

    //     var tarName = data.nodes.get(chosenTopoNodeId).label;  // 目标涡旋的名称
    //     var tarDay = parseInt(tarName.split('-')[0]);
    //     var tarIndex = parseInt(tarName.split('-')[1]);
    //     loadTopo(tarDay, tarIndex);
        

    //     // 更新主界面
    //     restrainUpdateSign = true;  // 抑制主界面对局部窗口的更改
    //     day_ctrl.setValue(tarDay);

    //     // 此时日期已经改变了
    //     // 在主界面上显示红色Cones标记  
    //     clearEEI();  // 清空场上涡旋index数组
    //     existedEddyIndices.push(tarIndex);
    //     dyeSign = true;  // 通知主界面去染色

    //     // // 局部Part更新
    //     // // removePointers();  // 清除所有指示器
    //     // willBeAddPartNames.length = 0;  // 清空待更新数组
    //     // // 得到对应的part
    //     // var info = eddyInfo[currentMainDay];
    //     // var cpx = info[tarIndex][0];  // cpx指的是在panel上的cx
    //     // var cpy = info[tarIndex][1];

    //     // // console.log(cpx, cpy);
    
    //     // var cxy = pxy2xy(cpx, cpy);

    //     // // console.log(cxy);
    //     // var tempName = getPartNameFromPxy(cxy[0], cxy[1]);  // 得到临近涡旋所属的partName
    //     // willBeAddPartNames.push(tempName);  // 放入exsitedPartNames数组等待添加
    //     // updateParts();
    //     // showPointer(tarIndex);  // 显示该涡旋指示器

    // }

    // render();
}

function render() {
    renderer.render( scene, camera );
}

function setRenderSize() {
    containerWidth = String(getStyle(container, "width"));
    containerHeight = String(getStyle(container, "height"));

    containerWidth = containerWidth.slice(0, containerWidth.length-2);  // 去掉末尾的px
    containerHeight = containerHeight.slice(0, containerHeight.length-2);

    renderWidth = parseInt(containerWidth);
    renderHeight = parseInt(containerHeight);
    // renderWidth = 0.5*window.innerWidth, renderHeight = 0.6*window.innerHeight;
    // console.log(renderWidth, renderHeight);
}

function flushData(){
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
                        item[1],
                        item[2],
                        item[5],
                        item[6], 
                        item[7], 
                        item[8],
                        item[9],
                        // idx
                    ];
                }),
                links: edges,
            }
        });
    }
}