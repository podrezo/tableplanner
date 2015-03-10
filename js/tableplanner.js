'use strict';
var model = null;

(function() {

	// helper functions
	function tableIndexFromCoords(x, y)
	{
    var tableOffset = Math.floor(x / boxSize) + (Math.floor( y / boxSize ) * boxesPerRow);
    return tableOffset;
	}

	var canvasWidth
    , canvasHeight
    , largerDimension
    , boxSize
    , boxesPerRow;

	function rescale()
	{
		// "How to best fit N squares into a x*y grid" http://math.stackexchange.com/questions/466198/algorithm-to-get-the-maximum-size-of-n-squares-that-fit-into-a-rectangle-with-a
		canvasWidth = canvas.getWidth();
		canvasHeight = canvas.getHeight();
		largerDimension = Math.max(canvasWidth,canvasHeight);
		boxSize = largerDimension / Math.ceil(largerDimension / Math.floor(Math.sqrt(canvasWidth*canvasHeight/model.tables.length)));
		boxesPerRow = Math.floor(canvasWidth/boxSize);
	}

	// initialize canvas
	var canvas = new fabric.Canvas('c',
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
			var newSeat = null
			  , swapGuest = null
		      , checkTableId = tableIndexFromCoords(e.target.left, e.target.top) // reduce search space by knowing what table to check
		      , checkTable = model.tables[checkTableId];
		    _.forEach(model.tables[checkTableId]._seats, function(obj) {
		        if(obj.model && obj.model.type === 'seat' && e.target.intersectsWithObject(obj))
				{
					// can't swap with self
					if(obj.model.value.tableId === guest.seat.tableId && obj.model.value.seatId === guest.seat.seatId)
					{
						return;
					}
					// set swapGuest to the guest currently in the seat, otherwise it will be null
					swapGuest = _.findWhere(model.guests, { id : model.tables[checkTableId].guests[obj.model.value.seatId] });
					// set the new seat we want to move to
					newSeat = obj;
					return;
				}
		    });
			// mark how many animations are done (left/right)
			var animsDone = 0;
			var totalAnims = swapGuest ? 4 : 2; // x & y anim, twice if swapping
			var animDonehandler = function() {
				animsDone++;
				if(animsDone === totalAnims) {
					e.target.selectable = true;
					if(swapGuest) {
						swapGuest._entity.selectable = true;
					}
				}
			};
			// make the guest not movable while it is being animated
			e.target.selectable = false;
			// remove the guest from their current table and move them to the new seat
			if(newSeat)
			{
				var oldTable = _.findWhere(model.tables,{ id: guest.seat.tableId });
				oldTable.guests[guest.seat.seatId] = null;
				if(swapGuest)
				{
					swapGuest._entity.selectable = false;
					swapGuest.seat = guest.seat;
					var swapTable = _.findWhere(model.tables,{ id: swapGuest.seat.tableId })
					  , swapSeat = swapTable._seats[swapGuest.seat.seatId];
					swapTable.guests[swapGuest.seat.seatId] = swapGuest.id;
					if(swapGuest._entity.left !== swapSeat.left) {
						swapGuest._entity.animate('left', swapSeat.left, {
							duration: 1000,
							onChange: canvas.renderAll.bind(canvas),
							onComplete: animDonehandler,
							easing: fabric.util.ease['easeOutElastic']
						});
					} else {
						animsDone++;
					}
					if(swapGuest._entity.top !== swapSeat.top) {
						swapGuest._entity.animate('top', swapSeat.top, {
							duration: 1000,
							onChange: canvas.renderAll.bind(canvas),
							onComplete: animDonehandler,
							easing: fabric.util.ease['easeOutElastic']
						});
					} else {
						animsDone++;
					}
				}
				guest.seat = newSeat.model.value; // newSeat is the physical entity, not the model, but we have the handle for it
				var table = _.findWhere(model.tables,{ id: newSeat.model.value.tableId });
				table.guests[newSeat.model.value.seatId] = guest.id;
				if(e.target.left !== newSeat.left) {
					e.target.animate('left', newSeat.left, {
						duration: 200,
						onChange: canvas.renderAll.bind(canvas),
						onComplete: animDonehandler,
						easing: fabric.util.ease['easeInQuad']
					});
				} else {
					animsDone++;
				}
				if(e.target.top !== newSeat.top) {
					e.target.animate('top', newSeat.top, {
						duration: 200,
						onChange: canvas.renderAll.bind(canvas),
						onComplete: animDonehandler,
						easing: fabric.util.ease['easeInQuad']
					});
				} else {
					animsDone++;
				}
				delete e.target.oldCoords;
				canvas.deactivateAll();
			} else {
				if(e.target.left !== e.target.oldCoords.left) {
					e.target.animate('left', e.target.oldCoords.left, {
						duration: 1000,
						onChange: canvas.renderAll.bind(canvas),
						onComplete: animDonehandler,
						easing: fabric.util.ease['easeOutElastic']
					});
				} else {
					animsDone++;
				}
				if(e.target.top !== e.target.oldCoords.top) {
					e.target.animate('top', e.target.oldCoords.top, {
						duration: 1000,
						onChange: canvas.renderAll.bind(canvas),
						onComplete: animDonehandler,
						easing: fabric.util.ease['easeOutElastic']
					});
				} else {
					animsDone++;
				}
				delete e.target.oldCoords;
				canvas.deactivateAll();
			}
		}
	});

	var redrawModel = function() {
		// set up canvas basics
		canvas.clear();
		canvas.setHeight($("#sidebar").height());
		canvas.setWidth($("#canvascontainer").width());

		rescale();

		var i=0;
		_.forEach(model.tables,function(table) {
			// start table drawing
			var table
				, tableLabel
				, boxOffsetX = boxSize * (i % boxesPerRow)
				, boxOffsetY = Math.floor(i / boxesPerRow) * boxSize
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
			table._entity = tableGroup;
			canvas.add(tableGroup);
			table._seats = [];
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
        		table._seats.push(seatGroup);
				canvas.add(seatGroup);
				var groupItems = [seatCircle];
				var guest = _.findWhere(model.guests, { id: guestId });
				if(guest)
				{
					// update where the guest is sitting
					guest.seat = { tableId: table.id, seatId: j };
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
					var guestGroup = new fabric.Group([guestCircle, guestLabel], {
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
          			guest._entity = guestGroup;
					canvas.add(guestGroup);
				}
				j++;
				//end guest drawing
			});

			i++;
			// end table drawing
		})
	};

	window.addEventListener('resize', redrawModel, false);

	var loadData = function() {
		model = localStorage.getItem('model');
		if(model)
		{
			model = JSON.parse(model);
			redrawModel();
		} else {
			resetData();
		}

	};

	var resetData = function() {
		model = JSON.parse(JSON.stringify(sampleData)); // copy sample data
		redrawModel();
	};

	$('#btnSave').click(function() {
		localStorage.setItem('model', JSON.stringify(model));
	});

	$('#btnReset').click(resetData);

	$('#btnLoad').click(loadData);

	loadData();

})();
