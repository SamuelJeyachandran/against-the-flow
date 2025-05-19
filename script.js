let myGamePiece;
let myObstacles = [];
let myCoins = [];
let isGameOver = false;
const lengthOfPiece = 60;
const difficultyRampInterval = 1500; // frames
const coinColor = "gold";
let score = 0;
let maxScore = 0;
let amount = 150;
let maxSize = 40;
let level = 1;
let obstacleSpeed = 1.2;
let mode = ""
let isPaused = false;
let hitboxesShown = false
let hPressed = false;
let zxPressed = false;
const coinSound = new Audio("/sounds/coin_collect.mp3");
const sonicboom = new Audio("/sounds/plane_sonicboom.mp3");
const deathSound = new Audio("/sounds/videogame-death-sound.mp3");

const rocketImage = new Image();
rocketImage.src = "images/rocketship.png";  // Use your rocket image path

const asteroidImage = new Image();
asteroidImage.src = "images/asteroid.png";  // Use your asteroid image path

coinSound.preload = "auto";
sonicboom.preload = "auto";
deathSound.preload = "auto";
const menu = document.getElementById("menu")
const tryAgainButton = document.getElementById("tryagain");
const backButton = document.getElementById("back")
const scoreHtml = document.getElementById("score");
const maxScoreHtml = document.getElementById("maxScore");
const levelHtml = document.getElementById("level");
const levelPopUpHtml = document.getElementById("levelPopUp");
const deathOverlay = document.getElementById("deathOverlay")

function startGameMode(modef) {
    const settings = {
        normal: { amount: 150, maxSize: 40, obstacleSpeed: 1.2 },
        hard: { amount: 100, maxSize: 60, obstacleSpeed: 1.5 },
        endless: { amount: 60, maxSize: 80, obstacleSpeed: 1.8 }
    };

    const { amount, maxSize, obstacleSpeed } = settings[modef];
    mode = modef;
    hideMenuAndStart(startGame);
}

function hideMenuAndStart(callback) {
    scoreHtml.hidden = false
    maxScoreHtml.hidden = false
    levelHtml.hidden = false
    menu.classList.add("hidden");
    callback(); // Start the game
    setTimeout(() => {
        menu.style.display = "none";
    }, 500); // match the transition duration
}

function showCredits() { document.getElementById("credits").style.display = "block"; }
function hideCredits() { document.getElementById("credits").style.display = "none"; }

function startNormalMode() { startGameMode('normal') }
function startHardMode() { startGameMode('hard') }
function startEndlessMode() { startGameMode('endless') }

function startGame() {
    myGamePiece = new component(87.5, 52.5, rocketImage, 500, (window.innerHeight / 2) - 30, "image");
    myGameArea.start();
}

function tryAgain() {
    levelHtml.style.color = "white"
    scoreHtml.style.color = "white"
    maxScoreHtml.style.color = "white"
    deathOverlay.style.opacity = "0";
    deathOverlay.style.pointerEvents = "none";
    isGameOver = false;
    level = 1;
    score = 0;

    if (mode === "normal") {
        amount = 150;
        maxSize = 40;
        obstacleSpeed = 1.2;
    }
    else if (mode === "hard") {
        amount = 100;
        maxSize = 60;
        obstacleSpeed = 1.5;
    }
    else if (mode === "endless") {
        amount = 60;
        maxSize = 80;
        obstacleSpeed = 1.8;
    }
    levelHtml.innerHTML = `Level ${level}`;
    levelPopUpHtml.hidden = true;
    scoreHtml.innerHTML = `Score: 0`;
    myObstacles = [];
    myCoins = [];

    startGame();
    tryAgainButton.hidden = true;
    backButton.hidden = true;
}
function back() {
    deathOverlay.style.opacity = "0";
    deathOverlay.style.pointerEvents = "none";
    level = 1;
    score = 0;
    levelHtml.innerHTML = `Level ${level}`;
    levelPopUpHtml.hidden = true;
    levelHtml.hidden = true;
    scoreHtml.hidden = true;
    maxScoreHtml.hidden = true;
    scoreHtml.innerHTML = `Score: 0`;
    myObstacles = [];
    myCoins = [];
    menu.style.display = "flex"; // or 'block'
    setTimeout(() => {
        menu.classList.remove("hidden"); // fade in smoothly
        tryAgainButton.hidden = true;
        backButton.hidden = true;
        levelHtml.style.color = "white"
        scoreHtml.style.color = "white"
        maxScoreHtml.style.color = "white"
    }, 200); // slight delay to allow reflow and trigger transition    
}

