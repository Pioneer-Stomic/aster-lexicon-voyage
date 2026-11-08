/* ------------------------------------------------------------------ */
/* Study deck                                                          */
/* ------------------------------------------------------------------ */

function speakWord(word) {
  if (!word || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    // Speech is a progressive enhancement; typing remains fully available.
  }
}

function PosSelector({ selected, onToggle, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {POS_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onToggle(option.id)}
            className={`group flex min-h-[54px] items-center justify-between gap-2 rounded-[0.9rem] border px-3 py-2.5 text-left transition-all duration-200 ${
              isSelected
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/[0.045] text-white hover:border-white/35 hover:bg-white/[0.09]"
            } disabled:opacity-50`}
          >
            <span className="block text-[13px] font-medium leading-tight">{posOptionLabel(option)}</span>
            <span className={`kbd shrink-0 ${isSelected ? "border-black/20 bg-black/5 text-black/60" : ""}`}>{option.key}</span>
          </button>
        );
      })}
    </div>
  );
}

function FieldScoreCard({ field, result, yourAnswer, reference }) {
  const score = result?.score ?? 0;
  const feedback = result?.feedback || "—";
  return (
    <div className="flex min-w-0 flex-col rounded-[1.15rem] border border-white/12 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono-label">{fieldLabel(field)}</p>
          <p className="mt-1 text-[10px] text-white/35">{score >= 85 ? tr("稳定", "Solid") : score >= 60 ? tr("接近", "Close") : tr("待强化", "Needs work")}</p>
        </div>
        <div className="text-right">
          <span className={`quill text-3xl leading-none ${getScoreTone(score)}`}>{score}</span>
          <span className="ml-0.5 text-[10px] text-white/40">/100</span>
        </div>
      </div>
      <div className="mt-3">
        <Meter value={score} />
      </div>
      <p className="mt-4 whitespace-pre-wrap text-[12px] font-light leading-relaxed text-white/70">{feedback}</p>
      <div className="mt-auto space-y-3 pt-5">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">{tr("你的答案", "Your answer")}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/85">
            {yourAnswer || <span className="text-white/35">{tr("未填写", "Not answered")}</span>}
          </p>
        </div>
        <div className="h-px bg-white/10" />
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">{tr("参考答案", "Reference")}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/85">{reference || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ word, attempt, currentIndex, total, onNext, onGoInsights }) {
  const nextRef = useRef(null);
  const nextLabel = currentIndex + 1 >= total ? tr("完成本轮航程", "Finish this voyage") : tr("下一张词卡", "Next word");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector("[aria-modal='true']")) return;
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select", "a"].includes(tag)) return;
      if (tag === "button") return;
      event.preventDefault();
      onNext();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onNext]);

  useEffect(() => {
    const timer = setTimeout(() => {
      nextRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      const anchor = document.getElementById("study-result-anchor");
      if (!anchor) return;
      const top = anchor.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 60);
    return () => clearTimeout(scrollTimer);
  }, []);

  if (!attempt) return null;
  const sourceLabel = attempt.source === "ai"
    ? tr("AI 语义批改", "AI SEMANTIC REVIEW")
    : tr("本地匹配 · 仅供参考", "LOCAL MATCH · FOR REFERENCE");
  const selectedLabels = posLabelList(attempt.selectedPos || []);
  const strengths = attempt.strengths?.length ? attempt.strengths : [];
  const gaps = attempt.gaps?.length ? attempt.gaps : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="liquid-glass-strong rounded-[1.5rem] p-5 sm:p-7"
    >
      <div className="flex flex-col gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ScoreRing score={attempt.overall} size={92} />
          <div>
            <p className="mono-label">{sourceLabel}</p>
            <h2 className="mt-2 font-heading text-3xl italic leading-none text-white md:text-4xl">
              {masteryBandLabel(attempt.overall)}
            </h2>
            <p className="mt-2 max-w-xl text-[12px] font-light leading-relaxed text-white/60">
              {attempt.source === "ai"
                ? tr("已对照词卡完成语义批改。分数是下一步行动的路标，不是终点。", "The card has been reviewed semantically. The score is a signpost for your next move, not a finish line.")
                : tr("尚未连接 AI，本次使用本地关键词匹配。同义表达可能被漏判，建议在设置中接入 DeepSeek 复核。", "AI is not connected, so this attempt used local keyword matching. Paraphrases can be missed; connect DeepSeek in Settings for a closer review.")}
            </p>
            {attempt.source === "ai" && (
              <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-white/40">
                {tr("语义优先评分：意思覆盖 70% + 准确度 25% + 表达 5%。只要核心意思相近就会得到高分，语法和拼写只作轻微扣分；与参考答案完全一致直接 100 分。", "Meaning-first scoring: 70% meaning coverage + 25% precision + 5% expression. Close semantic matches earn high marks; grammar and spelling only cause a small deduction. Exact matches receive 100.")}
              </p>
            )}
            {attempt.aiError && (
              <p className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-[0.8rem] border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[10px] leading-relaxed text-white/60">
                <Icon name="alert" className="mt-[1px] h-3 w-3 shrink-0" />
                <span className="break-words">{tr("AI 未能完成复核：", "AI could not complete the review: ")}{attempt.aiError}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="liquid-glass rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/65">
            {attempt.model || tr("本地引擎", "local engine")}
          </span>
          <button type="button" onClick={onGoInsights} className={`${BTN_GLASS} px-4 py-2 text-xs`}>
            <Icon name="chart" className="h-4 w-4" />
            {tr("查看分析", "Insights")}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <FieldScoreCard
          field="pos"
          result={attempt.feedback?.pos}
          yourAnswer={selectedLabels}
          reference={posLabelList(word.pos)}
        />
        <FieldScoreCard
          field="zh"
          result={attempt.feedback?.zh}
          yourAnswer={attempt.zhAnswer}
          reference={word.zh}
        />
        <FieldScoreCard
          field="en"
          result={attempt.feedback?.en}
          yourAnswer={attempt.enAnswer}
          reference={word.en}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.035] p-4">
          <p className="mono-label flex items-center gap-2"><Icon name="orbit" className="h-3.5 w-3.5" /> {tr("本轮亮点", "Orbital positives")}</p>
          {strengths.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {strengths.map((item) => (
                <span key={item} className="liquid-glass rounded-full px-3 py-1.5 text-[11px] text-white/80">{item}</span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-white/45">{tr("这一轮还没有记录到明显强项。下一轮先写你最有把握的部分。", "No clear strengths were recorded this round. Start the next one with the part you know best.")}</p>
          )}
        </div>
        <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.035] p-4">
          <p className="mono-label flex items-center gap-2"><Icon name="target" className="h-3.5 w-3.5" /> {tr("下一轮重点", "Focus for next orbit")}</p>
          {gaps.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {gaps.map((item) => (
                <span key={item} className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-white/75">{item}</span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-white/45">{tr("三个维度都保持在轨道上。保持这个节奏。", "All three dimensions stayed on course. Keep this rhythm.")}</p>
          )}
        </div>
      </div>

      {(wordMemoryTip(word) || wordTags(word).length > 0) && (
        <div className="mt-3 flex flex-col gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
            <div>
              <p className="mono-label">{tr("记忆钩子", "Memory hook")}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/80">{wordMemoryTip(word) || tr("给这个词写一条属于你的记忆钩子。", "Write a memory hook of your own for this word.")}</p>
            </div>
          </div>
          {wordTags(word).length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-1.5">
              {wordTags(word).map((tag) => (
                <span key={tag} className="liquid-glass rounded-full px-2.5 py-1 text-[10px] text-white/60">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-white/40">{tr("按回车继续 · 参考答案仅在提交后显示", "Press Enter to continue · References appear only after submission")}</p>
        <button ref={nextRef} type="button" onClick={onNext} className={BTN_PRIMARY}>
          {nextLabel}
          <Icon name="arrowRight" className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function FitWord({ text }) {
  const wrapRef = useRef(null);
  const wordRef = useRef(null);

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const node = wordRef.current;
    if (!wrap || !node) return undefined;

    const fit = () => {
      const available = wrap.clientWidth;
      if (!available) return;
      node.style.fontSize = "100px";
      const naturalWidth = node.getBoundingClientRect().width;
      if (!naturalWidth) return;
      const nextSize = Math.max(31, Math.min(96, (available / naturalWidth) * 100));
      node.style.fontSize = `${nextSize.toFixed(2)}px`;
    };

    fit();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(wrap);
    if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
    return () => observer?.disconnect();
  }, [text]);

  return (
    <div ref={wrapRef} className="w-full">
      <span
        ref={wordRef}
        className="word-break inline-block whitespace-nowrap font-heading italic leading-[0.92] tracking-[-0.035em] text-white"
        style={{ fontSize: "clamp(3rem, 5vw, 6rem)" }}
      >
        {text}
      </span>
    </div>
  );
}

function StudyAside({ word, index, total }) {
  return (
    <aside className="liquid-glass-strong flex min-h-[310px] flex-col rounded-[1.5rem] p-6 md:min-h-full md:p-7">
      <div className="flex items-center justify-between gap-4">
        <span className="mono-label">{tr("当前单词", "Current word")}</span>
        <span className="text-[10px] tracking-[0.16em] text-white/40">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
      <div className="my-auto py-10">
        <FitWord text={word.word} />
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => speakWord(word.word)}
            className="liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] text-white/70 transition-colors hover:text-white"
            aria-label={tr(`朗读 ${word.word}`, `Read ${word.word} aloud`)}
          >
            <Icon name="volume" className="h-4 w-4" />
            {tr("朗读发音", "Read aloud")}
          </button>
          <span className="rounded-full border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/45">
            {tr("闭卷", "Closed book")}
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 pt-4">
        <p className="text-[11px] font-light leading-relaxed text-white/45">
          {tr("先凭记忆作答。词性与释义会在提交后一起打开。", "Answer from memory. Part of speech and references will open after you submit.")}
        </p>
      </div>
    </aside>
  );
}

function SessionSummary({ session, onRestart, onGoInsights, onHome }) {
  const attempts = session.attempts || [];
  const scores = attempts.map((attempt) => attempt.overall).filter((score) => Number.isFinite(score));
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const weakest = [...attempts].sort((a, b) => a.overall - b.overall)[0];
  const strongest = [...attempts].sort((a, b) => b.overall - a.overall)[0];
  const byField = {};
  for (const field of Object.keys(FIELD_META)) {
    const values = attempts.map((attempt) => attempt.scores?.[field]).filter((value) => Number.isFinite(value));
    byField[field] = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mx-auto max-w-5xl"
    >
      <div className="liquid-glass-strong rounded-[1.6rem] p-6 sm:p-10">
        <Reveal delay={0.05}>
          <Kicker>{tr("// 航程完成", "// Session complete")}</Kicker>
          <h1 className="mt-5 font-heading text-6xl italic leading-[0.86] tracking-[-3px] text-white sm:text-7xl lg:text-[6.4rem]">
            {tr("航程完成。", "Orbit achieved.")}
          </h1>
          <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/65">
            {attempts.length
              ? tr(`本轮完成 ${attempts.length} 张词卡。现在把这些信号带进掌握星图，决定下一段航线。`, `${attempts.length} ${attempts.length === 1 ? "card" : "cards"} completed this round. Take these signals into your mastery map and choose the next orbit.`)
              : tr("本轮还没有提交任何词卡。下一次，先写出一条你确信的释义。", "No cards were submitted this round. Next time, start with one meaning you feel confident about.")}
          </p>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.15rem] border border-white/12 bg-white/[0.045] p-5">
            <p className="mono-label">{tr("本轮平均分", "Session average")}</p>
            <p className="mt-4 font-heading text-5xl italic leading-none">{average}<span className="text-2xl text-white/40">%</span></p>
            <p className="mt-2 text-[11px] text-white/50">{masteryBandLabel(average)} · {tr("综合掌握度", "overall mastery")}</p>
          </div>
          <div className="rounded-[1.15rem] border border-white/12 bg-white/[0.045] p-5">
            <p className="mono-label">{tr("最佳轨道", "Strongest orbit")}</p>
            <p className="mt-4 break-words font-heading text-4xl italic leading-none">{strongest?.word || "—"}</p>
            <p className="mt-2 text-[11px] text-white/50">{strongest ? `${strongest.overall}% · ${tr("本轮表现最佳", "best this round")}` : tr("等待下一轮", "Waiting for the next round")}</p>
          </div>
          <div className="rounded-[1.15rem] border border-white/12 bg-white/[0.045] p-5">
            <p className="mono-label">{tr("最低轨道", "Lowest orbit")}</p>
            <p className="mt-4 break-words font-heading text-4xl italic leading-none">{weakest?.word || "—"}</p>
            <p className="mt-2 text-[11px] text-white/50">
              {weakest
                ? `${weakest.overall}% · ${weakest.overall >= 85 ? tr("本轮无需额外重练", "no extra review needed") : tr("建议优先重练", "review first")}`
                : tr("等待下一轮", "Waiting for the next round")}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {Object.entries(FIELD_META).map(([field, meta]) => (
            <div key={field} className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-[11px] text-white/55">
                <span>{fieldLabel(field)}</span>
                <span>{byField[field] ?? "—"}{byField[field] !== null ? "%" : ""}</span>
              </div>
              <Meter value={byField[field]} className="mt-2.5" />
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onGoInsights} className={BTN_GLASS}>
              <Icon name="chart" className="h-4 w-4" />
              {tr("查看掌握星图", "Open mastery map")}
            </button>
            <button type="button" onClick={onHome} className={BTN_QUIET}>
              <Icon name="arrowLeft" className="h-3.5 w-3.5" />
              {tr("返回首页", "Back home")}
            </button>
          </div>
          <button type="button" onClick={onRestart} className={BTN_PRIMARY}>
            {tr("再飞一轮", "Fly another round")}
            <Icon name="refresh" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StudyPage({
  session,
  aiConfigured,
  settings,
  onExit,
  onCompleteAttempt,
  onNext,
  onStartSession,
  onGoInsights,
  onHome,
  onImport,
  onOpenSettings,
  toast,
}) {
  const total = session.queue.length;
  const currentWord = session.queue[session.index] || null;
  const result = session.result;
  const finished = session.finished;
  const [selectedPos, setSelectedPos] = useState([]);
  const [zh, setZh] = useState("");
  const [en, setEn] = useState("");
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    setSelectedPos([]);
    setZh("");
    setEn("");
    setGrading(false);
  }, [currentWord?.id, session.index]);

  const togglePos = useCallback((id) => {
    if (grading || result) return;
    setSelectedPos((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }, [grading, result]);

  const hasAnswer = selectedPos.length || zh.trim() || en.trim();

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (!currentWord || grading || result) return;
    if (!hasAnswer) {
      toast(tr("至少选择词性或填写一项释义，再提交本轮。", "Select a part of speech or write at least one meaning before submitting."), "info");
      return;
    }

    setGrading(true);
    const answers = {
      selectedPos,
      zh: zh.trim(),
      en: en.trim(),
    };
    const local = localEvaluate(currentWord, answers);
    let evaluation = local;
    let aiError = null;

    if (aiConfigured) {
      try {
        const raw = await getAiEvaluation(currentWord, answers, settings);
        evaluation = mergeAiEvaluation(raw, local, currentWord, answers, settings.model);
      } catch (error) {
        aiError = error.message;
      }
    }

    const attempt = {
      id: uid("attempt"),
      wordId: currentWord.id,
      word: currentWord.word,
      createdAt: Date.now(),
      selectedPos: answers.selectedPos,
      zhAnswer: answers.zh,
      enAnswer: answers.en,
      scores: {
        pos: evaluation.pos.score,
        zh: evaluation.zh.score,
        en: evaluation.en.score,
      },
      overall: evaluation.overall,
      feedback: {
        pos: evaluation.pos,
        zh: evaluation.zh,
        en: evaluation.en,
      },
      correct: {
        pos: local.pos.correct,
        zh: evaluation.zh.correct,
        en: evaluation.en.correct,
      },
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      source: evaluation.source,
      model: evaluation.model,
      aiError,
    };

    onCompleteAttempt(attempt);
    setGrading(false);
    if (aiError) toast(tr(`AI 复核未完成，已切换为本地判分：${aiError}`, `AI review did not finish, so local marking was used: ${aiError}`), "warning");
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.isComposing) return;
      if (document.querySelector("[aria-modal='true']")) return;
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable) return;
      if (finished || result || grading) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > POS_OPTIONS.length) return;
      event.preventDefault();
      togglePos(POS_OPTIONS[number - 1].id);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finished, result, grading, togglePos]);

  if (!total) {
    return (
      <main className="relative z-10 min-h-screen px-4 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <button type="button" onClick={onExit} className={`${BTN_GLASS} px-4 py-2 text-xs`}>
            <Icon name="arrowLeft" className="h-4 w-4" />
            {tr("返回星港", "Back to base")}
          </button>
          <div className="mt-8">
            <EmptyOrbit
              title={tr("词库还是空的。", "Your deck is empty.")}
              body={tr("词库里还没有可练习的单词。导入一份 Excel 词表，或回到首页查看示例词卡。", "There are no words to practise yet. Import an Excel lexicon, or return home to explore the sample cards.")}
              action={onImport}
              actionLabel={tr("导入词表", "Import a lexicon")}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen px-3 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <h1 className="sr-only">{finished ? tr("本轮练习总结", "Session summary") : tr(`词汇练习：${currentWord?.word || ""}`, `Vocabulary practice: ${currentWord?.word || ""}`)}</h1>
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onExit} className={`${BTN_GLASS} px-4 py-2.5 text-xs`}>
              <Icon name="arrowLeft" className="h-4 w-4" />
              {tr("返回星港", "Back to base")}
            </button>
            <span className="liquid-glass hidden items-center gap-2 rounded-full px-3.5 py-2.5 text-[10px] uppercase tracking-[0.16em] text-white/55 sm:inline-flex">
              {finished
                ? tr("航段完成", "Session complete")
                : tr(`航段 ${String(session.index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, `Session ${String(session.index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="liquid-glass inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-white/65">
              <span className={`status-dot ${aiConfigured ? "" : "is-idle"}`} aria-hidden="true" />
              {aiConfigured ? tr("DeepSeek 已连接", "DeepSeek uplink") : tr("本地判分", "Local marking")}
            </span>
            {!aiConfigured && (
              <button type="button" onClick={onOpenSettings} className="rounded-full px-2 py-2 text-[11px] text-white/60 underline decoration-white/20 underline-offset-4 hover:text-white">
                {tr("接入 AI", "Connect AI")}
              </button>
            )}
          </div>
        </div>

        {!finished && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: `${total ? ((session.index + (result ? 1 : 0)) / total) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="w-10 text-right text-[10px] tabular-nums text-white/40">{Math.round((total ? (session.index + (result ? 1 : 0)) / total : 0) * 100)}%</span>
          </div>
        )}

        <div className="mt-6">
          {finished ? (
            <SessionSummary
              session={session}
              onRestart={onStartSession}
              onGoInsights={onGoInsights}
              onHome={onHome}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <StudyAside word={currentWord} index={session.index} total={total} />
              </div>
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait" initial={false}>
                  {result ? (
                    <div id="study-result-anchor" key="result" className="scroll-mt-28">
                      <ResultPanel
                        word={currentWord}
                        attempt={result}
                        currentIndex={session.index}
                        total={total}
                        onNext={onNext}
                        onGoInsights={onGoInsights}
                      />
                    </div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <form onSubmit={handleSubmit} className="liquid-glass-strong rounded-[1.5rem] p-5 sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Kicker>{tr("// 闭卷回忆", "// Recall calibration")}</Kicker>
                            <h2 className="mt-3 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">
                              {tr("解读这个词。", "Decode this word.")}
                            </h2>
                          </div>
                          <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                            {tr("闭卷 · 01", "Closed book · 01")}
                          </span>
                        </div>

                        <div className="mt-7">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm text-white/85">
                              <span className="font-heading text-xl italic text-white/55">01</span>
                              {tr("词性", "Part of speech")}
                            </label>
                            <span className="text-[10px] text-white/40">{tr("按 1–8 选择 · 可多选", "Press 1–8 · multi-select")}</span>
                          </div>
                          <PosSelector selected={selectedPos} onToggle={togglePos} disabled={grading} />
                        </div>

                        <div className="mt-7 grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <label htmlFor="answer-zh" className="flex items-center gap-2 text-sm text-white/85">
                                <span className="font-heading text-xl italic text-white/55">02</span>
                                {tr("中文释义", "Chinese meaning")}
                              </label>
                            </div>
                            <textarea
                              id="answer-zh"
                              rows={5}
                              value={zh}
                              onChange={(event) => setZh(event.target.value)}
                              maxLength={500}
                              disabled={grading}
                              className={`${INPUT_CLASS} min-h-[142px]`}
                              placeholder={tr("写下你记得的中文释义，可以用分号分隔多个义项……", "Write the Chinese meanings you remember. Separate multiple senses with semicolons…")}
                            />
                          </div>
                          <div>
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <label htmlFor="answer-en" className="flex items-center gap-2 text-sm text-white/85">
                                <span className="font-heading text-xl italic text-white/55">03</span>
                                {tr("英文释义", "English definition")}
                              </label>
                            </div>
                            <textarea
                              id="answer-en"
                              rows={5}
                              value={en}
                              onChange={(event) => setEn(event.target.value)}
                              maxLength={500}
                              onKeyDown={(event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !event.nativeEvent.isComposing) {
                                  event.preventDefault();
                                  handleSubmit(event);
                                }
                              }}
                              disabled={grading}
                              className={`${INPUT_CLASS} min-h-[142px]`}
                              placeholder={tr("用英文写一条简短定义，欢迎用自己的话改写……", "Write a short definition in English. Paraphrase is welcome…")}
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-2 text-[10px] leading-relaxed text-white/40">
                            <Icon name={aiConfigured ? "sparkles" : "alert"} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="max-w-md">
                              {aiConfigured
                                ? tr("DeepSeek 只分析你提交的答案，不会替你作答。Ctrl / ⌘ + Enter 提交。", "DeepSeek only reviews what you submit; it will not answer for you. Press Ctrl / ⌘ + Enter to submit.")
                                : tr("当前使用本地关键词判分，同义表达可能漏判。连接 DeepSeek 后可获得语义批改。", "Local keyword matching is active; paraphrases can be missed. Connect DeepSeek for semantic review.")}
                            </span>
                          </div>
                          <button type="submit" disabled={grading || !hasAnswer} className={`${BTN_PRIMARY} min-w-[148px]`}>
                            {grading ? (
                              <>
                                <Icon name="loader" className="h-4 w-4" />
                                {tr("AI 正在分析", "AI is reviewing")}
                              </>
                            ) : (
                              <>
                                {aiConfigured ? tr("提交 AI 批改", "Submit for AI review") : tr("提交本地判分", "Submit for local marking")}
                                <Icon name="arrowUpRight" className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                        <AnimatePresence>
                          {grading && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.035] px-4 py-3">
                                <div className="flex items-center justify-between gap-3 text-[10px] text-white/50">
                                  <span>{tr("理解你的表达 → 对照词卡 → 分项校准", "Read your answer → compare the card → calibrate each field")}</span>
                                  <span className="tabular-nums">DeepSeek</span>
                                </div>
                                <div className="shimmer-line mt-2 h-1 rounded-full" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {!finished && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
              {settings.apiKey ? tr("AI 批改已启用", "AI review active") : tr("本地引擎已启用", "Local engine active")} · {tr("数据保存在此浏览器", "Data stays in this browser")}
            </p>
            <button type="button" onClick={onImport} className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition-colors hover:text-white">
              <Icon name="plus" className="h-3.5 w-3.5" />
              {tr("导入更多词卡", "Import more cards")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
