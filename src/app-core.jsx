/* ============================================================
   ASTER · LEXICON VOYAGE
   A local-first vocabulary trainer with optional DeepSeek review.
   ============================================================ */

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { motion, AnimatePresence } = window.Motion || window.FramerMotion || {};

/* ------------------------------------------------------------------ */
/* Interface language                                                  */
/* ------------------------------------------------------------------ */

let ACTIVE_LANGUAGE = "zh";

function setActiveLanguage(language) {
  ACTIVE_LANGUAGE = language === "en" ? "en" : "zh";
}

/** Pick the string matching the current interface language. */
function tr(zh, en) {
  return ACTIVE_LANGUAGE === "en" ? en : zh;
}

function currentLanguage() {
  return ACTIVE_LANGUAGE;
}

function localeCode() {
  return ACTIVE_LANGUAGE === "en" ? "en-US" : "zh-CN";
}

/* Framer Motion 11 development builds emit benign list-key warnings from their
   own internals. Keep the console useful by filtering only that known warning. */
const nativeConsoleError = console.error.bind(console);
console.error = (...args) => {
  const first = typeof args[0] === "string" ? args[0] : "";
  if (first.includes('unique "key" prop') && first.includes("framer-motion")) return;
  if (first.includes('unique "key" prop') && args.some((arg) => typeof arg === "string" && arg.includes("framer-motion"))) return;
  nativeConsoleError(...args);
};

const APP_STORAGE_KEY = "aster-lexicon-voyage:v1";
const APP_NAME = "Aster";
const DISPLACEMENT_MAP_DATA_URL = "data:image/png;base64,__DISPLACEMENT_MAP__";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";
const CAPABILITIES_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4";

const POS_OPTIONS = [
  { id: "noun", key: "1", zh: "名词", en: "noun" },
  { id: "verb", key: "2", zh: "动词", en: "verb" },
  { id: "adjective", key: "3", zh: "形容词", en: "adjective" },
  { id: "adverb", key: "4", zh: "副词", en: "adverb" },
  { id: "preposition", key: "5", zh: "介词", en: "preposition" },
  { id: "conjunction", key: "6", zh: "连词", en: "conjunction" },
  { id: "pronoun", key: "7", zh: "代词", en: "pronoun" },
  { id: "other", key: "8", zh: "其他", en: "other" },
];

const FIELD_META = {
  pos: { zh: "词性", en: "Part of speech", short: "POS", weight: 0.2 },
  zh: { zh: "中文释义", en: "Chinese", short: "ZH", weight: 0.4 },
  en: { zh: "英文释义", en: "English", short: "EN", weight: 0.4 },
};

const POS_ALIASES = {
  n: "noun", "n.": "noun", noun: "noun", nouns: "noun", "名词": "noun",
  v: "verb", "v.": "verb", verb: "verb", verbs: "verb", vt: "verb", vi: "verb", "动词": "verb", auxiliary: "verb", aux: "verb", modal: "verb",
  adj: "adjective", "adj.": "adjective", a: "adjective", adjective: "adjective", adjectives: "adjective", "形容词": "adjective",
  adv: "adverb", "adv.": "adverb", adverb: "adverb", adverbs: "adverb", "副词": "adverb",
  prep: "preposition", "prep.": "preposition", preposition: "preposition", prepositions: "preposition", "介词": "preposition",
  conj: "conjunction", "conj.": "conjunction", conjunction: "conjunction", conjunctions: "conjunction", "连词": "conjunction",
  pron: "pronoun", "pron.": "pronoun", pronoun: "pronoun", pronouns: "pronoun", "代词": "pronoun",
  num: "other", numeral: "other", "num.": "other", det: "other", determiner: "other", article: "other", interj: "other", "interj.": "other", interjection: "other", phrase: "other", phrasal: "other", "短语": "other", "其他": "other", other: "other",
};

const SAMPLE_WORDS = [
  {
    id: "seed-abandon", word: "abandon", pos: ["verb"], rawPos: "verb",
    en: "to leave someone or something and never return",
    zh: "放弃；抛弃；离弃",
    memoryTip: "a + band + on：乐队离场，把一切抛在身后。", memoryTipEn: "a + band + on: the band leaves everything behind.",
    tags: ["离开", "放弃"], difficulty: 2, source: "sample", tagsEn: ["leaving", "giving up"]
  },
  {
    id: "seed-abnormal", word: "abnormal", pos: ["adjective"], rawPos: "adjective",
    en: "different from what is usual or expected, especially in a way that is worrying",
    zh: "异常的；反常的；畸形的",
    memoryTip: "ab（离开）+ normal（正常）→ 偏离正常。", memoryTipEn: "ab (away from) + normal → away from normal.",
    tags: ["偏差", "状态"], difficulty: 2, source: "sample", tagsEn: ["deviation", "state"]
  },
  {
    id: "seed-achievement", word: "achievement", pos: ["noun"], rawPos: "noun",
    en: "something important that you succeed in doing by your own efforts",
    zh: "成就；成绩；完成",
    memoryTip: "achieve + ment：努力抵达后的里程碑。", memoryTipEn: "achieve + ment: a milestone earned through effort.",
    tags: ["成果", "努力"], difficulty: 2, source: "sample", tagsEn: ["result", "effort"]
  },
  {
    id: "seed-area", word: "area", pos: ["noun"], rawPos: "noun",
    en: "a particular part of a place, country, or the world",
    zh: "地区；区域；领域",
    memoryTip: "地图上被圈出的那一块。", memoryTipEn: "the part of the map you draw a circle around.",
    tags: ["空间", "范围"], difficulty: 1, source: "sample", tagsEn: ["space", "scope"]
  },
  {
    id: "seed-assist", word: "assist", pos: ["verb"], rawPos: "verb",
    en: "to help someone do something",
    zh: "帮助；协助；援助",
    memoryTip: "as + sist（站）→ 站到身边搭把手。", memoryTipEn: "as + sist (to stand): stand beside someone to help.",
    tags: ["帮助", "协作"], difficulty: 2, source: "sample", tagsEn: ["help", "collaboration"]
  },
  {
    id: "seed-authority", word: "authority", pos: ["noun"], rawPos: "noun",
    en: "the power or right to give orders and make decisions",
    zh: "权威；当局；权力",
    memoryTip: "author（创造者）→ 制定规则的力量。", memoryTipEn: "the author sets the rules.",
    tags: ["权力", "规则"], difficulty: 2, source: "sample", tagsEn: ["power", "rules"]
  },
  {
    id: "seed-aware", word: "aware", pos: ["adjective"], rawPos: "adjective",
    en: "having knowledge or understanding of a situation or fact",
    zh: "意识到的；知道的；察觉的",
    memoryTip: "心里的雷达已经亮起。", memoryTipEn: "the radar in your mind is already on.",
    tags: ["意识", "察觉"], difficulty: 2, source: "sample", tagsEn: ["awareness", "perception"]
  },
  {
    id: "seed-bond", word: "bond", pos: ["noun"], rawPos: "noun",
    en: "a close connection between people; an official document relating to money",
    zh: "联系；纽带；债券",
    memoryTip: "Bond 既是特工，也是牢固的连接。", memoryTipEn: "Bond is an agent — and also a strong connection.",
    tags: ["连接", "情感"], difficulty: 2, source: "sample", tagsEn: ["connection", "emotion"]
  },
  {
    id: "seed-capable", word: "capable", pos: ["adjective"], rawPos: "adjective",
    en: "having the ability or skill to do something",
    zh: "有能力的；能干的；有技能的",
    memoryTip: "cap（握住）→ 接得住任务。", memoryTipEn: "cap (to hold): able to take on the task.",
    tags: ["能力", "技能"], difficulty: 2, source: "sample", tagsEn: ["ability", "skill"]
  },
  {
    id: "seed-chapter", word: "chapter", pos: ["noun"], rawPos: "noun",
    en: "a main division of a book; a particular period of time in history or in someone's life",
    zh: "章节；章；时期",
    memoryTip: "书的一章，也是人生的一段。", memoryTipEn: "a chapter of a book, a chapter of life.",
    tags: ["书本", "阶段"], difficulty: 2, source: "sample", tagsEn: ["books", "stage"]
  },
  {
    id: "seed-chemical", word: "chemical", pos: ["adjective"], rawPos: "adjective",
    en: "relating to chemistry or substances produced by chemical processes",
    zh: "化学的；化学品",
    memoryTip: "chem（炼金）→ 化学的。", memoryTipEn: "chem (alchemy) → chemical.",
    tags: ["科学", "物质"], difficulty: 2, source: "sample", tagsEn: ["science", "matter"]
  },
  {
    id: "seed-circumstance", word: "circumstance", pos: ["noun"], rawPos: "noun",
    en: "a fact or condition that affects a situation",
    zh: "情况；环境；条件",
    memoryTip: "circum（环绕）+ stance（站立）→ 周围的情形。", memoryTipEn: "circum (around) + stance (standing): what stands around you.",
    tags: ["情境", "条件"], difficulty: 3, source: "sample", tagsEn: ["situation", "condition"]
  },
  {
    id: "seed-civil", word: "civil", pos: ["adjective"], rawPos: "adjective",
    en: "relating to citizens and their rights, or polite and respectful",
    zh: "公民的；民事的；礼貌的",
    memoryTip: "civilian 的形容词：公民的，也指有礼的。", memoryTipEn: "the adjective of citizen — also polite.",
    tags: ["社会", "礼貌"], difficulty: 2, source: "sample", tagsEn: ["society", "courtesy"]
  },
  {
    id: "seed-comment", word: "comment", pos: ["noun", "verb"], rawPos: "noun/verb",
    en: "a written or spoken remark expressing an opinion; to express an opinion about something",
    zh: "评论；注释；发表意见",
    memoryTip: "com（共同）+ ment（思考）→ 说出你的看法。", memoryTipEn: "com (together) + ment (think): share what you think.",
    tags: ["表达", "观点"], difficulty: 2, source: "sample", tagsEn: ["expression", "opinion"]
  },
];

