import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { VTKLoader } from './VTKLoader4.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';
import { LineSegments2 } from './node_modules/three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from './node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import { GeometryUtils } from './node_modules/three/examples/jsm/utils/GeometryUtils.js';

import { BufferGeometryUtils } from './node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfd1e5 );  // 浅蓝色
var container, camera, renderer, controls, stats;

var matLine;
var matLine1;
var material1;
var linesG;
var curLine;

//辅助坐标系
var axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

// 环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);


init();
animate();

function demo() {
    var stripVerts = new Float32Array([
        -5,0,-5,
        -4,3,-5,
        -3,0,-5,
        -2,3,-5,
        -1,0,-5,
        0,3,-5,
        1,0,-5,
        2,3,-5,
        3,0,-5,
        4,3,-5,
        5,0,-5,
    ]);
    var stripGeometry = new THREE.BufferGeometry(stripVerts);
    stripGeometry.setAttribute('position',new THREE.BufferAttribute(stripVerts, 3));
    stripGeometry.computeVertexNormals()
    stripGeometry.normalizeNormals()

    stripGeometry = BufferGeometryUtils.toTrianglesDrawMode(stripGeometry, THREE.TriangleStripDrawMode);

    var stripMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        flatShading: true,
        // emissive: new THREE.Color( 0x00ff00 ),
    })

    var stripMesh = new THREE.Mesh(stripGeometry, stripMaterial);
    scene.add(stripMesh);
    console.log(stripMesh);
    
}

// 加载vtk流管（含有threhold）
function demo2(){
    var promise1 = new Promise((resolve, reject)=>{
        // 加载一天的形状
        var vtk_path = ("./resources/local_vtk_folder/0_1.vtk");
        var loader = new VTKLoader();
        console.log("loading", vtk_path);
        loader.load( vtk_path, function ( temp_geometry ) {  // 异步加载
            
            temp_geometry.translate(-0.5, -0.5, 0);

            var positions = temp_geometry.attributes.position.array;
                // 改变顶点高度值
                
                for ( let j = 0;  j < positions.length; j += 3 ) {
                    positions[j+2] = -positions[j+2];
                }


            // 改变顶点高度值
            temp_geometry.scale(100, 100, 100);

            temp_geometry.computeVertexNormals();
            temp_geometry.normalizeNormals();


            let material = new THREE.MeshLambertMaterial({
                transparent: true, // 可定义透明度
                opacity: 0.6,
                depthWrite: false,
                side: THREE.DoubleSide,
                flatShading: true,
                // vertexColors: true,
                color: 0x576eb8, 
            });

            // 不用加这一句
            // temp_geometry = BufferGeometryUtils.toTrianglesDrawMode(temp_geometry, THREE.TriangleStripDrawMode);

            var linesG = new THREE.Mesh(temp_geometry, material);

            // linesG.drawMode = THREE.TriangleStripDrawMode;

            scene.add(linesG);
            curLine = linesG;

            console.log(curLine);

            resolve();
        });
        
    })


}

function demo3() {
    var promise1 = new Promise((resolve, reject)=>{
        // 加载一天的形状
        var vtk_path = ("./temo.vtk");
        var loader = new VTKLoader();
        console.log("loading", vtk_path);
        loader.load( vtk_path, function ( temp_geometry ) {  // 异步加载
            
            temp_geometry.translate(-0.5, -0.5, 0);

            var positions = temp_geometry.attributes.position.array;
                // 改变顶点高度值
                
                for ( let j = 0;  j < positions.length; j += 3 ) {
                    positions[j+2] = -positions[j+2];
                }


            // 改变顶点高度值
            temp_geometry.scale(100, 100, 100);

            temp_geometry.computeVertexNormals();
            temp_geometry.normalizeNormals();


            let material = new THREE.LineBasicMaterial({
                // vertexColors: false,  // 千万不能设置为true！！！！血的教训
                transparent: true, // 可定义透明度
                opacity: 1,
                depthWrite: false, 
            });

            // 不用加这一句
            // temp_geometry = BufferGeometryUtils.toTrianglesDrawMode(temp_geometry, THREE.TriangleStripDrawMode);

            var linesG = new THREE.LineSegments(temp_geometry, material);

            scene.add(linesG);
            curLine = linesG;

            console.log(curLine);

            resolve();
        });
        
    })
    
}

