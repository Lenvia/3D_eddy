import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { VTKLoader } from './VTKLoader4.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

var container, stats;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器
var audio_player;
var div_start_time;


var maxH;  // 产生的山脉最大高度

const worldWidth = 256, worldDepth = 256; // 控制地形点的数目

var renderWidth, renderHeight;
setRenderSize();

let helper;  // 鼠标helper

const raycaster = new THREE.Raycaster();  // 射线
const mouse = new THREE.Vector2();  // 鼠标二维坐标

const days = [];  // 一共60天
const exDays = [-1]; // 扩展天数，第一个是-1
for (var i =0; i<=59; i++){
    days.push(i);
    exDays.push(i);
}


var existedSphere = [];  // 场上存在的标记

// 进度条模块
var progressModal, progressBar, progressLabel, progressBackground;
var frameLabel;


// gui参数
var gui;
var default_opt;  // 默认设置

// 本界面唯一变量
var curLine;  // 当前流线


var currentAttr;  // 当前属性
var upValue;  // 属性上界
var downValue;  // 属性下界
var difValue;  // 上下界差值
var mid1, mid2, mid3, mid4;  // 中间点
var keepValue = true;  // 保持设置
var hideChannel = false; // 隐藏海峡
var hideSurface = false;  // 隐藏陆地
var pitchMode = false;  // 选中模式（选择涡旋）


// 当前gui颜色面板值
var currentColor0 = [];
var currentColor1 = [];
var currentColor2 = [];
var currentColor3 = [];
var currentColor4 = [];
//当前gui透明度面板值
var currentOpacity0
var currentOpacity1;
var currentOpacity2;
var currentOpacity3;
var currentOpacity4;

// 实现双向绑定（重置面板）
var color0_ctrl;
var color1_ctrl;
var color2_ctrl;
var color3_ctrl;
var color4_ctrl;

var opa0_ctrl;
var opa1_ctrl;
var opa2_ctrl;
var opa3_ctrl;
var opa4_ctrl;

var upValue_ctrl;
var downValue_ctrl;

var textures_2d = [];



init();


function init() {
    container = document.getElementById( 'container' );
    container.innerHTML = "";

    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( renderWidth, renderHeight );  // 尺寸

    audio_player = document.getElementById('audio-player-container');
    progress_bar = document.getElementById("audio-progress-bar");
    draggable_point = document.getElementById("draggable-point");
    // console.log(progress_bar);

    div_start_time = document.getElementById('start-time');
    div_start_time.innerHTML = "000000";
    container.appendChild(audio_player);

    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );  // 浅蓝色

    // PerspectiveCamera( fov, aspect, near, far )  视场、长宽比、渲染开始距离、结束距离
    camera = new THREE.PerspectiveCamera( 60, renderWidth / renderHeight, 50, 20000 );
    camera.position.z = 5000;
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

    loadTexture2d();

    createSea();
    // createLand();
    createChannel();
    create2d();

    createHelper();

    // 显示等待条
    showProgressModal("loadingFrames");
    // 加载涡旋模型
    loadEddiesForDays();
    
    // 设置交互面板
    setGUI();

    //环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener( 'click', onMouseClick, false);

    stats = new Stats();
    container.appendChild( stats.dom );

    var guiContainer1 = document.getElementById('gui1');
    guiContainer1.appendChild(gui.domElement);
    container.appendChild(guiContainer1);

    var exContainer = document.getElementById('ex23d');
    container.appendChild(exContainer);

    // 窗口缩放时触发
    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
    setRenderSize();
    camera.aspect = renderWidth / renderHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( renderWidth, renderHeight );
}



function loadTexture2d(){
    for(let i=0; i<loadDayNum; i++){
        var str;
        if(i<10)
            str = '0'+String(i+1);  // 图片下标是从1开始的
        else
            str = String(i+1);
        
        var texture = THREE.ImageUtils.loadTexture('./resources/Ensemble1/Ensemble1TimeStep'+str+'.png', {}, function() {
            render();
        });

        textures_2d[i] = texture;
    }
    console.log(textures_2d);
}


function createHelper(){
    //sphereGeometry(radius, widthSegments, heightSegments)
    const geometryHelper = new THREE.SphereGeometry(10, 32, 32);

    helper = new THREE.Mesh( geometryHelper, new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
    }));
    scene.add( helper );

    helper.visible = false;
}


/*
    设置海底、海水、陆地
*/

function createSea(){
    // 海水箱子的长、宽
    var boxLen = edgeLen, boxWid = edgeLen;
    const geometry2 = new THREE.BoxGeometry(boxLen, boxWid, biasZ);
    const material2 = new THREE.MeshLambertMaterial({
        // color: 0x1E90FF,
        color: 0x191970,
        transparent: true,
        opacity: 0.5,
        depthWrite: false, 
        vertexColors: true,
    }); //材质对象Material

    geometry2.translate(0, 0, -biasZ/2);
    sea = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    sea.position.set(0,0,0);
    sea.name = "sea";
    scene.add(sea); //网格模型添加到场景中

    if(!is3d){  // 如果当前模式不是3d，隐藏
        sea.visible = false;
    }
}

