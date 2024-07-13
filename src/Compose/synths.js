/* BASED ON

*/

import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';

import theory from './theory.js';

import m from '../Assets/audioSamples/m.wav';
import mUp from '../Assets/audioSamples/mUp.wav';

import kickAcoustic from '../Assets/audioSamples/kick_acoustic.wav';
import snareAcoustic from '../Assets/audioSamples/snare_acoustic.wav';
import closedHatAcoustic from '../Assets/audioSamples/closedHat_acoustic.wav';
import openedHatAcoustic from '../Assets/audioSamples/openedHat_acoustic.wav';
import lowTomAcoustic from '../Assets/audioSamples/lowTom_acoustic.wav';
import highTomAcoustic from '../Assets/audioSamples/highTom_acoustic.wav';
import crashAcoustic from '../Assets/audioSamples/crash_acoustic.wav';

import kickSubtle from '../Assets/audioSamples/kick_subtle.wav';
import snareSubtle from '../Assets/audioSamples/snare_subtle.wav';
import closedHatSubtle from '../Assets/audioSamples/closedHat_subtle.wav';
import openedHatSubtle from '../Assets/audioSamples/openedHat_subtle.wav';
import lowTomSubtle from '../Assets/audioSamples/lowTom_subtle.wav';
import highTomSubtle from '../Assets/audioSamples/highTom_subtle.wav';
import crashSubtle from '../Assets/audioSamples/crash_subtle.wav';
import { Instrument } from 'tone/build/esm/instrument/Instrument.js';
import { ConsoleView } from 'react-device-detect';

// ---------------------------------------------------------------

//ref to p5.js
let session, saving, generatedTracks;
function setSession(s, save) { 
    session = s; 
    saving = save;
}

