import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { VTKLoader } from './VTKLoader4.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

/**
 * 框架组件
 */
var container, stats;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器

/**
 * 预设变量
 */
// 窗口大小
var renderWidth, renderHeight;
var containerWidth, containerHeight;



/**
 * 涡旋模型
 */
var curLine;  // 当前流线
var lastLine;  // 上一条流线

// 流线界面模型存放
var whole_models = [];


/**
 * 涡旋位置指示器
 */
var existedCones = [];  // 场上存在的标记
var selected_pos = undefined;  // 被鼠标选中的pos
var specific_color = 0xff0000;  // 被选中的指针的默认颜色


var gui;
var default_opt;  // 默认设置

var curSite;  // 当前涡旋流线name
var lastSite;

var currentAttr;  // 当前属性
var upValue;  // 属性上界
var downValue;  // 属性下界


var pickMode = false;  // 选中模式（选择涡旋）

var currentColor0, currentColor1, currentColor2;
var currentRGB0, currentRGB1, currentRGB2;
var currentOpacity0, currentOpacity1, currentOpacity2;



/**
 * 辅助
 */
var helper;  // 鼠标helper
const raycaster = new THREE.Raycaster();  // 射线
const mouse = new THREE.Vector2();  // 鼠标二维坐标



init();


function init() {
    container = document.getElementById( 'streamline-container' );
    container.innerHTML = "";

    setRenderSize();
    
    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( renderWidth, renderHeight );  // 尺寸


    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x215362 );  // 蓝绿色
    // scene.background = new THREE.Color(0x7daae6);

    // PerspectiveCamera( fov, aspect, near, far )  视场、长宽比、渲染开始距离、结束距离
    camera = new THREE.PerspectiveCamera( 60, renderWidth / renderHeight, 50, 20000 );
    camera.position.z = 4000;
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

    // create2d();  // 2d海洋平面
    // loadTexture2d();  // 海洋平面纹理
    
    createSea();
    createSeaFrame();

    createLand();
    // createChannel();
    loadChannel();
    
    createHelper();
    // showProgressModal("loadingFrames");  // 显示等待条
    
    loadEddiesForSteps();  // 加载涡旋模型
    
    
    // setGUI();  // 设置交互面板


    //环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener( 'click', onMouseClick, false);

    stats = new Stats();
    // container.appendChild( stats.dom );

    var guiContainer1 = document.getElementById('streamline-gui');
    // guiContainer1.appendChild(gui.domElement);
    // container.appendChild(guiContainer1);

    // var exContainer = document.getElementById('ex23d');
    // container.appendChild(exContainer);

    // 窗口缩放时触发
    window.addEventListener( 'resize', onWindowResize, false );

    animate();
}

function onWindowResize() {
    setRenderSize();
    camera.aspect = renderWidth / renderHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( renderWidth, renderHeight );
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
    const geometry2 = new THREE.BoxGeometry(boxLen, boxWid, boxHeight);
    const material2 = new THREE.MeshPhongMaterial({
        // color: 0x1E90FF,
        color: 0xb4968,
        // color: 0x191970,
        transparent: true,
        opacity: 0.5,
        depthWrite: false, 
        // wireframe: true,
        // vertexColors: true,
    }); //材质对象Material

    geometry2.translate(0, 0, -boxHeight/2);
    sea = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    sea.position.set(0,0,0);
    sea.name = "sea";
    scene.add(sea); //网格模型添加到场景中
}

