/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsModal({ settings, onClose, onSave, onLanguageChange, toast }) {
  const [draft, setDraft] = useState({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [testState, setTestState] = useState({ status: "idle", message: "" });

  const changeLanguage = (language) => {
    if ((draft.language || "zh") === language) return;
    setDraft((current) => ({ ...current, language }));
    setTestState({ status: "idle", message: "" });
    onLanguageChange(language);
  };

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setTestState({ status: "idle", message: "" });
  };

  const validate = () => {
    if (draft.apiKey.trim() && !/^https?:\/\//i.test(draft.baseUrl.trim())) {
      return tr("接口地址必须以 http 或 https 开头。", "Base URL must start with http or https.");
    }
    return null;
  };

  const handleSave = (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast(error, "warning");
      return;
    }
    const nextSettings = {
      apiKey: draft.apiKey.trim(),
      baseUrl: draft.baseUrl.trim() || DEFAULT_SETTINGS.baseUrl,
      model: draft.model.trim() || DEFAULT_SETTINGS.model,
      language: draft.language || "zh",
    };
    onSave(nextSettings);
    onClose();
    toast(nextSettings.apiKey
      ? tr("DeepSeek 接入信息已保存。", "DeepSeek connection settings saved.")
      : tr("已清除 DeepSeek 接入信息，将使用本地判分。", "DeepSeek settings cleared. Local marking will be used."), "success");
  };

  const handleTest = async () => {
    if (!draft.apiKey.trim()) {
      setTestState({ status: "error", message: tr("请先填写 DeepSeek 密钥。", "Enter an API key first.") });
      return;
    }
    const error = validate();
    if (error) {
      setTestState({ status: "error", message: error });
      return;
    }
    setTestState({ status: "testing", message: tr("正在向 DeepSeek 发送握手请求…", "Sending a handshake request to DeepSeek…") });
    try {
      const content = await callDeepSeek(
        {
          apiKey: draft.apiKey.trim(),
          baseUrl: draft.baseUrl.trim() || DEFAULT_SETTINGS.baseUrl,
          model: draft.model.trim() || DEFAULT_SETTINGS.model,
        },
        [{ role: "user", content: "Reply with only the word: ready" }],
        { maxTokens: 8, temperature: 0, timeoutMs: 30000 }
      );
      setTestState({ status: "success", message: tr(`连接成功 · 模型回应「${String(content).trim().slice(0, 20)}」`, `Connected · Model replied "${String(content).trim().slice(0, 20)}"`) });
      toast(tr("DeepSeek 连接测试成功，保存设置后即可启用。", "DeepSeek connection test passed. Save settings to enable it."), "success");
    } catch (error) {
      setTestState({ status: "error", message: error.message });
      toast(tr(`连接失败：${error.message}`, `Connection failed: ${error.message}`), "warning");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[92] grid place-items-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 10, scale: 0.985, filter: "blur(6px)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="liquid-glass-strong glass-scroll relative max-h-[calc(100vh-1.5rem)] w-full max-w-[680px] overflow-y-auto rounded-[1.5rem] p-5 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Kicker>{tr("// 界面与 DeepSeek 设置", "// Interface & DeepSeek")}</Kicker>
            <h2 id="settings-title" className="mt-3 font-heading text-4xl italic leading-none tracking-[-1px]">
              {tr("调校你的界面。", "Tune your interface.")}
            </h2>
            <p className="mt-3 max-w-md text-[12px] font-light leading-relaxed text-white/55">
              {tr("选择界面语言，并按需接入 DeepSeek。密钥只用于你主动触发的词卡解析、答案批改与学习诊断；没有密钥时，本地判分和所有学习功能仍然可用。", "Choose your interface language and connect DeepSeek if you want AI help. The API key is used only for card parsing, answer review, and learning diagnosis that you trigger. Without it, local marking and all study features still work.")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr("关闭设置", "Close settings")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-[1rem] border border-white/12 bg-white/[0.04] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/85">{tr("界面语言", "Interface language")}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/35">{tr("选择后立即应用并保存，AI 的批改与诊断也会使用该语言。", "Applied and saved immediately. AI reviews and diagnoses will use this language too.")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-black/20 p-1" role="group" aria-label={tr("界面语言", "Interface language")}>
            {[
              { id: "zh", label: tr("中文", "Chinese") },
              { id: "en", label: tr("英文", "English") },
            ].map((language) => (
              <button
                key={language.id}
                type="button"
                aria-pressed={(draft.language || "zh") === language.id}
                onClick={() => changeLanguage(language.id)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors ${
                  (draft.language || "zh") === language.id ? "bg-white text-black" : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="deepseek-api-key" className="text-sm text-white/85">{tr("DeepSeek 密钥", "DeepSeek API Key")}</label>
            <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${settings.apiKey || draft.apiKey ? "border border-white/20 text-white/60" : "border border-white/10 text-white/30"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${settings.apiKey || draft.apiKey ? "bg-white" : "bg-white/25"}`} />
              {settings.apiKey ? tr("已配置", "configured") : draft.apiKey ? tr("待保存", "ready to save") : tr("未配置", "not configured")}
            </span>
          </div>
          <div className="relative mt-2">
            <input
              id="deepseek-api-key"
              type={showKey ? "text" : "password"}
              value={draft.apiKey}
              onChange={(event) => updateDraft("apiKey", event.target.value)}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              className="field-input w-full py-3 pl-4 pr-24 font-mono text-sm"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
              {draft.apiKey && (
                <button type="button" onClick={() => updateDraft("apiKey", "")} className="rounded-full px-2 py-1 text-[10px] text-white/35 hover:text-white">
                  {tr("清除", "Clear")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKey((current) => !current)}
                aria-label={showKey ? tr("隐藏 API 密钥", "Hide API key") : tr("显示 API 密钥", "Show API key")}
                className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
              >
                <Icon name={showKey ? "eyeOff" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] leading-relaxed text-white/35">
              {tr("密钥保存于当前浏览器，不会发送给 Aster 之外的服务器。", "The key is stored in this browser's localStorage and is never sent to a server other than your chosen endpoint.")}
            </p>
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-[10px] text-white/50 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              {tr("获取密钥", "Get a key")}
              <Icon name="external" className="h-3 w-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((current) => !current)}
            className="mt-5 flex w-full items-center justify-between rounded-[0.95rem] border border-white/10 px-3.5 py-2.5 text-left text-[11px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="settings" className="h-3.5 w-3.5" />
              {tr("高级连接设置 · 接口与模型", "Advanced · Base URL / Model")}
            </span>
            <Icon name="chevronDown" className={`h-3.5 w-3.5 transition-transform ${advanced ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence initial={false}>
            {advanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="deepseek-base-url" className="text-[10px] text-white/45">{tr("接口地址", "Base URL")}</label>
                    <input
                      id="deepseek-base-url"
                      type="url"
                      value={draft.baseUrl}
                      onChange={(event) => updateDraft("baseUrl", event.target.value)}
                      placeholder="https://api.deepseek.com"
                      spellCheck={false}
                      className="field-input mt-1.5 w-full px-3 py-2.5 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="deepseek-model" className="text-[10px] text-white/45">{tr("模型", "Model")}</label>
                    <input
                      id="deepseek-model"
                      type="text"
                      list="deepseek-models"
                      value={draft.model}
                      onChange={(event) => updateDraft("model", event.target.value)}
                      placeholder="deepseek-chat"
                      spellCheck={false}
                      className="field-input mt-1.5 w-full px-3 py-2.5 font-mono text-[11px]"
                    />
                    <datalist id="deepseek-models">
                      <option value="deepseek-chat" />
                      <option value="deepseek-reasoner" />
                    </datalist>
                  </div>
                </div>
                <p className="mt-2 text-[9px] leading-relaxed text-white/30">
                  {tr("建议使用 deepseek-chat，结构化批改与词卡解析已验证兼容。密钥会从当前标签页直接发送到上面的接口地址。", "Use deepseek-chat for tested JSON review and card parsing. Your key is sent directly from this tab to the endpoint above.")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 rounded-[1rem] border border-white/10 bg-white/[0.035] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${testState.status === "success" ? "bg-white" : testState.status === "error" ? "bg-white/40" : "bg-white/20"}`} />
              <div className="min-w-0" aria-live="polite">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  {testState.status === "testing" ? tr("正在测试连接", "Testing connection") : testState.status === "success" ? tr("连接就绪", "Uplink ready") : testState.status === "error" ? tr("连接异常", "Connection issue") : tr("连接状态", "Connection state")}
                </p>
                <p className="mt-1 break-words text-[11px] leading-relaxed text-white/55">
                  {testState.message || (draft.apiKey ? tr("保存后，练习提交时会自动调用 DeepSeek 做语义批改。", "After saving, DeepSeek will review each submitted attempt.") : tr("尚未填写密钥。你仍可导入、练习和查看本地分析。", "No key yet. You can still import, practise, and view local analytics."))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[18rem] flex-1 text-[9px] leading-relaxed text-white/25">
              {tr("使用公共设备时请注意：密钥会保存在浏览器中，可随时回来清除。", "On shared devices, remember that the API key is stored in this browser. You can return to clear it at any time.")}
            </p>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <button type="button" onClick={handleTest} disabled={testState.status === "testing"} className={`${BTN_GLASS} px-4 py-2.5 text-xs`}>
                {testState.status === "testing" ? <Icon name="loader" className="h-3.5 w-3.5" /> : <Icon name="key" className="h-3.5 w-3.5" />}
                {tr("测试连接", "Test connection")}
              </button>
              <button type="submit" className={`${BTN_PRIMARY} px-5`}>
                {tr("保存设置", "Save settings")}
                <Icon name="check" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Excel import                                                        */
/* ------------------------------------------------------------------ */

function ImportModal({ existingWords, settings, aiConfigured, onClose, onSave, onOpenSettings, toast }) {
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const [stage, setStage] = useState("upload");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState([]);
  const [aiMeta, setAiMeta] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  const existingSet = useMemo(
    () => new Set(existingWords.map((word) => normalizeWord(word.word))),
    [existingWords]
  );
  const duplicateCount = generated.filter((card) => existingSet.has(normalizeWord(card.word))).length;
  const newCount = generated.length - duplicateCount;

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const reset = () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setStage("upload");
    setParsed(null);
    setGenerated([]);
    setError("");
    setAiMeta(null);
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (abortRef.current) abortRef.current.abort();
    onClose();
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setStage("upload");
    setParsing(true);
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error(tr("文件超过 12MB。请拆分后导入。", "The file is over 12 MB. Split it and import again."));
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error(tr("请选择 .xlsx、.xls 或 .csv 文件。", "Choose an .xlsx, .xls, or .csv file."));
      const buffer = await file.arrayBuffer();
      const info = parseSpreadsheet(buffer, file.name);
      setParsed(info);
      setStage("preview");
      toast(tr(`已读取 ${info.cards.length} 个单词，等待生成词卡。`, `Read ${info.cards.length} ${info.cards.length === 1 ? "word" : "words"}. Ready to build cards.`), "success");
    } catch (readError) {
      setError(readError.message || tr("文件解析失败，请检查格式。", "Could not parse the file. Check its format."));
      setStage("upload");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleRawGenerate = () => {
    if (!parsed) return;
    setGenerated(parsed.cards.map((card) => ({ ...card })));
    setAiMeta({ source: "raw", total: parsed.cards.length });
    setStage("ready");
  };

  const handleAiGenerate = async () => {
    if (!parsed) return;
    if (!aiConfigured) {
      onOpenSettings();
      toast(tr("先接入 DeepSeek，再让 AI 解析词表。你也可以直接生成原始词卡。", "Connect DeepSeek to let AI parse the list. You can also build cards directly from the raw data."), "info");
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStage("generating");
    setError("");
    setProgress({ done: 0, total: parsed.cards.length });
    try {
      const result = await enrichCardsWithAI(
        parsed.cards,
        settings,
        (done) => setProgress({ done, total: parsed.cards.length }),
        controller.signal
      );
      if (!result.aiCount) {
        throw new Error(tr("AI 未能返回可用的词卡，批次可能超时。可以重试，或先使用原始数据生成。", "AI did not return usable cards. A batch may have timed out. Retry, or build cards from the raw data."));
      }
      setGenerated(result.cards);
      setAiMeta({
        source: "ai",
        total: result.cards.length,
        aiCount: result.aiCount,
        failedChunks: result.failedChunks,
      });
      setStage("ready");
      toast(
        result.failedChunks
          ? tr(`AI 已生成 ${result.aiCount} 张增强词卡，另有 ${result.failedChunks} 个批次保留了原始数据。`, `AI generated ${result.aiCount} enhanced cards. ${result.failedChunks} ${result.failedChunks === 1 ? "batch" : "batches"} kept the original data.`)
          : tr(`AI 已生成 ${result.aiCount} 张词卡。`, `AI generated ${result.aiCount} cards.`),
        result.failedChunks ? "warning" : "success"
      );
    } catch (generateError) {
      if (controller.signal.aborted) {
        setError(tr("已取消 AI 解析。你可以重试，或直接生成原始词卡。", "AI parsing cancelled. Retry, or build cards from the raw data."));
      } else {
        setError(generateError.message || tr("AI 解析失败，请稍后重试。", "AI parsing failed. Try again later."));
      }
      setStage("preview");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setStage("preview");
    setError(tr("已取消 AI 解析。可以重试，或直接生成原始词卡。", "AI parsing cancelled. Retry, or build cards from the raw data."));
  };

  const handleDownloadTemplate = () => {
    if (typeof XLSX === "undefined") {
      toast(tr("Excel 组件尚未加载，请刷新页面后重试。", "The Excel component has not loaded. Refresh the page and try again."), "warning");
      return;
    }
    const rows = currentLanguage() === "en"
      ? [
          ["Word", "Part of speech", "English definition", "Chinese meaning"],
          ["abandon", "verb", "to leave someone or something and never return", "放弃；抛弃；离弃"],
          ["abnormal", "adjective", "different from what is usual or expected", "异常的；反常的；畸形的"],
          ["comment", "noun/verb", "a written or spoken remark expressing an opinion", "评论；注释；发表意见"],
        ]
      : [
          ["英文单词", "词性", "英文解释", "中文解释"],
          ["abandon", "verb", "to leave someone or something and never return", "放弃；抛弃；离弃"],
          ["abnormal", "adjective", "different from what is usual or expected", "异常的；反常的；畸形的"],
          ["comment", "noun/verb", "a written or spoken remark expressing an opinion", "评论；注释；发表意见"],
        ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 52 }, { wch: 34 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Words");
    XLSX.writeFile(workbook, "aster-vocab-template.xlsx");
  };

  const progressPercent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const readyCards = generated.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={handleClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 12, scale: 0.985, filter: "blur(6px)" }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="liquid-glass-strong relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-[900px] flex-col overflow-hidden rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <Kicker>{tr("// 词卡导入", "// Word intake")}</Kicker>
            <h2 id="import-title" className="mt-2 font-heading text-3xl italic leading-none tracking-[-1px] sm:text-4xl">{tr("打开气闸。", "Open the airlock.")}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-white/35 sm:inline">
              {tr("Excel → 词卡", "Excel → cards")}
            </span>
            <button type="button" onClick={handleClose} aria-label={tr("关闭导入", "Close import")} className="grid h-9 w-9 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white">
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="glass-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {stage === "upload" && (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-white/80">{tr("把单词表拖进来，或从本地选择 Excel。", "Drop a word list here, or choose an Excel file from your device.")}</p>
                  <p className="mt-1 text-[11px] text-white/40">{tr("读取第一张工作表，自动识别表头并过滤空行与重复词。", "Reads the first worksheet, detects headers, and filters blank or duplicate rows.")}</p>
                </div>
                <button type="button" onClick={handleDownloadTemplate} className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-3 py-2 text-[10px] text-white/55 transition-colors hover:bg-white/10 hover:text-white">
                  <Icon name="download" className="h-3.5 w-3.5" />
                  {tr("下载模板", "Download template")}
                </button>
              </div>

              <label
                htmlFor="aster-excel-input"
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                className={`mt-5 flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-6 py-10 text-center transition-colors ${
                  isDragging ? "border-white/60 bg-white/[0.12]" : "border-white/20 bg-white/[0.025] hover:border-white/40 hover:bg-white/[0.055]"
                }`}
              >
                <span className="liquid-glass grid h-14 w-14 place-items-center rounded-full">
                  {parsing ? <Icon name="loader" className="h-5 w-5" /> : <Icon name="upload" className="h-5 w-5" />}
                </span>
                <span className="mt-4 font-heading text-2xl italic">{parsing ? tr("正在读取词表…", "Reading the manifest…") : tr("把词表放在这里", "Drop your lexicon here")}</span>
                <span className="mt-2 max-w-sm text-[11px] font-light leading-relaxed text-white/45">
                  {tr(".xlsx · .xls · .csv，最大 12MB。支持英文单词 / 词性 / 英文解释 / 中文解释四列。", ".xlsx · .xls · .csv, up to 12 MB. Supports Word / Part of speech / English definition / Chinese meaning.")}
                </span>
                <span className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-medium text-black">{tr("选择文件", "Choose file")}</span>
                <input
                  ref={fileInputRef}
                  id="aster-excel-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-[0.9rem] border border-white/15 bg-white/[0.045] px-3.5 py-3 text-[11px] leading-relaxed text-white/65">
                  <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {[
                  { letter: "A", label: tr("英文单词", "Word"), example: "abandon" },
                  { letter: "B", label: tr("词性", "Part of speech"), example: "verb" },
                  { letter: "C", label: tr("英文解释", "English definition"), example: "to leave…" },
                  { letter: "D", label: tr("中文解释", "Chinese meaning"), example: "放弃；抛弃" },
                ].map((column) => (
                  <div key={column.letter} className="rounded-[0.8rem] border border-white/10 bg-white/[0.025] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">{column.letter} · {column.label}</p>
                    <p className="mt-1 truncate text-[10px] text-white/50">{column.example}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "preview" && parsed && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl italic leading-tight">{parsed.fileName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="liquid-glass rounded-full px-2.5 py-1 text-[10px] text-white/55">{tr(`${parsed.cards.length} 个单词`, `${parsed.cards.length} ${parsed.cards.length === 1 ? "word" : "words"}`)}</span>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/40">{tr("工作表", "Sheet")} · {parsed.sheetName}</span>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/40">{parsed.hasHeaders ? tr("已识别表头", "Headers detected") : tr("按 A–D 列读取", "Read by columns A–D")}</span>
                  </div>
                </div>
                <button type="button" onClick={reset} className="text-[10px] text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white">
                  {tr("重新选择", "Choose another")}
                </button>
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-[0.9rem] border border-white/15 bg-white/[0.045] px-3.5 py-3 text-[11px] leading-relaxed text-white/65">
                  <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10">
                <div className="grid grid-cols-[1.1fr_.6fr_1.4fr_1.2fr] gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-white/35">
                  <span>{tr("单词", "Word")}</span>
                  <span>{tr("词性", "POS")}</span>
                  <span>{tr("英文释义", "English")}</span>
                  <span>{tr("中文释义", "Chinese")}</span>
                </div>
                <div className="glass-scroll max-h-[230px] overflow-y-auto">
                  {parsed.cards.slice(0, 20).map((card) => (
                    <div key={card.id} className="grid grid-cols-[1.1fr_.6fr_1.4fr_1.2fr] gap-2 border-b border-white/[0.06] px-3 py-2 text-[11px] last:border-0">
                      <span className="truncate font-medium text-white/85">{card.word}</span>
                      <span className="truncate text-white/45">{card.rawPos || "—"}</span>
                      <span className="truncate font-light text-white/50">{card.en || "—"}</span>
                      <span className="truncate text-white/60">{card.zh || "—"}</span>
                    </div>
                  ))}
                  {parsed.cards.length > 20 && (
                    <p className="px-3 py-2 text-[10px] text-white/30">{tr(`还有 ${parsed.cards.length - 20} 个单词未显示…`, `${parsed.cards.length - 20} more words not shown…`)}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-[1.1rem] border border-white/10 bg-white/[0.035] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="liquid-glass grid h-9 w-9 shrink-0 place-items-center rounded-full">
                    <Icon name={aiConfigured ? "sparkles" : "key"} className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] text-white/75">{aiConfigured ? tr("AI 词卡增强已就绪", "AI card enhancement ready") : tr("DeepSeek 尚未接入", "DeepSeek is not connected")}</p>
                    <p className="mt-1 max-w-lg text-[10px] leading-relaxed text-white/40">
                      {aiConfigured
                        ? tr("AI 会规范词性、补全词义边界、生成记忆钩子和标签；原始释义不会被随意改写。", "AI normalizes parts of speech, tightens meaning boundaries, and adds memory hooks and tags. Original definitions are not rewritten casually.")
                        : tr("不接入 AI 也可以生成词卡。连接后可为每个词补全记忆钩子、标签和难度。", "You can build cards without AI. Connect it to add memory hooks, tags, and difficulty.")}
                    </p>
                  </div>
                </div>
                {!aiConfigured && (
                  <button type="button" onClick={onOpenSettings} className="shrink-0 rounded-full border border-white/20 px-3 py-2 text-[10px] text-white/60 hover:bg-white/10 hover:text-white">
                    {tr("去接入 DeepSeek", "Connect DeepSeek")}
                  </button>
                )}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[9px] leading-relaxed text-white/30">
                  {(() => {
                    const duplicateCountInDeck = parsed.cards.filter((card) => existingSet.has(normalizeWord(card.word))).length;
                    return tr(
                      `将跳过已在词库中的 ${duplicateCountInDeck} 个重复词。`,
                      duplicateCountInDeck === 0
                        ? "No duplicate words from this file are already in your lexicon."
                        : `${duplicateCountInDeck} duplicate ${duplicateCountInDeck === 1 ? "word is" : "words are"} already in your lexicon and will be skipped.`
                    );
                  })()}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={handleRawGenerate} className={`${BTN_GLASS} px-4 py-2.5 text-xs`}>
                    {tr("直接生成词卡", "Build cards directly")}
                  </button>
                  <button type="button" onClick={handleAiGenerate} className={`${BTN_PRIMARY} px-5`}>
                    <Icon name="sparkles" className="h-4 w-4" />
                    {aiConfigured ? tr("AI 解析并生成", "Parse & build with AI") : tr("接入 AI 后生成", "Connect AI to build")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {stage === "generating" && (
            <div className="flex min-h-[330px] flex-col items-center justify-center px-4 text-center">
              <div className="liquid-glass grid h-16 w-16 place-items-center rounded-full">
                <Icon name="loader" className="h-6 w-6" />
              </div>
              <p className="mt-5 font-heading text-3xl italic">{tr("正在构建词卡。", "Constructing word cards.")}</p>
              <p className="mt-2 max-w-md text-[11px] font-light leading-relaxed text-white/45">
                {tr("DeepSeek 正在逐批分析词性、释义与记忆钩子。请保持本页打开。", "DeepSeek is analysing parts of speech, meanings, and memory hooks in batches. Keep this page open.")}
              </p>
              <div className="mt-7 w-full max-w-md">
                <div className="flex items-center justify-between text-[10px] text-white/45">
                  <span>{tr(`${progress.done} / ${progress.total} 已处理`, `${progress.done} / ${progress.total} processed`)}</span>
                  <span className="tabular-nums">{progressPercent}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-white" animate={{ width: `${Math.max(4, progressPercent)}%` }} transition={{ duration: 0.4 }} />
                </div>
                <div className="shimmer-line mt-3 h-px rounded-full" />
              </div>
              <button type="button" onClick={handleCancelGeneration} className={`${BTN_GLASS} mt-8 px-4 py-2 text-[11px]`}>
                {tr("取消解析", "Cancel parsing")}
              </button>
            </div>
          )}

          {stage === "ready" && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-3xl italic leading-tight">
                    {aiMeta?.source === "ai" ? tr("AI 词卡，准备入轨。", "AI cards, ready for orbit.") : tr("词卡，准备入轨。", "Cards, ready for orbit.")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="liquid-glass rounded-full px-2.5 py-1 text-[10px] text-white/55">{tr(`${generated.length} 张词卡`, `${generated.length} cards`)}</span>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/40">{tr(`${newCount} 张将加入词库`, `${newCount} will be added`)}</span>
                    {duplicateCount > 0 && <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/40">{tr(`跳过 ${duplicateCount} 张重复`, `${duplicateCount} duplicates skipped`)}</span>}
                    {aiMeta?.source === "ai" && <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] text-white/55">{tr("DeepSeek 增强", "DeepSeek enhanced")}</span>}
                  </div>
                </div>
                <button type="button" onClick={reset} className="text-[10px] text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white">
                  {tr("重新导入", "Start over")}
                </button>
              </div>

              {aiMeta?.source === "ai" && aiMeta.failedChunks > 0 && (
                <div className="mt-3 rounded-[0.9rem] border border-white/15 bg-white/[0.045] px-3.5 py-3 text-[10px] leading-relaxed text-white/55">
                  {tr("部分批次未能完成 AI 增强，这些词保留了原始释义。你仍可以导入，稍后在词库中重试。", "Some batches could not be enhanced by AI and kept their original meanings. You can still import them and try again later.")}
                </div>
              )}

              <div className="glass-scroll mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {readyCards.map((card) => (
                  <div key={card.id} className="rounded-[0.95rem] border border-white/10 bg-white/[0.035] px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-heading text-2xl italic leading-none">{card.word}</span>
                        <span className="text-[9px] uppercase tracking-[0.1em] text-white/30">{posLabelList(card.pos)}</span>
                      </div>
                      {card.enriched && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/40">{tr("AI 增强", "AI enriched")}</span>}
                    </div>
                    <p className="mt-2 text-[11px] text-white/60">{card.zh || "—"}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] font-light text-white/35">{card.en || "—"}</p>
                    {wordMemoryTip(card) && (
                      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/45">
                        <span className="text-white/30">{tr("记忆钩子", "Memory hook")} · </span>{wordMemoryTip(card)}
                      </p>
                    )}
                  </div>
                ))}
                {generated.length > 8 && (
                  <p className="px-2 py-1 text-[10px] text-white/30">{tr(`还有 ${generated.length - 8} 张词卡会在导入后出现…`, `${generated.length - 8} more cards will appear after importing…`)}</p>
                )}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[9px] leading-relaxed text-white/30">
                  {tr("导入后可在词库中逐张检查、练习或删除。", "After importing, inspect, practise, or delete each card in your lexicon.")}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={handleClose} className={`${BTN_GLASS} px-4 py-2.5 text-xs`}>{tr("取消", "Cancel")}</button>
                  <button
                    type="button"
                    onClick={() => onSave(generated)}
                    className={`${BTN_PRIMARY} px-5`}
                    disabled={generated.length === 0}
                  >
                    {tr("加入词库", "Add to lexicon")}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

function ToastStack({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-20 left-4 z-[120] flex w-[min(calc(100vw-2rem),22rem)] flex-col gap-2 sm:bottom-24 sm:left-6" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toastItem) => (
          <motion.div
            key={toastItem.id}
            layout
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            transition={{ duration: 0.25 }}
            className="liquid-glass-strong flex items-start gap-3 rounded-[1.05rem] px-4 py-3"
          >
            <Icon name={toastItem.tone === "warning" ? "alert" : toastItem.tone === "success" ? "check" : "sparkles"} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/65" />
            <p className="text-[11px] font-light leading-relaxed text-white/80">{toastItem.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden="true">
      <div className="absolute inset-0 opacity-40">
        <FadingVideo src={HERO_VIDEO} className="h-full w-full object-cover" />
      </div>
      <div className="fine-grid absolute inset-0 opacity-25" />
    </div>
  );
}

function buildSessionQueue(sourceWords, attempts) {
  const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
  return shuffled
    .map((word) => {
      const mastery = wordMastery(word, attempts);
      return {
        ...word,
        __sortKey: mastery.attempts === 0 ? -1 : mastery.overall ?? 101,
      };
    })
    .sort((a, b) => a.__sortKey - b.__sortKey)
    .map(({ __sortKey, ...word }) => word);
}

function sanitizeIncomingCard(card) {
  const word = String(card.word || "").trim().slice(0, 80);
  if (!word) return null;
  const pos = normalizePos(card.pos || card.rawPos);
  return {
    id: card.id || uid("word"),
    word,
    pos: pos.length ? pos : ["other"],
    rawPos: String(card.rawPos || "").trim(),
    en: String(card.en || "").trim(),
    zh: String(card.zh || "").trim(),
    memoryTip: String(card.memoryTip || "").trim().slice(0, 160),
    tags: normalizeStringArray(card.tags, 5),
    difficulty: Math.round(clamp(Number(card.difficulty) || 2, 1, 3)),
    source: card.enriched ? "ai" : card.source === "sample" ? "sample" : "import",
    createdAt: Date.now(),
  };
}

function App() {
  const [data, setData] = useState(loadAppData);
  setActiveLanguage(data.settings.language || "zh");
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["library", "insights"].includes(hash) ? hash : "home";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [session, setSession] = useState({
    queue: [],
    index: 0,
    attempts: [],
    result: null,
    finished: false,
    startedAt: null,
  });
  const [coachBusy, setCoachBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const storageWarningRef = useRef(false);
  const toastTimersRef = useRef(new Set());

  const toast = useCallback((message, tone = "info") => {
    const id = uid("toast");
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
      toastTimersRef.current.delete(timer);
    }, 4400);
    toastTimersRef.current.add(timer);
  }, []);

  useEffect(() => () => {
    toastTimersRef.current.forEach((timer) => clearTimeout(timer));
    toastTimersRef.current.clear();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
      storageWarningRef.current = false;
    } catch (error) {
      if (!storageWarningRef.current) {
        storageWarningRef.current = true;
        toast(tr("浏览器存储空间不足，学习记录可能无法持久保存。", "Browser storage is full; your progress may not be saved."), "warning");
      }
    }
  }, [data, toast]);

  useEffect(() => {
    const language = data.settings.language || "zh";
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title = language === "en" ? "Aster · Lexicon Voyage" : "Aster 词航 · Lexicon Voyage";
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", tr(
        "Aster 词航 — 用 DeepSeek 语义批改、智能词卡与学习星图，记住每一个单词。",
        "Aster — learn every word with DeepSeek semantic review, smart word cards, and a mastery star map."
      ));
    }
  }, [data.settings.language]);

  useEffect(() => {
    const hash = view === "home" ? "" : `#${view}`;
    const nextUrl = hash || `${window.location.pathname}${window.location.search}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [view]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (!settingsOpen && !importOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (settingsOpen) {
        setSettingsOpen(false);
      } else {
        setImportOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen, importOpen]);

  const summary = useMemo(() => buildSummary(data.words, data.attempts), [data.words, data.attempts, data.settings.language]);
  const aiConfigured = Boolean(data.settings.apiKey?.trim());

  const startSession = useCallback((subset = null) => {
    const sourceWords = Array.isArray(subset) && subset.length ? subset : data.words;
    if (!sourceWords.length) {
      setImportOpen(true);
      toast(tr("词库为空。先导入一份 Excel 词表，才能开启航程。", "Your lexicon is empty. Import an Excel word list to begin a voyage."), "info");
      return;
    }
    const queue = buildSessionQueue(sourceWords, data.attempts);
    setSession({
      queue,
      index: 0,
      attempts: [],
      result: null,
      finished: false,
      startedAt: Date.now(),
    });
    setView("study");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [data.words, data.attempts, toast]);

  const beginOrResumeStudy = useCallback(() => {
    if (!data.words.length) {
      setImportOpen(true);
      toast(tr("导入词表后即可开始练习。", "Import a word list to start practising."), "info");
      return;
    }
    if (session.queue.length && !session.finished) {
      setView("study");
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    startSession();
  }, [data.words.length, session.queue.length, session.finished, startSession, toast]);

  const handleNavigate = useCallback((id) => {
    if (id === "study") {
      beginOrResumeStudy();
      return;
    }
    if (id === "home") {
      setView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id === "library" || id === "insights") {
      setView(id);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [beginOrResumeStudy]);

  const goHome = useCallback(() => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleCompleteAttempt = useCallback((attempt) => {
    setData((current) => ({ ...current, attempts: [...current.attempts, attempt] }));
    setSession((current) => ({
      ...current,
      result: attempt,
      attempts: [...current.attempts, attempt],
    }));
  }, []);

  const handleNext = useCallback(() => {
    setSession((current) => {
      if (!current.queue.length) return current;
      if (current.index + 1 >= current.queue.length) {
        return { ...current, finished: true, result: null };
      }
      return { ...current, index: current.index + 1, result: null };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteWord = useCallback((wordId) => {
    setData((current) => ({
      ...current,
      words: current.words.filter((word) => word.id !== wordId),
      attempts: current.attempts.filter((attempt) => attempt.wordId !== wordId),
    }));
    setSession((current) => {
      const queue = current.queue.filter((word) => word.id !== wordId);
      if (!queue.length) {
        return { ...current, queue, index: 0, result: null, attempts: current.attempts.filter((attempt) => attempt.wordId !== wordId) };
      }
      return {
        ...current,
        queue,
        index: Math.min(current.index, queue.length - 1),
        result: current.result?.wordId === wordId ? null : current.result,
        attempts: current.attempts.filter((attempt) => attempt.wordId !== wordId),
      };
    });
  }, []);

  const handleImportSave = useCallback((cards) => {
    const existing = new Set(data.words.map((word) => normalizeWord(word.word)));
    const incoming = [];
    const seen = new Set();
    cards.forEach((card) => {
      const sanitized = sanitizeIncomingCard(card);
      if (!sanitized) return;
      const key = normalizeWord(sanitized.word);
      if (existing.has(key) || seen.has(key)) return;
      seen.add(key);
      incoming.push(sanitized);
    });

    if (!incoming.length) {
      setImportOpen(false);
      toast(tr("这些单词已经在词库中，没有新增词卡。", "These words are already in your lexicon. No new cards were added."), "info");
      return;
    }

    setData((current) => ({ ...current, words: [...current.words, ...incoming] }));
    setImportOpen(false);
    setView("library");
    toast(tr(`${incoming.length} 张词卡已进入轨道，可以开始练习了。`, `${incoming.length} ${incoming.length === 1 ? "card is" : "cards are"} now in orbit. Ready to practise.`), "success");
  }, [data.words, toast]);

  const handleSaveSettings = useCallback((nextSettings) => {
    setData((current) => ({ ...current, settings: { ...current.settings, ...nextSettings } }));
  }, []);

  const handleLanguageChange = useCallback((language) => {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, language: language === "en" ? "en" : "zh" },
    }));
    setToasts([]);
  }, []);

  const handleGenerateCoach = useCallback(async () => {
    if (!aiConfigured) {
      setSettingsOpen(true);
      return;
    }
    if (!summary.attemptedCount) {
      toast(tr("完成至少一轮练习后，AI 才能生成学习诊断。", "Complete at least one practice round before AI can generate a diagnosis."), "info");
      return;
    }
    setCoachBusy(true);
    try {
      const note = await generateCoachNote(summary, data.words, data.attempts, data.settings);
      setData((current) => ({ ...current, coachNote: note }));
      toast(tr("AI 学习诊断已生成。", "AI learning diagnosis generated."), "success");
    } catch (error) {
      toast(tr(`AI 诊断失败：${error.message}`, `AI diagnosis failed: ${error.message}`), "warning");
    } finally {
      setCoachBusy(false);
    }
  }, [aiConfigured, summary, data.words, data.attempts, data.settings, toast]);

  let content = null;
  if (view === "home") {
    content = (
      <HomePage
        summary={summary}
        onBeginStudy={beginOrResumeStudy}
        onImport={() => setImportOpen(true)}
        onNavigate={handleNavigate}
      />
    );
  } else if (view === "library") {
    content = (
      <LibraryPage
        words={data.words}
        summary={summary}
        onPracticeWord={(word) => startSession([word])}
        onStartStudy={beginOrResumeStudy}
        onImport={() => setImportOpen(true)}
        onDeleteWord={handleDeleteWord}
        toast={toast}
      />
    );
  } else if (view === "insights") {
    content = (
      <InsightsPage
        summary={summary}
        words={data.words}
        coachNote={data.coachNote}
        coachBusy={coachBusy}
        aiConfigured={aiConfigured}
        onGenerateCoach={handleGenerateCoach}
        onOpenSettings={() => setSettingsOpen(true)}
        onStartStudy={beginOrResumeStudy}
        onPracticeWord={(word) => startSession([word])}
        onImport={() => setImportOpen(true)}
      />
    );
  } else if (view === "study") {
    content = (
      <StudyPage
        session={session}
        aiConfigured={aiConfigured}
        settings={data.settings}
        onExit={goHome}
        onCompleteAttempt={handleCompleteAttempt}
        onNext={handleNext}
        onStartSession={() => startSession()}
        onGoInsights={() => setView("insights")}
        onHome={goHome}
        onImport={() => setImportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        toast={toast}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feImage
            href={DISPLACEMENT_MAP_DATA_URL}
            result="map"
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <Navbar
        view={view}
        onNavigate={handleNavigate}
        onImport={() => setImportOpen(true)}
        onBegin={beginOrResumeStudy}
        openImport={importOpen}
      />

      {view !== "home" && <AmbientBackdrop />}
      {content}

      <SettingsFab configured={aiConfigured} onClick={() => setSettingsOpen(true)} />

      <AnimatePresence>
        {importOpen && (
          <ImportModal
            key="import-modal"
            existingWords={data.words}
            settings={data.settings}
            aiConfigured={aiConfigured}
            onClose={() => setImportOpen(false)}
            onSave={handleImportSave}
            onOpenSettings={() => setSettingsOpen(true)}
            toast={toast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            key="settings-modal"
            settings={data.settings}
            onClose={() => setSettingsOpen(false)}
            onSave={handleSaveSettings}
            onLanguageChange={handleLanguageChange}
            toast={toast}
          />
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
