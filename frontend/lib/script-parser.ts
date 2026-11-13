export interface ParsedBlock {
  id: string;
  type: "scene_heading" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "shot" | "note";
  text: string;
  characterName?: string;
  sceneNumber?: string;
}

export interface CharacterDialogueQuote {
  sceneNumber: string;
  sceneHeading: string;
  text: string;
  parenthetical?: string;
}

export interface CharacterAnalytics {
  name: string;
  normalizedName: string;
  dialogueCount: number;
  wordCount: number;
  percentage: number;
  sceneCount: number;
  scenes: string[];
  roleTier: "Lead" | "Major Supporting" | "Supporting" | "Minor / Cameo";
  dialogues: CharacterDialogueQuote[];
}

export interface ParsedScene {
  id: string;
  number: string;
  heading: string;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: "DAY" | "NIGHT" | "DAWN" | "DUSK" | "MAGIC HOUR" | "CONTINUOUS";
  pages: number;
  eighths: number;
  synopsis: string;
  characters: string[];
  dialogueCount: number;
  blockIds: string[];
}

export interface ScriptAnalysisResult {
  title: string;
  totalScenes: number;
  totalCharacters: number;
  totalDialogues: number;
  totalWords: number;
  estimatedPages: number;
  intPercent: number;
  extPercent: number;
  dayPercent: number;
  nightPercent: number;
  characters: CharacterAnalytics[];
  scenes: ParsedScene[];
  blocks: ParsedBlock[];
}

