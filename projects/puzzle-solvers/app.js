// Puzzle Solvers: sudoku (box-elimination pass + animated backtracking) and a
// Wordle / Primel narrowing guesser. Ports of sudoku-solver/solve.py and
// Wordle-and-Primel-Guesser/{wordle,primel}.py.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------------
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function showTab(name) {
    for (const t of tabs) {
      const on = t.getAttribute("aria-controls") === "p-" + name;
      t.setAttribute("aria-selected", String(on));
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.id.replace("tab-", ""))));

  // ------------------------------------------------------------------
  // SUDOKU
  // ------------------------------------------------------------------
  const PRESETS = [
    // Wikipedia example (easy-ish)
    "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    "003020600900305001001806400008102900700000008006708200002609500800203009005010300",
  ];
  const PRESET_NAMES = ["EASY", "HARD", "DIABOLICAL"];

  const ROWC = (i) => (i / 9) | 0;
  const COLC = (i) => i % 9;
  const BOXC = (i) => ((ROWC(i) / 3) | 0) * 3 + ((COLC(i) / 3) | 0);

  function rowHas(b, r, v) { for (let c = 0; c < 9; c++) if (b[r * 9 + c] === v) return true; return false; }
  function colHas(b, c, v) { for (let r = 0; r < 9; r++) if (b[r * 9 + c] === v) return true; return false; }
  function boxHas(b, box, v) {
    const br = ((box / 3) | 0) * 3, bc = (box % 3) * 3;
    for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (b[r * 9 + c] === v) return true;
    return false;
  }
  function canPlace(b, i, v) {
    const r = ROWC(i), c = COLC(i);
    return !rowHas(b, r, v) && !colHas(b, c, v) && !boxHas(b, BOXC(i), v);
  }
  function conflictAt(b) {
    for (let i = 0; i < 81; i++) {
      const v = b[i];
      if (!v) continue;
      b[i] = 0;
      const bad = !canPlace(b, i, v);
      b[i] = v;
      if (bad) return i;
    }
    return -1;
  }

  // Phase 1: port of the original's per-box elimination. For each digit d and each
  // 3x3 box that lacks d, a cell is viable if its row and column lack d. A single
  // viable cell gets d. Repeats while progress is made (the original gives up at 100 passes).
  function* elimination(b) {
    let progress = true, passes = 0;
    while (progress && passes < 100) {
      progress = false;
      passes++;
      for (let d = 1; d <= 9; d++) {
        for (let box = 0; box < 9; box++) {
          if (boxHas(b, box, d)) continue;
          const br = ((box / 3) | 0) * 3, bc = (box % 3) * 3;
          const viable = [];
          for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
              const i = r * 9 + c;
              if (b[i] === 0 && !rowHas(b, r, d) && !colHas(b, c, d)) viable.push(i);
            }
          }
          if (viable.length === 1) {
            const i = viable[0];
            b[i] = d;
            progress = true;
            yield { t: "place", i, v: d, forced: true };
          }
        }
      }
    }
  }

  // Phase 2: depth-first backtracking. Every tentative placement and every undo is
  // yielded so the UI can animate it.
  function* backtrack(b, pos, counter) {
    while (pos < 81 && b[pos] !== 0) pos++;
    if (pos === 81) return true;
    for (let v = 1; v <= 9; v++) {
      if (!canPlace(b, pos, v)) continue;
      b[pos] = v;
      yield { t: "place", i: pos, v, forced: false };
      if (yield* backtrack(b, pos + 1, counter)) return true;
      b[pos] = 0;
      counter.backtracks++;
      yield { t: "undo", i: pos };
    }
    return false;
  }

  function* solver(b, counter) {
    yield* elimination(b);
    return yield* backtrack(b, 0, counter);
  }

  const sgrid = $("sgrid");
  const cells = [];
  const base = new Array(81).fill(0);   // givens the user typed or chose
  let work = base.slice();              // what is currently displayed while solving
  let gen = null, timer = null, playing = false, finished = false;
  const counter = { steps: 0, backtracks: 0 };
  let cursor = -1;

  for (let i = 0; i < 81; i++) {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.maxLength = 2;
    inp.setAttribute("aria-label", `row ${ROWC(i) + 1} column ${COLC(i) + 1}`);
    if (COLC(i) % 3 === 2 && COLC(i) < 8) inp.classList.add("rb");
    if (ROWC(i) % 3 === 2 && ROWC(i) < 8) inp.classList.add("bb");
    inp.dataset.i = i;
    sgrid.appendChild(inp);
    cells.push(inp);
  }

  function setStatus(text, err) {
    const el = $("sStatus");
    el.textContent = text;
    el.classList.toggle("err", !!err);
  }

  function updateCounters() {
    $("sCount").innerHTML = `STEPS <b>${counter.steps}</b> · BACKTRACKS <b>${counter.backtracks}</b>`;
  }

  function paintCell(i, cls) {
    const el = cells[i];
    el.value = work[i] ? String(work[i]) : "";
    el.className = el.className.replace(/\b(given|forced|placed|undo|cursor)\b/g, "").trim();
    if (cls) el.classList.add(cls);
    if (cls === "forced" || cls === "placed" || cls === "undo") {
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove(cls), 320);
    }
    el.classList.toggle("rb", COLC(i) % 3 === 2 && COLC(i) < 8);
    el.classList.toggle("bb", ROWC(i) % 3 === 2 && ROWC(i) < 8);
  }

  function renderAll() {
    for (let i = 0; i < 81; i++) {
      work[i] = work[i] || 0;
      paintCell(i, base[i] ? "given" : "");
    }
    updateCounters();
  }

  function lockInputs(lock) {
    for (const el of cells) el.readOnly = lock;
  }

  function stopTimer() {
    playing = false;
    clearTimeout(timer);
    timer = null;
    $("sPlay").textContent = finished ? "SOLVE" : (gen ? "RESUME" : "SOLVE");
  }

  function resetSolve() {
    stopTimer();
    gen = null;
    finished = false;
    counter.steps = 0;
    counter.backtracks = 0;
    work = base.slice();
    cursor = -1;
    lockInputs(false);
    renderAll();
    $("sPlay").textContent = "SOLVE";
  }

  // Speed 1..10: delay ms per tick, and steps per tick at the fast end.
  function speedParams() {
    const s = +$("sSpeed").value;
    const delays = [420, 260, 160, 100, 60, 36, 16, 16, 16, 16];
    const perTick = [1, 1, 1, 1, 1, 1, 2, 4, 8, 16];
    return { delay: delays[s - 1], perTick: perTick[s - 1] };
  }

  function validateBase() {
    const bad = conflictAt(base);
    if (bad >= 0) return `Conflict at row ${ROWC(bad) + 1}, column ${COLC(bad) + 1}`;
    return null;
  }

  function ensureGen() {
    if (gen) return true;
    const err = validateBase();
    if (err) { setStatus(err, true); return false; }
    work = base.slice();
    counter.steps = 0;
    counter.backtracks = 0;
    gen = solver(work, counter);
    finished = false;
    lockInputs(true);
    renderAll();
    return true;
  }

  // Applies one generator step. Returns false when the solver has finished.
  function advance() {
    const r = gen.next();
    if (r.done) {
      finished = true;
      gen = null;
      lockInputs(false);
      stopTimer();
      if (r.value) {
        setStatus(`SOLVED in ${counter.steps} steps.`);
        // paint all filled cells as placed where they were not givens
        for (let i = 0; i < 81; i++) paintCell(i, base[i] ? "given" : "");
      } else {
        setStatus("No solution: the grid cannot be completed.", true);
      }
      updateCounters();
      return false;
    }
    const ev = r.value;
    counter.steps++;
    cursor = ev.i;
    if (ev.t === "place") {
      work[ev.i] = ev.v;
      paintCell(ev.i, ev.forced ? "forced" : "placed");
    } else if (ev.t === "undo") {
      work[ev.i] = 0;
      paintCell(ev.i, "undo");
    }
    cells.forEach((el) => el.classList.remove("cursor"));
    cells[cursor].classList.add("cursor");
    updateCounters();
    setStatus(ev.t === "place"
      ? (ev.forced ? `Forced: ${ev.v} at R${ROWC(ev.i) + 1}C${COLC(ev.i) + 1}` : `Trying ${ev.v} at R${ROWC(ev.i) + 1}C${COLC(ev.i) + 1}`)
      : `Backtrack from R${ROWC(ev.i) + 1}C${COLC(ev.i) + 1}`);
    return true;
  }

  function tick() {
    const { perTick, delay } = speedParams();
    for (let k = 0; k < perTick; k++) {
      if (!advance()) return;
    }
    if (playing) timer = setTimeout(tick, delay);
  }

  function togglePlay() {
    if (playing) { stopTimer(); return; }
    if (finished) resetSolve();
    if (!ensureGen()) return;
    playing = true;
    $("sPlay").textContent = "PAUSE";
    tick();
  }

  $("sPlay").addEventListener("click", togglePlay);
  $("sStep").addEventListener("click", () => {
    if (playing) stopTimer();
    if (finished) resetSolve();
    if (!ensureGen()) return;
    advance();
  });
  $("sReset").addEventListener("click", resetSolve);
  $("sClear").addEventListener("click", () => {
    stopTimer();
    base.fill(0);
    resetSolve();
    setStatus("Grid cleared.");
  });
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopTimer();
      const p = PRESETS[+btn.dataset.preset];
      for (let i = 0; i < 81; i++) base[i] = +p[i] || 0;
      resetSolve();
      setStatus(`Loaded ${PRESET_NAMES[+btn.dataset.preset]} puzzle.`);
    });
  });
  $("sSpeed").addEventListener("input", () => { $("sSpeedOut").textContent = $("sSpeed").value; });

  // Editing: typing digits into the grid updates the givens.
  cells.forEach((el, i) => {
    el.addEventListener("focus", () => el.select());
    el.addEventListener("input", () => {
      if (el.readOnly) return;
      const d = el.value.replace(/[^1-9]/g, "").slice(-1);
      el.value = d;
      base[i] = d ? +d : 0;
      work = base.slice();
      setStatus("");
    });
    el.addEventListener("keydown", (e) => {
      const map = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      const m = map[e.key];
      if (!m) return;
      e.preventDefault();
      const r = Math.min(8, Math.max(0, ROWC(i) + m[0])), c = Math.min(8, Math.max(0, COLC(i) + m[1]));
      cells[r * 9 + c].focus();
    });
  });

  // Start with the first preset.
  for (let i = 0; i < 81; i++) base[i] = +PRESETS[0][i] || 0;
  resetSolve();

  // ------------------------------------------------------------------
  // WORDLE and PRIMEL: narrowing guesser
  // ------------------------------------------------------------------
  // Feedback for one guess against one answer: 0 absent, 1 present elsewhere, 2 in place.
  function feedback(guess, answer) {
    const n = guess.length, res = new Array(n).fill(0), counts = {};
    for (let i = 0; i < n; i++) {
      if (guess[i] === answer[i]) res[i] = 2;
      else counts[answer[i]] = (counts[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < n; i++) {
      if (res[i] !== 2 && counts[guess[i]] > 0) { res[i] = 1; counts[guess[i]]--; }
    }
    return res;
  }

  // Primes: sieve up to 99999, keep the 5-digit ones.
  const SIEVE_MAX = 99999;
  const composite = new Uint8Array(SIEVE_MAX + 1);
  composite[0] = composite[1] = 1;
  for (let i = 2; i * i <= SIEVE_MAX; i++) {
    if (!composite[i]) for (let j = i * i; j <= SIEVE_MAX; j += i) composite[j] = 1;
  }
  const isPrime = (n) => n >= 2 && n <= SIEVE_MAX && !composite[n];
  const PRIMES5 = [];
  for (let n = 10000; n <= SIEVE_MAX; n++) if (!composite[n]) PRIMES5.push(String(n));

  function makeGuesser(cfg) {
    const { boardEl, form, input, statusEl, countEl, candsEl, resetBtn, len, maxRows, candidates, accept, label } = cfg;
    const rows = []; // { text, fb: number[] }

    function survivors() {
      if (!rows.length) return candidates;
      const want = rows.map((r) => r.fb.join(""));
      return candidates.filter((c) => {
        for (let k = 0; k < rows.length; k++) {
          if (feedback(rows[k].text, c).join("") !== want[k]) return false;
        }
        return true;
      });
    }

    function render() {
      boardEl.textContent = "";
      const cur = (input.value || "").toUpperCase();
      for (let r = 0; r < maxRows; r++) {
        const rowEl = document.createElement("div");
        rowEl.className = "grow";
        for (let c = 0; c < len; c++) {
          const t = document.createElement("div");
          t.className = "tile";
          if (r < rows.length) {
            const row = rows[r];
            t.textContent = row.text[c];
            t.classList.add("t" + row.fb[c], "clickable");
            t.setAttribute("role", "button");
            t.setAttribute("aria-label", `${label} ${r + 1} letter ${c + 1}`);
            t.addEventListener("click", () => {
              row.fb[c] = (row.fb[c] + 1) % 3;
              render();
            });
          } else if (r === rows.length && cur[c]) {
            t.textContent = cur[c];
            t.classList.add("typing");
          }
          rowEl.appendChild(t);
        }
        boardEl.appendChild(rowEl);
      }
      const left = survivors();
      countEl.textContent = `${left.length.toLocaleString()} ${label.toLowerCase()} candidates left`;
      if (!rows.length) {
        candsEl.textContent = "All " + candidates.length.toLocaleString() + " candidates. Submit a guess to narrow them down.";
      } else if (!left.length) {
        candsEl.textContent = "No candidates match these colours. Check the tiles.";
      } else {
        const SHOW = 500;
        const shown = left.slice(0, SHOW).join("  ");
        candsEl.textContent = left.length > SHOW ? `${shown}  … +${(left.length - SHOW).toLocaleString()} more` : shown;
      }
    }

    function setMsg(text, err) {
      statusEl.textContent = text;
      statusEl.classList.toggle("err", !!err);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = (input.value || "").trim().toUpperCase();
      const err = accept(text);
      if (err) { setMsg(err, true); return; }
      if (rows.length >= maxRows) { setMsg(`Out of guesses. Press RESET to start over.`, true); return; }
      rows.push({ text, fb: new Array(len).fill(0) });
      input.value = "";
      setMsg("");
      render();
    });

    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase();
      render();
    });

    resetBtn.addEventListener("click", () => {
      rows.length = 0;
      input.value = "";
      setMsg("");
      render();
    });

    render();
  }

  makeGuesser({
    boardEl: $("wBoard"), form: $("wForm"), input: $("wIn"), statusEl: $("wStatus"),
    countEl: $("wCount"), candsEl: $("wCands"), resetBtn: $("wReset"),
    len: 5, maxRows: 6, label: "WORD",
    candidates: window.WORDS || [],
    accept: (t) => (/^[A-Z]{5}$/.test(t) ? null : "Enter exactly five letters."),
  });

  makeGuesser({
    boardEl: $("pBoard"), form: $("pForm"), input: $("pIn"), statusEl: $("pStatus"),
    countEl: $("pCount"), candsEl: $("pCands"), resetBtn: $("pReset"),
    len: 5, maxRows: 6, label: "PRIME",
    candidates: PRIMES5,
    accept: (t) => {
      if (!/^\d{5}$/.test(t)) return "Enter exactly five digits.";
      if (!isPrime(+t) || +t < 10000) return `${t} is not a 5-digit prime.`;
      return null;
    },
  });

  // Keyboard: digits in the Primel box, letters in the Wordle box, handled by the input filters above.
  $("pIn").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
  });
  // Primel render uses uppercase on input; digits are unaffected.
  // Re-run the candidate render for Primel once the tab shows (cheap).
  showTab("sudoku");
})();
