let myGamePiece;
let myObstacles = [];
let myCoins = [];
let myBullets = [];
let debrisParticles = [];

const bulletTypes = [
    {
        name: "Normal",
        color: "red",
        speed: 9,
        damage: 1,
        fireRate: 800, // milliseconds between shots
        unlocked: true
    },
    {
        name: "Explosive",
        color: "orange",
        speed: 8,
        damage: 3,
        fireRate: 1200,
        cost: 2,
        splash: true,
        levelRequired: 2,
        unlocked: false
    },
    {
        name: "Fast",
        color: "cyan",
        speed: 14,
        damage: 1,
        fireRate: 600,
        cost: 3,
        levelRequired: 3,
        unlocked: false
    },
    {
        name: "Laser",
        color: "magenta",
        speed: 15,
        damage: 5,
        fireRate: 300,
        cost: 5,
        levelRequired: 5,
        unlocked: false
    }
];
let currentBulletIndex = 0;
let isPaused = false;         // runtime flag used by pause/resume logic
let lastTimestamp = 0;        // used by gameLoop to keep stable delta
let lastPauseToggle = 0;
let pKeyLocked = false;
let bulletCooldown = 250; // ms
let lastBulletTime = 0;

class DebrisParticle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color || "gray";
        this.velocity = {
            x: ((Math.random() - 0.3) * 8) * Math.random() * (speed / 4),
            y: (Math.random() - 0.5) * 4
        };
        this.alpha = 5;
        this.decay = 0.02 + Math.random() * 0.05;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    isAlive() {
        return this.alpha > 0;
    }
}

const difficultyRampInterval = 1500; // frames
const coinColor = "gold";
const playerStartX = 500;
const playerStartY = (window.innerHeight / 2) - 30;
const playerWidth = 87.5;
const playerHeight = 52.5;
const GameState = {
    score: 0,
    maxScore: 0,
    level: 1,
    paused: false,
    isGameOver: false,
    hitboxesShown: false,
    zxPressed: false,
    pPressed: false,
    hPressed: false,
    fPressed: false,
    slotPressed: false,
    toggledCredits: false,
    toggledInsructions: false,
    lastTime: 0,
    lastHitboxToggle: 0,
    lastFire: 0,
    lastRestartPress: 0,
    lastSlotChange: 0,
    friction: 1,
    elapsedTime: 0
};

