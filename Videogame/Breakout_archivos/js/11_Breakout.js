/*
 * Breakout
 *
 * Jose Abel Dominguez Rish
 * Modified for Breakout
 */

"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 600;

// Context of the Canvas
let ctx;

// A variable to store the game object
let game;

// Variable to store the time at the previous frame
let oldTime = 0;

let initialBallSpeed = 0.5;
let ballspeed = 0.4;
let paddleSpeed = 0.8;
let speedIncrease = 1.002;



// Class for the ball in the game
class Ball extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "ball");
        this.velocity = new Vector(0, 0);
    }

    update(deltaTime) {
        this.position = this.position.plus(this.velocity.times(ballspeed).times(deltaTime));
        this.updateCollider();
    }

    reset() {
        this.position.x = canvasWidth / 2;
        this.position.y = canvasHeight - 120;
        this.velocity.x = 0;
        this.velocity.y = 0;
        ballspeed = initialBallSpeed;
        this.updateCollider();
    }

    serve() {
        let angle = Math.random() * Math.PI / 3 + Math.PI / 6;

        this.velocity = new Vector(Math.cos(angle), -Math.sin(angle));

        if (Math.random() > 0.5) {
            this.velocity.x *= -1;
        }

        ballspeed = initialBallSpeed;
    }
}


// Class for the paddle
class Paddle extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "player");

        this.velocity = new Vector(0, 0);

        this.motion = {
            left: {
                axis: "x",
                sign: -1,
            },
            right: {
                axis: "x",
                sign: 1,
            },
        };

        this.keys = [];
    }

    update(deltaTime) {
        // Restart the velocity
        this.velocity.x = 0;
        this.velocity.y = 0;

// Modify the velocity according to the directions pressed
        for (const direction of this.keys) {
            const axis = this.motion[direction].axis;
            const sign = this.motion[direction].sign;
            this.velocity[axis] += sign;
        }

         // Normalize the velocity to avoid greater speed on diagonals

        this.velocity = this.velocity.normalize().times(paddleSpeed);

        this.position = this.position.plus(this.velocity.times(deltaTime));

        this.clampWithinCanvas();
        this.updateCollider();
    }

    clampWithinCanvas() {
        if (this.position.x - this.halfSize.x < 0) {
            this.position.x = this.halfSize.x;

        } else if (this.position.x + this.halfSize.x > canvasWidth) {
            this.position.x = canvasWidth - this.halfSize.x;
        }
    }


    //For the drawing of the spaceship, this was made with the help of Artificial Intelligence
    //The initial intention was to use sprites, but none of them worked in the way they were needed for the breakout game


    draw(ctx) {
        const x = this.position.x;
        const y = this.position.y;
        const w = this.halfSize.x;

        ctx.save();

    // central body
        ctx.fillStyle = "#aaddff";
        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

    // left wing
        ctx.fillStyle = "#5599cc";
        ctx.beginPath();
        ctx.moveTo(x - w * 0.35, y);
        ctx.lineTo(x - w, y + 10);
        ctx.lineTo(x - w * 0.35, y + 8);
        ctx.closePath();
        ctx.fill();

    // right wing
        ctx.beginPath();
        ctx.moveTo(x + w * 0.35, y);
        ctx.lineTo(x + w, y + 10);
        ctx.lineTo(x + w * 0.35, y + 8);
        ctx.closePath();
        ctx.fill();

    // cabin
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.ellipse(x, y - 8, w * 0.2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

    // left engine
        ctx.fillStyle = "#ff6600";
        ctx.beginPath();
        ctx.ellipse(x - w * 0.35, y + 12, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

    // right engine
        ctx.beginPath();
        ctx.ellipse(x + w * 0.35, y + 12, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
}
    
}


// Class for each block
class Block extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "block");
        this.destroyed = false;
    }

    draw(ctx) {
        if (!this.destroyed) {
            super.draw(ctx);
        }
    }
}

// Class for the power-ups
class PowerUp extends GameObject {
    constructor(position, type) {
        let color = type === "wide" ? "#4488ff" :
                    type === "multiball" ? "#ff4444" : "#ffdd00";
        super(position, 20, 20, color, "powerup");
        this.type = type;
        this.velocity = new Vector(0, 0.3);
    }

    update(deltaTime) {
        this.position.y += this.velocity.y * deltaTime;
        this.updateCollider();
    }

    draw(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let label = this.type === "wide" ? "W" :
                    this.type === "multiball" ? "M" : "S";
        ctx.fillText(label, x, y);
        ctx.restore();
    }
}

