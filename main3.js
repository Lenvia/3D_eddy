import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

let container, stats;  // 容器，状态监控器
let camera, controls, scene, renderer;  // 相机，控制，画面，渲染器
let mesh, texture;  // 山脉网格， 纹理
var maxH;  // 产生的山脉最大高度

const worldWidth = 256, worldDepth = 256; // 控制地形点的数目
const worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = 3000;  // 地形宽度
const scaleHeight = 1000; //缩放高度

let helper;  // 鼠标helper

const raycaster = new THREE.Raycaster();  // 射线
const mouse = new THREE.Vector2();  // 鼠标二维坐标

const days = []  // 一共60天
for (var i =0; i<=59; i++) days.push(i);

// 进度条模块
var progressModal, progressBar, progressLabel, progressBackground;
var frameLabel;


// 场上显示的模型
var existModel = []


// gui参数
var currentDay;
var currentAttr;
var upValue;
var downValue;
var difValue;
var mid1, mid2, mid3, mid4;
var currentColor0 = [];
var currentColor1 = [];
var currentColor2 = [];
var currentColor3 = [];
var currentColor4 = [];
var currentOpacity0 = [];
var currentOpacity1 = [];
var currentOpacity2 = [];
var currentOpacity3 = [];



init();
animate();

function init() {
    container = document.getElementById( 'container' );
    container.innerHTML = "";

    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( window.innerWidth, window.innerHeight );  // 尺寸


    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );  // 浅蓝色

    // PerspectiveCamera( fov, aspect, near, far )  视场、长宽比、渲染开始距离、结束距离
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 10, 20000 );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 1000;   // 最近距离
    controls.maxDistance = 10000;  // 最远距离
    // controls.maxPolarAngle = Math.PI / 2;  // 限制竖直方向上最大旋转角度。（y轴正向为0度）

    // 辅助坐标系
    var axesHelper = new THREE.AxesHelper(1500);
    scene.add(axesHelper);

    // 创建海底地形和海水
    createTerrainAndSea();
    // 显示等待条
    showProgressModal("loadingFrames");
    // 加载涡旋模型
    loadEddyForDays();
    // 设置OW属性
    loadOWArray();
    // 设置交互面板
    setGUI();

    //环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    var ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    container.addEventListener( 'mousemove', onMouseMove, false );

    stats = new Stats();
    container.appendChild( stats.dom );

    // 窗口缩放时触发
    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

/*
    生成地形顶点高度数据
*/
function generateHeight( width, height ) {
    // 总的顶点数据量width * height
    const size = width * height, data = new Uint8Array( size );
    // ImprovedNoise来实现地形高度数据的随机生成。
    // perlin —— 柏林噪声
    const perlin = new ImprovedNoise();

    // const z = Math.random() * 100; // z值不同 每次执行随机出来的地形效果不同
    const z = 100;  // 这里不是控制高度的，而是整体地形。 如果z值固定，每次刷新都是一样的山脉（但内部高度不一样）

    // 控制地面显示效果  可以尝试0.01  0.1  1等不值
    // 0.1凹凸不平的地面效果  1山脉地形效果
    let quality = 1;

    for ( let j = 0; j < 4; j ++ ) {
        for ( let i = 0; i < size; i ++ ) {
            // x的值0 1 2 3 4 5 6...
            const x = i % width, y = ~ ~ ( i / width );  //~表示按位取反 两个~就是按位取反后再取反。 ~~相当于Math.floor(),效率高一点
            // 通过噪声生成数据
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );
        }
        // 循环执行的时候，quality累乘  乘的系数是1  显示效果平面
        quality *= 5;
    }

    // console.log(data)
    return data;
}

