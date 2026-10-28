const SEGMENTS = 10;

// ============================================================
// AIRSHIP / SPACE SHOOTER
// p5.js version (web) - converted from the Processing 4 sketch
// Controls: WASD = move | Mouse = aim | Left click = shoot
//           P = pause | R = restart after game over/victory
//           ESC = return to menu (handled in keyPressed)
// Images and sounds are optional: put them in the images/ and sounds/ folders next to index.html
//
// LEVEL MODE ORDER:
//   Level 1  Rock Breaker
//   Level 2  Asteroid Storm
//   Level 3  Boss (UFO, aimed shots)
//   Level 4  Alien Fleet (move + shoot STRAIGHT lines)      <-- NEW
//   DANGER screen "BOSS DIFFICULT" + skull                  <-- NEW
//   Level 5  Alien Warship (bullets + missiles, straight)   <-- NEW
// ============================================================

let player;
let bullets;
let enemies;
let enemyBullets;
let aliens;        // NEW
let missiles;    // NEW
let boss;
let finalBoss;            // NEW
let centipedeBoss;    // CHAPTER 2 FINAL BOSS

// Folder that holds the images, inside the sketch's data/ folder.
// "images/" -> data/images/ship.png   |   "" -> data/ship.png
const IMG_FOLDER = "images/";   // pictures go in this folder, next to index.html

let shipImg;     // player ship
let stoneImg;    // rocks
let ufoImg;      // level 3 boss (UFO)
let alienImg;    // stage 1, level 4 alien ships (alien.png)
let octopusImg;  // stage 2, level 3 creatures (aliencre.png)
let warshipImg;  // level 5 boss (alien warship)

const MENU = 0;
const LEVEL_ROCKS = 1;
const LEVEL_BOSS = 2;
const VICTORY = 3;
const GAME_OVER = 4;
const FREE_LANCE = 5;
const PAUSED = 6;
const LEVEL_ALIEN = 7;      // NEW
const DANGER = 8;           // NEW
const LEVEL_FINAL = 9;      // NEW

let gameState = MENU;
let previousState = LEVEL_ROCKS;
let selectedMode = 0; // 0 = Level Mode, 1 = Free Lance
let level = 1;
let score = 0;
let bestScore = 0;
let rocksDestroyed = 0;
let wave = 1;
let enemiesToSpawn = 0;
let spawnTimer = 0;
let bossSpawnScore = 2500;
let lastShotFrame = -100;
let shotCooldown = 9;
let messageTimer = 0;
let bannerMessage = "";

// ---------- SPELLS (power-ups) ----------
let powerUps;
const SPELL_HEAL = 0;      // heal to full
const SPELL_TRIPLE = 1;    // triple shot
const SPELL_FREEZE = 2;    // freeze enemies
let tripleTimer = 0;           // frames left (60 frames = 1 second)
let freezeTimer = 0;
let powerSpawnTimer = 720;     // frames until next spell appears
const TRIPLE_FRAMES = 600; // 10 seconds
const FREEZE_FRAMES = 300; // 5 seconds

// ---------- CHAPTER 2: THE SECOND STATEMENT OF GOD ----------
const LEVEL_C2 = 10;         // chapter 2 levels (1, 2, 3 are chosen by the 'level' variable)
const PORTAL = 11;           // portal waiting for the player after the Alien Warship dies
const CHAPTER_INTRO = 12;    // "You have reached the Second Statement of God"
const T_RAIDER = 0;          // tentacle ship kinds
const T_SAUCER = 1;
const T_BOMB = 2;

let chapter = 1;
let tShips;
let eggs;
let booms;
let c2Kills = 0;
let c2Goal = 30;                 // level 3: creatures to kill
let c2Timer = 0;
let level3Damage = 0.7;        // level 3: your bullets do 70% damage (10 -> 7)
let portalX = 400;
let portalY = 130;
let portalTimer = 0;
let introTimer = 0;
let victoryText = "";

let tRaiderImg;   // chapter 2 images
let tSaucerImg;
let tBombImg;
let tEggImg;
let centipedeEyeSheet;
let centipedeHeadSprite;

// Danger screen settings
let dangerTimer = 0;
let dangerDuration = 210;   // frames (about 3.5 seconds)
let dangerSkulls = 1;       // how many skulls to show

// Movement flags (lets you hold W+D etc. together)
let moveUp, moveDown, moveLeft, moveRight;

let mouseWasDown = false;
let backgroundAlpha = 35;

// ---------- SOUND ----------
// Put sound files in data/sounds/ (WAV, AIF or MP3). Press M in the game to mute / unmute.
const SND_FOLDER = "sounds/";
let soundMuted = false;
let sfxShoot;       // every left-click shot
let sfxExplosion;   // rocks, aliens, bosses, bombs exploding
let sfxSelect;      // choosing a game mode in the menu
let sfxPortal;      // portal opening
let sfxPowerup;     // collecting a spell

// Loads an image from the data folder and prints in the CONSOLE what happened.
// Looks in IMG_FOLDER first, then in data/ itself and a few common folder names,
// and also finds wrong capitalisation (Alien.png) or a hidden double extension (alien.png.png).


function gameDraw() {
  drawSpaceBackground();

  if (gameState == MENU) {
    drawMenu();
    return;
  }
  if (gameState == GAME_OVER) {
    drawEndScreen(false);
    return;
  }
  if (gameState == VICTORY) {
    drawEndScreen(true);
    return;
  }
  if (gameState == PAUSED) {
    drawWorldWithoutUpdates();
    drawPauseOverlay();
    return;
  }
  if (gameState == DANGER) {
    drawDangerScreen();
    return;
  }
  if (gameState == CHAPTER_INTRO) {
    drawChapterIntro();
    return;
  }

  updatePlayer();
  updateBullets();
  updatePowerUps();
  updateBooms();

  if (gameState == LEVEL_ROCKS) {
    updateLevelRocks();
  } else if (gameState == LEVEL_BOSS) {
    updateBossFight();
  } else if (gameState == LEVEL_ALIEN) {
    updateLevelAliens();
  } else if (gameState == LEVEL_FINAL) {
    updateFinalBoss();
  } else if (gameState == LEVEL_C2) {
    updateChapter2();
  } else if (gameState == PORTAL) {
    updatePortal();
  } else if (gameState == FREE_LANCE) {
    updateFreeLance();
  }

  checkPlayerHealth();
  drawPlayer();
  drawFreezeOverlay();
  drawHUD();

  if (messageTimer > 0) {
    drawBanner();
    messageTimer--;
  }
}

function isPlaying() {
  return gameState == LEVEL_ROCKS || gameState == LEVEL_BOSS ||
         gameState == LEVEL_ALIEN || gameState == LEVEL_FINAL ||
         gameState == LEVEL_C2 || gameState == PORTAL ||
         gameState == FREE_LANCE;
}

function clearProjectilesAndEnemies() {
  bullets = [];
  enemies = [];
  enemyBullets = [];
  aliens = [];
  missiles = [];
  powerUps = [];
  tShips = [];
  eggs = [];
  booms = [];
  boss = null;
  finalBoss = null;
  centipedeBoss = null;
}

function startAtMenu() {
  gameState = MENU;
  player = null;
  chapter = 1;
  clearProjectilesAndEnemies();
  moveUp = moveDown = moveLeft = moveRight = false;
}

function startGame(mode) {
  selectedMode = mode;
  player = new Player(width / 2.0, height - 90);
  clearProjectilesAndEnemies();
  moveUp = moveDown = moveLeft = moveRight = false;
  score = 0;
  level = 1;
  wave = 1;
  rocksDestroyed = 0;
  spawnTimer = 0;
  enemiesToSpawn = 0;
  lastShotFrame = -100;
  bossSpawnScore = 2500;
  tripleTimer = 0;
  freezeTimer = 0;
  powerSpawnTimer = 720;
  chapter = 1;

  if (selectedMode == 0) {
    gameState = LEVEL_ROCKS;
    spawnLevelRocks(3);
    showBanner("LEVEL 1 - ROCK BREAKER");
  } else {
    gameState = FREE_LANCE;
    spawnFreeWave();
    showBanner("FREE LANCE - SURVIVE!");
  }
}

function restartCurrentMode() {
  startGame(selectedMode);
}

function spawnLevelRocks(count) {
  enemies.length = 0;
  for (let i = 0; i < count; i++) {
    let p = randomEdgePosition();
    enemies.push(new Enemy(p.x, p.y, 76, 1));
  }
}
function spawnFreeWave() {
  enemies.length = 0;
  wave = 1;
  spawnTimer = 0;

  // Spawn three rocks at random screen edges.
  for (let i = 0; i < 3; i++) {
    let p = randomEdgePosition();
    enemies.push(new Enemy(p.x, p.y, random(42, 60), 1));
  }
}

function randomEdgePosition() {
  let side = int(random(4));
  if (side == 0) return createVector(random(width), -35);
  if (side == 1) return createVector(width + 35, random(height));
  if (side == 2) return createVector(random(width), height + 35);
  return createVector(-35, random(height));
}

function updatePlayer() {
  if (player == null) return;
  player.update();

  // Hold left mouse button for continuous firing.
  if ((mouseIsPressed || touchFire) && frameCount - lastShotFrame >= shotCooldown) {
    player.shoot();
    lastShotFrame = frameCount;
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.update();
    b.display();
    if (b.isOffScreen()) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let b = enemyBullets[i];
    b.update();
    b.display();
    if (b.isOffScreen()) {
      enemyBullets.splice(i, 1);
    } else if (player != null && player.canTakeDamage() &&
               dist(player.x, player.y, b.x, b.y) < 17) {
      player.takeDamage(8);
      enemyBullets.splice(i, 1);
    }
  }

  // Missiles: straight line, hit the player, or can be shot down.
  for (let i = missiles.length - 1; i >= 0; i--) {
    let m = missiles[i];
    m.update();
    m.display();
    let removeIt = m.isOffScreen();

    if (!removeIt && player != null && player.canTakeDamage() &&
        dist(player.x, player.y, m.x, m.y) < player.radius + 9) {
      player.takeDamage(15);
      removeIt = true;
    }

    if (!removeIt) {
      for (let j = bullets.length - 1; j >= 0; j--) {
        let b = bullets[j];
        if (dist(m.x, m.y, b.x, b.y) < 14) {
          bullets.splice(j, 1);
          score += 10;
          removeIt = true;
          break;
        }
      }
    }

    if (removeIt) missiles.splice(i, 1);
  }
}

function updateLevelRocks() {
  updateEnemies();

  if (enemies.length == 0) {
    if (level == 1) {
      level = 2;
      showBanner("LEVEL 2 - ASTEROID STORM");
      spawnLevelRocks(5);
    } else if (level == 2) {
      level = 3;
      gameState = LEVEL_BOSS;
      boss = new Boss(width / 2.0, -100, 100, 2);
      bullets.length = 0;
      enemyBullets.length = 0;
      showBanner("LEVEL 3 - BOSS ENCOUNTER");
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.update();
    e.display();

    if (player != null && player.canTakeDamage() &&
        dist(player.x, player.y, e.x, e.y) < player.radius + e.size * 0.38) {
      player.takeDamage(e.generation == 1 ? 12 : 7);
    }

    let destroyed = false;
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (dist(e.x, e.y, b.x, b.y) < e.size * 0.42 + 4) {
        bullets.splice(j, 1);
        destroyed = true;
        break;
      }
    }

    if (destroyed) {
      e.split(enemies);
      enemies.splice(i, 1);
      rocksDestroyed++;
      sfxExplosion.play();
      score += e.generation == 1 ? 25 : 10;
    }
  }
}