function setGeneratedTracks(tracks) {
    generatedTracks = tracks;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function compareBuffers(buffer1, buffer2) {
    const audioBuffer1 = buffer1.get();
    const audioBuffer2 = buffer2.get();

    // Compare basic properties
    if (audioBuffer1.length !== audioBuffer2.length ||
        audioBuffer1.sampleRate !== audioBuffer2.sampleRate ||
        audioBuffer1.numberOfChannels !== audioBuffer2.numberOfChannels) {
        return false;
    }

    // Compare the actual audio data
    for (let channel = 0; channel < audioBuffer1.numberOfChannels; channel++) {
        const data1 = audioBuffer1.getChannelData(channel);
        const data2 = audioBuffer2.getChannelData(channel);

        // Compare each sample
        for (let i = 0; i < data1.length; i++) {
            if (data1[i] !== data2[i]) {
                return false;
            }
        }
    }

    return true;
}

// ---------------------------------------------------------------
// MIDI INPUT
// ---------------------------------------------------------------

class MIDIAccess {
    constructor(args = {}) {
        this.onDeviceInput = args.onDeviceInput || console.log;
        this.synth = new Tone.PolySynth().toDestination();
    }

    start() {
        return new Promise((resolve, reject) => {
            this._requestAccess().then(access=>{
            this.initialize(access);
            resolve();
            }).catch(() => reject('MIDI went wrong.'));
        });
    }

    initialize(access) {
        const devices = access.inputs.values();
        for (let device of devices) this.initializeDevice(device);

        access.onstatechange = this.onStateChange.bind(this);
    }

    initializeDevice(device){
        device.onmidimessage = this.onMessage.bind(this);
    }

    
    onMessage(message) {
        let [_, note, vel] = message.data;
        this.onDeviceInput({ note, vel });
    }

    onStateChange(event) {
        if (event.port.type === "input") {
            if (event.port.state === "connected") {
                if (session !== undefined) {
                    session.showLog = true;
                    session.logMessage = `MIDI device connected.`;
                }
            } else if (event.port.state === "disconnected") {
                if (session !== undefined) {
                    session.showLog = true;
                    session.logMessage = `MIDI device disconnected.`;
                }
            }
        }
    }

    _requestAccess() {
        return new Promise ((resolve, reject) => {
            if(navigator.requestMIDIAccess)
                navigator.requestMIDIAccess()
                    .then(resolve)
                    .catch(reject);
            else reject();
        });
    }
}

const midi = new MIDIAccess({ onDeviceInput });

midi.start().then(() => {
    console.log('MIDI STARTED');
}).catch(console.error);

function onDeviceInput({ note, vel }) {
    let n = note-Math.floor(note/12)*12;
    //console.log(n);
    if (session.activeTab !== null && session.activeTab.type === "loop" && session.loopDrawer === false && session.structDrawer === false) {

        let s = session.activeTab.selectedTrack.synth;
        if (session.activeTab.selectedTrack.name === "DRUMS") {
            if (vel !== 0 && n < theory.drumLabels.length) {
                s.parts[n].stop();
                s.parts[n].start(Tone.context.currentTime);
                if (n === 2) s.parts[3].stop(Tone.context.currentTime);
                session.manageRecordedNotes(n,0);
            } else if (vel === 0 && n < theory.drumLabels.length) {
                session.resolveRecordedNotes(n,0);
            }
        } else {
            if (vel !== 0) {
                s.oscillators[0].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                s.oscillators[1].triggerAttack(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                session.manageRecordedNotes(n,Math.floor(note/12));
            }
            else { 
                s.oscillators[0].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                s.oscillators[1].triggerRelease(theory.freqs[n]*Math.pow(2,Math.floor(note/12)),Tone.context.currentTime);
                session.resolveRecordedNotes(n,Math.floor(note/12));
            }
        }
        saving = true;
    }
}


// ---------------------------------------------------------------
// AUDIO RECORDER
// ---------------------------------------------------------------

let mic = new Tone.UserMedia();
let micMeter = new Tone.Meter();
let recorder = new Tone.Recorder(); 
mic.connect(micMeter);
micMeter.connect(recorder);

/*const context  = Tone.context;
const renderDest  = context.createMediaStreamDestination();
const renderer = new MediaRecorder(renderDest.stream, { mimeType: 'audio/wav' });
const chunks = [];*/

/*function exportLoopAudio(loop,nSteps,setLoading) {
    const renderer = new Tone.Recorder();

    let step = 0;

    Tone.Transport.scheduleRepeat(time => {
        if (step === 0) {
            melodyLeft.connect(renderer);
            melodyRight.connect(renderer);

            //melodyLeft.disconnect(Tone.Destination);
            //melodyRight.disconnect(Tone.Destination);
            renderer.start();
        }

        if (step < nSteps) {
            for (let i = 0; i < loop.tracks.length; i++) {
                for (let j = 0;j < loop.tracks[i].timeline[step].length; j++) {
                    if (loop.tracks[i].timeline[step][j] !== null) {
                        if (loop.tracks[i].name === "DRUMS") { 

                        } 
                        else {
                            loop.tracks[i].synth[0].triggerAttackRelease(theory.freqs[loop.tracks[i].timeline[step][j].pitch]*Math.pow(2,loop.tracks[i].timeline[step][j].octave),loop.tracks[i].timeline[step][j].duration*loop.timeBtwSteps);
                            loop.tracks[i].synth[1].triggerAttackRelease(theory.freqs[loop.tracks[i].timeline[step][j].pitch]*Math.pow(2,loop.tracks[i].timeline[step][j].octave),loop.tracks[i].timeline[step][j].duration*loop.timeBtwSteps);
                        }
                    }
                }
            }
        } else if (step > nSteps+nSteps/8) {
          Tone.Transport.stop();
          melodyLeft.disconnect(renderer);
          melodyRight.disconnect(renderer);
          //melodyLeft.connect(Tone.Destination);
          //melodyRight.connect(Tone.Destination);
          //melodyLeft.disconnect(renderDest);
          //melodyRight.disconnect(renderDest);
          setTimeout(async () => {
            // the recorded audio is returned as a blob
            const render = await renderer.stop();
            //console.log(render);
            // download the recording by creating an anchor element and blob url
            const url = URL.createObjectURL(render);
            const anchor = document.getElementById("export");
            anchor.download = loop.name+".webm";
            anchor.href = url;
            anchor.click();
            setLoading(false);
        }, nSteps/4*loop.timeBtwSteps);
        }
        step++;
        }, loop.timeBtwSteps);

        Tone.Transport.start();
}*/

/*function exportLoopAudio(loop,nSteps,setLoading) {

    let audioLength = loop.timeBtwSteps * loop.nSteps + loop.timeBtwSteps*loop.nSteps/8;

    Tone.Offline(({ transport }) => {

        let instruments = [];

        for (let i = 0; i < loop.tracks.length; i++) {
            let t = loop.tracks[i];
            if (loop.tracks[i].name === "DRUMS") instruments.push(new DrumSynth());
            else instruments.push(new Synth());
        }

        let step = 0;

        transport.scheduleRepeat(time => {
            if (step < nSteps) {
                for (let t in loop.tracks) {
                    for (let n in loop.tracks[t].timeline[step]) {
                        if (loop.tracks[t].timeline[step][n] !== null) {
                            let pitch = loop.tracks[t].timeline[step][n].pitch;
                            let octave = loop.tracks[t].timeline[step][n].octave;
                            let duration = loop.tracks[t].timeline[step][n].duration;
                            if (loop.tracks[t].name === "DRUMS") {
                                instruments[t].parts[pitch].start(time);
                                if (pitch === 2) instruments[t].parts[3].stop();
                            } else {

                                for (let j = 0; j < instruments[t].oscillators.length; j++) {
                                    instruments[t].oscillators[j].set({oscillator: {type: t.oscKnobs[j][0].output, volume: t.oscKnobs[j][2].output}});
                                    instruments[t].oscillators[j].set({envelope: {attack: t.envKnobs[j][0].output, decay: t.envKnobs[j][1].output, sustain: t.envKnobs[j][2].output, release: t.envKnobs[j][3].output}});
                                }
                            
                                instruments[t].fxChain.filter.frequency.value = t.filterKnob.output;
                                instruments[t].fxChain.distortion.wet.value = t.distKnobs[0].output;
                                instruments[t].fxChain.delay.delayTempo.value = t.dlyKnobs[0].output;
                                instruments[t].fxChain.delay.feedback.value = t.dlyKnobs[1].output;
                                instruments[t].fxChain.delay.wet.value = t.dlyKnobs[2].output;
                                instruments[t].fxChain.reverb.decay = t.rvbKnobs[0].output;
                                instruments[t].fxChain.reverb.wet.value = t.rvbKnobs[1].output;
                

                                instruments[t].oscillators[0].triggerAttackRelease(theory.freqs[pitch]*Math.pow(2,octave),duration*loop.timeBtwSteps,time);
                                instruments[t].oscillators[1].triggerAttackRelease(theory.freqs[pitch]*Math.pow(2,octave),duration*loop.timeBtwSteps,time);
                            }
                        }
                    }
                }
            }
            else if (step > nSteps+nSteps/8) Tone.Transport.stop();
            step++;
        }, loop.timeBtwSteps);

        transport.start();

    }, audioLength).then((buffer) => {
        const blob = new Blob([audioBufferToWav(buffer)], { type: "audio/wav" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.getElementById("export");
        anchor.download = loop.name+".wav";
        anchor.href = url;
        anchor.click();
        setLoading(false);
    });
}*/

// ---------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------

function exportLoopAudio(p,loop,setLoading) {

    let audioLength = loop.timeBtwSteps * loop.nSteps + loop.timeBtwSteps*loop.nSteps/4;

    Tone.Offline(({ transport }) => {

        let currentStep = 0;
        let loopCopy = session.copyLoop(loop); 

        for (let t in loop.tracks) {
            if (loop.tracks[t].name === "DRUMS") {
                loopCopy.tracks[t].synth = new DrumSynth(drumPresets[loop.tracks[t].presetScroll.value].kit); 
            }
            else loopCopy.tracks[t].synth = new Synth();
        }

        transport.scheduleRepeat(time => {

            transport.bpm.value = loop.tempoScroll.value;

            if (currentStep < loop.nSteps) {
                for (let t in loopCopy.tracks) {

                    //loopCopy.tracks[t].updateSynthParams();

                    //automate knobs
                    for (let i=0; i < loopCopy.tracks[t].knobs.length; i++) {
                        if (loopCopy.tracks[t].knobs[i][1].automating && currentStep > -1) {
                            loopCopy.tracks[t].knobs[i][1].value = loopCopy.tracks[t].knobs[i][1].automation[currentStep];
                            if (typeof loopCopy.tracks[t].knobs[i][1].output === "string") loopCopy.tracks[t].knobs[i][1].output = loopCopy.tracks[t].knobs[i][1].options[p.round(p.map(loopCopy.tracks[t].knobs[i][1].value,0,1,0,loopCopy.tracks[t].knobs[i][1].options.length-1))].toUpperCase();
                            else loopCopy.tracks[t].knobs[i][1].output = loopCopy.tracks[t].knobs[i][1].options[p.round(p.map(loopCopy.tracks[t].knobs[i][1].value,0,1,0,loopCopy.tracks[t].knobs[i][1].options.length-1))];
                        }
                    }

                    loopCopy.tracks[t].updateSynthParams();

                    for (let n in loopCopy.tracks[t].notes) {
                        //if (currentStep === 0 && loopCopy.tracks[t].notes[n].start !== 0 || currentStep === 0 && loopCopy.tracks[t].notes[n].duration === loopCopy.nSteps) loopCopy.tracks[t].notes[n].stop(time);
                        if (loopCopy.tracks[t].notes[n].start === currentStep) {
                            if (loopCopy.tracks[t].name === "DRUMS") {
                                loopCopy.tracks[t].synth.parts[loopCopy.tracks[t].notes[n].pitch].stop(time);
                                //console.log(loopCopy.tracks[t].notes[n].pitch,loopCopy.tracks[t].synth.parts,loopCopy.tracks[t].synth.parts[loopCopy.tracks[t].notes[n].pitch]);
                                loopCopy.tracks[t].synth.parts[loopCopy.tracks[t].notes[n].pitch].start(time);
                                if (loopCopy.tracks[t].notes[n].pitch === 2) loopCopy.tracks[t].synth.parts[3].stop();
                            } else {
                                loopCopy.tracks[t].synth.oscillators[0].triggerAttack(theory.freqs[loopCopy.tracks[t].notes[n].pitch]*Math.pow(2,loopCopy.tracks[t].notes[n].octave),time);
                                loopCopy.tracks[t].synth.oscillators[1].triggerAttack(theory.freqs[loopCopy.tracks[t].notes[n].pitch]*Math.pow(2,loopCopy.tracks[t].notes[n].octave),time);
                            }
                        } else if (loopCopy.tracks[t].notes[n].start + loopCopy.tracks[t].notes[n].duration === currentStep) {
                            if (loopCopy.tracks[t].name !== "DRUMS") {
                                loopCopy.tracks[t].synth.oscillators[0].triggerRelease(theory.freqs[loopCopy.tracks[t].notes[n].pitch]*Math.pow(2,loopCopy.tracks[t].notes[n].octave),time);
                                loopCopy.tracks[t].synth.oscillators[1].triggerRelease(theory.freqs[loopCopy.tracks[t].notes[n].pitch]*Math.pow(2,loopCopy.tracks[t].notes[n].octave),time);
                            }
                        }
                        //if (loopCopy.tracks[t].name !== "DRUMS" && loopCopy.tracks[t].notes[n].start+loopCopy.tracks[t].notes[n].duration === currentStep) loopCopy.tracks[t].notes[n].stop(time);
                    }
                }

            } else if (currentStep === loop.nSteps) {
                for (let i in loopCopy.tracks) {
                    if (loopCopy.tracks[i].name !== "DRUMS")  {
                        for (let j in loopCopy.tracks[i].synth.oscillators) {
                            loopCopy.tracks[i].synth.oscillators[j].releaseAll(time);
                        }
                    }
                }
            } else if (currentStep > loop.nSteps+loop.nSteps/4) transport.stop();
            currentStep++;
        }, "16n");

        transport.start();

    }, audioLength).then((buffer) => {
        const blob = new Blob([audioBufferToWav(buffer)], { type: "audio/wav" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.getElementById("export");
        anchor.download = loop.name+".wav";
        anchor.href = url;
        anchor.click();
        setLoading(false);
    });
}

function exportStructAudio(p,struct,setLoading) {

    let audioLength = 0;

    let timeBtwSteps = 60 / struct.tempoScroll.value / 4;
    
    for (let s in struct.sequence) {
        if (struct.tempoButton.state) audioLength += timeBtwSteps * struct.sequence[s].nSteps * struct.repeats[s].value;
        else audioLength += struct.sequence[s].timeBtwSteps * struct.sequence[s].nSteps * struct.repeats[s].value;
    }

    audioLength += 5;

    Tone.Offline(({ transport }) => {

        let currentStep = 0;
        let currentLoop = 0;
        let currentRepeat = 1;

        let sequenceCopy = [];

        for (let s in struct.sequence) {
            let loopCopy = session.copyLoop(struct.sequence[s]);
            for (let t in loopCopy.tracks) {
                if (loopCopy.tracks[t].name === "DRUMS") {
                    loopCopy.tracks[t].synth = new DrumSynth(drumPresets[loopCopy.tracks[t].presetScroll.value].kit); 
                }
                else loopCopy.tracks[t].synth = new Synth();
            }

            sequenceCopy.push(loopCopy);

            //console.log(sequenceCopy[s],struct.repeats[s]);
        }

        transport.scheduleRepeat(time => {

            if (currentLoop < sequenceCopy.length) {

                if (struct.tempoButton.state) transport.bpm.value = struct.tempoScroll.value;
                else transport.bpm.value = sequenceCopy[currentLoop].tempoScroll.value;

                //console.log(currentLoop,currentStep,currentRepeat);

                for (let t in sequenceCopy[currentLoop].tracks) {

                    //automate knobs
                    for (let i=0; i < sequenceCopy[currentLoop].tracks[t].knobs.length; i++) {
                        if (sequenceCopy[currentLoop].tracks[t].knobs[i][1].automating && currentStep > -1) {
                            sequenceCopy[currentLoop].tracks[t].knobs[i][1].value = sequenceCopy[currentLoop].tracks[t].knobs[i][1].automation[currentStep];
                            if (typeof sequenceCopy[currentLoop].tracks[t].knobs[i][1].output === "string") sequenceCopy[currentLoop].tracks[t].knobs[i][1].output = sequenceCopy[currentLoop].tracks[t].knobs[i][1].options[p.round(p.map(sequenceCopy[currentLoop].tracks[t].knobs[i][1].value,0,1,0,sequenceCopy[currentLoop].tracks[t].knobs[i][1].options.length-1))].toUpperCase();
                            else sequenceCopy[currentLoop].tracks[t].knobs[i][1].output = sequenceCopy[currentLoop].tracks[t].knobs[i][1].options[p.round(p.map(sequenceCopy[currentLoop].tracks[t].knobs[i][1].value,0,1,0,sequenceCopy[currentLoop].tracks[t].knobs[i][1].options.length-1))];
                        }
                    }

                    sequenceCopy[currentLoop].tracks[t].updateSynthParams();

                    for (let n in sequenceCopy[currentLoop].tracks[t].notes) {
                        
                        let pitch = sequenceCopy[currentLoop].tracks[t].notes[n].pitch;
                        let octave = sequenceCopy[currentLoop].tracks[t].notes[n].octave;
                  
                        if (struct.transposeButton.state) pitch += struct.transposeScroll.value;

                        if (pitch > 11) {
                          octave++;
                          pitch = pitch-12;
                        }
                        else if (pitch < 0) {
                          octave--;
                          pitch = 12+pitch;
                        }
                        
                        //if (currentStep === 0 && sequenceCopy[currentLoop].tracks[t].notes[n].start !== 0 || currentStep === 0 && sequenceCopy[currentLoop].tracks[t].notes[n].duration === sequenceCopy[currentLoop].nSteps) sequenceCopy[currentLoop].tracks[t].notes[n].stop(time);
                        if (sequenceCopy[currentLoop].tracks[t].notes[n].start === currentStep) {
                            if (sequenceCopy[currentLoop].tracks[t].name === "DRUMS") {
                                sequenceCopy[currentLoop].tracks[t].synth.parts[sequenceCopy[currentLoop].tracks[t].notes[n].pitch].stop(time);
                                //console.log(sequenceCopy[currentLoop].tracks[t].notes[n].pitch,sequenceCopy[currentLoop].tracks[t].synth.parts,sequenceCopy[currentLoop].tracks[t].synth.parts[sequenceCopy[currentLoop].tracks[t].notes[n].pitch]);
                                sequenceCopy[currentLoop].tracks[t].synth.parts[sequenceCopy[currentLoop].tracks[t].notes[n].pitch].start(time);
                                if (sequenceCopy[currentLoop].tracks[t].notes[n].pitch === 2) sequenceCopy[currentLoop].tracks[t].synth.parts[3].stop();
                            } else {

                                sequenceCopy[currentLoop].tracks[t].synth.oscillators[0].triggerAttack(theory.freqs[pitch]*Math.pow(2,octave),time);
                                sequenceCopy[currentLoop].tracks[t].synth.oscillators[1].triggerAttack(theory.freqs[pitch]*Math.pow(2,octave),time);
                            }
                        } else if (sequenceCopy[currentLoop].tracks[t].notes[n].start + sequenceCopy[currentLoop].tracks[t].notes[n].duration === currentStep) {
                            if (sequenceCopy[currentLoop].tracks[t].name !== "DRUMS") {
                                sequenceCopy[currentLoop].tracks[t].synth.oscillators[0].triggerRelease(theory.freqs[pitch]*Math.pow(2,octave),time);
                                sequenceCopy[currentLoop].tracks[t].synth.oscillators[1].triggerRelease(theory.freqs[pitch]*Math.pow(2,octave),time);
                            }
                        }
                    }
                }

                if (currentStep === sequenceCopy[0].nSteps-1) {
                    currentStep = -1;
                    
                    if (currentRepeat >= struct.repeats[currentLoop].value) {
                        currentRepeat = 1;  
                
                        //if (currentLoop = sequenceCopy.length-1) currentLoop = 0;
                        // else currentLoop++;
                        for (let t in sequenceCopy[currentLoop].tracks) {
                            if (sequenceCopy[currentLoop].tracks[t].name !== "DRUMS")  {
                                for (let j in sequenceCopy[currentLoop].tracks[t].synth.oscillators) sequenceCopy[currentLoop].tracks[t].synth.oscillators[j].releaseAll(time);
                            }
                        }
                        currentLoop++;
                
                    } else currentRepeat++;

                }
            } else if (currentLoop === sequenceCopy.length) {
                for (let t in sequenceCopy[currentLoop-1].tracks) {
                    if (sequenceCopy[currentLoop-1].tracks[t].name !== "DRUMS")  {
                        for (let j in sequenceCopy[currentLoop-1].tracks[t].synth.oscillators) {
                            sequenceCopy[currentLoop-1].tracks[t].synth.oscillators[j].releaseAll(time);
                        }
                    }
                }
                if (currentStep > sequenceCopy[currentLoop-1].nSteps+sequenceCopy[currentLoop-1].nSteps/4) transport.stop();
            }

            currentStep++;
          
        }, "16n");

        transport.start();

    }, audioLength).then((buffer) => {
        const blob = new Blob([audioBufferToWav(buffer)], { type: "audio/wav" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.getElementById("export");
        anchor.download = struct.name+".wav";
        anchor.href = url;
        anchor.click();
        setLoading(false);
    });
}

// ---------------------------------------------------------------
// METRONOME
// ---------------------------------------------------------------

class Metronome {
    constructor() {
        this.state = false;
        this.click = [new Tone.Player(mUp).toDestination(), new Tone.Player(m).toDestination()];
    }
}

const metronome = new Metronome();

Tone.Transport.scheduleRepeat((time) => {
    let tab = null;
    
    //identify what to play
    if (session.loopDrawer) {
        for (let l in session.loops) {
            if (session.loops[l].hover) {
                tab = session.loops[l];
                break;
            }
        }
    } else if (session.structDrawer) {
        for (let s in session.structs) {
            if (session.structs[s].hover) {
                tab = session.structs[s];
                break;
            }
        }
    }
    else tab = session.activeTab;

    if (tab !== null) {
        //loop active tab
        if (tab.type === "loop") {
            Tone.Transport.bpm.value = tab.tempoScroll.value;



            if (tab.currentStep === tab.nSteps-1) {
                tab.currentStep = 0;

                for (let t in tab.tracks) {
                    if (tab.tracks[t].name !== "DRUMS") {
                        tab.tracks[t].synth.oscillators[0].releaseAll(time);
                        tab.tracks[t].synth.oscillators[1].releaseAll(time);
                    }
                }

                if (generatedTracks.length > 0) {
                    if (tab.plusMenu.trackHover !== -1 && generatedTracks[tab.plusMenu.trackHover] !== undefined) {
                        if (generatedTracks[tab.plusMenu.trackHover].name !== "DRUMS") {
                            generatedTracks[tab.plusMenu.trackHover].synth.oscillators[0].releaseAll(time);
                            generatedTracks[tab.plusMenu.trackHover].synth.oscillators[1].releaseAll(time);
                        }
                    }
                }
            } else tab.currentStep++;

            if (tab.click.state && session.loopDrawer === false) {
                if (tab.currentStep%16 === 0) metronome.click[0].start(time);
                else if (tab.currentStep%4 === 0) metronome.click[1].start(time);
            }

            let tracks = tab.tracks;
        
            if (tab.plusMenu.state === -1 || (tab.plusMenu.state === 2 && tab.plusMenu.soloButton.state === false)) {
                for (let t in tracks) {
                    if (tracks[t].muted === false) {
                        tracks[t].updateSynthParams();
                        for (let i=0; i< tracks[t].knobs.length; i++) tracks[t].knobs[i][1].knobAutomate(tab);

                        for (let n in tracks[t].notes) {           

                            if (tracks[t].notes[n].start === tab.currentStep) tracks[t].notes[n].play(0,time); 
                            if (tracks[t].name !== "DRUMS" && tracks[t].notes[n].start+tracks[t].notes[n].duration === tab.currentStep) tracks[t].notes[n].stop(0,time);
                        }
                    }
                }
            }

            if (generatedTracks.length > 0) {
                if (tab.plusMenu.trackHover !== -1 && generatedTracks[tab.plusMenu.trackHover] !== undefined) {
                    let track = generatedTracks[tab.plusMenu.trackHover];

                    track.updateSynthParams();
                    for (let i=0; i< track.knobs.length; i++) track.knobs[i][1].knobAutomate(tab);

                    for (let n in track.notes) {
                        if (track.name !== "DRUMS") {
                            if (track.notes[n].start === tab.currentStep) {
                                track.synth.oscillators[0].triggerAttack(theory.freqs[track.notes[n].pitch]*Math.pow(2,track.notes[n].octave),time);
                                track.synth.oscillators[1].triggerAttack(theory.freqs[track.notes[n].pitch]*Math.pow(2,track.notes[n].octave),time);
                            }
                            if (track.notes[n].start+track.notes[n].duration === tab.currentStep) {
                                track.synth.oscillators[0].triggerRelease(theory.freqs[track.notes[n].pitch]*Math.pow(2,track.notes[n].octave),time);
                                track.synth.oscillators[1].triggerRelease(theory.freqs[track.notes[n].pitch]*Math.pow(2,track.notes[n].octave),time);
                            } 
                        }

                    }
                        //if (tab.currentStep === 0 && track.notes[n].start !== 0 || tab.currentStep === 0 && track.notes[n].duration === tab.nSteps) track.notes[n].stop(0,time);
                        //if (track.notes[n].start === tab.currentStep) track.notes[n].play(0,time);
                        //if (track.name !== "DRUMS" && track.notes[n].start+track.notes[n].duration === tab.currentStep) track.notes[n].stop(0,time);
                    
                }
            }

        //struct active tab
        } else {            
            if (tab.sequence.length > 0) {

                if (tab.tempoButton.state) Tone.Transport.bpm.value = tab.tempoScroll.value;
                else Tone.Transport.bpm.value = tab.sequence[tab.currentLoop].tempoScroll.value;

                if (tab.sequence[tab.currentLoop].currentStep === tab.sequence[tab.currentLoop].nSteps-1) {
                    tab.sequence[tab.currentLoop].currentStep = 0;
                    
                    if (tab.currentRepeat >= tab.repeats[tab.currentLoop].value-1) {
                        tab.currentRepeat = 0;
                        
                        tab.sequence[tab.currentLoop].play = false;
                
                        if (tab.currentLoop === tab.sequence.length-1) tab.currentLoop = 0;
                        else tab.currentLoop++;
                        
                        synths.releaseAll(time);

                        tab.sequence[tab.currentLoop].play = true;
                
                    } else tab.currentRepeat++;

                }
                else tab.sequence[tab.currentLoop].currentStep++;

                for (let t in tab.sequence[tab.currentLoop].tracks) {
                    if (tab.sequence[tab.currentLoop].tracks[t].muted === false) {
                        tab.sequence[tab.currentLoop].tracks[t].updateSynthParams();
                        for (let i=0; i< tab.sequence[tab.currentLoop].tracks[t].knobs.length; i++) tab.sequence[tab.currentLoop].tracks[t].knobs[i][1].knobAutomate(tab.sequence[tab.currentLoop]);

                        for (let n in tab.sequence[tab.currentLoop].tracks[t].notes) {
                            let pitchOffset = 0;
                            if (tab.transposeButton.state) pitchOffset = tab.transposeScroll.value;
                            if (tab.sequence[tab.currentLoop].currentStep === 0 && tab.sequence[tab.currentLoop].tracks[t].notes[n].start !== 0 || tab.sequence[tab.currentLoop].currentStep === 0 && tab.sequence[tab.currentLoop].tracks[t].notes[n].duration === tab.sequence[tab.currentLoop].nSteps) tab.sequence[tab.currentLoop].tracks[t].notes[n].stop(pitchOffset,time);
                            
                            if (tab.sequence[tab.currentLoop].tracks[t].notes[n].start === tab.sequence[tab.currentLoop].currentStep) tab.sequence[tab.currentLoop].tracks[t].notes[n].play(pitchOffset,time);
                            
                            if (tab.sequence[tab.currentLoop].tracks[t].name !== "DRUMS" && tab.sequence[tab.currentLoop].tracks[t].notes[n].start+tab.sequence[tab.currentLoop].tracks[t].notes[n].duration === tab.sequence[tab.currentLoop].currentStep) tab.sequence[tab.currentLoop].tracks[t].notes[n].stop(pitchOffset,time);
                        }
                    }
                }
            }
        }
    }
}, "16n");

/*
Tone.Transport.scheduleRepeat((time) => {
    let loop = session.activeTab;
    if (loop.currentStep === loop.nSteps-1) loop.currentStep = 0;
    else loop.currentStep++;

    if (loop.click.state) {
        if (loop.currentStep%16 === 0) metronome.click[0].start(time);
        else if (loop.currentStep%4 === 0) metronome.click[1].start(time);
    }
    //else metronome.click[1].start();
  
    for (let t in loop.tracks) {
      for (let n in loop.tracks[t].timeline[loop.currentStep]) {
        if (loop.tracks[t].timeline[loop.currentStep][n] !== null) loop.tracks[t].timeline[loop.currentStep][n].play();
      }
    }
}, "16n");
*/

// ---------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------

const synthPresets = [
    {name: "BLOOM PAD 1",
    oscState: [true, true],
    osc: [[0,0.5,0.5],[0,0.5,0.5]],
    envState: [true, true],
    env: [[0,0.5,0.5,0],[0,0.5,0.5,0]],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},
    
    {name: "BLOOM BASS 2",
    oscState: [true, false],
    osc: [[1,0,0.5],[0,0.5,0.5]],
    envState: [true, false],
    env: [[0,0.5,0.5,0],[0,0.5,0.5,0]],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: true,
    delay: [0.25,0.5,0.3],
    reverbState: false,
    reverb: [0,0]},
];

const acoustic = [new Tone.Buffer(kickAcoustic), new Tone.Buffer(snareAcoustic), new Tone.Buffer(closedHatAcoustic), new Tone.Buffer(openedHatAcoustic), new Tone.Buffer(highTomAcoustic), new Tone.Buffer(lowTomAcoustic), new Tone.Buffer(crashAcoustic)];
const subtle = [new Tone.Buffer(kickSubtle), new Tone.Buffer(snareSubtle), new Tone.Buffer(closedHatSubtle), new Tone.Buffer(openedHatSubtle), new Tone.Buffer(highTomSubtle), new Tone.Buffer(lowTomSubtle), new Tone.Buffer(crashSubtle)];

const drumPresets = [
    {name: "ACOUSTIC",
    kit: acoustic,
    partState: [true, true, true, true, true, true, true],
    partVol: [1,1,1,1,1,1,1],
    partPitch: [0.5,0.5,0.5,0.5,0.5,0.5,0.5],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},

    {name: "ELECTRIC SUBTLE",
    kit: subtle,
    partState: [true, true, true, true, true, true, true],
    partVol: [1,1,1,1,1,1,1],
    partPitch: [0.5,0.5,0.5,0.5,0.5,0.5,0.5],
    filterState: false,
    filter: 0.5,
    distortionState: false,
    distortion: 0.5,
    delayState: false,
    delay: [0,0,0],
    reverbState: false,
    reverb: [0,0]},
];


// ---------------------------------------------------------------
// SYNTHS
// ---------------------------------------------------------------

class FxChain {
    constructor() {
        this.distortion = new Tone.Distortion({wet: 0.5});
        this.delay = new Tone.PingPongDelay();
        this.reverb = new Tone.Reverb({preDelay: 0});
        this.limiter = new Tone.Limiter(-1);
        this.gain = new Tone.Gain();
        this.splitter = new Tone.Split();
        this.left = new Tone.Meter();
        this.right = new Tone.Meter();

        this.filter = new Tone.Filter().chain(this.distortion, this.delay, this.reverb, this.limiter, this.gain, this.splitter);

        this.splitter.connect(this.left, 0, 0);
        this.splitter.connect(this.right, 1, 0);
        this.left.connect(new Tone.Panner(-1).toDestination());
        this.right.connect(new Tone.Panner(1).toDestination());
    }
}

class Synth {
    constructor() {
        this.oscillators = [new Tone.PolySynth(Tone.Synth), new Tone.PolySynth(Tone.Synth)];

        this.fxChain = new FxChain();

        this.oscillators[0].connect(this.fxChain.filter);
        this.oscillators[1].connect(this.fxChain.filter);
    }
}

class DrumSynth {
    constructor(kit) {
        this.loaded = false;

        this.parts = [];

        this.fxChain = new FxChain();

        for (let i = 0; i < 7; i++) {
            let part = new Tone.Player(kit[i]);
            this.parts.push(part);
            this.parts[i].connect(this.fxChain.filter);
        }      
    }
}

const melody = new Synth();
const harmony = new Synth();
const bass = new Synth();
const drums = new DrumSynth(acoustic);

function releaseAll() {
    melody.oscillators[0].releaseAll();
    melody.oscillators[1].releaseAll();
    bass.oscillators[0].releaseAll();
    bass.oscillators[1].releaseAll();
    harmony.oscillators[0].releaseAll();
    harmony.oscillators[1].releaseAll();
}


// ---------------------------------------------------------------
// EXPORT DEFAULT
// ---------------------------------------------------------------

const synths = { setSession, setGeneratedTracks, exportLoopAudio, exportStructAudio, synthPresets, drumPresets, melody, harmony, bass, drums, releaseAll, mic, micMeter, recorder, compareBuffers };

export default synths;