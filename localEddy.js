import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader3.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

var container, stats;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器


const worldWidth = 256, worldDepth = 256; // 控制地形点的数目
const worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var renderWidth , renderHeight;
setRenderSize();


const raycaster = new THREE.Raycaster();  // 射线
const mouse = new THREE.Vector2();  // 鼠标二维坐标

const days = [];  // 一共60天
const exDays = [-1]; // 扩展天数，第一个是-1
for (var i =0; i<=59; i++){
    days.push(i);
    exDays.push(i);
}


var curPart;
var curPartName;


init();


function init() {
    container = document.getElementById( 'container2' );
    container.innerHTML = "";

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


    // 加载涡旋模型
    // loadAllEddies();


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


// 根据目标涡旋下标、中心来显示指定区域
function showSpecifiedArea(tarArr){
    var minIndex = tarArr[0];  // 目标涡旋下标
    // 涡旋中心
    var tarCpx = tarArr[1];
    var tarCpy = tarArr[2];

    if(minIndex!=undefined){
        // 计算该涡旋属于哪一个part
        var partIndex = choosePart(tarCpx, tarCpy);
        // console.log(partIndex);
        var partName = String(currentMainDay)+"_"+String(partIndex);

        if(partName == curPartName)  //  不需要加载
                return ;
        else{
            console.log(curPart);
            deleteModel(curPart);  // 删除之前的
            scene.remove(curPart);
            //重新加载，并且更新curPartName
            loadLocalEddy(partName);
            curPartName = partName;
        }
    }
}

function loadLocalEddy(partName){
    var promise = new Promise(function(resolve, reject) {
        var vtk_path = ("./resources/local_vtk_folder/".concat(partName,'.vtk'))
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
            console.log(partName, "加载完毕");

            local_models.push(tube);

            scene.add(tube);

            curPart = tube;

            resolve(partName);
        });
    });
    promise.then(()=>{
        // var model = findModel2(name);
        // console.log(name, "加载完毕！");
        return ;
    })

}


// 根据模型名从数组中找到模型
function findModel2(name){
    for(let i =0; i<local_models.length; i++){
        if(local_models[i].name==name){
            return local_models[i];
        }
    }
    return undefined;   // 没有找到
}

// 计算涡旋属于哪一个part
function choosePart(px, py){
    if(py-px>125)  // 左上角
        return 1;
    else if(py-px<-125)  // 右下角
        return 2;
    else return 3;  // 中央
}



function animate() {
    requestAnimationFrame( animate );

    // 监测鼠标点击
    if(tarArr[0]!= undefined && updateSign){  // 如果涡旋下标tarArr[0]不为空，并且收到更新信号
        updateSign = false;  // 立刻消除更新信号

        showSpecifiedArea(tarArr);
    }
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}

function setRenderSize() {
    renderWidth = 0.5*window.innerWidth, renderHeight = 0.6*window.innerHeight;
}