function createLand(){
    // 生成第0层平面
    var path = ("./resources/whole_attributes_txt_file/".concat("surface.txt"));  // 默认盐都为0的地方都是陆地
    var arr = [];
    var promise1 = new Promise(function(resolve, reject) {
        $.get(path, function(data) {
            var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
            items.pop();
            // console.log(items);

            arr = items;
            resolve(1);
        });
    });

    promise1.then(()=>{
        var planeGeometry = new THREE.BufferGeometry();
        var indices = [];
        var positions = [];  // 上平面

        var rowNum, colNum;  // 行、列数量
        rowNum = arr.length; colNum = arr[0].length;
        var halfNum = rowNum*colNum;  // 一半顶点数

        // console.log(arr);
        /*
            上平面三角形
        */

        for(let i=0; i<rowNum; i++){
            for(let j=0; j<colNum; j++){
                // 上平面500*500个点
                positions.push(i/rowNum,j/colNum,0);  // 先把长和宽变成0～1之间
                if(arr[i][j]==0){
                    if(i+1<rowNum && j+1<colNum && arr[i+1][j]==0 && arr[i][j+1]==0){
                        // 与下边和右边顶点形成三角形（上平面）
                        indices.push(i*colNum+j, (i+1)*colNum+j, i*colNum+j+1);
                    }

                    if(i-1>=0 && j-1>=0 && arr[i-1][j]==0 && arr[i][j-1]==0){
                        // 与上边和左边顶点形成三角形（上平面）
                        indices.push(i*colNum+j, (i-1)*colNum+j, i*colNum+j-1);
                    }
                }
            }
        }
        // console.log(indices);

        planeGeometry.setIndex( indices );
		planeGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        // 与模型保持同等长宽缩放，高度可以不变
        planeGeometry.translate(-0.5, -0.5, 1);
        planeGeometry.scale(edgeLen, edgeWid, 1);

        var material = new THREE.MeshBasicMaterial( {
            color: 0xA0522D,
            side: THREE.DoubleSide,
            transparent: true, // 可定义透明度
            opacity: 0.9,
        } );
    
        surface = new THREE.Mesh( planeGeometry, material);
        surface.name = "surface";
        scene.add( surface );

        if(!is3d){  // 如果当前模式不是3d，隐藏
            surface.visible = false;
        }
    });
}

// 根据盐度数据建立峡谷
function createChannel(){
    var path = ("./resources/whole_attributes_txt_file/SALT/".concat("SALT_0.txt"));  // 默认盐都为0的地方都是陆地
    var arr;
    var promise1 = new Promise(function(resolve, reject) {
        $.get(path, function(data) {
            // 加载盐度数组
            var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
            items.pop(); // 去除结尾空格
            // console.log(items);
        
            // (经度, 纬度, 层)
            arr = new Array(500);
            for (var i = 0; i < arr.length; i++) {
                arr[i] = new Array(500);
                for (var j = 0; j < arr[i].length; j++) {
                    arr[i][j] = new Array(50);
                    for (var k = 0; k<arr[i][j].length; k++){
                        arr[i][j][k] = items[i][j*arr[i][j].length+k];
                    }
                }
            }
            resolve(1);
        });
    });

    promise1.then(()=>{
        // 设置竖直高度，用同样的顶点，所以positions可以不变
        var heightGeometry = new THREE.BufferGeometry();
        var indices = [];
        var positions = [];
        

        var rowNum, colNum, layerNum;
        rowNum = arr.length; colNum = arr[0].length;
        layerNum = arr[0][0].length;

        var leftBound = new Array(layerNum);  // leftBound[k][i] 表示第k层第i行的左边界下标
        var rightBound = new Array(layerNum);

        var layerVertexNum = rowNum*colNum;

        // console.log(rowNum, colNum, layerNum);

        var curLB, curRB;
        // 寻找第一个盐度非0值
        for(let k =0; k<layerNum; k++){
            leftBound[k] = new Array(rowNum);
            // 对于第k层
            for(let i=0; i<rowNum; i++){
                curLB = -1;
                for(let j=0; j<colNum; j++){
                    if(arr[i][j][k]!=0){
                        curLB = j;
                        break;
                    }
                }
                leftBound[k][i] = (curLB);
            }
        }

        // 寻找从后面数第一个盐度非0值
        for(let k =0; k<layerNum; k++){
            rightBound[k] = new Array(rowNum);
            // 对于第k层
            for(let i=0; i<rowNum; i++){
                curRB = -1;
                for(let j=colNum-1; j>=0; j--){
                    if(arr[i][j][k]!=0){
                        curRB = j;
                        break;
                    }
                }
                rightBound[k][i] = (curRB);
            }
        }

        // console.log(leftBound);
        // console.log(rightBound);

        for(let k =0; k<layerNum; k++){
            for(let i=0; i<rowNum; i++){
                for(let j=0; j<colNum; j++){
                    // 把长和宽变成0～1之间，高变成真实-depth[k]
                    positions.push(i/rowNum,j/colNum,-depth_array[k]);  
                }
            }
        }
        // console.log(positions);

        // 左边界
        for(let k = 0; k<layerNum; k++){
            for(let i =0; i<rowNum; i++){
                if(k+1<layerNum && i+1<rowNum){  // 层和行不越界
                    // 第一个三角形，第k层的两个和第k+1层的一个
                    if(leftBound[k][i]!=-1 && leftBound[k][i+1]!=-1 && leftBound[k+1][i]!=-1){
                        indices.push(k*layerVertexNum+i*colNum+leftBound[k][i], k*layerVertexNum+(i+1)*colNum+leftBound[k][i+1], (k+1)*layerVertexNum+i*colNum+leftBound[k+1][i]);
                    }
                    // 第二个三角形，第k层的一个和第k+1层的两个
                    if(leftBound[k][i+1]!=-1 && leftBound[k+1][i]!=-1 && leftBound[k+1][i+1]!=-1){
                        indices.push(k*layerVertexNum+(i+1)*colNum+leftBound[k][i+1], (k+1)*layerVertexNum+i*colNum+leftBound[k+1][i], (k+1)*layerVertexNum+(i+1)*colNum+leftBound[k+1][i+1]);
                    }
                }
            }
        }
        

        // 右边界
        for(let k = 0; k<layerNum; k++){
            for(let i =0; i<rowNum; i++){
                if(k+1<layerNum && i+1<rowNum){  // 层和行不越界
                    // 第一个三角形，第k层的两个和第k+1层的一个
                    if(rightBound[k][i]!=-1 && rightBound[k][i+1]!=-1 && rightBound[k+1][i]!=-1){
                        indices.push(k*layerVertexNum+i*colNum+rightBound[k][i], k*layerVertexNum+(i+1)*colNum+rightBound[k][i+1], (k+1)*layerVertexNum+i*colNum+rightBound[k+1][i]);
                    }
                    // 第二个三角形，第k层的一个和第k+1层的两个
                    if(rightBound[k][i+1]!=-1 && rightBound[k+1][i]!=-1 && rightBound[k+1][i+1]!=-1){
                        indices.push(k*layerVertexNum+(i+1)*colNum+rightBound[k][i+1], (k+1)*layerVertexNum+i*colNum+rightBound[k+1][i], (k+1)*layerVertexNum+(i+1)*colNum+rightBound[k+1][i+1]);
                    }
                }
            }
        }

        // console.log(indices);

        heightGeometry.setIndex( indices);

		heightGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        // 与模型保持同等长宽高缩放
        heightGeometry.translate(-0.5, -0.5, 0);
        heightGeometry.scale(edgeLen, edgeWid, scaleHeight);

        var material = new THREE.MeshBasicMaterial( {
            color: 0xA9A9A9,
            side: THREE.DoubleSide,
            transparent: true, // 可定义透明度
            opacity: 0.3,
            depthWrite: false,
        } );
    
        channel = new THREE.Mesh( heightGeometry, material);
        channel.name = "channel";
        scene.add( channel );

        if(!is3d){  // 如果当前模式不是3d，隐藏
            channel.visible = false;
        }
    })
}

