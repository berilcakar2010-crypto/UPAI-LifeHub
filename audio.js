/* UPAI LifeHub - Web Audio Synthesizer (12 unique sounds) */

let ctx = null;
let source = null;
let gain = null;

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

const makeBuffer = (type, freq) => {
  const c = getCtx();
  const size = 2 * c.sampleRate;
  const buf = c.createBuffer(1, size, c.sampleRate);
  const out = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,lastOut=0;

  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    switch (type) {
      case "white":
        out[i] = white * (freq || 0.35);
        break;
      case "pink":
        b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759;
        b2=0.9690*b2+white*0.153852; b3=0.8665*b3+white*0.3104856;
        b4=0.5500*b4+white*0.5329522; b5=-0.7616*b5-white*0.016898;
        out[i]=(b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11*(freq||0.6);
        b6=white*0.115926;
        break;
      case "brown":
        out[i]=((lastOut+(0.02*white))/1.02)*2.2*(freq||0.5);
        lastOut=out[i];
        break;
      case "chip":
        out[i]=(white*0.08+Math.sin(i*0.007)*0.15)*(freq||1);
        break;
      case "storm":
        out[i]=(white*0.25+Math.sin(i*0.003)*0.1+Math.sin(i*0.017)*0.05)*(freq||0.7);
        break;
      case "firecrackle": {
        const crackle = Math.random() < 0.003 ? white * 0.8 : 0;
        out[i]=((lastOut+(0.01*white))/1.01*1.8+crackle)*(freq||0.6);
        lastOut=out[i];
        break;
      }
      case "sine_mod":
        out[i]=(Math.sin(i*0.005)*0.15+white*0.05+Math.sin(i*0.0003)*0.1)*(freq||0.8);
        break;
      default:
        out[i]=white*0.3;
    }
  }
  return buf;
};

export const playSound = (soundDef, volume = 40) => {
  stopSound();
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = makeBuffer(soundDef.type, soundDef.freq);
  src.loop = true;
  gain = c.createGain();
  gain.gain.setValueAtTime(volume / 100, c.currentTime);
  src.connect(gain);
  gain.connect(c.destination);
  src.start();
  source = src;
};

export const stopSound = () => {
  if (source) { try { source.stop(); } catch {} source = null; }
};

export const setVolume = (v) => {
  if (gain && ctx) gain.gain.setValueAtTime(v / 100, ctx.currentTime);
};