const DEFAULT_SETTINGS = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  language: "zh",
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors duration-200 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_GLASS =
  "liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-40";
const BTN_QUIET =
  "inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white";
const CHIP_GLASS =
  "liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-white/80";
const INPUT_CLASS =
  "field-input px-4 py-3 text-sm placeholder:text-white/35";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

function uid(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function createInitialData() {
  return {
    version: 1,
    words: SAMPLE_WORDS.map((word) => ({ ...word, referenceSource: "sample" })),
    attempts: [],
    settings: { ...DEFAULT_SETTINGS },
    coachNote: null,
    createdAt: new Date().toISOString(),
  };
}

function loadAppData() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return createInitialData();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.words) || !Array.isArray(parsed.attempts)) {
      return createInitialData();
    }
    const sampleByName = new Map(SAMPLE_WORDS.map((word) => [normalizeWord(word.word), word]));
    const words = parsed.words.map((word) => {
      const referenceSource = word.referenceSource || (word.source === "sample" ? "sample" : "excel");
      if (word.source !== "sample") return { ...word, referenceSource };
      const sample = sampleByName.get(normalizeWord(word.word));
      if (!sample) return { ...word, referenceSource };
      return {
        ...word,
        referenceSource: "sample",
        memoryTipEn: word.memoryTipEn || sample.memoryTipEn,
        tagsEn: word.tagsEn?.length ? word.tagsEn : sample.tagsEn,
      };
    });
    return {
      ...createInitialData(),
      ...parsed,
      words,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      coachNote: parsed.coachNote || null,
    };
  } catch (error) {
    return createInitialData();
  }
}

function normalizeWord(word) {
  return String(word || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function splitPosRaw(raw) {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => splitPosRaw(item));
  }
  if (raw === null || raw === undefined) return [];
  return String(raw)
    .toLowerCase()
    .replace(/[()（）]/g, " ")
    .split(/[\/／,，;；、|&]+|\s+and\s+|\s+/)
    .map((token) => token.replace(/[.:：]/g, "").trim())
    .filter(Boolean);
}

function normalizePos(raw) {
  if (Array.isArray(raw)) {
    const tokens = raw.flatMap((item) => splitPosRaw(item));
    const mapped = unique(tokens.map((token) => POS_ALIASES[token] || POS_ALIASES[token.toLowerCase()]).filter(Boolean));
    return sortPos(mapped);
  }
  const tokens = splitPosRaw(raw);
  const mapped = unique(tokens.map((token) => POS_ALIASES[token] || POS_ALIASES[token.toLowerCase()]).filter(Boolean));
  if (!mapped.length && String(raw || "").trim()) return ["other"];
  return sortPos(mapped);
}

function sortPos(list) {
  return POS_OPTIONS.filter((option) => list.includes(option.id)).map((option) => option.id);
}

function posLabel(id) {
  const item = POS_OPTIONS.find((option) => option.id === id);
  return item ? tr(item.zh, item.en) : tr("其他", "other");
}

function posLabelList(list) {
  if (!Array.isArray(list) || !list.length) return "—";
  return list.map((id) => posLabel(id)).join(" / ");
}

function posOptionLabel(option) {
  return tr(option.zh, option.en);
}

function fieldLabel(field) {
  const meta = FIELD_META[field];
  return meta ? tr(meta.zh, meta.en) : field;
}

function wordTags(word) {
  if (currentLanguage() === "en" && Array.isArray(word?.tagsEn) && word.tagsEn.length) {
    return word.tagsEn;
  }
  return Array.isArray(word?.tags) ? word.tags : [];
}

function wordMemoryTip(word) {
  if (currentLanguage() === "en" && word?.memoryTipEn) return word.memoryTipEn;
  return word?.memoryTip || "";
}

function unique(list) {
  return Array.from(new Set(list));
}

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function normalizeStringArray(value, limit = 5) {
  if (!Array.isArray(value)) return [];
  return unique(
    value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  ).slice(0, limit);
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat(localeCode(), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatDayLabel(ts) {
  return new Intl.DateTimeFormat(localeCode(), { month: "numeric", day: "numeric" }).format(new Date(ts));
}

function dayKey(ts) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMasteryBand(score) {
  if (score === null || score === undefined) return { zh: "未启航", en: "Untouched" };
  if (score >= 85) return { zh: "已掌握", en: "Mastered" };
  if (score >= 70) return { zh: "较稳定", en: "Stable" };
  if (score >= 50) return { zh: "待巩固", en: "Drifting" };
  return { zh: "需重练", en: "Off course" };
}

function masteryBandLabel(score) {
  const band = getMasteryBand(score);
  return tr(band.zh, band.en);
}

function getScoreTone(score) {
  if (score === null || score === undefined) return "text-white/30";
  if (score >= 80) return "text-white";
  if (score >= 60) return "text-white/80";
  return "text-white/60";
}

/* ------------------------------------------------------------------ */
/* Mastery calculations                                                */
/* ------------------------------------------------------------------ */

function wordMastery(word, attempts) {
  const related = attempts
    .filter((attempt) => attempt.wordId === word.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!related.length) {
    return {
      overall: null,
      fields: { pos: null, zh: null, en: null },
      attempts: 0,
      lastAt: null,
      related: [],
    };
  }

  const recent = related.slice(0, 3);
  const fields = {};
  for (const field of Object.keys(FIELD_META)) {
    const scores = recent
      .map((attempt) => attempt.scores?.[field])
      .filter((score) => typeof score === "number" && Number.isFinite(score));
    fields[field] = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;
  }

  const weightedFields = Object.entries(FIELD_META)
    .map(([field, meta]) => {
      const score = fields[field];
      return typeof score === "number" ? { score, weight: meta.weight } : null;
    })
    .filter(Boolean);
  const totalWeight = weightedFields.reduce((sum, entry) => sum + entry.weight, 0);
  const overall = weightedFields.length
    ? Math.round(weightedFields.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / totalWeight)
    : null;

  return {
    overall,
    fields,
    attempts: related.length,
    lastAt: related[0].createdAt,
    related,
  };
}

function buildSummary(words, attempts) {
  const stats = words.map((word) => ({ word, ...wordMastery(word, attempts) }));
  const attempted = stats.filter((stat) => stat.attempts > 0);
  const averages = {};
  for (const field of Object.keys(FIELD_META)) {
    const values = attempted
      .map((stat) => stat.fields[field])
      .filter((value) => typeof value === "number");
    averages[field] = values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;
  }

  const overallValues = attempted
    .map((stat) => stat.overall)
    .filter((value) => typeof value === "number");
  const overall = overallValues.length
    ? Math.round(overallValues.reduce((sum, value) => sum + value, 0) / overallValues.length)
    : null;

  const fieldRanking = Object.entries(FIELD_META)
    .map(([field, meta]) => ({
      field,
      score: averages[field],
      label: fieldLabel(field),
      attempted: attempted.filter((stat) => typeof stat.fields[field] === "number").length,
    }))
    .sort((a, b) => {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return a.score - b.score;
    });

  const weakestField = fieldRanking.find((item) => item.score !== null) || fieldRanking[0];
  const weakestWord = [...attempted].sort((a, b) => (a.overall ?? 101) - (b.overall ?? 101))[0] || null;

  const dayMap = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.createdAt) return;
    const key = dayKey(attempt.createdAt);
    const current = dayMap.get(key) || { key, total: 0, count: 0, timestamp: attempt.createdAt };
    current.total += typeof attempt.overall === "number" ? attempt.overall : 0;
    current.count += 1;
    current.timestamp = Math.max(current.timestamp, attempt.createdAt);
    dayMap.set(key, current);
  });
  const byDay = Array.from(dayMap.values())
    .map((item) => ({
      ...item,
      average: item.count ? Math.round(item.total / item.count) : 0,
      label: formatDayLabel(item.timestamp),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const weakFieldList = fieldRanking.filter((item) => item.score !== null && item.score < 75);

  return {
    wordCount: words.length,
    attemptedCount: attempted.length,
    attemptCount: attempts.length,
    coverage: words.length ? Math.round((attempted.length / words.length) * 100) : 0,
    overall,
    averages,
    fieldRanking,
    weakestField,
    weakestWord,
    stats,
    attempted,
    byDay,
    weakFieldList,
  };
}

/* ------------------------------------------------------------------ */
/* Local semantic fallback                                             */
/* ------------------------------------------------------------------ */

const EN_STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "or", "and", "someone", "something", "somebody",
  "that", "which", "who", "be", "is", "are", "was", "were", "by", "with", "for",
  "in", "on", "at", "as", "it", "its", "their", "his", "her", "your", "you",
  "from", "into", "about", "when", "where", "so", "such", "especially", "very",
  "more", "most", "usually", "often", "particular", "relating", "relate",
]);