// Helper to normalize character names (e.g., "RISHI DEV (V.O.)" -> "Rishi Dev")
export function normalizeCharacterName(raw: string): string {
  let cleaned = raw.replace(/\s*\([^)]*\)/g, "").trim();
  cleaned = cleaned.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
  // Title Case conversion for display
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Intelligent Screenplay Parser for raw text, Fountain, or extracted document content
export function parseScreenplayText(rawText: string, scriptTitle = "Uploaded Screenplay"): ScriptAnalysisResult {
  const lines = rawText.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  const scenes: ParsedScene[] = [];
  const characterMap = new Map<string, CharacterAnalytics>();

  let currentScene: ParsedScene | null = null;
  let currentCharacter: string | null = null;
  let currentParenthetical: string | null = null;
  let sceneCounter = 0;
  let totalDialogues = 0;
  let totalWords = 0;

  const sceneHeadingRegex = /^\s*(?:(\d+)[\.\)]\s+)?(INT\.\/EXT\.|INT\/EXT\.|INT\.|EXT\.|I\/E\.|EST\.)\s+(.+?)(?:\s*-\s*(DAY|NIGHT|DAWN|DUSK|MAGIC HOUR|CONTINUOUS|LATER))?\s*(?:#(\w+)#)?$/i;
  const transitionRegex = /^\s*(FADE IN:|FADE OUT\.|CUT TO:|SMASH CUT TO:|DISSOLVE TO:|MATCH CUT TO:|JUMP CUT TO:)\s*$/i;
  const characterRegex = /^\s*([A-Z0-9][A-Z0-9\s\.\-']{1,35})(\s*\([A-Za-z0-9\s\.\-']+\))?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      currentCharacter = null;
      currentParenthetical = null;
      continue;
    }

    // 1. Check for Scene Heading
    const sceneMatch = line.match(sceneHeadingRegex);
    if (sceneMatch || (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(line) && line.length < 90)) {
      sceneCounter++;
      const matchedNumber = sceneMatch?.[1] || sceneMatch?.[5] || String(sceneCounter);
      const prefix = (sceneMatch?.[2] || line.split(" ")[0] || "EXT.").toUpperCase();
      const intExt: "INT" | "EXT" | "INT/EXT" = prefix.includes("INT") && prefix.includes("EXT") ? "INT/EXT" : prefix.includes("INT") ? "INT" : "EXT";
      
      const rest = line.replace(/^(INT\.\/EXT\.|INT\/EXT\.|INT\.|EXT\.|I\/E\.|EST\.)\s*/i, "").trim();
      const parts = rest.split(/\s+-\s+/);
      const location = parts[0]?.trim() || "Location Unspecified";
      const timePart = (parts[1] || sceneMatch?.[4] || "DAY").toUpperCase();
      const timeOfDay = (["DAY", "NIGHT", "DAWN", "DUSK", "MAGIC HOUR", "CONTINUOUS"].includes(timePart) ? timePart : "DAY") as ParsedScene["timeOfDay"];

      const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const headingText = `${intExt}. ${location.toUpperCase()} - ${timeOfDay}`;
      blocks.push({
        id: blockId,
        type: "scene_heading",
        text: headingText,
        sceneNumber: matchedNumber,
      });

      currentScene = {
        id: `scene-${Date.now()}-${sceneCounter}`,
        number: matchedNumber,
        heading: location.toUpperCase(),
        intExt,
        location,
        timeOfDay,
        pages: 1.0,
        eighths: 8,
        synopsis: "",
        characters: [],
        dialogueCount: 0,
        blockIds: [blockId],
      };
      scenes.push(currentScene);
      currentCharacter = null;
      currentParenthetical = null;
      continue;
    }

    // 2. Check for Transition
    if (transitionRegex.test(line)) {
      const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      blocks.push({
        id: blockId,
        type: "transition",
        text: line.toUpperCase(),
        sceneNumber: currentScene?.number,
      });
      if (currentScene) currentScene.blockIds.push(blockId);
      currentCharacter = null;
      currentParenthetical = null;
      continue;
    }

    // 3. Check for Parenthetical
    if (currentCharacter && line.startsWith("(") && line.endsWith(")")) {
      currentParenthetical = line;
      const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      blocks.push({
        id: blockId,
        type: "parenthetical",
        text: line,
        characterName: currentCharacter,
        sceneNumber: currentScene?.number,
      });
      if (currentScene) currentScene.blockIds.push(blockId);
      continue;
    }

    // 4. Check for Character Cue
    // Must be uppercase, not a transition, not a slugline, and followed by non-empty lines
    const nextLine = lines[i + 1]?.trim();
    const isFollowedByText = Boolean(nextLine && !sceneHeadingRegex.test(nextLine) && !transitionRegex.test(nextLine));
    const isUppercase = line === line.toUpperCase() && /[A-Z]/.test(line);

    if (isUppercase && characterRegex.test(line) && isFollowedByText && line.length < 40 && !line.includes(":") && !line.endsWith(".")) {
      const normalized = normalizeCharacterName(line);
      currentCharacter = normalized;
      currentParenthetical = null;

      const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      blocks.push({
        id: blockId,
        type: "character",
        text: line,
        characterName: normalized,
        sceneNumber: currentScene?.number,
      });
      if (currentScene) {
        currentScene.blockIds.push(blockId);
        if (!currentScene.characters.includes(normalized)) {
          currentScene.characters.push(normalized);
        }
      }

      // Initialize character entry if new
      if (!characterMap.has(normalized)) {
        characterMap.set(normalized, {
          name: line.replace(/\s*\([^)]*\)/g, "").trim(),
          normalizedName: normalized,
          dialogueCount: 0,
          wordCount: 0,
          percentage: 0,
          sceneCount: 0,
          scenes: [],
          roleTier: "Minor / Cameo",
          dialogues: [],
        });
      }
      continue;
    }

    // 5. If we have an active character, this line is Dialogue!
    if (currentCharacter) {
      const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      blocks.push({
        id: blockId,
        type: "dialogue",
        text: line,
        characterName: currentCharacter,
        sceneNumber: currentScene?.number,
      });
      if (currentScene) {
        currentScene.blockIds.push(blockId);
        currentScene.dialogueCount++;
      }

      totalDialogues++;
      const wordsInLine = line.split(/\s+/).filter(Boolean).length;
      totalWords += wordsInLine;

      const charEntry = characterMap.get(currentCharacter);
      if (charEntry) {
        charEntry.dialogueCount++;
        charEntry.wordCount += wordsInLine;
        if (currentScene && !charEntry.scenes.includes(currentScene.number)) {
          charEntry.scenes.push(currentScene.number);
          charEntry.sceneCount = charEntry.scenes.length;
        }
        charEntry.dialogues.push({
          sceneNumber: currentScene?.number || "1",
          sceneHeading: currentScene?.heading || "UNSPECIFIED SCENE",
          text: line,
          parenthetical: currentParenthetical || undefined,
        });
      }
      continue;
    }

    // 6. Otherwise, it is Action / Narrative Description
    const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    blocks.push({
      id: blockId,
      type: "action",
      text: line,
      sceneNumber: currentScene?.number,
    });
    if (currentScene) {
      currentScene.blockIds.push(blockId);
      if (!currentScene.synopsis) {
        currentScene.synopsis = line;
      }
    }
  }

  // If no scenes were found, wrap all blocks into Scene 1
  if (scenes.length === 0) {
    const sceneId = `scene-${Date.now()}-1`;
    scenes.push({
      id: sceneId,
      number: "1",
      heading: "MAIN SEQUENCE",
      intExt: "EXT",
      location: "Main Location",
      timeOfDay: "DAY",
      pages: Math.max(1, Math.round((blocks.length / 25) * 8) / 8),
      eighths: Math.max(8, Math.round((blocks.length / 25) * 8)),
      synopsis: blocks.find((b) => b.type === "action")?.text || "Screenplay sequence.",
      characters: Array.from(characterMap.keys()),
      dialogueCount: totalDialogues,
      blockIds: blocks.map((b) => b.id),
    });
  } else {
    // Estimate pages based on scene block length
    scenes.forEach((sc) => {
      const sceneBlocks = blocks.filter((b) => sc.blockIds.includes(b.id));
      const estPages = Math.max(0.5, Math.round((sceneBlocks.length / 15) * 8) / 8);
      sc.pages = estPages;
      sc.eighths = Math.round(estPages * 8);
    });
  }

  // Calculate Character dialogue percentages and assign role tiers
  const charactersList = Array.from(characterMap.values());
  charactersList.forEach((char) => {
    char.percentage = totalWords > 0 ? Math.round((char.wordCount / totalWords) * 1000) / 10 : 0;
    if (char.percentage >= 25 || char.dialogueCount >= 10) {
      char.roleTier = "Lead";
    } else if (char.percentage >= 10 || char.dialogueCount >= 6) {
      char.roleTier = "Major Supporting";
    } else if (char.percentage >= 3 || char.dialogueCount >= 3) {
      char.roleTier = "Supporting";
    } else {
      char.roleTier = "Minor / Cameo";
    }
  });

  // Sort characters by dialogue count descending
  charactersList.sort((a, b) => b.dialogueCount - a.dialogueCount || b.wordCount - a.wordCount);

  // Calculate INT/EXT and DAY/NIGHT metrics
  const intCount = scenes.filter((s) => s.intExt === "INT").length;
  const extCount = scenes.filter((s) => s.intExt === "EXT").length;
  const dayCount = scenes.filter((s) => ["DAY", "DAWN", "MAGIC HOUR"].includes(s.timeOfDay)).length;
  const nightCount = scenes.filter((s) => ["NIGHT", "DUSK"].includes(s.timeOfDay)).length;

  const totalSc = Math.max(1, scenes.length);
  const totalEstPages = scenes.reduce((sum, s) => sum + s.pages, 0);

  return {
    title: scriptTitle,
    totalScenes: scenes.length,
    totalCharacters: charactersList.length,
    totalDialogues,
    totalWords,
    estimatedPages: Math.round(totalEstPages * 10) / 10,
    intPercent: Math.round((intCount / totalSc) * 100),
    extPercent: Math.round((extCount / totalSc) * 100),
    dayPercent: Math.round((dayCount / totalSc) * 100),
    nightPercent: Math.round((nightCount / totalSc) * 100),
    characters: charactersList,
    scenes,
    blocks,
  };
}

