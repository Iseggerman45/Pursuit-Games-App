


const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playClick = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
        // Ignore audio errors (e.g. if context not ready)
    }
};

export const playPop = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
};

export const playWhoosh = () => {
    try {
        const ctx = getCtx();
        const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // White noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    } catch (e) {}
};

export const playSuccess = () => {
    try {
        const ctx = getCtx();
        
        // Note 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain1.gain.setValueAtTime(0.05, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);

        // Note 2 (Major 3rd)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.11);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.4);
        
         // Note 3 (Major 5th)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
        gain3.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        gain3.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.21);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc3.start(ctx.currentTime + 0.2);
        osc3.stop(ctx.currentTime + 0.6);

    } catch (e) {}
};

export const playDelete = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
};

export const playAlarm = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        
        // Musical Chime - Pleasant Arpeggio (C Major 7)
        // C5, E5, G5, B5, C6
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine'; // Sine for bell-like tone, Triangle for 8-bit feel
            osc.frequency.setValueAtTime(freq, t + (i * 0.15));
            
            // Envelope
            gain.gain.setValueAtTime(0, t + (i * 0.15));
            gain.gain.linearRampToValueAtTime(0.1, t + (i * 0.15) + 0.05); // Quick attack
            gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.15) + 2); // Long decay
            
            osc.start(t + (i * 0.15));
            osc.stop(t + (i * 0.15) + 2);
        });

    } catch(e) {}
}

export const playMessage = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Gentle "pop" notification
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
}