function updateBossFight() {
  updateEnemies();
  if (boss == null) return;

  boss.update(player.x, player.y);
  boss.display();

  if (player.canTakeDamage() &&
      dist(player.x, player.y, boss.x, boss.y) < player.radius + boss.size * 0.35) {
    player.takeDamage(18);
  }

  // Boss fires aimed shots on a cooldown.
  if (!frozen() && frameCount % max(22, 65 - level * 5) == 0 && boss.y > 50) {
    boss.shootAt(player.x, player.y, enemyBullets);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    if (dist(boss.x, boss.y, b.x, b.y) < boss.size * 0.42) {
      bullets.splice(i, 1);
      boss.takeDamage(1);
      score += 2;
    }
  }

  if (boss.currentHp <= 0) {
    // Boss 1 defeated -> go to the alien fleet level (instead of victory)
    sfxExplosion.play();
    score += 500;
    boss = null;
    level = 4;
    gameState = LEVEL_ALIEN;
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    spawnAliens();
    showBanner("LEVEL 4 - ALIEN FLEET");
  }
}

// ============================================================
// LEVEL 4 - ALIEN FLEET (moving ships, straight-line shots)
// ============================================================

function spawnAliens() {
  aliens.length = 0;
  let n = 5;
  for (let i = 0; i < n; i++) {
    let x = map(i, 0, n - 1, 100, width - 100);
    let rowY = 75 + (i % 2) * 75;          // two rows: y=75 and y=150
    let spd = 1.5 + (i % 3) * 0.4;
    aliens.push(new Alien(x, -40 - i * 35, rowY, spd, 4));
  }
}

function updateLevelAliens() {
  for (let i = aliens.length - 1; i >= 0; i--) {
    let a = aliens[i];
    a.update(enemyBullets);
    a.display();

    if (player.canTakeDamage() &&
        dist(player.x, player.y, a.x, a.y) < player.radius + a.size * 0.4) {
      player.takeDamage(10);
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (dist(a.x, a.y, b.x, b.y) < a.size * 0.45) {
        bullets.splice(j, 1);
        a.hp--;
        score += 5;
        if (a.hp <= 0) break;
      }
    }

    if (a.hp <= 0) {
      score += 50;
      sfxExplosion.play();
      aliens.splice(i, 1);
    }
  }

  if (aliens.length == 0) {
    startDanger();
  }
}

// ============================================================
// DANGER SCREEN + LEVEL 5 (final boss)
// ============================================================

function startDanger() {
  gameState = DANGER;
  dangerTimer = dangerDuration;
  bullets.length = 0;
  enemyBullets.length = 0;
  missiles.length = 0;
  powerUps.length = 0;
  // Small repair before the hard fight (delete this line if you don't want it).
  player.health = min(player.maxHealth, player.health + 30);
}

function drawDangerScreen() {
  let pulse = 0.5 + 0.5 * sin(frameCount * 0.25);

  // Red flashing overlay
  rectMode(CORNER);
  noStroke();
  fill(90 + 90 * pulse, 0, 0, 190);
  rect(0, 0, width, height);

  // Scrolling hazard stripes top and bottom
  let off = (frameCount * 2) % 60;
  fill(255, 200, 0);
  for (let i = -60 + off; i < width + 60; i += 60) {
    quad(i, 0, i + 30, 0, i + 10, 24, i - 20, 24);
    quad(i, height - 24, i + 30, height - 24, i + 10, height, i - 20, height);
  }

  drawCenteredTitle("DANGER", 135, 78, color(255, 60 + 160 * pulse, 60 + 160 * pulse));

  for (let i = 0; i < dangerSkulls; i++) {
    let cx = width / 2 + (i - (dangerSkulls - 1) / 2.0) * 120;
    drawSkull(cx, 295, 100, pulse);
  }

  drawCenteredTitle("BOSS DIFFICULT", 420, 38, color(255, 235, 235));
  fill(255, 200, 200);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Alien warship approaching...", width / 2, 468);

  dangerTimer--;
  if (dangerTimer <= 0) {
    startFinalBoss();
  }
}

function drawSkull(cx, cy, s, pulse) {
  noStroke();
  fill(240);
  ellipse(cx, cy - s * 0.1, s, s * 0.9);          // cranium
  rectMode(CENTER);
  rect(cx, cy + s * 0.38, s * 0.55, s * 0.35, 6); // jaw
  rectMode(CORNER);

  fill(255, 30 + 80 * pulse, 30);                 // glowing eyes
  ellipse(cx - s * 0.2, cy - s * 0.08, s * 0.24, s * 0.28);
  ellipse(cx + s * 0.2, cy - s * 0.08, s * 0.24, s * 0.28);

  fill(20);
  triangle(cx, cy + s * 0.05, cx - s * 0.06, cy + s * 0.18, cx + s * 0.06, cy + s * 0.18);

  stroke(20);
  strokeWeight(2);
  for (let i = -1; i <= 1; i++) {
    line(cx + i * s * 0.14, cy + s * 0.26, cx + i * s * 0.14, cy + s * 0.54);
  }
  noStroke();
}

function startFinalBoss() {
  level = 5;
  gameState = LEVEL_FINAL;
  finalBoss = new AlienBoss(width / 2.0, -120, 150);
  bullets.length = 0;
  enemyBullets.length = 0;
  missiles.length = 0;
  showBanner("LEVEL 5 - ALIEN WARSHIP");
}

function updateFinalBoss() {
  if (finalBoss == null) return;

  finalBoss.update();
  finalBoss.attack(enemyBullets, missiles);
  finalBoss.display();

  if (player.canTakeDamage() &&
      dist(player.x, player.y, finalBoss.x, finalBoss.y) < player.radius + finalBoss.size * 0.35) {
    player.takeDamage(20);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    if (dist(finalBoss.x, finalBoss.y, b.x, b.y) < finalBoss.size * 0.42) {
      bullets.splice(i, 1);
      finalBoss.takeDamage(1);
      score += 2;
    }
  }

  if (finalBoss.currentHp <= 0) {
    score += 1000;
    sfxExplosion.play();
    bestScore = max(bestScore, score);
    finalBoss = null;
    startPortal();   // end of the First Statement: a portal opens
  }
}

function updateFreeLance() {
  updateEnemies();

  // Increase difficulty as score rises.
  let targetWave = 1 + Math.floor(score / 400);
  if (targetWave > wave) {
    wave = targetWave;
    showBanner("WAVE " + wave + " - DANGER INCREASING");
  }

  spawnTimer++;
  let maxOnScreen = min(4 + wave * 2, 20);
  let spawnDelay = max(14, 75 - wave * 4);

  if (!frozen() && enemies.length < maxOnScreen && spawnTimer >= spawnDelay) {
    spawnTimer = 0;
    let p = randomEdgePosition();
    let size = random(36, 66);
    enemies.push(new Enemy(p.x, p.y, size, 1));
    if (wave >= 3 && random(1) < 0.35) {
      let p2 = randomEdgePosition();
      enemies.push(new Enemy(p2.x, p2.y, random(24, 40), 2));
    }
  }

  // A mini-boss appears at score milestones.
  if (score >= bossSpawnScore && boss == null) {
    boss = new Boss(width / 2.0, -100, 35 + wave * 5, wave);
    bossSpawnScore += 2500;
    showBanner("ELITE CORE INCOMING!");
  }

  if (boss != null) {
    boss.update(player.x, player.y);
    boss.display();
    if (!frozen() && frameCount % max(18, 55 - wave * 3) == 0 && boss.y > 45) {
      boss.shootAt(player.x, player.y, enemyBullets);
    }

    if (player.canTakeDamage() &&
        dist(player.x, player.y, boss.x, boss.y) < player.radius + boss.size * 0.32) {
      player.takeDamage(18);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      if (dist(boss.x, boss.y, b.x, b.y) < boss.size * 0.4) {
        bullets.splice(i, 1);
        boss.takeDamage(1);
        score += 3;
      }
    }

    if (boss.currentHp <= 0) {
      score += 400;
      sfxExplosion.play();
      boss = null;
      showBanner("ELITE CORE DESTROYED +400");
    }
  }
}

function checkPlayerHealth() {
  if (player != null && player.health <= 0) {
    bestScore = max(bestScore, score);
    gameState = GAME_OVER;
  }
}

function drawSpaceBackground() {
  if (chapter == 2) background(6, 26, 32);   // chapter 2: dark teal space
  else background(5, 8, 22);
  randomSeed(25);
  noStroke();
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let a = 70 + 150 * noise(x * 0.01, y * 0.01);
    fill(160, 190, 255, a);
    ellipse(x, y, random(1, 3), random(1, 3));
  }
  randomSeed(frameCount);
}

function drawPlayer() {
  if (player != null) {
    player.display();
  }
}

function drawHUD() {
  if (player == null) return;

  // Player HP bar
  noStroke();
  fill(55, 60, 80);
  rectMode(CORNER);
  rect(18, 18, 205, 20, 5);
  fill(player.health > 35 ? color(40, 220, 120) : color(255, 65, 75));
  rect(18, 18, 205 * constrain(player.health / player.maxHealth, 0, 1), 20, 5);
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(13);
  text("HULL " + int(max(0, player.health)) + "/" + int(player.maxHealth), 24, 28);

  fill(255);
  textAlign(RIGHT, TOP);
  textSize(18);
  text("SCORE  " + score, width - 20, 18);
  textSize(13);
  fill(175, 200, 235);
  text("BEST  " + bestScore, width - 20, 42);

  textAlign(LEFT, TOP);
  if (selectedMode == 0) {
    fill(120, 210, 255);
    text("LEVEL MODE  |  " + (chapter == 2 ? "STATEMENT 2  |  " : "") + "LEVEL " + level, 20, 48);
    if (gameState == LEVEL_ROCKS) {
      text("ROCKS LEFT: " + enemies.length, 20, 66);
    } else if (gameState == LEVEL_ALIEN) {
      text("ALIENS LEFT: " + aliens.length, 20, 66);
    } else if (gameState == LEVEL_C2) {
      text(c2Status(), 20, 66);
    }
  } else {
    fill(210, 150, 255);
    text("FREE LANCE  |  WAVE " + wave, 20, 48);
  }

  if (gameState == LEVEL_BOSS || gameState == LEVEL_FINAL ||
      (selectedMode == 1 && boss != null)) {
    drawBossHealthBar();
  }
  if ((gameState == LEVEL_C2 || (gameState == PAUSED && previousState == LEVEL_C2)) &&
      level == 4 && centipedeBoss != null) {
    drawCentipedeHealthBar();
  }

  // Active spell timers
  let sy = 90;
  textAlign(LEFT, TOP);
  textSize(13);
  if (tripleTimer > 0) {
    fill(255, 220, 80);
    text("TRIPLE SHOT  " + ceil(tripleTimer / 60.0) + "s", 20, sy);
    sy += 18;
  }
  if (freezeTimer > 0) {
    fill(140, 220, 255);
    text("FREEZE  " + ceil(freezeTimer / 60.0) + "s", 20, sy);
  }
}

function drawBossHealthBar() {
  let name ;
  let hp ;
  let maxHp ;
  let barColor ;

  if (gameState == LEVEL_FINAL && finalBoss != null) {
    name = "ALIEN WARSHIP";
    hp = finalBoss.currentHp;
    maxHp = finalBoss.maxHp;
    barColor = color(255, 70, 70);
  } else if (boss != null) {
    name = "SYSTEM CORE";
    hp = boss.currentHp;
    maxHp = boss.maxHp;
    barColor = color(200, 55, 255);
  } else {
    return;
  }

  let barW = 360;
  let ratio = constrain(hp / maxHp, 0, 1);
  rectMode(CORNER);
  noStroke();
  fill(65, 50, 80);
  rect(width / 2 - barW / 2, 78, barW, 18, 5);
  fill(barColor);
  rect(width / 2 - barW / 2, 78, barW * ratio, 18, 5);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(13);
  text(name + "  " + max(0, hp) + " / " + maxHp, width / 2, 87);
}

