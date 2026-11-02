// Chess: rules port of Second-Semester-Project-Chess/chess.c (piece movement, pawn rules,
// highlight scheme) with check, checkmate and stalemate added, hot-seat, click and touch.
(() => {
  "use strict";

  const FILES = "abcdefgh";
  const GLYPH = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };
  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  const rowOf = (i) => i >> 3;
  const colOf = (i) => i & 7;
  const idx = (r, c) => r * 8 + c;
  const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const sideOf = (p) => (p ? (p === p.toUpperCase() ? "w" : "b") : null);
  const other = (s) => (s === "w" ? "b" : "w");
  const sqName = (i) => FILES[colOf(i)] + (8 - rowOf(i));

  function startBoard() {
    const back = "RNBQKBNR";
    const b = new Array(64).fill("");
    for (let c = 0; c < 8; c++) {
      b[c] = back[c].toLowerCase();
      b[8 + c] = "p";
      b[48 + c] = "P";
      b[56 + c] = back[c];
    }
    return b;
  }

  // Pseudo-legal moves for the piece on `from`: same movement rules as chess.c.
  function pseudoMoves(bd, from) {
    const p = bd[from];
    if (!p) return [];
    const side = sideOf(p), r = rowOf(from), c = colOf(from), out = [];
    const addIf = (rr, cc) => {
      if (!onBoard(rr, cc)) return;
      const t = idx(rr, cc), q = bd[t];
      if (!q || sideOf(q) !== side) out.push({ from, to: t });
    };
    const slide = (dirs) => {
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (onBoard(rr, cc)) {
          const t = idx(rr, cc), q = bd[t];
          if (!q) out.push({ from, to: t });
          else { if (sideOf(q) !== side) out.push({ from, to: t }); break; }
          rr += dr; cc += dc;
        }
      }
    };
    switch (p.toUpperCase()) {
      case "P": {
        const dir = side === "w" ? -1 : 1;
        const start = side === "w" ? 6 : 1;
        const r1 = r + dir;
        if (onBoard(r1, c) && !bd[idx(r1, c)]) {
          out.push({ from, to: idx(r1, c) });
          // Double step only when both squares are empty (chess.c skipped the middle square check).
          if (r === start && !bd[idx(r1 + dir, c)]) out.push({ from, to: idx(r1 + dir, c) });
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (onBoard(r1, cc)) {
            const q = bd[idx(r1, cc)];
            if (q && sideOf(q) !== side) out.push({ from, to: idx(r1, cc) });
          }
        }
        break;
      }
      case "N": for (const [dr, dc] of KNIGHT) addIf(r + dr, c + dc); break;
      case "B": slide(DIAG); break;
      case "R": slide(ORTH); break;
      case "Q": slide(DIAG); slide(ORTH); break;
      case "K": for (const [dr, dc] of KING) addIf(r + dr, c + dc); break;
    }
    return out;
  }

  function firstPieceFrom(bd, r, c, dr, dc) {
    let rr = r + dr, cc = c + dc;
    while (onBoard(rr, cc)) {
      const q = bd[idx(rr, cc)];
      if (q) return q;
      rr += dr; cc += dc;
    }
    return null;
  }

  // Is square `sq` attacked by any piece of colour `by`?
  function attacked(bd, sq, by) {
    const r = rowOf(sq), c = colOf(sq);
    const P = by === "w" ? "P" : "p", N = by === "w" ? "N" : "n", K = by === "w" ? "K" : "k";
    const R = by === "w" ? "R" : "r", B = by === "w" ? "B" : "b", Q = by === "w" ? "Q" : "q";
    const pr = by === "w" ? r + 1 : r - 1;
    for (const dc of [-1, 1]) if (onBoard(pr, c + dc) && bd[idx(pr, c + dc)] === P) return true;
    for (const [dr, dc] of KNIGHT) if (onBoard(r + dr, c + dc) && bd[idx(r + dr, c + dc)] === N) return true;
    for (const [dr, dc] of KING) if (onBoard(r + dr, c + dc) && bd[idx(r + dr, c + dc)] === K) return true;
    for (const [dr, dc] of ORTH) {
      const q = firstPieceFrom(bd, r, c, dr, dc);
      if (q === R || q === Q) return true;
    }
    for (const [dr, dc] of DIAG) {
      const q = firstPieceFrom(bd, r, c, dr, dc);
      if (q === B || q === Q) return true;
    }
    return false;
  }

  function kingSquare(bd, side) {
    return bd.indexOf(side === "w" ? "K" : "k");
  }

  function inCheck(bd, side) {
    const k = kingSquare(bd, side);
    return k >= 0 && attacked(bd, k, other(side));
  }

  // Pawns that reach the back rank become queens (chess.c would walk off the board).
  function applyMove(bd, m) {
    const nb = bd.slice();
    const p = nb[m.from];
    nb[m.to] = p;
    nb[m.from] = "";
    if (p === "P" && rowOf(m.to) === 0) nb[m.to] = "Q";
    if (p === "p" && rowOf(m.to) === 7) nb[m.to] = "q";
    return nb;
  }

  function legalMoves(bd, side) {
    const out = [];
    for (let i = 0; i < 64; i++) {
      if (!bd[i] || sideOf(bd[i]) !== side) continue;
      for (const m of pseudoMoves(bd, i)) {
        if (!inCheck(applyMove(bd, m), side)) out.push(m);
      }
    }
    return out;
  }

  // ------------------------------------------------------------------
  // Game state and UI
  // ------------------------------------------------------------------
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const undoBtn = document.getElementById("undo");
  const flipBtn = document.getElementById("flip");

  let bd, turn, history, log, selected, targets, legal, lastMove, flipped = false;

  function newGame() {
    bd = startBoard();
    turn = "w";
    history = [];
    log = [];
    selected = null;
    lastMove = null;
    render();
  }

  function makeMove(m) {
    const captured = bd[m.to];
    const piece = bd[m.from];
    history.push({ bd, turn, logLen: log.length, lastMove });
    const letter = piece.toUpperCase() === "P" ? "" : piece.toUpperCase();
    const promo = (piece === "P" && rowOf(m.to) === 0) || (piece === "p" && rowOf(m.to) === 7);
    bd = applyMove(bd, m);
    turn = other(turn);
    lastMove = m;
    selected = null;
    const oppLegal = legalMoves(bd, turn).length;
    const suffix = inCheck(bd, turn) ? (oppLegal ? "+" : "#") : "";
    const n = Math.floor(log.length / 2) + 1;
    const text = `${letter}${sqName(m.from)}${captured ? "x" : "-"}${sqName(m.to)}${promo ? "=Q" : ""}${suffix}`;
    log.push(text);
    render();
  }

  function undo() {
    const h = history.pop();
    if (!h) return;
    bd = h.bd;
    turn = h.turn;
    log = log.slice(0, h.logLen);
    lastMove = h.lastMove;
    selected = null;
    render();
  }

  function onSquare(i) {
    if (legal.length === 0) return;
    if (selected !== null) {
      const m = targets.get(i);
      if (m) { makeMove(m); return; }
    }
    if (bd[i] && sideOf(bd[i]) === turn) selected = i;
    else selected = null;
    render();
  }

  function render() {
    legal = legalMoves(bd, turn);
    targets = new Map();
    if (selected !== null) {
      for (const m of legal) if (m.from === selected) targets.set(m.to, m);
    }
    const check = inCheck(bd, turn);
    const kSq = check ? kingSquare(bd, turn) : -1;

    boardEl.textContent = "";
    for (let k = 0; k < 64; k++) {
      const i = flipped ? 63 - k : k;
      const r = rowOf(i), c = colOf(i);
      const sq = document.createElement("button");
      sq.type = "button";
      sq.className = "sq" + ((r + c) % 2 === 1 ? " dk" : "");
      sq.dataset.i = i;
      const p = bd[i];
      const label = `${sqName(i)} ${p ? (sideOf(p) === "w" ? "white" : "black") + " " + p.toUpperCase() : "empty"}`;
      sq.setAttribute("aria-label", label);
      if (i === selected) sq.classList.add("sel");
      if (i === kSq) sq.classList.add("chk");
      if (lastMove && (i === lastMove.from || i === lastMove.to)) sq.classList.add("last");
      if (targets.has(i)) sq.classList.add("tgt", p ? "cap" : "dot");
      if (p) {
        const span = document.createElement("span");
        span.className = "pc";
        span.textContent = GLYPH[p];
        sq.appendChild(span);
      }
      // Coordinates on the outer edge.
      const dispRow = flipped ? r + 1 : 8 - r;
      const dispFile = flipped ? FILES[7 - c] : FILES[c];
      const bottomRow = flipped ? 0 : 7, leftCol = flipped ? 7 : 0;
      if (c === leftCol) {
        const t = document.createElement("span");
        t.className = "coord rk"; t.textContent = dispRow; sq.appendChild(t);
      }
      if (r === bottomRow) {
        const t = document.createElement("span");
        t.className = "coord fl"; t.textContent = dispFile; sq.appendChild(t);
      }
      sq.addEventListener("click", () => onSquare(i));
      boardEl.appendChild(sq);
    }

    const side = turn === "w" ? "WHITE" : "BLACK";
    let text, cls = "";
    if (legal.length === 0 && check) {
      text = `CHECKMATE. ${turn === "w" ? "BLACK" : "WHITE"} WINS`;
      cls = "over";
    } else if (legal.length === 0) {
      text = "STALEMATE. DRAW";
      cls = "over";
    } else if (check) {
      text = `${side} IS IN CHECK`;
      cls = "check";
    } else {
      text = `${side} TO MOVE`;
    }
    statusEl.textContent = text;
    statusEl.className = cls;

    undoBtn.disabled = history.length === 0;

    logEl.textContent = "";
    for (let k = 0; k < log.length; k += 2) {
      const line = document.createElement("div");
      const num = document.createElement("span");
      num.className = "n";
      num.textContent = `${k / 2 + 1}. `;
      line.appendChild(num);
      line.appendChild(document.createTextNode(log[k] + (log[k + 1] ? "  " + log[k + 1] : "")));
      logEl.appendChild(line);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  undoBtn.addEventListener("click", undo);
  flipBtn.addEventListener("click", () => { flipped = !flipped; render(); });
  document.getElementById("newGame").addEventListener("click", newGame);

  newGame();
})();
