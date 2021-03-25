var container = document.getElementById('container');

var nodes = [
    { id: 1, label: "Node 1", value:1},
    { id: 2, label: "Node 2", value:2},
    { id: 3, label: "Node 3", value:3},
    { id: 4, label: "Node 4", value:4},
    { id: 5, label: "Node 5", value:5}
];

var edges = [
    { from: 1, to: 3, color:{opacity: 0.1,} },
    { from: 1, to: 2, color:{opacity: 0.1,} },
    { from: 2, to: 4, color:{opacity: 0.1,} },
    { from: 2, to: 5, color:{opacity: 0.1,} },
    { from: 3, to: 3, color:{opacity: 0.1,} }
];

var data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
};
var options = {
    autoResize:false,
    nodes:{
        shape:'circle',
        scaling: {
            min: 1,
            max: 5,
            label: {
                enabled: true,
                min: 14,
                max: 30,
                maxVisible: 30,
                drawThreshold: 5
            },
            customScalingFunction: function (min,max,total,value) {
              if (max === min) {
                return 0.5;
              }
              else {
                let scale = 1 / (max - min);
                return Math.max(0,(value - min)*scale);
              }
            }
        },
    },
    edges:{
        arrows:{
            to: {
                enabled: true,
                scaleFactor: 1,
                type: 'arrow',
            },
        },
    },
    layout:{
        hierarchical:{
            direction: 'LR',
            sortMethod: 'directed',
            shakeTowards: 'roots',  // roots, leaves
        },
    },
};

var network = new vis.Network(container, data, options);



network.on("click",function(params){//绑定点击事件
    if(params.nodes.length>0){
        var chosenTopoNodeId = params.nodes[0];
        network.focus(chosenTopoNodeId, {
            scale: 1,
        })
        data.nodes.update([{id:1, color:"#123456",}]);
        
        for(let i=0; i<edges.length; i++){
            edges[i].color.opacity = 1;
        }
        
        data.edges = new vis.DataSet(edges);

        network.body.emitter.emit("_requestRedraw");
        network.body.emitter.emit("resetPhysics");
        network.body.emitter.emit("_dataUpdated");
        network.body.emitter.emit('_dataChanged');
        network.redraw();
    }
});