function stemEnglish(token) {
  return token
    .toLowerCase()
    .replace(/^[^a-z']+|[^a-z']+$/g, "")
    .replace(/ies$/, "y")
    .replace(/(ing|ed|es|s)$/, "");
}

function contentTokens(text) {
  return unique(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z']+/)
      .map(stemEnglish)
      .filter((token) => token.length > 1 && !EN_STOPWORDS.has(token))
  );
}

function splitSenses(text) {
  return String(text || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .split(/[；;，,、/|]+|\s+and\s+/i)
    .map((item) => item.replace(/[\s。.!?！？:："'“”‘’]/g, "").trim())
    .filter(Boolean);
}

function segmentMatch(reference, userSegment) {
  if (!reference || !userSegment) return false;
  if (reference.includes(userSegment) || userSegment.includes(reference)) return true;
  const a = new Set(Array.from(reference));
  const b = new Set(Array.from(userSegment));
  if (!a.size || !b.size) return false;
  let overlap = 0;
  a.forEach((char) => {
    if (b.has(char)) overlap += 1;
  });
  const dice = (2 * overlap) / (a.size + b.size);
  return dice >= 0.72;
}

function evaluatePos(selected, expected) {
  const expectedList = unique(Array.isArray(expected) ? expected : []);
  const selectedList = unique(Array.isArray(selected) ? selected : []);
  if (!expectedList.length) {
    return { score: 0, correct: false, feedback: tr("该词条没有可用的词性数据。", "This card has no part-of-speech data.") };
  }
  if (!selectedList.length) {
    return { score: 0, correct: false, feedback: tr("还没有选择词性。词性是词义的第一层坐标。", "No part of speech selected yet. It is the first coordinate of meaning.") };
  }
  const intersection = selectedList.filter((item) => expectedList.includes(item));
  const union = unique([...selectedList, ...expectedList]);
  const exact = intersection.length === expectedList.length && selectedList.length === expectedList.length;
  if (exact) {
    return { score: 100, correct: true, feedback: tr("词性坐标完全命中，没有遗漏或多选。", "Part of speech matches exactly, with nothing missing or extra.") };
  }
  const score = Math.round((intersection.length / union.length) * 100);
  let feedback = tr("词性与参考不完全一致。", "Part of speech does not fully match the reference.");
  if (intersection.length === 0) feedback = tr("所选词性没有命中参考坐标。", "None of the selected parts of speech match the reference.");
  else if (intersection.length < expectedList.length) feedback = tr("部分词性缺失；如果单词有多个词性，记得一起选中。", "Some parts of speech are missing. Select every valid part of speech for this word.");
  else feedback = tr("核心词性已选中，但多选了参考之外的词性。", "The core part of speech is selected, but an extra one was added.");
  return { score, correct: false, feedback };
}

function evaluateZh(user, reference) {
  const refSegments = unique(splitSenses(reference));
  const userText = String(user || "").replace(/\s+/g, "");
  if (!userText) return { score: 0, correct: false, feedback: tr("中文释义还是空白。先写下你能想起的义项。", "The Chinese meaning is blank. Write the senses you remember first.") };
  if (!refSegments.length) return { score: 0, correct: false, feedback: tr("参考中没有中文释义可供比对。", "The reference card has no Chinese meaning to compare against.") };
  const userSegments = splitSenses(user);
  let hits = 0;
  refSegments.forEach((segment) => {
    const matched = userSegments.some((candidate) => segmentMatch(segment, candidate)) || segmentMatch(segment, userText);
    if (matched) hits += 1;
  });
  const coverage = hits / refSegments.length;
  const unmatchedUser = userSegments.filter((candidate) => !refSegments.some((segment) => segmentMatch(segment, candidate))).length;
  let score = Math.round(coverage * 92);
  score = Math.max(0, score - Math.min(18, unmatchedUser * 5));
  if (coverage === 1) score = 100;
  if (coverage >= 0.8) score = Math.max(score, 82);
  const correct = coverage === 1;
  let feedback;
  if (coverage === 1) feedback = tr("覆盖了参考释义的主要义项；本地匹配已通过。", "The main senses from the reference are covered; local matching passed.");
  else if (coverage > 0) feedback = tr(`本地匹配到 ${hits}/${refSegments.length} 个核心义项。同义表达可能漏判，可以连接 AI 复核。`, `Local matching found ${hits}/${refSegments.length} core senses. Synonyms may be missed; connect AI for a closer review.`);
  else feedback = tr("没有匹配到参考义项。可能是同义表达未被本地规则识别，请连接 AI 复核。", "No reference sense matched. A synonym may have been missed by the local rules; connect AI to review.");
  return { score: clamp(score), correct, feedback };
}

function evaluateEn(user, reference) {
  const refTokens = contentTokens(reference);
  const userText = String(user || "").trim();
  if (!userText) return { score: 0, correct: false, feedback: tr("英文释义还是空白。试着用一条简短定义描述它。", "The English definition is blank. Try to describe it in one short definition.") };
  if (!refTokens.length) return { score: 0, correct: false, feedback: tr("参考中没有可用于比对的英文释义。", "The reference card has no English definition to compare against.") };
  const userTokens = contentTokens(userText);
  const hits = refTokens.filter((token) => userTokens.includes(token)).length;
  const coverage = hits / refTokens.length;
  let score = Math.round(coverage * 90);
  if (coverage === 1) score = 100;
  if (coverage >= 0.8) score = Math.max(score, 80);
  const correct = coverage >= 0.8;
  let feedback;
  if (coverage === 1) feedback = tr("英文释义覆盖了参考中的核心概念；本地匹配已通过。", "The English definition covers the core concepts; local matching passed.");
  else if (coverage >= 0.5) feedback = tr(`本地匹配到 ${hits}/${refTokens.length} 个关键词，释义可能不完整。AI 能更好理解同义改写。`, `Local matching found ${hits}/${refTokens.length} key concepts. The definition may be incomplete; AI understands paraphrases better.`);
  else if (coverage > 0) feedback = tr(`只匹配到 ${hits}/${refTokens.length} 个核心概念，建议补充更完整的定义。`, `Only ${hits}/${refTokens.length} core concepts matched. Try a more complete definition.`);
  else feedback = tr("没有匹配到参考中的英文关键词；也可能是你用了完全不同的同义表达。", "No English keywords from the reference matched. You may have used a completely different paraphrase.");
  return { score: clamp(score), correct, feedback };
}

function localEvaluate(word, answers) {
  const pos = evaluatePos(answers.selectedPos, word.pos);
  const zh = evaluateZh(answers.zh, word.zh);
  const en = evaluateEn(answers.en, word.en);
  const overall = Math.round(pos.score * 0.2 + zh.score * 0.4 + en.score * 0.4);
  const strengths = [];
  const gaps = [];
  if (pos.score >= 85) strengths.push(tr("词性识别稳定", "Part of speech is solid"));
  else gaps.push(tr("词性选择不完整", "Part of speech needs work"));
  if (zh.score >= 85) strengths.push(tr("中文义项覆盖完整", "Chinese senses are well covered"));
  else gaps.push(tr("中文释义需要补全", "Chinese meaning needs completion"));
  if (en.score >= 85) strengths.push(tr("英文定义理解到位", "English definition is understood"));
  else gaps.push(tr("英文释义缺少核心概念", "English definition misses key concepts"));
  return {
    pos,
    zh,
    en,
    overall,
    strengths,
    gaps,
    source: "local",
    model: null,
  };
}

/* ------------------------------------------------------------------ */
/* DeepSeek                                                            */
/* ------------------------------------------------------------------ */

function getChatEndpoint(baseUrl) {
  const base = String(baseUrl || DEFAULT_SETTINGS.baseUrl).trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(base)) return base;
  return `${base}/chat/completions`;
}

function parseAiJson(content) {
  const text = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error(tr("AI 返回的内容不是有效 JSON。", "AI returned content that is not valid JSON."));
  }
}

async function callDeepSeek(config, messages, options = {}) {
  const apiKey = String(config?.apiKey || "").trim();
  if (!apiKey) throw new Error(tr("尚未填写 DeepSeek 密钥。", "No DeepSeek API key has been configured."));
  if (!/^https?:\/\//i.test(String(config?.baseUrl || ""))) {
    throw new Error(tr("Base URL 必须以 http 或 https 开头。", "Base URL must start with http or https."));
  }

  const endpoint = getChatEndpoint(config.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 75000);
  let externalAbortHandler = null;
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    externalAbortHandler = () => controller.abort();
    options.signal.addEventListener("abort", externalAbortHandler, { once: true });
  }

  try {
    const body = {
      model: config.model || DEFAULT_SETTINGS.model,
      messages,
      temperature: options.temperature ?? 0.2,
      stream: false,
    };
    if (options.maxTokens) body.max_tokens = options.maxTokens;
    if (options.json) body.response_format = { type: "json_object" };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
      if (response.status === 401) throw new Error(tr("API Key 无效或已过期，请在设置中检查。", "The API key is invalid or expired. Check it in Settings."));
      if (response.status === 402) throw new Error(tr("DeepSeek 账户余额不足，请充值后重试。", "Your DeepSeek account balance is insufficient. Top up and try again."));
      if (response.status === 429) throw new Error(tr("请求过于频繁或额度用尽，请稍后再试。", "Too many requests or quota exhausted. Try again later."));
      if (response.status >= 500) throw new Error(tr(`DeepSeek 服务暂时不可用：${detail}`, `DeepSeek is temporarily unavailable: ${detail}`));
      throw new Error(tr(`DeepSeek 请求失败：${detail}`, `DeepSeek request failed: ${detail}`));
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error(tr("DeepSeek 返回了空内容，请重试。", "DeepSeek returned an empty response. Try again."));
    return content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(options.signal?.aborted
        ? tr("请求已取消。", "Request cancelled.")
        : tr("请求超时，请检查网络后重试。", "The request timed out. Check your network and try again."));
    }
    if (error instanceof TypeError) {
      throw new Error(tr("无法连接 DeepSeek。请检查网络、Base URL 或浏览器跨域限制。", "Could not reach DeepSeek. Check the network, Base URL, or browser CORS settings."));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    if (options.signal && externalAbortHandler) {
      options.signal.removeEventListener("abort", externalAbortHandler);
    }
  }
}

function normalizeComparableAnswer(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function isExactReferenceMatch(answer, reference) {
  const normalizedAnswer = normalizeComparableAnswer(answer);
  const normalizedReference = normalizeComparableAnswer(reference);
  return Boolean(normalizedAnswer) && normalizedAnswer === normalizedReference;
}

function splitReferenceUnits(reference) {
  return String(reference || "")
    .split(/[;；]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toRubricUnit(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return clamp(number > 1 ? number / 100 : number, 0, 1);
}

function normalizeRelation(value) {
  const relation = String(value || "").trim().toLowerCase();
  const map = {
    exact: "exact", same: "exact", identical: "exact", equal: "exact", "完全一致": "exact", "一致": "exact",
    equivalent: "equivalent", synonym: "equivalent", paraphrase: "equivalent", "等价": "equivalent", "同义": "equivalent",
    partial: "partial", partly: "partial", incomplete: "partial", "部分": "partial",
    incorrect: "incorrect", wrong: "incorrect", unrelated: "incorrect", opposite: "incorrect", "错误": "incorrect", "不相关": "incorrect",
    blank: "blank", empty: "blank", missing: "blank", "空白": "blank",
  };
  if (map[relation]) return map[relation];
  if (/exact|identical|完全一致/.test(relation)) return "exact";
  if (/equivalent|paraphrase|synonym|等价|同义/.test(relation)) return "equivalent";
  if (/partial|partly|incomplete|部分/.test(relation)) return "partial";
  if (/incorrect|wrong|unrelated|opposite|错误/.test(relation)) return "incorrect";
  if (/blank|empty|missing|空白/.test(relation)) return "blank";
  return null;
}

function normalizeItemStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (["covered", "match", "matched", "full", "hit", "命中", "已覆盖"].includes(status)) return "covered";
  if (["partial", "partly", "half", "部分"].includes(status)) return "partial";
  if (["missing", "incorrect", "not_covered", "miss", "未命中", "缺失", "错误"].includes(status)) return "missing";
  return null;
}

function hasMeaningRubric(field) {
  return Boolean(field) && typeof field === "object" && toRubricUnit(field.coverage) !== null;
}

function resolveFieldFeedback(field) {
  return field && typeof field.feedback === "string" && field.feedback.trim()
    ? field.feedback.trim()
    : "";
}

function normalizeAiField(field) {
  if (!field || typeof field !== "object") return null;
  const coverage = toRubricUnit(field.coverage);
  if (coverage === null) return null;
  const precision = toRubricUnit(field.precision) ?? (coverage >= 0.85 ? 0.9 : 0.6);
  const expression = toRubricUnit(field.expression) ?? 0.75;
  let relation = normalizeRelation(field.relation);
  if (!relation) {
    relation = coverage >= 0.9 && precision >= 0.85
      ? "equivalent"
      : coverage >= 0.5
        ? "partial"
        : "incorrect";
  }
  return {
    feedback: resolveFieldFeedback(field),
    relation,
    coverage,
    precision,
    expression,
    rawItems: Array.isArray(field.items) ? field.items : [],
  };
}

function scoreMeaningRubric(aiField) {
  if (aiField.relation === "blank") return 0;
  const coverage = clamp(aiField.coverage, 0, 1);
  const precision = clamp(aiField.precision, 0, 1);
  const expression = clamp(aiField.expression, 0, 1);

  // Lenient, meaning-first rubric. Coverage dominates; grammar is only 5%.
  let score = Math.round(100 * (coverage * 0.75 + precision * 0.2 + expression * 0.05));

  if (aiField.relation === "exact") score = Math.max(score, 98);
  if (aiField.relation === "equivalent") {
    if (coverage >= 0.8 && precision >= 0.75) score = Math.max(score, 92);
    if (coverage >= 0.95 && precision >= 0.9) score = Math.max(score, 95);
  }
  if (aiField.relation === "partial") score = Math.min(score, 89);
  if (aiField.relation === "incorrect") score = Math.min(score, 39);

  return clamp(Math.round(score));
}

function buildReferenceItems(reference, aiField) {
  const units = splitReferenceUnits(reference);
  if (!units.length) return [];
  const aiItems = Array.isArray(aiField?.rawItems) ? aiField.rawItems : [];
  const fallbackStatus = aiField?.relation === "exact" || aiField?.relation === "equivalent"
    ? "covered"
    : aiField?.relation === "partial"
      ? "partial"
      : "missing";
  return units.map((unit, index) => {
    const aiItem = aiItems.find((item) => Number(item?.index) === index) || aiItems[index] || null;
    return {
      reference: unit,
      status: normalizeItemStatus(aiItem?.status) || fallbackStatus,
      note: typeof aiItem?.note === "string" ? aiItem.note.trim() : "",
    };
  });
}

function finalizeMeaningField(fieldName, rawField, word, answers) {
  const aiField = normalizeAiField(rawField);
  if (!aiField) return null;
  const reference = fieldName === "zh" ? word.zh : word.en;
  const answer = fieldName === "zh" ? answers.zh : answers.en;

  // A deterministic consistency guard. AI must still provide a complete review;
  // this only prevents a model from assigning a low score to a literal match.
  if (isExactReferenceMatch(answer, reference)) {
    return {
      score: 100,
      correct: true,
      feedback: tr("与参考答案完全一致，判定为完全掌握。", "Exactly matches the reference — full credit."),
      relation: "exact",
      items: splitReferenceUnits(reference).map((unit) => ({
        reference: unit,
        status: "covered",
        note: "",
      })),
    };
  }

  const score = scoreMeaningRubric(aiField);
  return {
    score,
    correct: score >= 85,
    feedback: aiField.feedback || tr(
      "AI 已按语义相似度完成逐条对照。",
      "AI completed an item-by-item semantic comparison."
    ),
    relation: aiField.relation,
    items: buildReferenceItems(reference, aiField),
  };
}

function normalizeAiPos(field) {
  if (!field || typeof field !== "object") return null;
  const relation = normalizeRelation(field.relation);
  let correct = typeof field.correct === "boolean" ? field.correct : relation === "exact";
  let score = correct ? 100 : Number.isFinite(Number(field.score)) ? clamp(Math.round(Number(field.score))) : 0;
  if (relation === "partial" && !correct) score = Math.max(score, 60);
  return {
    score,
    correct,
    feedback: resolveFieldFeedback(field) || tr("词性由 AI 对照词卡完成判定。", "AI compared your part of speech against the card."),
  };
}

async function getAiEvaluation(word, answers, config, signal) {
  const zhUnits = splitReferenceUnits(word.zh);
  const enUnits = splitReferenceUnits(word.en);
  const reference = {
    word: word.word,
    reference_source: word.referenceSource === "sample" ? "sample_wordbook" : "excel",
    part_of_speech: word.pos,
    chinese_source: word.zh,
    english_source: word.en,
    chinese_units: zhUnits,
    english_units: enUnits,
  };
  const student = {
    part_of_speech: answers.selectedPos,
    chinese: answers.zh,
    english: answers.en,
  };

  const outputLanguage = currentLanguage() === "en" ? "English" : "简体中文";
  const system = [
    "你是 Aster 词航的资深双语词汇教练。你的唯一任务是批改学生刚刚提交的答案，不替学生作答，也不生成新题。",
    "参考答案完全来自学生提供的 Excel / 词卡原始数据，不是由你生成。绝对禁止改写、补充、替换、翻译或新增参考答案。",
    "三个字段必须独立判断。一个字段的错误不得影响其他字段。",
    "",
    "本次采用【语义优先 + 宽松评分】。不要直接给最终分数，只输出语义证据；最终分数由应用根据覆盖率、准确度、表达质量计算。",
    "评分原则：",
    "1. 释义按意思判断，不按字面。同义词、近义改写、不同句型、轻微语法/拼写/用词问题，只要整体意思相同，都属于 equivalent，必须给高分。",
    "2. coverage：参考释义的必要语义单元被学生表达出来的比例，0–1。参考中用 or、斜杠、逗号并列的同义表达是替代关系，答出其中一种即可；不要把同一义项的不同表达当成多个必扣项。",
    "3. precision：是否没有相反、无关或明显错误的意思，0–1。语法、拼写、用词不标准不影响 precision。",
    "4. expression：语法、拼写和表达是否规范，0–1。它只占极小权重，语法差不能判成不懂词义。",
    "5. relation 只能是：exact / equivalent / partial / incorrect / blank。核心意思说对了但表达或个别细节不完美，应判 equivalent，不能判 partial。",
    "6. 宽松原则：优先看核心意思。漏掉次要义项或次要细节，只轻微降低 coverage（通常不超过 0.1）；不要因为用词不同、同义词数量少、或没有背出全部同义表达而大幅扣分。",
    "7. 逐条对照：中文和英文分别提供了从 Excel 原文切分出的 reference units。必须为每个 unit 返回一条 item；item 的 index 与输入一致，不得增加、删除或改写参考 unit。",
    "8. items 的 status 只能是 covered / partial / missing；note 用 1 句话说明学生答案与该条的对应关系。note 中不要生成新的“参考答案”，如需建议只能写“可选表达”，不能冒充原参考。",
    "9. 词性：只有学生选择的词性集合与参考集合完全一致才算正确 correct=true；多选或漏选算 false。",
    `10. 每一项 feedback、item.note、strengths、gaps 必须使用${outputLanguage}。feedback 简洁、具体，不写空洞评价。`,
    "11. 严格只输出 JSON，不要 markdown，不要额外文字。格式：",
    '{"pos":{"correct":true,"feedback":""},"zh":{"relation":"equivalent","coverage":0.95,"precision":1,"expression":0.9,"feedback":"","items":[{"index":0,"status":"covered","note":""}]},"en":{"relation":"equivalent","coverage":0.95,"precision":1,"expression":0.6,"feedback":"","items":[{"index":0,"status":"covered","note":""}]},"strengths":["最多3条"],"gaps":["最多3条"]}',
  ].join("\n");

  const userPrompt = [
    "参考词卡（判定依据，严禁改写或补充；reference units 必须逐条使用）：",
    JSON.stringify(reference),
    "",
    "学生答案：",
    JSON.stringify(student),
    "",
    "请依据“语义优先 + 宽松评分”规则输出语义证据 JSON。",
  ].join("\n");

  const content = await callDeepSeek(
    config,
    [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    { json: true, temperature: 0.1, maxTokens: 1700, signal }
  );
  const parsed = parseAiJson(content);
  const posUsable = Boolean(parsed?.pos && (
    typeof parsed.pos.correct === "boolean" ||
    normalizeRelation(parsed.pos.relation) ||
    Number.isFinite(Number(parsed.pos.score))
  ));
  const zhUsable = hasMeaningRubric(parsed?.zh);
  const enUsable = hasMeaningRubric(parsed?.en);
  if (!parsed || typeof parsed !== "object" || !posUsable || !zhUsable || !enUsable) {
    throw new Error(tr(
      "AI 返回的逐项批改数据不完整，请重试。所有评分均由 AI 完成，不使用本地替代分数。",
      "AI returned an incomplete item-by-item review. Try again. All scoring is done by AI; no local fallback score is used."
    ));
  }
  return parsed;
}

function mergeAiEvaluation(raw, word, answers, model) {
  const pos = normalizeAiPos(raw?.pos);
  const zh = finalizeMeaningField("zh", raw?.zh, word, answers);
  const en = finalizeMeaningField("en", raw?.en, word, answers);
  if (!pos || !zh || !en) {
    throw new Error(tr(
      "AI 返回的批改字段不完整，无法评分。请重试。",
      "The AI review is missing required fields, so it cannot be scored. Try again."
    ));
  }
  const overall = Math.round(pos.score * 0.2 + zh.score * 0.4 + en.score * 0.4);
  return {
    pos,
    zh,
    en,
    overall,
    strengths: normalizeStringArray(raw?.strengths),
    gaps: normalizeStringArray(raw?.gaps),
    source: "ai",
    model,
  };
}

/* ------------------------------------------------------------------ */
/* Import helpers                                                      */
/* ------------------------------------------------------------------ */

function normalizeHeaderCell(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").replace(/[（）()：:]/g, "");
}

function detectColumns(headerRow) {
  const headers = headerRow.map(normalizeHeaderCell);
  const used = new Set();
  function pick(patterns, excludes = []) {
    const index = headers.findIndex((header, i) => {
      if (!header || used.has(i)) return false;
      if (excludes.some((pattern) => pattern.test(header))) return false;
      return patterns.some((pattern) => pattern.test(header));
    });
    if (index >= 0) used.add(index);
    return index;
  }

  const word = pick([/英文单词/, /^单词$/, /word/, /vocabulary/, /lexeme/, /englishterm/]);
  const pos = pick([/词性/, /partofspeech/, /^pos$/, /词类/]);
  const en = pick([/英文解释/, /英文释义/, /englishdefinition/, /englishmeaning/, /definition/, /^英文$/], [/中文/]);
  const zh = pick([/中文解释/, /中文释义/, /chinese/, /^中文$/, /translation/, /释义/], [/英文/, /english/]);

  return {
    word: word >= 0 ? word : null,
    pos: pos >= 0 ? pos : null,
    en: en >= 0 ? en : null,
    zh: zh >= 0 ? zh : null,
  };
}

function parseSpreadsheet(buffer, fileName) {
  if (typeof XLSX === "undefined") {
    throw new Error(tr("Excel 解析组件尚未加载，请检查网络后刷新页面。", "The Excel parser has not loaded. Check your network and refresh the page."));
  }
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(tr("这个文件里没有可读取的工作表。", "This file has no readable worksheet."));
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  const rows = matrix.filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!rows.length) throw new Error(tr("工作表是空的。", "This worksheet is empty."));

  const first = rows[0];
  const columns = detectColumns(first);
  const recognizedHeaders = [columns.word, columns.pos, columns.en, columns.zh].filter((index) => index !== null).length;
  const hasHeaders = recognizedHeaders >= 2;
  let actual = columns;
  if (!hasHeaders) {
    actual = { word: 0, pos: 1, en: 2, zh: 3 };
  }
  if (actual.word === null) actual = { ...actual, word: 0 };

  const dataRows = hasHeaders ? rows.slice(1) : rows;
  const cards = [];
  const seen = new Set();
  let skipped = 0;

  dataRows.forEach((row, index) => {
    const rawWord = String(row[actual.word] ?? "").trim();
    if (!rawWord) {
      skipped += 1;
      return;
    }
    if (rawWord.length > 80) {
      skipped += 1;
      return;
    }
    const wordKey = normalizeWord(rawWord);
    if (!wordKey || seen.has(wordKey)) {
      skipped += 1;
      return;
    }
    seen.add(wordKey);

    const rawPos = actual.pos !== null ? String(row[actual.pos] ?? "").trim() : "";
    const en = actual.en !== null ? String(row[actual.en] ?? "").trim() : "";
    const zh = actual.zh !== null ? String(row[actual.zh] ?? "").trim() : "";
    const pos = normalizePos(rawPos);

    cards.push({
      id: uid("word"),
      word: rawWord,
      pos: pos.length ? pos : ["other"],
      rawPos,
      en,
      zh,
      referenceSource: "excel",
      memoryTip: "",
      tags: [],
      difficulty: 2,
      source: "import",
      sheet: sheetName,
      rowNumber: index + (hasHeaders ? 2 : 1),
    });
  });

  if (!cards.length) throw new Error(tr("没有找到有效单词。请确认第一列是英文单词，并至少有一行数据。", "No valid words found. Make sure the first column contains English words and there is at least one data row."));
  return {
    cards,
    fileName: fileName || "import",
    sheetName,
    totalRows: dataRows.length,
    skipped,
    hasHeaders,
  };
}

function makeCardFromAi(row, aiCard) {
  if (!aiCard || typeof aiCard !== "object") return { ...row };
  const aiPos = normalizePos(aiCard.pos);
  // Excel is the single source of truth for the learner-visible references.
  // AI enrichment may suggest metadata, but must never rewrite or supplement zh/en.
  const memoryTip = typeof aiCard.memoryTip === "string" ? aiCard.memoryTip.trim().slice(0, 120) : "";
  const tags = normalizeStringArray(aiCard.tags, 4);
  const difficulty = clamp(Number(aiCard.difficulty) || 2, 1, 3);
  return {
    ...row,
    pos: aiPos.length ? aiPos : row.pos,
    zh: row.zh,
    en: row.en,
    referenceSource: "excel",
    memoryTip,
    tags,
    difficulty: Math.round(difficulty),
    enriched: true,
  };
}

async function enrichCardsWithAI(rows, config, onProgress, signal) {
  const cards = rows.map((row) => ({ ...row }));
  const chunkSize = 12;
  let aiCount = 0;
  let failedChunks = 0;
  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }

  const outputLanguage = currentLanguage() === "en" ? "English" : "简体中文";
  const system = [
    "你是 Aster 词航的词卡编辑器。用户会提供从 Excel 导入的单词行，请逐条分析并整理成适合背诵的单词卡。",
    "规则：",
    "1. 参考答案完全来自用户的 Excel 原始内容。绝对禁止改写、补全、翻译、拼接或新增中文解释和英文解释；即使原表看起来截断或空白，也不得补写，只能在 memoryTip 中提供帮助。",
    "2. pos 只能从 noun, verb, adjective, adverb, preposition, conjunction, pronoun, other 中选择；根据原表词性，若原表缺失可推断常见词性。数组形式。",
    `3. memoryTip 用${outputLanguage}写一条简洁记忆钩子；不要编造词源，若没有可靠联想，就给语义提示。`,
    `4. tags 输出 2–3 个${outputLanguage}标签；difficulty 为 1–3 的整数。`,
    "严格只输出 JSON，不要 markdown。格式：",
    '{"cards":[{"index":0,"word":"...","pos":["noun"],"memoryTip":"...","tags":["..."],"difficulty":2}]}',
  ].join("\n");

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex];
    const payload = chunk.map((row, index) => ({
      index,
      word: row.word,
      pos: row.rawPos || row.pos,
      en: row.en,
      zh: row.zh,
    }));
    const prompt = [
      `本次批次共 ${chunk.length} 个单词：`,
      JSON.stringify(payload),
      "请严格输出 cards 数组，index 必须与输入对应。",
    ].join("\n");

    try {
      let parsed = null;
      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const content = await callDeepSeek(
            config,
            [
              { role: "system", content: system },
              {
                role: "user",
                content: attempt === 0
                  ? prompt
                  : `${prompt}\n上一次返回的 JSON 无法解析。请只输出合法 JSON 对象，不要代码块或说明文字。`,
              },
            ],
            { json: true, temperature: 0.25, maxTokens: 4000, timeoutMs: 90000, signal }
          );
          parsed = parseAiJson(content);
          break;
        } catch (error) {
          lastError = error;
          if (error.message === tr("请求已取消。", "Request cancelled.")) throw error;
        }
      }
      if (!parsed) throw lastError || new Error(tr("AI 未返回结果。", "AI did not return a result."));
      const aiCards = Array.isArray(parsed.cards) ? parsed.cards : Array.isArray(parsed.words) ? parsed.words : [];
      chunk.forEach((row, localIndex) => {
        const globalIndex = chunkIndex * chunkSize + localIndex;
        const aiCard =
          aiCards.find((item) => Number(item?.index) === localIndex) ||
          aiCards.find((item) => normalizeWord(item?.word) === normalizeWord(row.word)) ||
          aiCards[localIndex];
        if (aiCard) {
          cards[globalIndex] = makeCardFromAi(row, aiCard);
          aiCount += 1;
        }
      });
    } catch (error) {
      if (error.message === tr("请求已取消。", "Request cancelled.")) throw error;
      failedChunks += 1;
    }

    if (onProgress) onProgress(Math.min(rows.length, (chunkIndex + 1) * chunkSize), failedChunks);
  }

  return { cards, aiCount, failedChunks };
}

