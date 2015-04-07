/**
 * Conway's Game of Life as a jQuery widget
 *
 * Caches the list of living cells, only checks those on pass.
 * Use birthCell and killCell, or the passthrough toggleCell to change a cell's state and also
 * update the cache.
 * On each "turn", any living cell with less than 2 and more than three neighbors dies, and any dead 
 * cell with 3 living neighbors comes alive.
 * Each turn we increment the neighbor count of each cell which borders a living cell, then check 
 * those cells and apply the rules.
 **/
$.widget("aviemet.life", {
	cells: null,          // jQuery object of all td cells in the board
	livingCells: {        // Stores the id of all living cells
		length: 0          // With internal counter
	},
	cellsToCheck: {},     // An object which stores the cells to be checked for each iteration
	                      // and their neighbor count
	playing: false,
	gens: 0,

    // Default options.
	options: {
		controlsHidden: false, // If the controls are hidden, don't subtract width from y value
		x: null,               // Width of the board
		y: null,               // Height of the board
		cellSize: 12,          // in pixels
		cellBorder: 1,         // in pixels
		speed: 250,            // 500 ms default interval speed
		maxSpeed: 3000,        // Max is 3 seconds
		minSpeed: 25, 
		incSpeed: 25,          // Number of ms to step up and down for speed changes
		seed: 8,               // The inverse of seed is the ratio for random seeds (higher is fewer)
		interactive: true      // Whether the cells are clickable by default
	},

	_create: function(){
		var self = this;
		this._determineSize();
		// Generate the HTML for the board based on the screen dimensions
		var $board = $("<table id=\"life_board\"></table>");
		for(var i = 0; i < this.options.y; i++){
			var $row = $('<tr></tr>');
			for(var j = 0; j < this.options.x; j++){
				$row.append('<td id="' +  this.getCellNum(j, i) + '">&nbsp;</td>');
			}
			$board.append($row);
		}
		this.element.append($board);
		
		// Cache list of cells
		this.cells = $board.find('td');

		if(this.options.interactive){
			// Establish the click behavior of individual cells
			$('table#life_board td').on('click', function(){
				self.toggleCell($(this).attr('id'));
			});
		}
		
	},

	/**
	 * void _determineSize()
	 * returns the amount of cells needed to fill the page
	 */
	_determineSize: function(){
		var $bounds = this.element.parent();
		var cellsize = this.options.cellSize + this.options.cellBorder;
		var width = this.controlsHidden ? $(window).width() : $(window).width() - $("#controls").width();
		this.options.x = Math.round(this.options.x || width / cellsize - 2);
		this.options.y = Math.round(this.options.y || $(window).height() / cellsize + 3);
	},

	/**
	* int getCellNum(int x, int y)
	* 
	* Converts x, y coords into the cell id number
	*/
	getCellNum: function(x, y){
		if(x > this.options.x-1){ x = 0; }
		if(y > this.options.y-1){ y = 0; }
		if(x < 0){ x = this.options.x-1; }
		if(y < 0){ y = this.options.y-1; }
		return y * this.options.x + x;	
	},

	/**
	* void randomSeed(int seed)
	*
	* Creates a random spread of live cells on the board based on the 
	* seed. A higher seed gives less cells. ~= Inverse of this.seed
	*/
	randomSeed: function(seed){
		var self = this;
		seed = seed || this.get("seed");
		this.clear();
		$.each(this.cells, function(){
			if(Math.floor(Math.random() * seed) % seed == 1){
				self.birthCell($(this).attr('id'));
			}
		});
	},

	/**
	 * mixed get(string attr)
	 * Returns the value of the passed game attribute
	 */
	get: function(attr){
		if(attr == 'cellCount'){
			return this.livingCells.length;
		}
		return this.options[attr] || null;
	},

	////////////////////////////////////
	////////////  Game Loop ////////////
	////////////////////////////////////

	/**
 	* void stepGeneration()
 	* 
 	* Advances the game through one generation
	*/
	stepGeneration: function(){
		// Prepare the list of cells to potentially change
		this._prepareGeneration();
		
		// From that list, apply the rules
		for(cell in this.cellsToCheck){
			if(this.isAlive(cell)){
				// Living cells with less than 2 or more than 3 neighbors die
				if(this.cellsToCheck[cell] < 2 || this.cellsToCheck[cell] > 3){
					this.killCell(cell);
				}
			} else if(this.cellsToCheck[cell] == 3){
				// Dead cells with 3 neighbors come alive
				this.birthCell(cell);
			}
		}

		// Empty the list
		this.cellsToCheck = new Object();
	},

	/**
	* void _prepareGeneration()
	* 
	* For each live cell on the board, store all neighbor cells to be checked
	* and increment their neighbor count by 1.
	*/
	_prepareGeneration: function(){
		for(var i = 0; i < this.options.y; i++){
			for(var j = 0; j < this.options.x; j++){
				if(this.isAlive(this.getCellNum(j, i))){
					this._incrementNeighbors(j, i);
				}
			}
		}
	},

	/**
	* void _incrementNeighbors(int x, int y)
	* 
	* For the cell at (x, y), adds that cell to the 'to be checked' list.
	* Adds all neighbors to the list as well, but also increments their neighbor count.
	*/
	dirs: [-1, 0, 1],
	_incrementNeighbors: function(x, y){
		this._addCellToCheck(this.getCellNum(x, y));
		for(i in this.dirs){
			for(j in this.dirs){
				if(this.dirs[i] != 0 || this.dirs[j] != 0){
					var cell = this.getCellNum(x + this.dirs[i], y + this.dirs[j]);
					this._incrementCellToCheck(cell);
				}
			}
		}
	},

	/**
	* void _incrementCellToCheck(int cell)
	* 
	* Adds to list with a value of 1 if doesn't exist, otherwise adds 1.
	*/
	_incrementCellToCheck: function(cell){
		if(!this.cellsToCheck.hasOwnProperty(cell)){
			this.cellsToCheck[cell] = 1;
		} else {
			this.cellsToCheck[cell] += 1;
		}
	},

	/**
	* void _addCellToCheck(int cell)
	* 
	* Adds a cell to the 'to be checked' list with a neighbor count of 0.
	*/
	_addCellToCheck: function(cell){
		if(!this.cellsToCheck.hasOwnProperty(cell)){
			this.cellsToCheck[cell] = 0;
		}
	},

	/**
	 * int neighborCount(int cell)
	 * returns the amount of neighbors the given cell has
	 */
	neighborCount: function(cell){
		/*if(this.cellsToCheck.hasOwnProperty(cell)){
			console.log([cell, this.cellsToCheck[cell]]);
			return this.cellsToCheck[cell];
		} else {*/
			var count = 0;
			var x = this.getX(cell);
			var y = this.getY(cell);

			for(i in this.dirs){
				for(j in this.dirs){
					if(this.dirs[i] != 0 || this.dirs[j] != 0){
						var neighbor = this.getCellNum(x + this.dirs[i], y + this.dirs[j]);
						if($(this.cells[neighbor]).hasClass('alive')) count++;
					}
				}
			}
			return count;
		//}
	},

	
	/**
	* bool isAlive(int cell)
	* 
	* Returns whether the cell is currently alive.
	*/
	isAlive: function(cell){
		return ($(this.cells[cell]).hasClass('alive'));
	},

	/**
	* void toggleCell(int cell)
	* 
	* Toggle a cell between alive and dead
	*/
	toggleCell: function(cell){
		if(this.isAlive(cell)){
			this.killCell(cell);
		} else {
			this.birthCell(cell);
		}
	},

	birthCell: function(cell){
		$(this.cells[cell]).addClass('alive');
		this.livingCells[cell] = true;
		this.livingCells.length++;
	},

	killCell: function(cell){
		$(this.cells[cell]).removeClass();
		delete this.livingCells[cell];
		this.livingCells.length--;
	},

	/**
	* int getCellNum(int x, int y)
	* 
	* Converts x, y coords into the cell id number
	*/
	getCellNum: function(x, y){
		if(x > this.options.x-1){ x = 0; }
		if(y > this.options.y-1){ y = 0; }
		if(x < 0){ x = this.options.x-1; }
		if(y < 0){ y = this.options.y-1; }
		return y * this.options.x + x;	
	},
	
	/**
	* int getX(int cell)
	* 
	* Returns the x coord of a cell
	*/
	getX: function(cell){
		return cell % this.options.x;
	},

	/**
	* int getY(int cell)
	* 
	* Returns the y coord of a cell
	*/
	getY: function(cell){
		return (cell - (this.getX(cell))) / this.options.x;	
	},

	////////////////////////////////////
	////////  Game Controls ////////////
	////////////////////////////////////

	interval: null,
	play: function(){
		if(this.playing) return;

		var self = this;
		this.playing = true;

		// Start the game loop
		this.interval = setInterval(function(){
			self.stepGeneration();
		}, self.get('speed'));
	},

	pause: function(){
		if(!this.playing) return;
		clearInterval(this.interval);
		this.playing = false;
	},

	speedUp: function(){
		if(this.get('speed') - this.get('incSpeed') > this.get('minSpeed')){
			this.setSpeed(this.get('speed') - this.get('incSpeed'));
		}
		var playing = this.playing;
		this.pause();
		if(playing){ this.play();}
		return this.get('speed');
	},

	slowDown: function(){
		if(this.get('speed') + this.get('incSpeed') < this.get('maxSpeed')){
			this.setSpeed(this.get('speed') + this.get('incSpeed'));
		}
		var playing = this.playing;
		this.pause();
		if(playing){ this.play();}
		return this.get('speed');
	},

	setSpeed: function(speed){
		if(speed < this.get('maxSpeed') && speed > this.get('minSpeed')){
			this.pause();
			this.options.speed = speed;
			this.play();
		}
		return false;
	},

	/**
	* void drawForm(int[][] graph)
	*
	* Takes a 2D array of 0s and 1s and draws it in the center of the board
	*/
	drawForm: function(graph){
		this.clear();
		var h = parseInt(this.options.y / 2) - parseInt(graph.length / 2);
		var w = parseInt(this.options.x / 2) - parseInt(graph[0].length / 2);
		for(var y = 0; y < graph.length; y++){
			for(var x = 0; x < graph[0].length; x++){
				if(graph[y][x] === 1){
					this.toggleCell(this.getCellNum(w + parseInt(x), h + parseInt(y)));
				}
			}
		}
	},
	
	/**
	* void clear()
	* 
	* Clears the board of all live cells
	*/
	clear: function(){
		this.pause();
		$.each(this.cells, function(){
			$(this).removeClass('alive');
		});
		this.cellCount = 0;
	}
});