function gameOver() {
    myGameArea.stop();
    isGameOver = true;
    myGamePiece.speedX = 0;
    myGamePiece.speedY = 0;
    // sonicboom.currentTime = 1.78;
    // sonicboom.play();
    try {
        deathSound.currentTime = 1.45;
        deathSound.play();
    } catch (e) {
        console.warn("Death sound blocked or failed:", e);
    }
    document.getElementById("finalScoreText").innerText = `Score: ${score}`;
    deathOverlay.style.opacity = "1";
    deathOverlay.style.pointerEvents = "auto";
    tryAgainButton.hidden = false;
    backButton.hidden = false;

    levelHtml.style.color = scoreHtml.style.color = maxScoreHtml.style.color = "white";

    if (score > maxScore) maxScore = score;
    maxScoreHtml.innerHTML = `Max Score: ${maxScore}`;

}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        deathOverlay.style.opacity = "1";
        deathOverlay.style.pointerEvents = "auto";
        clearInterval(myGameArea.interval);
    } else {
        deathOverlay.style.opacity = "0";
        deathOverlay.style.pointerEvents = "none";
        myGameArea.interval = setInterval(updateGameArea, 5);
    }
}

function randomNum(max, min) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = screen.width - 20;
        this.canvas.height = screen.height - 112;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 5);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = myGameArea.keys || {};
            myGameArea.keys[e.key] = true;
            if (e.key === "Escape") {togglePause();}
        });
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.key] = false;
        });
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function () {
        clearInterval(this.interval);
    }
};

function everyinterval(n) {
    return myGameArea.frameNo % n === 0;
}

