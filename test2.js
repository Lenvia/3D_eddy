import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { VTKLoader } from './VTKLoader3.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';
import { LineSegments2 } from './node_modules/three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from './node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import { GeometryUtils } from './node_modules/three/examples/jsm/utils/GeometryUtils.js';

import { BufferGeometryUtils } from './node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

// import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js'
// import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js'
// import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js'

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

//环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
// var ambient = new THREE.AmbientLight(0xffffff);
// scene.add(ambient);


init();
animate();

function demo(){
    var promise1 = new Promise((resolve, reject)=>{
        // 加载一天的形状
        var vtk_path = ("./20.vtk");
        var loader = new VTKLoader();
        console.log("loading", vtk_path);
        loader.load( vtk_path, function ( temp_geometry ) {  // 异步加载
            
            temp_geometry.translate(-0.5, -0.5, 0);

            // 不应该翻下去！！！！！！！！！！ 而是z值变负
            var positions = temp_geometry.attributes.position.array;
            var colors;
            // 改变顶点高度值


            temp_geometry.scale(100, 100, 100);

            var sectionNums = temp_geometry.attributes.sectionNum.array;
            var startNums = temp_geometry.attributes.startNum.array;

            // 转化为无索引格式，用来分组
            temp_geometry = temp_geometry.toNonIndexed();

            
            positions = temp_geometry.attributes.position.array;
            colors = temp_geometry.attributes.color.array;


            var geometry = new LineSegmentsGeometry();
            // geometry.attributes.position= temp_geometry.attributes.position;
            geometry.setPositions(positions);
            

            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
            geometry.setAttribute( 'sectionNum', new THREE.Float32BufferAttribute( sectionNums, 1 ) );
            geometry.setAttribute( 'startNum', new THREE.Float32BufferAttribute( startNums, 1 ) );
            // 这个count具体我不知道是啥，对于position.count可以理解为点的个数，且position.length正好是count的三倍
            geometry.attributes.sectionNum.count = geometry.attributes.sectionNum.array.length;
            geometry.attributes.startNum.count = geometry.attributes.startNum.array.length;


            matLine1 = new LineMaterial( {

                color: 0x123456,
                linewidth: 1, // in pixels
                vertexColors: false,
                //resolution:  // to be set by renderer, eventually
                dashed: false
        
            } );


            var vertexNum = geometry.attributes.color.count;
            
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

               let material = new LineMaterial({
                   vertexColors: false,  // 千万不能设置为true！！！！血的教训
                   color: 0xffffff,
                   transparent: true, // 可定义透明度
                   opacity: 1,
                   depthWrite: false,
                   linewidth: 3, // in pixels
               });
               mats.push(material);
            }
            var linesG = new Line2(geometry, matLine1);
            // var linesG = new Line2(geometry, mats);
            scene.add(linesG);
            curLine = linesG;

            console.log(curLine);

            resolve();
        });
        
    })


}

function demo2(){
    var promise1 = new Promise((resolve, reject)=>{
        // 加载一天的形状
        var vtk_path = ("./100.vtk");
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

            let material = new THREE.MeshLambertMaterial({
                transparent: true, // 可定义透明度
                opacity: 1,
                depthWrite: false,
                // vertexColors: true,
                color: "red", 
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

function createLine2(){
    var positions = [];
    const colors = [];
    const points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );

    // console.log(points);

    const spline = new THREE.CatmullRomCurve3( points );

    // console.log(spline);

    const divisions = Math.round( 12 * points.length );
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for ( let i = 0, l = divisions; i < l; i ++ ) {

        const t = i / l;

        spline.getPoint( t, point );
        positions.push( point.x, point.y, point.z );

        color.setHSL( t, 1.0, 0.5 );
        colors.push( color.r, color.g, color.b );

    }


    // Line2 ( LineGeometry, LineMaterial )

    const geometry = new LineSegmentsGeometry();
    // console.log(geometry);

    console.log(positions);
    console.log(colors);
    console.log(geometry.index);

    geometry.setPositions( positions );
    geometry.setColors( colors );



    matLine = new LineMaterial( {

        color: 0xffffff,
        linewidth: 5, // in pixels
        vertexColors: true,
        //resolution:  // to be set by renderer, eventually
        dashed: false

    } );

    var line = new Line2( geometry, matLine );
    // line.computeLineDistances();
    // line.scale.set( 1, 1, 1 );
    scene.add( line );
    console.log(line);
}


function init(){
    container = document.getElementById( 'container' );
    container.innerHTML = "";


    // createLine2();
    
    // demo();
    demo2();

    /**
     * 相机设置
     */
    var width = window.innerWidth; //窗口宽度
    var height = window.innerHeight; //窗口高度
    var k = width / height; //窗口宽高比
    var s = 100; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
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


function Solution(){
    if(curLine!=undefined){
        for(let i=0; i<curLine.geometry.groups.length; i++){
            curLine.material[i].resolution.set( window.innerWidth, window.innerHeight );
        }
        
    }
}