async function generateCoachNote(summary, words, attempts, config) {
  if (!summary.attemptedCount) throw new Error(tr("完成至少一次练习后才能生成 AI 诊断。", "Complete at least one practice round before generating an AI diagnosis."));
  const weakWords = [...summary.attempted]
    .sort((a, b) => (a.overall ?? 101) - (b.overall ?? 101))
    .slice(0, 8)
    .map((stat) => ({
      word: stat.word.word,
      overall: stat.overall,
      fields: stat.fields,
      attempts: stat.attempts,
    }));

  const snapshot = {
    total_words: summary.wordCount,
    practiced_words: summary.attemptedCount,
    attempts: summary.attemptCount,
    component_averages: summary.averages,
    weakest_field: summary.weakestField?.label || null,
    weakest_words: weakWords,
    recent_days: summary.byDay.slice(-7),
  };

  const outputLanguage = currentLanguage() === "en" ? "English" : "简体中文";
  const system = [
    `你是 Aster 词航的学习航医，用简洁、具体、不空洞的${outputLanguage}分析学生的词汇学习数据。`,
    "不要生成题目，不要讲空泛的鸡汤，不要编造数据。建议要可执行，指出该先练哪个词的哪个部分。",
    `headline、insight、priorities 和 plan 必须全部使用${outputLanguage}。`,
    "严格只输出 JSON，不要 markdown。格式：",
    '{"headline":"不超过14字","insight":"80-140字的诊断","priorities":["优先级1","优先级2","优先级3"],"plan":["未来3天行动1","行动2","行动3"]}',
  ].join("\n");

  const content = await callDeepSeek(
    config,
    [
      { role: "system", content: system },
      {
        role: "user",
        content: `以下是学习统计，请生成诊断：\n${JSON.stringify(snapshot)}\n只输出 JSON 对象。`,
      },
    ],
    { json: true, temperature: 0.35, maxTokens: 900, timeoutMs: 70000 }
  );
  const parsed = parseAiJson(content);
  const insight = typeof parsed.insight === "string" ? parsed.insight.trim().slice(0, 300) : "";
  const priorities = normalizeStringArray(parsed.priorities, 3);
  if (!insight && !priorities.length) {
    throw new Error(tr("AI 返回的诊断内容为空，请重试。", "AI returned an empty diagnosis. Try again."));
  }
  return {
    headline: typeof parsed.headline === "string" ? parsed.headline.slice(0, 40) : tr("你的学习航线", "Your learning orbit"),
    insight,
    priorities,
    plan: normalizeStringArray(parsed.plan, 3),
    createdAt: Date.now(),
    source: "ai",
    language: currentLanguage(),
    model: config.model,
  };
}

