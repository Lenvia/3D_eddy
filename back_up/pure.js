import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { VTKLoader } from './VTKLoader2.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

// import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js'
// import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js'
// import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js'

THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上
var scene = new THREE.Scene();

var container, camera, renderer, controls, stats;


loadVTK();

//辅助坐标系
var axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

//环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);


init();




function init(){
    container = document.getElementById( 'container' );
    container.innerHTML = "";

    /**
     * 相机设置
     */
    var width = window.innerWidth; //窗口宽度
    var height = window.innerHeight; //窗口高度
    var k = width / height; //窗口宽高比
    var s = 1; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
    camera.position.set(100, 150, 100); //设置相机位置
    camera.lookAt(scene.position); //设置相机方向(指向的场景对象)

    camera.position.y = 10;
    camera.position.z = 10;
    camera.position.x = 10;

    /**
     * 创建渲染器对象
     */
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);//设置渲染区域尺寸
    // renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
    document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener('change', render);//监听鼠标、键盘事件

    container.appendChild( renderer.domElement );
    stats = new Stats();
    container.appendChild( stats.dom );
}



function animate(){
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}

