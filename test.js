import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { VTKLoader } from './VTKLoader2.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

// import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js'
// import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js'
// import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js'

THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfd1e5 );  // 浅蓝色
var container, camera, renderer, controls, stats;


//辅助坐标系
var axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

//环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
// var ambient = new THREE.AmbientLight(0xffffff);
// scene.add(ambient);


init();

function testCreate(){
    const geometry = new THREE.PlaneBufferGeometry( 3, 3, 3-1, 3-1);
    const positions = geometry.attributes.position.array;

    // PlaneBufferGeometry 的顶点排列是 先动x再动y，x从小到大，y从大到小！！！！！！！！！
    // 改变顶点高度值
    // for ( let i = 0, j = 0, l = positions.length; i < l; i ++, j += 3 ) {
    //     positions[j+2] = 10;
    // }

    positions[4*3+2] = 10;

    var colors = [];
    for ( let i = 0; i<positions.length; i++) {
        colors.push(Math.random());
    }

    for(let i =2; i<positions.length; i+=3){
        if(positions[i]==0){
            colors[i] = 0;
            colors[i-1] = 0;
            colors[i-2] = 0;
        }
    }

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );



    // 不执行computeVertexNormals，没有顶点法向量数据
    geometry.computeFaceNormals(); // needed for helper

    const material = new THREE.MeshBasicMaterial( { 
        // map: texture,
        // color: 0x000000,
        transparent: true,
        opacity: 0.5,  // 纹理透明度 
        depthWrite: false,
        vertexColors: true,
        side: THREE.DoubleSide,
    } );

    var mesh = new THREE.Mesh( geometry, material);
    scene.add( mesh );
    console.log(mesh);

}

function createLand(){
    // 生成陆地高度数据
    var path = ("./whole_attributes_txt_file/".concat("depth.txt"));  // 默认盐都为0的地方都是陆地
    var arr = [];
    var promise1 = new Promise(function(resolve, reject) {
        $.get(path, function(data) {
            var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
            // console.log(items);

            arr = items;
            resolve(1);
        });
    });

    promise1.then(()=>{
        var geometry = new THREE.BufferGeometry();
        var indices = [];
        var positions = [];

        var rowNum, colNum;
        // rowNum = arr.length; colNum = arr[0].length;
        rowNum = 500; colNum = 500;

        for(let i=0; i<rowNum; i++){
            for(let j=0; j<colNum; j++){
                positions.push(i,j,arr[i][j]);

                if(arr[i][j]>0){
                    if(i+1<rowNum && j+1<colNum && arr[i+1][j]!=0 && arr[i][j+1]!=0){
                        // 与下边和右边顶点形成三角形
                        indices.push(i*rowNum+j, (i+1)*rowNum+j, i*rowNum+j+1);
                    }

                    if(i-1>=0 && j-1>=0 && arr[i-1][j]!=0 && arr[i][j-1]!=0){
                        // 与上边和左边顶点形成三角形
                        indices.push(i*rowNum+j, (i-1)*rowNum+j, i*rowNum+j-1);
                    }
                }
            }
        }
        geometry.setIndex( indices );

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    
        var mesh = new THREE.Mesh( geometry, material);
        scene.add( mesh );
        console.log(mesh);
    });
}


function init(){
    container = document.getElementById( 'container' );
    container.innerHTML = "";

    createLand();
    /**
     * 相机设置
     */
    var width = window.innerWidth; //窗口宽度
    var height = window.innerHeight; //窗口高度
    var k = width / height; //窗口宽高比
    var s = 50; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
    camera.position.set(100, 150, 1000); //设置相机位置
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