/* ------------------------------------------------------------------ */
/* Icons & primitives                                                  */
/* ------------------------------------------------------------------ */

function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };
  switch (name) {
    case "arrowUpRight":
      return <svg {...common}><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>;
    case "arrowLeft":
      return <svg {...common}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
    case "arrowRight":
      return <svg {...common}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
    case "arrowDown":
      return <svg {...common}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>;
    case "play":
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M6 4 20 12 6 20 6 4" /></svg>;
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.66 1.66 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.66 1.66 0 0 0-1.82-.33 1.66 1.66 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.66 1.66 0 0 0 9 19.4a1.66 1.66 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.66 1.66 0 0 0 4.6 15a1.66 1.66 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.66 1.66 0 0 0 4.6 9a1.66 1.66 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.66 1.66 0 0 0 9 4.6h.08A1.66 1.66 0 0 0 10.1 3V3a2 2 0 1 1 4 0v.09A1.66 1.66 0 0 0 15 4.6a1.66 1.66 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.66 1.66 0 0 0 19.4 9v.08A1.66 1.66 0 0 0 21 10.1h.09a2 2 0 1 1 0 4H21a1.66 1.66 0 0 0-1.51 1Z" />
        </svg>
      );
    case "x":
      return <svg {...common}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" /></svg>;
    case "download":
      return <svg {...common}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" /></svg>;
    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3-1.4 4.1a5 5 0 0 1-3.1 3.1L3.4 11.6l4.1 1.4a5 5 0 0 1 3.1 3.1L12 20.2l1.4-4.1a5 5 0 0 1 3.1-3.1l4.1-1.4-4.1-1.4a5 5 0 0 1-3.1-3.1L12 3Z" />
          <path d="M5 3v3" /><path d="M3.5 4.5h3" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>;
    case "chart":
      return <svg {...common}><path d="M3 3v18h18" /><path d="M7 16V11" /><path d="M12 16V7" /><path d="M17 16v-4" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "trash":
      return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>;
    case "volume":
      return (
        <svg {...common}>
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "chevronDown":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>;
    case "layers":
      return (
        <svg {...common}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
        </svg>
      );
    case "compass":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "globe":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></svg>;
    case "brain":
      return (
        <svg {...common}>
          <path d="M9.5 4.5A2.5 2.5 0 0 0 7 7v.5A2.5 2.5 0 0 0 4.5 10 2.5 2.5 0 0 0 6 12.3 2.5 2.5 0 0 0 5 17a3 3 0 0 0 4.5 2.6V4.5Z" />
          <path d="M14.5 4.5A2.5 2.5 0 0 1 17 7v.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-1.5 2.3A2.5 2.5 0 0 1 19 17a3 3 0 0 1-4.5 2.6V4.5Z" />
          <path d="M9.5 9H7" /><path d="M14.5 9H17" /><path d="M9.5 14H7" /><path d="M14.5 14H17" />
        </svg>
      );
    case "key":
      return <svg {...common}><circle cx="7.5" cy="15.5" r="4.5" /><path d="m11 12 9-9" /><path d="m17 6 2 2" /><path d="m14 9 2 2" /></svg>;
    case "eye":
      return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "eyeOff":
      return <svg {...common}><path d="m3 3 18 18" /><path d="M10.6 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.1 2.8" /><path d="M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>;
    case "external":
      return <svg {...common}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>;
    case "alert":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>;
    case "loader":
      return <svg {...common} className={`${className} animate-spin`}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>;
    case "orbit":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M20.5 8.5c1 1.7-2.6 5.6-8.5 8.6S1.1 20.6.5 18.7C-.1 16.8 3.5 13 9.4 10s10.5-3.2 11.1-1.5Z" />
          <path d="M3.5 15.5c-1-1.7 2.6-5.6 8.5-8.6S22.9 3.4 23.5 5.3c.6 1.9-3 5.7-8.9 8.7s-10.5 3.2-11.1 1.5Z" />
        </svg>
      );
    case "flame":
      return <svg {...common}><path d="M12 22c4 0 7-2.8 7-6.5 0-2.6-1.5-4.8-3.2-6.4-.8-.8-1.6-2-1.7-3.6-2.4 1.2-4 3.1-4 5.5 0 .9-.5 1.7-1.2 1.7-.9 0-1.3-1-1.3-2.2C6 10 5 12.5 5 15.5 5 19.2 8 22 12 22Z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function MaterialIcon({ path, className = "h-6 w-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function Logo() {
  return (
    <span className="quill block text-[31px] leading-none -translate-y-[1px]" aria-hidden="true">
      a
    </span>
  );
}