function drawMenu() {
  drawCenteredTitle("STARFALL", 150, 56, color(100, 210, 255));
  fill(180, 200, 230);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("AIRSHIP COMBAT SIMULATION", width / 2, 198);
  textSize(14);
  fill(170, 185, 210);
  text("Choose your mission", width / 2, 250);

  drawMenuButton(width / 2 - 145, 290, 290, 62, "LEVEL MODE", "Missions and boss battles", color(35, 115, 190));
  drawMenuButton(width / 2 - 145, 370, 290, 62, "FREE LANCE MODE", "Endless survival and high score", color(125, 55, 175));

  fill(150, 170, 200);
  textSize(13);
  text("WASD to move  \u2022  Mouse to aim  \u2022  Hold click to fire  \u2022  P to pause", width / 2, 475);
  text("Tip: destroy rocks before they surround you.", width / 2, 500);
}

function drawCenteredTitle(title, y, size, c) {
  textAlign(CENTER, CENTER);
  textSize(size);
  fill(0, 0, 0, 100);
  text(title, width / 2 + 3, y + 4);
  fill(c);
  text(title, width / 2, y);
}

function drawMenuButton(x, y, w, h, title, subtitle, c) {
  let hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  stroke(hover ? color(230, 245, 255) : color(100, 140, 200));
  strokeWeight(hover ? 2.5 : 1);
  fill(red(c), green(c), blue(c), hover ? 245 : 200);
  rectMode(CORNER);
  rect(x, y, w, h, 10);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(title, x + w / 2, y + 22);
  fill(220, 230, 250);
  textSize(12);
  text(subtitle, x + w / 2, y + 45);
}

function drawEndScreen(won) {
  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, width, height);
  if (won) {
    drawCenteredTitle("MISSION COMPLETE", height / 2 - 95, 42, color(255, 220, 80));
    fill(220, 240, 255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(victoryText, width / 2, height / 2 - 38);
  } else {
    drawCenteredTitle("SHIP DESTROYED", height / 2 - 95, 44, color(255, 70, 85));
    fill(220, 230, 245);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Your run has ended.", width / 2, height / 2 - 38);
  }
  fill(255);
  textSize(24);
  text("SCORE  " + score, width / 2, height / 2 + 5);
  textSize(16);
  fill(180, 205, 235);
  text("Press R to retry  \u2022  Press ESC for menu", width / 2, height / 2 + 55);
}

function drawPauseOverlay() {
  fill(0, 0, 0, 175);
  rectMode(CORNER);
  rect(0, 0, width, height);
  drawCenteredTitle("PAUSED", height / 2 - 20, 48, color(120, 220, 255));
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("Press P to continue  \u2022  ESC for menu", width / 2, height / 2 + 35);
}

function drawWorldWithoutUpdates() {
  if (player != null) player.display();
  for (const b of bullets) b.display();
  for (const e of enemies) e.display();
  for (const a of aliens) a.display();
  for (const b of enemyBullets) b.display();
  for (const m of missiles) m.display();
  for (const p of powerUps) p.display();
  for (const s of tShips) s.display();
  for (const e of eggs) e.display();
  if (previousState == PORTAL) drawPortal();
  if (boss != null) boss.display();
  if (finalBoss != null) finalBoss.display();
  if (centipedeBoss != null) centipedeBoss.display();
  drawHUD();
}

function showBanner(msg) {
  bannerMessage = msg;
  messageTimer = 150;
}

function drawBanner() {
  rectMode(CENTER);
  noStroke();
  fill(5, 15, 35, 205);
  rect(width / 2, 130, 400, 42, 8);
  stroke(80, 190, 255, 180);
  noFill();
  rect(width / 2, 130, 400, 42, 8);
  noStroke();
  fill(225, 245, 255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(bannerMessage, width / 2, 130);
  rectMode(CORNER);
}

function mousePressed() {
  touchMode = false;           // a real mouse click means a computer
  startAudioSafely();
  if (gameState == MENU) {
    if (mouseX >= width / 2 - 145 && mouseX <= width / 2 + 145) {
      if (mouseY >= 290 && mouseY <= 352) { sfxSelect.play(); startGame(0); }
      else if (mouseY >= 370 && mouseY <= 432) { sfxSelect.play(); startGame(1); }
    }
  } else if (isPlaying()) {
    if (player != null && frameCount - lastShotFrame >= shotCooldown) {
      player.shoot();
      lastShotFrame = frameCount;
    }
  }
}

function keyPressed() {
  startAudioSafely();
  if (keyCode === ESCAPE) {
// prevent Processing from closing the sketch
    if (gameState == MENU) {
      return;
    } else {
      startAtMenu();
    }
    return;
  }

  if (key == 'w' || key == 'W') moveUp = true;
  if (key == 's' || key == 'S') moveDown = true;
  if (key == 'a' || key == 'A') moveLeft = true;
  if (key == 'd' || key == 'D') moveRight = true;

  if (key == 'm' || key == 'M') soundMuted = !soundMuted;

  if (key == 'p' || key == 'P') {
    if (gameState == PAUSED) {
      gameState = previousState;
    } else if (isPlaying()) {
      previousState = gameState;
      gameState = PAUSED;
    }
  }

  if ((gameState == GAME_OVER || gameState == VICTORY) && (key == 'r' || key == 'R')) {
    restartCurrentMode();
  }
}

function keyReleased() {
  if (key == 'w' || key == 'W') moveUp = false;
  if (key == 's' || key == 'S') moveDown = false;
  if (key == 'a' || key == 'A') moveLeft = false;
  if (key == 'd' || key == 'D') moveRight = false;
}

// ============================================================
// PLAYER
// ============================================================

class Player {
  x = 0;
  y = 0;
  speed = 4.5;
  maxHealth = 100;
  health = 100;
  radius = 17;
  invincibleUntil = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    let dx = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
    let dy = (moveDown ? 1 : 0) - (moveUp ? 1 : 0);
    if (dx != 0 && dy != 0) {   // keep diagonal speed the same
      dx *= 0.7071;
      dy *= 0.7071;
    }
    dx = constrain(dx + joyX, -1, 1);   // phone joystick adds smooth movement
    dy = constrain(dy + joyY, -1, 1);
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    this.x = constrain(this.x, this.radius, width - this.radius);
    this.y = constrain(this.y, this.radius, height - this.radius);
  }

  display() {
    if (frameCount < this.invincibleUntil && frameCount % 8 < 4) return;
    push();
    translate(this.x, this.y);
    rotate(atan2(aimY - this.y, aimX - this.x) + HALF_PI);
    if (shipImg != null) {
      image(shipImg, 0, 0, 42, 42);
    } else {
      noStroke();
      fill(70, 210, 255);
      triangle(0, -22, -15, 15, 0, 9);
      triangle(0, -22, 15, 15, 0, 9);
      fill(235);
      ellipse(0, 0, 9, 15);
    }
    pop();

    stroke(110, 180, 255, 100);
    strokeWeight(1);
    line(this.x, this.y, aimX, aimY);
    noStroke();
  }

  shoot() {
    sfxShoot.play();
    let angle = atan2(aimY - this.y, aimX - this.x);
    if (tripleTimer > 0) {
      bullets.push(new Bullet(this.x, this.y, angle - 0.16));
      bullets.push(new Bullet(this.x, this.y, angle));
      bullets.push(new Bullet(this.x, this.y, angle + 0.16));
    } else {
      bullets.push(new Bullet(this.x, this.y, angle));
    }
  }

  canTakeDamage() {
    return frameCount >= this.invincibleUntil;
  }

  takeDamage(amount) {
    if (!this.canTakeDamage()) return;
    this.health -= amount;
    this.invincibleUntil = frameCount + 45; // brief invincibility after hit
    if (this.health <= 0) {
      this.health = 0;
      gameState = GAME_OVER;
      bestScore = max(bestScore, score);
    }
  }
}

// ============================================================
// PLAYER BULLET
// ============================================================

class Bullet {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  speed = 12;

  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * this.speed;
    this.vy = sin(angle) * this.speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    noStroke();
    fill(80, 220, 255, 70);
    ellipse(this.x, this.y, 13, 13);
    fill(230, 255, 255);
    ellipse(this.x, this.y, 5, 5);
  }

  isOffScreen() {
    return this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10;
  }
}

// ============================================================
// ENEMY ROCKS
// ============================================================

class Enemy {
  x = 0;
  y = 0;
  size = 0;
  speed = 0;
  spin = random(TWO_PI);
  generation = 0;

  constructor(x, y, size, generation) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.generation = generation;
    this.speed = map(size, 15, 76, 2.8, 0.8);
    this.speed = constrain(this.speed, 0.8, 2.8);
  }

  update() {
    if (frozen()) return;
    this.spin += 0.025 * (76.0 / max(15, this.size));
    let angle = atan2(player.y - this.y, player.x - this.x);
    this.x += cos(angle) * this.speed;
    this.y += sin(angle) * this.speed;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.spin);
    if (stoneImg != null) {
      if (this.generation == 1) tint(255, 175, 175);
      else tint(155, 240, 190);
      image(stoneImg, 0, 0, this.size, this.size);
      noTint();
    } else {
      noStroke();
      fill(this.generation == 1 ? color(160, 90, 95) : color(80, 180, 130));
      beginShape();
      for (let i = 0; i < 9; i++) {
        let a = TWO_PI * i / 9.0;
        let r = this.size * this.randomForRock(i);
        vertex(cos(a) * r, sin(a) * r);
      }
      endShape(CLOSE);
      fill(205, 190, 170, 100);
      ellipse(-this.size * 0.12, -this.size * 0.1, this.size * 0.22, this.size * 0.14);
    }
    pop();
  }

  randomForRock(i) {
    return 0.36 + 0.12 * ((i * 7 + int(this.size)) % 5);
  }

  split(list) {
    // generation 1 = medium rock; generation 2 = tiny rock.
    if (this.generation == 1) {
      let newSize = 28;
      list.push(new Enemy(this.x - 12, this.y - 8, newSize, 2));
      list.push(new Enemy(this.x + 12, this.y + 8, newSize, 2));
    }
  }
}

// ============================================================
// BOSS (level 3 - UFO, aimed shots)
// ============================================================

class Boss {
  x = 0;
  y = 0;
  size = 0;
  speed = 0;
  maxHp = 0;
  currentHp = 0;
  tier = 0;
  direction = 1;
  entered = false;

  constructor(x, y, hp, tier) {
    this.x = x;
    this.y = y;
    this.maxHp = max(1, hp);
    this.currentHp = this.maxHp;
    this.tier = tier;
    this.size = tier >= 4 ? 125 : 145;
    this.speed = min(2.4, 1.0 + tier * 0.12);
  }

  update(px, py) {
    if (frozen()) return;
    if (!this.entered) {
      this.y += 1.5;
      if (this.y >= 105) this.entered = true;
      return;
    }

    // Boss patrols horizontally while subtly tracking the player.
    this.x += this.direction * this.speed;
    if (this.x < this.size / 2 || this.x > width - this.size / 2) this.direction *= -1;
    this.y += constrain((py - this.y) * 0.003, -0.5, 0.5);
    this.y = constrain(this.y, 75, 190);
  }

  shootAt(px, py, list) {
    let angle = atan2(py - this.y, px - this.x);
    list.push(new EnemyBullet(this.x, this.y + this.size * 0.25, angle, 3.2 + this.tier * 0.12));
    if (this.tier >= 3) {
      list.push(new EnemyBullet(this.x, this.y + this.size * 0.25, angle - 0.22, 3.0 + this.tier * 0.1));
      list.push(new EnemyBullet(this.x, this.y + this.size * 0.25, angle + 0.22, 3.0 + this.tier * 0.1));
    }
  }

