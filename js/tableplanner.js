(function() {
  var canvas = this.__canvas = new fabric.Canvas('c',
  {
    hoverCursor: 'pointer',
    selection: false
  });

  canvas.on({
    'object:moving': function(e) {
      e.target.bringToFront();
      e.target.forEachObject(function(piece) {
        piece.opacity = 0.5;
      });
    },
    'object:modified': function(e) {
      e.target.forEachObject(function(piece) {
        piece.opacity = 1;
      });
    }
  });

  var i=0;
  window._.forEach(testData.tables,function(table) {
    // start table drawing
    var table
      , tableLabel
      , boxSize = 300
      , boxOffsetX = boxSize * i
      , boxOffsetY = 0
      , baseFontSize = 72
      , tableRadius = boxSize/4 // half as big as the container
      , seatingRadius = (3*boxSize/8) // 3/4 of the container
      , seatRadius = boxSize/16;
    /* 'size' reflects the size, in pixels, of the entire shebang
     * */
    var tableOutline = new fabric.Rect({
      top: 0, left: boxOffsetX,
      width: boxSize,
      height: boxSize,
      fill: 'ivory',
      stroke: 'gray' });
    var seatingOutline = new fabric.Circle({
        top: boxOffsetY + (boxSize-seatingRadius*2) / 2,
        left: boxOffsetX + (boxSize-seatingRadius*2) / 2,
        radius: seatingRadius,
        stroke: 'blue',
        fill: 'ivory' });
    var tableCircle = new fabric.Circle({
      top: boxOffsetY + (boxSize-(tableRadius*2))/2,
      left: boxOffsetX + (boxSize-(tableRadius*2))/2,
      radius: boxSize/4,
      stroke: 'black',
      strokeWidth: 5,
      hasControls: false,
      hasBorders: true,
      fill: 'ivory' });
    var tableLabel = new fabric.Text(table.id.toString(),
      { top: boxOffsetY + (boxSize/2) - (baseFontSize/1.5), // TODO Magic 1.5
        left: boxOffsetX + (boxSize/2) - (baseFontSize/4), // TODO Magic 4
        fill: 'black',
        fontFamily: 'Verdana',
        fontSize: baseFontSize });
    var tableGroup = new fabric.Group([
      //tableOutline,
      //seatingOutline,
      tableCircle,
      tableLabel
    ], {
      left: boxOffsetX,
      top: boxOffsetY,
      width: boxSize,
      height: boxSize,
      selectable: false
    });
    canvas.add(tableGroup);

    var j=0;
    _.forEach(table.guests,function(guestId) {
      // start guest drawing
      var personAngle = ((2*Math.PI)/table.guests.length)*j;
      var guest = _.findWhere(testData.guests, { id: guestId });
      var guestCircle = new fabric.Circle({
        radius: seatRadius, // we want it half as big as the container
        stroke: 'black',
        strokeWidth: 2,
        fill: guest ? 'green' : 'gray' });
      var groupItems = [guestCircle];
      if(guest)
      {
        var guestLabel = new fabric.Text(guest.name, {
          top: seatRadius*2,
          fill: 'black',
          fontWeight: 'bold',
          fontSize: baseFontSize/7,
          fontFamily: 'Verdana'
        });
        groupItems.push(guestLabel);
      }
      var guestGroup = new fabric.Group(groupItems, {
        top: boxOffsetY + (boxSize/2) + seatingRadius*Math.sin(personAngle) - seatRadius,
        left: boxOffsetX + (boxSize/2) + seatingRadius*Math.cos(personAngle) - seatRadius
      });
      canvas.add(guestGroup);

      j++;
      //end guest drawing
    });

    tableCircle.on('selected', function() {
      console.log('table ' + table.id.toString() + ' is selected');
    });

    i++;
    // end table drawing
  })
})();