function Kicker({ children, className = "" }) {
  return <p className={`mono-label ${className}`}>{children}</p>;
}

function ScoreRing({ score, size = 84, label = true }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamp(score) / 100) * circumference;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2.5" />
        <circle
          cx="42" cy="42" r={radius} fill="none" stroke="#fff" strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="quill text-2xl leading-none">{score === null || score === undefined ? "—" : Math.round(score)}</span>
        {label && <span className="mt-1 text-[8px] tracking-[0.2em] text-white/45">{tr("得分", "SCORE")}</span>}
      </div>
    </div>
  );
}

function Meter({ value, className = "" }) {
  return (
    <div className={`bar-track ${className}`}>
      <div className="bar-fill" style={{ width: `${value === null || value === undefined ? 0 : clamp(value)}%` }} />
    </div>
  );
}

function EmptyOrbit({ title, body, action, actionLabel }) {
  return (
    <div className="liquid-glass flex min-h-[260px] flex-col items-center justify-center rounded-[1.4rem] px-6 py-12 text-center">
      <div className="liquid-glass mb-5 grid h-14 w-14 place-items-center rounded-full">
        <Icon name="orbit" className="h-6 w-6" />
      </div>
      <h3 className="quill text-3xl md:text-4xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-white/65">{body}</p>
      {action && (
        <button type="button" onClick={action} className={`${BTN_PRIMARY} mt-6`}>
          {actionLabel}
          <Icon name="arrowUpRight" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Motion primitives                                                   */
/* ------------------------------------------------------------------ */

function Reveal({ children, delay = 0, className = "", once = true, y = 20, amount = 0.15 }) {
  return (
    <motion.div
      className={className}
      initial={{ filter: "blur(10px)", opacity: 0, y }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {React.Children.toArray(children)}
    </motion.div>
  );
}

function FadingVideo({ src, className = "", style = {}, poster, ...rest }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const fadingOutRef = useRef(false);

  const fadeTo = useCallback((target, duration = 500) => {
    const video = videoRef.current;
    if (!video) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startOpacity = Number.isFinite(parseFloat(video.style.opacity)) ? parseFloat(video.style.opacity) : 1;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      video.style.opacity = String(startOpacity + (target - startOpacity) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onLoadedData = () => {
      video.style.opacity = "0";
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
      fadeTo(1);
    };
    const onTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || !Number.isFinite(video.currentTime)) return;
      const remaining = video.duration - video.currentTime;
      if (!fadingOutRef.current && remaining <= 0.55 && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };
    const onEnded = () => {
      video.style.opacity = "0";
      timerRef.current = setTimeout(() => {
        try {
          video.currentTime = 0;
        } catch (error) {
          // Some browsers disallow seeking while the stream is still loading.
        }
        const playPromise = video.play();
        if (playPromise?.catch) playPromise.catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1);
      }, 100);
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [fadeTo]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={style}
      poster={poster}
      muted
      playsInline
      preload="auto"
      loop={false}
      aria-hidden="true"
      {...rest}
    />
  );
}

function BlurText({ text, className = "", delayOffset = 0 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const words = String(text || "").split(" ").filter(Boolean);
  return (
    <span
      ref={ref}
      className={`flex flex-wrap justify-center ${className}`}
      style={{ rowGap: "0.1em" }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block"
          style={{ marginRight: "0.28em" }}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={inView ? {
            filter: ["blur(5px)", "blur(0px)"],
            opacity: [0.5, 1],
            y: [-5, 0],
          } : {}}
          transition={{
            duration: 0.7,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: (index * 100) / 1000 + delayOffset,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { id: "home", zh: "首页", en: "Home" },
  { id: "library", zh: "词库", en: "Lexicon" },
  { id: "study", zh: "学习", en: "Study" },
  { id: "insights", zh: "分析", en: "Insights" },
];

function Navbar({ view, onNavigate, onImport, onBegin, openImport = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (id) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <button
          type="button"
          aria-label={tr("Aster 词航首页", "Aster home")}
          onClick={() => go("home")}
          className="liquid-glass grid h-12 w-12 shrink-0 place-items-center rounded-full text-white"
        >
          <Logo />
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <nav className="liquid-glass flex items-center rounded-full px-1.5 py-1.5" aria-label={tr("主导航", "Primary navigation")}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={view === item.id ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium font-body transition-colors duration-200 ${
                  view === item.id ? "bg-white/[0.14] text-white" : "text-white/90 hover:bg-white/[0.09]"
                }`}
              >
                {tr(item.zh, item.en)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onImport();
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium font-body transition-colors duration-200 ${
                openImport ? "bg-white/[0.14] text-white" : "text-white/90 hover:bg-white/[0.09]"
              }`}
            >
              {tr("导入", "Import")}
            </button>
          </nav>
          <button type="button" onClick={onBegin} className="whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90">
            {tr("开启学习航程", "Start a Voyage")}
            <Icon name="arrowUpRight" className="ml-1 inline h-4 w-4 align-[-2px]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? tr("关闭菜单", "Close menu") : tr("打开菜单", "Open menu")}
          className="liquid-glass grid h-12 w-12 place-items-center rounded-full text-white lg:hidden"
        >
          <Icon name={mobileOpen ? "x" : "menu"} className="h-5 w-5" />
        </button>

        <div className="hidden h-12 w-12 shrink-0 lg:block" aria-hidden="true" />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="liquid-glass-strong mx-auto mt-3 max-w-[1600px] rounded-[1.25rem] p-2 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`rounded-full px-4 py-3 text-left text-sm ${
                    view === item.id ? "bg-white/[0.14] text-white" : "text-white/85"
                  }`}
                >
                  {tr(item.zh, item.en)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onImport();
                }}
                className="rounded-full px-4 py-3 text-left text-sm text-white/85"
              >
                {tr("导入", "Import")}
              </button>
            </div>
            <div className="mx-2 my-2 h-px bg-white/10" />
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBegin();
              }}
              className="flex w-full items-center justify-between rounded-full bg-white px-4 py-3 text-sm font-medium text-black"
            >
              {tr("开启学习航程", "Start a Voyage")}
              <Icon name="arrowUpRight" className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function SettingsFab({ configured, onClick }) {
  return (
    <div className="fixed bottom-5 left-5 z-[60] sm:bottom-6 sm:left-6">
      <button
        type="button"
        onClick={onClick}
        aria-label={tr("打开设置", "Open settings")}
        title={tr("设置", "Settings")}
        className="liquid-glass-strong group relative grid h-12 w-12 place-items-center rounded-full text-white transition-transform duration-300 hover:rotate-45 hover:scale-105"
      >
        <Icon name="settings" className="h-[19px] w-[19px]" />
        <span
          className={`absolute right-0.5 top-0.5 h-2 w-2 rounded-full border border-black/40 ${
            configured ? "bg-white" : "bg-white/25"
          }`}
          aria-hidden="true"
        />
      </button>
      <span className="liquid-glass pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] text-white/85 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
        {tr("设置", "Settings")} · {configured ? tr("DeepSeek 已就绪", "DeepSeek ready") : tr("尚未接入", "Not connected")}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

const CAPABILITY_CARDS = [
  {
    id: "review",
    tags: [["DeepSeek", "DeepSeek"], ["语义宽容", "Semantic tolerance"], ["逐项评分", "Field scoring"], ["不直接给答案", "No answer reveal"]],
    title: ["语义批改", "Semantic review"],
    body: ["AI 对照词卡理解你的中文与英文表达，容忍同义改写，指出遗漏的义项与错误词性。它只批改，不替你作答。", "AI reads your Chinese and English answers against the card, accepts paraphrases, and points to missing senses or wrong parts of speech. It marks — never answers for you."],
    iconPath: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z",
    action: "study",
  },
  {
    id: "import",
    tags: [["Excel", "Excel"], ["AI 解析", "AI parsing"], ["词性归一", "POS normalization"], ["批量生成", "Batch cards"]],
    title: ["智能词卡", "Word intake"],
    body: ["拖入 Excel 词表，Aster 自动识别列、去重并生成词卡。连接 DeepSeek 后，它会补全记忆钩子、标签与难度。", "Drop in an Excel lexicon. Aster detects columns, removes duplicates, and builds cards. With DeepSeek connected, it adds memory hooks, tags, and difficulty."],
    iconPath: "M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z",
    action: "import",
  },
  {
    id: "insights",
    tags: [["词性", "POS"], ["英文释义", "English"], ["中文释义", "Chinese"], ["逐词诊断", "Per-word"]],
    title: ["掌握星图", "Mastery star map"],
    body: ["把每一次练习拆成词性、中文、英文三条轨道，定位每个词最薄弱的那个部分，再用趋势和热力图看见改变。", "Every attempt splits into three orbits: part of speech, Chinese, and English. Find the softest link for every word, then watch trends and heatmaps change."],
    iconPath: "M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z",
    action: "insights",
  },
];

function HomePage({ summary, onBeginStudy, onImport, onNavigate }) {
  const statOne = String(summary.wordCount).padStart(2, "0");
  const statTwo = summary.overall === null ? "—" : `${summary.overall}%`;

  return (
    <div>
      <section id="home" className="relative min-h-screen overflow-hidden bg-black">
        <FadingVideo
          src={HERO_VIDEO}
          className="absolute left-1/2 top-0 z-0 -translate-x-1/2 object-cover object-top"
          style={{ width: "120%", height: "120%" }}
        />
        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-28 sm:pt-32">
            <Reveal delay={0.4}>
              <div className="liquid-glass flex items-center gap-3 rounded-full py-1 pl-1 pr-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">{tr("全新", "New")}</span>
                <span className="text-xs text-white/90 sm:text-sm">{tr("AI 语义批改 · DeepSeek 驱动", "AI semantic review · DeepSeek powered")}</span>
              </div>
            </Reveal>

            <h1 className="hero-title mt-7 max-w-[960px] text-center font-heading text-6xl italic leading-[0.82] tracking-[-4px] text-white sm:text-7xl lg:text-[5.5rem]">
              <span className="block">
                <BlurText text={tr("读懂每个词", "Learn Every Word")} />
              </span>
              <span className="mt-2 block">
                <BlurText text={tr("跨越宇宙", "Across the Universe")} delayOffset={0.3} />
              </span>
            </h1>

            <Reveal delay={0.8} className="mt-6 w-full">
              <p className="hero-copy mx-auto max-w-2xl text-center text-sm font-light leading-relaxed text-white sm:text-base">
                {tr(
                  "把单词送进轨道。导入 Excel，生成属于你的词卡；用按键选择词性，写下中英释义，让 AI 读懂你的答案。每一次练习，都会成为航图上的一点星光。",
                  "Put every word into orbit. Import an Excel lexicon, build your own cards, choose a part of speech with your keyboard, and write both meanings. AI reads your answers. Every attempt becomes a point of light on your star map."
                )}
              </p>
            </Reveal>

            <Reveal delay={1.1} className="mt-6">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                <button
                  type="button"
                  onClick={onBeginStudy}
                  className="liquid-glass-strong inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.16]"
                >
                  {tr("开启学习航程", "Start Your Voyage")}
                  <Icon name="arrowUpRight" className="h-5 w-5" />
                </button>
                <button type="button" onClick={onImport} className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-white transition-opacity hover:opacity-75">
                  {tr("导入词库", "Import Lexicon")}
                  <span className="liquid-glass grid h-8 w-8 place-items-center rounded-full">
                    <Icon name="upload" className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </Reveal>

            <Reveal delay={1.3} className="mt-8 w-full">
              <div className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                <div className="liquid-glass w-[calc(50%-6px)] max-w-[220px] min-w-[155px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
                  <Icon name="book" className="h-7 w-7 text-white" />
                  <div className="mt-5 font-heading text-4xl italic leading-none tracking-[-1px] text-white">
                    {statOne}
                  </div>
                  <p className="mt-2 text-[11px] font-light leading-snug text-white/80">{tr("词卡已就绪", "Words ready")}</p>
                </div>
                <div className="liquid-glass w-[calc(50%-6px)] max-w-[220px] min-w-[155px] rounded-[1.25rem] p-4 text-left sm:w-[220px] sm:p-5">
                  <Icon name="target" className="h-7 w-7 text-white" />
                  <div className="mt-5 font-heading text-4xl italic leading-none tracking-[-1px] text-white">
                    {statTwo}
                  </div>
                  <p className="mt-2 text-[11px] font-light leading-snug text-white/80">{tr("平均掌握度", "Fleet mastery")}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={1.4} className="px-4">
            <div className="flex flex-col items-center gap-4 pb-8">
              <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
                {tr("与 DeepSeek AI 和现代 Web 技术共同驱动", "Built with DeepSeek AI and modern web craft")}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 sm:gap-x-8 sm:px-20 md:px-24">
                {["DeepSeek", "SheetJS", "Motion", "React", "Local-first"].map((name, index) => (
                  <React.Fragment key={name}>
                    {index > 0 && <span className="font-heading text-lg italic text-white/50">·</span>}
                    <span className="hero-partner-name font-heading text-2xl italic tracking-tight text-white md:text-3xl">
                      {name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="capabilities" className="relative min-h-screen overflow-hidden bg-black">
        <FadingVideo
          src={CAPABILITIES_VIDEO}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="relative z-10 flex min-h-screen flex-col px-5 pb-10 pt-24 sm:px-8 md:px-16 lg:px-20">
          <div className="mb-auto">
            <Reveal>
              <Kicker>{tr("// 核心能力", "// Capabilities")}</Kicker>
              <h2 className="mt-5 font-heading text-6xl italic leading-[0.86] tracking-[-3px] text-white md:text-7xl lg:text-[6rem]">
                {tr("学习，", "Learning,")}
                <br />
                {tr("进化", "evolved")}
              </h2>
            </Reveal>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {CAPABILITY_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={0.15 + index * 0.12} amount={0.1}>
                <button
                  type="button"
                  onClick={() => {
                    if (card.action === "import") onImport();
                    else if (card.action === "study") onBeginStudy();
                    else onNavigate("insights");
                  }}
                  className="liquid-glass flex min-h-[360px] w-full flex-col rounded-[1.25rem] p-6 text-left text-white transition-colors duration-300 hover:bg-white/[0.12]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="liquid-glass grid h-11 w-11 shrink-0 place-items-center rounded-[0.75rem]">
                      <MaterialIcon path={card.iconPath} className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
                      {card.tags.map(([zh, en], tagIndex) => (
                        <span key={`${zh}-${tagIndex}`} className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] text-white/90">
                          {tr(zh, en)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="mt-6">
                    <h3 className="font-heading text-3xl italic leading-none tracking-[-1px] text-white md:text-4xl">
                      {tr(card.title[0], card.title[1])}
                    </h3>
                    <p className="mt-3 max-w-[32ch] font-body text-sm font-light leading-snug text-white/90">
                      {tr(card.body[0], card.body[1])}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/65">
                      {tr("打开模块", "Open module")}
                      <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