/*
    生成地形顶点纹理数据？？
*/
function generateTexture( data, width, height ) {
    // bake lighting into texture
    let context, image, imageData, shade;

    const vector3 = new THREE.Vector3( 0, 0, 0 );

    const sun = new THREE.Vector3( 1, 1, 1 );
    sun.normalize();

    const canvas = document.createElement( 'canvas' );  // 创建一个画布对象
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext( '2d' );  // getContext() 方法可返回一个对象，该对象提供了用于在画布上绘图的方法和属性。
    context.fillStyle = '#000';  // 设置或返回用于填充绘画的颜色、渐变或模式
    context.fillRect( 0, 0, width, height );  // 绘制“被填充”的矩形。 左上角坐标，宽度，高度

    // 返回 ImageData 对象，该对象为画布上指定的矩形复制像素数据
    // 每个像素需要占用4位数据，分别是r,g,b,alpha透明通道
    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;  // 仍然指向同一个地址
    // 光影效果
    // j的总范围也就是[0, width * height)
    for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.z = 2;
        vector3.normalize();

        // 阴影？
        shade = vector3.dot( sun );

        // 山体颜色
        imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 ) * 0;
        imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 ) * 0.3;
        imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 ) * 0.7;

        // imageData[ i ] = 0;
        // imageData[ i+1 ] = 150;
        // imageData[ i+2 ] = 225;

    }

    // 用于将ImagaData对象的数据填写到canvas中，起到覆盖canvas中
    context.putImageData( image, 0, 0 );  // (img对象, 左上角x, 左上角y)

    // Scaled 4x
    // 我不是很懂为什么要乘4，只要保证canvasScaled和下面context的倍数相同，整体问题不大
    const canvasScaled = document.createElement( 'canvas' );
    var zoomDegree = 4;  // 缩放倍数
    canvasScaled.width = width * zoomDegree;
    canvasScaled.height = height * zoomDegree;

    context = canvasScaled.getContext( '2d' );
    context.scale( zoomDegree, zoomDegree );  // 宽度、高度缩放倍数
    context.drawImage( canvas, 0, 0 );

    image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );  //(x,y,width,height)
    imageData = image.data;

    // 这里不太明白，我注释掉之后没啥变化？
    for ( let i = 0, l = imageData.length; i < l; i += 4 ) {
        const v = ~ ~ ( Math.random() * 5 );  
        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;
    }
    context.putImageData( image, 0, 0 );
    return canvasScaled;
}

/*
    设置海底和海水
*/
function createTerrainAndSea(){
    /*
        设置海底地形
    */

    // 地形顶点高度数据
    const data = generateHeight( worldWidth, worldDepth );

    // worldHalfWidth + worldHalfDepth * worldWidth 应该是最中心的点的索引
    controls.target.z = data[ worldHalfWidth + worldHalfDepth * worldWidth ];
    camera.position.z = controls.target.z + 500;
    camera.position.x = edgeLen*1.5;
    // camera.position.y = 2000*1.2;
    controls.update();

    // 创建一个平面地形，行列两个方向顶点数据分别为width，height
    // PlaneBufferGeometry(width, height, widthSegments, heightSegments) 后两个参数是分段数
    const geometry = new THREE.PlaneBufferGeometry( edgeLen, edgeWid, worldWidth - 1, worldDepth - 1 );

    // 访问几何体的顶点位置坐标数据（数组大小为 点的个数*3）
    const vertices = geometry.attributes.position.array;

    // 改变顶点高度值（因为y轴是向上的，所以应该改每个点的y值）
    maxH = data[0] * 10;
    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        vertices[ j + 2 ] = data[ i ] * 10;
        if(maxH < vertices[j + 1])  // 找出最高的
            maxH = vertices[j + 1]
    }

    // 不执行computeVertexNormals，没有顶点法向量数据
    geometry.computeFaceNormals(); // needed for helper
    // 设置海底！
    var biasZ = 1.5*maxH;  // 海底山脉向下移动
    geometry.translate(0, 0, -biasZ);

    // generateTexture返回一个画布对象
    texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    // wrapS/wrapT 纹理在水平和垂直方向的扩展方式
    texture.wrapS = THREE.ClampToEdgeWrapping;  // 纹理边缘像素会被拉伸，以填满剩下的空间。
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshBasicMaterial( { 
        map: texture,
        transparent: true,
        opacity: 0.1,  // 纹理透明度 
        depthWrite: false, 
    } );

    mesh = new THREE.Mesh( geometry, material);
    scene.add( mesh );

    /*
        设置海水
    */
    // 海水箱子的长、宽
    var boxLen = 1.1*edgeLen, boxWid = 1.1*edgeLen;
    const geometry2 = new THREE.BoxGeometry(boxLen, boxWid, biasZ);
    const material2 = new THREE.MeshLambertMaterial({
        color: 0x00BFFF,
        transparent: true,
        opacity: 0.1,
        depthWrite: false, 
    }); //材质对象Material

    geometry2.translate(0, 0, -biasZ/2);
    var mesh2 = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    mesh2.position.set(0,0,0);
    scene.add(mesh2); //网格模型添加到场景中

    const vertices0 = geometry.attributes.position.array;
    var maxz = vertices0[2];
    var minz = vertices0[2];
    for ( let i = 2, l = vertices0.length; i < l; i+= 3 ) {
        if(maxz < vertices0[ i])  // 找出最大的
            maxz = vertices0[ i]
        if(minz > vertices[ i])  
            minz = vertices[ i]
    }
    // console.log("山脉maxz:", maxz)
    // console.log("山脉minz:", minz)
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
function loadEddyForDays(){
    let arr = []; //promise返回值的数组
    for (let i = 0; i<1; i++){
        arr[i] = new Promise((resolve, reject)=>{
            // 加载一天的形状
            var d = i;
            var vtk_path = ("./whole_vtk_folder".concat("/vtk", d, ".vtk"));
            var loader = new VTKLoader();
            console.log("loading", vtk_path);
            loader.load( vtk_path, function ( geometry ) {  // 异步加载
                

                geometry.translate(-0.5, -0.5, -1);
                geometry.scale(edgeLen, edgeWid, scaleHeight);

                // 转化为无索引格式，用来分组
                geometry = geometry.toNonIndexed();
                var vertexNum = geometry.attributes.position.count;
                
                var opa = []; // 顶点透明度，用来改变线条透明度
                for (var i = 0; i<vertexNum; i++){
                    opa.push(1);  // 默认都是1
                }
                geometry.setAttribute( 'opacity', new THREE.Float32BufferAttribute( opa, 1 ));

                var mats = [];
                for (var i =0; i<vertexNum; i+=2){
                    geometry.addGroup(i, 2, i/2);  // 无索引形式(startIndex, count, groupId)
                    let material = new THREE.LineBasicMaterial({
                        vertexColors: true,  // 线条各部分的颜色根据顶点的颜色来进行插值
                        transparent: true, // 可定义透明度
                        opacity: 1,  // 好像这些是不能自动计算的，那就直接设成1吧
                        depthWrite: false, 
                    });
                    mats.push(material);
                }
                var linesG = new THREE.LineSegments(geometry, mats);

                console.log(linesG);
                console.log(linesG.material[0].color);


                linesG.name = "day"+String(d);  // day0, day1, ...
                scene.add(linesG);
                linesG.visible = false;
                resolve(i);
            });
            
        })
    }
    // 当所有加载都完成之后，再隐藏“等待进度条”
    Promise.all(arr).then((res)=>{
        console.log("模型加载完毕");
        hideProgressModal();
    })
}

