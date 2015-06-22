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
                    tileImg: tile.BTile,
                    animCount: 0
                },
                that = {
                    isEmpty: function () {
                        return my.tileImg === tile.BTile;
                    },
                    assign: function (player) {
                        my.tileImg = player.getTile();
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
                            img      = my.animCount > .5 ? tile.BTile : my.tileImg;
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
                            display.ctx.drawImage(my.tileImg, my.x, my.y);
                        }
                    }
                },
                tileCanvas,
                tileCtx;

            //Create X, O and Blank tiles
            if (my.tileImg === undefined) {
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
                my.tileImg = tile.BTile;
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
                tile: t
            };
            return {
                getTile: function () {
                    return my.tile;
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

        //Shift click coordinates to zero at upper left of board
        pointX = evt.clientX - evt.target.offsetLeft;
        pointY = evt.clientY - evt.target.offsetTop;
        //Check if click is within tile coordinates and assign tile to player if valid
        if (pointX % boardBlock >= boardSpecs.margin && pointY % boardBlock >= boardSpecs.margin) {
            i = Math.floor(pointX / boardBlock)
              + Math.floor(pointY / boardBlock) * 3;
            if ( game.tiles[i].isEmpty() ) {
                game.tiles[i].assign(game.currentPlayer);
                game.tiles[i].animate();
                game.nextPlayer();
            }
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        game.init();
        display.board.addEventListener('mousedown', mouseDown);
    });
})();
