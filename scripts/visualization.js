function visualization(jsonName){
  
  var FIRST = 1;

  var STATE_COLOR = true;

  var color = d3.scale.linear()
  .domain([-1, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);

  var margin = {top: 20, right: 0, bottom: 0, left: 0},
  width = 960,
  height = 500 - margin.top - margin.bottom,
  formatNumber = d3.format(",d"),
  transitioning;

  var x = d3.scale.linear()
  .domain([0, width])
  .range([0, width]);

  var y = d3.scale.linear()
  .domain([0, height])
  .range([0, height]);

  var treemap = d3.layout.treemap()
  .children(function(d, depth) { return depth ? null : d._children; })
  .sort(function(a, b) { return a.value - b.value; })
  .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
  .round(false);

  var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.bottom + margin.top)
  .style("margin-left", -margin.left + "px")
  .style("margin.right", -margin.right + "px")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .style("shape-rendering", "crispEdges");

  var grandparent = svg.append("g")
  .attr("class", "grandparent");

  grandparent.append("rect")
  .attr("y", -margin.top)
  .attr("width", width)
  .attr("height", margin.top);

  grandparent.append("text")
  .attr("x", 6)
  .attr("y", 6 - margin.top)
  .attr("dy", ".75em");

  d3.json(jsonName, function(root) {
    initialize(root);
    accumulate(root);
    layout(root);
    display(root);

  function addText(d,root){
    if(d.parent || FIRST == 1){
      var i;
      FIRST = 0;
      for (i=0;i<root._children.length;i++){
        var child = root._children[i];

        var g = svg.insert("g",".grandparent").selectAll("g")
        .data(child._children)
        .enter().append("g");

        g.append("text")
        .attr("dy", ".75em")
        .text(function(d) { return d.name; })
        .call(text)
        .attr("class", "tchild")
        .style("fill-opacity", 0);
      }
    }
  }

  function initialize(root) {
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
  }

  function getColor(d){ 
    if (STATE_COLOR){
      if (d.color){
        return d.color
      }
    }
    if (d.depth == 0){
      return color(d.depth);
    }else if (d.depth == 1){
      return d.color;
    }
    else{
      return null;
    }
  }

  function outHover(d){

    var g = d3;
    var focus0 = d;
    d3.selectAll(".child")
    .style("fill-opacity", 0)

  //Father rect
  d3.selectAll(".parent")
  .style("fill-opacity", 1)

  d3.selectAll("text")
  .style("fill-opacity", 1)
  d3.selectAll(".tchild")
  .style("fill-opacity", 0)
  }

  function onHover(d){
    var focus0 = d;
    if (d.parent){
      var name = d.name;
      var padreN = d.parent.name;
      var children = d._children;
      var xchild = children[0].x;
      var ychild = children[0].y;
    }

    d3.selectAll(".child")
    .style("fill-opacity", function(d) { return d.parent.name === name ? 1 : 0; });

    d3.selectAll("rect")
    .filter(function(d){ return d === focus0})
    .style("fill-opacity", 0);

    var parents = d3.selectAll(".parent")
    .filter(function(d){ return getParent(d,children);})
    .style("fill-opacity", 0);
    d3.selectAll(".child")
    .filter(function(d){ return isTransition(d,children);})
    .style("fill-opacity", 1);
    var text = d3.selectAll(".tchild")
    .filter(function(d){ return isTransition(d,children);})
    .style("fill-opacity", 1);
    var tpar = d3.selectAll(".tparent")
    .filter(function(d){ return isTransitionParent(d,parents);})
    .style("fill-opacity", 0);
    return null
  }

  function isTransitionParent(d,parents){
    var i;
    var name1 = d.name;
    var parents0 = parents[0];
    for (i=0;i<parents0.length;i++){
      var name2 = parents0[i].__data__.name;
      if (name1 == name2){
        return d;
      }
    }
  }

  function isTransition(d,children0){
    var i;
    var name1 = d.name;
    if (d.parent){
      for (i=0;i<children0.length;i++){
        var name2 = children0[i].name;
        if (name1 === name2){
          return d;
        }
      }
    }
  }

  function getParent(d,children0){
    var j;
    var i;
    var childrenD = d._children;
    for (i=0;i<childrenD.length;i++){
      for (j = 0; j < children0.length; j++){
        var name1 = childrenD[i].name;
        var name2 = children0[j].name;
        if (name1 === name2){
          return d;
        }
      }
    }
  }

  function accumulate(d) {
    return (d._children = d.children)
    ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
    : d.value;
  }

  function layout(d) {
    if (d._children) {
      treemap.nodes({_children: d._children});
      d._children.forEach(function(c) {
        c.x = d.x + c.x * d.dx;
        c.y = d.y + c.y * d.dy;
        c.dx *= d.dx;
        c.dy *= d.dy;
        c.parent = d;
        layout(c);
      });
    }
  }

  function display(d) {
    grandparent
    .datum(d.parent)
    .on("click", transition)
    .select("text")
    .text(name(d));

    var g1 = svg.insert("g", ".grandparent")
    .datum(d)
    .attr("class", "depth");

    var g = g1.selectAll("g")
    .data(d._children)
    .enter().append("g");

    g.filter(function(d) { return d._children; })
    .classed("children", true)
    .on("mouseover", function(d){ return onHover(d);})
    .on("mouseleave",function(d){ return outHover(d);})
    .on("click", transition);

    //Son Rect
    g.selectAll(".child")
    .data(function(d) { return d._children || [d]; })
    .enter().append("rect")
    .attr("class", "child")
    .style("fill", function(d) { return getColor(d); })
    .style("fill-opacity", 0)
    .call(rect);
    
    var test = g.selectAll("text");

    //Father Rect
    g.append("rect")
    .attr("class", "parent")
    .style("fill", function(d) { return getColor(d); })
    .style("fill-opacity", 1)
    .call(rect)
    .append("title")
    .text(function(d) { return formatNumber(d.value); });

    var test1 = g.selectAll("text");
    g.append("text")
    .attr("dy", ".75em")
    .attr("class", "tparent")
    .text(function(d) { return d.name; })
    .call(text);
    
    var test2 = g.selectAll("text");
    
    addText(d,root);

    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;

      var g2 = display(d),
      t1 = g1.transition().duration(750),
      t2 = g2.transition().duration(750);

      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      svg.style("shape-rendering", null);

      svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

      var tt1 = t1.selectAll("text");
      var tt2 = t2.selectAll("text");
      t1.selectAll("text").call(text).style("fill-opacity", 0);
      t2.selectAll("text").call(text).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);
      
      t1.remove().each("end", function() {
        svg.style("shape-rendering", "crispEdges");
        transitioning = false;
      });
      d3.selectAll("text.tchild")
      .style("fill-opacity",0);

    }

    return g;
  }

  function text(text) {
    text.attr("x", function(d) { return x(d.x) + 6; })
    .attr("y", function(d) { return y(d.y) + 6; });
  }

  function rect(rect) {
    rect.attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
  }

  function name(d) {
    return d.parent
    ? name(d.parent) + "." + d.name
    : d.name;
  }
  });
}