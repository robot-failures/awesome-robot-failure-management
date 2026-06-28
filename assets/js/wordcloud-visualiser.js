/**
 * This visualisation script has been generated with Claude Opus 4.6;
 * its only purpose is to provide a visual summary of the paper titles.
 * 
 * Alex
 */

/**
 * -----------------------------------------------------------------------
 * Generates a word-cloud visualisation (rendered on an HTML5 <canvas>)
 * from a list of titles / strings, sized by word frequency.
 * -----------------------------------------------------------------------
 */

(function (global) {
  "use strict";

  // ---------------------------------------------------------------------
  // Default configuration (can be overridden via the `options` argument)
  // ---------------------------------------------------------------------
  const DEFAULTS = {
    width: null,              // defaults to canvas.width if not set
    height: null,             // defaults to canvas.height if not set
    minWordLength: 2,         // ignore words shorter than this
    maxWords: 150,            // cap on number of words shown
    minFontSize: 12,
    maxFontSize: 90,
    fontFamily: "Inter, Helvetica, Arial, sans-serif",
    fontWeight: "bold",
    padding: 3,               // spacing between words
    rotateRatio: 0.3,         // probability a word is rotated 90deg
    backgroundColor: null,    // null = transparent
    colors: [                 // palette cycled through by frequency rank
      "#2563eb", "#7c3aed", "#db2777", "#dc2626",
      "#ea580c", "#ca8a04", "#16a34a", "#0d9488",
      "#0891b2", "#4f46e5"
    ],
    stopwords: null,          // pass a custom Set/Array to override defaults
    extraStopwords: [],       // additional words to exclude on top of defaults
    caseSensitive: false,     // if false, words are lowercased before counting
    onWordClick: null,        // optional callback(word, count, event)
    seed: null                // optional numeric seed for deterministic layout
  };

  // A reasonably thorough English stopword list. Override via options.stopwords
  // or extend via options.extraStopwords.
  const DEFAULT_STOPWORDS = new Set([
    "a","about","above","after","again","against","all","am","an","and","any",
    "are","aren't","as","at","be","because","been","before","being","below",
    "between","both","but","by","can","cannot","can't","could","couldn't","did",
    "didn't","do","does","doesn't","doing","don't","down","during","each","few",
    "for","from","further","had","hadn't","has","hasn't","have","haven't","having",
    "he","he'd","he'll","he's","her","here","here's","hers","herself","him",
    "himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into",
    "is","isn't","it","it's","its","itself","let's","me","more","most","mustn't",
    "my","myself","no","nor","not","of","off","on","once","only","or","other",
    "ought","our","ours","ourselves","out","over","own","same","shan't","she",
    "she'd","she'll","she's","should","shouldn't","so","some","such","than",
    "that","that's","the","their","theirs","them","themselves","then","there",
    "there's","these","they","they'd","they'll","they're","they've","this",
    "those","through","to","too","under","until","up","very","was","wasn't",
    "we","we'd","we'll","we're","we've","were","weren't","what","what's","when",
    "when's","where","where's","which","while","who","who's","whom","why","why's",
    "with","won't","would","wouldn't","you","you'd","you'll","you're","you've",
    "your","yours","yourself","yourselves",
    // common in titles, often low-signal
    "vs","via","new","using","based","towards","toward","part"
  ]);

  // ---------------------------------------------------------------------
  // Reference list parsing
  // ---------------------------------------------------------------------

  /**
   * Extracts titles from an ordered list of bibliographic references, e.g.:
   *
   *   <ol>
   *     <li>J. Doe, A. Smith, "Deep Learning for X," in <em>Proc. ABC</em>,
   *         2024, pp. 1-10. Available: <a href="https://doi.org/...">doi</a></li>
   *     ...
   *   </ol>
   *
   * Strategy: for each <li>, find the text wrapped in quotation marks
   * (supports straight " " and curly “ ” / ‘ ’ quotes) and treat that as
   * the title. If no quoted segment is found, the <li> is skipped (and
   * optionally reported via options.onUnmatched).
   *
   * @param {string|HTMLOListElement|NodeList|HTMLElement[]} source
   *        - a CSS selector string (e.g. "#references ol" or "ol.refs"),
   *        - an <ol> element,
   *        - or a NodeList/array of <li> elements.
   * @param {object} [options]
   * @param {function} [options.onUnmatched] - callback(liElement, index) called
   *        for any <li> where no quoted title could be found.
   * @param {boolean} [options.stripTrailingPunctuation=true] - removes a
   *        trailing comma/period left just inside the closing quote
   *        (e.g. `"Title,"` -> `Title`).
   * @returns {string[]} array of extracted title strings, in document order.
   */
  function extractTitlesFromReferenceList(source, options) {
    const opts = Object.assign(
      { onUnmatched: null, stripTrailingPunctuation: true },
      options || {}
    );

    const items = resolveListItems(source);
    const titles = [];

    // A single, quote-agnostic pattern: matches an opening quote of any
    // style (" “ ') and lazily captures up to the NEXT closing quote of
    // any style (" ” '). This deliberately does NOT require the opening
    // and closing characters to match, because copy-pasted reference
    // lists often mix straight and curly quotes within the same title
    // (e.g. opening " paired with a closing ”).
    const QUOTE_PATTERN = /["“']([^"“”'’]+)["”'’]/;

    items.forEach((li, index) => {
      const text = (li.textContent || "").replace(/\s+/g, " ").trim();

      const match = text.match(QUOTE_PATTERN);

      if (!match) {
        if (typeof opts.onUnmatched === "function") {
          opts.onUnmatched(li, index);
        }
        return;
      }

      let title = match[1].trim();
      if (opts.stripTrailingPunctuation) {
        title = title.replace(/[.,;:]+$/, "").trim();
      }

      titles.push(title);
    });

    return titles;
  }

  /**
   * Normalizes the `source` argument into an array of <li> elements.
   */
  function resolveListItems(source) {
    let liElements = [];

    if (typeof source === "string") {
      const el = document.querySelector(source);
      if (!el) {
        throw new Error(
          `extractTitlesFromReferenceList: no element found for selector "${source}".`
        );
      }
      liElements = el.tagName === "LI" ? [el] : Array.from(el.querySelectorAll("li"));
    } else if (source instanceof HTMLOListElement || source instanceof HTMLUListElement) {
      liElements = Array.from(source.querySelectorAll("li"));
    } else if (source instanceof HTMLLIElement) {
      liElements = [source];
    } else if (source instanceof NodeList || Array.isArray(source)) {
      liElements = Array.from(source);
    } else {
      throw new Error(
        "extractTitlesFromReferenceList: `source` must be a CSS selector, " +
          "an <ol>/<ul> element, an <li> element, or a list/array of <li> elements."
      );
    }

    return liElements;
  }

  // ---------------------------------------------------------------------
  // Word extraction & frequency counting
  // ---------------------------------------------------------------------

  /**
   * Tokenizes a single title string into clean words.
   */
  function tokenize(title, caseSensitive) {
    if (typeof title !== "string") return [];
    const normalized = caseSensitive ? title : title.toLowerCase();
    // Split on anything that isn't a letter, digit, or internal apostrophe/hyphen
    return normalized
      .split(/[^a-zA-Z0-9'’-]+/)
      .map(w => w.replace(/^[-']+|[-']+$/g, "")) // trim stray leading/trailing punctuation
      .filter(Boolean);
  }

  /**
   * Builds a frequency map { word: count } from an array of titles.
   */
  function buildFrequencyMap(titles, opts) {
    const stopwords = opts.stopwords
      ? new Set(Array.isArray(opts.stopwords) ? opts.stopwords : opts.stopwords)
      : new Set(DEFAULT_STOPWORDS);

    (opts.extraStopwords || []).forEach(w =>
      stopwords.add(opts.caseSensitive ? w : String(w).toLowerCase())
    );

    const freq = new Map();

    titles.forEach(title => {
      tokenize(title, opts.caseSensitive).forEach(word => {
        if (word.length < opts.minWordLength) return;
        if (stopwords.has(word)) return;
        if (/^\d+$/.test(word)) return; // skip pure numbers
        freq.set(word, (freq.get(word) || 0) + 1);
      });
    });

    return freq;
  }

  /**
   * Converts a frequency map into a sorted array of { text, value } objects,
   * capped at maxWords.
   */
  function frequencyMapToWordList(freq, maxWords) {
    return Array.from(freq.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords);
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  /**
   * Resolves a canvas element from a string selector or direct reference.
   */
  function resolveCanvas(canvasOrSelector) {
    let canvas = null;
    if (typeof canvasOrSelector === "string") {
      canvas = document.querySelector(canvasOrSelector);
    } else if (canvasOrSelector instanceof HTMLCanvasElement) {
      canvas = canvasOrSelector;
    }
    if (!canvas) {
      throw new Error(
        "renderWordCloud: could not resolve a <canvas> element from the argument provided."
      );
    }
    return canvas;
  }

  /**
   * Maps a frequency value to a font size using a sqrt scale, which tends
   * to look more balanced than a pure linear scale for word clouds.
   */
  function makeFontScale(words, minFontSize, maxFontSize) {
    const values = words.map(w => w.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);

    if (minV === maxV) {
      return () => (minFontSize + maxFontSize) / 2;
    }

    const scale = global.d3
      .scaleSqrt()
      .domain([minV, maxV])
      .range([minFontSize, maxFontSize]);

    return value => scale(value);
  }

  /**
   * Main entry point.
   *
   * @param {string[]} titles - array of title strings
   * @param {string|HTMLCanvasElement} canvasOrSelector - target <canvas>
   * @param {object} [options] - see DEFAULTS above
   * @returns {Promise<Array<{text:string, value:number}>>} resolves with the
   *          word frequency list actually rendered (useful for legends/debugging)
   */
  function renderWordCloud(titles, canvasOrSelector, options) {
    if (!global.d3) {
      throw new Error("renderWordCloud: d3 is required but was not found on window.");
    }
    if (!global.d3.layout || !global.d3.layout.cloud) {
      throw new Error(
        "renderWordCloud: d3-cloud is required but was not found (expected d3.layout.cloud)."
      );
    }
    if (!Array.isArray(titles)) {
      throw new Error("renderWordCloud: `titles` must be an array of strings.");
    }

    const opts = Object.assign({}, DEFAULTS, options || {});
    const canvas = resolveCanvas(canvasOrSelector);

    const width = opts.width || canvas.width || canvas.clientWidth || 800;
    const height = opts.height || canvas.height || canvas.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;

    const freq = buildFrequencyMap(titles, opts);
    const words = frequencyMapToWordList(freq, opts.maxWords);

    return new Promise((resolve, reject) => {
      if (words.length === 0) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        resolve([]);
        return;
      }

      const fontScale = makeFontScale(words, opts.minFontSize, opts.maxFontSize);
      let rngState = opts.seed != null ? opts.seed : null;

      // Simple deterministic PRNG (mulberry32) used only when a seed is given,
      // so layouts can be reproduced if needed.
      function seededRandom() {
        rngState |= 0;
        rngState = (rngState + 0x6d2b79f5) | 0;
        let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }

      const layout = global.d3.layout
        .cloud()
        .size([width, height])
        .words(words.map(w => ({ text: w.text, value: w.value })))
        .padding(opts.padding)
        .rotate(() =>
          (opts.seed != null ? seededRandom() : Math.random()) < opts.rotateRatio ? 90 : 0
        )
        .font(opts.fontFamily)
        .fontWeight(opts.fontWeight)
        .fontSize(d => fontScale(d.value))
        .random(opts.seed != null ? seededRandom : Math.random)
        .on("end", draw);

      layout.start();

      function draw(placedWords) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        if (opts.backgroundColor) {
          ctx.save();
          ctx.fillStyle = opts.backgroundColor;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        ctx.save();
        ctx.translate(width / 2, height / 2);

        placedWords.forEach((w, i) => {
          ctx.save();
          ctx.translate(w.x, w.y);
          ctx.rotate((w.rotate * Math.PI) / 180);
          ctx.font = `${opts.fontWeight} ${w.size}px ${opts.fontFamily}`;
          ctx.fillStyle = opts.colors[i % opts.colors.length];
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(w.text, 0, 0);
          ctx.restore();
        });

        ctx.restore();

        if (typeof opts.onWordClick === "function") {
          attachClickHandler(canvas, placedWords, width, height, opts);
        }

        resolve(
          placedWords.map(w => ({ text: w.text, value: w.value || freq.get(w.text) }))
        );
      }
    });
  }

  /**
   * Attaches a click listener on the canvas that hit-tests against the
   * placed word bounding boxes (approximate, axis-aligned).
   */
  function attachClickHandler(canvas, placedWords, width, height, opts) {
    canvas.onclick = function (event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (event.clientX - rect.left) * scaleX - width / 2;
      const clickY = (event.clientY - rect.top) * scaleY - height / 2;

      for (const w of placedWords) {
        const halfW = (w.width || w.size * w.text.length * 0.55) / 2;
        const halfH = w.size / 2;
        if (
          clickX >= w.x - halfW &&
          clickX <= w.x + halfW &&
          clickY >= w.y - halfH &&
          clickY <= w.y + halfH
        ) {
          opts.onWordClick(w.text, w.value, event);
          break;
        }
      }
    };
  }

  // Expose helpers in case the consumer wants frequency data without rendering
  global.renderWordCloud = renderWordCloud;
  global.extractTitlesFromReferenceList = extractTitlesFromReferenceList;
  global.wordCloudUtils = {
    tokenize,
    buildFrequencyMap,
    frequencyMapToWordList,
    DEFAULT_STOPWORDS,
    resolveListItems
  };
})(typeof window !== "undefined" ? window : globalThis);
