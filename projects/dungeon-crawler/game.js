/* Dungeon Maze Escape - browser port of the Dungeon-Crawler pygame game.
   Maze generation, entities, turn order, rules and log messages follow the
   Python source (controller.py, state.py, entities/, game/atmosphere.py,
   game/fog_of_war.py). Rendering is a top-down tile canvas instead of the
   first-person tunnel view. */
(function () {
  'use strict';

  // ---------- config (config/constants.py) ----------
  var MAZE_SIZE = 8;
  var PLAYER_MAX_HEALTH = 100;
  var HEAL_AMOUNT = 25;
  var DAMAGE = { ghost: 35, skeleton: 50, ogre: 100 };
  var SKELETON_CHASE_DISTANCE = 4;
  var OGRE_GUARD_RADIUS = 3;
  var TELEPORT_MIN_DISTANCE = 8;
  var FOG_RADIUS = 1;      // fog_of_war.py visibility_range
  var DETECT_RANGE = 3;    // atmosphere.py detection_range

  // Same order as the DIRECTIONS dict in constants.py
  var DIR_ORDER = ['w', 's', 'a', 'd'];
  var DIRS = {
    w: { dx: 0, dy: -1, wall: 'top', opp: 'bottom' },
    s: { dx: 0, dy: 1, wall: 'bottom', opp: 'top' },
    a: { dx: -1, dy: 0, wall: 'left', opp: 'right' },
    d: { dx: 1, dy: 0, wall: 'right', opp: 'left' }
  };
  var OPPOSITES = { w: 's', s: 'w', a: 'd', d: 'a' };
  // facing index: 0 North, 1 East, 2 South, 3 West (entities/player.py)
  var FACING_KEYS = ['w', 'd', 's', 'a'];
  var FACING_NAMES = ['NORTH (Up)', 'EAST (Right)', 'SOUTH (Down)', 'WEST (Left)'];
  var RELATIVE = ['ahead', 'to your right', 'behind you', 'to your left'];
  var VEC_IDX = { '0,-1': 0, '1,0': 1, '0,1': 2, '-1,0': 3 };

  var OMINOUS = {
    ghost: 'A FREEZING COLD GRIP TIGHTENS AROUND YOUR HEART FROM {}!',
    skeleton: 'THE CLATTERING OF BONES IS DEAFENING {}!',
    ogre: 'A FOUL STENCH AND HEAVY BREATHING ASSAULTS YOU FROM {}!'
  };
  var ATMOS = {
    ghost: ['An ethereal whisper echoes from {}...', 'You feel a spectral presence {}...', 'A ghostly chill emanates from {}...'],
    skeleton: ['You hear bones rattling {}...', 'The sound of scraping bone comes from {}...', 'Ancient whispers drift from {}...'],
    ogre: ['Heavy footsteps thunder from {}...', 'A guttural growl rumbles from {}...', 'The ground trembles {}...'],
    treasure: ['A faint metallic gleam catches your eye {}...', 'You sense something precious {}...'],
    key: ['You hear a faint jingling {}...'],
    health_potion: ['You smell something sweet and herbal {}...', 'A faint red glow emanates from {}...', 'The air feels revitalizing {}...']
  };
  var COMPASS_FOUND = [
    '✨ You discover an ancient compass. Its needle spins wildly, as if confused by the dungeon\'s magic...',
    '✨ You retrieve a dusty compass. It hums with energy, but the needle seems to drift on its own accord...',
    '✨ A mystical compass lies before you. It points the way, but its movements are jittery and erratic...'
  ];

  // audio: AUDIO_* files from the repo, volumes from audio_manager.py
  var SOUND_FILES = {
    key: 'AUDIO_KEY_FOUND.wav',
    win: 'AUDIO_WIN.wav',
    lose: 'AUDIO_LOSE.mp3',
    warning: 'AUDIO_WARNING.wav',
    opening: 'AUDIO_OPENING.mp3',
    walk: 'AUDIO_WALKING.mp3',
    damage: 'AUDIO_DAMAGE.mp3',
    potion: 'AUDIO_KEY_FOUND.wav'
  };
  var SOUND_VOL = { walk: 0.4, warning: 0.6, opening: 0.7 };
  var IMAGE_FILES = {
    wall: 'wall.jpg',
    treasure: 'treasure.png',
    key: 'key.png',
    compass: 'compass.png',
    potion: 'health_pot.png',
    ghost: 'ghost.png',
    skeleton: 'skeleton.png',
    ogre: 'ogre.png'
  };

  // ---------- small helpers ----------
  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function P(x, y) { return { x: x, y: y }; }
  function eq(a, b) { return !!a && !!b && a.x === b.x && a.y === b.y; }
  function man(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function step(pos, dir) { var d = DIRS[dir]; return P(pos.x + d.dx, pos.y + d.dy); }
  function inBounds(g, p) { return p.x >= 0 && p.x < g.size && p.y >= 0 && p.y < g.size; }

  // ---------- maze (core/maze_generator.py, recursive backtracker) ----------
  function makeMaze(size) {
    var maze = [];
    for (var y = 0; y < size; y++) {
      var row = [];
      for (var x = 0; x < size; x++) {
        row.push({ top: true, right: true, bottom: true, left: true, visited: false });
      }
      maze.push(row);
    }
    var stack = [P(0, 0)];
    maze[0][0].visited = true;
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var nb = [];
      DIR_ORDER.forEach(function (k) {
        var d = DIRS[k];
        var nx = cur.x + d.dx, ny = cur.y + d.dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && !maze[ny][nx].visited) {
          nb.push({ x: nx, y: ny, wall: d.wall, opp: d.opp });
        }
      });
      if (nb.length) {
        var n = pick(nb);
        maze[cur.y][cur.x][n.wall] = false;
        maze[n.y][n.x][n.opp] = false;
        maze[n.y][n.x].visited = true;
        stack.push(P(n.x, n.y));
      } else {
        stack.pop();
      }
    }
    return maze;
  }

  function hasWall(g, pos, dir) { return g.maze[pos.y][pos.x][DIRS[dir].wall]; }
  function canMove(g, pos, dir) {
    if (!DIRS[dir]) return false;
    var n = step(pos, dir);
    return inBounds(g, n) && !hasWall(g, pos, dir);
  }

  function isExplored(g, x, y) { return !!g.explored[x + ',' + y]; }
  function isVisible(g, x, y) {
    return Math.abs(x - g.pos.x) <= FOG_RADIUS && Math.abs(y - g.pos.y) <= FOG_RADIUS;
  }
  function explore(g, pos) {
    for (var dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
      for (var dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
        var x = pos.x + dx, y = pos.y + dy;
        if (x >= 0 && x < g.size && y >= 0 && y < g.size) g.explored[x + ',' + y] = true;
      }
    }
  }

  // ---------- game setup (game/state.py _place_entities) ----------
  function randomEmpty(g, exclude) {
    for (;;) {
      var p = P(rint(0, g.size - 1), rint(0, g.size - 1));
      var taken = exclude.some(function (e) { return eq(e, p); });
      if (!taken) return p;
    }
  }

  function newGame() {
    var size = MAZE_SIZE;
    var g = {
      size: size,
      maze: makeMaze(size),
      explored: {},
      status: 'playing',
      hp: PLAYER_MAX_HEALTH,
      maxHp: PLAYER_MAX_HEALTH,
      hasKey: false,
      hasCompass: false,
      turns: 0,
      facing: 0,
      lastAction: 'Ready to start.',
      pos: null,
      treasure: null,
      key: null,
      compass: null,
      ghost: null,
      skeleton: null,
      ogre: null,
      potions: []
    };
    // Treasure in a far corner
    var tx = size - 1 - rint(0, 2);
    var ty = size - 1 - rint(0, 2);
    g.treasure = { type: 'treasure', pos: P(tx, ty) };
    // Player near start
    g.pos = P(rint(0, 2), rint(0, 2));
    // Key somewhere in the middle area
    var lo = Math.floor(size / 4), hi = Math.floor(3 * size / 4);
    for (;;) {
      var kp = P(rint(lo, hi), rint(lo, hi));
      if (!eq(kp, g.pos) && !eq(kp, g.treasure.pos)) { g.key = { type: 'key', pos: kp }; break; }
    }
    g.compass = { type: 'compass', pos: randomEmpty(g, [g.pos, g.treasure.pos, g.key.pos]) };
    g.ghost = { type: 'ghost', name: 'ghost', pos: randomEmpty(g, [g.pos, g.treasure.pos, g.key.pos, g.compass.pos]) };
    g.skeleton = { type: 'skeleton', name: 'skeleton', pos: randomEmpty(g, [g.pos, g.treasure.pos, g.key.pos, g.compass.pos, g.ghost.pos]) };
    // Ogre near the treasure
    var ox = clamp(tx + rint(-3, 3), 0, size - 1);
    var oy = clamp(ty + rint(-3, 3), 0, size - 1);
    g.ogre = { type: 'ogre', name: 'ogre', pos: P(ox, oy) };
    // Two health potions
    for (var i = 0; i < 2; i++) {
      var ex = [g.pos, g.treasure.pos, g.key.pos, g.compass.pos, g.ghost.pos, g.skeleton.pos, g.ogre.pos];
      g.potions.forEach(function (p) { ex.push(p.pos); });
      g.potions.push({ type: 'health_potion', pos: randomEmpty(g, ex) });
    }
    explore(g, g.pos);
    return g;
  }

  // ---------- atmosphere (game/atmosphere.py) ----------
  function dirVector(from, to) {
    var dx = to.x - from.x, dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) return [dx > 0 ? 1 : -1, 0];
    if (Math.abs(dy) > Math.abs(dx)) return [0, dy > 0 ? 1 : -1];
    return pick([[dx > 0 ? 1 : -1, 0], [0, dy > 0 ? 1 : -1]]);
  }
  function relText(g, vec) {
    var idx = VEC_IDX[vec[0] + ',' + vec[1]];
    if (idx === undefined) return 'nearby';
    return RELATIVE[(idx - g.facing + 4) % 4];
  }
  function atmosphere(g) {
    var closest = null, best = Infinity;
    g.potions.forEach(function (p) {
      var d = man(g.pos, p.pos);
      if (d < best) { best = d; closest = p; }
    });
    var ents = [
      g.ghost, g.skeleton, g.ogre, g.treasure,
      g.hasKey ? null : g.key,
      closest
    ];
    var nearby = [];
    ents.forEach(function (ent) {
      if (!ent) return;
      var d = man(g.pos, ent.pos);
      if (d >= 1 && d <= DETECT_RANGE && ATMOS[ent.type]) {
        nearby.push({ type: ent.type, rel: relText(g, dirVector(g.pos, ent.pos)), d: d });
      }
    });
    if (!nearby.length) return null;
    nearby.sort(function (a, b) { return a.d - b.d; });
    var n = nearby[0];
    return pick(ATMOS[n.type]).replace('{}', n.rel);
  }
  function ominous(g, enemy) {
    var rel = relText(g, dirVector(g.pos, enemy.pos));
    return OMINOUS[enemy.name].replace('{}', rel.toUpperCase());
  }
  function compassHint(g) {
    var px = g.pos.x, py = g.pos.y, tx = g.treasure.pos.x, ty = g.treasure.pos.y;
    var valid = [];
    if (ty < py) valid.push(0);
    if (tx > px) valid.push(1);
    if (ty > py) valid.push(2);
    if (tx < px) valid.push(3);
    if (!valid.length) return 'The compass spins lazily... you are standing right on it!';
    var t = pick(valid);
    var fin = Math.random() < 0.7 ? t : (t + 2) % 4;   // 70% correct
    var rel = RELATIVE[(fin - g.facing + 4) % 4];
    return pick([
      'The compass hums softly and points ' + rel + '.',
      'The needle spins wildly before settling to point ' + rel + '.',
      'A magical pull tugs the compass ' + rel + '.',
      'The ancient device glows purple, indicating the treasure is ' + rel + '.'
    ]);
  }

  // ---------- enemies (entities/enemies/*.py) ----------
  function ghostMove(g, e) {
    if (Math.random() < 0.3) {
      var n = step(e.pos, pick(DIR_ORDER));
      if (inBounds(g, n)) e.pos = n;
    } else {
      var best = null, bd = Infinity;
      DIR_ORDER.forEach(function (d) {
        var n = step(e.pos, d);
        if (inBounds(g, n)) {
          var dist = man(n, g.pos);
          if (dist < bd) { bd = dist; best = n; }
        }
      });
      if (best) e.pos = best;
    }
  }

  function skeletonTowards(g, e, lastDir) {
    var best = null, bd = Infinity, bestDir = null;
    DIR_ORDER.forEach(function (d) {
      if (lastDir && d === OPPOSITES[lastDir]) return;
      if (!hasWall(g, e.pos, d)) {
        var n = step(e.pos, d);
        var dist = man(n, g.pos);
        if (dist < bd) { bd = dist; best = n; bestDir = d; }
      }
    });
    if (best) { e.pos = best; return bestDir; }
    return lastDir;
  }
  function skeletonRandom(g, e, lastDir) {
    var dirs = shuffle(DIR_ORDER.slice());
    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      if (lastDir && d === OPPOSITES[lastDir]) continue;
      if (!hasWall(g, e.pos, d)) { e.pos = step(e.pos, d); return d; }
    }
    return lastDir;
  }
  function skeletonMove(g, e) {
    var distance = man(e.pos, g.pos);
    var lastDir = null;
    var moves = rint(1, 3);
    for (var i = 0; i < moves; i++) {
      if (eq(e.pos, g.pos)) break;
      if (distance <= SKELETON_CHASE_DISTANCE) {
        lastDir = skeletonTowards(g, e, lastDir);
        distance = man(e.pos, g.pos);
      } else {
        lastDir = skeletonRandom(g, e, lastDir);
      }
    }
  }

  function ogreMove(g, e) {
    var dirs = shuffle(DIR_ORDER.slice());
    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      if (!hasWall(g, e.pos, d)) {
        var n = step(e.pos, d);
        if (Math.abs(n.x - g.treasure.pos.x) <= OGRE_GUARD_RADIUS &&
            Math.abs(n.y - g.treasure.pos.y) <= OGRE_GUARD_RADIUS) {
          e.pos = n;
          return;
        }
      }
    }
  }

  function moveEnemy(g, e) {
    if (e.type === 'ghost') ghostMove(g, e);
    else if (e.type === 'skeleton') skeletonMove(g, e);
    else ogreMove(g, e);
  }

  function teleport(g, e) {
    for (;;) {
      var p = P(rint(0, g.size - 1), rint(0, g.size - 1));
      if (man(p, g.pos) >= TELEPORT_MIN_DISTANCE) { e.pos = p; return; }
    }
  }

  // state.py check_encounter: applies damage, returns message
  function encounter(g, e) {
    var dmg, msg;
    if (e.type === 'ghost') {
      dmg = DAMAGE.ghost;
      msg = 'Ghost phased through you! Took ' + dmg + ' DMG!';
    } else if (e.type === 'skeleton') {
      dmg = DAMAGE.skeleton;
      msg = 'Skeleton struck you! Took ' + dmg + ' DMG!';
    } else {
      dmg = DAMAGE.ogre;
      msg = 'The Ogre crushed you!';
    }
    g.hp -= dmg;
    if (g.hp <= 0) {
      g.hp = 0;
      g.status = 'lost';
      return msg + ' YOU DIED.';
    }
    return msg;
  }

  // ---------- movement (controller.py _process_movement) ----------
  // Returns the action message. Logs that the original wiped by
  // message_history.clear() are pushed to `extra` and kept here.
  function processMove(g, dir, extra) {
    if (!canMove(g, g.pos, dir)) return 'Blocked!';
    g.pos = step(g.pos, dir);
    explore(g, g.pos);
    sfx('walk', 1000);

    // Potions
    var pIdx = -1;
    for (var i = 0; i < g.potions.length; i++) {
      if (eq(g.pos, g.potions[i].pos)) { pIdx = i; break; }
    }
    if (pIdx !== -1) {
      if (g.hp < g.maxHp) {
        var old = g.hp;
        g.hp = Math.min(g.maxHp, g.hp + HEAL_AMOUNT);
        var healed = g.hp - old;
        g.potions.splice(pIdx, 1);
        extra.push('[*]Gulp! Restored ' + healed + ' HP.');
        sfx('potion');
        return '[*]Used Potion (+' + healed + ')';
      }
      return 'Health full.';
    }

    // Items
    if (!g.hasKey && g.key && eq(g.pos, g.key.pos)) {
      g.hasKey = true;
      g.key = null;
      sfx('key');
      return '[*]FOUND KEY!';
    }
    if (!g.hasCompass && g.compass && eq(g.pos, g.compass.pos)) {
      g.hasCompass = true;
      g.compass = null;
      sfx('key');
      extra.push('[*]' + pick(COMPASS_FOUND));
      return 'Found Compass';
    }

    // Treasure
    if (eq(g.pos, g.treasure.pos)) {
      if (g.hasKey) {
        g.status = 'won';
        sfx('win');
        return '[*]TREASURE UNLOCKED!';
      }
      return 'Locked.';
    }

    // Walking into an enemy
    var encounters = [];
    var enemies = [g.ghost, g.skeleton, g.ogre];
    var hit = [];
    enemies.forEach(function (e) {
      if (eq(g.pos, e.pos)) {
        var msg = encounter(g, e);
        G.flash = 1;
        sfx('damage');
        encounters.push('[!]' + msg);
        if (g.status === 'playing') teleport(g, e);
        else if (g.status === 'lost') sfx('lose');
        hit.push(e);
      }
    });

    // Enemy turn
    enemies.forEach(function (e) {
      if (hit.indexOf(e) !== -1) return;
      moveEnemy(g, e);
      var dist = man(g.pos, e.pos);
      if (dist === 0) {
        var msg2 = encounter(g, e);
        G.flash = 1;
        sfx('damage');
        encounters.push('[!]' + msg2);
        if (g.status === 'playing') teleport(g, e);
        else if (g.status === 'lost') sfx('lose');
      } else if (dist === 1) {
        var dx = e.pos.x - g.pos.x, dy = e.pos.y - g.pos.y;
        var cd = null;
        if (dy === -1) cd = 'w';
        else if (dy === 1) cd = 's';
        else if (dx === -1) cd = 'a';
        else if (dx === 1) cd = 'd';
        if (cd && !hasWall(g, g.pos, cd)) {
          extra.push('[!]' + ominous(g, e));
          sfx('warning');
        }
      }
    });

    if (encounters.length) return encounters.join(' ');
    return 'Moved.';
  }

  // ---------- turn actions (controller.py event loop) ----------
  function postTurn(g) {
    if (g.hasCompass) addLog('[^]' + compassHint(g));
  }

  function actionTurn(dir) {
    var g = G.state;
    if (!g || g.status !== 'playing') return;
    g.facing = (g.facing + (dir === 'left' ? 3 : 1)) % 4;
    G.view.ta += dir === 'left' ? -90 : 90;
    g.turns += 1;
    g.lastAction = dir === 'left' ? 'Turned Left' : 'Turned Right';
    postTurn(g);
    renderHUD();
  }

  function actionForward() {
    var g = G.state;
    if (!g || g.status !== 'playing') return;
    var key = FACING_KEYS[g.facing];
    var extra = [];
    var msg, action;
    if (canMove(g, g.pos, key)) {
      msg = processMove(g, key, extra);
      action = 'Forward: ' + msg;
    } else {
      msg = 'Blocked!';
      action = 'Blocked!';
    }
    G.log = [];                       // message_history.clear()
    g.turns += 1;
    g.lastAction = action;
    extra.forEach(function (line) { addLog(line); });
    if (msg.indexOf('[') !== -1) addLog(msg);
    var atm = atmosphere(g);
    if (atm) addLog('[~]' + atm);
    postTurn(g);
    if (g.status !== 'playing') {
      addLog(g.status === 'won' ? '[*]YOU WON! TREASURE SECURED!' : '[!]GAME OVER: ' + g.status.toUpperCase());
      clearTimeout(G.overTimer);
      G.overTimer = setTimeout(function () {
        G.phase = 'over';
        syncOverlay();
      }, 1400);
    }
    renderHUD();
  }

  function addLog(text) {
    G.log.push(text);
    if (G.log.length > 10) G.log.shift();
  }

  // ---------- game flow ----------
  var G = { state: null, log: [], phase: 'title', overTimer: null, flash: 0, view: null };

  function resetGame() {
    clearTimeout(G.overTimer);
    G.state = newGame();
    G.log = ['Welcome to the Dungeon.', 'Find the Key & Compass!'];
    G.view = { x: G.state.pos.x, y: G.state.pos.y, a: 0, ta: 0 };
    G.flash = 0;
  }

  function startGame() {
    if (G.phase !== 'title') return;
    G.phase = 'play';
    sfx('opening');                   // first user gesture unlocks audio
    syncOverlay();
    renderHUD();
  }

  function restart() {
    resetGame();
    G.phase = 'play';
    syncOverlay();
    renderHUD();
  }

  // ---------- audio (game/audio_manager.py) ----------
  var sfxMap = {}, sfxTimers = {}, muted = false;

  function loadAudio() {
    Object.keys(SOUND_FILES).forEach(function (k) {
      try {
        var a = new Audio(SOUND_FILES[k]);
        a.preload = 'auto';
        a.volume = SOUND_VOL[k] !== undefined ? SOUND_VOL[k] : 1;
        sfxMap[k] = a;
      } catch (e) { /* audio unavailable */ }
    });
  }

  function sfx(name, maxMs) {
    var a = sfxMap[name];
    if (!a || muted) return;
    try {
      clearTimeout(sfxTimers[name]);
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* blocked until gesture */ });
      if (maxMs) sfxTimers[name] = setTimeout(function () { a.pause(); }, maxMs);
    } catch (e) { /* ignore */ }
  }

  function setMuted(m) {
    muted = m;
    if (m) {
      Object.keys(sfxMap).forEach(function (k) {
        try { sfxMap[k].pause(); } catch (e) { /* ignore */ }
      });
    }
    if (btnMute) {
      btnMute.textContent = muted ? 'Sound: Off' : 'Sound: On';
      btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }

  // ---------- rendering ----------
  var canvas = null, ctx = null, mapwrap = null, dpr = 1, cssW = 1, cssH = 1;
  var tile = 40, offX = 0, offY = 0, wallPat = null;
  var IMG = {};

  function loadImages() {
    Object.keys(IMAGE_FILES).forEach(function (k) {
      var im = new Image();
      im.onload = function () { wallPat = null; };
      im.src = IMAGE_FILES[k];
      IMG[k] = im;
    });
  }
  function imgOk(k) { return !!IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0; }

  function drawSprite(key, glyph, color, cx, cy, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (imgOk(key)) {
      ctx.drawImage(IMG[key], cx - size / 2, cy - size / 2, size, size);
    } else {
      ctx.fillStyle = color;
      ctx.font = 'bold ' + Math.floor(size * 0.8) + 'px MedievalPixel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, cx, cy);
    }
    ctx.restore();
  }

  function drawMap() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cssW, cssH);
    var g = G.state;
    if (!g) return;

    var T = tile, ox = offX, oy = offY, n = g.size;
    var t = T * 0.16;
    ctx.imageSmoothingEnabled = false;

    if (!wallPat && imgOk('wall')) {
      wallPat = ctx.createPattern(IMG.wall, 'repeat');
      if (wallPat && wallPat.setTransform && window.DOMMatrix) {
        wallPat.setTransform(new DOMMatrix().scale((T * 1.4) / IMG.wall.naturalWidth));
      }
    }

    var x, y, X, Y;
    // Floors (unexplored tiles stay black: fog of war)
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        X = ox + x * T; Y = oy + y * T;
        if (!isExplored(g, x, y)) { ctx.fillStyle = '#0d0d12'; ctx.fillRect(X, Y, T, T); continue; }
        ctx.fillStyle = isVisible(g, x, y) ? '#2b2733' : '#1a181f';
        ctx.fillRect(X, Y, T, T);
      }
    }

    // Walls of explored tiles
    ctx.fillStyle = wallPat || '#4a4a58';
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (!isExplored(g, x, y)) continue;
        X = ox + x * T; Y = oy + y * T;
        var c = g.maze[y][x];
        if (c.top) ctx.fillRect(X - t / 2, Y - t / 2, T + t, t);
        if (c.left) ctx.fillRect(X - t / 2, Y - t / 2, t, T + t);
        if (c.bottom) ctx.fillRect(X - t / 2, Y + T - t / 2, T + t, t);
        if (c.right) ctx.fillRect(X + T - t / 2, Y - t / 2, t, T + t);
      }
    }

    // Items (remembered once explored, like minimap.py)
    var items = [g.treasure];
    if (g.key) items.push(g.key);
    if (g.compass) items.push(g.compass);
    items = items.concat(g.potions);
    items.forEach(function (it) {
      if (!isExplored(g, it.pos.x, it.pos.y)) return;
      var cx = ox + (it.pos.x + 0.5) * T, cy = oy + (it.pos.y + 0.5) * T;
      var size = T * 0.78;
      if (it.type === 'treasure') drawSprite('treasure', 'T', '#ffd700', cx, cy, size, 1);
      else if (it.type === 'key') drawSprite('key', 'K', '#00bfff', cx, cy, size, 1);
      else if (it.type === 'compass') drawSprite('compass', 'C', '#8a2be2', cx, cy, size, 1);
      else drawSprite('potion', '♥', '#ff69b4', cx, cy, size, 1);
    });

    // Enemies (only inside the fog radius)
    [g.ghost, g.skeleton, g.ogre].forEach(function (e) {
      if (!isVisible(g, e.pos.x, e.pos.y)) return;
      var cx = ox + (e.pos.x + 0.5) * T, cy = oy + (e.pos.y + 0.5) * T;
      var size = T * 0.84;
      if (e.type === 'ghost') drawSprite('ghost', 'G', '#c864c8', cx, cy, size, 0.9);
      else if (e.type === 'skeleton') drawSprite('skeleton', 'S', '#dcdcc8', cx, cy, size, 1);
      else drawSprite('ogre', 'O', '#c83232', cx, cy, size, 1);
    });

    // Dim explored-but-not-visible tiles
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (isExplored(g, x, y) && !isVisible(g, x, y)) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(ox + x * T, oy + y * T, T, T);
        }
      }
    }

    // Player (green arrow showing facing)
    var px = ox + (G.view.x + 0.5) * T, py = oy + (G.view.y + 0.5) * T;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(G.view.a * Math.PI / 180);
    ctx.fillStyle = 'rgba(50,255,50,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, T * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#32ff32';
    ctx.strokeStyle = '#04210a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -T * 0.3);
    ctx.lineTo(T * 0.24, T * 0.22);
    ctx.lineTo(-T * 0.24, T * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Damage flash
    if (G.flash > 0.01) {
      ctx.fillStyle = 'rgba(200,30,30,' + (G.flash * 0.35).toFixed(3) + ')';
      ctx.fillRect(0, 0, cssW, cssH);
    }
  }

  function resizeCanvas() {
    if (!canvas || !mapwrap) return;
    var r = mapwrap.getBoundingClientRect();
    cssW = Math.max(1, Math.floor(r.width));
    cssH = Math.max(1, Math.floor(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    var side = Math.max(16, Math.min(cssW, cssH) - 16);
    tile = side / MAZE_SIZE;
    offX = (cssW - tile * MAZE_SIZE) / 2;
    offY = (cssH - tile * MAZE_SIZE) / 2;
    wallPat = null;
  }

  var lastFrame = 0;
  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    var g = G.state;
    if (g && G.view) {
      var k = 1 - Math.pow(0.0005, dt);
      G.view.x += (g.pos.x - G.view.x) * k;
      G.view.y += (g.pos.y - G.view.y) * k;
      G.view.a += (G.view.ta - G.view.a) * k;
    }
    G.flash *= Math.pow(0.02, dt);
    drawMap();
    requestAnimationFrame(frame);
  }

  // ---------- DOM (HUD, overlay, input) ----------
  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  var btnMute = null;

  function renderLog() {
    el.log.textContent = '';
    G.log.forEach(function (line) {
      var p = document.createElement('p');
      var tag = line.slice(0, 3);
      var cls = '';
      if (tag === '[!]') cls = 'warn';
      else if (tag === '[*]') cls = 'good';
      else if (tag === '[~]') cls = 'ambient';
      else if (tag === '[^]') cls = 'compass';
      p.className = cls;
      p.textContent = line.replace(/\[[!*~^]\]\s?/g, '').trim();
      el.log.appendChild(p);
    });
    el.log.scrollTop = el.log.scrollHeight;
  }

  function renderHUD() {
    if (!el.turn) return;
    var g = G.state;
    if (!g) return;
    el.turn.textContent = String(g.turns);
    var pct = Math.max(0, g.hp / g.maxHp);
    el.hpFill.style.width = (pct * 100).toFixed(1) + '%';
    el.hpFill.style.background = pct > 0.3 ? '#00c832' : '#c80000';
    el.hpText.textContent = g.hp + '/' + g.maxHp;
    el.slotKey.classList.toggle('off', !g.hasKey);
    el.slotCompass.classList.toggle('off', !g.hasCompass);
    el.facing.textContent = 'Facing: ' + FACING_NAMES[g.facing];
    el.last.textContent = g.lastAction;
    renderLog();
  }

  function syncOverlay() {
    if (!el.overlay) return;
    if (G.phase === 'play') { el.overlay.hidden = true; return; }
    el.overlay.hidden = false;
    var g = G.state;
    if (G.phase === 'title') {
      el.ovTitle.textContent = 'DUNGEON MAZE ESCAPE';
      el.ovText.textContent = 'Find the treasure while avoiding deadly enemies!';
      el.ovBtn.textContent = 'Press Enter to Start';
      el.ovHint.textContent = 'Left/Right or A/D turn · Up or W walk forward · M mute · R restart';
    } else {
      var won = g.status === 'won';
      el.ovTitle.textContent = won ? 'YOU WON! TREASURE SECURED!' : 'GAME OVER: LOST';
      el.ovText.textContent = won
        ? 'The chest bursts open in a shower of light. You survived ' + g.turns + ' turns.'
        : 'The dungeon claims another soul after ' + g.turns + ' turns.';
      el.ovBtn.textContent = 'Play Again';
      el.ovHint.textContent = 'Press Enter or R for a new maze';
    }
  }

  function onKey(e) {
    var k = e.key;
    var lk = k && k.length === 1 ? k.toLowerCase() : k;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') e.preventDefault();
    if (k === 'Enter') {
      if (G.phase === 'title') startGame();
      else if (G.phase === 'over') restart();
      return;
    }
    if (lk === 'r') { restart(); return; }
    if (lk === 'm') { if (!e.repeat) setMuted(!muted); return; }
    if (G.phase !== 'play' || e.repeat) return;
    if (lk === 'w' || k === 'ArrowUp') actionForward();
    else if (lk === 'a' || k === 'ArrowLeft') actionTurn('left');
    else if (lk === 'd' || k === 'ArrowRight') actionTurn('right');
  }

  function onAct(act) {
    if (G.phase !== 'play') return;
    if (act === 'fwd') actionForward();
    else if (act === 'left') actionTurn('left');
    else if (act === 'right') actionTurn('right');
  }

  function init() {
    el.overlay = $('overlay');
    el.ovTitle = $('ov-title');
    el.ovText = $('ov-text');
    el.ovBtn = $('ov-btn');
    el.ovHint = $('ov-hint');
    el.turn = $('turn');
    el.hpFill = $('hp-fill');
    el.hpText = $('hp-text');
    el.slotKey = $('slot-key');
    el.slotCompass = $('slot-compass');
    el.facing = $('facing');
    el.last = $('last-action');
    el.log = $('log');
    btnMute = $('btn-mute');
    mapwrap = $('mapwrap');
    canvas = $('map');
    ctx = canvas.getContext('2d');

    loadAudio();
    loadImages();
    resetGame();
    G.phase = 'title';
    setMuted(false);
    syncOverlay();
    renderHUD();

    document.addEventListener('keydown', onKey);
    el.ovBtn.addEventListener('click', function () {
      if (G.phase === 'title') startGame();
      else if (G.phase === 'over') restart();
    });
    btnMute.addEventListener('click', function () { setMuted(!muted); });
    $('btn-restart').addEventListener('click', restart);
    Array.prototype.forEach.call(document.querySelectorAll('[data-act]'), function (b) {
      b.addEventListener('click', function () {
        onAct(b.getAttribute('data-act'));
        b.blur();
      });
    });

    if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(mapwrap);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    requestAnimationFrame(function (t) { lastFrame = t; frame(t); });
  }

  // Test hooks (node harness / console); no effect on the page
  var api = {
    G: G, newGame: newGame, resetGame: resetGame, actionForward: actionForward,
    actionTurn: actionTurn, canMove: canMove, makeMaze: makeMaze, startGame: startGame
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DungeonMazeEscape = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