function component(width, height, color, x, y, type = "rect") {
    this.gamearea = myGameArea;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.type = type; // "rect", "coin", or "image"
    this.shineOffset = Math.random() * Math.PI * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.imageLoaded = !(type === "image" && color instanceof Image) || color.complete;

    if (type === "image" && color instanceof Image && !color.complete) {
        color.onload = () => {
            this.imageLoaded = true;
        };
    }

    this.update = function () {
        const ctx = myGameArea.context;
        if (this.type === "coin") {
            const r = this.width / 2;
            const centerX = this.x + r;
            const centerY = this.y + r;

            // Coin circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            // Shine effect
            ctx.beginPath();
            ctx.arc(centerX, centerY, r - 2, this.shineOffset, this.shineOffset + Math.PI / 3);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            this.shineOffset += 0.02;
            if (this.shineOffset > Math.PI * 2) this.shineOffset = 0;

        } else if (this.type === "image" && this.color instanceof Image) {
            // Draw image
            if (hitboxesShown) {
                ctx.strokeStyle = "lime";
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            ctx.drawImage(this.color, this.x, this.y, this.width, this.height);
        }
    };
    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    };
    this.crashWith = function (other) {
        // Bounding box check
        const noOverlap =
            this.y + this.height <= other.y ||
            this.y >= other.y + other.height ||
            this.x + this.width <= other.x ||
            this.x >= other.x + other.width;
        if (noOverlap) return false;

        // Pixel-perfect collision only if both are image components
        if (this.type === "image" && other.type === "image") {
            if (!this.imageLoaded || !other.imageLoaded) return false;
            if (this.width === 0 || this.height === 0 || other.width === 0 || other.height === 0) return false;

            const overlapX = Math.max(this.x, other.x);
            const overlapY = Math.max(this.y, other.y);
            const overlapWidth = Math.min(this.x + this.width, other.x + other.width) - overlapX;
            const overlapHeight = Math.min(this.y + this.height, other.y + other.height) - overlapY;

            if (overlapWidth <= 0 || overlapHeight <= 0) return false;

            const maxSafeArea = 30000; // Max ~173x173 px overlap
            if (overlapWidth * overlapHeight > maxSafeArea) return true; // fallback to bounding box

            try {
                if (!this._pixelCanvasA) {
                    this._pixelCanvasA = document.createElement("canvas");
                    this._pixelCtxA = this._pixelCanvasA.getContext("2d", { willReadFrequently: true });
                }
                if (!this._pixelCanvasB) {
                    this._pixelCanvasB = document.createElement("canvas");
                    this._pixelCtxB = this._pixelCanvasB.getContext("2d", { willReadFrequently: true });
                }

                const canvasA = this._pixelCanvasA;
                const canvasB = this._pixelCanvasB;
                canvasA.width = canvasB.width = overlapWidth;
                canvasA.height = canvasB.height = overlapHeight;

                const sxA = (overlapX - this.x) * (this.color.width / this.width);
                const syA = (overlapY - this.y) * (this.color.height / this.height);
                const swA = overlapWidth * (this.color.width / this.width);
                const shA = overlapHeight * (this.color.height / this.height);

                const sxB = (overlapX - other.x) * (other.color.width / other.width);
                const syB = (overlapY - other.y) * (other.color.height / other.height);
                const swB = overlapWidth * (other.color.width / other.width);
                const shB = overlapHeight * (other.color.height / other.height);

                this._pixelCtxA.clearRect(0, 0, overlapWidth, overlapHeight);
                this._pixelCtxB.clearRect(0, 0, overlapWidth, overlapHeight);

                this._pixelCtxA.drawImage(this.color, sxA, syA, swA, shA, 0, 0, overlapWidth, overlapHeight);
                this._pixelCtxB.drawImage(other.color, sxB, syB, swB, shB, 0, 0, overlapWidth, overlapHeight);

                const dataA = this._pixelCtxA.getImageData(0, 0, overlapWidth, overlapHeight).data;
                const dataB = this._pixelCtxB.getImageData(0, 0, overlapWidth, overlapHeight).data;

                for (let i = 0; i < dataA.length; i += 4) {
                    if (dataA[i + 3] >= 128 && dataB[i + 3] >= 128) {
                        return true; // overlapping opaque pixels
                    }
                }
            } catch (err) {
                return false;
            }

            return false;
        }

        return true; // fallback: non-image collisions
    };
}

