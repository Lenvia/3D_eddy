import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader2.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

var container, stats;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器


const worldWidth = 256, worldDepth = 256; // 控制地形点的数目
const worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

const renderWidth = 0.4*window.innerWidth, renderHeight = 0.5*window.innerHeight;


let helper;  // 鼠标helper

const raycaster = new THREE.Raycaster();  // 射线
const mouse = new THREE.Vector2();  // 鼠标二维坐标

const days = [];  // 一共60天
const exDays = [-1]; // 扩展天数，第一个是-1
for (var i =0; i<=59; i++){
    days.push(i);
    exDays.push(i);
}


var curLocalLine;


init();


function init() {
    container = document.getElementById( 'container2' );
    container.innerHTML = "";

    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( renderWidth, renderHeight );  // 尺寸


    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x1b76dd );  // 深蓝色

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


    // createSea();


    // 加载涡旋模型
    loadAllEddies();


    //环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    stats = new Stats();
    container.appendChild( stats.dom );

    // 窗口缩放时触发
    window.addEventListener( 'resize', onWindowResize, false );

    animate();
}

function onWindowResize() {
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
        opacity: 0.5,
        depthWrite: false, 
        vertexColors: true,
    }); //材质对象Material

    geometry2.translate(0, 0, -biasZ/2);
    var mesh2 = new THREE.Mesh(geometry2, material2); //网格模型对象Mesh
    mesh2.position.set(0,0,0);
    // console.log(mesh2);
    scene.add(mesh2); //网格模型添加到场景中
}


/*
    加载涡旋n天的形状
*/
function loadAllEddies(){
    let arr = []; //promise返回值的数组
    for(let i=0; i<eddyInfo.length; i++){
        // 含有i的都要放在promise里面！！！！
        arr[i] = new Promise((resolve, reject)=>{
            var master = eddyInfo[i]['master'];  // 所属涡旋
            var name = eddyInfo[i]['name'];  // 涡旋识别编号
            var vtk_path = ("./vtk_folder/".concat(master, '/vtk', name, '.vtk'))

            var loader = new VTKLoader();

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


                // 转化为无索引格式，用来分组
                geometry = geometry.toNonIndexed();

                var vertexNum = geometry.attributes.position.count;
                
                var opa = []; // 顶点透明度，用来改变线条透明度
                for (var i = 0; i<vertexNum; i++){
                    opa.push(1);  // 默认都是1
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
                        opacity: 1,
                        depthWrite: false, 
                    });
                    mats.push(material);
                }
                var linesG = new THREE.LineSegments(geometry, mats);

                //need update 我不知道有没有用，感觉没用
                linesG.geometry.colorsNeedUpdate = true;
                linesG.geometry.groupsNeedUpdate = true;
                linesG.material.needsUpdate = true;
                
                // initLineOpacity(linesG, 0.5);  // 初始化透明度
                linesG.name = name;  // 0_9, 4_10, ...
                // console.log(name, "加载完毕");

                scene.add(linesG);
                linesG.visible = false;
                resolve(i);
            });
        })
    }
    Promise.all(arr).then((res)=>{
        console.log("局部涡旋加载完毕");
    })
}



// 传递过来的坐标到经纬度的映射，用来判断距离
function xy2lonlat(x, y){
    var lon = (x/edgeLen+0.5)*20+30.2072;
    var lat = (y/edgeWid+0.5)*20+10.0271;

    console.log(lon, lat);


    var minDis = 1000; // 最大不会超过800的
    var minName = undefined;

    for(let i=0; i<eddyInfo.length; i++){
        if(eddyInfo[i]['name'].split('_')[0] != String(currentMainDay))
            continue;
        
        var currentDis = getDisdance(lon, lat, eddyInfo[i]['lon'], eddyInfo[i]['lat']);
        console.log(eddyInfo[i]['name'], currentDis);

        if(minDis>currentDis){
            minDis = currentDis;
            minName = eddyInfo[i]['name'];
        }
    }

    if(minName!=undefined){
        curLocalLine = scene.getObjectByName(minName);
        curLocalLine.visible = true;
    }
}

// 暂时先用最简单的点距
function getDisdance(lon1, lat1, lon2, lat2){
    return Math.pow((lon1-lon2), 2) + Math.pow((lat1-lat2), 2);
}


function animate() {
    requestAnimationFrame( animate );

    if(selected_pos!= undefined && updateSign){
        console.log(selected_pos);
        updateSign = false;

        xy2lonlat(selected_pos.x, selected_pos.y);
    }
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}
