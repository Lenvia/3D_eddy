import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';

THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上
var scene = new THREE.Scene();

var container, camera, renderer, controls, stats;

var renderWidth, renderHeight;
var containerWidth, containerHeight;


const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = edgeLen;  // 地形宽度
const scaleHeight = 20*edgeLen/200000; //高度缩放倍数

var depth_array;  // 深度数组，dpeth_array[i]表示第i层的高度
var re_depth = new Map();  // 反向映射，通过高度映射第几层

// 加载深度数组
loadDepth();

//辅助坐标系
var axesHelper = new THREE.AxesHelper(3000);
scene.add(axesHelper);

var light = new THREE.AmbientLight(0xffffff);
scene.add(light);


init();





function init(){
    container = document.getElementById( 'container' );
    container.innerHTML = "";

    setRenderSize();
    /**
     * 相机设置
     */
    var width = window.innerWidth; //窗口宽度
    var height = window.innerHeight; //窗口高度
    var k = width / height; //窗口宽高比
    var s = 1; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.PerspectiveCamera( 60, renderWidth / renderHeight, 50, 20000 );
    camera.position.z = 4000;
    camera.position.x = edgeLen*0;
    camera.position.y = edgeWid*0;
    

    /**
     * 创建渲染器对象
     */
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);//设置渲染区域尺寸
    renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
    document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

    loadObj();



    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener('change', render);//监听鼠标、键盘事件

    container.appendChild( renderer.domElement );
    stats = new Stats();
    container.appendChild( stats.dom );

    animate();
}

function loadObj(){
    var object_loader = new OBJLoader();

    object_loader.load('./mesh_0.obj', function(object) {

        object.traverse( function( child ) {
            if ( child.isMesh ) child.geometry.computeVertexNormals();
        } );

        var meshObj = object.children[0];

        console.log(object);

        var positions = meshObj.geometry.attributes.position.array;
        meshObj.geometry.translate(-0.5, -0.5, 0);

        for ( let j = 0;  j < positions.length; j += 3 ) {
            
            // position[k]是0~0.1，先乘509并四舍五入确定层，再对应到深度数组
            // 这里内外都取负！！！
            positions[j+2] = -depth_array[-Math.round(positions[j+2]*10*50)];
            // console.log(positions[j+2]);
        }
        
        meshObj.geometry.scale(edgeLen, edgeWid, scaleHeight);

        // object.scale.multiplyScalar(5);
        scene.add(object);
        
    });
}


function animate(){
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}


function loadDepth(){
    var depth_path = ("./resources/depth.json");
    var json_data;
    $.ajax({
        url: depth_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) {//请求成功完成后要执行的方法 
            json_data = res;
            depth_array = json_data["depth"];

            // 反向映射
            for(let i=0; i<depth_array.length; i++){
                re_depth.set(depth_array[i], i);
            }
            // console.log(re_depth);
        }
    })
}

function setRenderSize() {
    containerWidth = String(getStyle(container, "width"));
    containerHeight = String(getStyle(container, "height"));

    containerWidth = containerWidth.slice(0, containerWidth.length-2);  // 去掉末尾的px
    containerHeight = containerHeight.slice(0, containerHeight.length-2);

    renderWidth = parseInt(containerWidth);
    renderHeight = parseInt(containerHeight);
}

// 获得DOM的style
function getStyle(obj,attr){
    if(obj.currentStyle){//兼容IE
            return obj.currentStyle[attr];
    }else{
            return getComputedStyle(obj,false)[attr];
    }
}