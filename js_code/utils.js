// utils.js 对 global_definer.js 和 echarts_preloader.js 产生依赖！

/**
 * 通用工具
 */

// 数组去重
function dedupe(array){
    return Array.from(new Set(array));
    //这里的 Array.from（）方法是将两类对象转为真正的数组：类似数组的对象和可遍历的对象（包括es6新增的数据结构Set和Map）
}


// 获得DOM的style
function getStyle(obj,attr){
    if(obj.currentStyle){//兼容IE
        return obj.currentStyle[attr];
    }else{
        return getComputedStyle(obj,false)[attr];
    }
}

//numberMillis 毫秒
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}

function deleteModel(mod){
    if(mod==undefined)
        return ;
    mod.geometry.dispose(); //删除几何体
    mod.material.dispose(); //删除材质
}



/*
    定制函数
*/

// 暂时先用最简单的点距（panel坐标中）
function getDisdance(px1, py1, px2, py2){
    return Math.pow((px1-px2), 2) + Math.pow((py1-py2), 2);
}

// 找出当前位置最近的涡旋
function getNearestEddy(px, py){
    var minDis = 250000; // 最大不会超过250000的
    var minIndex = undefined;
    var tarCpx, tarCpy;

    if(currentMainStep<0)
        return;
    var info = eddyFeature['info'][currentMainStep];
    for(let i=0; i<info.length; i++){

        var px2 = info[i][0];
        var py2 = info[i][1];
        var currentDis = getDisdance(px, py, px2, py2);
        // console.log(i, currentDis);

        if(minDis>currentDis){
            minDis = currentDis;
            minIndex = i;
            tarCpx = px2;
            tarCpy = py2;
        }
    }
    return new Array(minIndex, tarCpx, tarCpy);
}

// // 对于第d天的index下标涡旋进行追踪，返回一个数组，表示下一天该涡旋的延续
// function track(d, index){
//     var stepForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
//     return stepForwardsList[index];  // 返回index下标的延续下标集合
// }

// // 追踪d天时 curList所有涡旋的延续，并将所有结果放在一个数组中，并去重
// // curList存储的都是第d天的下标
// function trackAll(curList, d){
//     var result = [];
//     var stepForwardsList = eddyFeature['forward'][d];  // 第d天所有涡旋的延续列表
//     for(let i=0; i<curList.length; i++){
//         // console.log(stepForwardsList[curList[i]]);
//         result = result.concat(stepForwardsList[curList[i]]);
//     }
//     // console.log(result);
//     return dedupe(result);
// }

// function backtrackAll(curList, d){
//     var result = [];
//     var stepBackwardsList = eddyFeature['backward'][d];
//     for(let i =0; i<curList.length; i++){
//         result = result.concat(stepBackwardsList[curList[i]]);
//     }
//     return dedupe(result);
// }



/**
 * 坐标转换函数集合！
 */

//转换后的xyz到数组i,j,k的映射
function xyz2ijk(x, y, z){
    var orix = x/edgeLen + 0.5;
    var oriy = y/edgeWid + 0.5;
    var oriz = parseFloat((-z/scaleHeight).toFixed(1));


    var i = Math.floor(orix/0.002);
    var j = Math.floor(oriy/0.002);
    var k = re_depth.get(oriz);

    if(k==undefined)
        console.log(oriz)
    // console.log(oriz);

    return new Array(i, j, k);
}

// 经度、纬度、深度转xyz
// 这里的坐标就代表三维坐标轴里的
function lll2xyz(lon, lat, level){
    var x = ((lon - 30.2072)/20 -0.5)*edgeLen;  // 20是经度跨度（下面纬度跨度 数据中也是20）
    var y = ((lat - 10.0271)/20 -0.5)*edgeWid;
    // var z = -depth_array[level];
    var z = 0;  // 还是用0吧

    return new Array(x, y, z);
}

// 传递过来的鼠标坐标mx,my 到panel中的px,py（panel大小为500*500）
// 这里mx my和在三维坐标轴里的x y含义一样
function mxy2pxy(mx, my){
    var px = (mx/edgeLen+0.5)*500;
    var py = (my/edgeWid+0.5)*500;

    console.log("mx, my:",mx, my)
    console.log("px, py:",px, py)
    return new Array(px, py);
}

// panel中的px py到坐标轴的x y
function pxy2xy(px, py){
    var x = (px/500 - 0.5)*edgeLen;
    var y = (py/500 - 0.5)*edgeWid;
    return new Array(x,y);
}