// 2D地图形式
function create2d(){
    var texture = THREE.ImageUtils.loadTexture('./resources/Ensemble1/Ensemble1TimeStep01.png', {}, function() {
        render();
    });

    var geometry = new THREE.PlaneBufferGeometry( edgeLen, edgeWid, worldWidth - 1, worldDepth - 1 );
    var material = new THREE.MeshLambertMaterial({
        map: texture,
        side:THREE.DoubleSide,
    });

    geometry.translate(0, 0, 2);
    land_2d = new THREE.Mesh( geometry, material);
    land_2d.name = "land_2d";
    scene.add( land_2d );

    if(is3d){  // 如果是3d模式，隐藏这个
        land_2d.visible = false;
    }
}



/*
    显示等待条
*/
function showProgressModal(frameType){  // 假设frameType为"loadingFrames"
    progressModal = document.getElementById("progressModal");
    frameLabel = document.getElementById("frameLabel");
    
	frameLabel.innerHTML = frameType.slice(0,-6);  // frameLabel = "loading"
	progressBar = document.createElement('div');
	progressBar.id = frameType;
	progressBar.className = 'progressBar';

	progressLabel = document.createElement('span');
	progressLabel.id = 'label';
	progressLabel.setAttribute("data-perc", "Preparing models...");

	progressBackground = document.createElement('span');
	progressBackground.id = 'bar';

	progressBar.appendChild(progressLabel);
	progressBar.appendChild(progressBackground);
    progressModal.appendChild(progressBar);
    
    container.appendChild(progressModal)
}

/*
    隐藏等待条
*/
function hideProgressModal(){
    // 进度条图形填满
    progressBackground.style.width = "100%";
    // 标题填满
    progressLabel.setAttribute("data-perc", "100%");
    // Remove the modal
    progressModal.removeChild(progressBar);
    frameLabel.style.display = 'none';
    progressModal.style.display = 'none';
}

/*
    加载涡旋n天的形状
*/
function loadEddiesForDays(){
    let arr = []; //promise返回值的数组
    for (let i = 0; i<loadDayNum; i++){
        arr[i] = new Promise((resolve, reject)=>{
            // 加载一天的形状
            var d = i;
            var vtk_path = ("./resources/whole_vtk_folder".concat("/vtk", d, "_3000_0_8.vtk"));
            var loader = new VTKLoader();
            console.log("loading", vtk_path);
            loader.load( vtk_path, function ( geometry ) {  // 异步加载
                
                geometry.translate(-0.5, -0.5, 0);

                // 不应该翻下去！！！！！！！！！！ 而是z值变负
                var positions = geometry.attributes.position.array;
                // 改变顶点高度值
                
                for ( let j = 0;  j < positions.length; j += 3 ) {
                    // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
                    positions[j+2] = -depth_array[Math.round(positions[j+2]*50)];
                }

                geometry.scale(edgeLen, edgeWid, scaleHeight);

                var sectionNums = geometry.attributes.sectionNum.array;
                var startNums = geometry.attributes.startNum.array;

                // 转化为无索引格式，用来分组
                geometry = geometry.toNonIndexed();

                geometry.attributes.sectionNum.array = sectionNums;
                geometry.attributes.startNum.array = startNums;
                // 这个count具体我不知道是啥，对于position.count可以理解为点的个数，且position.length正好是count的三倍
                geometry.attributes.sectionNum.count = geometry.attributes.sectionNum.array.length;
                geometry.attributes.startNum.count = geometry.attributes.startNum.array.length;
                
                 // 默认初始透明度最大的下标在开头
                geometry.setAttribute( 'mOpaIndex', new THREE.Float32BufferAttribute( startNums, 1 ));


                var vertexNum = geometry.attributes.position.count;
                
                var opa = []; // 顶点透明度，用来改变线条透明度
                for (var i = 0; i<vertexNum; i++){
                    opa.push(1);  // 默认1；但是初始是以下面的material为准
                }
                geometry.setAttribute( 'opacity', new THREE.Float32BufferAttribute( opa, 1 ));

                
                var groupId;  // 组号

                var mats = [];

                for (var i =0; i<vertexNum; i+=2){
                    groupId = i/2;
                    geometry.addGroup(i, 2, groupId);  // 无索引形式(startIndex, count, groupId)

                    let material = new THREE.LineBasicMaterial({
                        // vertexColors: false,  // 千万不能设置为true！！！！血的教训
                        transparent: true, // 可定义透明度
                        opacity: 0.8,
                        depthWrite: false, 
                    });
                    mats.push(material);
                }
                var linesG = new THREE.LineSegments(geometry, mats);

                //need update 我不知道有没有用，感觉没用
                linesG.geometry.colorsNeedUpdate = true;
                linesG.geometry.groupsNeedUpdate = true;
                linesG.material.needsUpdate = true;
                
                linesG.name = "day"+String(d);  // day0, day1, ...
                whole_models.push(linesG);
                resolve(i);
            });
            
        })
    }
    // 当所有加载都完成之后，再隐藏“等待进度条”
    Promise.all(arr).then((res)=>{
        console.log("模型加载完毕");
        // 设置属性
        loadAttrArray("OW");
        loadAttrArray("VORTICITY")
    })
}

