'use strict';
(function () {
    var boardSpecs = new (function () {
            this.tileDim     = 100;
            this.lineWidth   = 8;
            this.strokeStyle = '#FFFFFF';
            this.fillStyle   = '#FF69B4';
            this.margin      = this.tileDim / 10;
        })(),
        //Tile constructor
        tile = function (xPos, yPos) {
            var dim = boardSpecs.tileDim,
                my = {
                    x: xPos,
                    y: yPos,
                    tileFront: tile.BTile,
                    tileBack: undefined,
                    animCount: 0
                },
                that = {
                    isEmpty: function () {
                        return my.tileFront === tile.BTile;
                    },
                    assign: function (tf) {
                        my.tileBack = my.tileFront;
                        my.tileFront = tf;
                    },
                    getTileFront: function () {
                        return my.tileFront;
                    },
                    active: function () {
                        return my.animCount > 0;
                    },
                    animate: function () {
                        my.animCount = 1;
                    },
                    update: function () {
                        my.animCount -= .03;
                    },
                    draw: function () {
                        var colWidth, img, xPos, absFunc, verStretch;

                        if (my.animCount > 0) {
                            colWidth = 2;
                            img      = my.animCount > .5 ? my.tileBack : my.tileFront;
                            absFunc  = -Math.abs(2 * my.animCount - 1) + 1;
                            //Draws slices of tile image dependent on animCount variable
                            for (xPos = 0;  xPos < 100; xPos += colWidth) {
                                verStretch = (dim / 2) - (my.animCount > .5 ? 100 - xPos : xPos);
                                display.ctx.drawImage(
                                    img, //Tile image to use
                                    xPos, //X position on img
                                    0, //Y position on img
                                    colWidth, //Width of clipped image
                                    dim, //Height of clipped image
                                    my.x + xPos - absFunc * (xPos - dim / 2), //X Position on canvas
                                    my.y - .2 * (verStretch * absFunc), //Y Position on canvas
                                    colWidth, //Width of image rendered
                                    dim + .4 * (verStretch * absFunc)//Height of img
                                );
                            }
                        }
                        else {
                            display.ctx.drawImage(my.tileFront, my.x, my.y);
                        }
                    }
                },
                tileCanvas,
                tileCtx;

            //Create X, O and Blank tiles
            if (my.tileFront === undefined) {
                tileCanvas          = document.createElement('canvas');
                tileCanvas.width    = tileCanvas.height = dim;
                tileCtx             = tileCanvas.getContext('2d');
                tileCtx.lineWidth   = boardSpecs.lineWidth;
                tileCtx.strokeStyle = boardSpecs.strokeStyle;
                tileCtx.fillStyle   = boardSpecs.fillStyle;
                tileCtx.lineCap     = 'round';
                tile.BTile          = createTemplate();
                tile.OTile          = createTemplate(
                    [tileCtx.arc, dim / 2, dim / 2, dim / 2 * .8, 0, Math.PI * 2]
                );
                tile.XTile          = createTemplate(
                    [tileCtx.moveTo, dim * .1, dim * .1],
                    [tileCtx.lineTo, dim * .9, dim * .9],
                    [tileCtx.moveTo, dim * .9, dim * .1],
                    [tileCtx.lineTo, dim * .1, dim * .9]
                );
                my.tileFront = tile.BTile;
            }

            return that;

            function createTemplate() {
                var tileTemplate, key;

                tileCtx.fillRect(0, 0, boardSpecs.tileDim, boardSpecs.tileDim);
                //Draw designs
                if (arguments) {
                    tileCtx.beginPath();
                    for (key in arguments) {
                        if (arguments.hasOwnProperty(key) && arguments[key].constructor === Array) {
                            arguments[key][0].apply( tileCtx, arguments[key].slice(1) );
                        }
                    }
                    tileCtx.stroke();
                }

                tileTemplate     = document.createElement('img');
                tileTemplate.src = tileCanvas.toDataURL();

                return tileTemplate;
            }

        },
        //Player constructor
        player = function (t) {
            var my = {
                tileFront: t
            };
            return {
                getTileFront: function () {
                    return my.tileFront;
                }
            };
        },

        display = {
            board: undefined,
            ctx: undefined,
            tick: function () {
                window.requestAnimationFrame( display.tick.bind(display) );
                this.update();
                this.render();
            },
            update: function () {
                var i;
                for (i = game.tiles.length; i--;) {
                    if ( game.tiles[i].active() ) {
                        game.tiles[i].update();
                    }
                }
            },
            render: function () {
                var i;
                //Display tile states
                this.ctx.fillRect(0, 0, this.board.width, this.board.height);
                for (i = 0; i < 9; i++) {
                    game.tiles[i].draw();
                }
            },
            init: function () {
                var i, x, y;
                //Create board canvas
                this.board         = document.createElement('canvas');
                this.ctx           = this.board.getContext('2d');
                this.board.height  = boardSpecs.tileDim * 3 + boardSpecs.margin * 4;
                this.board.width   = boardSpecs.tileDim * 3 + boardSpecs.margin * 4;
                this.board.setAttribute('id', 'board');
                this.ctx.fillStyle = '#FFFFFF';
                document.body.appendChild(this.board);

                //Create and store tiles
                for (i = 0; i < 9; i++) {
                    x = (boardSpecs.tileDim + boardSpecs.margin) * (i % 3)
                      + boardSpecs.margin;
                    y = (boardSpecs.tileDim + boardSpecs.margin) * Math.floor(i / 3)
                      + boardSpecs.margin;
                    game.tiles.push( tile(x, y) );
                }
                //Begin animation loop
                this.tick();
            }
        },

        game = {
            tiles: [],
            p1: undefined,
            p2: undefined,
            currentPlayer: undefined,
            paused: false,
            result: undefined,
            over: false,
            init: function () {
                display.init();
                this.p1            = player(tile.XTile);
                this.p2            = player(tile.OTile);
                this.currentPlayer = this.p1;
            },
            nextPlayer: function () {
                this.currentPlayer = (this.currentPlayer === this.p1) ? this.p2 : this.p1;
            }
        };

    function mouseDown(evt) {
        var pointX,
            pointY,
            i,
            boardBlock = boardSpecs.tileDim + boardSpecs.margin;

        if (game.paused) {
            if (game.over) {
                reset();
            }
            return;
        }
        else {
            game.paused = true;
        }
        //Shift click coordinates to zero at upper left of board
        pointX = evt.clientX - evt.target.offsetLeft;
        pointY = evt.clientY - evt.target.offsetTop;
        //Check if click is within tile coordinates and assign tile to player if valid
        if (pointX % boardBlock >= boardSpecs.margin && pointY % boardBlock >= boardSpecs.margin) {
            i = Math.floor(pointX / boardBlock)
              + Math.floor(pointY / boardBlock) * 3;
            if ( game.tiles[i].isEmpty() ) {
                game.tiles[i].assign(game.currentPlayer.getTileFront());
                game.tiles[i].animate();
            }
        }
        if ( gameOver() ) {
            winText();
        }
        else {
            game.nextPlayer();
            game.paused = false;
        }
    }

    function gameOver() {
        var winPatterns = [
                "111000000", "000111000",
                "000000111", "100100100",
                "010010010", "001001001",
                "100010001", "001010100"
            ],
            boardState = "",
            tie = true,
            i, match;
        for (i = 0; i < game.tiles.length; i++) {
            boardState += ( game.tiles[i].getTileFront() === game.currentPlayer.getTileFront() )
                ? "1" : "0";
            if (game.tiles[i].getTileFront() === tile.BTile) {
                tie = false;
            }
        }
        boardState = parseInt(boardState, 2);
        for (i = 0; i < winPatterns.length; i++) {
            winPatterns[i] = parseInt(winPatterns[i], 2);
            match = boardState & winPatterns[i];
            if (match === winPatterns[i]) {
                game.result = game.currentPlayer;
                return true;
            }
        }
        return tie;
    }

    function winText() {
        var playerName, title, resultText;
        resultText = document.getElementById("result");
        if (game.result) {
            playerName = (game.result === game.p2) ? "O\'s" : "X\'s";
            resultText.innerHTML = playerName + " win! Tap to play again";
        }
        else {
            resultText.innerHTML = "Tied game. Tap to play again";
        }
        $('#title').animate({
            top: '-250px'
        });
        $('#result').animate({
            top: '0px'
        });
        game.over = true;
    }

    function reset() {
        var i;
        for (i = 0; i < game.tiles.length; i++) {
            if (game.tiles[i].getTileFront() !== tile.BTile) {
                game.tiles[i].assign(tile.BTile);
                game.tiles[i].animate();
            }
        }
        game.currentPlayer = (game.currentPlayer === game.p1) ? game.p2 : game.p1;
        game.over = game.paused = false;
        game.result = undefined;
        $('#title').animate({
            top: '0px'
        });
        $('#result').animate({
            top: '-250px'
        }).html("");

    }

    document.addEventListener("DOMContentLoaded", function () {
        game.init();
        display.board.addEventListener('mousedown', mouseDown);
    });
})();