  takeDamage(amount) {
    this.currentHp -= amount;
    if (this.currentHp < 0) this.currentHp = 0;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(sin(frameCount * 0.02) * 0.05);
    if (ufoImg != null) {
      noTint();
      image(ufoImg, 0, 0, this.size, this.size);
    } else {
      noStroke();
      fill(95, 45, 170);
      ellipse(0, 0, this.size, this.size * 0.56);
      fill(70, 190, 255);
      ellipse(0, -this.size * 0.12, this.size * 0.48, this.size * 0.32);
      fill(220, 80, 255, 120);
      ellipse(0, this.size * 0.08, this.size * 0.85, this.size * 0.22);
      fill(255, 90, 110);
      for (let i = -2; i <= 2; i++) ellipse(i * this.size * 0.14, this.size * 0.1, 7, 7);
    }
    pop();
  }
}

// ============================================================
// ALIEN SHIP (level 4) - moves, shoots STRAIGHT DOWN (never aims)
// ============================================================

class Alien {
  x = 0;
  y = 0;
  baseY = 0;
  size = 54;
  speed = 0;
  hp = 0;
  maxHp = 0;
  dir = 0;
  nextShot = 0;
  phase = 0;
  t = 0;
  entered = false;

  constructor(x, y, baseY, speed, hp) {
    this.x = x;
    this.y = y;
    this.baseY = baseY;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.dir = random(1) < 0.5 ? -1 : 1;
    this.phase = random(TWO_PI);
    this.nextShot = frameCount + int(random(60, 140));
  }

  update(list) {
    if (frozen()) {
      this.nextShot++;   // keep the shot delay from running out while frozen
      return;
    }
    if (!this.entered) {
      this.y += 2;                       // fly in from the top
      if (this.y >= this.baseY) this.entered = true;
      return;
    }

    // Patrol left/right with a little up-down wobble
    this.x += this.dir * this.speed;
    if (this.x < this.size / 2 || this.x > width - this.size / 2) this.dir *= -1;
    this.t += 0.04;
    this.y = this.baseY + sin(this.t + this.phase) * 14;

    // Shoot in a fixed straight line (down). Not aimed at the player.
    if (frameCount >= this.nextShot) {
      list.push(new EnemyBullet(this.x, this.y + this.size * 0.4, HALF_PI, 4.2));
      this.nextShot = frameCount + int(random(70, 130));
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    if (alienImg != null) {
      noTint();
      image(alienImg, 0, 0, this.size, this.size);
    } else {
      noStroke();
      fill(50, 190, 115);
      ellipse(0, 0, this.size, this.size * 0.5);
      fill(160, 255, 220);
      ellipse(0, -this.size * 0.15, this.size * 0.5, this.size * 0.35);
      fill(255, 230, 80);
      for (let i = -1; i <= 1; i++) ellipse(i * this.size * 0.2, this.size * 0.04, 6, 6);
      fill(40, 120, 80);
      rectMode(CENTER);
      rect(0, this.size * 0.28, 8, 10, 2);   // small cannon
      rectMode(CORNER);
    }
    pop();

    if (this.hp < this.maxHp) {
      rectMode(CORNER);
      noStroke();
      fill(60, 60, 80);
      rect(this.x - 20, this.y - this.size * 0.6, 40, 4);
      fill(80, 255, 140);
      rect(this.x - 20, this.y - this.size * 0.6, 40 * this.hp / this.maxHp, 4);
    }
  }
}

// ============================================================
// ALIEN WARSHIP (level 5 boss) - straight bullets + missiles
// ============================================================

class AlienBoss {
  x = 0;
  y = 0;
  size = 150;
  speed = 1.6;
  maxHp = 0;
  currentHp = 0;
  direction = 1;
  entered = false;
  nextBullet = 0;
  nextMissile = 0;
  t = 0;

  constructor(x, y, hp) {
    this.x = x;
    this.y = y;
    this.maxHp = max(1, hp);
    this.currentHp = this.maxHp;
    this.nextBullet = frameCount + 90;
    this.nextMissile = frameCount + 150;
  }

  enraged() {
    return this.currentHp < this.maxHp * 0.5;
  }

  update() {
    if (frozen()) return;
    if (!this.entered) {
      this.y += 1.4;
      if (this.y >= 100) this.entered = true;
      return;
    }
    let sp = this.enraged() ? this.speed * 1.6 : this.speed;
    this.x += this.direction * sp;
    if (this.x < this.size / 2 || this.x > width - this.size / 2) this.direction *= -1;
    this.t += 0.03;
    this.y = 100 + sin(this.t) * 12;
  }

  attack(bl, ml) {
    if (!this.entered) return;
    if (frozen()) {          // keep fire delays from running out while frozen
      this.nextBullet++;
      this.nextMissile++;
      return;
    }

    let bulletDelay = this.enraged() ? 30 : 48;
    let missileDelay = this.enraged() ? 95 : 150;

    // Bullets: fixed straight-down lines (3-way, 5-way when enraged)
    if (frameCount >= this.nextBullet) {
      for (let i = -1; i <= 1; i++) {
        bl.push(new EnemyBullet(this.x + i * 30, this.y + this.size * 0.3, HALF_PI, 4.5));
      }
      if (this.enraged()) {
        bl.push(new EnemyBullet(this.x, this.y + this.size * 0.3, HALF_PI - 0.3, 4.5));
        bl.push(new EnemyBullet(this.x, this.y + this.size * 0.3, HALF_PI + 0.3, 4.5));
      }
      this.nextBullet = frameCount + bulletDelay;
    }

    // Missiles: two pods, fly straight down and speed up
    if (frameCount >= this.nextMissile) {
      ml.push(new Missile(this.x - this.size * 0.38, this.y + this.size * 0.2, 3.0));
      ml.push(new Missile(this.x + this.size * 0.38, this.y + this.size * 0.2, 3.0));
      this.nextMissile = frameCount + missileDelay;
    }
  }

  takeDamage(amount) {
    this.currentHp -= amount;
    if (this.currentHp < 0) this.currentHp = 0;
  }

  display() {
    push();
    translate(this.x, this.y);
    if (warshipImg != null) {
      noTint();
      image(warshipImg, 0, 0, this.size, this.size);
    } else {
      noStroke();
      fill(120, 25, 40);
      ellipse(0, 0, this.size, this.size * 0.52);              // hull
      fill(255, 90, 90);
      ellipse(0, -this.size * 0.13, this.size * 0.42, this.size * 0.3);  // cockpit
      fill(70, 20, 30);
      rectMode(CENTER);
      rect(-this.size * 0.38, this.size * 0.16, 16, 24, 3);    // missile pods
      rect(this.size * 0.38, this.size * 0.16, 16, 24, 3);
      rect(-this.size * 0.2, this.size * 0.2, 8, 16, 2);       // bullet guns
      rect(0, this.size * 0.22, 8, 16, 2);
      rect(this.size * 0.2, this.size * 0.2, 8, 16, 2);
      rectMode(CORNER);
      fill(255, 200, 60);
      for (let i = -2; i <= 2; i++) ellipse(i * this.size * 0.16, this.size * 0.02, 7, 7);
    }
    pop();
  }
}

// ============================================================
// MISSILE - flies straight down, accelerates
// ============================================================

class Missile {
  x = 0;
  y = 0;
  speed = 0;
  maxSpeed = 7;

  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  update() {
    if (frozen()) return;
    this.speed = min(this.maxSpeed, this.speed + 0.04);
    this.y += this.speed;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(PI);                      // body is drawn pointing up, so flip it to point down
    noStroke();
    fill(255, 150, 40, 210);         // flame (trails behind the missile)
    triangle(-4, 12, 4, 12, 0, 20 + random(0, 8));
    fill(205);
    rectMode(CENTER);
    rect(0, 0, 10, 26, 3);
    rectMode(CORNER);
    fill(255, 60, 60);
    triangle(-5, -13, 5, -13, 0, -23);   // nose
    fill(150);
    triangle(-5, 6, -12, 15, -5, 13);    // fins
    triangle(5, 6, 12, 15, 5, 13);
    pop();
  }

  isOffScreen() {
    return this.y > height + 30;
  }
}

// ============================================================
// ENEMY PROJECTILE
// ============================================================

class EnemyBullet {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  speed = 0;

  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
  }

  update() {
    if (frozen()) return;
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    noStroke();
    fill(255, 70, 120, 80);
    ellipse(this.x, this.y, 16, 16);
    fill(255, 100, 155);
    ellipse(this.x, this.y, 7, 7);
  }

  isOffScreen() {
    return this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20;
  }
}

// ============================================================
// SPELLS (power-ups)
//   HEAL   - refills hull to full
//   TRIPLE - 3 bullets per shot for 10 seconds
//   FREEZE - enemies, bosses, bullets and missiles stop for 5 seconds
// A spell drifts across the screen. Touch it to collect it,
// otherwise it leaves the other side of the screen.
// ============================================================

function frozen() {
  return freezeTimer > 0;
}

function updatePowerUps() {
  if (player == null) return;

  // Count down active spells (only runs while the game is not paused)
  if (tripleTimer > 0) tripleTimer--;
  if (freezeTimer > 0) freezeTimer--;

  // Spawn: one new spell every 12-20 seconds, only if none is on screen
  powerSpawnTimer--;
  if (powerSpawnTimer <= 0) {
    powerSpawnTimer = int(random(720, 1200));
    if (powerUps.length == 0) spawnPowerUp();
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    let p = powerUps[i];
    p.update();
    p.display();
    if (p.isOffScreen()) {
      powerUps.splice(i, 1);
    } else if (dist(player.x, player.y, p.x, p.y) < player.radius + p.radius) {
      collectPowerUp(p.type);
      powerUps.splice(i, 1);
    }
  }
}

function spawnPowerUp() {
  // Weights: triple 40, freeze 35, heal 25.
  // Heal is more likely when hurt (45 under half hull) and never when hull is almost full.
  let healW = 0;
  if (player.health < player.maxHealth * 0.95) {
    healW = player.health < player.maxHealth * 0.5 ? 45 : 25;
  }
  let tripleW = 40;
  let freezeW = 35;

  let pick = random(healW + tripleW + freezeW);
  let type ;
  if (pick < healW) type = SPELL_HEAL;
  else if (pick < healW + tripleW) type = SPELL_TRIPLE;
  else type = SPELL_FREEZE;

  let fromLeft = random(1) < 0.5;
  let y = random(130, height - 70);
  powerUps.push(new PowerUp(fromLeft ? -25 : width + 25, y, fromLeft ? 1.7 : -1.7, type));
}

function collectPowerUp(type) {
  sfxPowerup.play();
  if (type == SPELL_HEAL) {
    player.health = player.maxHealth;
    showBanner("HEAL - HULL FULLY REPAIRED");
  } else if (type == SPELL_TRIPLE) {
    tripleTimer = TRIPLE_FRAMES;
    showBanner("TRIPLE SHOT - 10 SECONDS");
  } else {
    freezeTimer = FREEZE_FRAMES;
    showBanner("FREEZE - 5 SECONDS");
  }
}

function drawFreezeOverlay() {
  if (freezeTimer <= 0) return;
  // Blink faintly during the last second as a warning
  let a = (freezeTimer < 60 && frameCount % 12 < 6) ? 12 : 38;
  rectMode(CORNER);
  noStroke();
  fill(130, 210, 255, a);
  rect(0, 0, width, height);
  noFill();
  stroke(150, 225, 255, 160);
  strokeWeight(6);
  rect(3, 3, width - 6, height - 6);
  strokeWeight(1);
  noStroke();
}

class PowerUp {
  x = 0;
  y = 0;
  baseY = 0;
  vx = 0;
  phase = 0;
  radius = 17;
  type = 0;

