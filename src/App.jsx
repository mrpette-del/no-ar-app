import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Upload, Music2, MessageSquareText, CalendarClock, Radio, ChevronRight, ChevronLeft,
  Check, Loader2, Image as ImageIcon, Video as VideoIcon, Play,
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Sparkles, Clock, RefreshCw,
  Instagram, SlidersHorizontal, RotateCw, Crop
} from "lucide-react";

/* ---------- design tokens ----------
  bg deep:    #17181B   (sala de controlo, tom suavizado)
  bg panel:   #1F2226
  bg raised:  #262A30
  signal red: #E8402A   (luz "no ar")
  amber:      #FFB020   (tally secundário)
  steel:      #8B92A0
  warm text:  #F1F0EC
  hairline:   rgba(255,255,255,0.08)
------------------------------------- */

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
];

const TONES = [
  { id: "genuino", label: "Genuíno" },
  { id: "profissional", label: "Profissional" },
  { id: "divertido", label: "Divertido" },
  { id: "inspirador", label: "Inspirador" },
  { id: "elegante", label: "Elegante" },
];

const MOODS = [
  { id: "energetico", label: "Energético" },
  { id: "calmo", label: "Calmo / elegante" },
  { id: "divertido", label: "Divertido / leve" },
  { id: "epico", label: "Épico / aspiracional" },
];

const PLAYLISTS = {
  energetico: [
    { title: "Arranque", artist: "Sinal Aberto", mood: "eletrónica · pulsante", bpm: 128 },
    { title: "Contagem Decrescente", artist: "Estúdio 4", mood: "pop · animado", bpm: 122 },
    { title: "Primeira Fila", artist: "Rádio Norte", mood: "energia alta", bpm: 132 },
    { title: "Impulso", artist: "Antena Viva", mood: "eletrónica · directo", bpm: 126 },
  ],
  calmo: [
    { title: "Luz Suave", artist: "Estúdio 4", mood: "lo-fi · sereno", bpm: 82 },
    { title: "Enquadramento", artist: "Antena Viva", mood: "acústico · minimal", bpm: 76 },
    { title: "Segundo Take", artist: "Sinal Aberto", mood: "piano · calmo", bpm: 70 },
    { title: "Pausa", artist: "Rádio Norte", mood: "ambiente · suave", bpm: 68 },
  ],
  divertido: [
    { title: "Nos Bastidores", artist: "Rádio Norte", mood: "pop · leve", bpm: 110 },
    { title: "Take Dois", artist: "Estúdio 4", mood: "divertido · groove", bpm: 104 },
    { title: "Sorriso Aberto", artist: "Antena Viva", mood: "descontraído", bpm: 100 },
    { title: "Improviso", artist: "Sinal Aberto", mood: "leve · alegre", bpm: 108 },
  ],
  epico: [
    { title: "Grande Plano", artist: "Sinal Aberto", mood: "cinemático · build-up", bpm: 90 },
    { title: "No Ar", artist: "Antena Viva", mood: "épico · orquestral", bpm: 96 },
    { title: "Última Cena", artist: "Estúdio 4", mood: "intenso · crescendo", bpm: 92 },
    { title: "Transmissão", artist: "Rádio Norte", mood: "épico · sintetizadores", bpm: 98 },
  ],
};

const BEST_TIMES = {
  instagram: { days: [2, 4], hour: 10, note: "terças e quintas, entre as 9h e as 12h" },
  tiktok: { days: [2, 3, 4], hour: 19, note: "dias úteis, entre as 18h e as 21h" },
  facebook: { days: [2, 3, 4], hour: 11, note: "meio da manhã em dias úteis" },
};

// Formato de imagem/vídeo recomendado por rede social, para pré-selecionar o
// enquadramento certo automaticamente no passo de Edição.
const PLATFORM_ASPECT = {
  instagram: "4:5",
  tiktok: "9:16",
  facebook: "1:1",
};