function gameLoop(timestamp) {
    // Keep timestamp stable after resume/pause
    if (!lastTimestamp) lastTimestamp = timestamp;

    // If paused, just update lastTimestamp and continue loop (do not run update)
    if (isPaused || GameState.paused || GameState.isGameOver) {
        lastTimestamp = timestamp;
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    GameState.elapsedTime += delta;

    // Call your existing update with delta
    updateGameArea(delta);

    requestAnimationFrame(gameLoop);
}

const coinSound = new Audio("/sounds/coin_collect.mp3");
const sonicboom = new Audio("/sounds/plane_sonicboom.mp3");
const deathSound = new Audio("/sounds/videogame-death-sound.mp3");

let rocketImage = new Image();
rocketImage.src = "images/rocketship.png";

let rocketImage2 = new Image();
rocketImage2.src = "images/rocketship2.png";

const asteroidImage = new Image();
asteroidImage.src = "images/asteroid.png";

coinSound.preload = "auto";
sonicboom.preload = "auto";
deathSound.preload = "auto";
const menu = document.getElementById("menu")
const scoreHtml = document.getElementById("score");
const maxScoreHtml = document.getElementById("maxScore");
const levelHtml = document.getElementById("level");
// const pauseButton = document.getElementById("pauseButton")
const bulletSlots = document.getElementById("bulletSlotWrapper")
const levelPopUpHtml = document.getElementById("levelPopUp");
const deathOverlay = document.getElementById("deathOverlay")
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");
const tryAgainPauseBtn = document.getElementById("tryAgainPauseBtn");
const backPauseBtn = document.getElementById("backPauseBtn");
pauseOverlay.classList.remove("visible");
pauseOverlay.style.opacity = "0";
pauseOverlay.style.pointerEvents = "none";
pauseOverlay.style.display = "none";

const settings = {
    Normal: { amount: 150, maxSize: 40, obstacleSpeed: 1.2 },
    Hard: { amount: 100, maxSize: 60, obstacleSpeed: 1.5 },
    Extreme: { amount: 60, maxSize: 80, obstacleSpeed: 1.8 }
};

function startGameMode(modef) {
    amount = settings[modef].amount;
    maxSize = settings[modef].maxSize;
    obstacleSpeed = settings[modef].obstacleSpeed;
    mode = modef;
    friction = 1
    hideMenuAndStart(startGame);
}

function hideMenuAndStart(callback) {
    scoreHtml.hidden = false
    maxScoreHtml.hidden = false
    // pauseButton.hidden = false
    bulletSlots.style.opacity = 1;
    levelHtml.innerHTML = `Level ${GameState.level} (${mode} mode)`;
    levelHtml.hidden = false
    menu.classList.add("hidden");
    callback(); // Start the game
    setTimeout(() => {
        menu.style.display = "none";
    }, 500); // match the transition duration
}

function toggleCredits() { if (GameState.toggledCredits) { document.getElementById("credits").style.display = "none"; } else { document.getElementById("credits").style.display = "block"; } GameState.toggledCredits = !GameState.toggledCredits }
function hideCredits() { document.getElementById("credits").style.display = "none"; }
function toggleInstructions() { if (GameState.toggledInsructions) { document.getElementById("instructions").style.display = "none"; } else { document.getElementById("instructions").style.display = "block"; } GameState.toggledInsructions = !GameState.toggledInsructions }
function hideInstructions() { document.getElementById("instructions").style.display = "none"; }

function startNormalMode() { startGameMode('Normal') }
function startHardMode() { startGameMode('Hard') }
function startExtremeMode() { startGameMode('Extreme') }

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
            myGameArea.keys = myGameArea.keys || {};
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

function startGame() {
    GameState.isGameOver = false;
    myGamePiece = new component(playerWidth, playerHeight, rocketImage2, playerStartX, playerStartY, "image");
    myGameArea.start();
    console.log("Amount: ", amount, " Max Size: ", maxSize, " Obstacle Speed: ", obstacleSpeed, " Friction: ", GameState.friction);
    lastTimestamp = 0;
    // requestAnimationFrame(gameLoop);
}

function tryAgain() {
    // pauseButton.hidden = false;
    bulletSlots.style.opacity = 1;
    deathOverlay.style.opacity = "0";
    deathOverlay.style.pointerEvents = "none";

    GameState.isGameOver = false;
    GameState.level = 1;
    GameState.score = 0;

    amount = settings[mode].amount;
    maxSize = settings[mode].maxSize;
    obstacleSpeed = settings[mode].obstacleSpeed;
    GameState.friction = 1;

    levelHtml.innerHTML = `Level ${GameState.level} (${mode} mode)`;
    levelPopUpHtml.hidden = true;
    scoreHtml.innerHTML = `Score: 0`;
    myObstacles = [];
    myCoins = [];
    myBullets = [];
    debrisParticles = [];
    startGame();
    hideGameOverScreen()
}
function back(delay) {
    deathOverlay.style.opacity = "0";
    deathOverlay.style.pointerEvents = "none";
    GameState.level = 1;
    GameState.score = 0;
    GameState.isGameOver = true;
    levelHtml.innerHTML = `Level ${GameState.level} (${mode} mode)`;
    levelPopUpHtml.hidden = true;
    levelHtml.hidden = true;
    scoreHtml.hidden = true;
    maxScoreHtml.hidden = true;
    // pauseButton.hidden = true;
    // bulletSlots.style.opacity = 0;
    scoreHtml.innerHTML = `Score: 0`;
    myObstacles = [];
    myCoins = [];
    myBullets = [];
    debrisParticles = [];
    menu.style.display = "flex"; // or 'block'
    if (delay){
        setTimeout(() => {
            menu.classList.remove("hidden"); // fade in smoothly
            hideGameOverScreen()
            levelHtml.style.color = scoreHtml.style.color = maxScoreHtml.style.color = "white";
        }, 200); // slight delay to allow reflow and trigger transition
        return
    }
    menu.classList.remove("hidden"); // fade in smoothly
    hideGameOverScreen()
    levelHtml.style.color = scoreHtml.style.color = maxScoreHtml.style.color = "white";
}

function gameOver() {
    console.log("You Died");
    GameState.paused = false;
    myGameArea.stop();
    GameState.isGameOver = true;
    myGamePiece.speedX = 0;
    myGamePiece.speedY = 0;
    try {
        deathSound.currentTime = 1.45;
        deathSound.play();
    } catch (e) {
        console.warn("Death sound blocked or failed:", e);
    }
    deathOverlay.style.opacity = "1";
    deathOverlay.style.pointerEvents = "auto";
    pauseOverlay.classList.remove("visible");
    pauseOverlay.style.opacity = "0";
    pauseOverlay.style.pointerEvents = "none";

    showGameOverScreen(GameState.score)
    // pauseButton.hidden = true;
    bulletSlots.style.opacity = 0;

    if (GameState.score > GameState.maxScore) GameState.maxScore = GameState.score;
    maxScoreHtml.innerHTML = `High Score: ${GameState.maxScore}`;
}

function showGameOverScreen(score) {
    const wrapper = document.getElementById("gameover-wrapper");
    const scoreText = document.getElementById("finalScoreText");
    scoreText.textContent = `Final Score: ${score}`;
    wrapper.classList.add("visible");
}

function hideGameOverScreen() {
    document.getElementById("gameover-wrapper").classList.remove("visible");
}

function fireBullet() {
    const bulletType = bulletTypes[currentBulletIndex];

    const currentBullet = {
        x: myGamePiece.x + myGamePiece.width - 24,
        y: myGamePiece.y + myGamePiece.height / 2 - 7,
        width: 35,
        height: 12,
        speed: bulletType.speed,
        color: bulletType.color,
        damage: bulletType.damage
    };
    const bullet = new component(currentBullet.width, currentBullet.height, currentBullet.color, currentBullet.x, currentBullet.y, "rect");
    bullet.speedX = currentBullet.speed;
    myBullets.push(bullet);
    GameState.lastFire = GameState.elapsedTime;
}

function switchBullet(direction) {
    let newIndex = currentBulletIndex;
    for (let i = 0; i < bulletTypes.length; i++) {
        newIndex = (newIndex + direction + bulletTypes.length) % bulletTypes.length;
        if (bulletTypes[newIndex].unlocked) {
            currentBulletIndex = newIndex;
            updateBulletSlotUI(currentBulletIndex);
            console.log(direction, bulletTypes[currentBulletIndex].name);
            return;
        } else {
            const slot = document.getElementById(`bulletSlot${newIndex}`);
            slot.classList.add("locked");
            setTimeout(() => slot.classList.remove("locked"), 300);
            return;
        }
    }
}


function updateBulletSlotUI(currentBulletIndex) {
    const slot = document.getElementById(`bulletSlot${currentBulletIndex}`);
    const selector = document.getElementById("bulletSlotSelector");

    if (!slot || !selector) return;

    const slotRect = slot.getBoundingClientRect();
    const wrapperRect = document.getElementById("bulletSlotWrapper").getBoundingClientRect();

    const offsetLeft = slotRect.left - wrapperRect.left + (slot.offsetWidth - selector.offsetWidth) / 2;
    selector.style.left = `${offsetLeft}px`;
}
// pauseButton.addEventListener("click", () => {
//     GameState.paused = !GameState.paused;

//     // Optional: Show or hide pause overlay text/buttons
//     const isPaused = GameState.paused;
//     document.getElementById("pauseOverlayWrapper")?.classList.toggle("show", isPaused);

//     pauseOverlay.classList.toggle("visible", GameState.paused);
//     pauseOverlay.style.opacity = GameState.paused ? "1" : "0";
//     pauseOverlay.style.pointerEvents = GameState.paused ? "auto" : "none";
//     if (GameState.paused) {
//         pauseButton.textContent = "▶ Play⏸"; // Play icon
//       } else {
//         pauseButton.textContent = "⏸ Pause"; // Pause icon
//       }
//     if (!GameState.paused) {
//         GameState.lastTime = performance.now(); // Reset animation timer
//         requestAnimationFrame(gameLoop);
//     }
// });

// Resume Button
function pauseGame() {
    if (GameState.isGameOver) return;   // never pause during game over
    if (isPaused) return;               // already paused
    isPaused = true;
    GameState.paused = true;
    // Show overlay
    pauseOverlay.style.display = "flex";
    pauseOverlay.classList.add("visible");
    pauseOverlay.style.opacity = "1";
    pauseOverlay.style.pointerEvents = "auto";
    showPauseOverlay = true;
}

function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    GameState.paused = false;
    // Hide overlay
    pauseOverlay.classList.remove("visible");
    pauseOverlay.style.opacity = "0";
    pauseOverlay.style.pointerEvents = "none";
    pauseOverlay.style.display = "none";
    // Reset timing guard to avoid delta jumps (if you use rAF elsewhere)
    lastTimestamp = performance.now();
    showPauseOverlay = false;
}