/*
    转换后的xyz到数组i,j,k的映射
*/
function xyz2ijk(x, y, z){
    // console.log(x,y,z);
    var orix = x/edgeLen + 0.5;
    var oriy = y/edgeWid + 0.5;
    var oriz = z/scaleHeight + 1;

    // console.log(orix, oriy, oriz);

    var i = Math.floor(orix/0.002);
    var j = Math.floor(oriy/0.002);
    var k = Math.floor(oriz/0.02);

    return new Array(i, j, k);
}

/*
    加载OW数组
*/
function loadOWArray(){
    for(var i =0; i<1; i++){
        var d = i;
        var path = ("./OW_array/".concat("OW_", String(d), ".txt"));
        // console.log(path);
        var site, linesG, geometry;
        var arr;
        var promise1 = new Promise(function(resolve, reject) {
            $.get(path, function(data) {
                // 加载OW数组
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
                console.log("OW数组提取完毕");
                // console.log(arr);
                resolve(1);
            });
        });

        promise1.then(()=>{
            // 将OW值放到geometry中
            site = "day"+String(d)
            linesG = scene.getObjectByName(site);
            var OW = [];
            var x,y,z;  // 点的当前坐标（缩放后）
            var i,j,k;  // 点对应的OW数组中的下标
            var position = linesG.geometry.attributes.position.array;  // 看清属性
            console.log("postion数组读取完毕");

            var temp = new Array(3);
            let flag = []; //promise返回数组

            // var maxOW = -1;
            // var minOW = 99999;

            for( var q =0; q<position.length; q+=3){
                flag[q/3] = new Promise((resolve, reject)=>{
                    x = position[q];
                    y = position[q+1];
                    z = position[q+2];
                
                    temp = xyz2ijk(x, y, z);
                    i = temp[0];
                    j = temp[1];
                    k = temp[2];
                    // console.log(x,y,z, "-->", i, j, k);

                    OW[q/3] = arr[i][j][k];
                    // if(maxOW<OW[q/3])
                    //     maxOW = OW[q/3];
                    // if(minOW>OW[q/3])
                    //     minOW = OW[q/3];
                    resolve(q);
                })
            }
            
            Promise.all(flag).then((res)=>{
                linesG.geometry.setAttribute( 'OW', new THREE.Float32BufferAttribute( OW, 1 ));
                console.log("OW值设置完毕");
                // console.log("maxOW", maxOW);
                // console.log("minOW", minOW);
            })
        });

    }
    
}

