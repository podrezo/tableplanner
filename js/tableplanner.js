(function() {
  var canvas = this.__canvas = new fabric.StaticCanvas('c');

  var i=0;
  window._.forEach(testData.tables,function(table) {
    var table
      , tableLabel
      , size = 250
      , middleSize = 0.5 * size;
    /* 'size' reflects the size, in pixels, of the entire shebang
     * */
    tableOutline = new fabric.Rect({ top: 0, left: size*i, width: size, height: size, fill: 'ivory', stroke: 'gray' });
    tableCircle = new fabric.Circle({ top: (size-middleSize)/2, left: (size*i)+(size-middleSize)/2, radius: middleSize/2, stroke: 'black', fill: 'white' });
    tableLabel = new fabric.Text(table.id.toString(), { top: (size-middleSize)/2+(middleSize/2), left: (size*i)+middleSize, fill: 'black' });
    tableCircle.on('selected', function() {
      console.log("table " + table.id.toString() + " is selected");
    });
    canvas.add(tableOutline, tableCircle, tableLabel);
    i++;
  })
})();