function createSeaFrame(){
    // 海水箱子的长、宽
    var boxLen = edgeLen, boxWid = edgeLen;
    // var geometry = new THREE.BoxGeometry(boxLen, boxWid, boxHeight);

    var geometry = new THREE.BufferGeometry(); //声明一个空几何体对象
    //类型数组创建顶点位置position数据
    var vertices = new Float32Array([
        -0.5, -0.5, 0, //顶点0坐标
        -0.5, 0.5, 0, //顶点1坐标
        -0.5, -0.5, -1, //顶点2坐标
        -0.5, 0.5, -1, //顶点3坐标

        0.5, -0.5, 0, //顶点4坐标
        0.5, 0.5, 0, //顶点5坐标
        0.5, -0.5, -1, //顶点6坐标
        0.5, 0.5, -1, //顶点7坐标
    ]);
    // 创建属性缓冲区对象
    var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组
    // 设置几何体attributes属性的位置position属性
    geometry.attributes.position = attribue

    // Uint16Array类型数组创建顶点索引数据
    var indices = new Uint16Array([
        0,1, 0,2, 1,3, 2,3,
        4,5, 4,6, 5,7, 6,7,
        0,4, 1,5, 2,6, 3,7
    ])
    // 索引数据赋值给几何体的index属性
    geometry.index = new THREE.BufferAttribute(indices, 1); //1个为一组

    geometry.scale(boxLen, boxWid, boxHeight);


    var material = new THREE.LineBasicMaterial({
        // color: 0x1E90FF,
        color: 0x000000,
        // color: 0x191970,
        transparent: true,
        opacity: 1,
        depthWrite: false, 
        // wireframe: true,
    }); //材质对象Material

    seaFrame = new THREE.LineSegments(geometry, material);
    seaFrame.name = "seaFrame";
    scene.add(seaFrame);

    // console.log(seaFrame);
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
            color: 0x123456,
            side: THREE.DoubleSide,
            transparent: true, // 可定义透明度
            depthWrite: false,
            opacity: 0.8,
        } );
    
        surface = new THREE.Mesh( planeGeometry, material);
        surface.name = "surface";
        scene.add( surface );

        console.log(surface.material);

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
    })
}

// 加载峡谷obj
function loadChannel(){
    var object_loader = new OBJLoader();
    object_loader.load('./resources/channel.obj', function(object) {
        // object_loader.load('./resources/objs/mesh_0.obj', function(object) {

        object.traverse( function( child ) {
            if ( child.isMesh ){
                child.geometry.computeVertexNormals();
                child.geometry.computeFaceNormals();
            }
        } );

        var meshObj = object.children[0];        

        var positions = meshObj.geometry.attributes.position.array;
        // 原本是500*500*50，进行变换
        meshObj.geometry.scale(1/500, 1/500, 1/50);
        meshObj.geometry.translate(-0.5, -0.5, 0);
        for ( let j = 0;  j < positions.length; j += 3 ) {
            positions[j+2] = -depth_array[Math.round(positions[j+2]*50)];
        }

        meshObj.geometry.scale(edgeLen, edgeWid, scaleHeight);
        meshObj.material.transparent = true;
        meshObj.material.opacity = 0.5;
        meshObj.material.depthWrite = false;
        
        scene.add(meshObj);

        // console.log(meshObj)
        
    });
}




/*
    加载涡旋n步的形状
*/
function loadEddiesForSteps(){
    let arr = []; //promise返回值的数组
    for (let i = 0; i<loadStepNum; i++){
        arr[i] = new Promise((resolve, reject)=>{
            // 加载一步的形状
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
                
                linesG.name = "step"+String(d);  // step0, step1, ...
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
        // loadAttrArray("VORTICITY");
    })
}

// 初始化透明度
function initLineOpacity(curLine, k){
    // k为轨迹段数和长线总段数之比（可以理解成滑动窗口）
    var attributes = curLine.geometry.attributes;
    var mats = curLine.material;

    
    for(var i=0; i<attributes.sectionNum.count; i++){  // 对于每一组长线i
        
        var L = attributes.sectionNum.array[i];  // 长线包含的线段数
        
        var l = parseInt(k*L);  // 轨迹段数

        var diff = 1/l;  // 透明度变化单位
        var startIndex = attributes.startNum.array[i];

        for(var j=0; j<l; j++){ // 轨迹段数
            var curIndex = (L-j)%L + startIndex;
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
        site = "step"+String(d)
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
            if(d==loadStepNum-1){
                console.log(attr+"值设置完毕");

                // curLine = findModel("step0");
            }
        })
    });
}