function demoStream(){
    // 加载一步的形状
    var d = i;
    var vtk_path = ("./streamline29.vtk");
    var loader = new VTKLoader();
    console.log("loading", vtk_path);
    loader.load( vtk_path, function ( geometry ) {  // 异步加载
        
        geometry.translate(-0.5, -0.5, 0);

        // 不应该翻下去！！！！！！！！！！ 而是z值变负
        var positions = geometry.attributes.position.array;
        // 改变顶点高度值
        for ( let j = 0;  j < positions.length; j += 3 ) {
            var realLayer = positions[j+2]*50;
            var apprLayer = Math.round(realLayer);
            // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
            positions[j+2] = -depth_array[apprLayer];
        }
        
        geometry.scale(edgeLen, edgeWid, scaleHeight);

        let material = new THREE.LineBasicMaterial({
            vertexColors: false,
            transparent: true, // 可定义透明度
            opacity: 0.7,
            depthWrite: false, 
        });
        
        var linesG = new THREE.LineSegments(geometry, material);

        scene.add(linesG);
    });
}

function demo4(){
    // 加载一步的形状
    var d = i;
    var vtk_path = ("./tube2829.vtk");
    var loader = new VTKLoader();
    console.log("loading", vtk_path);
    loader.load( vtk_path, function ( geometry ) {  // 异步加载
        
        geometry.translate(-0.5, -0.5, 0);

        // 不应该翻下去！！！！！！！！！！ 而是z值变负
        var positions = geometry.attributes.position.array;
        // 改变顶点高度值
        var biasZ = [];
        
        var tubeHeightFactor = 100;
        for ( let j = 0;  j < positions.length; j += 3 ) {
            var realLayer = positions[j+2]*50;
            var apprLayer = Math.round(realLayer);
            biasZ.push(realLayer-apprLayer);

            // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
            positions[j+2] = -depth_array[apprLayer]+biasZ[j/3]*tubeHeightFactor;
        }
        
        geometry.scale(edgeLen, edgeWid, scaleHeight);

        let material = new THREE.LineBasicMaterial({
            vertexColors: false,
            color: 0xDC143C,
            transparent: true, // 可定义透明度
            opacity: 0.3,
            depthWrite: false, 
        });
        
        var linesG = new THREE.LineSegments(geometry, material);

        scene.add(linesG);
    });
}

function demo5(){
    // 加载一步的形状
    var d = i;
    var vtk_path = ("./glyph2829.vtk");
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

        let material = new THREE.MeshBasicMaterial({
            vertexColors: false,
            color: 0x0000ff,
            transparent: true, // 可定义透明度
            opacity: 1,
            depthWrite: false, 
        });
        
        var linesG = new THREE.Mesh(geometry, material);

        scene.add(linesG);
    });
}


function init(){
    container = document.getElementById( 'container' );
    container.innerHTML = "";


    // demo2();
    // demo();
    // demo3();
    demo4();
    demo5();
    // demoStream();
    
    /**
     * 相机设置
     */
    var width = window.innerWidth; //窗口宽度
    var height = window.innerHeight; //窗口高度
    var k = width / height; //窗口宽高比
    var s = 1000; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 10000);
    camera.position.set(200, 200, 300); //设置相机位置
    camera.lookAt(scene.position); //设置相机方向(指向的场景对象)


    /**
     * 创建渲染器对象
     */
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);//设置渲染区域尺寸
    // renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
    document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener('change', render);//监听鼠标、键盘事件


    // console.log(container);
    // var pro = document.getElementById('audio-player-container');
    // container.appendChild(pro);


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


// 进度条
// $('#draggable-point').draggable({
//     axis: 'x',
//     containment: "#audio-progress"
// });

// $('#draggable-point').draggable({
//     drag: function() {
//         var offset = $(this).offset();
//         var xPos = (100 * parseFloat($(this).css("left"))) / (parseFloat($(this).parent().css("width"))) + "%";

//         $('#audio-progress-bar').css({
//         'width': xPos
//         });
//     }
// });