function tryAgainPause() {
    resumeGame();
    gameOver();
    tryAgain(); // your existing function resets game state
}

function backPause() {
    resumeGame();
    gameOver();
    back(false);
    // try {
    //     pauseOverlay.classList.remove("visible");
    //     pauseOverlay.style.opacity = "0";
    //     pauseOverlay.style.pointerEvents = "none";
    //     pauseOverlay.style.display = "none";
    // } catch (err) { /* element may not exist yet; ignore */ }

    // // Stop the game loop / interval and mark game over so nothing updates
    // try {
    //     myGameArea.stop();          // clears interval used by myGameArea.start()
    // } catch (err) { /* ignore if not created yet */ }

    // GameState.paused = false;
    // GameState.isGameOver = true;

    // // Hide in-game UI elements (same as your back() logic)
    // try {
    //     levelHtml.hidden = true;
    //     scoreHtml.hidden = true;
    //     maxScoreHtml.hidden = true;
    //     bulletSlots.style.opacity = 0;
    // } catch (err) { /* ignore if elements missing */ }

    // // Show the main menu (do not reset gameplay values here)
    // if (menu) {
    //     menu.style.display = "flex";
    //     // small timeout to allow CSS transitions to trigger
    //     setTimeout(() => menu.classList.remove("hidden"), 20);
    // }

    // // Hide any game-over screen if visible
    // hideGameOverScreen();
}


