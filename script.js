let myGamePiece;
let myObstacles = [];
let myCoins = [];
let lengthOfPiece = 60;
let score = 0;
let maxScore = 0;
let amount = 150;
let maxSize = 40;
let level = 1;
const tryAgainButton = document.getElementById("tryagain");
const scoreHtml = document.getElementById("score");
const maxScoreHtml = document.getElementById("maxScore");
const levelHtml = document.getElementById("level");
const levelPopUpHtml = document.getElementById("levelPopUp");

function startGame() {
    myGamePiece = new component(lengthOfPiece, lengthOfPiece, "darkblue", 500, (window.innerHeight / 2) - 30);
    myGameArea.start();
}

function tryAgain() {
    level = 1;
    score = 0;
    amount = 150;
    maxSize = 40;
    levelHtml.innerHTML = `Level ${level}`;
    levelPopUpHtml.hidden = true;
    scoreHtml.innerHTML = `Score: 0`;
    myObstacles = [];
    myCoins = [];
    console.log("Score this round: ", score);

    startGame();
    tryAgainButton.hidden = true;
}

let myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = screen.width - 20;
        this.canvas.height = screen.height - 112;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 5);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        });
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
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

function component(width, height, color, x, y) {
    this.gamearea = myGameArea;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.update = function () {
        const ctx = myGameArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
            myGameArea.stop();
            tryAgainButton.hidden = false;
            if (score > maxScore) {
                maxScore = score;
            }
            maxScoreHtml.innerHTML = `Max Score: ${maxScore}`;
            return;
        }
    }

    // Coin collection
    for (let i = 0; i < myCoins.length; i++) {
        if (myGamePiece.crashWith(myCoins[i])) {
            myCoins.splice(i, 1);
            score++;
            scoreHtml.innerHTML = `Score: ${score}`;
            break;
        }
    }

    // Level change logic
    if (everyinterval(1500) && myGameArea.frameNo !== 0) {
        level++;
        levelHtml.innerHTML = `Level ${level}`;
        levelPopUpHtml.innerHTML = `Level ${level}`;
        levelPopUpHtml.hidden = false;
        setTimeout(() => {
            levelPopUpHtml.hidden = true;
        }, 750);
        amount -= 20;
        maxSize += 20;
    }

    // Create obstacle

    myGameArea.clear();
    myGameArea.frameNo++;
    if (myGameArea.frameNo === 1 || everyinterval(amount)) {
        const h = Math.floor(Math.random() * (maxSize - 40 + 1) + 40);
        const x = myGameArea.canvas.width;
        const y = Math.floor(Math.random() * myGameArea.canvas.height);
        myObstacles.push(new component(h, h, "darkred", x, y));
    }

    // Update obstacles
    myObstacles.forEach((obstacle) => {
        obstacle.x -= 1.2;
        obstacle.update();
    });
    myObstacles = myObstacles.filter(o => o.x + o.width > 0);

    // Create coin
    if (myGameArea.frameNo === 1 || everyinterval(1000)) {
        const h = Math.floor(Math.random() * (25 - 15 + 1) + 15);
        const x = myGameArea.canvas.width;
        const y = Math.floor(Math.random() * myGameArea.canvas.height);
        myCoins.push(new component(h, h, "gold", x, y));
    }

    // Update coins
    myCoins.forEach((coin) => {
        coin.x -= 1.5;
        coin.update();
    });
    myCoins = myCoins.filter(c => c.x + c.width > 0);

    // Movement
    if (myGameArea.keys && myGameArea.keys[37]) { myGamePiece.speedX = -2; }
    if (myGameArea.keys && myGameArea.keys[39]) { myGamePiece.speedX = 1; }
    if (myGameArea.keys && myGameArea.keys[38]) { myGamePiece.speedY = -1; }
    if (myGameArea.keys && myGameArea.keys[40]) { myGamePiece.speedY = 1; }

    myGamePiece.newPos();
    myGamePiece.update();
}