// Class to keep track of all the events and objects in the game
class Game {
    constructor() {
        this.level = 1;
        this.lives = 3;
        this.destroyedBlocks = 0;

        this.inPlay = false;
        this.gameOver = false;
        this.gameWon = false;
        this.powerUps = [];
        this.extraBalls = [];
        this.wideTimer = 0;
        this.slowTimer = 0;
        this.originalPaddleWidth = 140;
        // initialize sound element
        this.ping = document.createElement("audio");
        this.ping.src = "/Users/abelrish/Desktop/TC2005B-2/Videogame/Breakout_archivos/js/Assets/ahmed_abdulaal-laser-312360.mp3";

        this.createEventListeners();
        this.initObjects();

        this.blocksLabel = new TextLabel(20, 35, "24px Arial", "white");
        this.livesLabel = new TextLabel(20, 65, "24px Arial", "white");
        this.levelLabel = new TextLabel(650, 35, "24px Arial", "white");

        this.startLabel = new TextLabel(250, 350, "24px Arial", "white");
        this.gameOverLabel = new TextLabel(250, 300, "50px Arial", "red");
        this.winLabel = new TextLabel(280, 300, "50px Arial", "green");
        this.restartLabel = new TextLabel(250, 350, "24px Arial", "white");
    }

initObjects() {
    this.paddle = new Paddle(new Vector(canvasWidth / 2, canvasHeight - 40),140,20,"blue");

    this.wallLeft = new GameObject(new Vector(-5, canvasHeight / 2),10,canvasHeight,"yellow","wall");

    this.wallRight = new GameObject(new Vector(canvasWidth + 5, canvasHeight / 2),10,canvasHeight,"yellow","wall");

    this.wallTop = new GameObject(new Vector(canvasWidth / 2, -5),canvasWidth,10, "yellow","wall");

    this.ball = new Ball(new Vector(canvasWidth / 2, canvasHeight - 120),20,20, "white");

    this.blocks = [];
    this.createBlocks();

    this.actors = [
        this.paddle,
        this.wallLeft,
        this.wallRight,
        this.wallTop,
        this.ball
    ];
}
//Here we create the blocks in a grid patter, with a small gam and in rows in diffrent colors
    createBlocks() {
        this.blocks = [];

        let rows = this.level + 2;
        let columns = 6;

        let blockWidth = 100;
        let blockHeight = 30;
        let gap = 15;

        let totalWidth = columns * blockWidth + (columns - 1) * gap;
        let startX = (canvasWidth - totalWidth) / 2 + blockWidth / 2;
        let startY = 110;

        let colors = ["red", "orange", "yellow", "green", "purple"];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                let x = startX + col * (blockWidth + gap);
                let y = startY + row * (blockHeight + gap);

                let block = new Block(
                    new Vector(x, y),
                    blockWidth,
                    blockHeight,
                    colors[row % colors.length]
                );

                this.blocks.push(block);
            }
        }
    }