  constructor(x, y, vx, type) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.vx = vx;
    this.type = type;
    this.phase = random(TWO_PI);
  }

  update() {
    this.x += this.vx;
    this.y = this.baseY + sin(frameCount * 0.05 + this.phase) * 28;   // gentle wave
  }

  isOffScreen() {
    return (this.vx > 0 && this.x > width + 40) || (this.vx < 0 && this.x < -40);
  }

  display() {
    let c ;
    let label ;
    if (this.type == SPELL_HEAL) {
      c = color(60, 230, 120);
      label = "HEAL";
    } else if (this.type == SPELL_TRIPLE) {
      c = color(255, 210, 70);
      label = "TRIPLE";
    } else {
      c = color(120, 210, 255);
      label = "FREEZE";
    }

    let pulse = 0.5 + 0.5 * sin(frameCount * 0.15);

    // glow
    noStroke();
    fill(red(c), green(c), blue(c), 50 + 50 * pulse);
    ellipse(this.x, this.y, this.radius * 2 + 14 + 6 * pulse, this.radius * 2 + 14 + 6 * pulse);
    // orb
    fill(15, 25, 45);
    ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    stroke(c);
    strokeWeight(2);
    noFill();
    ellipse(this.x, this.y, this.radius * 2, this.radius * 2);

    // icon
    if (this.type == SPELL_HEAL) {
      strokeWeight(4);
      line(this.x - 8, this.y, this.x + 8, this.y);
      line(this.x, this.y - 8, this.x, this.y + 8);
    } else if (this.type == SPELL_TRIPLE) {
      strokeWeight(2.5);
      line(this.x, this.y + 8, this.x - 9, this.y - 7);
      line(this.x, this.y + 8, this.x, this.y - 9);
      line(this.x, this.y + 8, this.x + 9, this.y - 7);
    } else {
      strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        let a = i * PI / 3;
        line(this.x + cos(a) * 9, this.y + sin(a) * 9, this.x - cos(a) * 9, this.y - sin(a) * 9);
      }
    }

    // label
    noStroke();
    fill(c);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(label, this.x, this.y + this.radius + 11);
    strokeWeight(1);
  }
}

// ============================================================
// CHAPTER 2 - THE SECOND STATEMENT OF GOD
//   Portal  ->  intro text  ->  Level 1 Tentacle Raiders
//                           ->  Level 2 The Hatchery
//                           ->  Level 3 Kill 30 (damage reduced)
//   (the centipede boss level will go after level 3)
// ============================================================

// How much damage your bullets do to chapter 2 creatures.
function playerDamage() {
  if (gameState == LEVEL_C2 && level == 3) return level3Damage;
  return 1.0;
}

// Draw an image inside a square box without stretching it.
function drawFit(img, boxSize) {
  let s = boxSize / max(img.width, img.height);
  image(img, 0, 0, img.width * s, img.height * s);
}

function countKind(k) {
  let n = 0;
  for (const s of tShips) {
    if (s.kind == k) n++;
  }
  return n;
}

function c2Status() {
  if (level == 1) return "RAIDERS LEFT: " + countKind(T_RAIDER);
  if (level == 2) return "EGGS LEFT: " + eggs.length + "  |  shoot them when the shield opens";
  if (level == 3) return "KILLS " + c2Kills + " / " + c2Goal + "  |  YOUR DAMAGE " + int(level3Damage * 100) + "%";
  return "ALIEN CENTIPEDE BOSS  |  TARGET THE HEAD AND BODY SEGMENTS";
}

// ---------------- PORTAL + INTRO ----------------

function startPortal() {
  sfxPortal.play();
  gameState = PORTAL;
  portalTimer = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  missiles.length = 0;
  enemies.length = 0;
  aliens.length = 0;
  showBanner("PORTAL OPENED - FLY INTO IT");
}

function updatePortal() {
  portalTimer++;
  drawPortal();
  if (portalTimer > 90 && player != null) {
    let nx = (player.x - portalX) / 38.0;
    let ny = (player.y - portalY) / 62.0;
    if (nx * nx + ny * ny < 1) startChapterIntro();
  }
}

function drawPortal() {
  let grow = max(0.01, constrain(portalTimer / 90.0, 0, 1));
  let pulse = 0.5 + 0.5 * sin(frameCount * 0.1);

  push();
  translate(portalX, portalY);
  scale(grow);
  noStroke();
  for (let i = 4; i >= 0; i--) {
    fill(70, 160, 255, 28);
    ellipse(0, 0, 90 + i * 16 + 8 * pulse, 140 + i * 20 + 8 * pulse);
  }
  fill(40, 110, 230);
  ellipse(0, 0, 78, 124);
  fill(170, 225, 255);
  ellipse(0, 0, 56, 100);
  noFill();
  stroke(255, 255, 255, 200);
  strokeWeight(2);
  for (let k = 0; k < 3; k++) {
    let a = frameCount * 0.05 * (k % 2 == 0 ? 1 : -1) + k * 2.1;
    arc(0, 0, 52 - k * 14, 94 - k * 24, a, a + PI * 0.8, OPEN);
  }
  pop();

  strokeWeight(1);
  noStroke();
  if (portalTimer > 90) {
    fill(200, 235, 255, 150 + 100 * pulse);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("ENTER THE PORTAL", portalX, portalY + 95);
  }
}

function startChapterIntro() {
  gameState = CHAPTER_INTRO;
  introTimer = 0;
  bullets.length = 0;
  powerUps.length = 0;
}

function drawChapterIntro() {
  introTimer++;
  let fadeIn = constrain(introTimer / 60.0, 0, 1);
  let fadeOut = constrain((300 - introTimer) / 60.0, 0, 1);
  let a = 255 * min(fadeIn, fadeOut);

  rectMode(CORNER);
  noStroke();
  fill(8, 22, 48);
  rect(0, 0, width, height);
  for (let i = 0; i < 6; i++) {
    fill(80, 170, 255, 12);
    ellipse(width / 2, height / 2, 200 + i * 90, 140 + i * 60);
  }

  textAlign(CENTER, CENTER);
  fill(160, 210, 255, a);
  textSize(18);
  text("CHAPTER 2", width / 2, height / 2 - 60);
  fill(255, 255, 255, a);
  textSize(30);
  text("You have reached the Second Statement of God", width / 2, height / 2 - 12);
  fill(170, 200, 230, a);
  textSize(15);
  text("The tentacle fleet is waiting...", width / 2, height / 2 + 35);

  if (introTimer >= 300) startChapter2();
}

function startChapter2() {
  chapter = 2;
  player.x = width / 2.0;
  player.y = height - 90;
  player.health = min(player.maxHealth, player.health + 50);
  tripleTimer = 0;
  freezeTimer = 0;
  powerSpawnTimer = 720;
  gameState = LEVEL_C2;
  startC2Level(1);
}

// ---------------- LEVEL FLOW ----------------

function startC2Level(lv) {
  level = lv;
  tShips.length = 0;
  eggs.length = 0;
  booms.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  missiles.length = 0;
  c2Kills = 0;
  c2Timer = 0;

  if (lv == 1) {
    for (let i = 0; i < 5; i++) {
      let x = map(i, 0, 4, 100, width - 100);
      tShips.push(new TentacleShip(T_RAIDER, x, -40 - i * 45));
    }
    showBanner("LEVEL 1 - TENTACLE RAIDERS");
  } else if (lv == 2) {
    eggs.push(new EggShip(220, -80, 100, 18, 1));
    eggs.push(new EggShip(580, -80, 175, 18, -1));
    showBanner("LEVEL 2 - THE HATCHERY");
  } else if (lv == 3) {
    showBanner("LEVEL 3 - KILL " + c2Goal + " | DAMAGE " + int(level3Damage * 100) + "%");
  } else {
    centipedeBoss = new CentipedeBoss();
    showBanner("LEVEL 4 - ALIEN CENTIPEDE BOSS");
  }
}

function finishC2Level(next) {
  for (const s of tShips) booms.push(new Boom(s.x, s.y, 45));   // leftover bombs pop
  score += 100;
  startC2Level(next);
}

function finishChapter2() {
  for (const s of tShips) booms.push(new Boom(s.x, s.y, 45));
  tShips.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  score += 500;
  bestScore = max(bestScore, score);
  // TODO: start the centipede boss level here once it is designed.
  victoryText = "Chapter 2 cleared! The centipede boss is coming soon...";
  gameState = VICTORY;
}

function updateChapter2() {
  if (level == 1) updateC2Level1();
  else if (level == 2) updateC2Level2();
  else if (level == 3) updateC2Level3();
  else if (level == 4) updateCentipedeBoss();

  updateTentacleShips();
  updateEggs();
}

// Level 1: kill all raiders (fan shots). Bomb ships keep flying at you meanwhile.
function updateC2Level1() {
  if (countKind(T_RAIDER) == 0) {
    finishC2Level(2);
    return;
  }
  if (!frozen()) c2Timer++;
  if (c2Timer >= 170 && countKind(T_BOMB) < 3) {
    c2Timer = 0;
    tShips.push(new TentacleShip(T_BOMB, random(60, width - 60), -30));
  }
}

// Level 2: destroy both eggs. Their shield only opens while they hatch bombs.
function updateC2Level2() {
  if (eggs.length == 0) finishC2Level(3);
}

// Level 3: kill 30 creatures. Mixed waves that get faster as your kills go up.
function updateC2Level3() {
  if (c2Kills >= c2Goal) {
    startC2Level(4);
    return;
  }
  if (!frozen()) c2Timer++;
  let ramp = constrain(c2Kills / c2Goal, 0, 1);
  let delay = int(lerp(80, 42, ramp));
  let maxOn = 5 + int(ramp * 4);

  if (c2Timer >= delay && tShips.length < maxOn) {
    c2Timer = 0;
    let r = random(1);
    if (r < 0.40) {
      tShips.push(new TentacleShip(T_RAIDER, random(80, width - 80), -40));
    } else if (r < 0.70) {
      let fromLeft = random(1) < 0.5;
      tShips.push(new TentacleShip(T_SAUCER, fromLeft ? -40 : width + 40, random(110, 360)));
    } else {
      tShips.push(new TentacleShip(T_BOMB, random(60, width - 60), -30));
    }
  }
}

// ---------------- CHAPTER 2 LEVEL 4: ALIEN CENTIPEDE BOSS ----------------

function updateCentipedeBoss() {
  if (centipedeBoss == null) centipedeBoss = new CentipedeBoss();
  centipedeBoss.update();
  centipedeBoss.display();

  // The head and every body segment can be damaged. Body shots do less damage.
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    let hitSegment = centipedeBoss.hitSegment(b.x, b.y);
    if (hitSegment >= 0) {
      bullets.splice(i, 1);
      centipedeBoss.hp -= (hitSegment == 0 ? 2.0 : 1.0);
      centipedeBoss.flashTimer = 5;
      score += 2;
    }
  }

  // Touching the centipede is dangerous.
  if (player.canTakeDamage() && centipedeBoss.touchesPlayer(player.x, player.y)) {
    player.takeDamage(18);
  }

  // If the boss is defeated, finish Chapter 2 for real.
  if (centipedeBoss.hp <= 0) {
    score += 2000;
    sfxExplosion.play();
    centipedeBoss = null;
    bestScore = max(bestScore, score);
    victoryText = "The Alien Centipede has been destroyed!";
    gameState = VICTORY;
  }
}

function drawCentipedeHealthBar() {
  let x = 240, y = 18, w = 400, h = 18;
  rectMode(CORNER);
  noStroke();
  fill(20, 35, 50, 230);
  rect(x, y, w, h, 5);
  fill(255, 45, 85);
  rect(x, y, w * constrain(centipedeBoss.hp / centipedeBoss.maxHp, 0, 1), h, 5);
  noFill();
  stroke(70, 220, 255);
  strokeWeight(2);
  rect(x, y, w, h, 5);
  strokeWeight(1);
  fill(240, 250, 255);
  textAlign(CENTER, CENTER);
  textSize(12);
  text("CENTIPEDE CORE  " + int(max(0, centipedeBoss.hp)) + " / " + int(centipedeBoss.maxHp), width / 2, y + h / 2);
}

