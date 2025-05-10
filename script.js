let myGamePiece;
let myObstacles = [];
let myCoins = [];
let isGameOver = false;
const lengthOfPiece = 60;
const difficultyRampInterval = 1500; // frames
const playerColour = "darkblue";
const obstacleColour = "darkred";
const coinColor = "gold";
let score = 0;
let maxScore = 0;
let amount = 150;
let maxSize = 40;
let level = 1;
let obstacleSpeed = 1.2;
const coinSound = new Audio("/sounds/coin_collect.mp3");
const sonicboom = new Audio("/sounds/plane_sonicboom.mp3");
const deathSound = new Audio("/sounds/videogame-death-sound.mp3");
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

function showCredits() {
    document.getElementById("credits").style.display = "block";
}

function hideCredits() {
    document.getElementById("credits").style.display = "none";
}

function startNormalMode() {
    amount = 150;
    maxSize = 40;
    hideMenuAndStart(startGame);
}

function startHardMode() {
    amount = 100;
    maxSize = 60;
    obstacleSpeed = 1.5;
    hideMenuAndStart(startGame);
}
function startEndlessMode() {
    amount = 60;
    maxSize = 40;
    obstacleSpeed = 1.8;
    hideMenuAndStart(startGame);
}
function startGame() {
    myGamePiece = new component(lengthOfPiece, lengthOfPiece, playerColour, 500, (window.innerHeight / 2) - 30);
    myGameArea.start();
}

function tryAgain() {
    levelHtml.style.color = "black"
    scoreHtml.style.color = "black"
    maxScoreHtml.style.color = "black"
    deathOverlay.style.opacity = "0";
    deathOverlay.style.pointerEvents = "none";
    isGameOver = false;
    level = 1;
    score = 0;
    amount = 150;
    maxSize = 40;
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
        levelHtml.style.color = "black"
        scoreHtml.style.color = "black"
        maxScoreHtml.style.color = "black"
    }, 200); // slight delay to allow reflow and trigger transition    
}

function gameOver() {
    myGameArea.stop();
    isGameOver = true;
    // sonicboom.currentTime = 1.78;
    // sonicboom.play();
    try {
        deathSound.currentTime = 1.45;
        deathSound.play();
    } catch (e) {
        console.warn("Death sound blocked or failed:", e);
    }
    console.log("Score this round: ", score);
    // document.getElementById("finalScoreText").innerText = `Score: ${score}`;
    deathOverlay.style.opacity = "1";
    deathOverlay.style.pointerEvents = "auto";
    tryAgainButton.hidden = false;
    backButton.hidden = false;

    levelHtml.style.color = scoreHtml.style.color = maxScoreHtml.style.color = "white";

    if (score > maxScore) maxScore = score;
    maxScoreHtml.innerHTML = `Max Score: ${maxScore}`;

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
    this.type = type; // "rect" or "coin"
    this.shineOffset = Math.random() * Math.PI * 2;
    this.speedX = 0;
    this.speedY = 0;

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
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            this.shineOffset += 0.05;
            if (this.shineOffset > Math.PI * 2) this.shineOffset = 0;

        } else {
            // Default rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    };
    this.crashWith = function (other) {
        return !(
            this.y + this.height < other.y ||
            this.y > other.y + other.height ||
            this.x + this.width < other.x ||
            this.x > other.x + other.width
        );
    };
}

function updateGameArea() {
    myGamePiece.speedX = -0.6;
    myGamePiece.speedY = 0;
    // AI Improvement?
    // myGamePiece.speedX = Math.max(Math.min(myGamePiece.speedX, 5), -5);
    // myGamePiece.speedY = Math.max(Math.min(myGamePiece.speedY, 5), -5);

    // Boundaries
    if (myGamePiece.x <= 0) {
        myGamePiece.speedX = 0;
        myGamePiece.x = 0;
    }
    if (myGamePiece.y <= 0) {
        myGamePiece.speedY = 0;
        myGamePiece.y = 0;
    }
    if (myGamePiece.y >= myGameArea.canvas.height - lengthOfPiece) {
        myGamePiece.speedY = 0;
        myGamePiece.y = myGameArea.canvas.height - lengthOfPiece;
    }

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
            // coinSound.currentTime = 0.2;
            // coinSound.play();
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
        amount = Math.max(60, amount - 10); // spawn obstacles more often
        maxSize = Math.min(100, maxSize + 5); // increase obstacle size
        obstacleSpeed += 0.1; // increase movement speed
    }

    // Create obstacle

    myGameArea.clear();
    myGameArea.frameNo++;
    if (myGameArea.frameNo === 1 || everyinterval(amount)) {
        const h = randomNum(maxSize, 40)
        const x = myGameArea.canvas.width;
        const y = Math.floor(Math.random() * myGameArea.canvas.height);
        myObstacles.push(new component(h, h, obstacleColour, x, y));
    }

    // Update obstacles
    myObstacles.forEach((obstacle) => {
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
        coin.x -= obstacleSpeed + 0.3;
        coin.update();
    });
    myCoins = myCoins.filter(c => c.x + c.width > 0);

    // Movement
    const keys = myGameArea.keys || {};
    if (keys["ArrowLeft"]) myGamePiece.speedX -= 2;
    if (keys["ArrowRight"]) myGamePiece.speedX += 2;
    if (keys["ArrowUp"]) myGamePiece.speedY -= 1;
    if (keys["ArrowDown"]) myGamePiece.speedY += 1;

    myGamePiece.newPos();
    myGamePiece.update();
}