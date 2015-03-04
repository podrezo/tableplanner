(function() {
  var canvas = this.__canvas = new fabric.Canvas('c',
  {
    hoverCursor: 'pointer',
    selection: false
  });

  canvas.on({
    'object:selected': function(e) {
      e.target.bringToFront();
      e.target.oldCoords = {
        left: e.target.left,
        top: e.target.top
      };
      var guest = e.target.model.value;
    },
    'object:moving': function(e) {
      e.target.forEachObject(function(piece) {
        piece.opacity = 0.5;
      });
    },
    'object:modified': function(e) {
      var guest = e.target.model.value;
      e.target.forEachObject(function(piece) {
        piece.opacity = 1;
      });
      // calculate what new seat to move to, if any
      var newSeat = null;
      canvas.forEachObject(function(obj) {
        if (obj === e.target) return;
        if(obj.model && obj.model.type === 'seat' && e.target.intersectsWithObject(obj))
        {
          // check to make sure that seat is not occupied
          if(_.findWhere(model.tables,{ id : obj.model.value.tableId }).guests[obj.model.value.seatId]) {
            // seat is occupied
          } else {
            newSeat = obj;
          }
          return;
        }
      });
      // mark how many animatios are done (left/right)
      var animsDone = 0;
      var animDonehandler = function() {
        animsDone++;
        if(animsDone === 2) {
          animsDone = 0;
          redrawModel();
        }
      };
      // remove the guest from their current table and move them to the new seat
      if(newSeat)
      {
        for(var i=0; i < model.tables.length; i++) {
          var table = model.tables[i];
          table.guests = _.map(table.guests, function(checkGuest) {
            if(checkGuest !== null && checkGuest === guest.id) {
              return null;
            } else {
              return checkGuest;
            }
          });
        }
        var table = _.findWhere(model.tables,{ id: newSeat.model.value.tableId });
        table.guests[newSeat.model.value.seatId] = guest.id;
        e.target.animate('left', newSeat.left, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: animDonehandler,
          easing: fabric.util.ease['easeInQuad']
        });
        e.target.animate('top', newSeat.top, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: animDonehandler,
          easing: fabric.util.ease['easeInQuad']
        });
        delete e.target.oldCoords;
        canvas.deactivateAll();
      } else {
        e.target.animate('left', e.target.oldCoords.left, {
          duration: 1000,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: animDonehandler,
          easing: fabric.util.ease['easeOutElastic']
        });
        e.target.animate('top', e.target.oldCoords.top, {
          duration: 1000,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: animDonehandler,
          easing: fabric.util.ease['easeOutElastic']
        });
        delete e.target.oldCoords;
        canvas.deactivateAll();
      }
    }
  });

  var redrawModel = function() {
    canvas.clear();
    var i=0;
    _.forEach(model.tables,function(table) {
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
        fill: 'rgb(61, 146, 201)' });
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
        var seatAngle = ((2*Math.PI)/table.guests.length)*j;
        var seatCircle = new fabric.Circle({
          radius: seatRadius, // we want it half as big as the container
          stroke: 'black',
          strokeWidth: 2,
          strokeDashArray: [2, 2],
          fill: 'white' });
        var seatLabel = new fabric.Text((j+1).toString(), {
            left: seatRadius-(baseFontSize/12),
            top: seatRadius-(baseFontSize/12),
            fill: 'black',
            fontWeight: 'bold',
            fontSize: baseFontSize/6,
            fontFamily: 'Verdana'
          });
        var seatGroup = new fabric.Group([seatCircle, seatLabel], {
            top: boxOffsetY + (boxSize/2) + seatingRadius*Math.sin(seatAngle) - seatRadius,
            left: boxOffsetX + (boxSize/2) + seatingRadius*Math.cos(seatAngle) - seatRadius,
            hasBorders: false,
            hasControls: false,
            selectable: guest,
            model: {
              type: 'seat',
              value: { tableId: table.id, seatId: j }
            }
          });
        canvas.add(seatGroup);
        var groupItems = [seatCircle];
        var guest = _.findWhere(model.guests, { id: guestId });
        if(guest)
        {
          var guestCircle = new fabric.Circle({
            radius: seatRadius, // we want it half as big as the container
            stroke: 'black',
            strokeWidth: 2,
            fill: 'rgb(176, 202, 219)' });
          var guestLabel = new fabric.Text(guest.name, {
            top: seatRadius*2,
            fill: 'black',
            fontWeight: 'bold',
            fontSize: baseFontSize/7,
            fontFamily: 'Verdana'
          });
          var guestSeatLabel = new fabric.Text((j+1).toString(), {
              left: seatRadius-(baseFontSize/12),
              top: seatRadius-(baseFontSize/12),
              fill: 'black',
              fontWeight: 'bold',
              fontSize: baseFontSize/6,
              fontFamily: 'Verdana'
            });
          var guestGroup = new fabric.Group([guestCircle, guestLabel, guestSeatLabel], {
            top: boxOffsetY + (boxSize/2) + seatingRadius*Math.sin(seatAngle) - seatRadius,
            left: boxOffsetX + (boxSize/2) + seatingRadius*Math.cos(seatAngle) - seatRadius,
            hasBorders: false,
            hasControls: false,
            selectable: guest,
            model: {
              type: 'guest',
              value: guest
            }
          });
          guestGroup.on('mouse:down', function(g) {
            console.log(g);
          });
          guestGroup.on('mouse:up', function(g) {
            console.log(g);
          });
          canvas.add(guestGroup);
        }
        j++;
        //end guest drawing
      });

      i++;
      // end table drawing
    })
  };
  redrawModel();
})();