class CentipedeBoss {
  hp = 1000;
  maxHp = 1000;
  headX = width / 2.0;
  headY = 145;
  phase = 0;
  rushVX = 0;
  rushVY = 0;
  heading = 0;
  bodyLength = 610;
  flashTimer = 0;
  attackTimer = 0;
  missileTimer = 0;
  rushState = 0; // 0 = stalk/telegraph, 1 = fast rush, 2 = offscreen re-entry delay
  stateTimer = 0;
  entrySide = -1;
  rushCount = 0;
  sx = new Array(SEGMENTS).fill(0);
  sy = new Array(SEGMENTS).fill(0);
  segSize = new Array(SEGMENTS).fill(0);

  constructor() {
    for (let i = 0; i < SEGMENTS; i++) {
      this.sx[i] = this.headX - (i + 1) * 39;
      this.sy[i] = this.headY;
      this.segSize[i] = 48 - min(i, 5) * 2;
    }
  }

  update() {
    if (frozen()) return;
    this.phase += 0.045;
    if (this.flashTimer > 0) this.flashTimer--;
    this.stateTimer++;
    this.attackTimer++;
    this.missileTimer++;

    let rage = 1.0 + (1.0 - this.hp / this.maxHp) * 0.30;

    if (this.rushState == 0) {
      // Stalk above the player, then aim directly at the player's current position.
      let targetX = constrain(player.x, 110, width - 110);
      let targetY = constrain(player.y - 65, 95, height - 170);
      this.headX = lerp(this.headX, targetX, 0.028);
      this.headY = lerp(this.headY, targetY + sin(this.phase) * 18, 0.039);
      this.heading = atan2(player.y - this.headY, player.x - this.headX);

      // Brief warning gives the player a moment to dodge before a very fast charge.
      if (this.stateTimer >= (this.hp < this.maxHp * 0.33 ? 38 : 52)) {
        let dx = player.x - this.headX;
        let dy = player.y - this.headY;
        let d = max(1, sqrt(dx * dx + dy * dy));
        let speed = (this.hp < this.maxHp * 0.33 ? 10.6 : 8.4) * rage;
        this.rushVX = dx / d * speed;
        this.rushVY = dy / d * speed;
        this.heading = atan2(this.rushVY, this.rushVX);
        this.rushState = 1;
        this.stateTimer = 0;
        this.rushCount++;
      }
    } else if (this.rushState == 1) {
      // Fast diagonal charge; keep moving until the entire boss exits the screen.
      this.headX += this.rushVX;
      this.headY += this.rushVY;
      this.heading = atan2(this.rushVY, this.rushVX);
      if (this.headX < -this.bodyLength || this.headX > width + this.bodyLength ||
          this.headY < -150 || this.headY > height + 150) {
        this.rushState = 2;
        this.stateTimer = 0;
        this.entrySide = (this.rushVX >= 0) ? -1 : 1;
      }
    } else {
      // Hide briefly, then emerge from the opposite side and target the player again.
      if (this.stateTimer >= 24) {
        this.headX = this.entrySide < 0 ? -this.bodyLength * 0.65 : width + this.bodyLength * 0.65;
        this.headY = constrain(random(100, height - 190), 100, height - 190);
        this.rushState = 0;
        this.stateTimer = 0;
      }
    }

    // Body hit boxes follow the head along its current heading.
    for (let i = 0; i < SEGMENTS; i++) {
      let behind = (i + 1) * (this.bodyLength / SEGMENTS);
      this.sx[i] = this.headX - cos(this.heading) * behind;
      this.sy[i] = this.headY - sin(this.heading) * behind + sin(this.phase - i * 0.65) * 12;
    }

    // Multi-direction bullet wave. Attacks continue during stalking and rushing.
    let waveDelay = this.hp < this.maxHp * 0.33 ? 38 : (this.hp < this.maxHp * 0.66 ? 50 : 64);
    if (this.attackTimer >= waveDelay) {
      this.attackTimer = 0;
      let count = this.hp < this.maxHp * 0.33 ? 13 : 9;
      let start = HALF_PI - 1.18;
      let spread = 2.36;
      for (let i = 0; i < count; i++) {
        let a = start + spread * i / max(1.0, count - 1.0);
        enemyBullets.push(new EnemyBullet(this.headX, this.headY, a, this.hp < this.maxHp * 0.33 ? 4.4 : 3.6));
      }
    }

    // Paired missiles; more frequent in the final phase.
    let missileDelay = this.hp < this.maxHp * 0.33 ? 95 : 145;
    if (this.missileTimer >= missileDelay) {
      this.missileTimer = 0;
      missiles.push(new Missile(this.headX - cos(this.heading) * 22, this.headY - sin(this.heading) * 22, 3.5));
      missiles.push(new Missile(this.headX + cos(this.heading) * 22, this.headY + sin(this.heading) * 22, 3.5));
    }
  }

  hitSegment(x, y) {
    if (dist(x, y, this.headX, this.headY) < 48) return 0;
    for (let i = 0; i < SEGMENTS; i++) {
      if (dist(x, y, this.sx[i], this.sy[i]) < this.segSize[i] * 0.6) return i + 1;
    }
    return -1;
  }

  touchesPlayer(x, y) {
    if (dist(x, y, this.headX, this.headY) < 46) return true;
    for (let i = 0; i < SEGMENTS; i++) {
      if (dist(x, y, this.sx[i], this.sy[i]) < this.segSize[i] * 0.5 + 10) return true;
    }
    return false;
  }

  // The whole body is drawn with code (no image needed):
  // legs, armoured segments with glowing cores, and a tail spike.
  drawBody() {
    let spacing = this.bodyLength / SEGMENTS;
    let flash = this.flashTimer > 0;

    // 1) Legs (drawn first so they sit under the body)
    for (let i = SEGMENTS - 1; i >= 0; i--) {
      let px = (i == 0) ? this.headX : this.sx[i - 1];
      let py = (i == 0) ? this.headY : this.sy[i - 1];
      let ang = atan2(py - this.sy[i], px - this.sx[i]);
      let s = 50 - i * 2.4;
      let swing = sin(this.phase * 3 + i * 0.9) * 0.45;
      stroke(flash ? color(210, 255, 225) : color(8, 55, 22));
      strokeWeight(4);
      for (let side = -1; side <= 1; side += 2) {
        let la = ang + side * (HALF_PI + swing);
        let fx = this.sx[i] + cos(la) * s * 1.0;
        let fy = this.sy[i] + sin(la) * s * 1.0;
        line(this.sx[i], this.sy[i], fx, fy);
        noStroke();
        fill(255, 150, 40);
        ellipse(fx, fy, 7, 7);
        stroke(flash ? color(210, 255, 225) : color(8, 55, 22));
      }
    }
    strokeWeight(1);
    noStroke();

    // 2) Tail spike (points away from the head)
    let ex = this.sx[SEGMENTS - 1];
    let ey = this.sy[SEGMENTS - 1];
    let tailAng = atan2(ey - this.sy[SEGMENTS - 2], ex - this.sx[SEGMENTS - 2]);
    push();
    translate(ex, ey);
    rotate(tailAng);
    fill(flash ? color(210, 255, 225) : color(10, 70, 28));
    triangle(8, -11, 8, 11, 54, 0);
    pop();

    // 3) Body segments, from the tail to the head so the head side overlaps
    for (let i = SEGMENTS - 1; i >= 0; i--) {
      let px = (i == 0) ? this.headX : this.sx[i - 1];
      let py = (i == 0) ? this.headY : this.sy[i - 1];
      let ang = atan2(py - this.sy[i], px - this.sx[i]);
      let s = 50 - i * 2.4;

      let base = (i % 2 == 0) ? color(20, 120, 50) : color(14, 95, 42);
      if (flash) base = lerpColor(base, color(255, 255, 255), 0.6);

      push();
      translate(this.sx[i], this.sy[i]);
      rotate(ang);
      noStroke();
      fill(base);
      ellipse(0, 0, spacing * 1.08, s);                           // armour plate
      fill(lerpColor(base, color(120, 255, 110), 0.45));
      ellipse(-2, 0, spacing * 0.62, s * 0.55);                   // lighter shell
      fill(255, 70, 110, 150 + 100 * sin(this.phase * 4 + i));
      ellipse(spacing * 0.2, 0, 9, 9);                            // glowing core
      pop();
    }
  }

  display() {
    this.drawBody();

    // Head/eye sprite overlays the leading end of the body.
    push();
    translate(this.headX, this.headY);
    rotate(this.heading);
    if (centipedeHeadSprite != null) {
      if (this.flashTimer > 0) tint(210, 255, 220);
      image(centipedeHeadSprite, 0, 0, 86, 86);
      noTint();
    } else {
      noStroke();
      fill(30, 190, 40);
      ellipse(0, 0, 78, 70);
      fill(120, 255, 40);
      ellipse(8, -8, 28, 24);
    }
    pop();

    // Charge warning effect.
    if (this.rushState == 0 && this.stateTimer > 25) {
      noFill();
      stroke(120, 255, 60, 150 + 70 * sin(this.phase * 5));
      strokeWeight(3);
      ellipse(this.headX, this.headY, 105, 105);
      noStroke();
    }

    fill(175, 245, 150);
    textAlign(CENTER, TOP);
    textSize(12);
    let phaseName = this.hp < this.maxHp * 0.33 ? "III - ENRAGED" : this.hp < this.maxHp * 0.66 ? "II - HUNTING" : "I - STALKING";
    text("ALIEN CENTIPEDE  •  PHASE " + phaseName, width / 2, 43);
  }
}

// ---------------- UPDATE CREATURES ----------------

function updateTentacleShips() {
  for (let i = tShips.length - 1; i >= 0; i--) {
    let s = tShips[i];
    s.update(enemyBullets);
    s.display();

    if (s.isGone()) {
      tShips.splice(i, 1);
      continue;
    }

    // Touching the player
    if (dist(player.x, player.y, s.x, s.y) < player.radius + s.size * 0.4) {
      if (s.kind == T_BOMB) {
        player.takeDamage(15);                  // bomb explodes on contact
        booms.push(new Boom(s.x, s.y, 70));
        tShips.splice(i, 1);
        continue;
      } else if (player.canTakeDamage()) {
        player.takeDamage(10);
      }
    }

    // Player bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (dist(s.x, s.y, b.x, b.y) < s.size * 0.45) {
        bullets.splice(j, 1);
        s.hp -= playerDamage();
        score += 3;
        if (s.hp <= 0) break;
      }
    }

    if (s.hp <= 0) {
      score += (s.kind == T_BOMB ? 15 : 40);
      c2Kills++;
      booms.push(new Boom(s.x, s.y, s.kind == T_BOMB ? 45 : 60));
      tShips.splice(i, 1);
    }
  }
}

function updateEggs() {
  for (let i = eggs.length - 1; i >= 0; i--) {
    let e = eggs[i];
    e.update(tShips);
    e.display();

    if (player.canTakeDamage() &&
        dist(player.x, player.y, e.x, e.y) < player.radius + e.size * 0.4) {
      player.takeDamage(12);
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (dist(e.x, e.y, b.x, b.y) < e.size * 0.5) {
        bullets.splice(j, 1);      // the shield (or the egg) absorbs the bullet
        e.flash = 6;
        if (e.shieldOpen) {
          e.hp -= playerDamage();
          score += 2;
        }
      }
    }

    if (e.hp <= 0) {
      score += 200;
      c2Kills++;
      booms.push(new Boom(e.x, e.y, 110));
      eggs.splice(i, 1);
    }
  }
}

