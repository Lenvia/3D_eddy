/*
    整个html下的全局变量
*/

const edgeLen = 3000;  // 地形（海水、山脉）长度
const edgeWid = edgeLen;  // 地形宽度
const scaleHeight = 0.5; //缩放高度

var biasZ = 2000;  // 海底山脉向下移动（默认为2000，如果生成地形这个值会更新）
var depth_array;  // 深度数组，dpeth_array[i]表示第i层的高度
var re_depth = new Map();  // 反向映射，通过高度映射第几层


var selected_pos = undefined;  // 被选中的pos，在singleEddy中查询是否有合适的进行显示
// 更新信号
// 仅selected_pos不为空还不行，必须updateSign也为true才能更新，并且更新后updateSign要设置为false。
// 当主窗口再次有效点击后才能把updateSign设置为true
var updateSign = false;