//Draw objects and visual labels
    draw(ctx) {
        this.blocksLabel.draw(ctx, "Bloques destruidos: " + this.destroyedBlocks);
        this.livesLabel.draw(ctx, "Vidas: " + this.lives);
        this.levelLabel.draw(ctx, "Nivel: " + this.level);

        for (let actor of this.actors) {
            actor.draw(ctx);
        }

        for (let block of this.blocks) {
            block.draw(ctx);
        }

        if (!this.inPlay && !this.gameOver && !this.gameWon) {
            this.startLabel.draw(ctx, "Press SPACE to start");
        }

        if (this.gameOver) {
            this.gameOverLabel.draw(ctx, "GAME OVER");
            this.restartLabel.draw(ctx, "Press R to restart");
        }

        if (this.gameWon) {
            this.winLabel.draw(ctx, "YOU WIN!");
            this.restartLabel.draw(ctx, "Press R to restart");
        }
        for (let pu of this.powerUps) pu.draw(ctx);
        for (let eb of this.extraBalls) eb.draw(ctx);
    }

    update(deltaTime) {
        if (this.gameOver || this.gameWon) {
            return;
        }

        this.paddle.update(deltaTime);

        if (this.inPlay) {
            this.ball.update(deltaTime);
        }

        this.checkWallCollisions();
        this.checkPaddleCollision();
        this.checkBlockCollisions();
        this.checkLevelComplete();

        this.updatePowerUps(deltaTime);
        this.updateExtraBalls(deltaTime);
        this.updateTimers(deltaTime);
    }

    // In this part, we create a funcuiont to check the collisions of the ball with the walls, and make it bounce, if it goes below the screen, we lose a life and reset the ball
    // This part is a bit diffrent as the pong game, this is for a better reaction of the ball, and to avoid bugs with the ball getting stuck in the walls
        // "Extra function"
    checkWallCollisions() {
        if (this.ball.position.x - this.ball.halfSize.x <= 0) {
            this.ball.position.x = this.ball.halfSize.x;
            this.ball.velocity.x *= -1;
            this.ball.updateCollider();
        }

        if (this.ball.position.x + this.ball.halfSize.x >= canvasWidth) {
            this.ball.position.x = canvasWidth - this.ball.halfSize.x;
            this.ball.velocity.x *= -1;
            this.ball.updateCollider();
        }

        if (this.ball.position.y - this.ball.halfSize.y <= 0) {
            this.ball.position.y = this.ball.halfSize.y;
            this.ball.velocity.y *= -1;
            this.ball.updateCollider();
        }

        if (this.ball.position.y - this.ball.halfSize.y > canvasHeight) {
            this.loseLife();
        }
    }
    // In this part, we create a funcuiont to check the collisions of the ball with the walls, and make it bounce, if it goes below the screen, we lose a life and reset the ball
    // This part is a bit diffrent as the pong game, this is for a better reaction of the ball, and to avoid bugs with the ball getting stuck in the walls
    // "Extra function"
    checkPaddleCollision() {
        if (boxOverlap(this.paddle, this.ball) && this.ball.velocity.y > 0) {
            this.ball.position.y = this.paddle.position.y - this.paddle.halfSize.y - this.ball.halfSize.y;

            let paddleCenter = this.paddle.position.x;
            let ballCenter = this.ball.position.x;

            let difference = ballCenter - paddleCenter;
            let normalizedDifference = difference / this.paddle.halfSize.x;

            this.ball.velocity.x = normalizedDifference;
            this.ball.velocity.y = -1;
            this.ball.velocity = this.ball.velocity.normalize();

            ballspeed *= speedIncrease;
            this.ping.play();

            this.ball.updateCollider();
        }
    }

        // In this part, we create a funcuiont to check the collisions of the ball with the walls, and make it bounce, if it goes below the screen, we lose a life and reset the ball
        // This part is a bit diffrent as the pong game, this is for a better reaction of the ball, and to avoid bugs with the ball getting stuck in the walls
        //Also on this part we check collisions for the extra ball and also the condition of the block being destroyed.
            // "Extra function"
    checkBlockCollisions() {
        for (let block of this.blocks) {
            if (!block.destroyed && boxOverlap(block, this.ball)) {
                block.destroyed = true;

                // 30% chance to drop a power-up
            if (Math.random() < 0.3) {
                let types = ["wide", "multiball", "slow"];
                let type = types[Math.floor(Math.random() * types.length)];
                this.powerUps.push(new PowerUp(
            new Vector(block.position.x, block.position.y), type
    ));
}
                this.destroyedBlocks++;
                this.ping.play();
                

                let ballCenterX = this.ball.position.x;
                let ballCenterY = this.ball.position.y;

                let blockLeft = block.collider.x;
                let blockRight = block.collider.x + block.collider.width;
                let blockTop = block.collider.y;
                let blockBottom = block.collider.y + block.collider.height;

                let overlapLeft = Math.abs((ballCenterX + this.ball.halfSize.x) - blockLeft);
                let overlapRight = Math.abs((ballCenterX - this.ball.halfSize.x) - blockRight);
                let overlapTop = Math.abs((ballCenterY + this.ball.halfSize.y) - blockTop);
                let overlapBottom = Math.abs((ballCenterY - this.ball.halfSize.y) - blockBottom);

                let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    this.ball.velocity.x *= -1;
                } else {
                    this.ball.velocity.y *= -1;
                }

                ballspeed *= speedIncrease;
                this.ball.updateCollider();

                break;
            }
        }
    }
//Here we create the condition of the levels
    checkLevelComplete() {
    
        let remainingBlocks = 0;

        for (let block of this.blocks) {
            if (!block.destroyed) {
                remainingBlocks++;
            }
        }

        if (remainingBlocks === 0) {
            if (this.level >= 3) {
                this.gameWon = true;
                this.inPlay = false;
            } else {
                this.level++;
                this.inPlay = false;
                this.ball.reset();
                this.createBlocks();
            }
        }
    }
// We create the condition of losing a life
    loseLife() {
        this.lives--;
        this.inPlay = false;
        this.ball.reset();

        if (this.lives <= 0) {
            this.gameOver = true;
        }
    }

    restart() {
        this.level = 1;
        this.lives = 3;
        this.destroyedBlocks = 0;

        this.inPlay = false;
        this.gameOver = false;
        this.gameWon = false;

        this.ball.reset();
        this.createBlocks();

        this.powerUps = [];
        this.extraBalls = [];
        this.wideTimer = 0;
        this.slowTimer = 0;
    }