function updateBooms() {
  for (let i = booms.length - 1; i >= 0; i--) {
    let b = booms[i];
    b.update();
    b.display();
    if (b.done()) booms.splice(i, 1);
  }
}

// ============================================================
// TENTACLE SHIP
//   RAIDER - hovers and fires a 3-way fan (fixed angles, not aimed)
//   SAUCER - crosses the screen sideways firing straight down
//   BOMB   - small ship that flies at the player and explodes
// ============================================================

class TentacleShip {
  kind = 0;
  x = 0;
  y = 0;
  vx = 0;
  size = 0;
  hp = 0;
  maxHp = 0;
  t = 0;
  rowY = 0;
  dir = 0;
  nextShot = 0;
  entered = false;

  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.dir = random(1) < 0.5 ? -1 : 1;
    if (kind == T_RAIDER) {
      this.size = 64;
      this.hp = 5;
      this.rowY = random(80, 190);
      this.nextShot = frameCount + int(random(60, 140));
    } else if (kind == T_SAUCER) {
      this.size = 74;
      this.hp = 4;
      this.vx = x < width / 2 ? 2.3 : -2.3;
      this.nextShot = frameCount + 30;
      this.entered = true;
    } else {
      this.size = 40;
      this.hp = 1;
      this.entered = true;
    }
    this.maxHp = this.hp;
  }

  update(list) {
    if (frozen()) {
      this.nextShot++;
      return;
    }
    this.t += 0.05;

    if (this.kind == T_RAIDER) {
      if (!this.entered) {
        this.y += 2;
        if (this.y >= this.rowY) this.entered = true;
        return;
      }
      this.x += this.dir * 1.3;
      if (this.x < this.size / 2 || this.x > width - this.size / 2) this.dir *= -1;
      this.y = this.rowY + sin(this.t) * 12;
      if (frameCount >= this.nextShot) {
        for (let i = -1; i <= 1; i++) {
          list.push(new EnemyBullet(this.x, this.y + this.size * 0.4, HALF_PI + i * 0.35, 3.6));
        }
        this.nextShot = frameCount + int(random(100, 160));
      }
    } else if (this.kind == T_SAUCER) {
      this.x += this.vx;
      this.y += sin(this.t) * 0.8;
      if (frameCount >= this.nextShot) {
        list.push(new EnemyBullet(this.x, this.y + this.size * 0.35, HALF_PI, 4.0));
        this.nextShot = frameCount + 50;
      }
    } else {
      let a = atan2(player.y - this.y, player.x - this.x);
      let sp = 2.3 + (level == 3 ? c2Kills * 0.03 : 0);
      this.x += cos(a) * sp;
      this.y += sin(a) * sp;
    }
  }

  isGone() {
    return this.kind == T_SAUCER && ((this.vx > 0 && this.x > width + 60) || (this.vx < 0 && this.x < -60));
  }

  display() {
    push();
    translate(this.x, this.y);

    if (this.kind == T_BOMB) {          // red glow warns that it explodes
      noStroke();
      fill(255, 80, 60, 50 + 40 * sin(frameCount * 0.25));
      ellipse(0, 0, this.size * 1.5, this.size * 1.5);
    }
    if (this.kind == T_SAUCER && this.vx > 0) scale(-1, 1);   // sprite faces left

    let img = this.kind == T_RAIDER ? tRaiderImg : (this.kind == T_SAUCER ? tSaucerImg : tBombImg);
    // Stage 2 level 3 (kill 30): raiders and saucers use the octopus picture. Bombs keep their own look.
    if (chapter == 2 && level == 3 && this.kind != T_BOMB && octopusImg != null) img = octopusImg;
    if (img != null) {
      noTint();
      drawFit(img, this.size);
    } else {
      this.drawFallback();
    }
    pop();

    if (this.hp < this.maxHp && this.kind != T_BOMB) {
      rectMode(CORNER);
      noStroke();
      fill(60, 60, 80);
      rect(this.x - 20, this.y - this.size * 0.62, 40, 4);
      fill(255, 120, 150);
      rect(this.x - 20, this.y - this.size * 0.62, 40 * constrain(this.hp / this.maxHp, 0, 1), 4);
    }
  }

  drawFallback() {
    stroke(240, 150, 160);
    strokeWeight(3);
    for (let i = -1; i <= 1; i++) line(i * 8, this.size * 0.2, i * 12, this.size * 0.5);
    noStroke();
    strokeWeight(1);
    if (this.kind == T_RAIDER) {
      fill(50, 185, 145);
      triangle(-this.size * 0.25, this.size * 0.3, this.size * 0.25, this.size * 0.3, 0, -this.size * 0.2);
      fill(120, 220, 255);
      ellipse(0, -this.size * 0.25, this.size * 0.45, this.size * 0.35);
    } else if (this.kind == T_SAUCER) {
      fill(50, 185, 145);
      ellipse(0, 0, this.size, this.size * 0.4);
      fill(120, 220, 255);
      ellipse(0, -this.size * 0.14, this.size * 0.45, this.size * 0.3);
    } else {
      fill(50, 185, 145);
      ellipse(0, 0, this.size * 0.7, this.size * 0.9);
      fill(120, 220, 255);
      ellipse(0, -this.size * 0.12, this.size * 0.4, this.size * 0.35);
    }
  }
}

// ============================================================
// EGG SHIP (level 2) - shield is closed most of the time.
// It opens briefly while it hatches 2 bombs: shoot it then!
// ============================================================

class EggShip {
  x = 0;
  y = 0;
  rowY = 0;
  size = 110;
  hp = 0;
  maxHp = 0;
  speed = 1.1;
  dir = 0;
  phaseTimer = 0;
  flash = 0;
  shieldOpen = false;
  entered = false;

  constructor(x, y, rowY, hp, dir) {
    this.x = x;
    this.y = y;
    this.rowY = rowY;
    this.hp = hp;
    this.maxHp = hp;
    this.dir = dir;
    this.phaseTimer = 120 + (dir < 0 ? 100 : 0);   // the two eggs open at different times
  }

  update(list) {
    if (frozen()) return;
    if (this.flash > 0) this.flash--;
    if (!this.entered) {
      this.y += 1.6;
      if (this.y >= this.rowY) this.entered = true;
      return;
    }
    this.x += this.dir * this.speed;
    if (this.x < this.size / 2 || this.x > width - this.size / 2) this.dir *= -1;

    this.phaseTimer--;
    if (this.phaseTimer <= 0) {
      this.shieldOpen = !this.shieldOpen;
      if (this.shieldOpen) {
        this.phaseTimer = 130;
        list.push(new TentacleShip(T_BOMB, this.x - 24, this.y + this.size * 0.35));
        list.push(new TentacleShip(T_BOMB, this.x + 24, this.y + this.size * 0.35));
      } else {
        this.phaseTimer = 200;
      }
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    if (tEggImg != null) {
      noTint();
      drawFit(tEggImg, this.size);
    } else {
      stroke(240, 150, 160);
      strokeWeight(3);
      for (let i = -2; i <= 2; i++) line(i * 14, this.size * 0.35, i * 20, this.size * 0.55);
      noStroke();
      strokeWeight(1);
      fill(50, 185, 145);
      ellipse(0, 0, this.size * 0.85, this.size);
      fill(120, 220, 255);
      ellipse(0, -this.size * 0.08, this.size * 0.5, this.size * 0.4);
    }
    pop();

    if (!this.shieldOpen) {                    // blue shield = bullets are blocked
      noStroke();
      fill(100, 200, 255, this.flash > 0 ? 90 : 35);
      ellipse(this.x, this.y, this.size * 1.25, this.size * 1.25);
      noFill();
      stroke(100, 200, 255, this.flash > 0 ? 255 : 150);
      strokeWeight(this.flash > 0 ? 5 : 3);
      ellipse(this.x, this.y, this.size * 1.25, this.size * 1.25);
    } else {                        // orange ring = open, vulnerable
      noFill();
      stroke(255, 170, 60, 220);
      strokeWeight(3);
      ellipse(this.x, this.y, this.size * 1.1, this.size * 1.1);
    }
    strokeWeight(1);
    noStroke();

    rectMode(CORNER);
    fill(60, 60, 80);
    rect(this.x - 30, this.y - this.size * 0.72, 60, 5);
    fill(this.shieldOpen ? color(255, 170, 60) : color(100, 200, 255));
    rect(this.x - 30, this.y - this.size * 0.72, 60 * constrain(this.hp / this.maxHp, 0, 1), 5);
  }
}

// ============================================================
// EXPLOSION (visual only)
// ============================================================

class Boom {
  x = 0;
  y = 0;
  r = 0;
  maxR = 0;

  constructor(x, y, maxR) {
    this.x = x;
    this.y = y;
    this.maxR = maxR;
    this.r = 6;
    sfxExplosion.play();   // chapter 2 explosions (bombs, creatures, eggs)
  }

  update() {
    this.r += (this.maxR - this.r) * 0.25 + 1;
  }

  done() {
    return this.r >= this.maxR * 0.97;
  }

  display() {
    let k = constrain(this.r / this.maxR, 0, 1);
    noStroke();
    fill(255, 170, 60, 200 * (1 - k));
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    fill(255, 240, 180, 230 * (1 - k));
    ellipse(this.x, this.y, this.r, this.r);
    noFill();
    stroke(255, 120, 40, 200 * (1 - k));
    strokeWeight(3);
    ellipse(this.x, this.y, this.r * 2.3, this.r * 2.3);
    strokeWeight(1);
    noStroke();
  }
}

// ============================================================
// SOUND SYSTEM
// Each effect looks in data/sounds/ for a file whose name contains one of its
// keywords (for example "shoot.wav", "laser_1.mp3"). If nothing is found the game
// simply stays silent for that effect and the CONSOLE tells you what is missing.
// ============================================================


// ============================================================
// WEB-ONLY PARTS (replace Processing's setup / image / sound loading)
// ============================================================

// Load one picture. If the file is missing the game keeps using the drawn shape.
function loadOptionalImage(file, onLoad) {
  loadImage(
    IMG_FOLDER + file,
    (img) => {
      onLoad(img);
      console.log('OK       image ' + IMG_FOLDER + file + '  (' + img.width + ' x ' + img.height + ')');
    },
    () => console.warn('MISSING  image ' + IMG_FOLDER + file + '  -> the game draws a shape instead')
  );
}

function setup() {
  const cnv = createCanvas(800, 600);
  gameCanvas = cnv.elt;
  cnv.elt.addEventListener('contextmenu', (e) => e.preventDefault());   // no right-click menu
  imageMode(CENTER);
  textFont('Arial');

  // ---- which picture file is used for which creature ----
  loadOptionalImage('ship.png',       (img) => { shipImg = img; });       // your ship
  loadOptionalImage('stone.png',      (img) => { stoneImg = img; });      // rocks
  loadOptionalImage('ufo.png',        (img) => { ufoImg = img; });        // stage 1 boss (UFO)
  loadOptionalImage('alien.png',      (img) => { alienImg = img; });      // stage 1 level 4 aliens
  loadOptionalImage('warship.png',    (img) => { warshipImg = img; });    // stage 1 final boss
  loadOptionalImage('aliencress.png', (img) => { tRaiderImg = img; });    // stage 2 raiders
  loadOptionalImage('t_saucer.png',   (img) => { tSaucerImg = img; });    // stage 2 saucers
  loadOptionalImage('t_bomb.png',     (img) => { tBombImg = img; });      // stage 2 bomb ships
  loadOptionalImage('t_egg.png',      (img) => { tEggImg = img; });       // stage 2 eggs
  loadOptionalImage('aliencre.png',   (img) => { octopusImg = img; });    // stage 2 level 3 octopus
  loadOptionalImage('GreenEye.png',   (img) => {                          // centipede head
    centipedeEyeSheet = img;
    centipedeHeadSprite = (img.width >= 192 && img.height >= 288) ? img.get(0, 0, 96, 96) : img;
  });

  loadSounds();
  startAtMenu();
}

// ---------------- SOUND (p5.sound) ----------------
// Each sound tries a few file names in the sounds/ folder. Missing = silent.
class Sfx {
  constructor(label, files, count, volume, minGap) {
    this.voices = [];      // several copies so quick repeats can overlap
    this.next = 0;
    this.volume = volume;
    this.minGap = minGap;  // minimum frames between two plays (stops sound spam)
    this.lastPlay = -999;
    this.tryNext(label, files, 0, count);
  }

