import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader3.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

var container;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器


const worldWidth = 256, worldDepth = 256; // 控制地形点的数目
const worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var renderWidth , renderHeight;  // 不含单位px
var containerWidth, containerHeight;



var existedCones = [];  // 场上存在的标记

var existedPartNames = [];  // 场上存在的partName
var willBeAddPartNames = [];  // 需要添加的partName

var existedNodesMap = new Map();  // 涡旋名->拓扑图节点id； 用于去重，对于map里存在的，不让它入队
var topoData, topoOptions;  // 拓扑图元素
var defaultNodeColor = '#00BFFF';
var cycNodeColor = '#faf955';  // 气旋颜色，黄色
var anticycNodeColor = '#382da1';  // 反气旋颜色，蓝紫色
var specificNodeColor = '#ff0000';
var chosenTopoNodeId;

var eddyForwards = eddyFeature['forward'];  // 向未来追踪
var eddyBackwards = eddyFeature['backward'];  // 向以前回溯
var eddyInfo = eddyFeature['info'];

init();


function init() {
    container = document.getElementById( 'container2' );
    container.innerHTML = "";

    setRenderSize();

    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( renderWidth, renderHeight );  // 尺寸


    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0x1b76dd );  // 深蓝色
    scene.background = new THREE.Color( 0x000000 );

    // PerspectiveCamera( fov, aspect, near, far )  视场、长宽比、渲染开始距离、结束距离
    camera = new THREE.PerspectiveCamera( 60, renderWidth / renderHeight, 50, 20000 );
    camera.position.z = 3000;
    camera.position.x = edgeLen*0;
    camera.position.y = edgeWid*0;


    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 50;   // 最近距离
    controls.maxDistance = 10000;  // 最远距离
    // controls.maxPolarAngle = Math.PI / 2;  // 限制竖直方向上最大旋转角度。（y轴正向为0度）
    controls.target.z = 0;
    controls.update();


    // 辅助坐标系
    var axesHelper = new THREE.AxesHelper(1500);
    scene.add(axesHelper);

    createSea();

    //环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);


    var dayChangeButtonContainer = document.getElementById('day-change-button-container');
    container.appendChild(dayChangeButtonContainer);


    // 窗口缩放时触发
    window.addEventListener( 'resize', onWindowResize, false );


    // 拓扑容器
    topo_container = document.getElementById('topo-container');

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
    const geometry2 = new THREE.BoxGeometry(boxLen, boxWid, biasZ);
    const material2 = new THREE.MeshLambertMaterial({
        // color: 0x1E90FF,
        color: 0x191970,
        transparent: true,
        opacity: 0.2,
        depthWrite: false, 
        vertexColors: true,
    }); //材质对象Material

    geometry2.translate(0, 0, -biasZ/2);
    var mesh2 = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    mesh2.position.set(0,0,0);
    // console.log(mesh2);
    scene.add(mesh2); //网格模型添加到场景中
}



function getPartNameFromPxy(tarCpx, tarCpy){  // 根据目标涡旋中心坐标得到对应的partName
    var partIndex = choosePart(tarCpx, tarCpy);
    // console.log(partIndex);
    var partName = String(currentMainDay)+"_"+String(partIndex);

    return partName;
}



// 从本地vtk加载模型
function loadLocalEddy(partName){
    var promise = new Promise(function(resolve, reject) {
        var vtk_path = ("./resources/local_vtk_folder/force_2_pp_10000/".concat(partName,'.vtk'))
        var loader = new VTKLoader();

        loader.load( vtk_path, function ( geometry ) {  // 异步加载
            geometry.translate(-0.5, -0.5, 0);
            
            var positions = geometry.attributes.position.array;
            for ( let j = 0;  j < positions.length; j += 3 ) {
                // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
                positions[j+2] = -depth_array[Math.round(positions[j+2]*50)];
            }

            geometry.scale(edgeLen, edgeWid, scaleHeight);

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

            //need update 我不知道有没有用，感觉没用
            // linesG.geometry.colorsNeedUpdate = true;
            // linesG.geometry.groupsNeedUpdate = true;
            // linesG.material.needsUpdate = true;
            
            tube.name = partName;
            // console.log(partName, "加载完毕");

            scene.add(tube);

            resolve(partName);
        });
    });
    promise.then(()=>{
        // var model = findModel2(name);
        // console.log(name, "加载完毕！");
        return ;
    })
}