// Built-in authentic sample scripts for instant 1-click loading and testing
export const sampleScreenplays: Record<string, { title: string; genre: string; text: string }> = {
  pushpa2: {
    title: "Pushpa 2: The Rule — Forest & Jathara Screenplay",
    genre: "Action / Period Drama",
    text: `1. EXT. SESHACHALAM DEEP FOREST - NIGHT #1#

Dense fog blankets the towering red sanders trees. Heavy monsoon rain patters against leaves.

PUSHPA RAJ (30s) steps out of a battered 4x4 Mahindra pickup, draped in an indigo checkered lungi and half-buttoned maroon shirt. A thick gold tiger-claw amulet glints on his chest.

SRIVALLI (20s) stands near the vehicle bed, watching the dark canopy with anxious eyes.

SRIVALLI
Pushpa! Special task force sirens vinipisthunnayi! Forest range checkpost daggara Shekhawat convoy vachindi anta!

PUSHPA RAJ
(smiles coolly, stroking his beard with his shoulder twitch)
Srivalli... Pushpa ante flower anukuntiva? Fire! Shekhawat ki cheppu... ee adavi lo prathi chettu, prathi kompa Pushpa de ani. Thaggedhe le!

CUT TO:

2. INT. JATHARA TEMPLE GROUNDS - NIGHT #2#

Thousands of devotees chant amid swirling crimson sindoor and holy firetorches. The rhythmic rumble of temple drums shakes the earth.

SP BHANWAR SINGH SHEKHAWAT (40s) strides into the courtyard in crisp khaki uniform, cane tucked beneath his arm, eyes fixed on the smoke.

BHANWAR SINGH SHEKHAWAT
(shouting over the deafening drums)
Pushpa Raj! You can hide behind red sanders trucks in the forest, but in front of this goddess... the law has reached you!

Through the red cloud of sindoor, PUSHPA RAJ emerges, trident in hand, eyes blaring with unstoppable fury.

PUSHPA RAJ
Shekhawat sir... Sir meeru khaki vesthe officer... adhe Pushpa gunpat vesthe Rule!

CUT TO:

3. EXT. RIVER GHAT CONVOY - DAWN #3#

Morning mist breaks over the riverbank as Pushpa's fleet of sixty trucks prepares to cross into international waters.

DHANUNJAY VARMA (50s) watches through binoculars as Pushpa raises his hand, signaling the syndicate launch.

PUSHPA RAJ
(to the cheering workers)
Ippati varaku manam local. Ee roju nunchi... Pushpa rule worldwide!

Devotees and convoy workers erupt in deafening cheers as the red sandalwood convoy roars to life!

FADE OUT.`,
  },

  kalki2898ad: {
    title: "Kalki 2898 AD — Shambhala & Complex Screenplay",
    genre: "Sci-Fi / Dystopian Epic",
    text: `1. EXT. KASI OUTSKIRTS - DUSK #1#

The inverted pyramidal mega-structure of the Complex hangs in the twilight sky, casting deep shadows over the scavengers of Kasi.

BHAIRAVA (30s) adjusts the neural controls of his custom AI supercar BUJJI, leaning back on the reinforced leather bucket seat.

BUJJI (V.O.)
(through dashboard holographic speaker)
Bhairava! Five million units bounty alert registered! Target Sumathi escaped the fertility lab and entered Sector 4!

BHAIRAVA
(grinning, cracking knuckles)
Five million units! Bujji, ee okka bounty kottesi... straight ga Complex lo settled aipodam! Full air conditioning, infinite apple juice!

CUT TO:

2. INT. SHAMBHALA HIDDEN CAVE - NIGHT #2#

Sacred water drips from ancient stone carvings. Glowing blue crystals illuminate the cavern walls.

SUMATHI (30s) cradles her womb, gasping for breath as rebel guards form a protective perimeter.

ASHWATTHAMA (Immortal warrior, 7ft tall, divine gem pulsing on his forehead) steps forward, gripping his colossal battle staff.

ASHWATTHAMA
(deep resonating voice)
Fear not, mother of the universe. For six thousand years, I have walked this barren earth waiting for this hour. No machine, no complex soldier shall harm the unborn avatar.

Bhairava crashes through the cavern opening in his robotic assault harness, eye sensors scanning Ashwatthama!

BHAIRAVA
Thatha! Ae age lo staff pattukoni fight enduku? Aa ammayini naku ichey... manchi bounty share cheskundam!

ASHWATTHAMA
(eyes blazing with ancient warrior power)
Ignorant child! You speak to the son of Drona! Prepare yourself!

CUT TO:

3. INT. THE COMPLEX - APEX CHAMBER - NIGHT #3#

Floating in zero gravity within a suspended bio-fluid sphere, SUPREME YASKIN (ancient, frail yet radiating cosmic dread) absorbs the divine droplet of serum.

SUPREME YASKIN
(whispering into the ether)
A new age has begun. The avatar awakens... and I shall become God.

Yaskin opens glowing golden eyes as dark lightning crackles across the Complex apex!

FADE OUT.`,
  },

  devara: {
    title: "Devara: Part 1 — Coastal Clash Screenplay",
    genre: "Coastal Action / Drama",
    text: `1. EXT. RED SEA CLIFFS - NIGHT #1#

Massive ocean waves crash violent white foam against jagged black coastal cliffs. Thunder rumbles beneath heavy storm clouds.

DEVARA (40s) stands bare-chested against the gale, a curved shark-tooth blade gleaming in his grip. The sea spray drenches his thick curls.

BHAIRA (40s) watches from atop the smuggler vessel, weapons drawn alongside thirty hardened sailors.

BHAIRA
Devara! Ee samudram manaku puttina chotu! Ee rathri nunchi arms container shipments aagavu! Evaru addosthe vallani samudraanike tharimestham!

DEVARA
(eyes flashing like lightning)
Bhaira... Samudram lo meenalu batukuthayi... surya kiranala kosam. Kani dongathanam chesi raktham chimmithe... aa samudrame erraga maaruthundhi! Ee Devara unnantha varaku... adharmam jaragadu!

CUT TO:

2. EXT. UNDERWATER CORAL REEF - CONTINUOUS #2#

Devara dives straight into the turbulent depths, gliding like an apex predator through the surging currents.

He intercepts the sunken iron cache, severing the heavy iron chains with a single decisive strike!

CUT TO:

3. EXT. COASTAL VILLAGE SHORE - DAWN #3#

Sunrise spills gold over the quiet fishing hamlet. The storm has cleared.

VARADHA (20s) looks out toward the endless horizon, carrying his father's sacred anchor pendant, knowing his bloodline now carries the mantle of protection.

THANGAM (20s) watches Varadha from the dune crest, admiration shining in her eyes.

THANGAM
Varadha... samudram lo Devara peru eppatiki aagadu.

VARADHA
Avunu Thangam. Ee katha ippude modhalayindi.

FADE OUT.`,
  },
};