function updateGameArea() {
    myGamePiece.speedX = -0.6;
    myGamePiece.speedY = 0;

    // Define boundary offset for padding
    const boundaryPaddingX = 0;
    const boundaryPaddingY = 0;

    // Define boundaries dynamically based on game piece size and canvas size
    const leftBoundary = 0 + boundaryPaddingX;
    const topBoundary = 0 + boundaryPaddingY-8;
    const rightBoundary = myGameArea.canvas.width - myGamePiece.width - boundaryPaddingX+5;
    const bottomBoundary = myGameArea.canvas.height - myGamePiece.height - boundaryPaddingY+8;
    // Boundaries conditions using dynamic boundaries
    if (myGamePiece.x <= leftBoundary) {
        myGamePiece.speedX = 0;
        myGamePiece.x = leftBoundary;
    }
    if (myGamePiece.y <= topBoundary) {
        myGamePiece.speedY = 0;
        myGamePiece.y = topBoundary;
    }
    if (myGamePiece.y >= bottomBoundary) {
        myGamePiece.speedY = 0;
        myGamePiece.y = bottomBoundary;
    }
    if (myGamePiece.x >= rightBoundary) {
        myGamePiece.speedX = -0.6;
        myGamePiece.x = rightBoundary;
    }
    // //Left
    // if (myGamePiece.x <= -22) {
    //     myGamePiece.speedX = 0;
    //     myGamePiece.x = -22;
    // }
    // //Top
    // if (myGamePiece.y <= -11) {
    //     myGamePiece.speedY = 0;
    //     myGamePiece.y = -11;
    // }
    // //Bottom
    // if (myGamePiece.y >= myGameArea.canvas.height - lengthOfPiece + 11) {
    //     myGamePiece.speedY = 0;
    //     myGamePiece.y = myGameArea.canvas.height - lengthOfPiece + 11;
    // }
    // // Right
    // if (myGamePiece.x >= myGameArea.canvas.width - lengthOfPiece - 28) {
    //     myGamePiece.speedX = -0.6;
    //     myGamePiece.x = myGameArea.canvas.width - lengthOfPiece - 28;
    // }

    // Crash detection
    for (let i = 0; i < myObstacles.length; i++) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            gameOver()
            return;
        }
    }

    // Coin collection
    for (let i = 0; i < myCoins.length; i++) {
        if (myGamePiece.crashWith(myCoins[i])) {
            coinSound.currentTime = 0.2;
            coinSound.play();
            score++;
            scoreHtml.innerHTML = `Score: ${score}`;
            myCoins.splice(i, 1);
            break;
        }
    }

    // Level change logic
    if (everyinterval(difficultyRampInterval) && myGameArea.frameNo !== 0) {
        level++;
        levelHtml.innerHTML = `Level ${level}`;
        levelPopUpHtml.innerHTML = `Level ${level}`;
        levelPopUpHtml.hidden = false;
        setTimeout(() => {
            levelPopUpHtml.hidden = true;
        }, 750);
        if (amount > 30) amount -= 5;
        if (maxSize < 100) maxSize += 3;
        obstacleSpeed += 0.2; // increase movement speed
    }

    // Create obstacle

    myGameArea.clear();
    myGameArea.frameNo++;
    if (myGameArea.frameNo === 1 || everyinterval(amount)) {
        let height = randomNum(maxSize, 100)
        const x = myGameArea.canvas.width;
        let y = randomNum(myGameArea.canvas.height - height, 0)
        myObstacles.push(new component(height, height, asteroidImage, x, y, "image"));
    }

    // Update obstacles
    myObstacles.forEach((obstacle) => {
        if (myGamePiece.crashWith(obstacle)) {
            gameOver()
            return;
        }
        obstacle.x -= obstacleSpeed;
        obstacle.update();
    });
    myObstacles = myObstacles.filter(o => o.x + o.width > 0);

    // Create coin
    if (myGameArea.frameNo === 1 || everyinterval(1000)) {
        const h = randomNum(35, 25)
        const x = myGameArea.canvas.width;
        const y = Math.floor(Math.random() * myGameArea.canvas.height);
        myCoins.push(new component(h, h, coinColor, x, y, "coin"));
    }

    // Update coins
    myCoins.forEach((coin) => {
        coin.x -= obstacleSpeed - 0.3;
        coin.update();
    });
    myCoins = myCoins.filter(c => c.x + c.width > 0);

    // Movement
    const keys = myGameArea.keys || {};
    if (keys["ArrowUp"] || keys["w"]) myGamePiece.speedY -= 1.5;
    if (keys["ArrowLeft"] || keys["a"]) myGamePiece.speedX -= 2;
    if (keys["ArrowDown"] || keys["s"]) myGamePiece.speedY += 1.5;
    if (keys["ArrowRight"] || keys["d"]) myGamePiece.speedX += 2;
    if (keys["z"] && keys["x"]) {if (!zxPressed) {coinSound.currentTime = 0.2; coinSound.play(); zxPressed = true;}myGamePiece.speedX += 1.5;} else {zxPressed = false;}
    if (keys["h"] && !hPressed) { sonicboom.currentTime = 1.78; sonicboom.play(); hitboxesShown = !hitboxesShown; hPressed = true; }
    if (!keys["h"]) hPressed = false;

    myGamePiece.newPos();
    myGamePiece.update();
}