// Attach listeners (safe to attach now)
resumeBtn.addEventListener("click", resumeGame);
tryAgainPauseBtn.addEventListener("click", tryAgainPause);
backPauseBtn.addEventListener("click", backPause);

let pauseKeyHeld = false;

document.addEventListener("keydown", (e) => {
    if ((e.key === "p" || e.key === "P") && !pKeyLocked) {
        pKeyLocked = true;

        if (GameState.paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "p" || e.key === "P") {
        pKeyLocked = false;
    }
});

function togglePause() {
    if (!GameState.paused) {
        pauseGame();
    } else {
        resumeGame();
    }
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
            if (GameState.hitboxesShown) {
                ctx.strokeStyle = "lime";
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            ctx.drawImage(this.color, this.x, this.y, this.width, this.height);
        } else if (this.type === "rect") {
            // Draw a filled rectangle for bullets and any rect component
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            if (GameState.hitboxesShown) {
                ctx.strokeStyle = "lime";
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
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
    if (GameState.paused || GameState.isGameOver) return;
    myGamePiece.speedX = -0.6;
    myGamePiece.speedY = 0;

    // Define boundary offset for padding
    const boundaryPaddingX = 0;
    const boundaryPaddingY = 0;

    // Define boundaries dynamically based on game piece size and canvas size
    const leftBoundary = -18 + boundaryPaddingX;
    const topBoundary = 0 + boundaryPaddingY - 8;
    const rightBoundary = myGameArea.canvas.width - myGamePiece.width - boundaryPaddingX + 5;
    const bottomBoundary = myGameArea.canvas.height - myGamePiece.height - boundaryPaddingY + 8;
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
            GameState.score++;
            scoreHtml.innerHTML = `Score: ${GameState.score}`;
            myCoins.splice(i, 1);
            break;
        }
    }
    // Level change logic
    if (everyinterval(difficultyRampInterval) && myGameArea.frameNo !== 0) {
        GameState.level++;
        levelHtml.innerHTML = `Level ${GameState.level} (${mode} mode)`;
        levelPopUpHtml.innerHTML = `Level ${GameState.level}`;
        levelPopUpHtml.hidden = false;
        levelPopUpHtml.classList.add("visible");
        setTimeout(() => {
            levelPopUpHtml.classList.remove("visible");
        }, 1000);

        if (amount > 20) amount -= 20;
        if (maxSize < 200) maxSize += 3;
        obstacleSpeed += 0.3; // increase obstacle movement speed
        GameState.friction += 0.1; // increase player movement speed
        console.log(`Level Up!!! (${GameState.level})`);
        // console.log("Amount: ", amount, " Max Size: ", maxSize," Obstacle Speed: ", obstacleSpeed, " Friction: ", GameState.friction);

        bulletTypes.forEach((bullet, i) => {
            if (i == 0) { return }

            if (
                bullet.unlocked == false &&
                ((GameState.score >= bullet.cost) || (GameState.level >= bullet.levelRequired))
            ) {
                bullet.unlocked = true
                console.log("Unlocked:", bullet.name);
                let bulletSlot = document.getElementById(`bulletSlot${i}`)
                bulletSlot.innerHTML = ""
                // Optional: show a notification or sound
            }
        });
    }

    // Create obstacle

    myGameArea.clear();
    myGameArea.frameNo++;
    if (myGameArea.frameNo === 1 || everyinterval(amount)) {
        let height = randomNum(100, maxSize)
        const x = myGameArea.canvas.width;
        let y = randomNum(0, myGameArea.canvas.height - height)
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
        const h = randomNum(25, 35)
        const x = myGameArea.canvas.width;
        const y = Math.floor(Math.random() * myGameArea.canvas.height);
        myCoins.push(new component(h, h, coinColor, x, y, "coin"));
    }

    // Update coins
    myCoins.forEach((coin) => {
        coin.x -= obstacleSpeed - 0.4;
        coin.update();
    });
    myCoins = myCoins.filter(c => c.x + c.width > 0);

    // Update bullets
    myBullets.forEach((bullet, i) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        bullet.update();
    });
    // Remove bullets that go off screen
    myBullets = myBullets.filter(b => b.x < myGameArea.canvas.width && b.x > 0 && b.y > 0 && b.y < myGameArea.canvas.height);

    for (let i = myBullets.length - 1; i >= 0; i--) {
        const bullet = myBullets[i];
        for (let j = myObstacles.length - 1; j >= 0; j--) {
            const obstacle = myObstacles[j];
            if (bullet.crashWith(obstacle)) {
                for (let i = 0; i < 60; i++) {
                    debrisParticles.push(new DebrisParticle(
                        (obstacle.x + obstacle.width / 2) + Math.random() * 10 - 5,
                        (obstacle.y + obstacle.height / 2) + Math.random() * 10 - 5,
                        "gray?",
                        bulletTypes[currentBulletIndex].speed
                    ));
                }
                myBullets.splice(i, 1); // Remove bullet
                myObstacles.splice(j, 1); // Remove obstacle
                break;
            }
        }
    }

    // Update particles
    debrisParticles = debrisParticles.filter(p => p.isAlive());
    debrisParticles.forEach(p => p.update());

    // Draw particles
    debrisParticles.forEach(p => p.draw(myGameArea.context));

    if (currentBulletIndex > 3 || currentBulletIndex < 0) { currentBulletIndex = 0; }
    // Movement
    const keys = myGameArea.keys || {};
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) { myGamePiece.speedY -= 1.5; }
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) { myGamePiece.speedX -= 2; }
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) { myGamePiece.speedY += 1.5; }
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) { myGamePiece.speedX += 2; myGamePiece.color = rocketImage; if (myGamePiece.x > 500 && myGamePiece.x < 800 && 1 == 0) { myGamePiece.speedX += 1; }; } else { myGamePiece.color = rocketImage2; }
    if (keys["z"] && keys["x"]) { if (!GameState.zxPressed) { coinSound.currentTime = 0.2; coinSound.play(); GameState.zxPressed = true; } myGamePiece.speedX += 1.5; } else { GameState.zxPressed = false; }
    if (keys["r"] || keys["R"]) { gameOver(); tryAgain(); }
    // if (keys["p"] || keys["P"]) {
    //     if (!GameState.pPressed) {
    //         const now = performance.now();
    //         if (now - lastPauseToggle > 200) { // 200ms cooldown
    //             if (!isPaused) pauseGame(); else resumeGame();
    //             lastPauseToggle = now;
    //         }
    //         GameState.pPressed = true;
    //     }
    // } else {
    //     GameState.pPressed = false;
    // }
    if (keys["m"]) {
        // GameState.level +=2 
    }
    if ((keys["h"] || keys["H"]) && !GameState.hPressed && Date.now() - GameState.lastHitboxToggle > 300) { sonicboom.currentTime = 1.78; sonicboom.play(); GameState.hitboxesShown = !GameState.hitboxesShown; GameState.hPressed = true; GameState.lastHitboxToggle = Date.now(); }
    if (!keys["h"] || !keys["H"]) GameState.hPressed = false;
    // if (keys[" "] && !GameState.fPressed && Date.now() - GameState.lastFire > bulletTypes[currentBulletIndex].fireRate) { sonicboom.currentTime = 1.78; sonicboom.play(); fireBullet(); GameState.fPressed = true; GameState.lastFire = Date.now(); }
    // if (!keys[" "]) { GameState.fPressed = false; }
    if (keys[" "] || keys["Space"] || keys["f"] || keys["F"]) {const now = performance.now(); if (now - lastBulletTime > bulletTypes[currentBulletIndex].fireRate) {fireBullet(); lastBulletTime = now;}}
    if ((keys["e"] || keys["E"]) && !GameState.slotPressed && Date.now() - GameState.lastSlotChange > 300) { switchBullet(1); GameState.slotPressed = true; GameState.lastSlotChange = Date.now(); }
    if ((keys["q"] || keys["Q"]) && !GameState.slotPressed && Date.now() - GameState.lastSlotChange > 300) { switchBullet(-1); GameState.slotPressed = true; GameState.lastSlotChange = Date.now(); }
    if (!keys["e"] && !keys["E"] && !keys["q"] && !keys["Q"]) {GameState.slotPressed = false;}
      
    myGamePiece.speedX *= GameState.friction;
    myGamePiece.speedY *= GameState.friction;
    myGamePiece.newPos();
    myGamePiece.update();
}
window.addEventListener("load", () => {
    updateBulletSlotUI(currentBulletIndex);
});