// 显示当前涡旋的指示器
function showPointer(index) {
    var info = eddyFeature['info'][currentMainDay];
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

// 显示当前场上涡旋的下一日延续
function showNextEddies(){
    if(existedEddyIndices.length==0)  // 如果场上根本没有涡旋，直接return
        return;
    if(currentMainDay+1>=dayLimit)  // 没有下一天了
        return; 
    // console.log(existedEddyIndices);

    if(!is3d){
        // 清理一下拓扑图里的红色节点
        for(let i=0; i<existedEddyIndices.length; i++){
            var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
            var id = existedNodesMap.get(name);
            if(id!=undefined){
                var curColor = getCurColor(currentMainDay, existedEddyIndices[i]);
                topoData.nodes[id-1].color=curColor;
            }
            
        }
    }

    removePointers(); // 清除场上所有标记

    existedEddyIndices = trackAll(existedEddyIndices, currentMainDay); // 获得下一天的延续
    console.log(existedEddyIndices);
    

    // 更新curMainDay，但不让其影响局部窗口
    restrainUpdateSign = true;
    day_ctrl.setValue(currentMainDay+1);  // 设置为下一天

    if(!is3d){
        // 设置场上红色节点
        for(let i=0; i<existedEddyIndices.length; i++){
            var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
            var id = existedNodesMap.get(name);
            if(id!=undefined)  // 这里特别提醒，因为有的后继不在这条线，强行染色会报错
                topoData.nodes[id-1].color=specificNodeColor;  // 变为红色
        }
        // 更新topo图
        network = new vis.Network(topo_container, topoData, topoOptions);
        bindClickEvent();
    }

    // 这时候currentMainDay已经更新为下一天了（下面showPointer需要用到currentMainDay）
    for(let i=0; i<existedEddyIndices.length; i++){
        showPointer(existedEddyIndices[i]);
    }
}
// 回溯上一日涡旋
function showPreEddies(){
    if(existedEddyIndices.length==0)
        return;
    if(currentMainDay-1<0)
        return;

    if(!is3d){
        // 清理一下拓扑图里的红色节点
        for(let i=0; i<existedEddyIndices.length; i++){
            var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
            var id = existedNodesMap.get(name);
            if(id!=undefined){
                var curColor = getCurColor(currentMainDay, existedEddyIndices[i]);
                topoData.nodes[id-1].color=curColor;
            }
        }
    }

    removePointers();
    existedEddyIndices = backtrackAll(existedEddyIndices, currentMainDay);  // 获得上一天

    restrainUpdateSign = true;
    day_ctrl.setValue(currentMainDay-1);

    if(!is3d){
        // 设置场上红色节点
        for(let i=0; i<existedEddyIndices.length; i++){
            var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
            var id = existedNodesMap.get(name);
            if(id!=undefined)  // 这里特别提醒，因为有的前驱不在这条线上，强行染色会报错
                topoData.nodes[id-1].color=specificNodeColor;  // 变为红色
        }
        // 更新topo图
        network = new vis.Network(topo_container, topoData, topoOptions);
        bindClickEvent();
    }

    for(let i =0; i<existedEddyIndices.length; i++){
        showPointer(existedEddyIndices[i]);
    }
}

// 计算涡旋属于哪一个part
function choosePart(px, py){
    if(py-px>125)  // 左上角
        return 1;
    else if(py-px<-125)  // 右下角
        return 2;
    else return 3;  // 中央
}

// 更新part
// 在e数组中，保留与w重合的，其他的都删除，并添加w独有的
function updateParts(){
    // console.log(existedPartNames);
    // console.log(willBeAddPartNames);
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

function getCurColor(d, index){
    var curCirc = eddyInfo[d][index][6];  // 气旋和反气旋
    // console.log(curCirc);
    if(curCirc>0)
        return cycNodeColor;
    else return anticycNodeColor;
}

// 每当点击涡旋or切换日期时，更新拓扑图
function loadTopo(){
    var nodes = [];
    var edges = [];

    var queue = new Array();  // 创建一个队列，使用push和shift入队和出队
    var idQueue = new Array();

    existedNodesMap.clear();  // 每次新选择的时候清空

    // 从json数组中追踪
    var fisrtName = String(currentMainDay)+"-"+String(tarArr[0]);
    queue.push(fisrtName);  // 把当前涡旋的名称放进去
    idQueue.push(1);

    existedNodesMap.set(fisrtName, 1);
    
    var curId, curName,curColor;
    var maxId = -1;
    while(queue.length!=0){  // 当队列不为空
        curId = idQueue[0];
        curName = queue[0];

        maxId = Math.max(maxId, curId);

        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        // 把当前节点放到nodes中
        // 如果是首节点，染成红色
        if(curId==1){
            nodes.push({
                id: curId,
                label: curName,
                color:specificNodeColor,
            });
        }
        else{
            curColor = getCurColor(d, index);

            nodes.push({
                id: curId,
                label: curName,
                color:curColor,
            });
        }
        // console.log(nodes);
        
        if(d+1>=tex_pps_day){  // 不用向后追踪了
            // 记得出队！！！
            queue.shift();  // 当前节点出队
            idQueue.shift();
            break;
        }

        var forwards = eddyForwards[d][index];  // 得到它后继下标
        var tempId;
        for(let i=0; i<forwards.length; i++){
            var tarName = String(d+1)+"-"+String(forwards[i]);

            if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                tempId = idQueue[idQueue.length-1]+1;  // 比末尾的节点id再大1
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                existedNodesMap.set(tarName, tempId);
            }
            else{  // 不用入队
                tempId = existedNodesMap.get(tarName);
            }
            
            // console.log(curName+" -> "+ tarName);

            // 添加边，现在不用添加点！
            edges.push({
                from: curId,
                to: tempId,
            });
        }

        // console.log(nodes);

        queue.shift();  // 当前节点出队
        idQueue.shift();
    }

    // 当上一个循环结束后，curId+1就是接下来要放的id
    var flag = true;  // 是首节点第一个回溯的点吗？
    // 再把首节点放进去
    queue.push(String(currentMainDay)+"-"+String(tarArr[0]));  // 把当前涡旋的名称放进去
    idQueue.push(1);
    while(queue.length!=0){  // 当队列不为空
        curId = idQueue[0];
        curName = queue[0];

        var d = parseInt(curName.split("-")[0]);
        var index = parseInt(curName.split("-")[1]);

        // 把当前节点放到nodes中，如果是首节点就不用了
        if(curId!=1){
            curColor = getCurColor(d, index);
            nodes.push({
                id: curId,
                label: curName,
                color:curColor,
            });
            console.log(curName, curColor);
        }
        // console.log(nodes);

        if(d-1<0){  // 不用向前追踪了
            queue.shift();  // 当前节点出队
            idQueue.shift();
            break;
        }

        var backwards = eddyBackwards[d][index];  // 得到它后继下标
        var tempId;
        
        for(let i=0; i<backwards.length; i++){
            var tarName = String(d-1)+"-"+String(backwards[i]);

            if(existedNodesMap.get(tarName)==undefined){  // 如果是个新的节点
                // 如果是首节点，那么最大的是maxId，而不是idQueue的末尾
                // 并且这个条件只能用一次！！！！！！
                if(curId==1 && flag){
                    tempId = maxId +1;
                    flag = false;
                }
                else{
                    tempId = idQueue[idQueue.length-1]+1;  // 比末尾的节点id再大1，末尾元素不能用arr[-1]啊啊啊啊啊啊那是py用法
                }
                queue.push(tarName);  // 涡旋入队
                idQueue.push(tempId);
                existedNodesMap.set(tarName, tempId);
            }
            else{  // 不用入队
                tempId = existedNodesMap.get(tarName);
            }

            // 添加边，现在不用添加点！
            edges.push({
                from: tempId,
                to: curId,
            });
        }

        queue.shift();  // 当前节点出队
        idQueue.shift();
    }

    // 将数据赋值给vis 数据格式化器
    topoData = {
        nodes: nodes,
        edges: edges
    };
    topoOptions = {
        nodes:{
            shape:'circle',
        },
        edges:{
            arrows:{
                to: {
                    enabled: true,
                    scaleFactor: 1,
                    type: 'arrow',
                },
            },
        },
        layout:{
            hierarchical:{
                direction: 'LR',
                sortMethod: 'directed',
                shakeTowards: 'roots',  // roots, leaves
            },
        },
    };

    // 初始化关系图
    network = new vis.Network(topo_container, topoData, topoOptions);
    bindClickEvent();

    
}

// 鼠标点击拓扑图上的节点后，更新拓扑图
// 将该节点染色
function updateTopo(nodeId){
    // 这时候时间还没有变
    // 清理一下拓扑图里的红色节点
    for(let i=0; i<existedEddyIndices.length; i++){
        var name = String(currentMainDay)+'-'+String(existedEddyIndices[i]);
        var id = existedNodesMap.get(name);

        var curColor = getCurColor(currentMainDay, existedEddyIndices[i]);
        topoData.nodes[id-1].color=curColor;  // 变为指定颜色
        console.log("清理节点:", name, "变为", curColor)  // faf黄色 382蓝色
    }
    // 将该节点变为红色
    topoData.nodes[nodeId-1].color=specificNodeColor;

    // 更新topo图
    network = new vis.Network(topo_container, topoData, topoOptions);
    bindClickEvent();
}

function bindClickEvent(){
    network.on("click",function(params){//绑定点击事件
        if(params.nodes.length>0){
            chosenTopoNodeId = params.nodes[0];
            topoClickSign = true;
        }
    });
}

function animate() {
    requestAnimationFrame( animate );


    // 监测鼠标点击
    // tarArr 最近的涡旋的下标、中心坐标
    if(tarArr[0]!= undefined && pitchUpdateSign){  // 如果涡旋下标tarArr[0]不为空，并且收到更新信号
        pitchUpdateSign = false;  // 立刻消除更新信号

        removePointers();  // 清除原有显示
        clearEEI();  // 清空场上涡旋index数组

        // showSpecifiedArea(tarArr);
        var tempName = getPartNameFromPxy(tarArr[1], tarArr[2]);  // 得到临近涡旋所属的partName
        willBeAddPartNames.push(tempName);  // 放入exsitedPartNames数组等待添加

        updateParts();

        showPointer(tarArr[0]);  // 显示该涡旋指示器
        existedEddyIndices.push(tarArr[0]);  // 放入当前涡旋编号

        if(!is3d)  // 只在2d视图加载拓扑
            loadTopo();

    }

    if(switchUpdateSign){  // 如果主界面切换了天数
        console.log("刷新局部涡旋窗口")
        switchUpdateSign = false;  // 消除更新信号

        // 清空场上所有part
        willBeAddPartNames.length = 0;  // 清空待更新数组
        updateParts();

        if(!is3d){
            // 清除拓扑图
            network = new vis.Network(topo_container, null, null);
        }

        removePointers();  // 清除原有显示
        clearEEI();  // 清空场上涡旋index数组
        // 不追踪！
    }

    if(showNextEddiesSign){  // 在局部窗口点击了追踪下一天

        showNextEddiesSign = false; //清除标记
        showNextEddies();  // 执行完毕后currentMainDay已经增加了

        // console.log(existedEddyIndices);

        var info = eddyFeature['info'][currentMainDay];
        // 这时候日期已经切换了
        for(let i=0; i<existedEddyIndices.length; i++){
            var tempName = getPartNameFromPxy(info[existedEddyIndices[i]][0], info[existedEddyIndices[i]][1]);
            willBeAddPartNames.push(tempName);
        }

        dyeSign = true;  // 提示主窗口去染色

        updateParts();
    }

    if(showPreEddiesSign){  // 在局部窗口点击了追踪上一天
        showPreEddiesSign = false;  // 清除标记
        showPreEddies();
        var info = eddyFeature['info'][currentMainDay];
        // 这时候日期已经切换了
        for(let i=0; i<existedEddyIndices.length; i++){
            var tempName = getPartNameFromPxy(info[existedEddyIndices[i]][0], info[existedEddyIndices[i]][1]);
            willBeAddPartNames.push(tempName);
        }

        dyeSign = true;  // 提示主窗口去染色

        updateParts();
    }

    if(!is3d && topoClickSign){  // 点击了拓扑图上的节点，并且是2d视图
        topoClickSign = false;
        updateTopo(chosenTopoNodeId);  // 清除其他节点颜色，并将被选择节点染色
        var tarName = topoData.nodes[chosenTopoNodeId-1].label;  // 目标涡旋的名称
        // console.log(tarName);

        // 更新主界面
        restrainUpdateSign = true;  // 抑制主界面对局部窗口的更改
        var tarDay = parseInt(tarName.split('-')[0]);
        day_ctrl.setValue(tarDay);

        // 此时日期已经改变了

        // 在主界面上显示红色标记
        var tarIndex = parseInt(tarName.split('-')[1]);
        clearEEI();  // 清空场上涡旋index数组
        existedEddyIndices.push(tarIndex);
        dyeSign = true;  // 通知主界面去染色

        // 局部Part更新
        removePointers();  // 清除所有指示器
        willBeAddPartNames.length = 0;  // 清空待更新数组
        // 得到对应的part
        var info = eddyFeature['info'][currentMainDay];
        var cpx = info[tarIndex][0];  // cpx指的是在panel上的cx
        var cpy = info[tarIndex][1];

        // console.log(cpx, cpy);
    
        var cxy = pxy2xy(cpx, cpy);

        // console.log(cxy);
        var tempName = getPartNameFromPxy(cxy[0], cxy[1]);  // 得到临近涡旋所属的partName
        willBeAddPartNames.push(tempName);  // 放入exsitedPartNames数组等待添加
        updateParts();
        showPointer(tarIndex);  // 显示该涡旋指示器

    }

    render();
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