// 初始化透明度
function initLineOpacity(curLine, k){
    // k为轨迹段数和长线总段数只比
    var attributes = curLine.geometry.attributes;
    var mats = curLine.material;

    
    for(var i=0; i<attributes.sectionNum.count; i++){  // 对于每一组长线i
        
        var L = attributes.sectionNum.array[i];  // 长线包含的线段数
        
        var l = parseInt(k*L);  // 轨迹段数

        var diff = 1/l;  // 透明度变化单位
        var startIndex = attributes.startNum.array[i];

        for(var j=0; j<l; j++){ // 轨迹段数
            var curIndex = (j)%L + startIndex;
            mats[curIndex].opacity = 1 - diff*j;
        }
    }
}

/*
    加载attr数组
*/
//  单个加载函数
function loadOneAttrArray(attr, path, d){
    var site, linesG;
    var arr;
    var promise1 = new Promise(function(resolve, reject) {
        $.get(path, function(data) {
            // 加载Attr数组
            var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
            // console.log(items);
        
            arr = new Array(500);
            for (var i = 0; i < arr.length; i++) {
                arr[i] = new Array(500);
                for (var j = 0; j < arr[i].length; j++) {
                    arr[i][j] = new Array(50);
                    for (var k = 0; k<arr[i][j].length; k++){
                        arr[i][j][k] = items[i][j*arr[i][j].length+k];
                    }
                }
            }
            resolve(1);
        });
    });

    promise1.then(()=>{
        // 将Attr值放到geometry中
        site = "day"+String(d)
        linesG = findModel(site);
        var attrArray = [];
        var x,y,z;  // 点的当前坐标（缩放后）
        var i,j,k;  // 点对应的attr数组中的下标
        var position = linesG.geometry.attributes.position.array;  // 看清属性
        // console.log("postion数组读取完毕");

        var temp = new Array(3);
        let flag1 = []; //promise返回数组

        for( var q =0; q<position.length; q+=3){
            flag1[q/3] = new Promise((resolve, reject)=>{
                x = position[q];
                y = position[q+1];
                z = position[q+2];
            
                temp = xyz2ijk(x, y, z);
                i = temp[0];
                j = temp[1];
                k = temp[2];
                // console.log(x,y,z, "-->", i, j, k);
                // console.log(arr[i][j][k]);

                attrArray[q/3] = arr[i][j][k];
                resolve(q);
            })
        }
        
        Promise.all(flag1).then((res)=>{
            linesG.geometry.setAttribute( attr, new THREE.Float32BufferAttribute( attrArray, 1 ));
            // console.log(attrArray);
            if(d==loadDayNum-1){
                console.log(attr+"值设置完毕");
                animate();

                if(attr=="VORTICITY")
                    hideProgressModal();
            }
        })
    });
}

function loadAttrArray(attr){
    let flag0 = []; //promise数组
    for(var i =0; i<loadDayNum; i++){
        flag0[i] = new Promise((resolve, reject)=>{
            var d = i;
            var path = ("./resources/whole_attributes_txt_file/".concat(attr,"/",attr,"_", String(d), ".txt"));
            loadOneAttrArray(attr, path,d);
            resolve(i);
        });
    }
    Promise.all(flag0).then((res)=>{
        
    })
    
}

