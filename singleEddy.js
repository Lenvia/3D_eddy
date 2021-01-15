import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from './node_modules/three/examples/jsm/math/ImprovedNoise.js';
import { VTKLoader } from './VTKLoader2.js';


THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);  // 设置Z轴向上

var container, stats;  // 容器，状态监控器
var camera, controls, scene, renderer;  // 相机，控制，画面，渲染器
let mesh, texture;  // 山脉网格， 纹理
var maxH;  // 产生的山脉最大高度

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


var curLine;


init();


function init() {
    container = document.getElementById( 'container2' );
    container.innerHTML = "";

    renderer = new THREE.WebGLRenderer( { antialias: true } );  // 抗锯齿
    renderer.setPixelRatio( window.devicePixelRatio );  // 像素比
    renderer.setSize( renderWidth, renderHeight );  // 尺寸


    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0xbfd1e5 );  // 浅蓝色

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
    var eddis_info_path = ("./track/eddies.json");
    var json_data;
    $.ajax({
        url: eddis_info_path,//json文件位置
        type: "GET",//请求方式为get
        dataType: "json", //返回数据格式为json
        async: false,  // 异步设置为否
        success: function(res) { //请求成功完成后要执行的方法 
            json_data = res;
            // console.log(json_data)

            let arr = []; //promise返回值的数组
            for(let i=0; i<json_data.length; i++){
                var master = json_data[i]['master'];  // 所属涡旋
                var name = json_data[i]['name'];  // 涡旋识别编号
                arr[i] = new Promise((resolve, reject)=>{
                    var vtk_path = ("./vtk_folder/".concat(master, '/vtk', name, '.vtk'))

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
                        // geometry.setAttribute( 'mOpaIndex', new THREE.Float32BufferAttribute( startNums, 1 ));
        
        
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
    })

    
    // for (let i = 0; i<2; i++){
    //     arr[i] = new Promise((resolve, reject)=>{
    //         // 加载一天的形状
    //         var d = i;
    //         var vtk_path = ("./whole_vtk_folder".concat("/vtk", d, "_1000.vtk"));
    //         var loader = new VTKLoader();
    //         console.log("loading", vtk_path);
            // loader.load( vtk_path, function ( geometry ) {  // 异步加载
                
            //     geometry.translate(-0.5, -0.5, 0);

            //     // 不应该翻下去！！！！！！！！！！ 而是z值变负
            //     var positions = geometry.attributes.position.array;
            //     // 改变顶点高度值
                
            //     for ( let j = 0;  j < positions.length; j += 3 ) {
            //         // position[k]是0~1，先乘50并四舍五入确定层，再对应到深度数组，再取负
            //         positions[j+2] = -depth_array[Math.round(positions[j+2]*50)];
            //     }

            //     geometry.scale(edgeLen, edgeWid, scaleHeight);

            //     var sectionNums = geometry.attributes.sectionNum.array;
            //     var startNums = geometry.attributes.startNum.array;

            //     // 转化为无索引格式，用来分组
            //     geometry = geometry.toNonIndexed();

            //     geometry.attributes.sectionNum.array = sectionNums;
            //     geometry.attributes.startNum.array = startNums;
            //     // 这个count具体我不知道是啥，对于position.count可以理解为点的个数，且position.length正好是count的三倍
            //     geometry.attributes.sectionNum.count = geometry.attributes.sectionNum.array.length;
            //     geometry.attributes.startNum.count = geometry.attributes.startNum.array.length;
                
            //      // 默认初始透明度最大的下标在开头
            //     geometry.setAttribute( 'mOpaIndex', new THREE.Float32BufferAttribute( startNums, 1 ));


            //     var vertexNum = geometry.attributes.position.count;
                
            //     var opa = []; // 顶点透明度，用来改变线条透明度
            //     for (var i = 0; i<vertexNum; i++){
            //         opa.push(1);  // 默认都是1
            //     }
            //     geometry.setAttribute( 'opacity', new THREE.Float32BufferAttribute( opa, 1 ));

                
            //     var groupId;  // 组号

            //     var mats = [];

            //     for (var i =0; i<vertexNum; i+=2){
            //         groupId = i/2;
            //         geometry.addGroup(i, 2, groupId);  // 无索引形式(startIndex, count, groupId)

            //         let material = new THREE.LineBasicMaterial({
            //             // vertexColors: false,  // 千万不能设置为true！！！！血的教训
            //             transparent: true, // 可定义透明度
            //             opacity: 0,
            //             depthWrite: false, 
            //         });
            //         mats.push(material);
            //     }
            //     var linesG = new THREE.LineSegments(geometry, mats);

            //     //need update 我不知道有没有用，感觉没用
            //     linesG.geometry.colorsNeedUpdate = true;
            //     linesG.geometry.groupsNeedUpdate = true;
            //     linesG.material.needsUpdate = true;
                
            //     initLineOpacity(linesG, 0.5);  // 初始化透明度
            //     linesG.name = "day"+String(d);  // day0, day1, ...
            //     scene.add(linesG);
            //     linesG.visible = false;
            //     resolve(i);
            // });
            
    //     })
    // }
    // // 当所有加载都完成之后，再隐藏“等待进度条”
    // Promise.all(arr).then((res)=>{
    //     console.log("模型加载完毕");
    // })
}


/*
    转换后的xyz到数组i,j,k的映射
*/
function xyz2ijk(x, y, z){
    var orix = x/edgeLen + 0.5;
    var oriy = y/edgeWid + 0.5;
    var oriz = -z/scaleHeight;

    // console.log(orix, oriy, oriz);

    var i = Math.floor(orix/0.002);
    var j = Math.floor(oriy/0.002);
    var k = re_depth.get(oriz);
    // console.log(oriz);

    return new Array(i, j, k);
}


function animate() {
    requestAnimationFrame( animate );

    if(selected_pos!= undefined && updateSign){
        console.log(selected_pos);
        updateSign = false;
    }
    render();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}
