var FifteenPazzle = (function(){
	var clickEvent = 'ontouchstart' in document ? 'touchstart' : 'mousedown';
	var STATE_READY  = 0,
		STATE_PLAY   = 1,
		STATE_FINISH = 2;
	var isSmartphone = navigator.userAgent.match(/iP(hone|ad|od)|Android/) ? true : false;
	var game = {
		defaultSize: 4,
		screen: null,
		srcCanvas: $('<canvas/>').attr('width',300).attr('height',300).get(0),
		layer: {
			title: $('<div id="fifteen-pazzle-title"/>')
				.css('width','300px').css('margin','8px auto').css('font-weight','bold').css('font','30px Verdana')
				.append('15Pazzle'),
			main: $('<div id="fifteen-pazzle-main"/>')
				.css('position','relative')
				.css('width','300px').css('height','300px').css('overflow','hidden')
				.css('margin','0 auto').css('padding','0').css('border','2px inset gray')
				.css('background','gray'),
			info: $('<div id="fifteen-pazzle-info"/>')
				.css('width','300px').css('margin','8px auto 0').css('font','20px Verdana'),
			cntl: $('<div id="fifteen-pazzle-cntl"/>')
				.css('width','300px').css('margin','.5em auto 0').css('font','16px Verdana')
				.append($('<input type="button" value="New Game" onclick="FifteenPazzle.start($(\'input[type=radio][name=fifteen-pazzle-size]:checked\').val())"/>'))
				.append($('<label style="margin-left:.5em;"/>').append($('<input type="radio" name="fifteen-pazzle-size" value="3"/>')).append('3x3'))
				.append($('<label style="margin-left:.5em;"/>').append($('<input type="radio" name="fifteen-pazzle-size" value="4" checked/>')).append('4x4'))
				.append($('<label style="margin-left:.5em;"/>').append($('<input type="radio" name="fifteen-pazzle-size" value="5"/>')).append('5x5'))
		},
		init: function(screen, images){
			if (game.screen)
				game.screen.empty();
			game.screen = $(screen).empty()
				.css('width','320px').css('overflow','hidden')
				.css('margin','0 auto').css('padding','0').css('border','none')
				.append(game.layer.title)
				.append(game.layer.main)
				.append(game.layer.info)
				.append(game.layer.cntl);
			game.restLoadCount = images.length;
			game.count = 0;
			game.images = [];
			for (var i = 0; i < game.restLoadCount; i++)
				game.images.push($('<img/>').attr('src',images[i]).bind('load',function(){ game.restLoadCount-- }));
            $('html,body').attr('height','100%');
		},
		setup: function(size){
			game.size  = (!isNaN(size) && 3 <= size && size <= 5) ? size : game.defaultSize;
			game.score = 0;
			game.state = STATE_READY;
			game.board = {
				panel: [],		// y*size+x => {pict_no:, canvas:}
				count: game.size * game.size,
				size: 300 / game.size,
				borderWidth: 1
			};
			game.board.size_ = game.board.size - game.board.borderWidth * 2;
			game.layer.main.empty();
			game.layer.info.empty();

			// create panel
			var panelCanvas = $('<canvas/>')
				.attr('width', game.board.size_)
				.attr('height',game.board.size_)
				.css('position','absolute')
				.css('border',game.board.borderWidth+'px outset gray');
			for (var i = 0; i < game.board.count; i++) {
				game.board.panel[i] = {
					pict_no: i,
					canvas: panelCanvas.clone()
						.appendTo(game.layer.main)
						.bind(clickEvent, i, game.event.onClick)
				};
			}

			// hide last panel
			game.board.panel[game.board.blankIndex = game.board.count - 1].canvas.css('visibility','hidden');

			// shuffle board
			do {
				for (var i = game.board.count -  1; --i >= 0;)
					game.swapPanel(i, Math.floor(Math.random() * i));
			} while (!game.board_check());

			// show
			for (var i = 0; i < game.board.count - 1; i++)
				game.movePanel(i);
			game.showScore();
		},
		board_check: function(){
			var permutation = [], count = 0;
			for (var i = 0; i < game.board.count - 1; i++)
				permutation[i] = game.board.panel[i].pict_no;

			for (var i = 0; i < game.board.count - 1; i++) {
				if (permutation[i] == -1)
					continue;
				count += game.get_permutation_length(permutation, i) - 1;
			}
			console.log('check permutation length = ', count);

			// insufficient or not even permutation
			if (count < game.board.count - game.size || count % 2 == 1)
				return false;
			return true;
		},
		get_permutation_length: function(permutation, startIdx){
			var length = 1, pict_no = permutation[startIdx], tmp;
			while (permutation[startIdx] >= 0 && pict_no != startIdx) {
				length++;
				tmp = pict_no, pict_no = permutation[pict_no], permutation[tmp] = -1;
			}
			console.log('length = ', length);
			return length;
		},
		start: function(){
            if (game.count == 0) {
    			if (game.restLoadCount > 0) {
    				setTimeout(game.start, 10);
    				return;
    			}
        		if (isSmartphone && !navigator.standalone) {
        			alert(unescape('%u3053%u306E%u30DA%u30FC%u30B8%u3092%u30DB%u30FC%u30E0%u753B%u9762%u306B%u8FFD%u52A0%u3057%u3066%u30A2%u30A4%u30B3%u30F3%u304B%u3089%u8D77%u52D5%u3059%u308B%u3068%u3001%u5168%u753B%u9762%u3067%u904A%u3073%u3084%u3059%u304F%u306A%u308A%u307E%u3059%u3002'));
        		}
    		}
			var img = game.images[game.count++ % game.images.length];
			game.drawImage(img.get(0));
			game.state = STATE_PLAY;
		},
		drawImage: function(image){
			game.srcCanvas.getContext('2d')
				.drawImage(image, 0, 0, 300, 300);

			for (var i = 0; i < game.board.count; i++) {
				var pos = game.idx2pos(game.board.panel[i].pict_no, game.board.size);
				game.board.panel[i].canvas.get(0).getContext('2d')
					.drawImage(game.srcCanvas,
						pos.x + game.board.borderWidth,
						pos.y + game.board.borderWidth,
						game.board.size_, game.board.size_,
						0, 0,
						game.board.size_, game.board.size_
					);
			}
		},
		idx2pos: function(idx, scale){
			if (!scale)
				scale = 1;
			return {
				x:         (idx % game.size) * scale,
				y: parseInt(idx / game.size) * scale
			};
		},
		swapPanel: function(idx1, idx2){
			var tmp, p = game.board.panel;
			tmp = p[idx1], p[idx1] = p[idx2], p[idx2] = tmp;
		},
		movePanel: function(idx){
			var pos = game.idx2pos(idx, game.board.size);
			game.board.panel[idx].canvas
				.css('left',pos.x+'px')
				.css('top', pos.y+'px');
		},
		changePanel: function(idx1, idx2){
			game.swapPanel(idx1, idx2);
			game.movePanel(idx1);
			game.movePanel(idx2);
		},
		showScore: function(){
			game.layer.info.text('Count: ' + game.score);
		},
		event: {
			onClick: function(event){
				if (game.state != STATE_PLAY)
					return false;

				var blankPos = game.idx2pos(game.board.blankIndex);
				var clickPos, clickIndex;
				for (var i = 0; i < game.board.count; i++) {
					if (game.board.panel[i].pict_no == event.data) {
						clickPos = game.idx2pos(clickIndex = i);
						break;
					}
				}

				if (clickPos.x == blankPos.x || clickPos.y == blankPos.y) {
					game.score++;
					game.showScore();

					var step;
					if (clickPos.x == blankPos.x)
						step = (blankPos.y < clickPos.y ? 1 : -1) * game.size;
					else
						step =  blankPos.x < clickPos.x ? 1 : -1;
					for (var i = game.board.blankIndex; i != clickIndex; i += step)
						game.changePanel(i, i + step);
					game.board.blankIndex = clickIndex;

					var all_ok = true;
					for (var i = 0; i < game.board.count; i++) {
						if (game.board.panel[i].pict_no != i) {
							all_ok = false;
							break;
						}
					}
					if (all_ok) {
						game.state = STATE_FINISH;
						game.board.panel[game.board.blankIndex].canvas.css('visibility','visible');
						game.layer.info.text('Count: ' + game.score + ' - Clear!');
					}
				}

				return false;
			}
		}
	};

	if (isSmartphone && 'applicationCache' in window) {
		$(applicationCache).bind('updateready', function(){
			if (confirm(unescape('%u30A2%u30D7%u30EA%u30B1%u30FC%u30B7%u30E7%u30F3%u306E%u65B0%u3057%u3044%u30D0%u30FC%u30B8%u30E7%u30F3%u304C%u5229%u7528%u53EF%u80FD%u3067%u3059%u3002%u66F4%u65B0%u3057%u307E%u3059%u304B%uFF1F'))) {
				applicationCache.swapCache();
				location.reload();
			}
		});

		if (navigator.onLine) {
			applicationCache.update();
		}
	}

	return {
		init: function(gameScreenId, images){
			game.init(gameScreenId, images);
			return this;
		},
		start: function(size){
			game.setup(size);
			game.start();
		}
	};
})();