/*
    设置交互GUI
*/
function setGUI(){
    gui = new dat.GUI({ autoPlace: false });

    default_opt = new function(){
        this.currentMainDay = -1;  // 初始时间为第0天
        this.currentAttr = 'OW'; // 初始展示属性为OW
        this.upValue = 1; // 属性的下界
        this.downValue = -1;  // 属性的上界
        this.keepValue = true; // 保持设置
        this.hideChannel = false;  // 是否隐藏海峡地形
        this.hideSurface = false; // 是否隐藏陆地
        this.pitchMode = false;  // 选中模式
        this.dynamic = false;  // 是否让全局涡旋运动
        this.color0 = [255, 255, 255]; // RGB array
        this.color1 = [255, 255, 255]; // RGB array
        this.color2 = [255, 255, 255]; // RGB array
        this.color3 = [255, 255, 255]; // RGB array
        this.color4 = [255, 255, 255]; // RGB array
        this.opacity0 = 1.0;
        this.opacity1 = 1.0;
        this.opacity2 = 1.0;
        this.opacity3 = 1.0;
        this.opacity4 = 1.0;
    };

    /* 
        一些默认的属性
    */

    // 日期相关
    currentMainDay = -1;
    var lastDay = -1;
    var lastLine;  // 当前显示的线，上次显示的线
    var site, last_site;
    // 默认属性值
    currentAttr = 'OW';

    // 属性值上下界
    upValue = default_opt.upValue;
    downValue = default_opt.downValue;
    updateMid();


    // 切换日期
    day_ctrl = gui.add(default_opt, 'currentMainDay', exDays).onChange(function(){
        currentMainDay = default_opt.currentMainDay;
        currentMainDay = parseInt(currentMainDay);
        console.log("currentMainDay:", currentMainDay);
        console.log(is3d);

        if(is3d){ // 3d视图
            if(lastDay!=-1){  // 清除上次的显示
                last_site = "day"+String(lastDay);
                lastLine = scene.getObjectByName(last_site);
                if(lastLine!=undefined)  // 这个判断不加也行
                    scene.remove(lastLine);
            }
            site = "day"+String(currentMainDay);
            
            curLine = findModel(site);
            scene.add(curLine);

            // 更新当天当前属性的echarts
            updateEcharts(currentAttr, currentMainDay);

            if(curLine!=undefined){
                if(keepValue){  // 更换日期，但属性设置不变
                    keepValue_update(curLine);
                }
                else{
                    resetCtrl();
                    resetMaterial(curLine);
                }
                console.log(curLine.name);
            }
            
            lastDay = currentMainDay;
        }
        else{  // 2d视图
            if(curLine!=undefined)  // 去除3d视图显示的流线
                scene.remove(curLine)
            land_2d.material.map = textures_2d[currentMainDay];
        }

        // removeCores();
        if(currentMainDay!=-1){
            showCores();  // 显示当日涡核
        }
        
        
    });

    gui.add(default_opt, 'pitchMode').onChange(function(){
        pitchMode = default_opt.pitchMode;

        if(pitchMode==false){
            helper.visible = false;
        }
        else{
            helper.visible = true;
        }
    })


    attrFolder = gui.addFolder('attribute');
    // 切换属性
    attrFolder.add(default_opt, 'currentAttr', ['OW', 'VORTICITY']).onChange(function(){
        currentAttr = default_opt.currentAttr;
        console.log("currentAttr:", currentAttr);

        // 使用不同的初始上下界
        switch(currentAttr){
            case "OW":
                presupposeUD(-1, 1);
                break;
            case "VORTICITY":
                presupposeUD(0, 0);
                break;
            case "SALT":
                presupposeUD(34, 42);
                break;
            case "TEMP":
                presupposeUD(0, 32);
                break;
        }
        

        // 切换属性的话，一定要重新设置
        resetCtrl();
        resetMaterial(curLine);

        // 更新当天当前属性的echarts
        updateEcharts(currentAttr, currentMainDay);
    });

    // 设置下界
    downValue_ctrl = attrFolder.add(default_opt, 'downValue').onChange(function(){
        downValue = default_opt.downValue;
        console.log("downValue:", downValue);

        // 更新中间点
        updateMid();

        resetCtrl();
        resetMaterial(curLine);
    });

    // 设置上界
    upValue_ctrl = attrFolder.add(default_opt, 'upValue').onChange(function(){
        upValue = default_opt.upValue;
        console.log("upValue:", upValue);

        // 更新中间点
        updateMid();

        resetCtrl();
        resetMaterial(curLine);
    });



    /*
        控制
    */
    appearFolder = gui.addFolder('appearance');

    // 是否保持？
    appearFolder.add(default_opt, 'keepValue').onChange(function(){
        keepValue = default_opt.keepValue;
    })

    // 是否隐藏地形
    appearFolder.add(default_opt, 'hideChannel').onChange(function(){
        hideChannel = default_opt.hideChannel;

        // 不隐藏
        if(hideChannel==false){
            if(channel!=undefined)
                channel.visible = true;
        }
        else{
            if(channel!=undefined)
                channel.visible = false;
        }
    })

    appearFolder.add(default_opt, 'hideSurface').onChange(function(){
        hideSurface = default_opt.hideSurface;

        // 不隐藏
        if(hideSurface==false){
            if(surface!=undefined)
                surface.visible = true;
        }
        else{
            if(surface!=undefined)
                surface.visible = false;
        }
    })


    // 是否运动
    appearFolder.add(default_opt, 'dynamic').onChange(function(){
        dynamic = default_opt.dynamic;

        if(dynamic==true){
            initLineOpacity(curLine, 1);  // 初始化透明度
        }
        else{  // 将所有透明度设置为1
            opa0_ctrl.setValue(1.0);
            opa1_ctrl.setValue(1.0);
            opa2_ctrl.setValue(1.0);
            opa3_ctrl.setValue(1.0);
            opa4_ctrl.setValue(1.0);

            for(var i=0; i<curLine.material.length; i++){
                curLine.material[i].opacity = 1.0;
            }
            getCurrentValue();  // 更新current
        }
    })

    // console.log(appearFolder);

    /*
        交互颜色
    */
    colorFolder = gui.addFolder('color');
    // color0
    color0_ctrl = colorFolder.addColor(default_opt, 'color0').onFinishChange(function(){
        currentColor0 = default_opt.color0;
        assignColor(curLine, currentColor0, 0);  // 设置geometry的color
        updateColor(curLine);  // 更新material
    });

    // console.log(color0_ctrl);


    

    // color1
    color1_ctrl = colorFolder.addColor(default_opt, 'color1').onFinishChange(function(){
        currentColor1 = default_opt.color1;
        assignColor(curLine, currentColor1, 1);  // 设置geometry的color
        updateColor(curLine);  // 更新material
    });

    // color2
    color2_ctrl = colorFolder.addColor(default_opt, 'color2').onFinishChange(function(){
        currentColor2 = default_opt.color2;
        assignColor(curLine, currentColor2, 2);  // 设置geometry的color
        updateColor(curLine);  // 更新material
    });
    // color3
    color3_ctrl = colorFolder.addColor(default_opt, 'color3').onFinishChange(function(){
        currentColor3 = default_opt.color3;
        assignColor(curLine, currentColor3, 3);  // 设置geometry的color
        updateColor(curLine);  // 更新material
    });

    // color4
    color4_ctrl = colorFolder.addColor(default_opt, 'color4').onFinishChange(function(){
        currentColor4 = default_opt.color4;
        assignColor(curLine, currentColor4, 4);  // 设置geometry的color
        updateColor(curLine);  // 更新material
    });

    

    /*
        交互透明度
    */
    opaFolder = gui.addFolder('opacity');
    
    // opacity0
    opa0_ctrl = opaFolder.add(default_opt, 'opacity0', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity0 = default_opt.opacity0;
        assignOpacity(curLine, default_opt.opacity0, 0);
        updateOpacity(curLine);
    })
    // opacity1
    opa1_ctrl= opaFolder.add(default_opt, 'opacity1', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity1 = default_opt.opacity1;
        assignOpacity(curLine, default_opt.opacity1, 1);
        updateOpacity(curLine);
    })
    // opacity2
    opa2_ctrl = opaFolder.add(default_opt, 'opacity2', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity2 = default_opt.opacity2;
        assignOpacity(curLine, default_opt.opacity2, 2);
        updateOpacity(curLine);
    })
    // opacity3
    opa3_ctrl = opaFolder.add(default_opt, 'opacity3', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity3 = default_opt.opacity3;
        assignOpacity(curLine, default_opt.opacity3, 3);
        updateOpacity(curLine);
    })

    // opacity4
    opa4_ctrl = opaFolder.add(default_opt, 'opacity4', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity4 = default_opt.opacity4;
        assignOpacity(curLine, default_opt.opacity4, 4);
        updateOpacity(curLine);
    })

    var func_opt = new function(){
        this.play = function(){
            alert("------------");
        };
        this.reset = function(){
            resetCtrl();
            resetMaterial(curLine);
        };
    };

    funcFolder = gui.addFolder('functions');
    
    // 播放
    funcFolder.add(func_opt, 'play');
    funcFolder.add(func_opt, 'reset');


    switchView();  // 先使用一遍视图
    
}