const EDIT_PRESETS = [
  { id: "original", label: "Original", brightness: 100, contrast: 100, saturation: 100, hue: 0, sepia: 0 },
  { id: "vivido", label: "Vívido", brightness: 108, contrast: 118, saturation: 135, hue: 0, sepia: 0 },
  { id: "bw", label: "Mono P&B", brightness: 100, contrast: 112, saturation: 0, hue: 0, sepia: 0 },
  { id: "quente", label: "Quente", brightness: 104, contrast: 104, saturation: 112, hue: -6, sepia: 0.12 },
  { id: "frio", label: "Frio", brightness: 100, contrast: 106, saturation: 105, hue: 8, sepia: 0 },
  { id: "contraste", label: "Contraste", brightness: 98, contrast: 135, saturation: 108, hue: 0, sepia: 0 },
];

const ASPECTS = [
  { id: "1:1", label: "1:1", ratio: "1 / 1" },
  { id: "4:5", label: "4:5", ratio: "4 / 5" },
  { id: "9:16", label: "9:16", ratio: "9 / 16" },
  { id: "16:9", label: "16:9", ratio: "16 / 9" },
];

const DEMO_IMAGE_URL = "https://picsum.photos/id/1080/900/1125";

const STAGES = [
  { id: 1, label: "Carregar", icon: Upload },
  { id: 2, label: "Edição", icon: SlidersHorizontal },
  { id: 3, label: "Legenda", icon: MessageSquareText },
  { id: 4, label: "Som", icon: Music2 },
  { id: 5, label: "Agendar", icon: CalendarClock },
  { id: 6, label: "Publicar", icon: Radio },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function nextBestSlot(platform, fromDate = new Date()) {
  const rule = BEST_TIMES[platform] || BEST_TIMES.instagram;
  const d = new Date(fromDate);
  d.setDate(d.getDate() + 1);
  d.setHours(rule.hour, 0, 0, 0);
  for (let i = 0; i < 10; i++) {
    if (rule.days.includes(d.getDay())) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPtDate(date) {
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const pad = (n) => String(n).padStart(2, "0");
  return `${dias[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}h${pad(date.getMinutes())}`;
}

function filterString(edit) {
  return `brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%) hue-rotate(${edit.hue}deg) sepia(${edit.sepia})`;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaURL, setMediaURL] = useState(DEMO_IMAGE_URL);
  const [mediaType, setMediaType] = useState("image");
  const [isDemo, setIsDemo] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [platform, setPlatform] = useState("instagram");

  const [edit, setEdit] = useState({ ...EDIT_PRESETS[0], aspect: "4:5", rotate: 0, preset: "original" });

  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("genuino");

  const [mood, setMood] = useState("energetico");
  const [track, setTrack] = useState(null);

  const [captions, setCaptions] = useState([]);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [customCaption, setCustomCaption] = useState("");
  const [loadingCaptions, setLoadingCaptions] = useState(false);
  const [captionError, setCaptionError] = useState(null);

  const [schedule, setSchedule] = useState(() => nextBestSlot("instagram"));
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    setMediaFile(file);
    setMediaType(type);
    setMediaURL(URL.createObjectURL(file));
    setIsDemo(false);
    setCaptions([]);
    setCaptionIdx(0);
    setCustomCaption("");
    setEdit({ ...EDIT_PRESETS[0], aspect: PLATFORM_ASPECT[platform] || "4:5", rotate: 0, preset: "original" });
  }, [platform]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const changePlatform = (id) => {
    setPlatform(id);
    setSchedule(nextBestSlot(id));
    setEdit((e) => ({ ...e, aspect: PLATFORM_ASPECT[id] || e.aspect }));
  };

  const generateCaptions = useCallback(async () => {
    setLoadingCaptions(true);
    setCaptionError(null);
    try {
      const toneInfo = TONES.find((t) => t.id === tone);
      const platformInfo = PLATFORMS.find((p) => p.id === platform);
      const sysPrompt = `Escreves legendas para redes sociais em português de Portugal.
Plataforma: ${platformInfo.label}. Tom de voz: ${toneInfo.label} — nunca genérico ou corporativo por defeito, adapta-te sempre ao tom pedido.
Contexto do negócio/conteúdo dado pelo utilizador: "${category || "não especificado — usa uma legenda genérica mas cativante"}".
Estrutura de cada legenda: 1-3 frases relevantes ao conteúdo, seguido de uma linha em branco e 5-8 hashtags relevantes.
Devolve APENAS um array JSON de 3 strings (as 3 legendas), sem markdown, sem texto antes ou depois. Exemplo: ["legenda 1", "legenda 2", "legenda 3"]`;

      const userContent = [];
      if (mediaType === "image" && mediaFile) {
        const base64 = await fileToBase64(mediaFile);
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: mediaFile.type, data: base64 },
        });
      }
      userContent.push({
        type: "text",
        text: mediaType === "video"
          ? "O conteúdo é um vídeo. Gera 3 legendas variadas para este conteúdo com base no contexto dado."
          : mediaFile
          ? "Analisa a imagem anexada e gera 3 legendas variadas para este conteúdo."
          : "Esta é apenas uma imagem de demonstração para testar a app — ignora o seu conteúdo visual e gera 3 legendas variadas com base apenas no contexto de negócio dado.",
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: sysPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim()
        .replace(/^```json\s*|^```\s*|```$/g, "");
      const parsed = JSON.parse(text);
      setCaptions(parsed);
      setCaptionIdx(0);
      setCustomCaption(parsed[0] || "");
    } catch (err) {
      setCaptionError("Não foi possível gerar legendas agora. Tenta novamente.");
    } finally {
      setLoadingCaptions(false);
    }
  }, [mediaFile, mediaType, category, tone, platform]);

  const canNext = useMemo(() => {
    if (step === 1) return !!mediaURL;
    if (step === 3) return customCaption.trim().length > 0;
    if (step === 4) return !!track;
    return true;
  }, [step, mediaFile, track, customCaption]);

  const goNext = () => setStep((s) => Math.min(6, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
    }, 1400);
  };

  return (
    <div
      style={{
        background: "#17181B",
        color: "#F1F0EC",
        minHeight: "100vh",
        overflowX: "hidden",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .osw { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; }
        ::selection { background: #E8402A; color: #0F1115; }
        input[type="text"]::placeholder, textarea::placeholder { color: #565C66; }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes tallyPulse { 0%,100% { box-shadow: 0 0 8px 2px rgba(232,64,42,0.7); } 50% { box-shadow: 0 0 16px 6px rgba(232,64,42,0.9); } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #E8402A; cursor: pointer; }
      `}</style>

      {/* HEADER */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: published ? "#E8402A" : "#3A3E46",
              animation: published ? "tallyPulse 1.6s ease-in-out infinite" : "none",
            }}
          />
          <span className="osw" style={{ fontSize: 22, fontWeight: 700, textTransform: "uppercase" }}>
            No Ar
          </span>
          <span className="noar-tagline" style={{ color: "#8B92A0", fontSize: 13, marginLeft: 6 }}>
            gestão de conteúdo para redes sociais
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#8B92A0", display: "flex", alignItems: "center", gap: 6 }}>
          {published ? <span style={{ color: "#E8402A" }} className="osw">● NO AR</span> : "em estúdio"}
        </div>
      </header>

      {/* MAIN GRID */}
      <div
        style={{
          maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px",
          display: "grid", gridTemplateColumns: "180px 1fr 340px",
          gridTemplateAreas: `"sidebar content preview"`, gap: 32,
        }}
        className="noar-grid"
      >
        <div style={{ gridArea: "sidebar", minWidth: 0 }}>
          <VerticalPipeline step={step} setStep={setStep} />
        </div>

        <div style={{ gridArea: "content", minWidth: 0 }}>
          {step === 1 && (
            <StepUpload
              dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop}
              fileInputRef={fileInputRef} handleFile={handleFile}
              mediaURL={mediaURL} mediaType={mediaType} isDemo={isDemo}
              platform={platform} setPlatform={changePlatform}
            />
          )}
          {step === 2 && (
            <StepEdit mediaURL={mediaURL} mediaType={mediaType} edit={edit} setEdit={setEdit} platform={platform} />
          )}
          {step === 3 && (
            <StepCaption
              loading={loadingCaptions} error={captionError} captions={captions}
              captionIdx={captionIdx} setCaptionIdx={setCaptionIdx}
              customCaption={customCaption} setCustomCaption={setCustomCaption}
              onGenerate={generateCaptions} hasMedia={!!mediaURL}
              category={category} setCategory={setCategory}
              tone={tone} setTone={setTone}
            />
          )}
          {step === 4 && <StepMusic mood={mood} setMood={setMood} track={track} setTrack={setTrack} />}
          {step === 5 && <StepSchedule schedule={schedule} setSchedule={setSchedule} platform={platform} />}
          {step === 6 && (
            <StepReady
              mediaType={mediaType} caption={customCaption} track={track} schedule={schedule}
              platform={platform} edit={edit} publishing={publishing} published={published} onPublish={handlePublish}
            />
          )}

          {step < 6 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button
                onClick={goBack} disabled={step === 1}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.14)",
                  color: step === 1 ? "#4A4E56" : "#F1F0EC", cursor: step === 1 ? "default" : "pointer", fontSize: 14,
                }}
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={goNext} disabled={!canNext} className="osw"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8,
                  background: canNext ? "#E8402A" : "#2A2E36",
                  border: "none", color: canNext ? "#0F1115" : "#6A6E76",
                  cursor: canNext ? "pointer" : "default", fontSize: 14, fontWeight: 600, textTransform: "uppercase",
                }}
              >
                Seguinte <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div style={{ gridArea: "preview", minWidth: 0 }}>
          <PhonePreview mediaURL={mediaURL} mediaType={mediaType} caption={customCaption} track={track} schedule={schedule} platform={platform} edit={edit} step={step} />
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .noar-grid {
            grid-template-columns: 56px 1fr !important;
            grid-template-areas: "sidebar content" "sidebar preview" !important;
            row-gap: 28px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            gap: 16px !important;
          }
          .noar-pipeline-label { display: none; }
          .noar-tagline { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- VERTICAL PIPELINE (LEFT SIDEBAR) ---------------- */
function VerticalPipeline({ step, setStep }) {
  const progressPct = ((step - 1) / (STAGES.length - 1)) * 100;
  return (
    <div
      className="noar-pipeline"
      style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: 2, alignSelf: "start" }}
    >
      <div
        style={{
          position: "absolute", top: 17, bottom: 17, left: 17, width: 2,
          background: "rgba(255,255,255,0.08)", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute", top: 17, left: 17, width: 2,
          background: "linear-gradient(180deg, #E8402A, #FFB020)",
          height: `calc(${progressPct}% * ${(STAGES.length - 1) / STAGES.length})`,
          zIndex: 0, transition: "height 0.4s ease",
        }}
      />
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const active = s.id === step;
        const done = s.id < step;
        return (
          <div
            key={s.id}
            onClick={() => done && setStep(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12, zIndex: 1,
              cursor: done ? "pointer" : "default",
              marginBottom: i < STAGES.length - 1 ? 26 : 0,
            }}
          >
            <div
              style={{
                width: 34, height: 34, minWidth: 34, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active || done ? "#E8402A" : "#1F2226",
                border: active || done ? "none" : "1px solid rgba(255,255,255,0.16)",
                boxShadow: active ? "0 0 0 4px rgba(232,64,42,0.18)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {done ? <Check size={15} color="#0F1115" /> : <Icon size={15} color={active ? "#0F1115" : "#8B92A0"} />}
            </div>
            <span
              className="osw noar-pipeline-label"
              style={{
                fontSize: 12, textTransform: "uppercase", whiteSpace: "nowrap",
                color: active ? "#F1F0EC" : "#8B92A0", fontWeight: active ? 600 : 400,
              }}
            >
              {String(s.id).padStart(2, "0")} {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- STEP 1: UPLOAD ---------------- */
function StepUpload({ dragOver, setDragOver, onDrop, fileInputRef, handleFile, mediaURL, mediaType, isDemo, platform, setPlatform }) {
  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Carregar imagem/vídeo</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 20 }}>Escolhe o ficheiro e a plataforma de destino.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          borderRadius: 12, background: dragOver ? "rgba(232,64,42,0.06)" : "#1F2226",
          border: `1px solid ${dragOver ? "#E8402A" : "rgba(255,255,255,0.1)"}`,
          padding: mediaURL ? 20 : 40, textAlign: "center", transition: "all 0.2s ease",
        }}
      >
        {mediaURL ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {isDemo && (
              <span
                className="osw"
                style={{
                  fontSize: 10.5, textTransform: "uppercase", color: "#FFB020",
                  border: "1px solid rgba(255,176,32,0.4)", borderRadius: 20, padding: "3px 10px",
                }}
              >
                Imagem de exemplo — só para testar a app
              </span>
            )}
            {mediaType === "image" ? (
              <img src={mediaURL} alt="preview" style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <video src={mediaURL} style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8 }} controls />
            )}
            <label
              htmlFor="no-ar-media-input"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600,
                color: "#E8402A", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer",
              }}
            >
              <ImageIcon size={13} /> Escolher outra da galeria
            </label>
          </div>
        ) : (
          <label
            htmlFor="no-ar-media-input"
            className="osw"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600,
              textTransform: "uppercase", color: "#0F1115", background: "#E8402A",
              padding: "12px 22px", borderRadius: 8, cursor: "pointer",
            }}
          >
            <Upload size={16} /> Carregar ficheiro
          </label>
        )}
        {!mediaURL && <div style={{ fontSize: 12, color: "#8B92A0", marginTop: 10 }}>JPG, PNG, MP4 — até 200MB</div>}
        <input
          id="no-ar-media-input"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", pointerEvents: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>


      <div style={{ marginTop: 26 }}>
        <span className="osw" style={{ fontSize: 13, textTransform: "uppercase", color: "#8B92A0" }}>Plataforma</span>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {PLATFORMS.map((p) => (
            <button
              key={p.id} onClick={() => setPlatform(p.id)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13,
                border: platform === p.id ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
                background: platform === p.id ? "rgba(232,64,42,0.1)" : "#1F2226",
                color: platform === p.id ? "#F1F0EC" : "#8B92A0", cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STEP 2: EDIT ---------------- */
function StepEdit({ mediaURL, mediaType, edit, setEdit, platform }) {
  const recommendedAspect = PLATFORM_ASPECT[platform];
  const applyPreset = (preset) => {
    setEdit((e) => ({ ...e, brightness: preset.brightness, contrast: preset.contrast, saturation: preset.saturation, hue: preset.hue, sepia: preset.sepia, preset: preset.id }));
  };
  const updateSlider = (key, value) => {
    setEdit((e) => ({ ...e, [key]: value, preset: "personalizado" }));
  };

  if (!mediaURL) {
    return (
      <div>
        <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Edição</h2>
        <p style={{ color: "#8B92A0", fontSize: 14 }}>Carrega primeiro uma imagem ou vídeo no passo anterior.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Edição</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 20 }}>Ajusta o enquadramento e a cor antes de continuar.</p>

      <div
        style={{
          width: "100%", maxWidth: 320, margin: "0 auto 22px", borderRadius: 12, overflow: "hidden",
          background: "#000", aspectRatio: ASPECTS.find((a) => a.id === edit.aspect)?.ratio || "4 / 5",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {mediaType === "image" ? (
          <img src={mediaURL} alt="edit preview" style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterString(edit), transform: `rotate(${edit.rotate}deg)` }} />
        ) : (
          <video src={mediaURL} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterString(edit), transform: `rotate(${edit.rotate}deg)` }} />
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <span className="osw" style={{ fontSize: 13, textTransform: "uppercase", color: "#8B92A0" }}>Filtro</span>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {EDIT_PRESETS.map((p) => (
            <button
              key={p.id} onClick={() => applyPreset(p)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13,
                border: edit.preset === p.id ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
                background: edit.preset === p.id ? "rgba(232,64,42,0.1)" : "#1F2226",
                color: edit.preset === p.id ? "#F1F0EC" : "#8B92A0", cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <span className="osw" style={{ fontSize: 13, textTransform: "uppercase", color: "#8B92A0" }}>
          Enquadramento {recommendedAspect && <span style={{ textTransform: "none", color: "#FFB020", fontWeight: 400 }}>· {recommendedAspect} recomendado para esta plataforma</span>}
        </span>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          {ASPECTS.map((a) => (
            <button
              key={a.id} onClick={() => setEdit((e) => ({ ...e, aspect: a.id }))}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 13,
                border: edit.aspect === a.id ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
                background: edit.aspect === a.id ? "rgba(232,64,42,0.1)" : "#1F2226",
                color: edit.aspect === a.id ? "#F1F0EC" : "#8B92A0", cursor: "pointer",
              }}
            >
              <Crop size={12} /> {a.label}{a.id === recommendedAspect ? " ★" : ""}
            </button>
          ))}
          <button
            onClick={() => setEdit((e) => ({ ...e, rotate: (e.rotate + 90) % 360 }))}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 13,
              border: "1px solid rgba(255,255,255,0.14)", background: "#1F2226", color: "#8B92A0", cursor: "pointer",
            }}
          >
            <RotateCw size={12} /> Rodar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SliderRow label="Brilho" value={edit.brightness} min={60} max={140} onChange={(v) => updateSlider("brightness", v)} />
        <SliderRow label="Contraste" value={edit.contrast} min={60} max={160} onChange={(v) => updateSlider("contrast", v)} />
        <SliderRow label="Saturação" value={edit.saturation} min={0} max={180} onChange={(v) => updateSlider("saturation", v)} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8B92A0", marginBottom: 6 }}>
        <span className="osw" style={{ textTransform: "uppercase" }}>{label}</span>
        <span>{value}%</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#E8402A" }}
      />
    </div>
  );
}

/* ---------------- STEP 3: CAPTION ---------------- */
function StepCaption({ loading, error, captions, captionIdx, setCaptionIdx, customCaption, setCustomCaption, onGenerate, hasMedia, category, setCategory, tone, setTone }) {
  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Legenda</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 18 }}>Dá contexto, escolhe o tom, e gera — ou escreve a tua.</p>

      <div style={{ marginBottom: 16 }}>
        <span className="osw" style={{ fontSize: 12, textTransform: "uppercase", color: "#8B92A0" }}>Sobre o teu negócio / conteúdo</span>
        <input
          type="text" value={category} onChange={(e) => setCategory(e.target.value)}
          placeholder="ex: café de especialidade em Lisboa, estúdio de yoga, loja de roupa vintage…"
          style={{
            width: "100%", marginTop: 8, background: "#1F2226", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 8, padding: "12px 14px", color: "#F1F0EC", fontSize: 14,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <span className="osw" style={{ fontSize: 12, textTransform: "uppercase", color: "#8B92A0" }}>Tom de voz</span>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {TONES.map((t) => (
            <button
              key={t.id} onClick={() => setTone(t.id)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13,
                border: tone === t.id ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
                background: tone === t.id ? "rgba(232,64,42,0.1)" : "#1F2226",
                color: tone === t.id ? "#F1F0EC" : "#8B92A0", cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate} disabled={loading || !hasMedia} className="osw"
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8,
          background: "#262A30", border: "1px solid rgba(232,64,42,0.4)", color: "#E8402A",
          cursor: loading ? "default" : "pointer", fontSize: 13, textTransform: "uppercase", marginBottom: 18,
        }}
      >
        {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={15} />}
        {loading ? "A gerar…" : captions.length ? "Gerar novamente" : "Gerar 3 legendas com IA"}
      </button>

      {error && <div style={{ color: "#FF8A65", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {captions.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {captions.map((c, i) => (
            <button
              key={i} onClick={() => { setCaptionIdx(i); setCustomCaption(c); }}
              style={{
                padding: "8px 14px", borderRadius: 20, fontSize: 12,
                border: captionIdx === i ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
                background: captionIdx === i ? "rgba(232,64,42,0.1)" : "transparent",
                color: captionIdx === i ? "#E8402A" : "#8B92A0", cursor: "pointer",
              }}
            >
              Versão {i + 1}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={customCaption} onChange={(e) => setCustomCaption(e.target.value)}
        placeholder="A tua legenda aparece aqui — gerada ou escrita à mão." rows={8}
        style={{
          width: "100%", background: "#1F2226", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
          padding: 14, color: "#F1F0EC", fontSize: 14, lineHeight: 1.5,
          fontFamily: "'IBM Plex Sans', sans-serif", resize: "vertical",
        }}
      />
    </div>
  );
}

/* ---------------- STEP 4: MUSIC ---------------- */
function StepMusic({ mood, setMood, track, setTrack }) {
  const list = PLAYLISTS[mood];
  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Som</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 16 }}>Escolhe a energia do conteúdo e depois a faixa.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMood(m.id); setTrack(null); }}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13,
              border: mood === m.id ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.14)",
              background: mood === m.id ? "rgba(232,64,42,0.1)" : "#1F2226",
              color: mood === m.id ? "#F1F0EC" : "#8B92A0", cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((t, i) => {
          const active = track?.title === t.title;
          return (
            <button
              key={i} onClick={() => setTrack(t)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10,
                border: active ? "1px solid #E8402A" : "1px solid rgba(255,255,255,0.1)",
                background: active ? "rgba(232,64,42,0.08)" : "#1F2226", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#E8402A" : "#262A30" }}>
                <Music2 size={15} color={active ? "#0F1115" : "#8B92A0"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title} <span style={{ color: "#8B92A0", fontWeight: 400 }}>· {t.artist}</span></div>
                <div style={{ fontSize: 12, color: "#8B92A0" }}>{t.mood} · {t.bpm} bpm</div>
              </div>
              {active && <Check size={16} color="#E8402A" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- STEP 5: SCHEDULE ---------------- */
function StepSchedule({ schedule, setSchedule, platform }) {
  const rule = BEST_TIMES[platform] || BEST_TIMES.instagram;
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label;
  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Agendar</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 20 }}>Escolhe quando isto vai para o ar.</p>

      <div style={{ background: "#1F2226", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 20, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <CalendarClock size={16} color="#FFB020" />
          <span className="osw" style={{ fontSize: 13, textTransform: "uppercase", color: "#FFB020" }}>Sugestão automática · {platformLabel}</span>
        </div>
        <p style={{ fontSize: 13, color: "#B7BCC5", lineHeight: 1.6 }}>
          No {platformLabel}, o alcance costuma ser maior em <b style={{ color: "#F1F0EC" }}>{rule.note}</b>. Marcámos o próximo horário ideal.
        </p>
        <button
          onClick={() => setSchedule(nextBestSlot(platform))}
          style={{
            marginTop: 12, display: "flex", alignItems: "center", gap: 6, background: "transparent",
            border: "1px solid rgba(255,255,255,0.14)", color: "#F1F0EC", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, cursor: "pointer",
          }}
        >
          <RefreshCw size={13} /> Recalcular
        </button>
      </div>

      <label className="osw" style={{ fontSize: 12, textTransform: "uppercase", color: "#8B92A0" }}>Data e hora de publicação</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <Clock size={16} color="#E8402A" />
        <input
          type="datetime-local" value={toLocalInputValue(schedule)}
          onChange={(e) => setSchedule(new Date(e.target.value))}
          style={{
            background: "#1F2226", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8,
            padding: "10px 12px", color: "#F1F0EC", fontSize: 14, colorScheme: "dark",
          }}
        />
      </div>
      <p style={{ fontSize: 13, color: "#8B92A0", marginTop: 14 }}>
        Vai para o ar: <b style={{ color: "#F1F0EC" }}>{formatPtDate(schedule)}</b>
      </p>
    </div>
  );
}

/* ---------------- STEP 6: READY ---------------- */
function StepReady({ mediaType, caption, track, schedule, platform, edit, publishing, published, onPublish }) {
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label;
  const presetLabel = EDIT_PRESETS.find((p) => p.id === edit.preset)?.label || "Personalizado";
  return (
    <div>
      <h2 className="osw" style={{ fontSize: 26, textTransform: "uppercase", marginBottom: 4 }}>Pronto a ir ao ar</h2>
      <p style={{ color: "#8B92A0", fontSize: 14, marginBottom: 20 }}>Revê tudo à direita e confirma o agendamento.</p>

      <div style={{ background: "#1F2226", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <Row icon={mediaType === "video" ? VideoIcon : ImageIcon} label="Media" value={mediaType === "video" ? "Vídeo/Reel" : "Fotografia"} />
        <Row icon={Radio} label="Plataforma" value={platformLabel} />
        <Row icon={SlidersHorizontal} label="Edição" value={`${presetLabel} · ${edit.aspect}${edit.rotate ? ` · rodado ${edit.rotate}°` : ""}`} />
        <Row icon={MessageSquareText} label="Legenda" value={caption ? `${caption.slice(0, 60)}${caption.length > 60 ? "…" : ""}` : "—"} />
        <Row icon={Music2} label="Som" value={track ? `${track.title} · ${track.artist}` : "—"} />
        <Row icon={Clock} label="Agendado para" value={formatPtDate(schedule)} />
      </div>

      <button
        onClick={onPublish} disabled={publishing || published} className="osw"
        style={{
          marginTop: 22, width: "100%", padding: "14px", borderRadius: 10,
          background: published ? "#2E5C3E" : "#E8402A", border: "none",
          color: published ? "#D9F2E1" : "#0F1115", fontSize: 15, fontWeight: 700, textTransform: "uppercase",
          cursor: publishing || published ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {publishing && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
        {published ? <><Check size={16} /> No ar</> : publishing ? "A agendar…" : "Confirmar agendamento"}
      </button>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <Icon size={16} color="#E8402A" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div className="osw" style={{ fontSize: 11, textTransform: "uppercase", color: "#8B92A0" }}>{label}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

/* ---------------- PHONE PREVIEW ---------------- */
function PhonePreview({ mediaURL, mediaType, caption, track, schedule, platform, edit, step }) {
  const [playing, setPlaying] = useState(false);
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label;
  const ratio = ASPECTS.find((a) => a.id === edit.aspect)?.ratio || "4 / 5";
  return (
    <div>
      <div style={{ position: "sticky", top: 24 }}>
        <div className="osw" style={{ fontSize: 12, textTransform: "uppercase", color: "#8B92A0", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Instagram size={13} /> Pré-visualização · {platformLabel}
        </div>
        <div style={{ background: "#15171A", border: "6px solid #262A30", borderRadius: 32, width: "100%", maxWidth: 300, margin: "0 auto", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 12px 8px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#E8402A,#FFB020)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Radio size={14} color="#0F1115" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>a_tua_marca</div>
              <div style={{ fontSize: 10, color: "#8B92A0" }}>Publicação agendada</div>
            </div>
            <MoreHorizontal size={16} color="#8B92A0" />
          </div>

          <div style={{ width: "100%", aspectRatio: ratio, background: "#1C1E22", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {mediaURL ? (
              mediaType === "image" ? (
                <img src={mediaURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterString(edit), transform: `rotate(${edit.rotate}deg)` }} />
              ) : (
                <>
                  <video src={mediaURL} style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterString(edit), transform: `rotate(${edit.rotate}deg)` }} muted loop playsInline
                    ref={(el) => { if (el) playing ? el.play() : el.pause(); }} />
                  <button onClick={() => setPlaying((p) => !p)} style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!playing && <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "50%", padding: 12 }}><Play size={20} color="#fff" /></div>}
                  </button>
                </>
              )
            ) : (
              <span style={{ color: "#4A4E56", fontSize: 12 }}>o conteúdo aparece aqui</span>
            )}

            {track && (
              <div style={{ position: "absolute", left: 10, bottom: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "5px 10px" }}>
                <Music2 size={11} color="#fff" />
                <span style={{ fontSize: 10, color: "#fff", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title} · {track.artist}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 4px" }}>
            <Heart size={19} /><MessageCircle size={19} /><Send size={19} />
            <div style={{ flex: 1 }} />
            <Bookmark size={19} />
          </div>

          <div style={{ padding: "6px 12px 16px", fontSize: 12, lineHeight: 1.5, color: "#DCD8CE", whiteSpace: "pre-wrap" }}>
            {caption ? (
              <><b style={{ color: "#F1F0EC" }}>a_tua_marca</b> {caption.length > 140 ? caption.slice(0, 140) + "…" : caption}</>
            ) : (
              <span style={{ color: "#4A4E56" }}>a legenda aparece aqui</span>
            )}
          </div>
        </div>

        {step >= 5 && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8B92A0" }}>
            <Clock size={13} color="#FFB020" />
            Publicação agendada: <b style={{ color: "#F1F0EC" }}>{formatPtDate(schedule)}</b>
          </div>
        )}
      </div>
    </div>
  );
}
