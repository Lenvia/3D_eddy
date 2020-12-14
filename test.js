// $.get("./OW_array/test.txt", function(data) {
//     var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
//     // console.log(items);

//     var arr = new Array(2);
//     for (var i = 0; i < arr.length; i++) {
//         arr[i] = new Array(2);
//         for (var j = 0; j < arr[i].length; j++) {
//             arr[i][j] = new Array(3);
//             for (var k = 0; k<arr[i][j].length; k++){
//                 arr[i][j][k] = items[i][j*arr[i][j].length+k];
//                 // console.log(items[i*2][k])
//             }
//         }
//     }

//     console.log(arr);
// });


var path = ("./OW_array/".concat("OW_", String(0), ".txt"));

$.get(path, function(data) {
    // 加载OW数组
    var items = data.split(/\r?\n/).map( pair => pair.split(/\s+/).map(Number) );
    console.log(items);

    var arr = new Array(500);
    for (var i = 0; i < arr.length; i++) {
        arr[i] = new Array(500);
        for (var j = 0; j < arr[i].length; j++) {
            arr[i][j] = new Array(50);
            for (var k = 0; k<arr[i][j].length; k++){
                arr[i][j][k] = items[i][j*arr[i][j].length+k];
            }
        }
    }

    console.log(arr);
});