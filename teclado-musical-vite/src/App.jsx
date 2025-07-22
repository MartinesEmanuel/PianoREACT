import { useState } from "react";
import "./App.css";

// Apenas uma oitava visível: C4 a B4
const octave = 4;
const whiteNotesBase = ["C", "D", "E", "F", "G", "A", "B"];
const allWhiteNotes = whiteNotesBase.map(n => n + octave);

// Frequências para C1 até C9
const noteFrequencies = {};
const baseFreq = {
  "C": 16.35, "C#": 17.32, "D": 18.35, "D#": 19.45, "E": 20.60,
  "F": 21.83, "F#": 23.12, "G": 24.50, "G#": 25.96, "A": 27.50, "A#": 29.14, "B": 30.87
};
for (let oct = 1; oct <= 9; oct++) {
  Object.entries(baseFreq).forEach(([note, freq]) => {
    noteFrequencies[note + oct] = freq * Math.pow(2, oct - 1);
  });
}

// Timbres disponíveis
const TIMBRES = [
  { label: "Piano Digital", value: "piano" },
  { label: "Senoidal", value: "sine" },
  { label: "Quadrada", value: "square" },
  { label: "Dente de Serra", value: "sawtooth" },
  { label: "Órgão", value: "organ" }
];

function playNote(note, timbre) {
  const frequency = noteFrequencies[note];
  if (!frequency) return;
  const context = new (window.AudioContext || window.webkitAudioContext)();

  if (timbre === "piano") {
    // Piano Digital: triangle + sine, envelope rápido
    const osc1 = context.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.value = frequency;
    const osc2 = context.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = frequency * 2;
    const gain = context.createGain();
    const volume = 0.35;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(volume * 0.7, context.currentTime + 0.08);
    gain.gain.linearRampToValueAtTime(volume * 0.6, context.currentTime + 0.18);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.7);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(context.destination);
    osc1.start();
    osc2.start();
    osc1.stop(context.currentTime + 0.7);
    osc2.stop(context.currentTime + 0.7);
  } else if (timbre === "sine") {
    // Senoidal pura
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.6);
  } else if (timbre === "square") {
    // Quadrada
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "square";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.18, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.5);
  } else if (timbre === "sawtooth") {
    // Dente de serra
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.13, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.4);
  } else if (timbre === "organ") {
    // Órgão: mistura de seno e quadrada, envelope mais longo
    const osc1 = context.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = frequency;
    const osc2 = context.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = frequency * 2;
    const gain = context.createGain();
    const volume = 0.18;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.04);
    gain.gain.linearRampToValueAtTime(volume * 0.8, context.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 1.2);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(context.destination);
    osc1.start();
    osc2.start();
    osc1.stop(context.currentTime + 1.2);
    osc2.stop(context.currentTime + 1.2);
  }
}

function Piano({ onKeyPress, activeNote }) {
  return (
    <div className="piano piano-big">
      <div className="white-keys">
        {allWhiteNotes.map((note, i) => (
          <div
            key={note}
            className={`white-key${activeNote === note ? " active" : ""}`}
            onClick={() => onKeyPress(note)}
          />
        ))}
      </div>
      <div className="black-keys">
        {allWhiteNotes.map((whiteNote, i) => {
          const base = whiteNote.slice(0, -1);
          const oct = whiteNote.slice(-1);
          let blackNote = "";
          if (["C", "D", "F", "G", "A"].includes(base)) {
            blackNote = base + "#" + oct;
          }
          if (blackNote && noteFrequencies[blackNote]) {
            return (
              <div
                key={blackNote}
                className={`black-key${activeNote === blackNote ? " active" : ""}`}
                style={{
                  left: `calc(${((i + 1) / allWhiteNotes.length) * 100}% - 3.5vw)`
                }}
                onClick={() => onKeyPress(blackNote)}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [activeNote, setActiveNote] = useState(null);
  const [timbre, setTimbre] = useState("piano");

  const handlePlay = () => {
    const notes = input.trim().split(/\s+/);
    (async () => {
      for (const note of notes) {
        setActiveNote(note);
        playNote(note, timbre);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setActiveNote(null);
      }
    })();
  };

  const handlePianoKey = (note) => {
    setActiveNote(note);
    playNote(note, timbre);
    setTimeout(() => setActiveNote(null), 200);
  };

  return (
    <div className="allblack-bg">
      <div className="centerer" style={{ flexDirection: "column" }}>
        <Piano onKeyPress={handlePianoKey} activeNote={activeNote} />
        <select
          className="minimal-input"
          style={{ marginBottom: 16, width: 140, cursor: "pointer" }}
          value={timbre}
          onChange={e => setTimbre(e.target.value)}
        >
          {TIMBRES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          className="minimal-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite notas: C1 D#2 F5 ..."
          spellCheck={false}
          autoComplete="off"
          onKeyDown={e => { if (e.key === "Enter") handlePlay(); }}
        />
      </div>
    </div>
  );
}
