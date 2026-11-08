/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

function MasteryBadge({ score }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full ${score === null ? "bg-white/25" : "bg-white"}`} />
      {masteryBandLabel(score)}
    </span>
  );
}

function WordCard({ word, mastery, pendingDelete, onRequestDelete, onCancelDelete, onDelete, onPractice }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="liquid-glass group relative flex flex-col rounded-[1.35rem] p-5 transition-colors duration-300 hover:bg-white/[0.12]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MasteryBadge score={mastery.overall} />
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/30">
              {word.source === "ai" ? tr("AI 词卡", "AI card") : word.source === "import" ? tr("导入", "Imported") : tr("示例", "Sample")}
            </span>
          </div>
          <h3 className="word-break mt-4 font-heading text-4xl italic leading-none tracking-[-1.5px] text-white">
            {word.word}
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {word.pos.map((pos) => (
              <span key={pos} className="liquid-glass rounded-full px-2.5 py-1 text-[10px] text-white/70">
                {posLabel(pos)}
              </span>
            ))}
          </div>
        </div>
        <ScoreRing score={mastery.overall} size={68} label={false} />
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">{tr("中文释义", "Chinese")}</p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/75">{word.zh || "—"}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">{tr("英文释义", "English")}</p>
          <p className="mt-1 line-clamp-2 text-[12px] font-light leading-relaxed text-white/60">{word.en || "—"}</p>
        </div>
      </div>

      {wordTags(word).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {wordTags(word).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-white/12 px-2 py-1 text-[9px] text-white/40">{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
        <span className="text-[10px] text-white/35">
          {mastery.attempts
            ? tr(`${mastery.attempts} 次练习 · 上次 ${formatDate(mastery.lastAt)}`, `${mastery.attempts} ${mastery.attempts === 1 ? "attempt" : "attempts"} · ${formatDate(mastery.lastAt)}`)
            : tr("尚未练习", "Not practised yet")}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPractice(word)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-medium text-black transition-colors hover:bg-white/90"
          >
            {tr("练习", "Practise")}
            <Icon name="arrowUpRight" className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(word.id)}
            aria-label={tr(`删除 ${word.word}`, `Delete ${word.word}`)}
            className="grid h-8 w-8 place-items-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[1.35rem] bg-black/80 p-6 text-center backdrop-blur-md"
          >
            <p className="font-heading text-2xl italic">{tr("删除这张词卡？", "Delete this card?")}</p>
            <p className="mt-2 max-w-[28ch] text-[11px] leading-relaxed text-white/55">{tr("该词的历史练习记录也会一并清除，无法恢复。", "Its practice history will also be removed. This cannot be undone.")}</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onCancelDelete} className={`${BTN_GLASS} px-4 py-2 text-xs`}>{tr("取消", "Cancel")}</button>
              <button type="button" onClick={() => onDelete(word.id)} className="rounded-full bg-white px-4 py-2 text-xs font-medium text-black">{tr("确认删除", "Delete")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function LibraryPage({ words, summary, onPracticeWord, onStartStudy, onImport, onDeleteWord, toast }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return summary.stats
      .filter(({ word, overall, attempts }) => {
        if (normalizedQuery) {
          const haystack = `${word.word} ${word.zh} ${word.en} ${(word.tags || []).join(" ")}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) return false;
        }
        if (filter === "weak") return attempts > 0 && overall < 70;
        if (filter === "stable") return attempts > 0 && overall >= 70;
        if (filter === "new") return attempts === 0;
        return true;
      })
      .sort((a, b) => {
        if (a.attempts === 0 && b.attempts === 0) return a.word.word.localeCompare(b.word.word);
        if (a.attempts === 0) return 1;
        if (b.attempts === 0) return -1;
        return (a.overall ?? 101) - (b.overall ?? 101);
      });
  }, [summary.stats, query, filter]);

  const handleDelete = (wordId) => {
    onDeleteWord(wordId);
    setPendingDelete(null);
    toast(tr("词卡已从词库移除。", "The card has been removed from your lexicon."), "info");
  };

  return (
    <main className="relative z-10 min-h-screen px-4 pb-24 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <Reveal>
            <Kicker>{tr("// 词库档案", "// Word archive")}</Kicker>
            <h1 className="mt-4 font-heading text-6xl italic leading-[0.88] tracking-[-3px] text-white sm:text-7xl">
              {tr("你的词库，", "Your lexicon,")}
              <br />
              {tr("已经入轨。", "in orbit.")}
            </h1>
            <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/60">
              {tr(`${words.length} 张词卡，${summary.attemptedCount} 张已有练习轨迹。薄弱词会优先浮到前面。`, `${words.length} cards, ${summary.attemptedCount} with practice history. Weak words rise to the top.`)}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onStartStudy} className={BTN_PRIMARY}>
              {tr("开始今日航程", "Begin today's voyage")}
              <Icon name="arrowUpRight" className="h-4 w-4" />
            </button>
            <button type="button" onClick={onImport} className={BTN_GLASS}>
              <Icon name="upload" className="h-4 w-4" />
              {tr("导入 Excel", "Import Excel")}
            </button>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mt-8">
          <div className="liquid-glass flex flex-col gap-3 rounded-[1.25rem] p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr("搜索单词、释义或标签…", "Search words, meanings, or tags…")}
                aria-label={tr("搜索词库", "Search the lexicon")}
                className="field-input w-full py-2.5 pl-10 pr-4 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "all", label: tr("全部", "All"), count: words.length },
                { id: "weak", label: tr("待强化", "Needs work"), count: summary.attempted.filter((stat) => stat.overall < 70).length },
                { id: "stable", label: tr("已稳定", "Stable"), count: summary.attempted.filter((stat) => stat.overall >= 70).length },
                { id: "new", label: tr("未学习", "New"), count: summary.wordCount - summary.attemptedCount },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-3 py-2 text-[11px] transition-colors ${
                    filter === item.id ? "bg-white text-black" : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span className={`ml-1.5 ${filter === item.id ? "text-black/45" : "text-white/25"}`}>{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {filtered.length ? (
          <motion.div layout className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {filtered.map(({ word, ...mastery }) => (
                <WordCard
                  key={word.id}
                  word={word}
                  mastery={mastery}
                  pendingDelete={pendingDelete === word.id}
                  onRequestDelete={setPendingDelete}
                  onCancelDelete={() => setPendingDelete(null)}
                  onDelete={handleDelete}
                  onPractice={onPracticeWord}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-4">
            <EmptyOrbit
              title={query ? tr("没有找到匹配的词。", "No signal found.") : tr("这片轨道很安静。", "A quiet orbit.")}
              body={query ? tr("没有匹配当前搜索与筛选条件的词卡。试试更短的关键词。", "No cards match this search and filter. Try a shorter keyword.") : tr("这个筛选条件下还没有词卡。导入新词或切换筛选条件。", "There are no cards in this filter yet. Import new words or change the filter.")}
              action={query ? () => { setQuery(""); setFilter("all"); } : onImport}
              actionLabel={query ? tr("清空筛选", "Clear filters") : tr("导入词表", "Import a lexicon")}
            />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
          <span>{tr("点击「练习」只会开启该词的单词航段。", "Practise opens a single-word orbit.")}</span>
          <span>{tr("所有词卡与学习记录保存在当前浏览器。", "All cards and practice records stay in this browser.")}</span>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Insights · charts                                                   */
/* ------------------------------------------------------------------ */

function MasteryRadar({ averages }) {
  const size = 340;
  const height = 300;
  const cx = 170;
  const cy = 148;
  const radius = 92;
  const fields = ["pos", "zh", "en"];
  const angles = [-90, 30, 150].map((degree) => (degree * Math.PI) / 180);
  const pointAt = (angle, distance) => ({
    x: cx + Math.cos(angle) * distance,
    y: cy + Math.sin(angle) * distance,
  });
  const rings = [0.25, 0.5, 0.75, 1];
  const hasData = fields.some((field) => typeof averages[field] === "number");
  const points = fields.map((field, index) => {
    const score = typeof averages[field] === "number" ? clamp(averages[field]) : 0;
    return pointAt(angles[index], (score / 100) * radius);
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const labels = [
    { field: "pos", title: fieldLabel("pos"), anchor: "middle", yOffset: -26 },
    { field: "zh", title: fieldLabel("zh"), anchor: "middle", yOffset: 26 },
    { field: "en", title: fieldLabel("en"), anchor: "middle", yOffset: 26 },
  ];
  const labelPositions = angles.map((angle, index) => {
    const point = pointAt(angle, radius + 31);
    return { ...labels[index], x: point.x, y: point.y + labels[index].yOffset };
  });

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${size} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={tr("词性、中文释义、英文释义三维掌握雷达图", "Three-axis mastery radar for part of speech, Chinese, and English")}>
        {rings.map((ring) => {
          const ringPoints = angles.map((angle) => {
            const point = pointAt(angle, radius * ring);
            return `${point.x},${point.y}`;
          }).join(" ");
          return <polygon key={ring} points={ringPoints} fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="0.8" />;
        })}
        {angles.map((angle, index) => {
          const point = pointAt(angle, radius);
          return (
            <line
              key={`axis-${index}`}
              x1={cx}
              y1={cy}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,.12)"
              strokeWidth="0.8"
            />
          );
        })}
        {hasData && (
          <motion.polygon
            points={polygon}
            fill="rgba(255,255,255,.13)"
            stroke="rgba(255,255,255,.82)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
        {hasData && points.map((point, index) => (
          <circle key={`dot-${index}`} cx={point.x} cy={point.y} r="2.7" fill="#fff" />
        ))}
        <circle cx={cx} cy={cy} r="2.2" fill="rgba(255,255,255,.8)" />
        {labelPositions.map((label) => (
          <g key={label.field}>
            <text x={label.x} y={label.y} textAnchor="middle" fill="rgba(255,255,255,.82)" fontSize="11" fontFamily="Barlow, sans-serif">
              {label.title}
            </text>
            <text x={label.x} y={label.y + 15} textAnchor="middle" fill="rgba(255,255,255,.42)" fontSize="9" fontFamily="Barlow, sans-serif" letterSpacing="1.4">
              {typeof averages[label.field] === "number" ? `${averages[label.field]}%` : "—"}
            </text>
          </g>
        ))}
      </svg>
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-10">
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-white/40">{tr("完成首轮练习后点亮星图", "Complete your first round to light the map")}</span>
        </div>
      )}
    </div>
  );
}

function TrendChart({ byDay }) {
  const points = byDay.slice(-12);
  if (!points.length) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <p className="text-[11px] text-white/35">{tr("完成练习后，这里会出现你的每日轨迹。", "Your daily trail appears here after practice.")}</p>
      </div>
    );
  }
  const width = 520;
  const height = 190;
  const pad = { left: 28, right: 12, top: 16, bottom: 34 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const yFor = (value) => pad.top + ((100 - value) / 100) * plotHeight;
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(2)} ${yFor(point.average).toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${xFor(points.length - 1).toFixed(2)} ${yFor(0).toFixed(2)} L${xFor(0).toFixed(2)} ${yFor(0).toFixed(2)} Z`;
  const grid = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={tr("每日平均掌握度趋势", "Daily average mastery trend")}>
      {grid.map((value) => (
        <g key={value}>
          <line x1={pad.left} x2={width - pad.right} y1={yFor(value)} y2={yFor(value)} stroke="rgba(255,255,255,.09)" strokeWidth="0.8" />
          <text x={pad.left - 9} y={yFor(value) + 3} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize="8" fontFamily="Barlow, sans-serif">
            {value}
          </text>
        </g>
      ))}
      <motion.path
        d={areaPath}
        fill="rgba(255,255,255,.05)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {points.map((point, index) => (
        <g key={`${point.key}-${index}`}>
          <circle cx={xFor(index)} cy={yFor(point.average)} r="2.5" fill="#000" stroke="#fff" strokeWidth="1.2" />
          {(index === 0 || index === points.length - 1 || points.length <= 5) && (
            <text x={xFor(index)} y={height - 12} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fill="rgba(255,255,255,.34)" fontSize="8" fontFamily="Barlow, sans-serif">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function ScoreHeatCell({ field, score }) {
  if (score === null || score === undefined) {
    return (
      <div className="flex min-h-[38px] items-center justify-between gap-2 rounded-[0.65rem] border border-dashed border-white/12 px-2.5 py-2">
        <span className="text-[10px] text-white/25">{tr("未测", "Untested")}</span>
      </div>
    );
  }
  return (
    <div className="flex min-h-[38px] items-center gap-2 rounded-[0.65rem] border border-white/10 bg-white/[0.035] px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[12px] tabular-nums ${getScoreTone(score)}`}>{score}</span>
          {score < 65 && <span className="text-[8px] uppercase tracking-[0.1em] text-white/40">{tr("重点", "focus")}</span>}
        </div>
        <Meter value={score} className="mt-1.5 !h-[3px]" />
      </div>
    </div>
  );
}

function WordHeatmap({ summary, onPracticeWord }) {
  const [showUnpracticed, setShowUnpracticed] = useState(false);
  const stats = [...summary.stats]
    .filter((stat) => showUnpracticed || stat.attempts > 0)
    .sort((a, b) => {
      if (a.attempts === 0 && b.attempts > 0) return 1;
      if (b.attempts === 0 && a.attempts > 0) return -1;
      return (a.overall ?? 101) - (b.overall ?? 101);
    });

  return (
    <div className="liquid-glass-strong rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Kicker>{tr("// 词级数据", "// Word-level telemetry")}</Kicker>
          <h2 className="mt-3 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("薄弱点在哪里。", "Where the leak is.")}</h2>
          <p className="mt-2 max-w-xl text-[12px] font-light leading-relaxed text-white/50">
            {tr("每个词的词性、中文释义与英文释义分别计分，低分格会自动标记为下一轮重点。", "Every word is scored separately for part of speech, Chinese, and English. Low cells are flagged for the next orbit.")}
          </p>
          <p className="mt-2 text-[9px] text-white/30 sm:hidden">{tr("左右滑动查看完整热力图 →", "Swipe to see the full heatmap →")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUnpracticed((current) => !current)}
          className="rounded-full border border-white/15 px-3 py-2 text-[10px] text-white/55 transition-colors hover:border-white/30 hover:text-white"
        >
          {showUnpracticed ? tr("只看已练习", "Practised only") : tr("同时显示未练习", "Include unpractised")}
        </button>
      </div>

      {stats.length ? (
        <div className="mt-5 overflow-x-auto hide-scrollbar">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.2fr_74px_1fr_1fr_1fr_66px] items-center gap-2 border-b border-white/10 px-2 pb-2">
              <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">{tr("单词", "Word")}</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">{tr("综合", "Total")}</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">{fieldLabel("pos")}</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">{fieldLabel("zh")}</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-white/35">{fieldLabel("en")}</span>
              <span />
            </div>
            <motion.div layout className="divide-y divide-white/[0.07]">
              {stats.map(({ word, fields, overall, attempts }) => (
                <div key={word.id} className="grid grid-cols-[1.2fr_74px_1fr_1fr_1fr_66px] items-center gap-2 px-2 py-[9px]">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xl italic leading-none text-white/90">{word.word}</p>
                    <p className="mt-1 truncate text-[9px] text-white/25">{attempts ? tr(`${attempts} 次练习`, `${attempts} ${attempts === 1 ? "attempt" : "attempts"}`) : tr("未练习", "Not practised")}</p>
                  </div>
                  <div>
                    <p className={`text-[12px] tabular-nums ${getScoreTone(overall)}`}>{overall ?? "—"}</p>
                    <Meter value={overall} className="mt-1.5 !h-[3px]" />
                  </div>
                  <ScoreHeatCell field="pos" score={fields.pos} />
                  <ScoreHeatCell field="zh" score={fields.zh} />
                  <ScoreHeatCell field="en" score={fields.en} />
                  <button
                    type="button"
                    onClick={() => onPracticeWord(word)}
                    className="justify-self-end rounded-full border border-white/15 px-2.5 py-1.5 text-[10px] text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {tr("重练", "Review")}
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[1rem] border border-dashed border-white/15 px-5 py-10 text-center">
          <p className="font-heading text-2xl italic text-white/65">{tr("还没有数据。", "No telemetry yet.")}</p>
          <p className="mt-2 text-[11px] text-white/40">{tr("完成一次练习后，这个词级热力图会点亮。", "The word-level heatmap lights up after your first attempt.")}</p>
        </div>
      )}
    </div>
  );
}

function buildLocalBriefing(summary) {
  if (!summary.attemptedCount) {
    return {
      headline: tr("等待第一条轨迹", "Waiting for a first trace"),
      insight: tr("目前还没有练习数据。先完成一轮词性、中文释义与英文释义的作答，诊断系统才能定位你的薄弱轨道。", "There is no practice data yet. Complete one round of part-of-speech, Chinese, and English answers so the diagnostic system can locate your weaker orbits."),
      priorities: [tr("完成首轮练习", "Complete a first round"), tr("观察三项分数字", "Watch the three field scores")],
      plan: [tr("先做 5 个词", "Start with five words"), tr("提交后查看词级热力图", "Check the word heatmap after submitting")],
      isLocal: true,
    };
  }
  const weakestField = summary.weakestField;
  const weakestWord = summary.weakestWord;
  const fieldName = weakestField?.label || fieldLabel("en");
  const targetWord = weakestWord?.word?.word || tr("当前词卡", "the current card");
  const targetField = weakestWord?.fields
    ? Object.entries(weakestWord.fields).filter(([, value]) => typeof value === "number").sort((a, b) => a[1] - b[1])[0]
    : null;
  const targetFieldLabel = targetField ? fieldLabel(targetField[0]) : fieldName;
  const targetScore = targetField ? targetField[1] : null;
  return {
    headline: tr(`${fieldName}是当前最弱轨道`, `${fieldName} is the weakest orbit`),
    insight: tr(
      `你的综合掌握度为 ${summary.overall}%。在已练习的 ${summary.attemptedCount} 个词中，${targetWord} 的${targetFieldLabel}${targetScore !== null ? `只有 ${targetScore}%` : "表现最不稳定"}。先把“${targetWord}”拆成词性、中文义项和英文核心概念重新写一遍，再进入下一轮。`,
      `Your overall mastery is ${summary.overall}%. Among ${summary.attemptedCount} practiced words, ${targetWord} is weakest on ${targetFieldLabel}${targetScore !== null ? ` at ${targetScore}%` : ""}. Rewrite ${targetWord} in three parts — part of speech, Chinese senses, and the core English concept — before the next round.`
    ),
    priorities: [
      tr(`优先重练 ${targetWord}`, `Review ${targetWord} first`),
      tr(`补全${targetFieldLabel}`, `Complete ${targetFieldLabel}`),
      tr("用英文复述核心义项", "Restate the core meaning in English"),
    ],
    plan: [
      tr("先复习 3 张最低分词卡", "Review the three lowest-scoring cards"),
      tr("每张词卡闭卷写完整释义", "Write each definition closed-book"),
      tr("用 AI 批改后再进入新词", "Use AI review before moving to new words"),
    ],
    isLocal: true,
  };
}

function AiCoachCard({ summary, coachNote, onGenerateCoach, coachBusy, aiConfigured, onOpenSettings }) {
  const local = buildLocalBriefing(summary);
  const noteLanguage = coachNote?.language || "zh";
  const matchingAiNote = coachNote && coachNote.source === "ai" && noteLanguage === currentLanguage() ? coachNote : null;
  const note = matchingAiNote || local;
  const isAi = Boolean(matchingAiNote);

  return (
    <div className="liquid-glass-strong flex h-full flex-col rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Kicker>{tr("// AI 学习诊断", "// AI flight briefing")}</Kicker>
          <h2 className="mt-3 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("下一处修正。", "The next correction.")}</h2>
        </div>
        <div className="liquid-glass grid h-10 w-10 shrink-0 place-items-center rounded-full">
          <Icon name="sparkles" className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-white/45">
            {isAi ? tr("DeepSeek 诊断", "DeepSeek diagnosis") : tr("本地诊断", "Local diagnosis")}
          </span>
          {isAi && (
            <span className="text-[9px] text-white/30">{formatDate(note.createdAt)}</span>
          )}
        </div>
        <h3 className="mt-4 font-heading text-2xl italic leading-tight text-white">{note.headline}</h3>
        <p className="mt-3 text-[12px] font-light leading-relaxed text-white/60">{note.insight}</p>

        <div className="mt-5 space-y-2">
          {(note.priorities || []).map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-[0.9rem] border border-white/10 bg-white/[0.035] px-3 py-2.5">
              <span className="mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full border border-white/20 text-[8px] text-white/55">{index + 1}</span>
              <p className="text-[11px] leading-relaxed text-white/75">{item}</p>
            </div>
          ))}
        </div>

        {note.plan?.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mono-label">{tr("建议顺序", "Suggested sequence")}</p>
            <div className="mt-2 space-y-1.5">
              {note.plan.map((item, index) => (
                <p key={`${item}-${index}`} className="flex items-start gap-2 text-[11px] leading-relaxed text-white/45">
                  <Icon name="arrowRight" className="mt-[2px] h-3 w-3 shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        {aiConfigured ? (
          <button
            type="button"
            onClick={onGenerateCoach}
            disabled={coachBusy || !summary.attemptedCount}
            className={`${BTN_GLASS} w-full justify-between px-4 py-2.5 text-xs`}
          >
            <span className="inline-flex items-center gap-2">
              {coachBusy ? <Icon name="loader" className="h-3.5 w-3.5" /> : <Icon name="brain" className="h-3.5 w-3.5" />}
              {coachBusy ? tr("正在读取学习轨迹…", "Reading your learning trace…") : isAi ? tr("重新生成 AI 诊断", "Regenerate AI diagnosis") : tr("生成 AI 深度诊断", "Generate AI diagnosis")}
            </span>
            <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button type="button" onClick={onOpenSettings} className={`${BTN_GLASS} w-full justify-between px-4 py-2.5 text-xs`}>
            <span className="inline-flex items-center gap-2">
              <Icon name="key" className="h-3.5 w-3.5" />
              {tr("接入 DeepSeek 生成深度诊断", "Connect DeepSeek for a deeper diagnosis")}
            </span>
            <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
          </button>
        )}
        <p className="mt-2 text-center text-[9px] text-white/25">
          {isAi ? tr("AI 仅分析聚合学习数据，不读取原始 API Key。", "AI only reads aggregated learning data, never your raw API key.") : tr("当前为规则生成的本地建议；连接 AI 后可获得更具体的诊断。", "This is a local, rule-based suggestion. Connect AI for a more specific diagnosis.")}
        </p>
      </div>
    </div>
  );
}

function InsightsPage({
  summary,
  words,
  coachNote,
  coachBusy,
  aiConfigured,
  onGenerateCoach,
  onOpenSettings,
  onStartStudy,
  onPracticeWord,
  onImport,
}) {
  const weakest = summary.weakestField;
  const weakSpots = [];
  summary.attempted.forEach((stat) => {
    Object.entries(stat.fields).forEach(([field, score]) => {
      if (typeof score === "number" && score < 70) {
        weakSpots.push({ word: stat.word, field, score });
      }
    });
  });
  weakSpots.sort((a, b) => a.score - b.score);

  const kpis = [
    { label: tr("总练习次数", "Total attempts"), value: summary.attemptCount, suffix: "", meta: tr("已记录的练习", "attempts logged"), icon: "orbit" },
    { label: tr("学习覆盖率", "Deck coverage"), value: summary.coverage, suffix: "%", meta: tr(`${summary.attemptedCount} / ${summary.wordCount} 张词卡`, `${summary.attemptedCount} / ${summary.wordCount} words`), icon: "target" },
    { label: tr("综合掌握度", "Overall mastery"), value: summary.overall ?? "—", suffix: summary.overall === null ? "" : "%", meta: tr("加权平均", "weighted mastery"), icon: "chart" },
    { label: tr("当前最弱项", "Weakest field"), value: weakest?.score ?? "—", suffix: weakest?.score !== null && weakest?.score !== undefined ? "%" : "", meta: summary.attemptedCount ? weakest?.label || tr("待测量", "awaiting data") : tr("待测量", "awaiting data"), icon: "brain" },
  ];

  return (
    <main className="relative z-10 min-h-screen px-4 pb-24 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <Reveal>
            <Kicker>{tr("// 飞行分析", "// Flight analytics")}</Kicker>
            <h1 className="mt-4 font-heading text-6xl italic leading-[0.88] tracking-[-3px] text-white sm:text-7xl">
              {tr("掌握度，", "Mastery,")}
              <br />
              {tr("被照亮。", "illuminated.")}
            </h1>
            <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/60">
              {tr("不是“背了多少”，而是“哪一条轨道松了”。三项能力分别评分，逐词定位下一步。", "Not how much you covered, but which orbit is loose. Three abilities are scored separately, then each word gets a next step.")}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onStartStudy} className={BTN_PRIMARY}>
              {tr("继续学习", "Continue learning")}
              <Icon name="arrowUpRight" className="h-4 w-4" />
            </button>
            <button type="button" onClick={onImport} className={BTN_GLASS}>
              <Icon name="upload" className="h-4 w-4" />
              {tr("导入词表", "Import lexicon")}
            </button>
          </Reveal>
        </div>

        {!summary.attemptCount && (
          <Reveal delay={0.2} className="mt-7">
            <div className="liquid-glass flex flex-col items-start justify-between gap-4 rounded-[1.15rem] px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Icon name="orbit" className="mt-0.5 h-4 w-4 text-white/60" />
                <p className="text-[12px] leading-relaxed text-white/60">
                  {tr("航图还是空的。完成第一轮练习后，这里会自动生成雷达、趋势与逐词热力图。", "The map is still empty. After your first round, radar, trends, and the word-level heatmap appear here automatically.")}
                </p>
              </div>
              <button type="button" onClick={onStartStudy} className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                {tr("开启首轮", "Start a first round")}
              </button>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2} className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="liquid-glass rounded-[1.25rem] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{kpi.label}</p>
                  <Icon name={kpi.icon} className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading text-4xl italic leading-none tracking-[-1px] text-white">{kpi.value}</span>
                  <span className="text-sm text-white/35">{kpi.suffix}</span>
                </div>
                <p className="mt-2 text-[9px] uppercase tracking-[0.1em] text-white/25">{kpi.meta}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Reveal delay={0.25} className="lg:col-span-7">
            <div className="liquid-glass-strong flex h-full flex-col rounded-[1.5rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Kicker>{tr("// 掌握星座", "// Mastery constellation")}</Kicker>
                  <h2 className="mt-3 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("三条轨道。", "The three orbits.")}</h2>
                  <p className="mt-2 text-[12px] font-light text-white/50">{tr("词性、中文、英文——按词性 20% / 中文 40% / 英文 40% 加权。", "Part of speech, Chinese, English — weighted 20% / 40% / 40%.")}</p>
                </div>
                <span className="liquid-glass rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-white/40">
                  {tr("最近 3 次练习", "latest 3 attempts")}
                </span>
              </div>
              <div className="mt-2 grid flex-1 items-center gap-2 md:grid-cols-[1.25fr_.75fr]">
                <MasteryRadar averages={summary.averages} />
                <div className="space-y-5 pb-2">
                  {Object.entries(FIELD_META).map(([field, meta]) => {
                    const value = summary.averages[field];
                    const weak = value !== null && value < 70;
                    return (
                      <div key={field}>
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-sm text-white/80">{fieldLabel(field)}</p>
                            <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-white/30">{tr(`权重 ${Math.round(meta.weight * 100)}%`, `${Math.round(meta.weight * 100)}% weight`)}</p>
                          </div>
                          <span className={`quill text-3xl leading-none ${getScoreTone(value)}`}>{value === null ? "—" : `${value}%`}</span>
                        </div>
                        <Meter value={value} className="mt-2.5" />
                        <p className="mt-1.5 text-[9px] text-white/30">
                          {value === null ? tr("尚未测量", "Not measured yet") : weak ? tr("低于稳定线，优先补强", "Below the stable line — strengthen this first") : tr("保持在轨道内", "Holding the orbit")}
                        </p>
                      </div>
                    );
                  })}
                  <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="mono-label">{tr("本地读数", "Local readout")}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
                      {summary.attemptedCount
                        ? tr(`当前优先补强「${summary.weakestField?.label || fieldLabel("en")}」。${summary.weakestWord?.word?.word ? `最低分词卡是 ${summary.weakestWord.word.word}。` : ""}`, `Prioritize ${summary.weakestField?.label || fieldLabel("en")}${summary.weakestWord?.word?.word ? `. The lowest card is ${summary.weakestWord.word.word}.` : "."}`)
                        : tr("完成首轮后生成精确诊断。", "Complete a first round to generate a precise readout.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.32} className="lg:col-span-5">
            <AiCoachCard
              summary={summary}
              coachNote={coachNote}
              onGenerateCoach={onGenerateCoach}
              coachBusy={coachBusy}
              aiConfigured={aiConfigured}
              onOpenSettings={onOpenSettings}
            />
          </Reveal>

          <Reveal delay={0.36} className="lg:col-span-12">
            <WordHeatmap summary={summary} onPracticeWord={onPracticeWord} />
          </Reveal>

          <Reveal delay={0.4} className="lg:col-span-5">
            <div className="liquid-glass-strong flex h-full flex-col rounded-[1.5rem] p-5 sm:p-6">
              <Kicker>{tr("// 每日脉冲", "// Daily pulse")}</Kicker>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h2 className="font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("最近的光。", "Recent light.")}</h2>
                <span className="text-[9px] uppercase tracking-[0.14em] text-white/30">{tr("平均掌握度", "avg. mastery")}</span>
              </div>
              <div className="mt-4 flex-1">
                <TrendChart byDay={summary.byDay} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/35">
                <span>{summary.byDay.length ? tr(`${summary.byDay.length} 个学习日`, `${summary.byDay.length} study ${summary.byDay.length === 1 ? "day" : "days"}`) : tr("等待第一次练习", "Waiting for a first practice")}</span>
                <span>{tr(`${summary.attemptCount} 次练习`, `${summary.attemptCount} attempts`)}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.44} className="lg:col-span-7">
            <div className="liquid-glass-strong flex h-full flex-col rounded-[1.5rem] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Kicker>{tr("// 下一轮队列", "// Next orbit queue")}</Kicker>
                  <h2 className="mt-3 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("薄弱点。", "The soft spots.")}</h2>
                </div>
                {weakSpots.length > 0 && (
                  <span className="liquid-glass rounded-full px-3 py-1.5 text-[9px] text-white/45">{tr(`${weakSpots.length} 个信号`, `${weakSpots.length} signals`)}</span>
                )}
              </div>
              <div className="mt-5 flex-1 space-y-2">
                {weakSpots.length ? weakSpots.slice(0, 6).map((spot) => (
                  <div key={`${spot.word.id}-${spot.field}`} className="flex items-center gap-3 rounded-[0.95rem] border border-white/10 bg-white/[0.035] px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading text-xl italic leading-none text-white/90">{spot.word.word}</p>
                        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] text-white/45">{fieldLabel(spot.field)}</span>
                      </div>
                      <Meter value={spot.score} className="mt-2 max-w-[240px] !h-[3px]" />
                    </div>
                    <span className="quill text-2xl leading-none text-white/60">{spot.score}</span>
                    <button
                      type="button"
                      onClick={() => onPracticeWord(spot.word)}
                      className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] text-white/65 transition-colors hover:bg-white hover:text-black"
                    >
                      {tr("重练", "Review")}
                    </button>
                  </div>
                )) : (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                    <Icon name={summary.attemptedCount ? "check" : "orbit"} className="h-6 w-6 text-white/40" />
                    <p className="mt-3 font-heading text-2xl italic text-white/65">
                      {summary.attemptedCount ? tr("所有轨道稳定。", "All orbits stable.") : tr("等待第一个信号。", "Awaiting first signal.")}
                    </p>
                    <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-white/35">
                      {summary.attemptedCount ? tr("当前没有低于 70% 的分项。继续保持，或把新词加入航线。", "No field is below 70% right now. Keep the rhythm, or add new words to the voyage.") : tr("还没有可分析的分项，先完成一轮练习。", "No fields to analyse yet. Complete a first round first.")}
                    </p>
                  </div>
                )}
              </div>
              {weakSpots.length > 0 && (
                <p className="mt-4 border-t border-white/10 pt-3 text-[9px] text-white/25">
                  {tr("分数按最近三次练习的平均值计算。重练会更新这一项。", "Scores use the average of your latest three attempts. Reviewing updates this signal.")}
                </p>
              )}
            </div>
          </Reveal>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/25">
          <span>{tr("词级数据只保存在当前浏览器，不会上传到服务器。", "Word-level data stays in this browser and is never uploaded.")}</span>
          <span className="uppercase tracking-[0.14em]">{tr("Aster 学习数据", "Aster telemetry")} · {tr(`${words.length} 张词卡`, `${words.length} cards`)}</span>
        </div>
      </div>
    </main>
  );
}