/*
    设置交互GUI
*/
function setGUI(){
    var gui = new dat.GUI();
    var gui_controls = new function(){
        this.currentDay = 0;  // 初始时间为第0天
        this.currentAttr = 'OW'; // 初始展示属性为OW
        this.upValue = 10; // 属性的下界
        this.downValue = -10;  // 属性的上界
        this.color0 = [255, 255, 255]; // RGB array
        this.color1 = [255, 255, 255]; // RGB array
        this.color2 = [255, 255, 255]; // RGB array
        this.color3 = [255, 255, 255]; // RGB array
        this.color4 = [255, 255, 255]; // RGB array
        this.opacity0 = 1.0;
        this.opacity1 = 1.0;
        this.opacity2 = 1.0;
        this.opacity3 = 1.0;
    }

    currentDay = 0;
    var lastDay = -1;
    var curLine, lastLine;  // 当前显示的线，上次显示的线
    var site, last_site;

    // // 默认显示
    // site = "day"+String(currentDay);
    // curLine = scene.getObjectByName(site);
    // curLine.visible = true;

    // 切换日期
    gui.add(gui_controls, 'currentDay', days).onChange(function(){
        if(lastDay!=-1){  // 清除上次的显示
            last_site = "day"+String(lastDay);
            lastLine = scene.getObjectByName(last_site);
            lastLine.visible = false;
        }

        currentDay = gui_controls.currentDay;
        console.log("currentDay:", currentDay);

        site = "day"+String(currentDay);
        
        curLine = scene.getObjectByName(site);
        console.log(curLine);
        curLine.visible = true;
        lastDay = currentDay;
    });

    // 属性值上下界
    upValue = gui_controls.upValue;
    downValue = gui_controls.downValue;
    difValue = upValue-downValue;
    mid1 = downValue+0.2*difValue;
    mid2 = downValue+0.4*difValue;
    mid3 = downValue+0.6*difValue;
    mid4 = downValue+0.8*difValue;


    currentAttr = 'OW';
    gui.add(gui_controls, 'currentAttr', ['OW', 'vorticity']).onChange(function(){
        currentAttr = gui_controls.currentAttr;
        console.log("currentAttr:", currentAttr);
    });

    gui.add(gui_controls, 'upValue').onChange(function(){
        upValue = gui_controls.upValue;
        console.log("upValue:", upValue);

        // 更新中间点
        difValue = upValue-downValue;
        mid1 = downValue+0.2*difValue;
        mid2 = downValue+0.4*difValue;
        mid3 = downValue+0.6*difValue;
        mid4 = downValue+0.8*difValue;
    });

    gui.add(gui_controls, 'downValue').onChange(function(){
        downValue = gui_controls.downValue;
        console.log("downValue:", downValue);

        // 更新中间点
        difValue = upValue-downValue;
        mid1 = downValue+0.2*difValue;
        mid2 = downValue+0.4*difValue;
        mid3 = downValue+0.6*difValue;
        mid4 = downValue+0.8*difValue;
    });


    // 交互颜色
    var colorFolder = gui.addFolder('color');
    // color0
    colorFolder.addColor(gui_controls, 'color0').onFinishChange(function(){
        currentColor0 = gui_controls.color0;
        console.log("color0:", currentColor0);

        var cColor = [currentColor0[0]/255, currentColor0[1]/255, currentColor0[2]/255];

        // 修改该范围内的点的颜色
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]<= mid1){
                curLine.geometry.attributes.color.array[3*i] = cColor[0];
                curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
            }
        }
        updateColor(curLine);  // 更新material
    });

    // color1
    colorFolder.addColor(gui_controls, 'color1').onFinishChange(function(){
        currentColor1 = gui_controls.color1;
        console.log("color1:", currentColor1);

        var cColor = [currentColor1[0]/255, currentColor1[1]/255, currentColor1[2]/255];

        // 修改该范围内的点的颜色
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]> mid1 && curLine.geometry.attributes.OW.array[i]<= mid2){
                curLine.geometry.attributes.color.array[3*i] = cColor[0];
                curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
            }
        }
        updateColor(curLine);  // 更新material
    });
    // color2
    colorFolder.addColor(gui_controls, 'color2').onFinishChange(function(){
        currentColor2 = gui_controls.color2;
        console.log("color2:", currentColor2);

        var cColor = [currentColor2[0]/255, currentColor2[1]/255, currentColor2[2]/255];

        // 修改该范围内的点的颜色
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]> mid2 && curLine.geometry.attributes.OW.array[i]<= mid3){
                curLine.geometry.attributes.color.array[3*i] = cColor[0];
                curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
            }
        }
        updateColor(curLine);  // 更新material
    });
    // color3
    colorFolder.addColor(gui_controls, 'color3').onFinishChange(function(){
        currentColor3 = gui_controls.color3;
        console.log("color3:", currentColor3);
        
        var cColor = [currentColor3[0]/255, currentColor3[1]/255, currentColor3[2]/255];

        // 修改该范围内的点的颜色
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]> mid3 && curLine.geometry.attributes.OW.array[i]<= mid4){
                curLine.geometry.attributes.color.array[3*i] = cColor[0];
                curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
            }
        }
        updateColor(curLine);  // 更新material
    });

    // color4
    colorFolder.addColor(gui_controls, 'color4').onFinishChange(function(){
        currentColor4 = gui_controls.color4;
        console.log("color4:", currentColor4);
        
        var cColor = [currentColor4[0]/255, currentColor4[1]/255, currentColor4[2]/255];

        // 修改该范围内的点的颜色
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]> mid4){
                curLine.geometry.attributes.color.array[3*i] = cColor[0];
                curLine.geometry.attributes.color.array[3*i+1] = cColor[1];
                curLine.geometry.attributes.color.array[3*i+2] = cColor[2];
            }
        }
        updateColor(curLine);  // 更新material
    });


    //交互透明度
    var opaFolder = gui.addFolder('opacity');
    opaFolder.add(gui_controls, 'opacity0', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity0 = gui_controls.opacity0;
        console.log("opacity0:", currentOpacity0);

        var cOpa = currentOpacity0;

        // 修改该范围内的点的透明度
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]<= downValue+0.25*difValue){
                curLine.geometry.attributes.opacity.array[i] = cOpa;
            }
        }
       
    })
    opaFolder.add(gui_controls, 'opacity1', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity1 = gui_controls.opacity1;
        console.log("opacity1:", currentOpacity1);

        var cOpa = currentOpacity1;

        // 修改该范围内的点的透明度
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]<= downValue+0.25*difValue){
                curLine.geometry.attributes.opacity.array[i] = cOpa;
            }
        }
        
    })
    opaFolder.add(gui_controls, 'opacity2', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity2 = gui_controls.opacity2;
        console.log("opacity2:", currentOpacity2);

        var cOpa = currentOpacity0;

        // 修改该范围内的点的透明度
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]<= downValue+0.25*difValue){
                curLine.geometry.attributes.opacity.array[i] = cOpa;
            }
        }
        
    })
    opaFolder.add(gui_controls, 'opacity3', 0, 1, 0.05).onFinishChange(function(){
        currentOpacity3 = gui_controls.opacity3;
        console.log("opacity3:", currentOpacity3);

        var cOpa = currentOpacity3;

        // 修改该范围内的点的透明度
        for(var i = 0; i<curLine.geometry.attributes.OW.array.length; i++){
            if(curLine.geometry.attributes.OW.array[i]<= downValue+0.25*difValue){
                curLine.geometry.attributes.opacity.array[i] = cOpa;
            }
        }
        
    })


}

