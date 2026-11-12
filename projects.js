window.SECTIONS = [
  {
    "id": "ai",
    "title": "AI Systems",
    "blurb": "Agents, retrieval and LLM products. The first three run in production; their demos are replicas on made-up data.",
    "projects": [
      {
        "slug": "nl2sql",
        "url": "projects/nl2sql/index.html",
        "preview": "projects/nl2sql/preview.jpg",
        "title": "NL2SQL Playground",
        "tagline": "Plain question to SQL, run in the browser",
        "description": "Pick a question and step through a natural-language-to-SQL pipeline shaped like the real one: term extraction, graph-based table selection, context and prompt assembly, the generated query, company-scoped validation, and an execute-and-repair loop. The query then runs against a fictional apparel-production database in the browser with sql.js.",
        "tech": [
          "JavaScript",
          "sql.js 1.10.3",
          "SQLite",
          "Fictional data"
        ],
        "kind": "ml",
        "repo": null,
        "controls": "Pick a sample · Next step / Run all · Tabs to revisit a step",
        "context": "Production work",
        "highlights": [
          "Natural-language questions to SQL over a large apparel-ERP schema",
          "Graph-based table selection to keep prompts small, then schema-grounded prompting",
          "Tenant-scoped validation that injects company filters, plus an execute-and-repair loop"
        ],
        "section": "ai"
      },
      {
        "slug": "planner-ai",
        "url": "projects/planner-ai/index.html",
        "preview": "projects/planner-ai/preview.jpg",
        "title": "PlannerAI",
        "tagline": "Intent-routed plan optimizer for factory lines",
        "description": "PlannerAI reschedules late production orders on a factory board. A classifier reads each request, routes it to one of three optimizations (pull forward, chop and move, same-style batching), and a decision tree picks the path that most improves on-time delivery. This demo runs the same flow on a fictional board and shows the Gantt before and after.",
        "tech": [
          "JavaScript",
          "SVG",
          "d3.js",
          "Python",
          "FastAPI"
        ],
        "kind": "ml",
        "repo": null,
        "controls": "Tap a request or type one · BEFORE / AFTER toggle · RESET BOARD",
        "context": "Production work",
        "highlights": [
          "Agentic planner for factory production schedules",
          "LLM intent classification routes requests to analysis, clarifying questions or optimisation",
          "Tree search over optimisation moves (pull forward, chop and move, same-style batching), scored by Plan Health"
        ],
        "section": "ai"
      },
      {
        "slug": "visual-search",
        "url": "projects/visual-search/index.html",
        "preview": "projects/visual-search/preview.jpg",
        "title": "Lookbook Search",
        "tagline": "Find visually similar fashion, explained stage by stage",
        "description": "A fashion visual-search demo that runs entirely in your browser. Pick an item, type a query, or upload a photo, and it embeds the query into a feature vector, runs a cosine vector search, applies facet filters, then reranks and dedupes the results. Each pipeline stage is shown with its counts and timings, mirroring a production image-search backend.",
        "tech": [
          "JavaScript",
          "SVG",
          "Canvas",
          "Cosine similarity",
          "Facet filters"
        ],
        "kind": "ml",
        "repo": null,
        "controls": "Type a query or click an example · Upload image · Click a result to find more like it · Toggle facets",
        "context": "Production work",
        "highlights": [
          "Image-embedding search over a fashion catalogue with a vector database",
          "Hybrid text and image queries with facet filters, colour-aware reranking and dedupe",
          "Batch ingestion pipelines and diagnostics for facet coverage"
        ],
        "section": "ai"
      },
      {
        "slug": "slack-bots",
        "url": "projects/slack-bots/index.html",
        "preview": "projects/slack-bots/preview.jpg",
        "title": "Project Brain Chat",
        "tagline": "Ask a codebase its own questions",
        "description": "Project Brain indexes a codebase into a graph and vector store of endpoints, services, models and tables. A CLI and an MCP server query it, and chat bots answer questions from it with tool steps and citations to the source. A personal project; this page is a scripted demo of the chat side, answering about a fictional sample project.",
        "tech": [
          "Python",
          "SQLite graph store",
          "Chroma",
          "Click CLI",
          "MCP",
          "Slack Bolt",
          "Claude API"
        ],
        "kind": "ml",
        "repo": null,
        "controls": "Tap a prompt or type · tap [n] badges to open sources",
        "context": "Personal project",
        "highlights": [
          "Builds a graph + vector index (\"brain\") of a codebase: endpoints, schemas, call paths",
          "Exposed to agents through a CLI and an MCP server with search, endpoint and enrich tools",
          "Chat bots answer engineering questions with cited sources"
        ],
        "section": "ai"
      },
      {
        "slug": "athena",
        "url": "projects/athena/index.html",
        "preview": "projects/athena/preview.jpg",
        "title": "Athena",
        "tagline": "A reviewed memory graph that answers with receipts",
        "description": "Athena is my long-term memory: two temporal knowledge graphs, one for work and one for life, that hold people, organisations, projects, events and open commitments. Claude Code extracts entities and facts from emails, Slack and meeting notes into a review batch, and nothing enters a graph until I approve it. Questions go through a small query agent that searches the graph and answers with cited records. The demo runs the ask side over a small fictional graph.",
        "tech": [
          "Python",
          "Graphiti",
          "Kuzu",
          "fastembed",
          "Claude Code",
          "d3.js"
        ],
        "kind": "ml",
        "repo": "https://github.com/Vaarun-C/Athena",
        "controls": "Tap a question or type one · Drag nodes · Tap a [n] citation to trace it",
        "context": "Personal project",
        "highlights": [
          "Two separate Graphiti graphs on embedded Kuzu (work and life), with typed nodes and time-stamped facts",
          "Human-in-the-loop ingest: Claude Code drafts each batch, I review it, then it is written to the graph",
          "No API keys: local bge-small embeddings, hybrid search, and a Haiku subagent for queries; Wispr Flow meetings sync in"
        ],
        "section": "ai"
      },
      {
        "slug": "modal-agents",
        "url": "projects/modal-agents/index.html",
        "preview": "projects/modal-agents/preview.jpg",
        "title": "Modal Agents",
        "tagline": "Two agents work out how to talk",
        "description": "Two Qwen3-4B agents, each in its own Modal Sandbox, get one goal: establish efficient communication with the other agent. They can read docs, keep a scratchpad, rewrite and restart themselves, and train their own LoRA adapters. This is an illustrative replay, scripted from the project's code and tools rather than a recorded run.",
        "tech": [
          "Modal",
          "vLLM",
          "Qwen3-4B",
          "LoRA",
          "Python"
        ],
        "kind": "ml",
        "repo": null,
        "controls": "Space play/pause · ←/→ seek 3s · drag timeline · speed button",
        "context": "Research experiment",
        "highlights": [
          "Two Qwen3-4B agents served with vLLM, each in its own Modal Sandbox, with one open-ended goal",
          "Agents can edit and restart their own code, with supervisor rollback when a self-edit breaks them",
          "Self-training loop: agents build datasets, fine-tune LoRA adapters and hot-load them into the shared model server"
        ],
        "section": "ai"
      }
    ]
  },
  {
    "id": "ml",
    "title": "ML & Research",
    "blurb": "Models and algorithms built from scratch: neuroevolution, signal processing, inverse design.",
    "projects": [
      {
        "slug": "drone-detection",
        "url": "projects/drone-detection/index.html",
        "preview": "projects/drone-detection/preview.jpg",
        "title": "Drone Detection Array",
        "tagline": "Localise a drone from four-mic time delays",
        "description": "A live simulation of a drone-detection pipeline: four microphones hear a moving drone and an impulsive noise source. GCC-PHAT time delays feed a steered-power direction scan, a threshold detector gives presence and confidence, and FastICA separates the two sources. The GCC-PHAT, delay-and-sum and FastICA steps are JavaScript ports of the Python, but the signals are synthetic and the detector is the energy rule, not the CNN.",
        "tech": [
          "JavaScript",
          "Canvas",
          "GCC-PHAT",
          "FastICA",
          "Delay-and-sum",
          "Python",
          "PyTorch"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": null,
        "controls": "Drag drone or noise on map · tap map to park drone · R resume orbit · space pause",
        "context": "Internship",
        "highlights": [
          "Four-microphone localisation: GCC-PHAT time delays feed a steered-power direction scan",
          "FastICA separates the drone from an impulsive noise source, with presence and confidence from a threshold detector"
        ]
      },
      {
        "slug": "antenna-inverse-design",
        "url": "projects/antenna-inverse-design/index.html",
        "preview": "projects/antenna-inverse-design/preview.jpg",
        "title": "Antenna Inverse Design",
        "tagline": "Find antenna dimensions from a target S11 curve",
        "description": "Pick a target S11 dip and watch the search find dimensions for a stub-loaded line. It follows the repo's workflow: Latin hypercube sampling, an MLP surrogate trained on the samples, an inverse guess by gradient descent on the surrogate, then annealing refinement against the simulator. The EM solver is replaced by an analytic stand-in, so the curves show how the search behaves rather than HFSS results.",
        "tech": [
          "JavaScript",
          "Canvas",
          "MLP surrogate",
          "Latin hypercube",
          "Simulated annealing",
          "Python",
          "PyTorch",
          "HFSS"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": null,
        "controls": "Drag the dip or tap the plot to set a target · R re-runs the search · space pauses",
        "highlights": [
          "Inverse-design loop: Latin hypercube samples train an MLP surrogate, then gradient descent proposes dimensions",
          "Simulated annealing refines that guess against the simulator to hit a target S11 dip"
        ]
      },
      {
        "slug": "neat-cars",
        "url": "projects/neat-cars/index.html",
        "preview": "projects/neat-cars/preview.jpg",
        "title": "NEAT Cars",
        "tagline": "Neural nets evolve to drive a track",
        "description": "A port of a from-scratch neuroevolution project: 100 cars steer with a small 5-6-3 neural net fed by five wall-sensing rays. Each generation the two fittest cars' weights are crossed over and mutated, and the panel shows generation, fitness, species count and the leading network with weights coloured by sign. The topology is fixed, so this is weight evolution rather than full NEAT, and you can paint your own track.",
        "tech": [
          "Python",
          "NEAT",
          "Neural networks",
          "JavaScript",
          "Canvas"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": "https://github.com/Vaarun-C/NEAT-cars",
        "controls": "1x / 5x / max speed · reset · paint to draw your own track",
        "context": "Personal project",
        "highlights": [
          "100 cars evaluated each generation, each steered by a 5-6-3 network fed by five wall-sensing rays",
          "The original Python implemented NEAT from scratch; cars learned user-drawn tracks in about 500 generations"
        ]
      },
      {
        "slug": "phase-shifter-correction",
        "url": "projects/phase-shifter-correction/index.html",
        "preview": "projects/phase-shifter-correction/preview.jpg",
        "title": "Phase-Shifter Correction",
        "tagline": "Searching fine phase trims for a 6-bit shifter",
        "description": "A 6-bit phase shifter has 64 states spaced 5.625 degrees apart, but real states drift from their targets. Dial a desired phase to see which state the chip picks, then watch a genetic search find one small phase trim and the subset of states it applies to, scored across a 51-point band and checked on 50 held-out frequencies. The chip data is simulated, and the search is the repo's objective ported to JavaScript and run in your browser.",
        "tech": [
          "Python",
          "NumPy",
          "Numba",
          "DEAP",
          "JavaScript",
          "Canvas"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": "https://github.com/Vaarun-C/CorrectionAnglePredictor",
        "controls": "Drag dial or arrow keys · Slider picks frequency · New chip re-simulates and re-searches",
        "highlights": [
          "A genetic search (DEAP) finds one phase trim and the subset of the 64 states it applies to",
          "Scored across a 51-point band and checked on 50 held-out frequencies"
        ]
      },
      {
        "slug": "wide-ball-detection",
        "url": "projects/wide-ball-detection/index.html",
        "preview": "projects/wide-ball-detection/preview.jpg",
        "title": "Wide-Ball Guideline",
        "tagline": "A wide line that follows the batter's stance",
        "description": "In the repo, a pose model tracks the batter's foot in a main-camera video, and that position slides a virtual wide guideline along the popping crease, snapping to the return crease at the limit. This page drags the batter's foot and the ball's line through the same geometry and judges each delivery as wide or not. The pose model is replaced by pre-computed stances, so the video inference itself is not run here.",
        "tech": [
          "Python",
          "OpenCV",
          "MediaPipe Pose",
          "VPython",
          "JavaScript",
          "Canvas"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": "https://github.com/VishalMGodi/STARC-Wide-ball-detection/tree/CombinedPoseDetection",
        "controls": "Drag foot or ball on the pitch · Stance presets · Ball line slider",
        "context": "Internship · team project",
        "highlights": [
          "Pose tracking of the batter's foot slides a virtual wide guideline along the popping crease",
          "The internship system reached 90% accuracy, visualised in Unity3D at 60 fps"
        ]
      },
      {
        "slug": "pagerank",
        "url": "projects/pagerank/index.html",
        "preview": "projects/pagerank/preview.jpg",
        "title": "PageRank Lab",
        "tagline": "Watch PageRank converge, one link at a time",
        "description": "A port of the iterative PageRank from my AI and web information retrieval course project, with the same damping factor, dangling-node handling and epsilon convergence test as the Python. Edit the fictional site's link graph by hand, step through iterations while node size tracks rank, and compare the result with a random surfer walking the same links.",
        "tech": [
          "JavaScript",
          "d3.js",
          "Python (port)",
          "Information retrieval"
        ],
        "section": "ml",
        "kind": "ml",
        "repo": null,
        "controls": "Drag node→node add link · tap link remove · Space step · S surfer",
        "context": "Coursework",
        "highlights": [
          "Same damping factor, dangling-node handling and epsilon convergence test as the course Python",
          "Compare iterative PageRank with a random surfer walking the same link graph"
        ]
      }
    ]
  },
  {
    "id": "creative",
    "title": "Creative Projects",
    "blurb": "Games, simulations and toys I build for fun. All of them are playable.",
    "projects": [
      {
        "slug": "pacman",
        "url": "projects/pacman/index.html",
        "preview": "projects/pacman/preview.jpg",
        "title": "Pac-Man: Spookscraper",
        "tagline": "Story-driven Pac-Man, 31 floors, three bosses",
        "description": "A Pac-Man with a story, all in one HTML file. You climb 31 floors across three acts, meet new enemies (Wraith, Slime, Bloodhound, Gargoyle, Spider) and fight the King Ghost, the Big Blob and the Skeleton King. A headless bot suite playtested every floor.",
        "tech": [
          "JavaScript",
          "Canvas",
          "Web Audio",
          "Node playtest bot"
        ],
        "kind": "game",
        "repo": "https://github.com/Vaarun-C/pacman",
        "controls": "Arrows/WASD move · Space dash · P pause · M sound · F effects",
        "aspect": "1 / 1",
        "section": "creative"
      },
      {
        "slug": "pixelgame",
        "url": "https://vaarun-c.github.io/PixelGame/",
        "preview": "projects/pixelgame/preview.jpg",
        "title": "PixelGame",
        "tagline": "Dark fantasy RPG of runes and ruin",
        "description": "A grim pixel RPG about finding, trading, carving and fusing runes in a ruined world. The world is procedural with five biomes, combat is a four-hit sword combo with dodges, and you trade bronze, silver and gold by weight because there are no coins. Sprites are kept to a fixed 44-colour palette by its own art tools.",
        "tech": [
          "JavaScript",
          "Canvas",
          "Python art tools",
          "PixelLab"
        ],
        "kind": "game",
        "repo": "https://github.com/Vaarun-C/PixelGame",
        "controls": "WASD move · Click attack · Space dodge · E interact · I inventory",
        "section": "creative"
      },
      {
        "slug": "dungeon-crawler",
        "url": "projects/dungeon-crawler/index.html",
        "preview": "projects/dungeon-crawler/preview.jpg",
        "title": "Dungeon Maze Escape",
        "tagline": "Find the key, seize the treasure, survive.",
        "description": "A tile-based port of the Python dungeon crawler: a new random maze every run, a key to unlock the treasure and a compass that points the way. Ghosts phase through walls, skeletons hunt you down and an ogre guards the chest.",
        "tech": [
          "Python",
          "Pygame",
          "Colorama"
        ],
        "kind": "game",
        "repo": "https://github.com/Vaarun-C/Dungeon-Crawler",
        "controls": "Left/Right or A/D turn · Up or W walk · M mute · R restart",
        "section": "creative"
      },
      {
        "slug": "ki-bot",
        "url": "projects/ki-bot/index.html",
        "preview": "projects/ki-bot/preview.jpg",
        "title": "Ki Spawn Bot",
        "tagline": "Names wild pokémon from their hints",
        "description": "Ki reads a spawn's hints, narrows the name letter by letter against the full species list, including Alolan, Galarian and other forms, and pings the people who want it. This page is a scripted demo on a made-up server with made-up users, with slash commands and a paged list menu that you can try from the buttons.",
        "tech": [
          "Python",
          "discord.py",
          "Slash commands",
          "Firebase Realtime DB",
          "HTML/CSS/JS chat UI"
        ],
        "section": "creative",
        "kind": "web",
        "repo": "https://github.com/Vaarun-C/Ki",
        "controls": "Tap the buttons on messages and the chips at the bottom"
      },
      {
        "slug": "chess",
        "url": "projects/chess/index.html",
        "preview": "projects/chess/preview.jpg",
        "title": "Chess",
        "tagline": "Hot-seat chess with legal-move highlights.",
        "description": "A browser port of a C terminal chess project, with the same piece movement, colour scheme and move highlighting. Check, checkmate and stalemate detection are complete here, and two players share one screen and take turns. The original had no AI opponent, so this version is two-player only.",
        "tech": [
          "JavaScript",
          "CSS grid",
          "Pointer events",
          "C (original)"
        ],
        "section": "creative",
        "kind": "game",
        "repo": "https://github.com/Vaarun-C/Second-Semester-Project-Chess",
        "controls": "Tap or click a piece, then a highlighted square · UNDO · FLIP board"
      },
      {
        "slug": "wave-function-collapse",
        "url": "projects/wave-function-collapse/index.html",
        "preview": "projects/wave-function-collapse/preview.jpg",
        "title": "Wave Function Collapse",
        "tagline": "Watch a platformer level assemble itself.",
        "description": "A Python implementation of the Wave Function Collapse algorithm that generates platforming levels from tiles and adjacency rules in rules.json. Each step picks the lowest-entropy cell, collapses it to one tile, and propagates constraints to its neighbours until the grid is fixed or a contradiction forces a restart. This demo animates that process, highlighting the chosen cell and shading open cells by entropy.",
        "tech": [
          "Python",
          "OpenCV",
          "NumPy"
        ],
        "kind": "sim",
        "repo": "https://github.com/Vaarun-C/WaveFunctionCollapse",
        "controls": "click or space pause · R regenerate · S speed",
        "section": "creative"
      },
      {
        "slug": "falling-sand",
        "url": "projects/falling-sand/index.html",
        "preview": "projects/falling-sand/preview.jpg",
        "title": "Falling Sand",
        "tagline": "Cellular automata sand, poured by hand.",
        "description": "A falling-sand cellular automaton written in Python with pygame. Each grid cell is either empty or holds a coloured grain, and grains fall straight down or diagonally into empty space every frame. This demo ports the same grid rules and hue-cycling colour gradient to canvas, so you can drag or touch to pour sand.",
        "tech": [
          "Python",
          "pygame"
        ],
        "kind": "sim",
        "repo": "https://github.com/Vaarun-C/falling-sand",
        "controls": "drag / touch to pour · C or CLEAR to reset",
        "section": "creative"
      },
      {
        "slug": "collatz",
        "url": "projects/collatz/index.html",
        "preview": "projects/collatz/preview.jpg",
        "title": "Collatz Spiral",
        "tagline": "Hailstone paths spiralling into one picture",
        "description": "Every starting number takes its own hailstone path down to 1, turning left on even numbers and right on odd ones. Drawing all of them from the same point builds a spiral of overlapping paths that keeps growing, port of the pyglet visualisation in the original repo. Pick a range and a speed and watch the picture fill in.",
        "tech": [
          "JavaScript",
          "Canvas 2D"
        ],
        "section": "creative",
        "kind": "sim",
        "repo": "https://github.com/Vaarun-C/collatz-conjecture",
        "controls": "Range & speed sliders · Space or tap canvas to pause"
      },
      {
        "slug": "satisfying-visualizations",
        "url": "projects/satisfying-visualizations/index.html",
        "preview": "projects/satisfying-visualizations/preview.jpg",
        "title": "Satisfying Loops",
        "tagline": "Bouncing boxes and polyrhythm sliders, on loop",
        "description": "Two small generative loops ported from a pygame repo. BoXeS bounces a shifting-colour square around a frame and leaves a trail, with a bounce thump on each hit. Polyrhythm sets fifteen sliders on arcs to run at slightly different speeds, so they drift apart and line up again over a five-minute cycle, playing a note each time one crosses the bottom line.",
        "tech": [
          "JavaScript",
          "Canvas 2D",
          "Web Audio"
        ],
        "section": "creative",
        "kind": "sim",
        "repo": "https://github.com/Vaarun-C/satisfying-visualizations",
        "controls": "←/→ or swipe switches · ↑/↓ volume · drag the volume bar on polyrhythm"
      },
      {
        "slug": "ascii-camera",
        "url": "projects/ascii-camera/index.html",
        "preview": "projects/ascii-camera/preview.jpg",
        "title": "ASCII Camera",
        "tagline": "Your webcam, redrawn as terminal characters.",
        "description": "A port of a Python script that turns a webcam feed into coloured ASCII art, using the same 70-character density ramp and luminance mapping. Frames are processed inside this tab and nothing is uploaded anywhere. If the camera is refused or missing, a generated spinning torus is pushed through the same pipeline instead.",
        "tech": [
          "JavaScript",
          "Canvas",
          "getUserMedia",
          "Python OpenCV (original)"
        ],
        "section": "creative",
        "kind": "web",
        "repo": "https://github.com/Vaarun-C/ASCII-Camera",
        "controls": "Turn on camera · density and contrast sliders · COLOR and DARK toggles"
      },
      {
        "slug": "puzzle-solvers",
        "url": "projects/puzzle-solvers/index.html",
        "preview": "projects/puzzle-solvers/preview.jpg",
        "title": "Puzzle Solvers",
        "tagline": "Sudoku backtracking and Wordle/Primel narrowing.",
        "description": "Two ports in one window. The sudoku tab runs the box-elimination pass from a sudoku image solver, then animates backtracking over an editable grid. The Wordle and Primel tabs port the narrowing logic from the Wordle-and-Primel guesser: enter a guess, colour its tiles to match the game, and watch the candidates shrink (the Wordle repo is github.com/Vaarun-C/Wordle-and-Primel-Guesser).",
        "tech": [
          "JavaScript",
          "CSS grid",
          "Backtracking",
          "Constraint narrowing"
        ],
        "section": "creative",
        "kind": "game",
        "repo": "https://github.com/Vaarun-C/sudoku-solver",
        "controls": "Click cells to type · SOLVE/STEP/SPEED · WORDLE & PRIMEL: type, SUBMIT, tap tiles to colour"
      }
    ]
  }
];
