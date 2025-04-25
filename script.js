let myGamePiece;
let myObstacles = [];
let myCoins = [];
let lengthOfPiece = 60
let score = 0
let maxScore = 0
let amount = 150
let maxSize = 40
let level = 1;
const tryAgainButton = document.getElementById("tryagain")
const scoreHtml = document.getElementById("score")
const maxScoreHtml = document.getElementById("maxScore")
const levelHtml = document.getElementById("level")
const levelPopUpHtml = document.getElementById("levelPopUp")
function startGame() {
    myGamePiece = new component(lengthOfPiece, lengthOfPiece, "darkblue", 500, (788 / 2) - 30);
    myGameArea.start();
}
function tryAgain() {
    level = 1
    score = 0
    amount = 150
    maxSize = 40;
    levelHtml.innerHTML = `Level 1`
    levelPopUpHtml.hidden = true
    scoreHtml.innerHTML = `Score: 0`
    myObstacles = []
    myCoins = []
    console.log("Score this round: ",score);
    
    startGame()
    tryAgainButton.hidden = true
}

let myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        x = 0
        y = 0
        this.canvas.width = screen.width - 20;
        this.canvas.height = screen.height - 112;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 0);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function () {
        clearInterval(this.interval);
    }
}

function everyinterval(n) {
    if ((myGameArea.frameNo / n) % 1 == 0) { return true; }
    return false;
}

function component(width, height, color, x, y) {
    this.gamearea = myGameArea;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.update = function () {
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    }
    this.crashWith = function (otherobj) {
        let myleft = this.x;
        let myright = this.x + (this.width);
        let mytop = this.y;
        let mybottom = this.y + (this.height);
        let otherleft = otherobj.x;
        let otherright = otherobj.x + (otherobj.width);
        let othertop = otherobj.y;
        let otherbottom = otherobj.y + (otherobj.height);
        let crash = true;
        if ((mybottom < othertop) ||
            (mytop > otherbottom) ||
            (myright < otherleft) ||
            (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}
function updateGameArea() {
    // Default movement
    myGamePiece.speedX = -0.6;
    myGamePiece.speedY = 0;

    // Boundaries
    if (myGamePiece.x <= 0) {
        myGamePiece.speedX = 0
        myGamePiece.x = 0
    }
    if (myGamePiece.y <= 0) {
        myGamePiece.speedY = 0
        myGamePiece.y = 0
    }
    if (myGamePiece.y >= myGameArea.canvas.height - lengthOfPiece) {
        myGamePiece.speedY = 0
        myGamePiece.y = myGameArea.canvas.height - lengthOfPiece
    }
    // Crash
    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            myGameArea.stop();
            tryAgainButton.hidden = false
            if (score>maxScore) {
                maxScore = score
            }
            maxScoreHtml.innerHTML = `Max Score: ${maxScore}`
        }
    }

    // Coin collect
    for (i = 0; i < myCoins.length; i += 1) {
        if (myGamePiece.crashWith(myCoins[i])) {
            myCoins = []
            score++
            
            scoreHtml.innerHTML = `Score: ${score}`
        }
    }
    // Levels
    if (everyinterval(1500) && myGameArea.frameNo !== 0) {
        level++
        levelHtml.innerHTML = `Level ${level}`
        levelPopUpHtml.innerHTML = `Level ${level}`
        levelPopUpHtml.hidden = false
        const timout = setTimeout(hide,750)
        function hide(){
            levelPopUpHtml.hidden = true
        }
        amount = amount - 20;
        maxSize = maxSize + 20;
    }
    // Create obstacles
    let x, y;
    myGameArea.clear();
    myGameArea.frameNo += 1;
    if (myGameArea.frameNo == 1 || everyinterval(amount)) {
        h = Math.floor(Math.random() * (maxSize - 40 + 1) + 40)
        x = myGameArea.canvas.width;
        y = Math.floor(Math.random() * myGameArea.canvas.height)
        myObstacles.push(new component(h, h, "darkred", x, y));
    }
    for (i = 0; i < myObstacles.length; i += 1) {
        myObstacles[i].x += -1.2;
        myObstacles[i].update();
    }

    // Create coin
    if (myGameArea.frameNo == 1 || everyinterval(1000)) {
        h = Math.floor(Math.random() * (25 - 15 + 1) + 15)
        x = myGameArea.canvas.width;
        y = Math.floor(Math.random() * myGameArea.canvas.height)
        myCoins.push(new component(h, h, "gold", x, y));
    }
    for (i = 0; i < myCoins.length; i += 1) {
        myCoins[i].x += -1.5;
        myCoins[i].update();
    }

    //Movement
    if (myGameArea.keys && myGameArea.keys[37]) { myGamePiece.speedX = -2; }
    if (myGameArea.keys && myGameArea.keys[39]) { myGamePiece.speedX = 1; }
    if (myGameArea.keys && myGameArea.keys[38]) { myGamePiece.speedY = -1; }
    if (myGameArea.keys && myGameArea.keys[40]) { myGamePiece.speedY = 1; }
    myGamePiece.newPos();
    myGamePiece.update();
}