  tryNext(label, files, i, count) {
    if (typeof loadSound !== 'function') {
      if (i === 0) console.warn('p5.sound is not loaded -> the game runs without sound');
      return;
    }
    if (i >= files.length) {
      console.warn('MISSING  sound ' + label + '  (looked for ' + files.join(', ') + ' in ' + SND_FOLDER + ')');
      return;
    }
    const path = SND_FOLDER + files[i];
    loadSound(
      path,
      (snd) => {
        this.voices.push(snd);
        for (let k = 1; k < count; k++) loadSound(path, (s2) => this.voices.push(s2), () => {});
        console.log('OK       sound ' + label + '  <-  ' + path);
      },
      () => this.tryNext(label, files, i + 1, count)
    );
  }

  play() {
    if (this.voices.length === 0 || soundMuted) return;
    if (frameCount - this.lastPlay < this.minGap) return;
    this.lastPlay = frameCount;
    const v = this.voices[this.next % this.voices.length];
    this.next = (this.next + 1) % this.voices.length;
    try {
      v.setVolume(this.volume);
      v.play();
    } catch (e) { /* sound problems must never stop the game */ }
  }
}

function loadSounds() {
  //                    name         file names to try (WAV or MP3)                              copies volume gap
  sfxShoot     = new Sfx('shoot',     ['laserShoot.wav', 'laserShoot.mp3', 'shoot.wav', 'shoot.mp3'],         3, 0.35, 0);
  sfxExplosion = new Sfx('explosion', ['explosion.wav', 'explosion.mp3'],                                     4, 0.60, 3);
  sfxSelect    = new Sfx('select',    ['blipSelect.wav', 'blipSelect.mp3', 'select.wav', 'select.mp3'],       1, 0.60, 0);
  sfxPortal    = new Sfx('portal',    ['synth.wav', 'synth.mp3', 'portal.wav', 'portal.mp3'],                 1, 0.70, 0);
  sfxPowerup   = new Sfx('powerup',   ['powerUp.wav', 'powerUp.mp3', 'powerup.wav', 'powerup.mp3'],           2, 0.70, 0);
}

// ---------------- SAFETY NET ----------------
function startAudioSafely() {
  if (typeof userStartAudio === 'function') {
    try { userStartAudio(); } catch (e) { /* ignore */ }
  }
}

// draw() runs the game. If something goes wrong, the real error is shown on the
// screen (and in the console with F12) instead of the useless "Script error."
let gameCrashed = false;
function draw() {
  if (gameCrashed) return;
  try {
    updateTouchControls();
    gameDraw();
    drawTouchUI();
  } catch (e) {
    showError(e);
  }
}

function showError(e) {
  console.error(e);
  if (typeof window === 'undefined') throw e;   // (only used when testing outside a browser)
  gameCrashed = true;
  push();
  resetMatrix();
  rectMode(CORNER);
  noStroke();
  fill(0, 235);
  rect(20, 20, 760, 190, 8);
  fill(255, 110, 110);
  textAlign(LEFT, TOP);
  textSize(15);
  text('GAME ERROR: ' + (e && e.message ? e.message : e) +
       '\n\nPress F12 and open the Console to see the line number.\nSend this message to get it fixed.', 34, 34, 732, 170);
  pop();
}

// ============================================================
// PHONE / TABLET CONTROLS
//   Left half of the screen  : touch and drag = move (joystick)
//   Right half of the screen : touch and drag = aim, and the ship fires while you hold
//   Buttons on the right     : pause, sound, menu (when paused)
// Computers keep WASD + mouse. Phone mode switches on at the first touch.
// ============================================================

let touchMode = false;
let gameCanvas = null;
let aimX = 400, aimY = 0;          // where the ship points (mouse on computer, finger on phone)
let joyX = 0, joyY = 0;            // joystick movement from -1 to 1
let joyTouchId = null, joyOx = 0, joyOy = 0;
let aimTouchId = null;
let touchFire = false;
const JOY_RADIUS = 60;
const BTN_X = 750, BTN_PAUSE_Y = 112, BTN_MUTE_Y = 162, BTN_MENU_Y = 212, BTN_R = 24;

function findTouch(id) {
  for (const t of touches) {
    if (t.id === id) return t;
  }
  return null;
}

function btnHit(x, y, by) {
  return dist(x, y, BTN_X, by) < BTN_R + 8;
}

function clientToCanvas(cx, cy) {
  const r = gameCanvas.getBoundingClientRect();
  return { x: (cx - r.left) * width / r.width, y: (cy - r.top) * height / r.height };
}

function togglePause() {
  if (gameState == PAUSED) {
    gameState = previousState;
  } else if (isPlaying()) {
    previousState = gameState;
    gameState = PAUSED;
  }
}

function menuClickAt(x, y) {
  if (x >= width / 2 - 145 && x <= width / 2 + 145) {
    if (y >= 290 && y <= 352) { sfxSelect.play(); startGame(0); }
    else if (y >= 370 && y <= 432) { sfxSelect.play(); startGame(1); }
  }
}

function handleTouchStart(id, x, y) {
  if (gameState === MENU) { menuClickAt(x, y); return; }
  if (gameState === GAME_OVER || gameState === VICTORY) {
    if (x < 230 && y > height - 120) startAtMenu();      // bottom-left corner = menu
    else restartCurrentMode();                           // anywhere else = try again
    return;
  }
  if (isPlaying() || gameState === PAUSED) {
    if (btnHit(x, y, BTN_PAUSE_Y)) { togglePause(); return; }
    if (btnHit(x, y, BTN_MUTE_Y)) { soundMuted = !soundMuted; return; }
    if (gameState === PAUSED && btnHit(x, y, BTN_MENU_Y)) { startAtMenu(); return; }
  }
  if (isPlaying()) {
    if (x < width * 0.5) {                               // left side: joystick starts where you touch
      joyTouchId = id; joyOx = x; joyOy = y;
    } else {                                             // right side: analog fire pad
      aimTouchId = id;
      const padX = width - 105;
      const padY = height - 105;
      const dx = x - padX;
      const dy = y - padY;
      const d = Math.hypot(dx, dy);
      const maxDist = JOY_RADIUS;
      const clamped = d > maxDist ? maxDist / d : 1;
      aimX = padX + dx * clamped;
      aimY = padY + dy * clamped;
      touchFire = true;
    }
  }
}

function touchStarted(e) {
  touchMode = true;
  startAudioSafely();
  const list = (e && e.changedTouches) ? e.changedTouches : [];
  for (const t of list) {
    const p = clientToCanvas(t.clientX, t.clientY);
    handleTouchStart(t.identifier, p.x, p.y);
  }
  return false;              // stops the page from scrolling or zooming
}
function touchMoved() { return false; }
function touchEnded() { return false; }

function updateTouchControls() {
  if (!touchMode) {                                      // computer: mouse aims, WASD moves
    aimX = mouseX; aimY = mouseY;
    touchFire = false; joyX = 0; joyY = 0;
    return;
  }
  joyX = 0; joyY = 0;
  if (joyTouchId !== null) {
    const t = findTouch(joyTouchId);
    if (t) {
      let vx = t.x - joyOx, vy = t.y - joyOy;
      const d = Math.hypot(vx, vy);
      if (d > JOY_RADIUS) { vx = vx / d * JOY_RADIUS; vy = vy / d * JOY_RADIUS; }
      joyX = vx / JOY_RADIUS; joyY = vy / JOY_RADIUS;
      if (Math.hypot(joyX, joyY) < 0.18) { joyX = 0; joyY = 0; }   // small dead zone
    } else {
      joyTouchId = null;
    }
  }
  touchFire = false;
  if (aimTouchId !== null) {
    const t = findTouch(aimTouchId);
    if (t) {
      const padX = width - 105;
      const padY = height - 105;
      let vx = t.x - padX;
      let vy = t.y - padY;
      const d = Math.hypot(vx, vy);
      const maxDist = JOY_RADIUS;
      if (d > maxDist) {
        const scale = maxDist / d;
        vx *= scale;
        vy *= scale;
      }
      aimX = padX + vx;
      aimY = padY + vy;
      touchFire = true;
    } else {
      aimTouchId = null;
    }
  }
}

function drawRoundButton(by, label) {
  fill(10, 20, 40, 170);
  stroke(120, 200, 255, 170);
  strokeWeight(2);
  ellipse(BTN_X, by, BTN_R * 2, BTN_R * 2);
  noStroke();
  fill(220, 240, 255);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(label, BTN_X, by);
}

function drawTouchUI() {
  if (!touchMode) return;
  push();
  rectMode(CORNER);
  const playing = isPlaying();

  if (playing) {
    // joystick: a faint hint at the bottom-left, then the real one where you touch
    const active = joyTouchId !== null;
    const ox = active ? joyOx : 105;
    const oy = active ? joyOy : height - 105;
    noFill();
    stroke(120, 200, 255, active ? 140 : 70);
    strokeWeight(3);
    ellipse(ox, oy, JOY_RADIUS * 2, JOY_RADIUS * 2);
    noStroke();
    fill(120, 200, 255, active ? 150 : 60);
    ellipse(ox + joyX * JOY_RADIUS, oy + joyY * JOY_RADIUS, 52, 52);
    if (!active) {
      fill(200, 225, 255, 120);
      textAlign(CENTER, CENTER);
      textSize(13);
      text('MOVE', ox, oy);
    }

    const padX = width - 105;
    const padY = height - 105;
    if (aimTouchId === null) {
      noFill();
      stroke(255, 120, 150, 70);
      strokeWeight(3);
      ellipse(padX, padY, JOY_RADIUS * 2, JOY_RADIUS * 2);
      noStroke();
      fill(255, 190, 205, 120);
      textAlign(CENTER, CENTER);
      textSize(13);
      text('FIRE', padX, padY);
    } else {
      noFill();
      stroke(255, 120, 150, 200);
      strokeWeight(2);
      ellipse(padX, padY, JOY_RADIUS * 2, JOY_RADIUS * 2);
      const dx = aimX - padX;
      const dy = aimY - padY;
      const knobX = padX + dx;
      const knobY = padY + dy;
      fill(255, 160, 180, 170);
      ellipse(knobX, knobY, 38, 38);
      line(knobX - 18, knobY, knobX + 18, knobY);
      line(knobX, knobY - 18, knobX, knobY + 18);
    }
  }

  if (playing || gameState === PAUSED) {
    drawRoundButton(BTN_PAUSE_Y, gameState === PAUSED ? 'PLAY' : 'PAUSE');
    drawRoundButton(BTN_MUTE_Y, soundMuted ? 'SOUND OFF' : 'SOUND');
    if (gameState === PAUSED) drawRoundButton(BTN_MENU_Y, 'MENU');
  }

  if (gameState === GAME_OVER || gameState === VICTORY) {
    fill(200, 225, 255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('TAP TO TRY AGAIN   \u2022   TAP THE BOTTOM-LEFT CORNER FOR MENU', width / 2, height - 40);
  }
  pop();
}