//movement
    createEventListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.key == "ArrowLeft") {
                this.addKey("left", this.paddle);
            }

            if (event.key == "ArrowRight") {
                this.addKey("right", this.paddle);
            }

            if (event.key == "a") {
                this.addKey("left", this.paddle);
            }

            if (event.key == "d") {
                this.addKey("right", this.paddle);
            }

            if (event.key == " ") {
                if (!this.inPlay && !this.gameOver && !this.gameWon) {
                    this.ball.serve();
                    this.inPlay = true;
                }
            }

            if (event.key == "r" || event.key == "R") {
                if (this.gameOver || this.gameWon) {
                    this.restart();
                }
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key == "ArrowLeft") {
                this.delKey("left", this.paddle);
            }

            if (event.key == "ArrowRight") {
                this.delKey("right", this.paddle);
            }

            if (event.key == "a") {
                this.delKey("left", this.paddle);
            }

            if (event.key == "d") {
                this.delKey("right", this.paddle);
            }
        });
    }

    addKey(direction, object) {
        if (!object.keys.includes(direction)) {
            object.keys.push(direction);
        }
    }

    delKey(direction, object) {
        if (object.keys.includes(direction)) {
            object.keys.splice(object.keys.indexOf(direction), 1);
        }
    }

    // This partare the power ups obtaindes by destroying blocks
    updatePowerUps(deltaTime) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
        let pu = this.powerUps[i];
        pu.update(deltaTime);

        // out of screen
        if (pu.position.y > canvasHeight) {
            this.powerUps.splice(i, 1);
            continue;
        }

        // Paddle collision
        if (boxOverlap(this.paddle, pu)) {
            this.activatePowerUp(pu.type);
            this.powerUps.splice(i, 1);
        }
    }
}

// This part are the power ups obtaindes by destroying blocks for limited time
    activatePowerUp(type) {

//Condition for increasing the paddle size for a limited time
        if (type === "wide") {
            this.paddle.size.x = 200;
            this.paddle.halfSize.x = 100;
            this.wideTimer = 8000;

// Condition for the extra ball
    }   else if (type === "multiball") {
         let newBall = new Ball(
            new Vector(this.ball.position.x, this.ball.position.y),
            20, 20, "#ff8888"
        );
            newBall.velocity = new Vector(
            -this.ball.velocity.x,
            this.ball.velocity.y
        );
            this.extraBalls.push(newBall);

// Condition for slow ball

    }   else if (type === "slow") {
            ballspeed *= 0.5;
            this.slowTimer = 6000;
    }
}

// Manages the extra ball using the other conditions
// eb = extra ball
updateExtraBalls(deltaTime) {
    for (let i = this.extraBalls.length - 1; i >= 0; i--) {
        let eb = this.extraBalls[i];
        eb.update(deltaTime);

        if (eb.position.x - eb.halfSize.x <= 0 || 
            eb.position.x + eb.halfSize.x >= canvasWidth) {
            eb.velocity.x *= -1;
        }
        if (eb.position.y - eb.halfSize.y <= 0) {
            eb.velocity.y *= -1;
        }
        if (boxOverlap(this.paddle, eb) && eb.velocity.y > 0) {
            eb.velocity.y *= -1;
        }

        for (let block of this.blocks) {
            if (!block.destroyed && boxOverlap(block, eb)) {
                block.destroyed = true;
                this.destroyedBlocks++;
                eb.velocity.y *= -1;
                ballspeed *= speedIncrease;
                eb.updateCollider();
                break;
            }
        }

        if (eb.position.y > canvasHeight) {
            this.extraBalls.splice(i, 1);
        }
    }
}

    updateTimers(deltaTime) {
        if (this.wideTimer > 0) {
            this.wideTimer -= deltaTime;
        if (this.wideTimer <= 0) {
            // Restaurar paddle
            this.paddle.size.x = this.originalPaddleWidth;
            this.paddle.halfSize.x = this.originalPaddleWidth / 2;
        }
    }

        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
        if (this.slowTimer <= 0) {
            ballspeed = initialBallSpeed;
        }
    }
}
}


// Starting function that will be called from the HTML page
function main() {
    const canvas = document.getElementById("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx = canvas.getContext("2d");

    game = new Game();

    drawScene(0);
}


// Main loop function to be called once per frame
const bgImage = new Image();
bgImage.src = "https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_1280.jpg";

function drawScene(newTime) {
    let deltaTime = newTime - oldTime;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // backround image
    ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);

    game.update(deltaTime);
    game.draw(ctx);

    oldTime = newTime;

    requestAnimationFrame(drawScene);
}