// Mixer Web Audio para injetar áudio pré-gravado dentro do stream de
// microfone enviado ao Twilio Voice SDK.
//
// Fluxo:
//   microfone real ──┐
//                    ├──► MediaStreamDestination ──► Twilio (cliente escuta)
//   <audio> clipe ───┤
//                    └──► AudioContext.destination  (agente escuta local)
//
// Uso:
//   await installCallAudioMixer();   // antes de criar Twilio.Device
//   const mixer = getCallAudioMixer();
//   mixer.play(url); mixer.pause(); mixer.resume(); mixer.stop();
//   uninstallCallAudioMixer();       // ao destruir o Device

type Listener = (state: MixerState) => void;

export type MixerState = {
  currentUrl: string | null;
  currentTitle: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  duration: number;
  position: number;
};

class CallAudioMixer {
  ctx: AudioContext | null = null;
  dest: MediaStreamAudioDestinationNode | null = null;
  micSource: MediaStreamAudioSourceNode | null = null;
  audioEl: HTMLAudioElement | null = null;
  elementSource: MediaElementAudioSourceNode | null = null;
  private listeners = new Set<Listener>();
  private state: MixerState = {
    currentUrl: null,
    currentTitle: null,
    isPlaying: false,
    isPaused: false,
    duration: 0,
    position: 0,
  };
  private rafId: number | null = null;

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!this.dest && this.ctx) {
      this.dest = this.ctx.createMediaStreamDestination();
    }
    return this.ctx!;
  }

  /** Recebe o stream do microfone real e devolve o stream mixado para o Twilio. */
  wireMicStream(micStream: MediaStream): MediaStream {
    const ctx = this.ensureContext();
    // descarta source antigo se houver
    try { this.micSource?.disconnect(); } catch {}
    this.micSource = ctx.createMediaStreamSource(micStream);
    this.micSource.connect(this.dest!);
    return this.dest!.stream;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private setState(patch: Partial<MixerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  private tick = () => {
    if (this.audioEl && !this.audioEl.paused) {
      this.setState({
        position: this.audioEl.currentTime,
        duration: this.audioEl.duration || this.state.duration,
      });
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  async play(url: string, title?: string) {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();

    // stop anterior
    this.stop();

    const el = new Audio();
    el.crossOrigin = "anonymous";
    el.src = url;
    el.preload = "auto";

    // conecta no grafo (microfone + alto-falante do agente)
    const source = ctx.createMediaElementSource(el);
    source.connect(this.dest!);          // Twilio (cliente)
    source.connect(ctx.destination);      // alto-falante (agente)

    this.audioEl = el;
    this.elementSource = source;

    el.addEventListener("ended", () => {
      this.setState({ isPlaying: false, isPaused: false, position: 0 });
      if (this.rafId) cancelAnimationFrame(this.rafId);
    });
    el.addEventListener("loadedmetadata", () => {
      this.setState({ duration: el.duration || 0 });
    });

    try {
      await el.play();
      this.setState({
        currentUrl: url,
        currentTitle: title || null,
        isPlaying: true,
        isPaused: false,
        position: 0,
      });
      this.rafId = requestAnimationFrame(this.tick);
    } catch (err) {
      console.error("mixer play error", err);
      throw err;
    }
  }

  pause() {
    if (this.audioEl && !this.audioEl.paused) {
      this.audioEl.pause();
      this.setState({ isPlaying: false, isPaused: true });
      if (this.rafId) cancelAnimationFrame(this.rafId);
    }
  }

  async resume() {
    if (this.audioEl && this.audioEl.paused && this.state.currentUrl) {
      await this.audioEl.play();
      this.setState({ isPlaying: true, isPaused: false });
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.audioEl) {
      try { this.audioEl.pause(); } catch {}
      this.audioEl.src = "";
      this.audioEl = null;
    }
    if (this.elementSource) {
      try { this.elementSource.disconnect(); } catch {}
      this.elementSource = null;
    }
    this.setState({
      currentUrl: null,
      currentTitle: null,
      isPlaying: false,
      isPaused: false,
      position: 0,
      duration: 0,
    });
  }

  teardown() {
    this.stop();
    try { this.micSource?.disconnect(); } catch {}
    try { this.dest?.disconnect(); } catch {}
    this.micSource = null;
    this.dest = null;
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.listeners.clear();
  }
}

let mixer: CallAudioMixer | null = null;
let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia | null = null;

export function getCallAudioMixer(): CallAudioMixer {
  if (!mixer) mixer = new CallAudioMixer();
  return mixer;
}

/**
 * Monkey-patch global de navigator.mediaDevices.getUserMedia para que toda
 * captura de áudio passe pelo mixer. Deve ser chamado ANTES de inicializar
 * o Twilio.Device.
 */
export function installCallAudioMixer() {
  if (originalGetUserMedia) return; // já instalado
  const mediaDevices = navigator.mediaDevices;
  originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
  const m = getCallAudioMixer();

  mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
    const realStream = await originalGetUserMedia!(constraints);
    // Só interceptamos quando há áudio solicitado (Twilio sempre pede audio)
    if (!constraints || !constraints.audio) return realStream;
    try {
      const mixedStream = m.wireMicStream(realStream);
      // Anexa também as eventuais tracks de vídeo (não usado aqui mas seguro)
      realStream.getVideoTracks().forEach((t) => mixedStream.addTrack(t));
      return mixedStream;
    } catch (err) {
      console.error("Falha ao mixar microfone, usando stream cru", err);
      return realStream;
    }
  };
}

export function uninstallCallAudioMixer() {
  if (originalGetUserMedia) {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    originalGetUserMedia = null;
  }
  if (mixer) {
    mixer.teardown();
    mixer = null;
  }
}