function presupposeUD(down, up) {
    downValue = down;
    upValue = up;
    
    downValue_ctrl.setValue(downValue);
    upValue_ctrl.setValue(upValue);
    updateMid();
}


// 根据上下界改变mid中间点
function updateMid(){
    difValue = upValue-downValue;
    mid1 = downValue+0.2*difValue;
    mid2 = downValue+0.4*difValue;
    mid3 = downValue+0.6*difValue;
    mid4 = downValue+0.8*difValue;
}

// 在图中显示涡核
function showCores(){
    if(currentMainDay<0)
        return;
    var info = eddyFeature['info'][currentMainDay];
    for(let i=0; i<info.length; i++){  // currentMainDay当天
        var cx = info[i][0];
        var cy = info[i][1];
        // console.log(cx, cy);
        cx = (cx/500 - 0.5)*edgeLen;
        cy = (cy/500 - 0.5)*edgeWid;

        // 在涡核处显示标记
        var geometryTri = new THREE.ConeGeometry( 20, 100, 3 );
        geometryTri.rotateX( -Math.PI / 2 );
        // 直接setPosition好像不行，还是平移吧
        geometryTri.translate(cx, cy, 50);
        
        var cone = new THREE.Mesh( geometryTri, new THREE.MeshNormalMaterial(

        ) );
        scene.add( cone );
        
        existedSphere.push(cone);

        // console.log(sphere);
    }
}

function removeCores(){
    for(let i=0; i<existedSphere.length; i++){
        scene.remove(existedSphere[i]);
    }
    existedSphere.length = 0;  // 清空数组
}


/*
    改变geometry的属性
*/
function assignColor(curLine, opt_color, num){
    if(curLine==undefined)
        return;
    var cColor = [opt_color[0]/255, opt_color[1]/255, opt_color[2]/255];

    var currentAttrArray = [];
    switch(currentAttr){
        case "OW":
            currentAttrArray = curLine.geometry.attributes.OW.array;
            break;
        case "VORTICITY":
            currentAttrArray = curLine.geometry.attributes.VORTICITY.array;
            break;
        case "SALT":
            currentAttrArray = curLine.geometry.attributes.SALT.array;
            break;
        case "TEMP":
            currentAttrArray = curLine.geometry.attributes.TEMP.array;
            break;
    }

    switch(num){
        case 0:
            console.log("color0:", opt_color);
            // 修改该范围内的点的颜色
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]<= mid1){
                    curLine.geometry.attributes.color.array[3*i] = cColor[0];
                    curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                    curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
                }
            }
            break;
        case 1:
            console.log("color1:", opt_color);
            // 修改该范围内的点的颜色
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid1 && currentAttrArray[i]<= mid2){
                    curLine.geometry.attributes.color.array[3*i] = cColor[0];
                    curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                    curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
                }
            }
            break;
        case 2:
            console.log("color2:", opt_color);
            // 修改该范围内的点的颜色
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid2 && currentAttrArray[i]<= mid3){
                    curLine.geometry.attributes.color.array[3*i] = cColor[0];
                    curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                    curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
                }
            }
            break;
        case 3:
            console.log("color3:", opt_color);
            // 修改该范围内的点的颜色
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid3 && currentAttrArray[i]<= mid4){
                    curLine.geometry.attributes.color.array[3*i] = cColor[0];
                    curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                    curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
                }
            }
            break;
        case 4:
            console.log("color4:", opt_color);
            // 修改该范围内的点的颜色
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid4){
                    curLine.geometry.attributes.color.array[3*i] = cColor[0];
                    curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                    curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
                }
            }
            break;
    }
}

function assignOpacity(curLine, opt_opacity, num){
    if(curLine==undefined)
        return;
    var cOpa = opt_opacity;

    var currentAttrArray = [];
    switch(currentAttr){
        case "OW":
            currentAttrArray = curLine.geometry.attributes.OW.array;
            break;
        case "VORTICITY":
            currentAttrArray = curLine.geometry.attributes.VORTICITY.array;
            break;
        case "SALT":
            currentAttrArray = curLine.geometry.attributes.SALT.array;
            break;
        case "TEMP":
            currentAttrArray = curLine.geometry.attributes.TEMP.array;
            break;
    }

    switch(num){
        case 0:
            console.log("opacity0:", opt_opacity);
            // 修改该范围内的点的透明度
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]<= mid1){
                    curLine.geometry.attributes.opacity.array[i] = cOpa;
                }
            }
            break;
        case 1:
            console.log("opacity1:", opt_opacity);
            // 修改该范围内的点的透明度
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid1 && currentAttrArray[i]<= mid2){
                    curLine.geometry.attributes.opacity.array[i] = cOpa;
                }
            }
            break;
        case 2:
            console.log("opacity2:", opt_opacity);
            // 修改该范围内的点的透明度
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid2 && currentAttrArray[i]<= mid3){
                    curLine.geometry.attributes.opacity.array[i] = cOpa;
                }
            }
            break;
        case 3:
            console.log("opacity3:", opt_opacity);
            // 修改该范围内的点的透明度
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid3 && currentAttrArray[i]<= mid4){
                    curLine.geometry.attributes.opacity.array[i] = cOpa;
                }
            }
            break;
        case 4:
            console.log("opacity4:", opt_opacity);
            // 修改该范围内的点的透明度
            for(var i = 0; i<currentAttrArray.length; i++){
                if(currentAttrArray[i]> mid4){
                    curLine.geometry.attributes.opacity.array[i] = cOpa;
                }
            }
            break;
    }
}