function loadAttrArray(attr){
    let flag0 = []; //promise数组
    for(var i =0; i<loadStepNum; i++){
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




function parseColor(currentColor){
    if(currentColor == "") // 如果未选择，默认为白色
        return [1, 1, 1];
    

    if(currentColor.substr(0,1) == "#"){  // 16进制rgb
        let RGB = new THREE.Color(currentColor).toArray();  // 每个元素范围是0~1
        // console.log(RGB);
        return RGB;
    }
    else{
        let RGBA = currentColor.match(/[\d.]+/g);
        
        RGBA[0] = parseFloat(RGBA[0])/255;
        RGBA[1] = parseFloat(RGBA[1])/255;
        RGBA[2] = parseFloat(RGBA[2])/255;
        RGBA[3] = parseFloat(RGBA[3]);

        return RGBA;
    }
}

function setColorAndOpacity(){
    if(currentColor0.length==3){currentRGB0 = currentColor0; currentOpacity0 = 1.0;
    }else{currentRGB0 = currentColor0.splice(3); currentColor0 = currentColor0[3];}

    if(currentColor1.length==3){currentRGB1 = currentColor1; currentOpacity1 = 1.0;
    }else{currentRGB1 = currentColor1.splice(3); currentColor1 = currentColor1[3];}

    if(currentColor2.length==3){currentRGB2 = currentColor2; currentOpacity2 = 1.0;
    }else{currentRGB2 = currentColor2.splice(3); currentColor2 = currentColor2[3];}
}

// 在图中显示涡核
function showPointers(){
    if(currentMainStep<0)
        return;
    var info = eddyFeature['info'][currentMainStep];
    for(let i=0; i<info.length; i++){  // currentMainStep当步
        var cpx = info[i][0];  // cpx指的是在panel上的cx
        var cpy = info[i][1];

        var cxy = pxy2xy(cpx, cpy);

        // 在涡核处显示标记
        // var geometryCone = new THREE.ConeGeometry( 20, 100, 3 );
        var geometryCone = new THREE.ConeGeometry( 30, 150, 3 );
        geometryCone.rotateX( -Math.PI / 2 );
        // 直接setPosition好像不行，还是平移吧
        geometryCone.translate(cxy[0], cxy[1], 75);
        
        var cone = new THREE.Mesh( geometryCone, new THREE.MeshNormalMaterial({
            transparent: true,
            opacity: 0.7
        }));
        scene.add( cone );
        
        existedCones.push(cone);
    }
}

function removePointers(){
    for(let i=0; i<existedCones.length; i++){
        var item = existedCones[i];
        deleteModel(item);
        scene.remove(item);
    }
    existedCones.length = 0;  // 清空数组
}


/*
    改变geometry的属性
*/
function assignAllColorAndOpacity(curLine){
    if(curLine==undefined)
        return;
    var cColor0 = currentRGB0;
    var cColor1 = currentRGB1;
    var cColor2 = currentRGB2;

    var cOpa0 = currentOpacity0;
    var cOpa1 = currentOpacity1;
    var cOpa2 = currentOpacity2;


    var currentAttrArray = [];
    switch(currentAttr){
        case "OW":
            currentAttrArray = curLine.geometry.attributes.OW.array;
            break;
        case "vorticity":
            currentAttrArray = curLine.geometry.attributes.VORTICITY.array;
            break;
    }


    for(var i = 0; i<currentAttrArray.length; i++){
        if(currentAttrArray[i]<downValue){
            curLine.geometry.attributes.color.array[3*i] = cColor0[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor0[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor0[2];
            curLine.geometry.attributes.opacity.array[i] = cOpa0;
        }
        else if(currentAttrArray[i]>= downValue && currentAttrArray[i]<= upValue){
            curLine.geometry.attributes.color.array[3*i] = cColor1[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor1[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor1[2];
            curLine.geometry.attributes.opacity.array[i] = cOpa1;
        }
        else{
            curLine.geometry.attributes.color.array[3*i] = cColor2[0];
            curLine.geometry.attributes.color.array[3*i+1] = cColor2[1];
            curLine.geometry.attributes.color.array[3*i+2] = cColor2[2];
            curLine.geometry.attributes.opacity.array[i] = cOpa2;
        }
    }
}


/*
    更新material的属性
*/
function updateColorAndOpacity(curLine){
    if(curLine==undefined)
        return;

    for(var i=0; i<curLine.material.length; i++){
        let r = (curLine.geometry.attributes.color.array[6*i] + curLine.geometry.attributes.color.array[6*i+3])/2;
        let g = (curLine.geometry.attributes.color.array[6*i+1] + curLine.geometry.attributes.color.array[6*i+4])/2;
        let b = (curLine.geometry.attributes.color.array[6*i+2] + curLine.geometry.attributes.color.array[6*i+5])/2;
        curLine.material[i].color.setRGB(r, g, b);

        curLine.material[i].opacity = Math.min(curLine.geometry.attributes.opacity.array[2*i], curLine.geometry.attributes.opacity.array[2*i+1]);
        
    }
}



// 把所有线条颜色都变成白色，透明度变为1，并且最大透明度数组恢复
function resetMaterial(cur){
    if(cur==undefined)
        return;
    for(var i=0; i<cur.material.length; i++){
        cur.material[i].color = new THREE.Color(1, 1, 1);
        cur.material[i].opacity = 1.0;
    }
    cur.geometry.setAttribute( 'mOpaIndex', new THREE.Float32BufferAttribute( cur.geometry.attributes.startNum.array, 1 ));
}

// 把所有线条颜色都变成白色，透明度变为0，并且最大透明度数组恢复
function resetMaterial0(cur){
    if(cur==undefined)
        return;
    for(var i=0; i<cur.material.length; i++){
        cur.material[i].color = new THREE.Color(1, 1, 1);
        cur.material[i].opacity = 0;
    }
    cur.geometry.setAttribute( 'mOpaIndex', new THREE.Float32BufferAttribute( cur.geometry.attributes.startNum.array, 1 ));
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
            var next_mOpaIndex = (attributes.mOpaIndex.array[i]-startIndex+1)%L+startIndex;
            mats[next_mOpaIndex].opacity = 1;
            attributes.mOpaIndex.array[i] = next_mOpaIndex; // 更新数组
        }

    }
}


function onMouseMove( event ) {
}

function onMouseClick(event){

    // console.log(event);
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    /*
        renderer.domElement的clientWidth和clientHeight就是renderer的宽度和高度
        由于event.clientX, Y表示屏幕上鼠标的绝对位置，所以要减去窗口的偏移，再比上窗口的宽和高
    */
    getMouseXY(event);  // 将鼠标位置进行转化，需要传给raycaster一个位置坐标（相对于窗口）

    // 现在的mouse的二维坐标就是当前鼠标在当前窗口的位置（-1~1)
    // console.log(mouse)
    

    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera( mouse, camera );  // (鼠标的二维坐标, 射线起点处的相机)

    // 查看相机发出的光线是否击中了我们的网格物体之一（计算物体和射线的焦点）
    // 检查射线和物体之间的所有交叉点，交叉点返回按距离排序，最接近的为第一个。 返回一个交叉点对象数组。

    var intersects;

    intersects = raycaster.intersectObject( sea);
    if(intersects == undefined){
        intersects = raycaster.intersectObject( surface);  // 点到陆地上了
    }

    if(intersects!=undefined && intersects.length>0){
        var curObj = intersects[0];  // 目标物体（海水/陆地）
        if(pickMode == true){
            selected_pos = curObj.point;

            // 恢复所有指示器的material
            for(let i=0; i<existedCones.length; i++){
                recoverPointer(i);
            }

            // 鼠标mx my转换为panel的px py，再从json中找最近的涡旋
            var pxy = mxy2pxy(selected_pos.x, selected_pos.y);
            tarArr = getNearestEddy(pxy[0], pxy[1]);  // 得到最近的涡旋的下标、中心坐标

            if(tarArr[0]!=undefined){
                // 因为原来的材质是MeshNormalMaterial，是不能改变颜色的
                // 这里换成普通的MeshLambertMaterial
                changePointer(tarArr[0], specific_color)
                pickUpdateSign = true;  // 向局部板块释放涡旋更新信号
            }
            
        }
    }   
}

function getMouseXY(event){
    // console.log(gui_container.clientHeight);  
    // console.log("event: ", event.clientX, event.clientY);
    // console.log("render: ", renderer.domElement.clientWidth, renderer.domElement.clientHeight);

    // 需要算上gui的高度导致偏移
    mouse.x = ( (event.clientX) / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( (event.clientY - gui_container.clientHeight ) / renderer.domElement.clientHeight ) * 2 + 1;

    // 这时候得到的是真实的三维坐标
    // console.log("mouse: ", mouse.x, mouse.y);
}

function recoverPointer(index){
    existedCones[index].material = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.7,
    });
}
function changePointer(index, hex){
    existedCones[index].material = new THREE.MeshPhongMaterial({
        color: hex,
    });
}

function updateStreamline(){
    if(currentMainStep == lastStep)  // 天数没变不用刷新
        return ;

    if(lastStep!=-1){  // 清除上次的显示
        lastSite = "step"+String(lastStep);
        lastLine = scene.getObjectByName(lastSite);

        if(lastLine!=undefined)  // 这个判断不加也行
            scene.remove(lastLine);
    }

    curSite = "step"+String(currentMainStep);
    
    curLine = findModel(curSite);
    scene.add(curLine);

    // 更新当步当前属性的echarts
    // updateEcharts(currentAttr, currentMainStep);
    
    if(curLine!=undefined){
        $("#confirm-button").click();  // 模拟一次点击
    }

    removePointers();
    if(currentMainStep!=-1){
        showPointers();  // 显示涡核指示器
    }

    lastStep = currentMainStep;
}


function setRenderSize() {
    containerWidth = String(getStyle(container, "width"));
    containerHeight = String(getStyle(container, "height"));

    containerWidth = containerWidth.slice(0, containerWidth.length-2);  // 去掉末尾的px
    containerHeight = containerHeight.slice(0, containerHeight.length-2);

    renderWidth = parseInt(containerWidth);
    renderHeight = parseInt(containerHeight);
}



function animate() {

    // if(dynamic)  // 只有dynamic为true时才渲染
    //     DyChange(0.5);

    // if(dyeSign){  // 收到染色信号
    //     dyeSign = false;  // 取消染色信号
    //     for(let i=0; i<existedEddyIndices.length; i++){
    //         changePointer(existedEddyIndices[i], specific_color);
    //     }
    // }

    if(switchTimeSign){  // 时间改变了，更新流线
        switchTimeSign = false;

        updateStreamline();
    }
    
    stats.update();

    requestAnimationFrame( animate );
    render();
}

function render() {
    renderer.render( scene, camera );
}


/*
* toolbar触发
*/

$("#confirm-button").click(
    function(){
        currentAttr = $("#attribute-selector").val();
        

        // 得到RGB数组orRGBA数组
        currentColor0 = parseColor($("#color-sec0").val());
        currentColor1 = parseColor($("#color-sec1").val());
        currentColor2 = parseColor($("#color-sec2").val());

        
        downValue = $("#lower-bound").val();

        if(downValue==""){
            downValue = 0;
            $("#lower-bound").val(0);
        }
        else downValue = parseFloat(downValue);
        

        upValue = $("#upper-bound").val();

        if(upValue==""){
            upValue = 0;
            $("#upper-bound").val(0);
        }
        else upValue = parseFloat(upValue);
        

        setColorAndOpacity();
        assignAllColorAndOpacity(curLine);  // 属性数组赋值
        updateColorAndOpacity(curLine);  // 改变材质
    }
)