/*
    更新material的属性
*/
function updateColor(curLine){
    for(var i=0; i<curLine.material.length; i++){
        let r = (curLine.geometry.attributes.color.array[6*i] + curLine.geometry.attributes.color.array[6*i+3])/2;
        let g = (curLine.geometry.attributes.color.array[6*i+1] + curLine.geometry.attributes.color.array[6*i+4])/2;
        let b = (curLine.geometry.attributes.color.array[6*i+2] + curLine.geometry.attributes.color.array[6*i+5])/2;
        curLine.material[i].color = new THREE.Color(r, g, b);
    }
}


function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}

function onMouseMove( event ) {
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera( mouse, camera );  // (鼠标的二维坐标, 射线起点处的相机)

    // 查看相机发出的光线是否击中了我们的网格物体之一（计算物体和射线的焦点）
    // 检查射线和物体之间的所有交叉点，交叉点返回按距离排序，最接近的为第一个。 返回一个交叉点对象数组。
    const intersects = raycaster.intersectObject( mesh );
    // 该方法返回一个包含有交叉部分的数组: [ { distance, point, face, faceIndex, object }, ... ]
    // {射线投射原点和相交部分之间的距离,  相交部分的点（世界坐标）, 相交的面, 面索引, 相交的物体, 相交部分的点的UV坐标}

    // Toggle rotation bool for meshes that we clicked
    // if ( intersects.length > 0 ) {
    // 	helper.position.set( 0, 0, 0 );
    // 	helper.lookAt( intersects[ 0 ].face.normal );
    // 	helper.position.copy( intersects[ 0 ].point );
    // }
}