// 用于全局赋值geometry的color，只用一边循环 比5次assignColor快
function assignAllColor(curLine){
    if(curLine==undefined)
        return;
    var cColor0 = [currentColor0[0]/255, currentColor0[1]/255, currentColor0[2]/255];
    var cColor1 = [currentColor1[0]/255, currentColor1[1]/255, currentColor1[2]/255];
    var cColor2 = [currentColor2[0]/255, currentColor2[1]/255, currentColor2[2]/255];
    var cColor3 = [currentColor3[0]/255, currentColor3[1]/255, currentColor3[2]/255];
    var cColor4 = [currentColor4[0]/255, currentColor4[1]/255, currentColor4[2]/255];

    var currentAttrArray = [];
    switch(currentAttr){
        case "OW":
            currentAttrArray = curLine.geometry.attributes.OW.array;
            break;
        case "VORTICITY":
            currentAttrArray = curLine.geometry.attributes.VORTICITY.array;
            break;
        case "SALT":
            currentAttrArray = curLine.geometry.attributes.SALT.array;
            break;
        case "TEMP":
            currentAttrArray = curLine.geometry.attributes.TEMP.array;
            break;
    }
    for(var i = 0; i<currentAttrArray.length; i++){
        if(currentAttrArray[i]<= mid1){
            curLine.geometry.attributes.color.array[3*i] = cColor0[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor0[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor0[2];
        }
        else if(currentAttrArray[i]> mid1 && currentAttrArray[i]<= mid2){
            curLine.geometry.attributes.color.array[3*i] = cColor1[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor1[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor1[2];
        }
        else if(currentAttrArray[i]> mid2 && currentAttrArray[i]<= mid3){
            curLine.geometry.attributes.color.array[3*i] = cColor2[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor2[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor2[2];
        }
        else if(currentAttrArray[i]> mid3 && currentAttrArray[i]<= mid4){
            curLine.geometry.attributes.color.array[3*i] = cColor3[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor3[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor3[2];
        }
        else{
            curLine.geometry.attributes.color.array[3*i] = cColor4[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor4[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor4[2];
        }
    }
}

function assignAllOpacity(curLine){
    if(curLine==undefined)
        return;

    var cOpa0 = currentOpacity0;
    var cOpa1 = currentOpacity1;
    var cOpa2 = currentOpacity2;
    var cOpa3 = currentOpacity3;
    var cOpa4 = currentOpacity4;

    var currentAttrArray = [];
    switch(currentAttr){
        case "OW":
            currentAttrArray = curLine.geometry.attributes.OW.array;
            break;
        case "VORTICITY":
            currentAttrArray = curLine.geometry.attributes.VORTICITY.array;
            break;
        case "SALT":
            currentAttrArray = curLine.geometry.attributes.SALT.array;
            break;
        case "TEMP":
            currentAttrArray = curLine.geometry.attributes.TEMP.array;
            break;
    }

    for(var i = 0; i<currentAttrArray.length; i++){
        if(currentAttrArray[i]<= mid1){
            curLine.geometry.attributes.opacity.array[i] = cOpa0;
        }
        else if(currentAttrArray[i]> mid1 && currentAttrArray[i]<= mid2){
            curLine.geometry.attributes.opacity.array[i] = cOpa1;
        }
        else if(currentAttrArray[i]> mid2 && currentAttrArray[i]<= mid3){
            curLine.geometry.attributes.opacity.array[i] = cOpa2;
        }
        else if(currentAttrArray[i]> mid3 && currentAttrArray[i]<= mid4){
            curLine.geometry.attributes.opacity.array[i] = cOpa3;
        }
        else{
            curLine.geometry.attributes.opacity.array[i] = cOpa4;
        }
    }
}

/*
    更新material的属性
*/
function updateColor(curLine){
    if(curLine==undefined)
        return;

    for(var i=0; i<curLine.material.length; i++){
        let r = (curLine.geometry.attributes.color.array[6*i] + curLine.geometry.attributes.color.array[6*i+3])/2;
        let g = (curLine.geometry.attributes.color.array[6*i+1] + curLine.geometry.attributes.color.array[6*i+4])/2;
        let b = (curLine.geometry.attributes.color.array[6*i+2] + curLine.geometry.attributes.color.array[6*i+5])/2;
        curLine.material[i].color.setRGB(r, g, b);
    }
    // animate();
}

function updateOpacity(curLine){
    if(curLine==undefined)
        return;

    for(var i=0; i<curLine.material.length; i++){
        curLine.material[i].opacity = (curLine.geometry.attributes.opacity.array[2*i] + curLine.geometry.attributes.opacity.array[2*i+1])/2;
    }
}

// 交互界面颜色和透明度复位
function resetCtrl(){
    color0_ctrl.setValue([255, 255, 255]);
    color1_ctrl.setValue([255, 255, 255]);
    color2_ctrl.setValue([255, 255, 255]);
    color3_ctrl.setValue([255, 255, 255]);
    color4_ctrl.setValue([255, 255, 255]);

    opa0_ctrl.setValue(1.0);
    opa1_ctrl.setValue(1.0);
    opa2_ctrl.setValue(1.0);
    opa3_ctrl.setValue(1.0);
    opa4_ctrl.setValue(1.0);

    getCurrentValue();  // 更新current
}

// 把所有线条颜色都变成白色，透明度变为1
function resetMaterial(curLine){
    if(curLine==undefined)
        return;
    for(var i=0; i<curLine.material.length; i++){
        curLine.material[i].color = new THREE.Color(1, 1, 1);
        curLine.material[i].opacity = 1.0;
    }
}

// 更新currentColor和currentOpacity
function getCurrentValue(){
    currentColor0 = color0_ctrl.getValue();
    currentColor1 = color1_ctrl.getValue();
    currentColor2 = color2_ctrl.getValue();
    currentColor3 = color3_ctrl.getValue();
    currentColor4 = color4_ctrl.getValue();

    currentOpacity0 = opa0_ctrl.getValue();
    currentOpacity1 = opa1_ctrl.getValue();
    currentOpacity2 = opa2_ctrl.getValue();
    currentOpacity3 = opa3_ctrl.getValue();
    currentOpacity4 = opa4_ctrl.getValue();
}

// 保持交互面板属性不变，按照当前属性渲染新的线条
function keepValue_update(curLine){
    // resetMaterial(curLine);

    getCurrentValue();  // 更新current

    assignAllColor(curLine);
    assignAllOpacity(curLine);

    updateColor(curLine);
    updateOpacity(curLine);
}

function printColor(){
    console.log(currentColor0);
    console.log(currentColor1);
    console.log(currentColor2);
    console.log(currentColor3);
    console.log(currentColor4);

    console.log(default_opt.color0);
    console.log(default_opt.color1);
    console.log(default_opt.color2);
    console.log(default_opt.color3);
    console.log(default_opt.color4);

}

// 根据模型名从数组中找到模型
function findModel(site){
    for(let i =0; i<whole_models.length; i++){
        if(whole_models[i].name==site){
            return whole_models[i];
        }
    }
    return undefined;   // 没有找到
}

function animate() {
    requestAnimationFrame( animate );
    render();
    if(dynamic)  // 只有dynamic为true时才渲染
        DyChange(0.5);
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}

// 动态变化透明度
function DyChange(k){
    if(curLine != undefined){
        var attributes = curLine.geometry.attributes;
        var mats = curLine.material;

        for(var i=0; i<attributes.sectionNum.count; i++){  // 对于每一组长线i
            var L = attributes.sectionNum.array[i];  // 长线包含的线段数
            var l = parseInt(k*L);  // 轨迹段数
            var diff = 1/l;  // 透明度变化单位

            var startIndex = attributes.startNum.array[i];
            for(var j=startIndex; j<startIndex+L; j++){  // 对于每个小线段
                mats[j].opacity = Math.max(0, mats[j].opacity-diff);  // 透明度降低
            }
            // 赋值为1的
            var next_mOpaIndex = (attributes.mOpaIndex.array[i]-startIndex-1 + L)%L+startIndex;
            mats[next_mOpaIndex].opacity = 1;
            attributes.mOpaIndex.array[i] = next_mOpaIndex; // 更新数组
        }
    }
}


function onMouseMove( event ) {
    if(pitchMode == true){
        getMouseXY(event);  // 得到鼠标的位置
        // 通过摄像机和鼠标位置更新射线
        raycaster.setFromCamera( mouse, camera );  // (鼠标的二维坐标, 射线起点处的相机)


        var intersects;
        if(is3d){
            if(curLine != undefined){
                intersects = raycaster.intersectObject( curLine );
                
            }
        }
        else{
            if(land_2d!=undefined){
                intersects = raycaster.intersectObject( land_2d );
            }
        }
        if(intersects.length>0){
            var curObj = intersects[0];
            helper.position.copy( curObj.point );
        }
    }
}

function onMouseClick(event){

    // console.log(event);
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    /*
        renderer.domElement的clientWidth和clientHeight就是renderer的宽度和高度
        由于event.clientX, Y表示屏幕上鼠标的绝对位置，所以要减去窗口的偏移，再比上窗口的宽和高
    */
    getMouseXY(event);

    // 现在的mouse的二维坐标就是当前鼠标在当前窗口的位置（-1~1)
    // console.log(mouse)


    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera( mouse, camera );  // (鼠标的二维坐标, 射线起点处的相机)

    // 查看相机发出的光线是否击中了我们的网格物体之一（计算物体和射线的焦点）
    // 检查射线和物体之间的所有交叉点，交叉点返回按距离排序，最接近的为第一个。 返回一个交叉点对象数组。

    var intersects;
    // 获取当前指向的第一个的坐标
    if(is3d){
        if(curLine != undefined){
            intersects = raycaster.intersectObject( curLine );
            
        }
    }
    else{
        if(land_2d!=undefined){
            intersects = raycaster.intersectObject( land_2d );
        }
    }

    if(intersects.length>0){
        var curObj = intersects[0];
        if(pitchMode == true){
            selected_pos = curObj.point;
            updateSign = true;
        }
    }
    
}

function getMouseXY(event){
    mouse.x = ( (event.clientX) / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( (event.clientY ) / renderer.domElement.clientHeight ) * 2 + 1;
}

function setRenderSize() {
    renderWidth = 0.5*window.innerWidth, renderHeight = window.innerHeight;
}


// 进度条
$('#draggable-point').draggable({
    axis: 'x',
    containment: "#audio-progress"
});

$('#draggable-point').draggable({
    drag: function() {
        var offset = $(this).offset();
        var percent = (100 * parseFloat($(this).css("left"))) / (parseFloat($(this).parent().css("width")));
        var xPos = percent + "%";
        play_start_day = Math.round(percent/100*(loadDayNum+1));  // 实际上拉不到头，所以多加个1

        // 更新文字和进度条
        div_start_time.innerHTML = play_start_day;  
        $('#audio-progress-bar').css({
        'width': xPos
        });
    }
});

//numberMillis 毫秒




