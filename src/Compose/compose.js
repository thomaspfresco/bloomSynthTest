/* BASED ON
Tom Holloway. "Flow Fields and Noise Algorithms with P5.js". 2020.
https://dev.to/nyxtom/flow-fields-and-noise-algorithms-with-p5-js-5g67
(acedido em 12/11/2023)

“Wandering in Space” by aceron: http://openprocessing.org/sketch/933943
License CreativeCommons Attribution: https://creativecommons.org/licenses/by-sa/3.0

“Wandering Particles” by celine: :http://openprocessing.org/sketch/989847
License CreativeCommons Attribution:ehttps://creativecommons.org/licenses/by-sa/3.0
*/

import audioBufferToWav from 'audiobuffer-to-wav';

import obliqueStratagies from "../obliqueStratagies.js";
import theory from "./theory.js";

import poppinsLightFont from '../Fonts/Poppins-Light.ttf';
import poppinsMediumFont from '../Fonts/Poppins-Medium.ttf';
import poppinsBoldFont from '../Fonts/Poppins-Bold.ttf';

import loopsPNG from '../Assets/loops.png';
import structsPNG from '../Assets/structs.png';
import gridPNG from '../Assets/grid.png';
import studioPNG from '../Assets/studio.png';
import autoPNG from '../Assets/automation.png';
import plusPNG from '../Assets/plus.png';
import arrowUpPNG from '../Assets/arrowUp.png';
import arrowDownPNG from '../Assets/arrowDown.png';
import aiPNG from '../Assets/ai.png';
import singPNG from '../Assets/sing.png';
import scratchPNG from '../Assets/scratch.png';

import dice1PNG from '../Assets/dice1.png';
import dice2PNG from '../Assets/dice2.png';
import dice3PNG from '../Assets/dice3.png';
import dice4PNG from '../Assets/dice4.png';
import dice5PNG from '../Assets/dice5.png';
import dice6PNG from '../Assets/dice6.png';

import petalOBJ1 from '../Assets/petal1.obj';
import petalOBJ2 from '../Assets/petal2.obj';
import petalOBJ3 from '../Assets/petal3.obj';
import petalOBJ4 from '../Assets/petal4.obj';

import synths from './synths.js';

//import { stringify } from 'flatted';
import * as Tone from 'tone';
import p5 from 'p5';

let saveDebounceInstant = 0;
let saveDebounceDelay = 5000;
let saving = false;
let sessionToSave = {};

let generatedTracks = [];

let checkMicPermition = false;
let recorderBlob;
let recordedTempo = 0;
let micLevelTune = 0;

let fontLight, fontMedium, fontBold;
let petal1, petal2, petal3, petal4;
let loopsIcon, structsIcon, gridIcon, studioIcon, autoIcon, plus, arrowUp, arrowDown, ai, sing, scratch;
let diceIcons = [];

let menuOpened = false;
let dragging = false;
let selectX = 0;
let selectY = 0;

let recordedNotes = [];

let inputNotes = [];
let maxInputNotes = 5;
let maxLoopsPerStruct = 5;
let currentOctave = 3;
let minOctave = 0;
let maxOctave = 8;

let nSteps = 64;

let gridStepSizeX;
let gridStepSizeY;
let gridInitX;
let gridInitY;

let phase = 0;
let zoff = 0;
let noiseMax = 1;

let petalModelSize = 0;

var particles = new Array(100);
var totalFrames = 360;
let counter = 0;

let petalParticles = new Array(50);
let diagonal;
let rotation = 0;

var playParticlesMax = 25;
var wander1 = 0.5;
var wander2 = 2.0;
var drag1 = 0.85;
var drag2 = 0.92;
var force1 = 1;
var force2 = 2;
var theta1 = -0.5;
var theta2 = 0.5;
var sizeScalar = 0.97;
let playSize1;
let playSize2;

let previewOpa = 0;
let drawerOpa = 0;
let previewDelay = 350;
let previewInstant = 0;

let maxWeightLines = 2;
let maxBars = 16;
let maxSteps = 4 * maxBars;

let maxTracks = 4;
let maxLoops = 50;
let maxStructs = 10;

let marginX;
let iconSize;
let iconCorners;

//let colors = [[100,50,100],[210,70,90],[235,160,80],[30,120,80]]; //purple, pink, yellow, green
let colors = [[0,65,170],[220,20,100],[250,160,25],[0,160,100]]; //blue, pink, yellow, green
let white = [255,245,220]; //white

let session;

// --------------------------------------------------------------------------------------

const sketch = (setLoading) => (p) => {

  //PARTICLES--------------------------------------------------------------------------------------

  function noiseLoop(diameter, min, max, rnd) {
    let cx = p.random(rnd || 1000);
    let cy = p.random(rnd || 1000);
    return function (angle) {
      let xoff = p.map(p.cos(angle), -1, 1, cx, cx + diameter);
      let yoff = p.map(p.sin(angle), -1, 1, cy, cy + diameter);
      let zoff = p.sin(angle) * 0.0001;
      let r = p.noise(xoff, yoff, zoff);
      return p.map(r, 0, 1, min, max);
    };
  }

  function drawParticles() {
    let percent = (counter % totalFrames) / totalFrames;
    let a = percent * p.TWO_PI;
    for (let i = 0; i < particles.length; i++) {
      particles[i].render(a);
    }
    counter++;
  }

  class Particle {

    constructor() {
      this.xn = noiseLoop(0.05, -p.windowWidth, p.windowWidth * 2);
      this.yn = noiseLoop(0.05, -p.windowHeight, p.windowHeight * 2);
      this.rn = noiseLoop(0.5, 0, 255);
      this.gn = noiseLoop(0.5, 0, 255);
      this.bn = noiseLoop(0.5, 0, 255);
      this.dn = noiseLoop(0.5, 1, 10);
      this.an = noiseLoop(1, 5, 200);
    }

    render(a) {
      p.noStroke();
      p.fill(this.rn(a), this.gn(a), this.bn(a), this.an(a) * 0.75);
      p.circle(this.xn(a), this.yn(a), this.dn(a) / 2);
    }
  }

  //petals in begining
  class PetalParticle {
    n;r;o;l;ang;angInc;color;
    constructor() {
        this.l = 1;
        this.n = p.random(1, p.windowWidth / 2);
        this.r = p.random(0, p.TWO_PI);
        this.o = p.random(1, p.random(1, p.windowWidth / this.n));
        this.ang = p.random(0, p.TWO_PI);
        this.angInc = p.random(0.005, 0.05);
        let aux = p.round(p.random(0,colors.length-1));
        this.color = colors[aux];
        switch (aux) {
          case 0: this.petal = petal1; break;
          case 1: this.petal = petal2; break;
          case 2: this.petal = petal3; break;
          case 3: this.petal = petal4; break;
        }
    }

    draw() {
        this.l++;
        p.push();
        p.rotate(this.r);
        p.translate(this.drawDist()+p.windowHeight/50*p.sin(this.ang/4), p.windowHeight/50*p.sin(this.ang/2),-p.windowWidth / this.o / 5);
        p.fill(this.color[0],this.color[1],this.color[2],p.min(this.l, 255));
        p.scale(p.windowWidth / this.o / 5 / petalModelSize);
        p.rotateX(this.ang);
        p.rotateY(this.ang);
        p.model(this.petal);
        //p.ellipse(0, 0, p.windowWidth / this.o / 50, p.windowWidth / this.o / 50);
        p.pop();
        this.o -= 0.015;
        this.ang += this.angInc;
    }

    drawDist() {
        return (p.atan(this.n / this.o) * p.windowWidth) / p.HALF_PI;
    }
  }

  class PlayParticle {
    constructor(x,y,size,color) {
      this.alive = true;
      this.size = size || 10;
      this.wander = 0.15;
      this.theta = p.random( p.TWO_PI );
      this.drag = 0.92;
      this.color = color;
      this.location = p.createVector(x || 0.0, y || 0.0);
      this.velocity = p.createVector(0.0, 0.0);
      this.opa = p.random(255/2,255);
    }

    move() {
      this.location.add(this.velocity);
      this.velocity.mult(this.drag);
      this.theta += p.random( theta1, theta2 ) * this.wander;
      this.velocity.x += p.sin( this.theta ) * 0.1;
      this.velocity.y += p.cos( this.theta ) * 0.1;
      this.size *= sizeScalar;
      this.alive = this.size > 0.5;
    }

    show() {
      p.fill(this.color[0],this.color[1],this.color[2],this.opa);
      p.noStroke();
      p.ellipse(this.location.x,this.location.y, this.size, this.size);
    }
  }

  function initLoadedSesh() {
    //console.log(sesh);
    session = new Session();

    if (sesh !== undefined) {
      for (let i in sesh.loops) {
        let newLoop = new Loop(sesh.loops[i].id, sesh.loops[i].name, sesh.loops[i].tempo);
        newLoop.tempoScroll.value = sesh.loops[i].tempo;
        newLoop.click.state = sesh.loops[i].clickState;
        newLoop.record.state = sesh.loops[i].recordState;

        for (let j in sesh.loops[i].tracks) {
          let newTrack = new Track(sesh.loops[i].tracks[j].id, sesh.loops[i].id, sesh.loops[i].tracks[j].name, sesh.loops[i].tracks[j].iconTargetX);

          newTrack.gain = sesh.loops[i].tracks[j].gain;
          newTrack.muted = sesh.loops[i].tracks[j].muted;

          newTrack.automationScroll.value = sesh.loops[i].tracks[j].automationScrollValue;
          newTrack.octaveScroll.value = sesh.loops[i].tracks[j].octaveScrollValue;
          newTrack.presetScroll.value = sesh.loops[i].tracks[j].presetScrollValue;

          newTrack.presetChanged = sesh.loops[i].tracks[j].presetChanged;

          for (let k in sesh.loops[i].tracks[j].knobs) {
            newTrack.knobs[k][1].value = sesh.loops[i].tracks[j].knobs[k].value;
            newTrack.knobs[k][1].output = sesh.loops[i].tracks[j].knobs[k].output;
            newTrack.knobs[k][1].automating = sesh.loops[i].tracks[j].knobs[k].automating;
            newTrack.knobs[k][1].automation = sesh.loops[i].tracks[j].knobs[k].automation;
          } 
          
          if (sesh.loops[i].tracks[j].name === "DRUMS") {
            for (let b in newTrack.drumButtons) newTrack.drumButtons[b].state = sesh.loops[i].tracks[j].drumButtons[b].state;
            for (let a=0; a<newTrack.synth.parts.length; a++) newTrack.synth.parts[a].buffer = synths.drumPresets[newTrack.presetScroll.value].kit[a];
          } else {
            for (let b in newTrack.oscButtons) {
              newTrack.oscButtons[b].state = sesh.loops[i].tracks[j].oscButtons[b].state;
              newTrack.envButtons[b].state = sesh.loops[i].tracks[j].envButtons[b].state;
            }
          }

          newTrack.filterButton.state = sesh.loops[i].tracks[j].filterButtonState;
          newTrack.distButton.state = sesh.loops[i].tracks[j].distButtonState;
          newTrack.dlyButton.state = sesh.loops[i].tracks[j].dlyButtonState;
          newTrack.revButton.state = sesh.loops[i].tracks[j].revButtonState;

          for (let n in sesh.loops[i].tracks[j].notes) {
            let newNote = new Note(sesh.loops[i].tracks[j].notes[n].pitch, sesh.loops[i].id, sesh.loops[i].tracks[j].id, sesh.loops[i].tracks[j].notes[n].start, sesh.loops[i].tracks[j].notes[n].duration, sesh.loops[i].tracks[j].notes[n].octave, sesh.loops[i].tracks[j].notes[n].color);
            newTrack.notes.push(newNote);
          }
          newLoop.tracks.push(newTrack);
        }
        session.loops.push(newLoop);
      }
    
      for (let i in sesh.structs) {
        let newStruct = new Structure(sesh.structs[i].id, sesh.structs[i].name);

        newStruct.tempoScroll.value = sesh.structs[i].tempo;
        newStruct.transposeScroll.value = sesh.structs[i].transpose;
        newStruct.tempoButton.state = sesh.structs[i].tempoButtonState;
        newStruct.transposeButton.state = sesh.structs[i].transposeButtonState;

        for (let j in sesh.structs[i].sequence) {
          newStruct.sequence.push(session.copyLoop(session.loops[sesh.structs[i].sequence[j].loopId]));
          newStruct.repeats.push(new Scrollable("REPEATS",sesh.structs[i].sequence[j].repeats,1,8,"x",1,1));
          newStruct.menus.push(new Menu(newStruct.id, newStruct.sequence.length, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
          newStruct.angle.push(p.random(0,2*p.PI));
          newStruct.angInc.push(p.random(0.01,0.02));
          //newStruct.sequence[j].repeat = sesh.structs[i].sequence[j].repeat;
          //newStruct.
        }
        session.structs.push(newStruct);
      }

      for (let i in sesh.tabs) {
        if (sesh.tabs[i].type === "loop") session.tabs.push(session.loops[sesh.tabs[i].id]);
        else session.tabs.push(session.structs[sesh.tabs[i].id]);
      }
    }

    //console.log("session loaded.");
  }

  //================================================================================================

  class Session {

    constructor() {
      this.loops = [];
      this.structs = [];
      this.tabs = [];

      this.maxTabs = 4;
      this.tabsY = p.windowHeight / 30;
      this.activeTab = null;
      this.bloomX = p.windowWidth / 2;
      this.bloomTargetX = p.windowWidth / 2;
      this.tabsX = [];
      this.tabsTargetX = [];
      this.blackoutOpa = 255;

      this.loopsIconX = 0;
      this.structsIconX = p.windowWidth / 2;

      this.logMessage = "";
      this.logOpa = 0;
      this.logInstant = 0;
      this.logDelay = 3000;
      this.showLog = false;

      for (let i = 0; i < this.maxTabs; i++) {
        this.tabsX.push(p.windowWidth / 2);
        this.tabsTargetX.push(p.windowWidth / 2);
      }

      this.drawerInstant = 0;
      this.drawerInterval = 50;

      this.suggestionInstant = 0;
      this.suggestionIndex = p.floor(p.random(0, obliqueStratagies.length));
      this.suggestionOpa = 0;

      this.loopDrawer = false;
      this.structDrawer = false;

      this.drawersDark = 0;
      this.drawersDarkMax = 225;
      this.drawersDarkInc = 10;

      this.loopsOffset = p.windowHeight / 25;
      this.structsOffset = p.windowHeight / 25;
      this.drawersOffsetInc = p.windowWidth / 500;
      this.loopsOpa = 0;
      this.structsOpa = 0;
      this.drawersOpaInc = 15;
      this.drawersOpaMax = 255;

      this.menu = new Menu(null, null, "sessionMenu", ["ABOUT","CLEAR SESSION"], "DROPDOWN");
    }

    alertLog(message) {
      this.logInstant = p.millis();
      this.logMessage = message;
      this.showLog = true;
    }

    drawLog() {
      if (this.showLog) {
        //reset log timer
        if (this.logOpa === 0) this.logInstant = p.millis();

        if (this.logOpa + 10 > 255/2) this.logOpa = 255/2;
        else this.logOpa += 10;
      } else {
        if (this.logOpa - 10 < 0) this.logOpa = 0;
        else this.logOpa -= 10;
      }

      p.fill(white[0], white[1], white[2], this.logOpa);
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(p.windowHeight / 60);
      p.textFont(fontLight);
      p.text(this.logMessage, p.windowWidth - gridInitX*1.2, gridInitY/2);

      if (p.millis() - this.logInstant > this.logDelay) this.showLog = false;
    }

    drawPetalParticles() {
      p.push();
      p.translate(p.windowWidth / 2, p.windowHeight / 2);
      rotation -= 0.001;
      p.rotate(rotation);
      
      for (let i = 0; i < petalParticles.length; i++) {
        petalParticles[i].draw();
          if (petalParticles[i].drawDist() > diagonal) {
            petalParticles[i] = new PetalParticle();
          }
      }
      p.pop();
    }

    async resolveRecording() {
      let audioBlob = await synths.recorder.stop();

      // Convert the WebM Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Create an AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Decode the ArrayBuffer to an AudioBuffer
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert the AudioBuffer to a WAV Blob
      const wavBuffer = audioBufferToWav(audioBuffer);
      recorderBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      recordedTempo = session.activeTab.tempoScroll.value;

      // Create a URL for the Blob
      //const url = URL.createObjectURL(wavBlob);
      //const anchor = document.createElement("a");
      //anchor.download = "recording.wav";
      //anchor.href = url;
      //anchor.click();

      //const url = URL.createObjectURL(recording);
      //const anchor = document.createElement("a");
      //anchor.download = "recording.webm";
      //anchor.href = url;
      //anchor.click();

      //let player = new Tone.Player(buffer).toDestination();
      //const anchor = document.getElementById("export");
      //anchor.download = "ai"+".wav";
      //anchor.href = url;
      //anchor.click();

      //const arrayBuffer = await audioBlob.arrayBuffer();
      //const buffer = new Tone.Buffer(arrayBuffer);


      //recorderBlob = URL.createObjectURL(r);
      //console.log(arrayBuffer);
    }

    draw() {
      this.drawersOffsetInc = p.windowWidth / 500;

      //draw sugestions oblique stratagies
      if (this.activeTab === null) {
        p.noStroke();
        this.drawPetalParticles();
        this.showSuggestions();

        //loop and struct drawers icons
        p.tint(255, 255/4);
        p.image(loopsIcon, p.windowHeight/30 + p.windowHeight / 35 / 2 - p.windowHeight / 25*2+this.loopsOffset*2, p.windowHeight/2, p.windowHeight / 35, p.windowHeight / 35);
        p.tint(255, 255/4);
        p.image(structsIcon, p.windowWidth - p.windowHeight/30 - p.windowHeight / 35 / 2 + p.windowHeight / 25*2-this.structsOffset*2,  p.windowHeight/2, p.windowHeight / 35, p.windowHeight / 35);
      }
      else this.activeTab.draw();

      //draw log
      this.drawLog();

      //icons for drawers
      //p.tint(255, 255/4);
      //p.image(loopsIcon, p.windowWidth/100 +p.windowHeight / 60 /2 - p.windowHeight / 25*2+this.loopsOffset*2, p.windowHeight/2, p.windowHeight / 60, p.windowHeight / 60);
      //p.tint(255, 255/4);
      //p.image(structsIcon, p.windowWidth - p.windowHeight/30 - p.windowHeight / 35 / 2 + this.structsOffset,  p.windowHeight/2, p.windowHeight / 60, p.windowHeight / 60);
      /*p.push();
      p.fill(0);
      p.circle(p.windowWidth / 80, p.windowHeight / 2, p.windowHeight / 100);
      p.fill(white[0], white[1], white[2],255/2);
      p.circle(p.windowWidth / 80, p.windowHeight / 2, p.windowHeight / 150);
      p.pop();*/

      //tab transition animation
      if (this.blackoutOpa - 10 < 0) this.blackoutOpa = 0;
      else this.blackoutOpa -= 10;
      p.noStroke();
      p.fill(0, 0, 0, this.blackoutOpa);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      //Tabs
      //this.drawTabs();

      //dark effect drawers
      p.noStroke();
      p.fill(0, 0, 0, this.drawersDark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      p.textFont(fontLight);

      //loop drawer
      p.textSize(p.windowHeight/40);
      p.textAlign(p.LEFT, p.TOP);
      
      p.fill(white[0], white[1], white[2], this.loopsOpa);
      p.text("LOOPS", p.windowHeight / 30 + p.windowHeight / 45*1.7 - this.loopsOffset, p.windowHeight/30);
      p.tint(255, this.loopsOpa);
      p.image(loopsIcon,  p.windowHeight / 30 + p.windowHeight / 45 / 2 - this.loopsOffset, p.windowHeight / 30 + p.windowHeight / 40 / 2 + p.windowHeight / 30 / 7, p.windowHeight / 45, p.windowHeight / 45);

      //loop plus
      if (p.mouseX > p.windowHeight/30 && p.mouseX < p.windowHeight/30+p.windowHeight/30 && p.mouseY > p.windowHeight-p.windowHeight/30-p.windowHeight/30 && p.mouseY < p.windowHeight-p.windowHeight/30 && dragging === false && menuOpened === false) {
        p.tint(255, this.loopsOpa);
        document.body.style.cursor = 'pointer';

        //create loop
        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            this.activeTab.selectedTrack = null;
            this.activeTab.view = 0;
          }
          let name = "myLoop"+(this.loops.length+1);
          name = session.generateNameLoop(name);
          this.loops.push(new Loop(this.loops.length, name, 120));
          this.manageTabs(this.loops[this.loops.length-1]);
          p.mouseIsPressed = false;
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        }
      }
      else p.tint(255, this.loopsOpa/3);
      p.image(plus, p.windowHeight/30+p.windowHeight/30/2 - this.loopsOffset, p.windowHeight-p.windowHeight/30-p.windowHeight/30/2, p.windowHeight / 35, p.windowHeight / 35);

      //struct drawer
      p.textSize(p.windowHeight/40);
      p.textAlign(p.RIGHT, p.TOP);

      p.fill(white[0], white[1], white[2], this.structsOpa);
      p.text("STRUCTS", p.windowWidth - p.windowHeight / 30 - p.windowHeight / 45*1.7 + this.structsOffset, p.windowHeight / 30);
      p.tint(255, this.structsOpa);
      p.image(structsIcon,  p.windowWidth - p.windowHeight / 30 - p.windowHeight / 45 / 2 + this.structsOffset, p.windowHeight / 30 + p.windowHeight / 40 / 2 + p.windowHeight / 30 / 7, p.windowHeight / 45, p.windowHeight / 45);

      //struct plus
      if (p.mouseX < p.windowWidth-p.windowHeight/30 && p.mouseX >  p.windowWidth-p.windowHeight/30-p.windowHeight/30 && p.mouseY > p.windowHeight-p.windowHeight/30-p.windowHeight/30 && p.mouseY < p.windowHeight-p.windowHeight/30 && dragging === false && menuOpened === false) {
        p.tint(255, this.structsOpa);
        document.body.style.cursor = 'pointer';

        //create struct
        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            if (this.activeTab.type === "loop") {
              this.activeTab.selectedTrack = null;
              this.activeTab.view = 0;
            }
          }
          let name = "myStruct"+(this.structs.length+1);
          name = session.generateNameStruct(name);
          this.structs.push(new Structure(this.structs.length, name));
          this.manageTabs(this.structs[this.structs.length-1]);
          p.mouseIsPressed = false;
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        }
      }
      else p.tint(255, this.structsOpa/3);
      p.image(plus, p.windowWidth-p.windowHeight/30-p.windowHeight/30/2 + this.structsOffset, p.windowHeight-p.windowHeight/30-p.windowHeight/30/2, p.windowHeight / 35, p.windowHeight / 35);

      //drawers trigger
      
      //drawers detrigger
      if (p.mouseX > p.windowWidth / 5) {
        if (this.loopDrawer) {
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        }
        this.loopDrawer = false;
      }
      if (p.mouseX < p.windowWidth - p.windowWidth / 5) {
        if (this.structDrawer) {
          if (this.activeTab !== null) {
            if (this.activeTab.type === "struct") {
              this.activeTab.play = false;
              for (let i = 0; i < this.activeTab.sequence.length; i++) this.activeTab.sequence[i].play = false;
            }
          }
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        }
        this.structDrawer = false;
      }
      //loop drawer
      if (this.loopDrawer) {
        if (this.loopsOffset - this.drawersOffsetInc < 0) this.loopsOffset = 0;
        else this.loopsOffset -= this.drawersOffsetInc;
        if (this.loopsOpa + this.drawersOpaInc > this.drawersOpaMax) this.loopsOpa = this.drawersOpaMax;
        else this.loopsOpa += this.drawersOpaInc;

        p.fill(white[0], white[1], white[2], this.loopsOpa/3);
        p.textAlign(p.RIGHT, p.TOP);
        p.textSize(p.windowHeight / 45);
        if (loopSearch === "") p.text("Type something...", p.windowWidth - p.windowHeight / 30, p.windowHeight / 30);
        else p.text(loopSearch, p.windowWidth - p.windowHeight / 30, p.windowHeight / 30);

        //draw colapsed loops
        if (this.loops.length === 0) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(p.windowHeight / 50);
          p.fill(white[0], white[1], white[2], this.loopsOpa/3);
          p.text('Click "+" to create a Loop', p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 2);
        }
        else {
            let loops = this.searchLoops();

            let dist = 0;
            let loopSize = 0;

            if (loops.length < 8) {
              dist = p.windowHeight/1.3/(8-1);
              loopSize = p.windowHeight/35;
            }
            else {
              dist = p.windowHeight/(1.4-0.004*loops.length)/(loops.length-1);
              loopSize = dist/4;
            }

            let totalDist = dist*(loops.length-1);

            if (loops.length === 0) {
              p.textAlign(p.LEFT, p.CENTER);
              p.textSize(p.windowHeight / 50);
              p.fill(white[0], white[1], white[2], this.loopsOpa/3);
              p.text('No results', p.windowHeight / 30 - this.loopsOffset, p.windowHeight / 2);
              
            }

            for (let i = 0; i < loops.length; i++) {
              
              let aux = p.abs(p.windowHeight / 2 - totalDist/2 + dist * i - p.mouseY);
              if (aux > (dist * 2)) aux = dist * 2;
              let mouseOffsetX = p.map(aux, dist * 2, 0, 0, loopSize*3);
              let sizeOffset = p.map(aux, dist * 2, 0, 0, loopSize/3);
              if (mouseOffsetX < 0 
                || p.mouseY < p.windowHeight / 2 - totalDist/2 - dist/2
                || p.mouseY > p.windowHeight / 2 + totalDist/2 + dist/2) {
                  mouseOffsetX = 0;
                  sizeOffset = 0;
              }
              if (this.drawerInterval/(loops.length/10) * i < (p.millis() - this.drawerInstant)) {
                if (loops[i].drawerDragging === false) loops[i].drawInDrawer(mouseOffsetX + p.windowHeight / 30 + loopSize, p.windowHeight / 2 - totalDist / 2 + dist*i, loopSize+sizeOffset);
              } else loops[i].emptyOpa = 0;

              //text info and preview
              if (p.mouseY > p.windowHeight / 2 - totalDist/2 + dist * i - dist / 2 && p.mouseY < p.windowHeight / 2 - totalDist/2 + dist * i + dist / 2 && dragging === false) {
                
                if (loops[i].hover === false) {
                  loops[i].hover = true;
                  drawerOpa = 0;
                  previewOpa = 0;
                  previewInstant = p.millis();
                  synths.releaseAll();
                  loops[i].play = false;
                  loops[i].currentStep = -1;
                }
                
                if (drawerOpa + this.drawersDarkInc > 255) drawerOpa = 255;
                else drawerOpa += this.drawersDarkInc;

                if (p.millis() - previewInstant > previewDelay) {
                  if (previewOpa + this.drawersDarkInc/2 > 255) previewOpa = 255;
                  else previewOpa += this.drawersDarkInc;
                } else loops[i].currentStep = -2;

                document.body.style.cursor = 'pointer';
                p.noStroke();
                p.fill(white[0], white[1], white[2], drawerOpa);
                p.textSize(p.windowHeight / 40);
                p.textAlign(p.LEFT, p.CENTER);
                p.textFont(fontMedium);
                p.text(loops[i].name, mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i-p.windowHeight / 70);
                p.fill(white[0], white[1], white[2],drawerOpa/2);
                p.textSize(p.windowHeight / 65);
                p.textFont(fontLight);
                p.text(loops[i].tempo+" BPM", +mouseOffsetX + p.windowHeight / 30 + loopSize*4, p.windowHeight / 2 - totalDist/2 + dist * i+p.windowHeight /70);
                
                loops[i].drawPreview(p.windowWidth/2+p.windowWidth/8, p.windowHeight/2, p.windowHeight/6);

                if (p.mouseIsPressed) {
                  if (loops[i].drawerDragging === false) loops[i].dragInstant = p.millis();
                  document.body.style.cursor = 'grabbing';
                  if (p.abs(p.dist(p.mouseX, p.mouseY,mouseOffsetX + p.windowHeight / 30 + loopSize, p.windowHeight / 2 - totalDist / 2 + dist*i)) > loopSize*2) {
                    dragging = true;
                    loops[i].drawerDragging = true;
                  }
                }
              }
              else{
                if (loops[i].hover) synths.releaseAll();
                loops[i].hover = false;
              }

              if (loops[i].drawerDragging) {
                document.body.style.cursor = 'grabbing';
                loops[i].drawInDrawer(p.mouseX, p.mouseY, loopSize);
              }

              if (p.mouseIsPressed === false) {
                loops[i].drawerDragging = false;
                dragging = false;
                //if (p.mous)
                if (p.millis() - loops[i].dragInstant < 100 && loops[i].drawerDragging === false) {
                Tone.Transport.stop();
                Tone.Transport.seconds = 0;
                synths.releaseAll();

                //this.loops[i].drawerDragging = true; 

                if (this.activeTab !== null) {
                  if (this.activeTab.type === "loop") {
                    this.activeTab.selectedTrack = null;
                    this.activeTab.view = 0;
                  } else {
                    if (this.activeTab.sequence.length > 0) {
                      this.activeTab.sequence[this.activeTab.currentLoop].play = false;
                      this.activeTab.sequence[this.activeTab.currentLoop].currentStep = -1;
                      this.activeTab.currentLoop = 0;
                      this.activeTab.currentRepeat = 0;
                    }
                  }
                }
                this.manageTabs(loops[i]);
                this.activeTab.active = true;
                this.drawersDark = 0;
                for (let t in loops[i].tracks) {
                  //loops[i].tracks[t].opaLine = 255;
                  for (let n in loops[i].tracks[t].notes){
                    loops[i].tracks[t].notes[n].x = loops[i].tracks[t].particlesPreviewX[nSteps-loops[i].tracks[t].notes[n].start+1];
                    loops[i].tracks[t].notes[n].y = loops[i].tracks[t].particlesPreviewY[ nSteps-loops[i].tracks[t].notes[n].start+1];
                  } 
                }
                
                //reset loops position
                for (let j = 0; j < loops[i].tracks.length; j++) {
                  this.loops[i].tracks[j].particlesX = this.loops[i].tracks[j].targetXpreview.concat();
                  this.loops[i].tracks[j].particlesY = this.loops[i].tracks[j].targetYpreview.concat();
                }

                //change mouse position to avoid imediate retriggering
                p.mouseX = p.windowWidth / 2;
                p.mouseY = 0;
                //p.mouseIsPressed = false;
              }
              }
            }
          
      }
      
      } else {
        if (this.loopsOffset + this.drawersOffsetInc > p.windowHeight / 25) this.loopsOffset = p.windowHeight / 25;
        else this.loopsOffset += this.drawersOffsetInc;
        if (this.loopsOpa - this.drawersOpaInc < 0) this.loopsOpa = 0;
        else this.loopsOpa -= this.drawersOpaInc;
      }
      //struct drawer
      if (this.structDrawer) {
        if (this.structsOffset - this.drawersOffsetInc < 0) this.structsOffset = 0;
        else this.structsOffset -= this.drawersOffsetInc;
        if (this.structsOpa + this.drawersOpaInc > this.drawersOpaMax) this.structsOpa = this.drawersOpaMax;
        else this.structsOpa += this.drawersOpaInc;

        p.fill(white[0], white[1], white[2], this.structsOpa/3);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(p.windowHeight / 45);
        if (structSearch === "") p.text("Type something...", p.windowHeight / 30, p.windowHeight / 30);
        else p.text(structSearch, p.windowHeight / 30, p.windowHeight / 30);

        //draw simplified/colapsed loops
        if (this.structs.length === 0) {
          p.textAlign(p.RIGHT, p.CENTER);
          p.textSize(p.windowHeight / 50);
          p.fill(white[0], white[1], white[2], this.structsOpa/3);
          p.text('Click "+" to create a Struct', p.windowWidth-p.windowHeight / 30 + this.structsOffset, p.windowHeight / 2);
        }
        else {
  
          //draw colapsed loops

              let structs = this.searchStructs();
  
              let dist = 0;
              let structSize = 0;
  
              if (structs.length < 8) {
                dist = p.windowHeight/1.3/(8-1);
                structSize = p.windowHeight/60;
              }
              else {
                dist = p.windowHeight/(1.4-0.004*structs.length)/(structs.length-1);
                structSize = dist/5;
              }
  
              let totalDist = dist*(structs.length-1);
  
              if (structs.length === 0) {
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(p.windowHeight / 50);
                p.fill(white[0], white[1], white[2], this.structsOpa/3);
                p.text('No results', p.windowWidth - p.windowHeight / 30 + this.structsOffset, p.windowHeight / 2);
                
              }
  
              for (let i = 0; i < structs.length; i++) {
                
                let aux = p.abs(p.windowHeight / 2 - totalDist/2 + dist * i - p.mouseY);
                if (aux > (dist * 2)) aux = dist * 2;
                let mouseOffsetX = p.map(aux, dist * 2, 0, 0, structSize*3);
                let sizeOffset = p.map(aux, dist * 2, 0, 0, structSize/3);
                if (mouseOffsetX < 0 
                  || p.mouseY < p.windowHeight / 2 - totalDist/2 - dist/2
                  || p.mouseY > p.windowHeight / 2 + totalDist/2 + dist/2) {
                    mouseOffsetX = 0;
                    sizeOffset = 0;
                }
                if (this.drawerInterval/(structs.length/10) * i < (p.millis() - this.drawerInstant)) {
                  if (structs[i].drawerDragging === false) structs[i].drawInDrawer(p.windowWidth-(mouseOffsetX + p.windowHeight / 30 + structSize), p.windowHeight / 2 - totalDist / 2 + dist*i, structSize+sizeOffset);
                } else structs[i].emptyOpa = 0;
  
                //text info and preview
                if (p.mouseY > p.windowHeight / 2 - totalDist/2 + dist * i - dist / 2 && p.mouseY < p.windowHeight / 2 - totalDist/2 + dist * i + dist / 2 && dragging === false) {
                  
                  if (structs[i].hover === false) {
                    this.structs[i].currentLoop = 0;
                    this.structs[i].currentRepeat = 0;
  
                    structs[i].hover = true;
                    for (let l in structs[i].sequence) structs[i].sequence[l].hover = true;
                    drawerOpa = 0;
                    previewOpa = 0;
                    previewInstant = p.millis();
                    synths.releaseAll();
                    structs[i].play = false;
                    structs[i].currentStep = -1;
                  }
                  
                  if (drawerOpa + this.drawersDarkInc > 255) drawerOpa = 255;
                  else drawerOpa += this.drawersDarkInc;
  
                  if (p.millis() - previewInstant > previewDelay) {
                    if (previewOpa + this.drawersDarkInc/2 > 255) previewOpa = 255;
                    else previewOpa += this.drawersDarkInc;
                  } else {
                    if (structs[i].sequence.length > 0) structs[i].sequence[structs[i].currentLoop].currentStep = -2;
                  }

                  let offset = 0;
                  if (structs[i].sequence.length === 0) offset = structSize*3.6;
                  else offset = structSize*3.6*structs[i].sequence.length;
  
                  document.body.style.cursor = 'pointer';
                  p.noStroke();
                  p.fill(white[0], white[1], white[2], drawerOpa);
                  p.textSize(p.windowHeight / 40);
                  p.textAlign(p.RIGHT, p.CENTER);
                  p.textFont(fontMedium);
                  p.text(structs[i].name, p.windowWidth-(mouseOffsetX + p.windowHeight / 30 + offset), p.windowHeight / 2 - totalDist/2 + dist * i-p.windowHeight / 70);
                  p.fill(white[0], white[1], white[2],drawerOpa/2);
                  p.textSize(p.windowHeight / 65);
                  p.textFont(fontLight);
                  p.text(structs[i].tempoScroll.value+" BPM, "+structs[i].transposeScroll.value+ "st", p.windowWidth-(mouseOffsetX + p.windowHeight / 30 + offset), p.windowHeight / 2 - totalDist/2 + dist * i+p.windowHeight /70);
                  
                  structs[i].drawPreview(p.windowWidth/2-p.windowWidth/7, p.windowHeight/2, p.windowHeight/16);
  
                  if (p.mouseIsPressed) {
                    if (structs[i].drawerDragging === false) structs[i].dragInstant = p.millis();
                    document.body.style.cursor = 'grabbing';
                    if (p.abs(p.dist(p.mouseX, p.mouseY,p.windowWidth - (mouseOffsetX + p.windowHeight / 30 + structSize), p.windowHeight / 2 - totalDist / 2 + dist*i)) > structSize*2) {
                      dragging = true;
                      structs[i].drawerDragging = true;
                    }
                  }
                }
                else{
                  if (structs[i].hover) synths.releaseAll();
                  structs[i].hover = false;
                  for (let l in structs[i].sequence) structs[i].sequence[l].hover = false;
                }
  
                if (structs[i].drawerDragging) {
                  document.body.style.cursor = 'grabbing';
                  structs[i].drawInDrawer(p.mouseX, p.mouseY, structSize);
                }
  
                if (p.mouseIsPressed === false) {
                  structs[i].drawerDragging = false;
                  dragging = false;
                  //if (p.mous)
                  if (p.millis() - structs[i].dragInstant < 100 && structs[i].drawerDragging === false) {
                  Tone.Transport.stop();
                  Tone.Transport.seconds = 0;
                  synths.releaseAll();
  
                  //this.loops[i].drawerDragging = true; 
  
                  if (this.activeTab !== null) {
                    if (this.activeTab.type === "loop") {
                      this.activeTab.selectedTrack = null;
                      this.activeTab.view = 0;
                    } else {
                      if (this.activeTab.sequence.length > 0) {
                        this.activeTab.sequence[this.activeTab.currentLoop].play = false;
                        this.activeTab.sequence[this.activeTab.currentLoop].currentStep = -1;
                        this.activeTab.currentLoop = 0;
                        this.activeTab.currentRepeat = 0;
                      }
                    }
                  }
                  this.manageTabs(structs[i]);
                  this.activeTab.active = true;
                  //this.drawersDark = 0;

                  /*for (let t in loops[i].tracks) {
                    //loops[i].tracks[t].opaLine = 255;
                    for (let n in loops[i].tracks[t].notes){
                      loops[i].tracks[t].notes[n].x = loops[i].tracks[t].particlesPreviewX[nSteps-loops[i].tracks[t].notes[n].start+1];
                      loops[i].tracks[t].notes[n].y = loops[i].tracks[t].particlesPreviewY[ nSteps-loops[i].tracks[t].notes[n].start+1];
                    } 
                  }*/
                  
                  //reset loops position
                  /*for (let j = 0; j < structs[i].sequence.length; j++) {
                    for (let t in structs[i].sequence[j].tracks) {
                      structs[i].sequence[j].tracks[t].particlesX = structs[i].sequence[j].tracks[t].targetXpreview.concat();
                      structs[i].sequence[j].tracks[t].particlesY = structs[i].sequence[j].tracks[t].targetYpreview.concat();
                    }
                  }*/
  
                  //change mouse position to avoid imediate retriggering
                  p.mouseX = p.windowWidth / 2;
                  p.mouseY = 0;
                  //p.mouseIsPressed = false;
                }
              }
            }      
        }

      } else {
        if (this.structsOffset + this.drawersOffsetInc > p.windowHeight / 25) this.structsOffset = p.windowHeight / 25;
        else this.structsOffset += this.drawersOffsetInc;
        if (this.structsOpa - this.drawersOpaInc < 0) this.structsOpa = 0;
        else this.structsOpa -= this.drawersOpaInc;
      }

      //draw loop or struct dragging
      if (this.loopDrawer === false && this.structDrawer === false) {
        for (let l in this.loops) {
          if (this.loops[l].drawerDragging) {
            if (session.activeTab !== null) {
              if (session.activeTab.type === "loop") document.body.style.cursor = 'not-allowed';
              else {
                if (session.activeTab.sequence.length < maxLoopsPerStruct) {
                  document.body.style.cursor ='grabbing';
                  session.activeTab.updateOffset(this.loops[l],p.mouseX,p.mouseY);
                }
                else document.body.style.cursor = 'not-allowed';
              }
            } else document.body.style.cursor = 'not-allowed';
            this.loops[l].drawInDrawer(p.mouseX, p.mouseY, p.windowHeight / 15);
          }

          if (p.mouseIsPressed === false && this.loops[l].drawerDragging) {
            if (this.loops[l].drawerDragging) if (session.activeTab !== null) if (session.activeTab.type === "struct" && session.activeTab.sequence.length < maxLoopsPerStruct) session.activeTab.addSectionLoop(this.loops[l],p.mouseX,p.mouseY);
            dragging = false;
            this.loops[l].drawerDragging = false;
          }
        }

        for (let s in this.structs) {
          if (this.structs[s].drawerDragging) {
            if (session.activeTab !== null) {
              if (session.activeTab.type === "loop") document.body.style.cursor = 'not-allowed';
              else {
                if (session.activeTab.sequence.length + this.structs[s].sequence.length <= maxLoopsPerStruct) {
                  document.body.style.cursor ='grabbing';
                  session.activeTab.updateOffset(this.structs[s],p.mouseX,p.mouseY);
                }
                else document.body.style.cursor = 'not-allowed';
              }
            } else document.body.style.cursor = 'not-allowed';
            this.structs[s].drawInDrawer(p.mouseX, p.mouseY, p.windowHeight / 30);
          }
          
          if (p.mouseIsPressed === false && this.structs[s].drawerDragging) {
            if (this.structs[s].drawerDragging) if (session.activeTab !== null) if (session.activeTab.type === "struct" && session.activeTab.sequence.length + this.structs[s].sequence.length <= maxLoopsPerStruct) session.activeTab.addSectionStruct(this.structs[s],p.mouseX,p.mouseY);
            dragging = false;
            this.structs[s].drawerDragging = false;
          }
        }
      }
    }

    generateNameLoop(name) {
      for (let l in this.loops) {
        if (this.loops[l].name === name && name[name.length-1] !== ")") name = name + "(1)";
        else if (this.loops[l].name === name && name[name.length-1] === ")") {
          let index = name.lastIndexOf("(");
          let number = parseInt(name.substring(index+1, name.length-1));
          name = name.substring(0, index) + "(" + (number+1) + ")";
        }
      }
      return name;
    }

    generateNameStruct(name) {
      for (let s in this.structs) {
        if (this.structs[s].name === name && name[name.length-1] !== ")") name = name + "(1)";
        else if (this.structs[s].name === name && name[name.length-1] === ")") {
          let index = name.lastIndexOf("(");
          let number = parseInt(name.substring(index+1, name.length-1));
          name = name.substring(0, index) + "(" + (number+1) + ")";
        }
      }
      return name;
    }

    searchLoops() {
      if (loopSearch !== prevLoopSearch) {
        synths.releaseAll();
        prevLoopSearch = loopSearch;
      }
      if (loopSearch === "") return this.loops;

      let loops = [];

      for (let i = 0; i < this.loops.length; i++) {
        //if (this.loops[i].name === loopSearch) loops.push(this.loops[i]);
        if ((this.loops[i].name.toLowerCase()).includes(loopSearch.toLowerCase())) loops.push(this.loops[i]);
        else if (String(this.loops[i].tempo).includes(loopSearch)) loops.push(this.loops[i]);
        else this.loops[i].hover = false;
      }

      return loops;
    }

    searchStructs() {
      if (structSearch !== prevStructSearch) {
        synths.releaseAll();
        if (session.structs.length > 0) {
          for (let s in session.structs) {
            for (let l in session.structs[s].sequence) {
              session.structs[s].sequence[l].play = false;
              session.structs[s].sequence[l].currentStep = -1;
              session.structs[s].currentLoop = 0;
              session.structs[s].currentRepeat = 0;
            }
          }
        }
        prevStructSearch = structSearch;
      }
      if (structSearch === "") return this.structs;

      let structs = [];

      for (let i = 0; i < this.structs.length; i++) {
        //if (this.loops[i].name === loopSearch) loops.push(this.loops[i]);
        if ((this.structs[i].name.toLowerCase()).includes(structSearch.toLowerCase())) structs.push(this.structs[i]);
        else if (String(this.structs[i].tempoScroll.value).includes(structSearch)) structs.push(this.structs[i]);
        else {
          this.structs[i].hover = false;
          for (let l in this.structs[i].sequence) this.structs[i].sequence[l].hover = false;
        }
      }

      return structs;
    }

    duplicateLoop(loopId) {
      let name = this.generateNameLoop(this.loops[loopId].name);
      let newLoop = new Loop(this.loops.length,name, this.loops[loopId].tempo);

      //buttons
      newLoop.click.state = this.loops[loopId].click.state;
      newLoop.record.state = this.loops[loopId].record.state;

      for (let t in this.loops[loopId].tracks) {

        let newTrack = new Track(this.loops[loopId].tracks[t].id, newLoop.id, this.loops[loopId].tracks[t].name, this.loops[loopId].tracks[t].iconTargetX);

        newTrack.muted = this.loops[loopId].tracks[t].muted;
        
        //knobs
        for (let k in newTrack.knobs) {
          //console.log(newTrack.knobs[k][1]);
          newTrack.knobs[k][1].value = this.loops[loopId].tracks[t].knobs[k][1].value;
          newTrack.knobs[k][1].output = this.loops[loopId].tracks[t].knobs[k][1].output;
          newTrack.knobs[k][1].automating = this.loops[loopId].tracks[t].knobs[k][1].automating;
          newTrack.knobs[k][1].automation = this.loops[loopId].tracks[t].knobs[k][1].automation;
        }

        //buttons
        if (newTrack.name === "DRUMS") for (let b in newTrack.drumButtons) newTrack.drumButtons[b].state = this.loops[loopId].tracks[t].drumButtons[b].state;
        else {
          for (let b in newTrack.oscButtons) {
            newTrack.oscButtons[b].state = this.loops[loopId].tracks[t].oscButtons[b].state;
            newTrack.envButtons[b].state = this.loops[loopId].tracks[t].envButtons[b].state;
          }
        }
        newTrack.filterButton.state = this.loops[loopId].tracks[t].filterButton.state;
        newTrack.distButton.state = this.loops[loopId].tracks[t].distButton.state;
        newTrack.dlyButton.state = this.loops[loopId].tracks[t].dlyButton.state;
        newTrack.revButton.state = this.loops[loopId].tracks[t].revButton.state;

        //scrolls
        newTrack.presetScroll.value = this.loops[loopId].tracks[t].presetScroll.value;
        newTrack.octaveScroll.value = this.loops[loopId].tracks[t].octaveScroll.value;
        newTrack.automationScroll.value = this.loops[loopId].tracks[t].automationScroll.value;

        //gain
        newTrack.gain = this.loops[loopId].tracks[t].gain;

        newTrack.presetChanged = this.loops[loopId].tracks[t].presetChanged;

        newLoop.tracks.push(newTrack);

        for (let n in this.loops[loopId].tracks[t].notes) {
          let newNote = new Note(this.loops[loopId].tracks[t].notes[n].pitch, newLoop.id, newTrack.id, this.loops[loopId].tracks[t].notes[n].start, this.loops[loopId].tracks[t].notes[n].duration,  this.loops[loopId].tracks[t].notes[n].octave, this.loops[loopId].tracks[t].notes[n].color);
          newLoop.tracks[t].notes.push(newNote);
        }
      }

      this.loops.push(newLoop);
      this.manageTabs(this.loops[this.loops.length-1]);

      //session.save();
    }

    duplicateStruct(structId) {
      let name = this.generateNameStruct(this.structs[structId].name);
      let newStruct = new Structure(this.structs.length,name);

      for (let s in this.structs[structId].sequence) {
        let newLoop = this.copyLoop(this.structs[structId].sequence[s]);
        newStruct.sequence.push(newLoop);
        newStruct.repeats.push(new Scrollable("REPEATS",this.structs[structId].repeats[s].value,1,8,"x",1,1));
        newStruct.menus.push(new Menu(newStruct.id, s, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
        newStruct.angle.push(this.structs[structId].angle[s]);
        newStruct.angInc.push(this.structs[structId].angInc[s]);
      }

      newStruct.tempoScroll.value = this.structs[structId].tempoScroll.value;
      newStruct.transposeScroll.value = this.structs[structId].transposeScroll.value;
      newStruct.tempoButton.state = this.structs[structId].tempoButton.state;
      newStruct.transposeButton.state = this.structs[structId].transposeButton.state;

      this.structs.push(newStruct);
      this.manageTabs(this.structs[this.structs.length-1]);

      //session.save();
    }

    deleteStruct(structId) {
      this.activeTab = null;

      for (let s in this.tabs) {
        if (this.tabs[s].id === structId && this.tabs[s].type === "struct") {
          this.tabs.splice(s, 1);
          break;
        }
      }

      this.structs.splice(structId, 1);

      for (let s in this.structs) {
        this.structs[s].id = s;
        this.structs[s].menu.tabId = s;
      }

      //session.save();
    }

    deleteLoop(loopId) {
      this.activeTab = null;

      for (let l in this.tabs) {
        if (this.tabs[l].id === loopId && this.tabs[l].type === "loop") {
          this.tabs.splice(l, 1);
          break;
        }
      }

      this.loops.splice(loopId, 1);

      
      for (let l in this.loops) {
        this.loops[l].id = l;

        this.loops[l].menu.tabId = l;
        this.loops[l].plusMenu.tabId = l;

        for (let t in this.loops[l].tracks) {
          this.loops[l].tracks[t].loopId = l;
          for (let n in this.loops[l].tracks[t].notes) {
            this.loops[l].tracks[t].notes[n].loopId = l;
          }
        }
      }

      this.blackoutOpa = 255;

      //session.save();
    }

    copyLoop(loop) {
      let newLoop = new Loop(loop.id, loop.name, loop.tempo);

      //buttons
      newLoop.click.state = loop.click.state;
      newLoop.record.state = loop.record.state;

      for (let t in loop.tracks) {

        let newTrack = new Track(loop.tracks[t].id, newLoop.id, loop.tracks[t].name, loop.tracks[t].iconTargetX);
        newTrack.muted = loop.tracks[t].muted;
        
        //knobs
        for (let k in newTrack.knobs) {
          //console.log(newTrack.knobs[k][1]);
          newTrack.knobs[k][1].value = loop.tracks[t].knobs[k][1].value;
          newTrack.knobs[k][1].output = loop.tracks[t].knobs[k][1].output;
          newTrack.knobs[k][1].automating = loop.tracks[t].knobs[k][1].automating;
          newTrack.knobs[k][1].automation = loop.tracks[t].knobs[k][1].automation;
        }

        //buttons
        if (newTrack.name === "DRUMS") for (let b in newTrack.drumButtons) newTrack.drumButtons[b].state = loop.tracks[t].drumButtons[b].state;
        else {
          for (let b in newTrack.oscButtons) {
            newTrack.oscButtons[b].state = loop.tracks[t].oscButtons[b].state;
            newTrack.envButtons[b].state = loop.tracks[t].envButtons[b].state;
          }
        }
        newTrack.filterButton.state = loop.tracks[t].filterButton.state;
        newTrack.distButton.state = loop.tracks[t].distButton.state;
        newTrack.dlyButton.state = loop.tracks[t].dlyButton.state;
        newTrack.revButton.state = loop.tracks[t].revButton.state;

        //scrolls
        newTrack.presetScroll.value = loop.tracks[t].presetScroll.value;
        newTrack.octaveScroll.value = loop.tracks[t].octaveScroll.value;
        newTrack.automationScroll.value = loop.tracks[t].automationScroll.value;

        //gain
        newTrack.gain = loop.tracks[t].gain;

        newTrack.presetChanged = loop.tracks[t].presetChanged;

        newLoop.tracks.push(newTrack);

        for (let n in loop.tracks[t].notes) {
          let newNote = new Note(loop.tracks[t].notes[n].pitch, newLoop.id, newTrack.id, loop.tracks[t].notes[n].start, loop.tracks[t].notes[n].duration, loop.tracks[t].notes[n].octave, loop.tracks[t].notes[n].colorOrig);
          newLoop.tracks[t].notes.push(newNote);
        }
      }

      return newLoop;
    }

    closeTab(type, tabId) {
      for (let l in this.tabs) {
        if (this.tabs[l].id === tabId && this.tabs[l].type === type) {
          this.tabs.splice(l, 1);
          break;
        }
      }
      session.activeTab = null;
    }

    //manage tabs
    manageTabs(tab) {
      //tabs list is not full and tab is not in tabs

      if (this.tabs.length < this.maxTabs && !this.tabs.includes(tab)) {
        this.tabs.push(tab);
        this.activeTab = tab;
        //console.log(this.tabsX, this.tabsTargetX);
        //this.tabsX[this.tabs.length - 1] = this.tabsTargetX[this.tabs.length - 1];
        //console.log(this.tabsX, this.tabsTargetX);
      }
         
      //tabs include tab
      else if (this.tabs.includes(tab)) {
        this.activeTab = tab;
      }

      //tabs full and tab is not in tabs
      else if (this.tabs.length === this.maxTabs && !this.tabs.includes(tab)) {
        this.tabs.shift();
        this.tabs.push(tab);
        this.activeTab = tab;
        //this.tabsTargetX.push(this.tabsTargetX[this.tabsTargetX.length-1]);
        //this.tabsTargetX.shift();
      }

      tab.play = false;
      synths.releaseAll();
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      this.loopDrawer = false;
      this.structDrawer = false;
    }

    drawTabs() {

      p.noStroke();
      p.textSize(p.windowHeight / 40);
      p.textAlign(p.CENTER, p.TOP);
      p.textFont(fontMedium);

      let totalDist = 0;
      let auxDist = 0;

      if (this.tabs.length === 0) this.bloomTargetX = p.windowWidth/2;
      else {

        totalDist += p.textWidth("BLOOM")/2+p.windowWidth/30+p.textWidth(this.tabs[0].name)/2;
        for (let i = 1; i < this.tabs.length; i++) totalDist += p.textWidth(this.tabs[i-1].name)/2+p.windowWidth/30+p.textWidth(this.tabs[i].name)/2;
        this.bloomTargetX = p.windowWidth / 2 - totalDist / 2;
        auxDist += p.textWidth("BLOOM")/2+p.windowWidth/30+p.textWidth(this.tabs[0].name)/2;
        this.tabsTargetX[0] = p.windowWidth / 2 - totalDist / 2+auxDist;

        for (let i = 1; i < this.tabs.length; i++) {
          auxDist += p.textWidth(this.tabs[i-1].name)/2+p.windowWidth/30+p.textWidth(this.tabs[i].name)/2;
          this.tabsTargetX[i] = p.windowWidth / 2 - totalDist / 2+auxDist;
        }
      }

      let dif = this.bloomTargetX - this.bloomX;
      this.bloomX += dif / 10;

      p.fill(white[0], white[1], white[2], 255/4);
      p.textFont(fontLight);
      if (this.activeTab === null) {
        p.fill(white[0], white[1], white[2]);
        p.textFont(fontMedium);
        if (p.mouseX > p.windowWidth/2-totalDist/2-p.textWidth("BLOOM")/2 && p.mouseX < p.windowWidth/2-totalDist/2+p.textWidth("BLOOM")/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2 && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'pointer';
          if (p.mouseIsPressed) {
            if (p.mouseButton === p.RIGHT) {
              this.menu.open();
              p.mouseIsPressed = false;
              //console.log("menu");
            }
          }
        }
      }
      else if (p.mouseX > p.windowWidth/2-totalDist/2-p.textWidth("BLOOM")/2 && p.mouseX < p.windowWidth/2-totalDist/2+p.textWidth("BLOOM")/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2 && dragging === false && menuOpened === false) {
        p.fill(white[0], white[1], white[2]);
        p.textFont(fontLight);
        document.body.style.cursor = 'pointer';

        if (p.mouseIsPressed) {
          if (this.activeTab !== null) {
            this.activeTab.play = false;
            if (this.activeTab.type === "loop") {
            this.activeTab.selectedTrack = null;
            this.activeTab.view = 0;
            } else {

              if (this.activeTab.sequence.length > 0) {
                this.activeTab.sequence[this.activeTab.currentLoop].play = false;
                this.activeTab.sequence[this.activeTab.currentLoop].currentStep = -1;
                this.activeTab.currentLoop = 0;
                this.activeTab.currentRepeat = 0;
              }
            }
          }
          this.activeTab = null;
          p.mouseIsPressed = false;
          this.blackoutOpa = 255;

          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        } 
        
      }
      p.push();
      if (menuOpened) p.translate(0,0, p.windowHeight / 30);
      p.text("BLOOM", this.bloomX, p.windowHeight / 30);
      p.pop();

      for (let i = 0; i < this.tabs.length; i++) {

        if (this.tabs[i].tabOpa + 5 > 255) this.tabs[i].tabOpa = 255;
        else this.tabs[i].tabOpa += 5;

        if (this.activeTab === this.tabs[i]) {
          p.fill(white[0], white[1], white[2],this.tabs[i].tabOpa);
          p.textFont(fontMedium);
        }

        if (p.mouseX > this.tabsTargetX[i]-p.textWidth(this.tabs[i].name)/2 && p.mouseX < this.tabsTargetX[i]+p.textWidth(this.tabs[i].name)/2 && p.mouseY > p.windowHeight / 30 && p.mouseY < p.windowHeight / 30 * 2 && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'pointer';

          if (this.activeTab !== this.tabs[i]) {
            p.fill(white[0], white[1], white[2]);
            p.textFont(fontLight);
            if (p.mouseIsPressed) {
              if (this.activeTab !== null) {
                if (this.activeTab.type === "loop" && this.activeTab.selectedTrack !== null) this.activeTab.selectedTrack.deselectAllNotes();
                this.activeTab.selectedTrack = null;
                this.activeTab.view = 0;
              }
              if (this.tabs[i].type === "struct") this.tabs[i].update();
              this.activeTab = this.tabs[i];
              this.activeTab.active = false;
              
              this.activeTab.play = false;
    
              Tone.Transport.stop();
              Tone.Transport.seconds = 0;
              synths.releaseAll();
              
              p.mouseIsPressed = false;
            }
          }
          else {
            if (p.mouseIsPressed) {
              if (p.mouseButton === p.RIGHT) {
                this.tabs[i].menu.open();
                if (this.tabs[i].type === "loop" && this.tabs[i].selectedTrack !== null) this.tabs[i].selectedTrack.deselectAllNotes();
              }
              p.mouseIsPressed = false;
            }
          }

        }
        else if (this.activeTab !== this.tabs[i]) {
          p.fill(white[0], white[1], white[2],255/4);
          p.textFont(fontLight);
        }
        dif = this.tabsTargetX[i] - this.tabsX[i];
        this.tabsX[i] += dif / 10;
        p.push();
        if (menuOpened) p.translate(0,0, p.windowHeight / 30);
        p.text(this.tabs[i].name, this.tabsX[i], p.windowHeight / 30);
        p.pop();
      }

      for (let i = 0; i < this.tabs.length; i++) this.tabs[i].menu.draw(this.tabsX[i]-p.textWidth(this.tabs[i].name)/2, p.windowHeight / 30);

      //menu
      p.textFont(fontMedium);
      this.menu.draw(this.bloomX-p.textWidth("BLOOM")/2, p.windowHeight / 30);
    }

    //draw sugestions
    showSuggestions() {
      if (p.millis() - this.suggestionInstant > 15000) {
        this.suggestionInstant = p.millis();
        this.suggestionOpa = 0;
        this.suggestionIndex = p.floor(p.random(0, obliqueStratagies.length));
      }
       
      if (this.suggestionOpa + 5 > 255) this.suggestionOpa = 255;
      else this.suggestionOpa += 5;

      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(fontMedium);
      p.noStroke();
      p.fill(white[0], white[1], white[2],this.suggestionOpa/2);
      p.textSize(p.windowHeight / 50);
      p.text('"'+obliqueStratagies[this.suggestionIndex]+'"', p.windowWidth / 2, p.windowHeight-p.windowHeight/30*2.4);

      p.fill(white[0]/4, white[1]/4, white[2]/4);
      p.textSize(p.windowHeight / 70);
      p.textFont(fontLight);
      p.text("in Oblique Strategies — Brian Eno, Peter Schmidt", p.windowWidth / 2, p.windowHeight-p.windowHeight/30*1.6);


      //p.text("LOOP: "+loopSearch, p.windowWidth/2, p.windowHeight/30+p.windowHeight/30);
    }

    retrieveLoopInfo(l) {
      let loop = {};
      loop.id = l.id;
      loop.name = l.name;
      loop.tempo = l.tempo;
      loop.clickState = l.click.state;
      loop.recordState = l.record.state;
      loop.tracks = {};
      for (let j=0; j<l.tracks.length; j++) {
        let track = {};

        track.id = l.tracks[j].id;
        track.name = l.tracks[j].name;
        track.iconTargetX = l.tracks[j].iconTargetX;
        
        track.muted = l.tracks[j].muted;

        //knobs
        track.knobs = {};
        for (let k=0; k<l.tracks[j].knobs.length; k++) {
          let knob = {};
          knob.value = l.tracks[j].knobs[k][1].value;
          knob.output = l.tracks[j].knobs[k][1].output;
          knob.automating = l.tracks[j].knobs[k][1].automating;
          knob.automation = l.tracks[j].knobs[k][1].automation;
          track.knobs[k] = knob;
        }

        //buttons
        if (track.name === "DRUMS") {
          track.drumButtons = {};
          for (let b=0; b<l.tracks[j].drumButtons.length; b++) {
            let button = {};
            button.state = l.tracks[j].drumButtons[b].state;
            track.drumButtons[b] = button;
          }
        } else {
          track.oscButtons = {};
          track.envButtons = {};
          for (let b=0; b<l.tracks[j].oscButtons.length; b++) {
            let oscButton = {};
            oscButton.state = l.tracks[j].oscButtons[b].state;
            track.oscButtons[b] = oscButton;
            let envButton = {};
            envButton.state = l.tracks[j].envButtons[b].state;
            track.envButtons[b] = envButton;
          }
        }

        track.filterButtonState = l.tracks[j].filterButton.state;
        track.distButtonState = l.tracks[j].distButton.state;
        track.dlyButtonState = l.tracks[j].dlyButton.state;
        track.revButtonState = l.tracks[j].revButton.state;

        //scrolls
        track.presetScrollValue = l.tracks[j].presetScroll.value;
        track.octaveScrollValue = l.tracks[j].octaveScroll.value;
        track.automationScrollValue = l.tracks[j].automationScroll.value;

        //gain
        track.gain = l.tracks[j].gain;
        track.presetChanged = l.tracks[j].presetChanged;
        loop.tracks[j] = track;

        loop.tracks[j].notes = {};
        for (let n=0; n<l.tracks[j].notes.length; n++) {
          let note = {};
          note.pitch = l.tracks[j].notes[n].pitch;
          note.start = l.tracks[j].notes[n].start;
          note.duration = l.tracks[j].notes[n].duration;
          note.octave = l.tracks[j].notes[n].octave;
          note.color = l.tracks[j].notes[n].colorOrig;
          loop.tracks[j].notes[n] = note;
        }
      }
      return loop;
    }

    save() {
      if ((this.activeTab === null || (this.activeTab !== null && this.activeTab.type === "loop")) && this.structDrawer === false) {
        for (let i = 0; i < this.structs.length; i++) this.structs[i].update();
      }

      let s = {};
      let loops = {};
      for (let i=0; i<this.loops.length; i++) { 
        loops[i] = this.retrieveLoopInfo(this.loops[i]);
      }
     
      s.loops = loops;

      let structs = {};
      for (let i=0; i<this.structs.length; i++) {
        let struct = {};
        struct.id = this.structs[i].id;
        struct.name = this.structs[i].name;
        struct.tempo = this.structs[i].tempoScroll.value;
        struct.transpose = this.structs[i].transposeScroll.value;
        struct.tempoButtonState = this.structs[i].tempoButton.state;
        struct.transposeButtonState = this.structs[i].transposeButton.state;

        struct.sequence = {};
        for (let j=0; j<this.structs[i].sequence.length; j++) {
          let loopId = this.structs[i].sequence[j].id;
          let seq = {};
          seq.loopId = loopId;
          seq.repeats = this.structs[i].repeats[j].value;
          struct.sequence[j] = seq;
        }

        structs[i] = struct;
      }

      s.structs = structs;

      let tabs = {};
      for (let i=0; i<this.tabs.length; i++) {
        let tab = {};
        tab.id = this.tabs[i].id;
        if (this.tabs[i].type === "loop") tab.type = "loop";
        else tab.type = "struct";
        tabs[i] = tab;
      }
      
      s.tabs = tabs;

      s = JSON.stringify(s);

      if (s === sessionToSave) {
        //console.log("no changes");
        return;
      }
      else {
        let hours = p.hour();
        let minutes = p.minute();
        if (minutes < 10) minutes = "0"+minutes;
        if (hours < 10) hours = "0"+hours;
        //this.alertLog("Session saved at "+hours+":"+minutes+".");
        //console.log("saving");
        sessionToSave = s;
        //saveSession(s);
      }
    }

    manageRecordedNotes(input,octave) {
      if (session.activeTab.record.state && session.activeTab.play && session.activeTab.currentStep > -1) {
        let check = false;
        for (let n in recordedNotes) {
          if (recordedNotes[n].pitch === input && recordedNotes[n].octave === octave && recordedNotes[n].trackId === session.activeTab.selectedTrack.id) {
            check = true;
            break;
          }  
        }
        if (check === false) recordedNotes.push(new Note(input, session.activeTab.id, session.activeTab.selectedTrack.id, session.activeTab.currentStep, 1, octave, session.activeTab.selectedTrack.color)); 
      }
    }

    resolveRecordedNotes(input,octave) {
      if (session.activeTab.record && session.activeTab.play) {
        for (let i = 0; i < recordedNotes.length; i++) {
          if (recordedNotes[i].pitch === input && recordedNotes[i].octave === octave && recordedNotes[i].trackId === session.activeTab.selectedTrack.id) {
            //recordedNotes[i].duration = session.activeTab.currentStep - recordedNotes[i].start;
            
            //let track = session.activeTab.tracks[recordedNotes[i].trackId];

            //recordedNotes[i].x = gridInitX + recordedNotes[i].start * gridStepSizeX;

            //if (recordedNotes[i].octave === track.octaveScroll.value) recordedNotes[i].y = gridInitY + (track.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(track.nPitches-1));
            //else if (recordedNotes[i].octave === track.octaveScroll.value+1) recordedNotes[i].y = gridInitY + (track.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(track.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4;

            //if (recordedNotes[i].octave === track.octaveScroll.value) recordedNotes[i].draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
            //else if (recordedNotes[i].octave === track.octaveScroll.value+1) recordedNotes[i].draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);

            if (recordedNotes[i].duration === 0) recordedNotes[i].duration = 1;
            session.activeTab.selectedTrack.ajustNotes(recordedNotes[i]);
            session.activeTab.selectedTrack.notes.push(recordedNotes[i]);
            recordedNotes.splice(i, 1);
            break;
          }
        }
        //session.save();
      }
    }

   async createTracksWithGeneratedNotes(loopId,name) {
      generatedTracks = [];

      let parts = await generate(name,session.loops[loopId].getInfoJSON());

      for (let part in parts) {
        let track = new Track(session.loops[loopId].tracks.length, loopId, name, p.windowWidth / 2);
        for (let n in parts[part]) {
          let note = new Note(parts[part][n].pitch, loopId, track.id, parts[part][n].start, parts[part][n].duration, parts[part][n].octave, track.color);
          track.notes.push(note);
        }
        track.octaveScroll.value = parts[part][0].octave;
        generatedTracks.push(track);
      }

      session.activeTab.click.state = false;
      session.activeTab.plusMenu.soloButton.color = generatedTracks[0].color;

      synths.setGeneratedTracks(generatedTracks);
    }
  }

  class Structure {

    constructor(id, name) {
      this.type = "struct";

      this.id = id;
      this.name = name;

      for (let s in session.structs) {
        if (session.structs[s].name === this.name && this.name[this.name.length-1] !== ")") this.name = this.name + "(1)";
        else if (session.structs[s].name === this.name && this.name[this.name.length-1] === ")") {
          let index = this.name.lastIndexOf("(");
          let number = parseInt(this.name.substring(index+1, this.name.length-1));
          this.name = this.name.substring(0, index) + "(" + (number+1) + ")";
        }
      }
       
      this.tempo = 120;
      this.transpose = 0;

      this.sequence = [];

      this.repeats = [];
      this.menus = [];
      this.dragging = [];
      this.loopsHover = [];

      for (let i=0; i<maxLoopsPerStruct; i++) {
        this.dragging.push(false);
        this.loopsHover.push(false);
      }

      this.diceAngle = 4*p.PI;
      this.diceAnginc = p.PI/12;
      this.diceSizeOffset = 0;

      this.tabOpa = 0;
      //for (let i=0; i < this.sequence.length; i++) this.repeats.push(new Scrollable("REPEATS",2,1,8,"x",1,1));

      this.currentLoop = 0;
      this.currentRepeat = 0;

      this.gap = p.windowWidth / 6;
      this.totalDist = 0;
      this.y = 0;

      this.previewX = p.windowWidth / 2;

      this.lastX = 0;

      this.offset = 0;
      this.insertPos = 0;
      this.swapPos = -1;

      this.yOffset = p.windowHeight / 150;
      this.angle = [];
      this.angInc = [];

      this.loopRadius = p.windowWidth / 20;

      this.play = false;
      this.hover = false;
      this.drawerDragging = false;

      this.emptyOpa = 0;
      this.dragInstant = 0;

      this.blackoutOpa = 0;
      this.active = false;

      this.tempoScroll = new Scrollable("TEMPO",120,20,400,"BPM",1,5);
      this.transposeScroll = new Scrollable("TRANSPOSE",0,-11,11,"ST",1,1);

      this.tempoButton = new Button("TEMPO", false, white);
      this.transposeButton = new Button("TRANSPOSE", false, white);

      this.menu = new Menu(this.id, null, "structMenu", ["EXPORT","RENAME","DUPLICATE", "CLOSE TAB", "DELETE"],"DROPDOWN");
    }

    createFromLoop(loop) {
      let newLoop = session.copyLoop(loop);
      this.sequence.push(newLoop);
      this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
      this.angle.push(p.random(0,2*p.PI));
      this.angInc.push(p.random(0.01,0.02));
      this.menus.push(new Menu(this.id, 0, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
      //session.save();
    }

    update() {
      //console.log("update struct");
      for (let i = 0; i < this.sequence.length; i++) {
        let check = false;
        for (let l in session.loops) {
          if (session.loops[l].name === this.sequence[i].name) {
            check = true;
            let loopCopy = session.copyLoop(session.loops[l]);
            for (let t in this.sequence[i].tracks) {
              loopCopy.tracks[t].particlesStructX = this.sequence[i].tracks[t].particlesStructX.concat();
              loopCopy.tracks[t].particlesStructY = this.sequence[i].tracks[t].particlesStructY.concat();
              for (let n in this.sequence[i].tracks[t].notes){  
                if (loopCopy.tracks[t].notes[n] !== undefined) loopCopy.tracks[t].notes[n].ang = this.sequence[i].tracks[t].notes[n].ang;
              } 
            }
            this.sequence[i] = loopCopy;
            break;
          }
        }
        if (check === false) {
          this.deleteSection(i);
          i--;
        }
      }
    }

    updateSwap(x) {
      if (this.sequence.length === 0) this.swapPos = 0;
      else {
        if (x < p.windowWidth / 2-this.totalDist/2-this.loopRadius) this.swapPos = 0;
        else if (x > p.windowWidth / 2-this.totalDist/2+this.totalDist+this.loopRadius) this.swapPos = this.sequence.length-1;
        else {
          for (let i = 0; i < this.sequence.length; i++) {
            if (x > p.windowWidth / 2-this.totalDist/2+i*this.gap+this.loopRadius && x < p.windowWidth / 2-this.totalDist/2+(i+1)*this.gap-this.loopRadius) {
              this.swapPos = i;
              break;
            }
          }
        }
      }
    }

    swapLoops(i) {
      if (this.swapPos !== i && p.abs(p.mouseX-this.lastX)>this.loopRadius) {
        let loop = this.sequence[i];
        let repeat = this.repeats[i];
        this.sequence.splice(i,1);
        this.repeats.splice(i,1);
        this.sequence.splice(this.swapPos,0,loop);
        this.repeats.splice(this.swapPos,0,repeat);
      }

      this.swapPos = -1;
      this.joinDoubles();
      //session.save();
    }

    updateOffset(obj,x,y) {
      if (obj !== null) {

        if (this.sequence.length === 0) this.insertPos = 0;
        else {
          if (x < p.windowWidth / 2-this.totalDist/2-this.loopRadius) this.insertPos = 0;
          else if (x > p.windowWidth / 2-this.totalDist/2+this.totalDist+this.loopRadius) this.insertPos = this.sequence.length;
          else {
            for (let i = 0; i < this.sequence.length; i++) {
              if (x > p.windowWidth / 2-this.totalDist/2+i*this.gap+this.loopRadius && x < p.windowWidth / 2-this.totalDist/2+(i+1)*this.gap-this.loopRadius) {
                this.insertPos = i;
                break;
              }
            }
          }
        }

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 45);
        p.fill(white[0], white[1], white[2],255/2);
        
        if (obj.type === "loop") {
          this.offset = this.gap;
          p.text(obj.name, p.windowWidth / 2-this.totalDist/2+this.insertPos*this.gap, this.y+this.loopRadius*2);

        } else {
          this.offset = this.gap*obj.sequence.length;
          for (let i = 0; i < obj.sequence.length; i++) {
            p.text(obj.sequence[i].name, p.windowWidth / 2-this.totalDist/2+(this.insertPos+i)*this.gap, this.y+this.loopRadius*2);
          }
        }
      
      } else this.offset = 0;
    }

    joinDoubles() {
      if (this.sequence.length === 0) return;

      let sequence = [];
      let repeats = [];
      let menus = [];
      let angles = [];
      let angIncs = [];
      let i = 0;
  
      while (i < this.sequence.length) {
          let count = 1;
          let reps = this.repeats[i].value;
          while (i + count < this.sequence.length && this.sequence[i].name === this.sequence[i + count].name) {
              reps += this.repeats[i + count].value;
              if (reps > this.repeats[i + count].max) reps = this.repeats[i + count].max;
              count++;
          }
  
          if (count > 1) {
              sequence.push(this.sequence[i]);
              this.repeats[i].value = reps;
              repeats.push(this.repeats[i]);
              angles.push(this.angle[i]);
              angIncs.push(this.angInc[i]);
          } else {
              sequence.push(this.sequence[i]);
              repeats.push(this.repeats[i]);
              angles.push(this.angle[i]);
              angIncs.push(this.angInc[i]);
          }
  
          i += count;
      }

      for (let i = 0; i < sequence.length; i++) menus.push(new Menu(this.id, i, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
  
      this.sequence = sequence;
      this.repeats = repeats;
      this.menus = menus;
      this.angle = angles;
      this.angInc = angIncs;
    }

    drawPreview(x,y,radius) {
      if (this.sequence.length > 0) {
        let totalDist = this.gap/1.5 * (this.sequence.length - 1);
        for (let i = 0; i < this.sequence.length; i++) {
          if (this.currentLoop === i) this.sequence[i].play = true;
          else {
            this.sequence[i].play = false;
          }
          this.sequence[i].drawPreview(x-totalDist/2+this.gap/1.5*i,y,radius);
        }
      }
    }

    drawInDrawer(x, y, size) {
      
      if (this.sequence.length === 0) {
        if (this.emptyOpa + 10 > 255) this.emptyOpa = 255;
        else this.emptyOpa += 10;

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 70);
        if (this.hover) p.fill(white[0], white[1], white[2],this.emptyOpa);
        else p.fill(white[0], white[1], white[2], this.emptyOpa/2);
        p.text("EMPTY", x, y);
       }

      for (let i = this.sequence.length-1; i > -1; i--) {
        this.sequence[i].drawInDrawer(x, y, size);
        x -= size*2.6;
      }     
    }

    deleteSection(i) {
      let sequence = [];
      let repeats = [];
      let angles = [];
      let angIncs = [];

      for (let s = 0; s < this.sequence.length; s++) {
        //console.log(s,i);
        if (s !== i) {
          sequence.push(this.sequence[s]);
          repeats.push(this.repeats[s]);
          angles.push(this.angle[s]);
          angIncs.push(this.angInc[s]);
        }
      }

      //console.log(sequence);

      this.sequence = sequence;
      this.repeats = repeats;
      this.angle = angles;
      this.angInc = angIncs;

      this.joinDoubles();
      //session.save();
    }

    addSectionLoop(loop,x,y) {
      //find the postion to insert the loop

      let newLoop = session.copyLoop(loop);
      for (let t in newLoop.tracks) {
        newLoop.tracks[t].particlesStructX = loop.tracks[t].particlesDrawerX.concat();
        newLoop.tracks[t].particlesStructY = loop.tracks[t].particlesDrawerY.concat();
      }

      if (this.sequence.length === 0 || this.insertPos === this.sequence.length) {
        this.sequence.push(newLoop);
        this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
        this.menus.push(new Menu(this.id, this.sequence.length, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
        this.angle.push(p.random(0,2*p.PI));
        this.angInc.push(p.random(0.01,0.02));
      } else {
        this.sequence.splice(this.insertPos,0,newLoop);
        this.repeats.splice(this.insertPos,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
        this.menus.splice(this.insertPos,0,new Menu(this.id, this.insertPos, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
        this.angle.splice(this.insertPos,0,p.random(0,2*p.PI));
        this.angInc.splice(this.insertPos,0,p.random(0.01,0.02));
      }

      this.joinDoubles();
      this.updateOffset(null,p.mouseX,p.mouseY);
      
     /* if (this.sequence.length === 0) {
        this.sequence.push(session.copyLoop(loop));
        this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
        this.menus.push(new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
        this.angle.push(p.random(0,2*p.PI));
        this.angInc.push(p.random(0.01,0.02));
      } else {
        if (x < p.windowWidth / 2-this.totalDist/2) {
          this.sequence.splice(0,0,session.copyLoop(loop));
          this.repeats.splice(0,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.splice(0,0,new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
          this.angle.splice(0,0,p.random(0,2*p.PI));
          this.angInc.splice(0,0,p.random(0.01,0.02));
        } else if (x > p.windowWidth / 2+this.totalDist/2) {
          this.sequence.push(session.copyLoop(loop));
          this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.push(new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
          this.angle.push(p.random(0,2*p.PI));
          this.angInc.push(p.random(0.01,0.02));
        } else {
          for (let i = 0; i < this.sequence.length; i++) {
            if (x > p.windowWidth / 2-this.totalDist/2+i*this.gap && x < p.windowWidth / 2-this.totalDist/2+(i+1)*this.gap) {
              this.sequence.splice(i+1,0,session.copyLoop(loop));
              this.repeats.splice(i+1,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
              this.menus.splice(i+1,0,new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
              this.angle.splice(i+1,0,p.random(0,2*p.PI));
              this.angInc.splice(i+1,0,p.random(0.01,0.02));
              break;
            }
          }
        }
      }*/
    }

    addSectionStruct(struct,x,y) {

      if (this.sequence.length === 0 || this.insertPos === this.sequence.length) {
        for (let s in struct.sequence) {
          this.sequence.push(session.copyLoop(struct.sequence[s]));
          this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.push(new Menu(this.id, this.sequence.length, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
          this.angle.push(p.random(0,2*p.PI));
          this.angInc.push(p.random(0.01,0.02));
        }
      } else {
        for (let i = struct.sequence.length-1; i > -1; i--) {
          this.sequence.splice(this.insertPos,0,session.copyLoop(struct.sequence[i]));
          this.repeats.splice(this.insertPos,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.splice(this.insertPos,0,new Menu(this.id, this.insertPos, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPDOWN"));
          this.angle.splice(this.insertPos,0,p.random(0,2*p.PI));
          this.angInc.splice(this.insertPos,0,p.random(0.01,0.02));
        }
      }
      
      this.joinDoubles();
      this.updateOffset(null,p.mouseX,p.mouseY);

      //find the postion to insert the loop
      /*if (this.sequence.length === 0) {
        this.sequence.push(session.copyLoop(loop));
        this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
        this.menus.push(new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
        this.angle.push(p.random(0,2*p.PI));
        this.angInc.push(p.random(0.01,0.02));
      } else {
        if (x < p.windowWidth / 2-this.totalDist/2-this.loopRadius) {
          this.sequence.splice(0,0,session.copyLoop(loop));
          this.repeats.splice(0,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.splice(0,0,new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
          this.angle.splice(0,0,p.random(0,2*p.PI));
          this.angInc.splice(0,0,p.random(0.01,0.02));
        } else if (x > p.windowWidth / 2+this.totalDist/2+this.loopRadius) {
          this.sequence.push(session.copyLoop(loop));
          this.repeats.push(new Scrollable("REPEATS",1,1,8,"x",1,1));
          this.menus.push(new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
          this.angle.push(p.random(0,2*p.PI));
          this.angInc.push(p.random(0.01,0.02));
        } else {
          for (let i = 0; i < this.sequence.length; i++) {
            if (x > p.windowWidth / 2-this.totalDist/2+i*this.gap+this.loopRadius && x < p.windowWidth / 2-this.totalDist/2+(i+1)*this.gap-this.loopRadius) {
              this.sequence.splice(i+1,0,session.copyLoop(loop));
              this.repeats.splice(i+1,0,new Scrollable("REPEATS",1,1,8,"x",1,1));
              this.menus.splice(i+1,0,new Menu(this.id, this.sequence.length-1, "sectionMenu",["EDIT LOOP", "DELETE SECTION"],"DROPUP"));
              this.angle.splice(i+1,0,p.random(0,2*p.PI));
              this.angInc.splice(i+1,0,p.random(0.01,0.02));
              break;
            }
          }
        }
      }*/
    }

    getDraggingLoopIndex() {
      for (let s in this.sequence) {
        if (this.dragging[s]) return s;
      }
    }

    rollDice() {
      let sequence = [];
      let repeats = [];
      let angles = [];
      let angIncs = [];
      let seqLength = p.round(p.random(1,maxLoopsPerStruct+1));
      if (seqLength > maxLoopsPerStruct) seqLength = maxLoopsPerStruct;

      for (let i = 0; i < seqLength; i++) {
        let loop = session.loops[p.floor(p.random(0,session.loops.length))];
        sequence.push(session.copyLoop(loop));
        sequence[sequence.length-1].play = false;
        repeats.push(new Scrollable("REPEATS",p.floor(p.random(1,4)),1,8,"x",1,1));
        angles.push(p.random(0,2*p.PI));
        angIncs.push(p.random(0.01,0.02));
      }

      this.sequence = sequence;
      this.repeats = repeats;
      this.angle = angles;
      this.angInc = angIncs;

      this.play = false;
      synths.releaseAll();
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;

      this.joinDoubles();
    }

    checkLoopsHover() {
      for (let i = 0; i < this.sequence.length; i++) {
        if (this.loopsHover[i]) return true;
      }
      return false;
    }

    draw() {
      //p.push();

      //p.translate(0,0, -p.windowHeight / 15);

      this.gap = p.windowWidth / 6;
      this.y = p.windowHeight / 2;
      this.loopRadius = p.windowWidth / 20;
      this.yOffset = p.windowHeight / 150;
      
      this.totalDist = this.gap * (this.sequence.length - 1) + this.offset;
      
      // console.log("draw struct");
      //p.fill(255,0,0);
      // p.circle(p.windowWidth / 2, p.windowHeight / 2, p.windowHeight / 4);

      //p.beginShape();

      if (this.sequence.length === 0) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 50);
        p.fill(white[0], white[1], white[2],255/3);
        p.text('Drop Loop or Struct here', p.windowWidth / 2, p.windowHeight / 2);
      }

      for (let i = 0; i < this.sequence.length; i++) {

        this.angle[i] += this.angInc[i];

        let x = 0;
        if (i < this.insertPos) x = p.windowWidth / 2-this.totalDist/2+i*this.gap;
        else x = p.windowWidth / 2-this.totalDist/2+i*this.gap+this.offset;

        if (this.swapPos > -1) {
          if (i >= this.swapPos && i < this.getDraggingLoopIndex()) x += this.gap;
          else if (i <= this.swapPos && i > this.getDraggingLoopIndex()) x -= this.gap;
        }

        p.push();
        if (this.menus[i].state === 0)  p.translate(0,0, p.windowHeight / 30);
        else p.translate(0,0, -p.windowHeight / 30);
        if (this.dragging[i] === false) this.sequence[i].drawInStructure(this.sequence[i], x, this.y+p.sin(this.angle[i])*this.yOffset, this.loopRadius);
        p.pop();

        p.push();
        if (this.menus[i].state === 0) p.translate(0,0, p.windowHeight / 25);
        else if (this.dragging[i]) p.translate(0,0, p.windowHeight / 25*2); 
        else p.translate(0,0, -p.windowHeight / 25);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 45);
        p.fill(white[0], white[1], white[2]);
        if (this.sequence[i].tracks.length > 0) p.text(this.sequence[i].name, this.sequence[i].tracks[0].particlesStructX[0], this.y+this.loopRadius*2);
        else p.text(this.sequence[i].name, x, this.y+this.loopRadius*2);
        p.pop();

        if (this.sequence[i].play) {
          p.fill(white[0], white[1], white[2],255/2);
          //p.textSize(p.windowHeight / 70);
          //p.text("NOW PLAYING", x, this.y+p.sin(this.angle[i])*this.yOffset);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(p.windowHeight / 60);
          if (this.sequence[i].tracks.length > 0) p.text(this.currentRepeat+1+" / "+this.repeats[i].value, this.sequence[i].tracks[0].particlesStructX[0], this.y+p.sin(this.angle[i])*this.yOffset);
          else p.text(this.currentRepeat+1+" / "+this.repeats[i].value, x, this.y+p.sin(this.angle[i])*this.yOffset);
        }

        p.push();
        if (this.dragging[i]) p.translate(0,0, p.windowHeight / 30*2);
        if (this.sequence[i].tracks.length > 0) this.repeats[i].draw(this.sequence[i].tracks[0].particlesStructX[0]+this.loopRadius/6, this.y-this.loopRadius*2);
        else this.repeats[i].draw(x+this.loopRadius/6, this.y-this.loopRadius*2);
        p.pop();


        if (p.mouseX < x+this.gap/2  && p.mouseX > x-this.gap/2 && p.mouseY < p.windowHeight/2+this.gap/2  && p.mouseY > p.windowHeight/2-this.gap/2  && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'pointer';

          this.loopsHover[i] = true;

          if (p.mouseIsPressed) {
            if (p.mouseButton === p.LEFT) {       
              dragging = true;
              this.dragging[i] = true;
              this.dragInstant = p.millis();

              if (i !== this.currentLoop && this.play) {
                this.sequence[this.currentLoop].play = false;
                synths.releaseAll();
                this.currentLoop = i;
                this.sequence[i].currentStep = -1;
                this.currentRepeat = 0;
                this.sequence[this.currentLoop].play = true;
              }

              this.lastX = p.mouseX;
            
            } else if (p.mouseButton === p.RIGHT) {
              this.menus[i].open();
              p.mouseIsPressed = false;
            }
          }

        } else {
          this.loopsHover[i] = false;
        }

        if (this.loopsHover[i] === false && this.checkLoopsHover()) {
          p.fill(0,0,0,255/2);
          if (this.sequence[i].tracks.length > 0) {
            p.rect(this.sequence[i].tracks[0].particlesStructX[0]-this.loopRadius*1.5, p.windowHeight/2-this.loopRadius*2.7, this.loopRadius*3, p.windowHeight/10);
            p.rect(this.sequence[i].tracks[0].particlesStructX[0]-this.loopRadius*1.5, p.windowHeight/2+this.loopRadius*2.7, this.loopRadius*3, -p.windowHeight/10);
          } else {
            p.rect(x-this.loopRadius*1.5, p.windowHeight/2-this.loopRadius*2.7, this.loopRadius*3, p.windowHeight/10);
            p.rect(x-this.loopRadius*1.5, p.windowHeight/2+this.loopRadius*2.7, this.loopRadius*3, -p.windowHeight/10);
          }
        }

        if (this.dragging[i] === true) {

          if (p.abs(p.mouseX-this.lastX) > this.loopRadius) {
            this.play = false;
            this.sequence[this.currentLoop].play = false;
            
            Tone.Transport.stop();
            Tone.Transport.seconds = 0;
            synths.releaseAll();
          }

          this.loopsHover[i]= true;
          document.body.style.cursor = 'grabbing';
          this.updateSwap(p.mouseX);

          p.push();
          p.translate(0,0, p.windowHeight / 30);
          this.sequence[i].drawInStructure(this.sequence[i], p.mouseX, this.y+p.sin(this.angle[i])*this.yOffset, this.loopRadius);
          p.pop();
        }

        if (p.mouseIsPressed === false && this.dragging[i] === true) {
          this.swapLoops(i);
          this.dragging[i] = false;
          dragging = false;
        }
      }

      let auxY = p.windowHeight-gridInitY/1.25;
      let auxX = (p.windowWidth - gridInitX*2 - p.windowWidth/150*7)/8/2;

      //p.stroke(255,0,0);

      //p.line(p.windowWidth/4,0,p.windowWidth/4,p.windowHeight);
      //p.line(p.windowWidth/4*2,0,p.windowWidth/4*2,p.windowHeight);
      //p.line(p.windowWidth/4*3,0,p.windowWidth/4*3,p.windowHeight);

      p.textSize(p.windowHeight / 65);
      p.textAlign(p.CENTER, p.BOTTOM);
      //let tw = p.textWidth("CLICK");
      
      if (this.tempoButton.state) p.fill(white[0], white[1], white[2]);
      else p.fill(white[0], white[1], white[2], 255/2);
      p.text("OVERRIDE",p.windowWidth/4+auxX*1.5,auxY+p.windowHeight / 40);
      
      if (this.transposeButton.state) p.fill(white[0], white[1], white[2]);
      else p.fill(white[0], white[1], white[2], 255/2);
      p.text("OVERRIDE",p.windowWidth-p.windowWidth/4,auxY+p.windowHeight / 40);
      
      this.tempoScroll.draw(p.windowWidth/4,auxY);
      this.transposeScroll.draw(p.windowWidth-p.windowWidth/4-auxX*1.4,auxY);
      this.tempoButton.draw(p.windowWidth/4+auxX*1.5,auxY-p.windowHeight / 120);
      this.transposeButton.draw(p.windowWidth-p.windowWidth/4,auxY-p.windowHeight / 120);

      p.tint(255, 255/2);
      if (p.mouseX > p.windowWidth/2-p.windowHeight/25/2 && p.mouseX < p.windowWidth/2+p.windowHeight/25/2 && p.mouseY > auxY-p.windowHeight/25/2 && p.mouseY < auxY+p.windowHeight/25/2 && dragging === false && menuOpened === false && session.loops.length > 0) {
        document.body.style.cursor = 'pointer';
        p.tint(255, 255);

        if (p.mouseIsPressed) { 
          if (p.mouseButton === p.LEFT) {
            this.rollDice();
            this.diceAngle = 0;
            this.diceAnginc = p.PI/12;
            this.diceSizeOffset = p.windowHeight / 60;
            p.mouseIsPressed = false;
          }
        }
      }

      p.push();
      p.translate(p.windowWidth / 2, auxY);
      p.rotate(this.diceAngle);
      p.translate(-p.windowWidth / 2, -auxY);
      if (this.sequence.length === 0) p.image(diceIcons[4], p.windowWidth / 2, auxY,p.windowHeight / 25+this.diceSizeOffset,p.windowHeight / 25+this.diceSizeOffset);
      else p.image(diceIcons[this.sequence.length-1], p.windowWidth / 2, auxY,p.windowHeight / 25+this.diceSizeOffset,p.windowHeight / 25+this.diceSizeOffset);
      p.pop();

      if (this.diceAngle + this.diceAnginc > 4*p.PI) {
        this.diceAngle = 4*p.PI;
      } else {
        this.diceAngle += this.diceAnginc;
        this.diceAnginc *= 0.98;
        this.diceSizeOffset *= 0.95;
      }

      //p.endShape();

      for (let i=0; i<this.sequence.length; i++) {
        p.textSize(p.windowHeight / 45);
        let textSize = p.textWidth(this.sequence[i].name)/2;
        this.menus[i].draw(p.windowWidth / 2-this.totalDist/2+i*this.gap-textSize, this.y+this.loopRadius*1.8);
      }

      //blackout animation
      if (this === session.activeTab) {
        if (this.active === false) this.blackoutOpa = 255;
        this.active = true;
      }

      if (this.blackoutOpa - 10 < 0) this.blackoutOpa = 0;
      else this.blackoutOpa -= 10;

      //black anim transition
      p.fill(0, 0, 0, this.blackoutOpa);
      p.rect(0, 0, p.windowWidth, p.windowHeight);
     
      //p.pop();
    }
  }

  class Loop {

    constructor(id, name, tempo) {
      this.type = "loop";

      this.id = id;
      this.name = name;

      this.tracks = [];

      this.nSteps = nSteps;
      this.drawerDragging = false;
      this.dragInstant = 0;

      this.play = false;
      this.active = false;

      this.selectedTrack = null;

      this.view = 0; //0:grid, 1:studio, 2:automation
      this.gridOpa = 0;
      this.studioOpa = 0;
      this.tabOpa = 0;
      this.emptyOpa = 0;

      this.recordVisual = [];
      for (let i=0; i<nSteps; i++) this.recordVisual.push(0);
      
      this.blackOpa1 = 255;
      this.blackOpa2 = 255;
      this.blackOpa3 = 0;
      this.blackOpa4 = 0;

      this.tempoScroll = new Scrollable("TEMPO",tempo,20,400,"BPM",1,5);
      // = new Scrollable("TRANSPOSE",0,-12,12,"ST",1,1);

      this.click = new Button("CLICK", false, [white[0], white[1], white[2]]);
      this.record = new Button("RECORD", false, [255,0,0]);

      this.tempo = tempo;
      this.timeBtwSteps = 60 / tempo / 4;
      this.lastInstant = 0;
      this.currentStep = -1;

      this.blackoutOpa = 0;

      this.hover = false;

      this.lastInstPlusMenu = 0;
      this.opaPlus = 0;
      this.opaPlusInc = 10;
      this.opaPlusMax = 255;

      this.plusX = p.windowWidth / 2 - iconSize / 2;
      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      this.plusTargetX = p.windowWidth / 2 - iconSize / 2;

      this.x = 0;
      this.y = 0;

      this.menu = new Menu(this.id, null, "loopMenu",["EXPORT","RENAME","DUPLICATE","STRUCT FROM", "CLOSE TAB", "DELETE"],"DROPDOWN");
      this.plusMenu = new Menu(this.id, null, "plusMenu",["MELODY", "HARMONY", "DRUMS", "BASS"],"DROPUP");
    }

    getInfoJSON() {
      let json = {};

      for (let t in this.tracks) {
        let notes = {};
        for (let n in this.tracks[t].notes) {
          let note = {};
          note["start"] = this.tracks[t].notes[n].start;
          note["duration"] = this.tracks[t].notes[n].duration;
          note["pitch"] = this.tracks[t].notes[n].pitch;
          note["octave"] = this.tracks[t].notes[n].octave;
          notes[n] = note;
        }
        json[this.tracks[t].name] = notes;
      }

      return JSON.stringify(json);
    }

    updateIconsPos() {
      if (this.tracks.length === 0) {
        this.plusTargetX = p.windowWidth / 2 - iconSize / 2;
        //this.menu.x = this.plusX;
      }
      else {
        let w = (this.tracks.length - 1) * (iconSize/2) + iconSize * (this.tracks.length);
        let anchorRight = p.windowWidth / 2 + w / 2;

        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 2);
          this.tracks[i].iconY = p.windowHeight - iconSize / 2 - iconSize;
        }

        this.plusTargetX = anchorRight + iconSize / 4;
        //this.menu.x = this.plusX;
      }

      this.plusY = p.windowHeight - iconSize / 2 - iconSize;
      //this.menu.y = this.plusY - this.menu.optionH * 1.5;
    }

    addTrack(name) {

      let w = this.tracks.length * (iconSize / 4) + iconSize * (this.tracks.length + 1);
      let anchorRight = p.windowWidth / 2 + w / 2;

      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].iconTargetX = anchorRight - w + i * (iconSize + iconSize / 4);
      }

      this.tracks.push(new Track(this.tracks.length, this.id, name, anchorRight - iconSize));
      if (this.selectedTrack !== null) this.selectedTrack = this.tracks[this.tracks.length - 1];

      this.plusTargetX = anchorRight + iconSize / 4;

      //this.menu.x = this.plusTargetX;
      //}
      //console.log(this.loopId,this.trackId);
      //REVER
      /*for (let i = 0; i < 5; i++) {
        let start = p.floor(p.random(0, nSteps));
        let pitch = p.floor(p.random(0,this.tracks[this.tracks.length - 1].nPitches));
        //let duration = p.random(1,4);
        let duration = 1;
        let oct = -1;
        if (this.name === "DRUMS") oct = 0;
        else oct = 3;
        this.tracks[this.tracks.length - 1].notes.push(new Note(pitch, this.id, this.tracks.length - 1, start, duration, oct, this.tracks[this.tracks.length - 1].color));
      }*/

      //console.log(stringify(session));  
      //session.save();
    }

    deleteTrack(i) {

      this.tracks.splice(i, 1);

      for (let t = 0; t < this.tracks.length; t++) {
        this.tracks[t].id = t;
        this.menu.trackId = t;
        for (let n = 0; n < this.tracks[t].notes.length; n++) this.tracks[t].notes[n].trackId = t; 
      }

      this.selectedTrack = null;
      this.view = 0;

      //session.save();
    }

    async addTrackByMelody() {
      let result = await basicPitch(recorderBlob,recordedTempo);
      
      this.addTrack("MELODY");

      for (let n in result) {
        await new Promise(resolve => setTimeout(resolve, 100));
        //console.log(result[n].pitch, result[n].start, result[n].duration, result[n].octave);
        let newNote = new Note(result[n].pitch, this.id, this.tracks.length - 1, result[n].start, result[n].duration, result[n].octave, this.tracks[this.tracks.length - 1].color);
        this.tracks[this.tracks.length - 1].notes.push(newNote);
        newNote.x = this.tracks[this.tracks.length - 1].targetXexp[newNote.start+1];
        newNote.y = this.tracks[this.tracks.length - 1].targetYexp[newNote.start+1];
        newNote.playShort();
      }

      //session.save();
      //console.log(recorderData);
    }

    /*updateMetronome() {
      if (p.millis() - this.lastInstant >= this.timeBtwSteps * 1000) {
        if (this.currentStep === nSteps-1) this.currentStep = 0;
        else this.currentStep++;

        this.lastInstant = p.millis();
      
        for (let t in this.tracks) {
          for (let n in this.tracks[t].timeline[this.currentStep]) {
            if (this.tracks[t].timeline[this.currentStep][n] !== null) this.tracks[t].timeline[this.currentStep][n].play();
          }
        }
      }
    }*/

    drawMoveCursor() {
      p.stroke(white[0]/5, white[1]/5, white[2]/5);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11));
      for (let i = 0; i < nSteps ; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);
          if (i%16 === 0) p.stroke(white[0]/5, white[1]/5, white[2]/5);
          else p.stroke(white[0]/8, white[1]/8, white[2]/8);
          p.push();
          p.translate(0,0,-1);
          p.line(gridInitX+gridStepSizeX*i,gridInitY,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11));
          p.pop();
        }
      }
    }

    drawTimeBar() {
      p.stroke(white[0]/4, white[1]/4, white[2]/4);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY+ (gridStepSizeY * 11)+gridInitY/4,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/5);  

      p.noStroke();
      p.fill(white[0], white[1], white[2],255/3);
      p.textSize(p.windowHeight / 90);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(nSteps,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/3.2);

      /*p.textSize(p.windowHeight / 90);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.fill(white[0], white[1], white[2],255/2);
      p.text(nSteps,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/5/2);*/

      for (let i = 0; i < nSteps ; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);

          if (this.currentStep === i && this.play) p.stroke(white[0], white[1], white[2]);
          else {
            if (i%16 === 0) p.stroke(white[0]/4, white[1]/4, white[2]/4);
            else p.stroke(white[0]/8, white[1]/8, white[2]/8);
          }

          //p.strokeWeight(1);
          //.stroke(white[0]/8, white[1]/8, white[2]/8);

          p.line(gridInitX+gridStepSizeX*i,gridInitY+ (gridStepSizeY * 11)+gridInitY/4,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/5);

          p.noStroke();
          p.fill(white[0], white[1], white[2],255/3);
          p.textSize(p.windowHeight / 90);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(i,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/3.2);
          
        } else {
          p.strokeWeight(1);
          if (this.currentStep === i && this.play) p.stroke(white[0], white[1], white[2]);
          else p.stroke(white[0], white[1], white[2],255/8);
          //p.push();
          //p.translate(0,0,-1);
          p.line(gridInitX+gridStepSizeX*i,gridInitY+ (gridStepSizeY * 11)+gridInitY/4 +gridInitY/5/8,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/5/8*7);
          //p.pop();
        }
      }

      if (p.mouseY > gridInitY+ (gridStepSizeY * 11)+gridInitY/4 && p.mouseY < gridInitY+(gridStepSizeY * 11)+gridInitY/4+gridInitY/3.5 && p.mouseX > gridInitX-gridStepSizeX/2 && p.mouseX < p.windowWidth-gridInitX+gridStepSizeX/2 && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'pointer';
        //p.fill(white[0], white[1], white[2],255/8);
        //p.rect(gridInitX+gridStepSizeX*i,gridInitY+ (gridStepSizeY * 11)+gridInitY/4,gridStepSizeX,gridInitY/5);
        if (p.mouseIsPressed) {
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          Tone.Transport.seconds = 0;
          
          let step = p.round((p.mouseX-gridInitX)/gridStepSizeX);
          if (step >= 0 && step < nSteps) {
            
            this.currentStep = step-1;

            synths.releaseAll();

            this.play = true;
            Tone.Transport.start();  
            
          }
          p.mouseIsPressed = false;
        }
      }
    }

    draw() {
      //draw track lines and notes
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].draw();
        this.tracks[i].drawNotes();
      }

      if (this.tracks.length === 0) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 50);
        p.fill(white[0], white[1], white[2],255/3);
        p.text('Click "+" to create a Track', p.windowWidth / 2, p.windowHeight / 2);
      }

        //update metronome
        //if (this.play) this.updateMetronome();

        this.updateIconsPos();

        //update plus button position
        let dif = this.plusTargetX - this.plusX;
        this.plusX += dif / 10;


        //timebar
        //if (session.activeTab.selectedTrack !== null) this.drawTimeBar();


        //grid, studio or automation
        if (this.selectedTrack !== null) {
          if (this.view === 0) this.selectedTrack.drawGrid();
          else if (this.view === 1) this.selectedTrack.drawStudio();
          else this.selectedTrack.drawAutomation();
        }
        
        //plus button
        //p.fill(255, 255, 255, this.opaPlus);
        //p.stroke(white[0], white[1], white[2]);
        //p.strokeWeight(1);
        //p.rect(this.plusX, this.plusY, iconSize, iconSize, iconCorners);

        //let y = p.windowHeight - (p.windowHeight - (gridInitY + gridStepSizeY * 11))/2;
        let y = p.windowHeight-gridInitY/1.25;

        //this.plusMenu.draw(this.plusX, y);

        for (let i = 0; i < this.tracks.length; i++) this.tracks[i].menu.draw(this.tracks[i].iconX, p.windowHeight - gridInitX -p.windowHeight / 40 - p.windowHeight/30);

        /*p.push();
        p.tint(255, this.opaPlus);
        if (this.plusMenu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
        p.image(plus, this.plusX + iconSize / 2, y, p.windowHeight / 40, p.windowHeight / 40);
        p.pop();*/

        //blackout animation
        if (this === session.activeTab) {
          if (this.active === false) this.blackoutOpa = 255;
          this.active = true;
        }

        if (this.active) {
          if (this.blackoutOpa - this.opaPlusInc > 0) this.blackoutOpa -= this.opaPlusInc;
          else this.blackoutOpa = 0;
          if (this.blackOpa1 - this.opaPlusInc < 0) this.blackOpa1 = 0;
          else this.blackOpa1 -= this.opaPlusInc;
          if (this.blackOpa2 - this.opaPlusInc < 0) this.blackOpa2 = 0;
          else this.blackOpa2 -= this.opaPlusInc;
          if (this.blackOpa3 - this.opaPlusInc < 0) this.blackOpa3 = 0;
          else this.blackOpa3 -= this.opaPlusInc;
          if (this.blackOpa4 - this.opaPlusInc < 0) this.blackOpa4 = 0;
          else this.blackOpa4 -= this.opaPlusInc;
        }

        //complementary black anim transition
        p.noStroke();
        p.fill(0, 0, 0, this.blackOpa1);
        p.rect(0,p.windowHeight-gridInitY*1.2,p.windowWidth/16*6,gridInitY*1.2);
        p.rect(p.windowWidth-p.windowWidth/16*2.5, p.windowHeight-gridInitY*1.2,p.windowWidth/16*2.5,gridInitY*1.2);
        p.fill(0, 0, 0, this.blackOpa2);
        p.rect(p.windowWidth-p.windowWidth/16*2.5-p.windowWidth/16*3.5, p.windowHeight-gridInitY*1.2,p.windowWidth/16*3.5,gridInitY*1.2);
        p.fill(0, 0, 0, this.blackOpa3);
        p.rect(0, gridInitY-p.windowHeight/100, p.windowWidth, gridStepSizeY*11+gridStepSizeY/2-p.windowHeight/100);
        p.fill(0, 0, 0, this.blackOpa4);
        p.rect(0, gridInitY+gridStepSizeY*11+gridStepSizeY/4, p.windowWidth, gridInitY/2);

        //black anim transition
        p.fill(0, 0, 0, this.blackoutOpa);
        p.rect(0, 0, p.windowWidth, p.windowHeight);
    }

    //draw simplified representation of loop in drawer
    drawInDrawer(x, y, radius) {
      if (this.tracks.length === 0) {

        if (this.emptyOpa + this.opaPlusInc > 255) this.emptyOpa = 255;
        else this.emptyOpa += this.opaPlusInc;

        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 70);
        if (this.hover) p.fill(white[0], white[1], white[2],this.emptyOpa);
        else p.fill(white[0], white[1], white[2], this.emptyOpa/2);
        p.text("EMPTY", x, y);
      } else {
        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].drawInDrawer(x, y, radius, this.hover);
        }
      }
    }

    drawInStructure(loop, x, y, radius) {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawInStructure(loop, x, y, radius);
      }
    }

    drawPreview(x,y,radius) {
      for (let i = 0; i < this.tracks.length; i++) {
        this.tracks[i].drawPreview(this,x,y,radius);
      }
    }
  }

  class Track {

    constructor(id, loopId, name, iconTargetX) {
      this.id = id;
      this.name = name;

      this.loopId = loopId;

      this.notes = [];

      this.muted = false;

      if (this.name === "DRUMS") {
        this.nPitches = theory.drumLabels.length;
        this.color = colors[1];
      }
      else {
        this.nPitches = 24;
        if (this.name === "BASS") this.color = colors[0];
        if (this.name === "MELODY") this.color = colors[3];
        if (this.name === "HARMONY") this.color = colors[2];
      }

      this.menu = new Menu(this.loopId, this.id, "trackMenu",["DELETE","RENAME"],"DROPUP");

      this.ang = p.random(0, p.TWO_PI);
      this.angInc = p.PI / 20;

      this.radiusCol = p.windowHeight / 4;

      this.iconHover = false;
      
      this.hoverVolume = false;
      this.draggingVolume = false;
      this.volumeY = 0;
      this.volumeYmax = 0;
      this.volumeYmin = 0;

      this.draggingAutomation = false;

      this.draggingGrid = false;
      this.draggingSelect = false;
      this.lastGridX = 0;
      this.lastGridY = 0;
      this.tempNote = null;

      this.opaInfoAutomation = 0;

      this.opaLine = 255;
      this.opaLineInc = 10;

      this.iconTargetX = iconTargetX;
      this.iconX = iconTargetX;
      this.iconY = p.windowHeight - iconSize / 2 - iconSize;
      this.opaIcon = 0;
      this.opaIconInc = 5;
      this.opaIconMax = 255;

      this.x = p.windowWidth / 2 + p.windowWidth/8;
      this.y = p.windowHeight / 2;

      this.knobs = [];
      this.param = 0;

      this.gain = 1;

      //check if preset is equal to original preset
      this.presetChanged = false;

      //fx knobs
      this.filterKnob = new Knob("POSITION",0.50,theory.defaultValues,"");
      this.distKnob = new Knob("AMOUNT",0.50,theory.defaultValues,"");
      this.dlyKnobs = [new Knob("TIME",0.50,theory.delayTimes,""),new Knob("FEEDBACK",0.50,theory.defaultValues,""),new Knob("DRY/WET",0.50,theory.defaultValues,"")];
      this.revKnobs = [new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("DRY/WET",0.50,theory.defaultValues,"")];

      //fx buttons
      this.filterButton = new Button("FILTER", true,this.color);
      this.distButton = new Button("DISTORTION", false,this.color);
      this.dlyButton = new Button("DELAY", false,this.color);
      this.revButton = new Button("REVERB", false,this.color);

      if (this.name === "BASS") {
        this.petal = petal1;
        this.synth = synths.bass;
        this.preset = 0;
      }
      
      if (this.name === "MELODY") {
        this.petal = petal3;
        this.synth = synths.melody;
        this.preset = 0;
      }
      
      if (this.name === "HARMONY") {
        this.petal = petal4;
        this.synth = synths.harmony;
        this.preset = 0;
      }

      //different sinthesis for drums tracks
      if (this.name === "DRUMS") {
        this.preset = 0;
        this.presetScroll = new Scrollable("PRESET",this.preset,0,synths.drumPresets.length-1,"",1,1);
        this.octaveScroll = new Scrollable("OCTAVE",0,0,0,"",1,1);

        this.drumKnobs = [];
        this.drumButtons = [];
        this.petal = petal2;
        this.synth = synths.drums;
        for (let i=0; i<theory.drumLabels.length; i++) { 
          this.drumKnobs.push([new Knob("GAIN",1,theory.defaultValues,""),new Knob("PITCH",0.50, theory.pitchValues,"st")]);
          this.drumButtons.push(new Button("PART "+i,true,this.color));
          this.knobs.push([theory.drumLabels[i],this.drumKnobs[i][0]]);
          this.knobs.push([theory.drumLabels[i],this.drumKnobs[i][1]]);
        }      
      } else {
        this.octaveScroll = new Scrollable("OCTAVE",3,0,theory.octaves.length-1,"",1,1);
        this.presetScroll = new Scrollable("PRESET",this.preset,0,synths.synthPresets.length-1,"",1,1);

        this.oscKnobs = [[new Knob("WAVE", 1, theory.waveTypes, ""),new Knob("PITCH",0.50, theory.pitchValues,"st"),new Knob("VOLUME",0.50,theory.defaultValues,"")],[new Knob("WAVE", 0, theory.waveTypes, ""),new Knob("PITCH",0.50, theory.pitchValues,"st"),new Knob("VOLUME",0.50,theory.defaultValues,"")]];
        this.envKnobs = [[new Knob("ATTACK",0,theory.timeValues,"s"),new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("SUSTAIN",0.50,theory.defaultValues,""),new Knob("RELEASE",0,theory.timeValues,"s")],[new Knob("ATTACK",0,theory.timeValues,"s"),new Knob("DECAY",0.50,theory.timeValues,"s"),new Knob("SUSTAIN",0.50,theory.defaultValues,""),new Knob("RELEASE",0,theory.timeValues,"s")]];
        this.oscButtons = [new Button("OSCILLATOR 1", true,this.color),new Button("OSCILLATOR 2", true,this.color)];
        this.envButtons = [new Button("ENVELOPE 1", true,this.color),new Button("ENVELOPE 2", true,this.color)];
        
        for (let i = 0; i < 2; i++) {
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][0]]);
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][1]]);
          this.knobs.push(["OSC "+(i+1),this.oscKnobs[i][2]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][0]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][1]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][2]]);
          this.knobs.push(["ENV "+(i+1),this.envKnobs[i][3]]);
        }

      }

      this.knobs.push(["FILTER",this.filterKnob]);
      this.knobs.push(["DIST",this.distKnob]);
      this.knobs.push(["DELAY",this.dlyKnobs[0]]);
      this.knobs.push(["DELAY",this.dlyKnobs[1]]);
      this.knobs.push(["DELAY",this.dlyKnobs[2]]);
      this.knobs.push(["REVERB",this.revKnobs[0]]);
      this.knobs.push(["REVERB",this.revKnobs[1]]);
      this.automationScroll = new Scrollable("PARAMETER",this.param,0,this.knobs.length-1,"",1,1);

      //console.log(this.knobs);

      this.particlesX = [];
      this.particlesY = [];
      this.particlesDrawerX = [];
      this.particlesDrawerY = [];
      this.particlesPreviewX = [];
      this.particlesPreviewY = [];
      this.particlesStructX = [];
      this.particlesStructY = [];

      this.targetXexp = [];
      this.targetYexp = [];
      this.targetXdrawer = [];
      this.targetYdrawer = [];
      this.targetXpreview = [];
      this.targetYpreview = [];
      this.targetXstruct = [];
      this.targetYstruct = [];

      for (let i = 0; i < nSteps + 2; i++) {
        this.particlesX.push(p.windowWidth / 2);
        this.particlesY.push(p.windowHeight / 2);
        this.particlesDrawerX.push(-p.windowWidth/5);
        this.particlesDrawerY.push(p.windowHeight / 2);
        this.particlesPreviewX.push(this.x);
        this.particlesPreviewY.push(p.windowHeight / 2);
        this.particlesStructX.push(p.windowWidth / 2);
        this.particlesStructY.push(p.windowHeight / 2);
        this.targetXexp.push(0);
        this.targetYexp.push(0);
        this.targetXdrawer.push(0);
        this.targetYdrawer.push(0);
        this.targetXpreview.push(0);
        this.targetYpreview.push(0);
        this.targetXstruct.push(0);
        this.targetYstruct.push(0);
      }
    }

    drawInGenMenu(x,y,width,height) {

      p.stroke(this.color[0],this.color[1],this.color[2]);

      //let auxY = height / (8 * this.nPitches);
      //let auxX = width / nSteps;

      //p.line(x, y, x + auxX * nSteps, y);
      //p.line(x, y + auxY * 8 * this.nPitches, x + auxX * nSteps, y + auxY * 8 * this.nPitches);

      /*for (let n in this.notes) {
        p.line(x + auxX * this.notes[n].start, y + height - (auxY *(this.notes[n].pitch+this.notes[n].octave*12)), x + auxX * (this.notes[n].start + this.notes[n].duration), y + height - (auxY *(this.notes[n].pitch+this.notes[n].octave*12)));
      }*/

      if (this.name === "HARMONY") {
        let auxY = height / (this.nPitches*3);
        let auxX = width / nSteps;  

        p.strokeWeight(auxY/2);

        for (let n in this.notes) {
          p.line(x + auxX * this.notes[n].start, y + height - (auxY *(this.notes[n].pitch+this.nPitches)), x + auxX * (this.notes[n].start + this.notes[n].duration), y + height - (auxY *(this.notes[n].pitch+this.nPitches)));
        }
      }
    }

    playInputNote(input) {
      if (this.name === "DRUMS") {
        if (input < theory.drumLabels.length) {
          this.synth.parts[input].start(Tone.context.currentTime);

          //stop open hat when closed hat is triggered
          if (input === 2) this.synth.parts[3].stop();
        }
      } else {
        for (let osc in this.synth.oscillators) {
          this.synth.oscillators[osc].triggerAttack(theory.freqs[input]*p.pow(2,currentOctave),Tone.context.currentTime);
        }
      }
    }

    releaseInputNote(input) {
      if (this.name !== "DRUMS") {
        for (let osc in this.synth.oscillators) {
          this.synth.oscillators[osc].triggerRelease(theory.freqs[input]*p.pow(2,currentOctave),Tone.context.currentTime);
        }
      }
    }

    ajustNotes(note) {
      let auxY = 0;

      if (this.name === "DRUMS") auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;
      else auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;

      for (let i = 0; i < this.notes.length; i++) {
        if (this.notes[i] === note) continue;
        //same octave and pitch
        if (this.notes[i].pitch === note.pitch && this.notes[i].octave === note.octave) {
          
          //remove a note that starts beetween the start of the new note and its start+duration, as well as its end
          if (this.notes[i].start >= note.start && this.notes[i].start+this.notes[i].duration <= note.start + note.duration) {
            //console.log("case 1")
            this.notes.splice(i,1);
            if (this.notes.length === 0) return;

            i--;
            continue;
            //if (this.notes[i].pitch !== note.pitch || this.notes[i].octave !== note.octave) break;
            //if (this.notes[i] === note) break;
            //if (i < -1) i = -1;
          //shorten a note that starts beetween the start of the new note and its start+duration, but ends after the new note's end
          } 

          //case of the list becaming empty
          //if (this.notes.length === 0) break;

          else if (this.notes[i].start >= note.start && this.notes[i].start+this.notes[i].duration > note.start + note.duration && this.notes[i].start < note.start + note.duration) {
            //console.log("case 2")
            this.notes[i].duration = this.notes[i].duration - (note.start + note.duration - this.notes[i].start);
            this.notes[i].start = note.start + note.duration;
            this.notes[i].x = this.particlesX[this.notes[i].start+1];
          //create a new note between the start of the new note and its start+duration
          } 

          else if (this.notes[i].start < note.start && this.notes[i].start+this.notes[i].duration >= note.start + note.duration) {
            //console.log("case 4")
            
            this.notes[i].x = this.particlesX[this.notes[i].start+1];

            let newNoteStart = note.start + note.duration;
            let newNoteDuration = this.notes[i].start + this.notes[i].duration - (note.start + note.duration);
            this.notes[i].duration = note.start - this.notes[i].start;

            let newNote = new Note(this.notes[i].pitch, this.loopId, this.id, newNoteStart, newNoteDuration, this.notes[i].octave, this.color);
            newNote.x = this.particlesX[newNote.start+1];
            if (auxY > 11) newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
            else newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
            this.notes.push(newNote);

          }
          
          else if (this.notes[i].start < note.start && this.notes[i].start+this.notes[i].duration > note.start && this.notes[i].start+this.notes[i].duration < note.start + note.duration) {
            //console.log("case 3")
            let aux = this.notes[i].duration;
            this.notes[i].duration = note.start - this.notes[i].start;
            let newNote = new Note(this.notes[i].pitch, this.loopId, this.id, note.start + note.duration, aux - (note.start + note.duration - this.notes[i].start), this.notes[i].octave, this.color);
            newNote.x = this.particlesX[newNote.start+1];
            if (auxY > 11) newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
            else newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
            //if (auxY > 11) newNote.y = gridInitY + (this.nPitches-newNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
            //else this.notes[i].y = gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
            this.notes.push(newNote);
          //shorten a note that starts before the new note and ends after the new note start but before its end
          } 
        }

        //session.save();
      }
    }

    drawGrid() {
      p.stroke(white[0]/5, white[1]/5, white[2]/5);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11));
      for (let i = 0; i < nSteps ; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);
          if (i%16 === 0) p.stroke(white[0]/5, white[1]/5, white[2]/5);
          else p.stroke(white[0]/8, white[1]/8, white[2]/8);
          p.push();
          p.translate(0,0,-1);
          p.line(gridInitX+gridStepSizeX*i,gridInitY,gridInitX+gridStepSizeX*i,gridInitY+(gridStepSizeY * 11));
          p.pop();
        }
        if (this.octaveScroll.value !== 8) {
          const xPos = gridInitX + gridStepSizeX * i;
          for (let j = 0; j < this.nPitches; j++) {
              const yPos = gridInitY + (gridStepSizeY * 11)/(this.nPitches-1) * j;
              const d = p.dist(p.mouseX,p.mouseY,xPos,yPos);
              p.noStroke();
              if (d < gridStepSizeX*nSteps/6) p.fill(white[0], white[1], white[2],p.map(d,0,gridStepSizeX*nSteps/6,255,255/2.5));
              else p.fill(white[0], white[1], white[2],255/2.5);
              //if (i%16 === 0) p.fill(white[0]/2, white[1]/2, white[2]/2);
              //else p.fill(white[0]/4, white[1]/4, white[2]/4);
              p.push();
              p.translate(0,0,-1);
              p.circle(xPos, yPos, 1, 1);
              p.pop();
          }
        }
      }

      //create notes
      if (this.octaveScroll.value !== 8) {
        const auxX = p.round((p.mouseX - gridInitX) / gridStepSizeX);
        let auxY = 0;

        if (this.name === "DRUMS") auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;
        else auxY = this.nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(this.nPitches-1)))-1;

        if (p.mouseY > gridInitY-gridStepSizeY/4 && p.mouseY < gridInitY+(gridStepSizeY*11)+gridStepSizeY/4 && auxX >= 0 && auxX < nSteps && auxY >= 0 && auxY < this.nPitches && dragging === false && menuOpened === false && session.loopDrawer === false && session.structDrawer === false) {
          if (this.isNote(auxX, auxY) === false) document.body.style.cursor = 'pointer';

          if (p.mouseIsPressed && this.draggingGrid === false && this.draggingSelect === false && this.isNote(auxX, auxY) === false) {
            dragging = true;

            if (p.mouseButton === p.LEFT) {
              this.lastGridX = auxX;
              this.lastGridY = auxY;
              this.draggingGrid = true;
              this.deselectAllNotes();
              //console.log(auxX,auxY,this.tempNote);
              if (auxY>11) {
                this.tempNote = new Note(auxY-12, this.loopId, this.id, auxX, 1, this.octaveScroll.value+1, this.color);
                this.tempNote.y = gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1) - gridStepSizeY*11/2-gridStepSizeY/4;
              } else {
                this.tempNote = new Note(auxY, this.loopId, this.id, auxX, 1, this.octaveScroll.value, this.color);
                this.tempNote.y = gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1);
              }
              this.tempNote.x = this.particlesX[this.tempNote.start+1];
              this.tempNote.playShort();
              //console.log(this.tempNote);
              //draw rectangle of selection
            } else if (p.mouseButton === p.RIGHT) {
              for(let n in this.notes) this.notes[n].selected = false;
              this.draggingSelect = true;
              selectX = p.mouseX;
              selectY = p.mouseY;
            }
          }   
        }
          
      if (p.mouseIsPressed === false && this.draggingGrid) {
          dragging = false;
          this.draggingGrid = false;
          this.ajustNotes(this.tempNote);
          this.notes.push(this.tempNote);
          //session.save();
       } 
      
       if (p.mouseIsPressed === false && this.draggingSelect) {
          dragging = false;
          this.draggingSelect = false;
      }

      if (this.draggingGrid) {
        if (this.name === "DRUMS") this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches- this.tempNote.pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
        else {
          if (this.tempNote.octave === this.octaveScroll.value) this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
          else if (this.tempNote.octave === this.octaveScroll.value+1) this.tempNote.draw(this.particlesX[this.tempNote.start+1], gridInitY + (this.nPitches-this.tempNote.pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
        }

        if (auxX >= 0 && auxX <= nSteps) {
          if (this.lastGridX < auxX) this.tempNote.duration = auxX - this.lastGridX;
          else {
            this.tempNote.start = auxX;
            this.tempNote.duration = this.lastGridX - auxX + 1;
            this.tempNote.x = this.particlesX[this.tempNote.start+1];
          }
        }
        // this.tempNote.duration = auxX - this.lastGridX + 1; 

        this.tempNote.showInfo();
      } 

      if (this.draggingSelect) {
        document.body.style.cursor = 'grabbing';

        for (let n in this.notes) {
          if ((this.notes[n].x > selectX && this.notes[n].x < p.mouseX && this.notes[n].y > selectY && this.notes[n].y < p.mouseY && p.mouseX > selectX && p.mouseY > selectY
            || this.notes[n].x > selectX && this.notes[n].x < p.mouseX && this.notes[n].y < selectY && this.notes[n].y > p.mouseY && p.mouseX > selectX && p.mouseY < selectY
            || this.notes[n].x < selectX && this.notes[n].x > p.mouseX && this.notes[n].y > selectY && this.notes[n].y < p.mouseY && p.mouseX < selectX && p.mouseY > selectY
            || this.notes[n].x < selectX && this.notes[n].x > p.mouseX && this.notes[n].y < selectY && this.notes[n].y > p.mouseY && p.mouseX < selectX && p.mouseY < selectY) 
            && (this.notes[n].octave === this.octaveScroll.value || this.notes[n].octave === this.octaveScroll.value+1)) {

            if (this.notes[n].selected === false) {
              this.notes[n].playShort();
              this.notes[n].selected = true;
            }
          }  else this.notes[n].selected = false;
        }

        p.stroke(this.color[0],this.color[1],this.color[2], 255);
        p.fill(this.color[0],this.color[1],this.color[2], 255/6);
        let aux = p.mouseY-selectY;
        if (p.mouseY > gridInitY+11*gridStepSizeY + gridStepSizeY/4) aux = gridInitY+11*gridStepSizeY + gridStepSizeY/2-selectY;
        if (p.mouseY < gridInitY) aux = gridInitY- gridStepSizeY/2-selectY;
        p.rect(selectX, selectY, p.mouseX-selectX, aux);
      }

          /*if (p.mouseIsPressed) {

            if (this.isNote(auxX, auxY) === false) {
              let oct = -1;
              let pitch = auxY;
              if (pitch > 11) pitch = pitch - 12;
              if (this.name === "DRUMS") oct = 0;
              else if (auxY > 11) oct = this.octaveScroll.value+1;
              else oct = this.octaveScroll.value;
              this.notes.push(new Note(pitch, this.loopId, this.id, auxX, 1, oct , this.color));
              if (this.name === "DRUMS") {
                this.notes[this.notes.length-1].x = session.loops[this.loopId].particlesX[this.notes[this.notes.length-1].start+1];
                this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
              }
              else {
                if (this.notes[i].octave === this.octaveScroll.value) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
                else if (this.notes[i].octave === this.octaveScroll.value+1) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
              }
              this.notes[this.notes.length-1].playShort();
              p.mouseIsPressed = false;
            }
          }*/

      }
      
      this.octaveScroll.draw(p.windowWidth/4*2.8,p.windowHeight-gridInitY/1.25);
    }

    //check if there is a note in the same position
    isNote(x,y) {
      let octave = -1;
     
      if (y > 11) {
        y = y - 12;
        octave = this.octaveScroll.value+1;
      } else octave = this.octaveScroll.value;

      for (let i = 0; i < this.notes.length; i++) {
        if (this.notes[i].start <= x && this.notes[i].start+this.notes[i].duration > x && this.notes[i].pitch === y && this.notes[i].octave === octave) return true;
      }
      return false;
    }

    deselectAllNotes() {
      for (let n in this.notes) this.notes[n].selected = false;
    }

    //get lower and higher notes, and left and right notes boundaries of selected notes
    getSelectionBoundaries() {
      let left = nSteps;
      let right = 0;
      let lower = 11;
      let higher = 0;
      for (let n in this.notes) {
        if (this.notes[n].selected) {
          if (this.notes[n].start < left) left = this.notes[n].start;
          if (this.notes[n].start+this.notes[n].duration > right) right = this.notes[n].start+this.notes[n].duration;
          if (this.notes[n].pitch < lower) lower = this.notes[n].pitch;
          if (this.notes[n].pitch > higher) higher = this.notes[n].pitch;
        }
      }
      return [left,right,lower,higher];
    }

    drawAutomation() {

      p.noFill();
      p.strokeWeight(maxWeightLines);
      if (this.knobs[this.automationScroll.value][1].automating) p.stroke(this.color[0],this.color[1],this.color[2],255/2);
      else p.stroke(white[0],white[1],white[2],255/8);
      //p.rect(gridInitX,gridInitY,gridStepSizeX*(nSteps-1),gridStepSizeY*(12-1),p.windowHeight/200);

      p.beginShape();
      for (let i = 0; i < nSteps; i++) {
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[i],0,1,gridInitY+gridStepSizeY*11,gridInitY);
        p.vertex(gridInitX+gridStepSizeX*i,aux);
      }
      p.vertex(gridInitX+gridStepSizeX*64,p.map(this.knobs[this.automationScroll.value][1].automation[0],0,1,gridInitY+gridStepSizeY*11,gridInitY));
      p.endShape();

      p.stroke(white[0], white[1], white[2],255/5);
      p.strokeWeight(1);
      p.line(p.windowWidth-gridInitX,gridInitY,p.windowWidth-gridInitX,gridInitY+(gridStepSizeY * 11));

      for (let i = 0; i < nSteps; i++) {
        if (i%16 === 0 || i%4 === 0) {
          p.strokeWeight(1);
          if (i%16 === 0) p.stroke(white[0], white[1], white[2],255/5);
          else p.stroke(white[0], white[1], white[2],255/8);
          p.line(gridInitX+gridStepSizeX*i,gridInitY,gridInitX+gridStepSizeX*i,gridInitY+gridStepSizeY*11);
        }
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[i],0,1,gridInitY+gridStepSizeY*11,gridInitY);
        if (this.knobs[this.automationScroll.value][1].automating) {
          if (i === session.activeTab.currentStep && session.activeTab.play) {
            p.fill(white[0], white[1], white[2]);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          } else if (i === p.round((p.mouseX-gridInitX)/gridStepSizeX) && dragging === false && menuOpened === false) {
            p.fill(white[0], white[1], white[2],255/2);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          }
          else {
            p.fill(this.color[0],this.color[1],this.color[2]);
            p.circle(gridInitX+gridStepSizeX*i,aux,5);
          }
        } else {
          if (i === p.round((p.mouseX-gridInitX)/gridStepSizeX)) {
            p.fill(white[0], white[1], white[2],255/2);
            p.circle(gridInitX+gridStepSizeX*i,aux,p.windowHeight/90);
          } else {
            p.fill(white[0],white[1],white[2],255/4);
            p.circle(gridInitX+gridStepSizeX*i,aux,5);
          }
        }
      }


      //param scroll
      this.automationScroll.draw(p.windowWidth/4*2.8,p.windowHeight-gridInitY/1.25);
      /*if (this.presetScroll.value !== this.preset) {
        this.preset = this.presetScroll.value;
        if (this.name === "DRUMS") this.switchPreset(synths.drumPresets[this.preset]);
        else this.switchPreset(synths.synthPresets[this.preset]);
      }*/

      if (p.mouseX >= gridInitX-gridStepSizeX/2 && p.mouseX < gridInitX + gridStepSizeX * (nSteps-1)+gridStepSizeX/2 && p.mouseY > gridInitY-gridStepSizeX/2 && p.mouseY < gridInitY + (gridStepSizeY * 11)+gridStepSizeX/2 && session.loopDrawer === false && session.structDrawer === false && menuOpened === false) {
        let posX = p.round((p.mouseX-gridInitX)/gridStepSizeX);
        let aux = p.map(this.knobs[this.automationScroll.value][1].automation[posX],0,1,gridInitY+(gridStepSizeY*11),gridInitY);

        if (this.opaInfoAutomation + 10 > 255) this.opaInfoAutomation = 255;
        else this.opaInfoAutomation += 10;

        if (dragging === false && menuOpened === false) {
          document.body.style.cursor = 'grab';
          //p.circle(gridInitX + posX*gridStepSizeX, aux, 5);
          if (p.mouseIsPressed) {
            this.draggingAutomation = true;
            dragging = true;
          }
        }
        //p.stroke(255,255,255,255/2);
        //p.strokeWeight(1);
        //p.line(gridInitX, this.mouseY, gridInitX + gridStepSizeX * nSteps, this.mouseY);
        //p.line(this.mouseX, gridInitY, this.mouseX, gridInitY + gridStepSizeY * this.nPitches);
        
        p.push();
        p.translate(0,0,p.windowHeight/30);
        if (this.knobs[this.automationScroll.value][1].automating) p.fill(white[0], white[1], white[2],this.opaInfoAutomation);
        else p.fill(white[0], white[1], white[2],this.opaInfoAutomation/2);

        let knob = this.knobs[this.automationScroll.value][1];
        let text = "";

        if (typeof knob.output === "string") text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))].toUpperCase();
        else if (knob.unit === "st") text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))]/100+knob.unit;
        else text = knob.options[p.round(p.map(knob.automation[posX],0,1,0,knob.options.length-1))]+knob.unit;

        //soften the y position with vector
        
        if (p.mouseX <= p.windowWidth / 2) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(p.windowHeight / 40);
          p.textFont(fontMedium);
          if (dragging) p.text(text,gridInitX+posX*gridStepSizeX+gridStepSizeX,p.mouseY-gridStepSizeX*1.4);
          else p.text(text,gridInitX+posX*gridStepSizeX+gridStepSizeX,aux - gridStepSizeX*1.4);
          p.textFont(fontLight);
          p.textSize(p.windowHeight / 65);
          if (dragging) p.text("STEP "+posX, gridInitX+posX*gridStepSizeX+gridStepSizeX, p.mouseY-gridStepSizeX*1.4-p.windowHeight / 50);
          else p.text("STEP "+posX, gridInitX+posX*gridStepSizeX+gridStepSizeX, aux-gridStepSizeX*1.4-p.windowHeight / 50);
        } else {

          p.textAlign(p.RIGHT, p.CENTER);
          p.textSize(p.windowHeight / 40);
          p.textFont(fontMedium);
          if (dragging) p.text(text,gridInitX+posX*gridStepSizeX-gridStepSizeX,p.mouseY-gridStepSizeX*1.4);
          else p.text(text,gridInitX+posX*gridStepSizeX-gridStepSizeX,aux - gridStepSizeX*1.4);
          p.textFont(fontLight);
          p.textSize(p.windowHeight / 65);
          if (dragging) p.text("STEP "+posX, gridInitX+posX*gridStepSizeX-gridStepSizeX, p.mouseY-gridStepSizeX*1.4-p.windowHeight / 50);
          else p.text("STEP "+posX, gridInitX+posX*gridStepSizeX-gridStepSizeX, aux-gridStepSizeX*1.4-p.windowHeight / 50);
        }
        p.pop();

      } else this.opaInfoAutomation = 0;
      
      if (p.mouseIsPressed === false && this.draggingAutomation) {
        this.draggingAutomation = false;
        dragging = false;
        //session.save();
      }

      if (this.draggingAutomation) {
        document.body.style.cursor = 'grabbing';
        let posX = p.round((p.mouseX-gridInitX)/gridStepSizeX);
        if (this.knobs[this.automationScroll.value][1].automating === false) this.knobs[this.automationScroll.value][1].automating = true;
        this.knobs[this.automationScroll.value][1].automation[posX] = p.map(p.mouseY,gridInitY+(gridStepSizeY*11),gridInitY,0,1);
        if (this.knobs[this.automationScroll.value][1].automation[posX] < 0) this.knobs[this.automationScroll.value][1].automation[posX] = 0;
        if (this.knobs[this.automationScroll.value][1].automation[posX] > 1) this.knobs[this.automationScroll.value][1].automation[posX] = 1;
      }
    }

    drawStudio() {
      let studioGap = p.windowWidth/150;

      let auxY = (gridStepSizeY*(12-1) - studioGap*2) / 3;
      let col1X = studioGap+p.windowWidth/9;
      let auxX = gridStepSizeX*(nSteps)-col1X;
      let auxXfx = (auxX-studioGap*6)/7;

      let barLeftHeight = 0;
      let barRightHeight = 0;
      let dbs = [this.synth.fxChain.left.getValue(),this.synth.fxChain.right.getValue()];
      if (dbs[0] < -60) dbs[0] = -60;
      if (dbs[1] < -60) dbs[1] = -60;
      
      //barLeftHeight = p.map(dbs[0],-60,0,0, -(gridStepSizeY*(11) - studioGap - auxY-13*studioGap));
      //barRightHeight = p.map(dbs[1],-60,0,0, -(gridStepSizeY*(11) - studioGap - auxY-13*studioGap));
      barLeftHeight = p.map(dbs[0],-60,0,0, this.volumeY-(gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap));
      barRightHeight = p.map(dbs[1],-60,0,0, this.volumeY-(gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap));
      //this.hoverVolume = false;
      //this.draggingVolume = false;
      //this.volumeY = 0;

      p.noStroke();
      p.fill(this.color[0],this.color[1],this.color[2]);
      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2-studioGap*2,gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap,studioGap*2,barLeftHeight);
      p.rect(gridInitX + p.windowWidth/9/2 + studioGap/2,gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap,studioGap*2,barRightHeight);

      //preset scroll
      //this.presetScroll.draw(p.windowWidth/4*2.8,p.windowHeight-gridInitY/1.25);
      if (this.presetScroll.value !== this.preset) {
        this.preset = this.presetScroll.value;
        if (this.name === "DRUMS") this.switchPreset(synths.drumPresets[this.preset]);
        else this.switchPreset(synths.synthPresets[this.preset]);
      }

      //p.stroke(255);
      p.strokeWeight(1);
      //p.fill(0);

      p.stroke(white[0], white[1], white[2],255/4);
      p.noFill();

      //volume fader
      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2-studioGap*2,gridInitY+studioGap + auxY +5*studioGap,studioGap*2, gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap); //volume fader
      p.rect(gridInitX + p.windowWidth/9/2 + studioGap/2,gridInitY+studioGap + auxY +5*studioGap,studioGap*2, gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap); //volume fader
      
      p.fill(white[0], white[1], white[2]);
      
      let gainTodB = p.map(this.gain,0,1,-48,0);
      gainTodB = Math.round(gainTodB*10)/10;

      p.textSize(p.windowHeight/55);
      p.textAlign(p.CENTER,p.TOP);
      if (gainTodB === -48) p.text("-Inf",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      else if (gainTodB%1 === 0) p.text(gainTodB+".0dB",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      else p.text(gainTodB+"dB",gridInitX+p.windowWidth/9/2,gridInitY+studioGap*2.7+auxY*2+auxY/2+p.windowHeight/15/1.7);
      
      this.volumeYmax = gridInitY+studioGap + auxY +5*studioGap;
      this.volumeYmin = gridInitY+studioGap + auxY +5*studioGap + gridStepSizeY*(12-1) - studioGap - auxY-13*studioGap;
      this.volumeY = p.map(this.gain,1,0,this.volumeYmax,this.volumeYmin);

      p.rect(gridInitX + p.windowWidth/9/2 - studioGap/2 -studioGap*2,this.volumeY,studioGap*5, p.windowHeight/250);
      p.noFill();

      if (p.mouseX > gridInitX + p.windowWidth/9/2 - studioGap/2 - studioGap*2 && p.mouseX < gridInitX + p.windowWidth/9/2 - studioGap/2 -studioGap*2 + studioGap*5 
      && p.mouseY > this.volumeYmax && p.mouseY < this.volumeYmin && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'grab';
        this.hoverVolume = true;
        
        if (p.mouseIsPressed) {
          this.draggingVolume = true;
          dragging = true;
        }
      } else this.hoverVolume = false;


      if (p.mouseIsPressed === false && this.draggingVolume) {
        this.draggingVolume = false;
        dragging = false;
        //session.save();
      }

      if (this.draggingVolume) {
        document.body.style.cursor = 'grabbing';
        this.gain = p.map(p.mouseY,this.volumeYmax,this.volumeYmin,1,0);
        if (this.gain > 1) this.gain = 1;
        if (this.gain < 0) this.gain = 0;
      }

      //boxes
      p.rect(gridInitX,gridInitY, p.windowWidth/9, auxY, p.windowHeight/200); //visualizer
      p.rect(gridInitX,gridInitY+studioGap + auxY,p.windowWidth/9, gridStepSizeY*(12-1) - studioGap - auxY,p.windowHeight/200); //volume fader
      p.rect(gridInitX+col1X,gridInitY+studioGap*2+auxY*2,auxXfx,auxY,p.windowHeight/200); //filter
      p.rect(gridInitX+col1X+auxXfx+studioGap,gridInitY+studioGap*2+auxY*2,auxXfx,auxY,p.windowHeight/200); //distortion
      p.rect(gridInitX+col1X+auxXfx*2+studioGap*2,gridInitY+studioGap*2+auxY*2,auxXfx*3+studioGap*2,auxY,p.windowHeight/200); //delay
      p.rect(gridInitX+col1X+auxXfx*5+studioGap*5,gridInitY+studioGap*2+auxY*2,auxXfx*2+studioGap,auxY,p.windowHeight/200); //reverb

      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) p.rect(gridInitX+col1X+(i*auxXfx)+i*studioGap,gridInitY, auxXfx ,auxY*2 + studioGap,p.windowHeight/200);
      } else {
        p.rect(gridInitX+col1X,gridInitY, auxXfx*3 + studioGap*2,auxY,p.windowHeight/200); //oscillator 1
        p.rect(gridInitX+col1X,gridInitY+auxY+studioGap, auxXfx*3 + studioGap*2,auxY,p.windowHeight/200); //oscillator 2
        p.rect(gridInitX+col1X + auxXfx*3 + studioGap*3, gridInitY, auxXfx*4 + studioGap*3,auxY,p.windowHeight/200); //envelope 1
        p.rect(gridInitX+col1X + auxXfx*3 + studioGap*3, gridInitY+auxY+studioGap, auxXfx*4 + studioGap*3,auxY,p.windowHeight/200); //envelope 2
      }

      //petal visualizer

      p.push();
      p.noStroke();
      p.fill(this.color[0], this.color[1], this.color[2], this.opaLine);
      p.translate(gridInitX+p.windowWidth/9/2, gridInitY+auxY/2,-p.windowHeight/12);
      p.scale(p.windowHeight/14 / petalModelSize);
      p.rotateX(p.PI/2);
      p.rotateY(this.ang);
      p.rotateZ(p.sin(this.ang)*p.PI/3);
      p.model(this.petal);
      p.pop();

      //boxes labels

      p.fill(this.color[0],this.color[1],this.color[2]);
      p.noStroke();
      p.textAlign(p.LEFT,p.TOP);
      p.textSize(p.windowHeight/60);

      p.text("VOLUME",gridInitX+studioGap*1.2,gridInitY+auxY+studioGap*2);
      p.fill(this.color[0],this.color[1],this.color[2],this.filterButton.opa);
      p.text("FILTER",gridInitX+col1X+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.distButton.opa);
      p.text("DISTORTION",gridInitX+col1X+auxXfx+studioGap+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.dlyButton.opa);
      p.text("DELAY",gridInitX+col1X+auxXfx*2+studioGap*2+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      p.fill(this.color[0],this.color[1],this.color[2],this.revButton.opa);
      p.text("REVERB",gridInitX+col1X+auxXfx*5+studioGap*5+studioGap*1.2,gridInitY+studioGap*2+auxY*2+studioGap);
      
      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) {
          p.fill(this.color[0],this.color[1],this.color[2],this.drumButtons[i].opa);
          p.text(theory.drumLabels[i],gridInitX+col1X+studioGap*1.2+(i*auxXfx)+i*studioGap,gridInitY+studioGap);
        }
      } else {
        p.fill(this.color[0],this.color[1],this.color[2],this.oscButtons[0].opa);
        p.text("OSCILLATOR 1",gridInitX+col1X+studioGap*1.2,gridInitY+studioGap);
        p.fill(this.color[0],this.color[1],this.color[2],this.oscButtons[1].opa);
        p.text("OSCILLATOR 2",gridInitX+col1X+studioGap*1.2,gridInitY+auxY+studioGap*2);
        p.fill(this.color[0],this.color[1],this.color[2],this.envButtons[0].opa);
        p.text("ENVELOPE 1",gridInitX+col1X+auxXfx*3+studioGap*3+studioGap*1.2,gridInitY+studioGap);
        p.fill(this.color[0],this.color[1],this.color[2],this.envButtons[1].opa);
        p.text("ENVELOPE 2",gridInitX+col1X+auxXfx*3+studioGap*3+studioGap*1.2,gridInitY+auxY+studioGap*2);
      }

      //knobs and buttons

      this.filterKnob.draw(gridInitX+col1X+auxXfx/2,gridInitY+studioGap*2.7+auxY*2+auxY/2,this.filterButton.opa);
      this.filterButton.draw(gridInitX+col1X+auxXfx-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      this.distKnob.draw(gridInitX+col1X+auxXfx/2+auxXfx+studioGap,gridInitY+studioGap*2.7+auxY*2+auxY/2,this.distButton.opa);
      this.distButton.draw(gridInitX+col1X+auxXfx*2+studioGap-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      for (let i=0; i<3; i++) this.dlyKnobs[i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+2)+studioGap*(i+2),gridInitY+studioGap*2.7+auxY*2+auxY/2,this.dlyButton.opa);
      this.dlyButton.draw(gridInitX+col1X+auxXfx*5+studioGap*4-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      for (let i=0; i<2; i++) this.revKnobs[i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(3+i+2)+studioGap*(3+i+2),gridInitY+studioGap*2.7+auxY*2+auxY/2,this.revButton.opa);
      this.revButton.draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap*2+auxY*2+studioGap*2);

      if (this.name === "DRUMS") {
        for(let i=0; i<this.drumKnobs.length; i++) {
          this.drumKnobs[i][0].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*1.5+auxY/2,this.drumButtons[i].opa);
          this.drumKnobs[i][1].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),studioGap+gridInitY-studioGap*2+auxY+auxY/2,this.drumButtons[i].opa);
          this.drumButtons[i].draw(gridInitX+col1X+auxXfx*(i+1)+studioGap*(i)-studioGap*2,gridInitY+studioGap*2);

          p.rect(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+auxY*2-studioGap*2);
        }
      } else {
        for (let i=0; i<3; i++) this.oscKnobs[0][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*0.7+auxY/2, this.oscButtons[0].opa);
        this.oscButtons[0].draw(gridInitX+col1X+auxXfx*3+studioGap*2-studioGap*2,gridInitY+studioGap*2);
        for (let i=0; i<4; i++) this.envKnobs[0][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+3)+studioGap*(i+3),gridInitY+studioGap*0.7+auxY/2, this.envButtons[0].opa);
        this.envButtons[0].draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap*2);
        for (let i=0; i<3; i++) this.oscKnobs[1][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i)+studioGap*(i),gridInitY+studioGap*1.7+auxY+auxY/2, this.oscButtons[1].opa);
        this.oscButtons[1].draw(gridInitX+col1X+auxXfx*3+studioGap*2-studioGap*2,gridInitY+studioGap+auxY+studioGap*2);
        for (let i=0; i<4; i++) this.envKnobs[1][i].draw(gridInitX+col1X+auxXfx/2+auxXfx*(i+3)+studioGap*(i+3),gridInitY+studioGap*1.7+auxY+auxY/2, this.envButtons[1].opa);
        this.envButtons[1].draw(gridInitX+col1X+auxXfx*7+studioGap*6-studioGap*2,gridInitY+studioGap+auxY+studioGap*2);
      }

      //this.updateSynthValues();
    }

    drawPreview(loop,x,y,radius) {

      //this.x = p.windowWidth / 2 + p.windowWidth/8;
      //this.y = p.windowHeight / 2;
      //this.radiusCol = p.windowHeight / 5;

      p.noFill();
      p.stroke(white[0], white[1], white[2],previewOpa);
      p.strokeWeight(maxWeightLines / (this.id + 1));

      p.push();
      p.translate(0, 0, 2);
      p.beginShape();

      let fadeLength = 6; // Length of the fade
      let shapeLength = this.particlesPreviewX.length-1;
      let currentStep = (loop.currentStep - 1 + shapeLength) % shapeLength; // One step behind

      for (let i = 0; i < shapeLength; i++) {
        // Calculate the difference to currentStep considering wrap-around
        let dif = Math.min(
          Math.abs(currentStep - i),
          Math.abs(currentStep - (i + shapeLength)),
          Math.abs(currentStep - (i - shapeLength))
        );

        if (dif > fadeLength) dif = fadeLength;

        // Calculate the opacity based on dif and apply a smooth transition
        let opacity = previewOpa * (fadeLength - dif) / fadeLength;

        if (opacity < previewOpa/5) opacity = previewOpa/5;

        if (loop.play && session.structDrawer || session.loopDrawer) p.stroke(white[0], white[1], white[2], opacity);
        else p.stroke(white[0], white[1], white[2], previewOpa/5);

        // Use modulo for indices to handle wrap-around
        let index = (shapeLength - i + shapeLength) % shapeLength;
        p.vertex(this.particlesPreviewX[index], this.particlesPreviewY[index]);
      }

      p.endShape(p.CLOSE);
      p.pop();

      let angle = -p.PI / 2;
      let angles = [];
      angles.push(angle);

      for (let i = 0; i < this.targetXpreview.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/2.5);

        this.targetXpreview[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
        this.targetYpreview[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;

        angle -= p.TWO_PI / this.targetXpreview.length + p.TWO_PI / this.targetXpreview.length / this.targetXpreview.length;
        angles.push(angle);
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesPreviewX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesPreviewX[i] - this.targetXpreview[i], this.particlesPreviewY[i] - this.targetYpreview[i]));
        let d = p.dist(this.particlesPreviewX[i], this.particlesPreviewY[i], this.targetXpreview[i], this.targetYpreview[i]);

        this.particlesPreviewX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesPreviewY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }

      for (let i = 0; i<this.notes.length; i++) {
        if (session.loopDrawer) this.notes[i].drawCollapsed(loop,this,angles,this.particlesPreviewX[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).x,this.particlesPreviewY[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(p.PI - angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/50).y);
        else this.notes[i].drawCollapsed(loop,this,angles,this.particlesPreviewX[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/110).x,this.particlesPreviewY[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(p.PI - angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/110).y);
      }

      //prevent param updating when not needed
      /*if (session.activeTab === null) {
        this.updateSynthParams();
        for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
      } 
      else if (session.activeTab.selectedTrack !== null) {
        if (session.activeTab.selectedTrack === this){
          this.updateSynthParams();
          for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
        }
      }*/
    }

    drawInDrawer(x, y, radius,hover) {

      p.noFill();
      if(hover === true) p.stroke(white[0], white[1], white[2]);
      else p.stroke(white[0], white[1], white[2],255/3);
      p.strokeWeight((maxWeightLines / (this.id + 1))/1.5);

      p.push();
      p.translate(0,0,2);
      p.beginShape();
      for (let i = 0; i < this.particlesDrawerX.length; i++) if(i%8 !== 0) p.vertex(this.particlesDrawerX[i], this.particlesDrawerY[i]);
      p.endShape(p.CLOSE);
      p.pop();
      //p.circle(x, y, radius);

      let angle = -p.PI / 2;

      for (let i = 0; i < this.targetXdrawer.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/3);
        phase += 0.000006;
        zoff += 0.000002;

        this.targetXdrawer[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
        this.targetYdrawer[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;

        angle -= p.TWO_PI / this.targetXdrawer.length + p.TWO_PI / this.targetXdrawer.length / this.targetXdrawer.length;
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesDrawerX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesDrawerX[i] - this.targetXdrawer[i], this.particlesDrawerY[i] - this.targetYdrawer[i]));
        let d = p.dist(this.particlesDrawerX[i], this.particlesDrawerY[i], this.targetXdrawer[i], this.targetYdrawer[i]);

        this.particlesDrawerX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesDrawerY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }

      for (let i = 0; i<this.notes.length; i++) {
        this.notes[i].drawCollapsedDrawer(this.particlesDrawerX[nSteps-this.notes[i].start+1],this.particlesDrawerY[nSteps-this.notes[i].start+1],hover,radius);
      }
    }

    drawInStructure(loop, x, y, radius) {

      //this.radiusCol = p.windowHeight / 4;

      p.noFill();
      p.strokeWeight(maxWeightLines / (this.id + 1));

      //p.push();
      //p.translate(0, 0, 2);
      p.beginShape();
      let opacity = 255/5;

      let fadeLength = 6; // Length of the fade
      let shapeLength = this.particlesStructX.length-1;
      let currentStep = (loop.currentStep - 1 + shapeLength) % shapeLength; // One step behind

      for (let i = 0; i < shapeLength; i++) {
        // Calculate the difference to currentStep considering wrap-around
        if (loop.play) {
          let dif = Math.min(
            Math.abs(currentStep - i),
            Math.abs(currentStep - (i + shapeLength)),
            Math.abs(currentStep - (i - shapeLength))
          );

          if (dif > fadeLength) dif = fadeLength;

          // Calculate the opacity based on dif and apply a smooth transition
          opacity = 255* (fadeLength - dif) / fadeLength;

          if (opacity < 255/5) opacity = 225/5;
        }

        p.stroke(white[0], white[1], white[2], opacity);

        // Use modulo for indices to handle wrap-around
        let index = (shapeLength - i + shapeLength) % shapeLength;
        p.vertex( this.particlesStructX[index],  this.particlesStructY[index]);
      }

      p.endShape(p.CLOSE);
      //p.pop();

      let angle = -p.PI / 2;
      let angles = [];
      angles.push(angle);

      for (let i = 0; i < this.targetXstruct.length; i++) {

        let xoff = p.map(p.cos(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let yoff = p.map(p.sin(angle + phase+(this.id+this.loopId)*2), -1, 1, 0, noiseMax);
        let r = p.map(p.noise(xoff, yoff, zoff), 0, 1, 0, radius/2.5);

        //if (session.loopDrawer === false && session.structDrawer === false) {
          phase += 0.00001;
          zoff += 0.000004;
        //}

        this.targetXstruct[i] = x + p5.Vector.fromAngle(angle, radius + r).x;
        this.targetYstruct[i] = y + p5.Vector.fromAngle(p.PI - angle, radius + r).y;

        angle -= p.TWO_PI / this.targetXstruct.length + p.TWO_PI / this.targetXstruct.length / this.targetXstruct.length;
        angles.push(angle);
      }

      //for (let i = 0; i<this.targetXcol.length;i++) p.point(this.targetXcol[i], this.targetYcol[i]);

      for (let i = 0; i < this.particlesStructX.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesStructX[i] - this.targetXstruct[i], this.particlesStructY[i] - this.targetYstruct[i]));
        let d = p.dist(this.particlesStructX[i], this.particlesStructY[i], this.targetXstruct[i], this.targetYstruct[i]);

        this.particlesStructX[i] -= p5.Vector.fromAngle(a, d / 6).y;
        this.particlesStructY[i] -= p5.Vector.fromAngle(p.PI - a, d / 6).x;
      }

      for (let i = 0; i<this.notes.length; i++) {
        this.notes[i].drawCollapsedStructure(loop,angles,this.particlesStructX[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/100).x,this.particlesStructY[nSteps-this.notes[i].start+1]+p5.Vector.fromAngle(p.PI - angles[nSteps-this.notes[i].start+1], p.sin(this.notes[i].ang/2)*p.windowHeight/100).y);
      }
/*
      //prevent param updating when not needed
      if (session.activeTab === null) {
        this.updateSynthParams();
        for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
      } 
      else if (session.activeTab.selectedTrack !== null) {
        if (session.activeTab.selectedTrack === this){
          this.updateSynthParams();
          for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId])
        }
      }*/
    }

    switchPreset(preset) {
      if (this.name === "DRUMS") {
        
        for (let i=0; i<this.synth.parts.length; i++) {
          //console.log(preset);
          this.synth.parts[i].buffer = preset.kit[i];
          this.drumButtons[i].state = preset.partState[i];
          this.drumKnobs[i][0].value = preset.partVol[i];
          this.drumKnobs[i][1].value = preset.partPitch[i];
        }
      }
      else {
        for (let i=0; i<this.synth.oscillators.length; i++) {
          this.oscButtons[i].state = preset.oscState[i];
          for (let j=0; j<preset.osc[i].length; j++) this.oscKnobs[i][j].value = preset.osc[i][j];
          this.envButtons[i].state = preset.envState[i];
          for (let j=0; j<preset.env[i].length; j++) this.envKnobs[i][j].value = preset.env[i][j];
        }
      }

      this.filterButton.state = preset.filterState;
      this.filterKnob.value = preset.filter;
      this.distButton.state = preset.distortionState;
      this.distKnob.value = preset.distortion;
      this.dlyButton.state = preset.delayState;
      for (let i=0; i<preset.delay.length; i++) this.dlyKnobs[i].value = preset.delay[i];
      this.revButton.state = preset.reverbState;
      for (let i=0; i<preset.reverb.length; i++) this.revKnobs[i].value = preset.reverb[i];
    }
    

    updateSynthParams() {

      if (this.muted) this.synth.fxChain.gain.gain.value = 0;
      else if (this.synth.fxChain.gain.gain.value !== this.gain) this.synth.fxChain.gain.gain.value = this.gain;

      if (this.name === "DRUMS") {

        if (!synths.compareBuffers(this.synth.parts[0].buffer,synths.drumPresets[this.presetScroll.value].kit[0])) {
          for (let i=0; i<this.synth.parts.length; i++) this.synth.parts[i].buffer = synths.drumPresets[this.presetScroll.value].kit[i];
        }
         
        for (let i=0; i<this.synth.parts.length; i++) {
          let mapping = p.map(this.drumKnobs[i][0].value,0,1,-48,0);
          if (this.drumButtons[i].state) {
            if (this.synth.parts[i].volume.value !== mapping) {
              if (this.drumKnobs[i][0].value === 0) this.synth.parts[i].volume.value = -Infinity;
              else this.synth.parts[i].volume.value = mapping;
            }
          } else if (this.synth.parts[i].volume.value !== -Infinity) this.synth.parts[i].volume.value = -Infinity;

          mapping = p.map(this.drumKnobs[i][1].output/100,-12,12,0.02,2);
          if (this.synth.parts[i].playbackRate !== mapping) this.synth.parts[i].playbackRate = mapping;
        }
      }
      else {
        let oscInfo = [];
        oscInfo.push(this.synth.oscillators[0].get());
        oscInfo.push(this.synth.oscillators[1].get());
        //console.log(oscInfo);

        for (let i=0; i<2; i++) {
          if (this.oscButtons[i].state) {
            if (oscInfo[i].oscillator.type !== this.oscKnobs[i][0].output.toLowerCase()) this.synth.oscillators[i].set({oscillator: {type: this.oscKnobs[i][0].output.toLowerCase()}});
            if (oscInfo[i].detune !== this.oscKnobs[i][1].output) this.synth.oscillators[i].set({detune: this.oscKnobs[i][1].output});
            if (oscInfo[i].volume !== p.map(this.oscKnobs[i][2].output,0,1,-50,0)) this.synth.oscillators[i].set({volume: p.map(this.oscKnobs[i][2].output,0,1,-50,0)});
            if (this.oscKnobs[i][2].output === 0) this.synth.oscillators[i].set({volume: -Infinity});
          }
          else if (oscInfo[i].volume !== -Infinity) this.synth.oscillators[i].set({volume: -Infinity});

          if (this.envButtons[i].state) {
            if (oscInfo[i].envelope.attack !== this.envKnobs[i][0].output) this.synth.oscillators[i].set({envelope: {attack: this.envKnobs[i][0].output}});
            if (oscInfo[i].envelope.decay !== this.envKnobs[i][1].output) this.synth.oscillators[i].set({envelope: {decay: this.envKnobs[i][1].output}});
            if (oscInfo[i].envelope.sustain !== this.envKnobs[i][2].output) this.synth.oscillators[i].set({envelope: {sustain: this.envKnobs[i][2].output}});
            if (oscInfo[i].envelope.release !== this.envKnobs[i][3].output) this.synth.oscillators[i].set({envelope: {release: this.envKnobs[i][3].output}});
          }
          else this.synth.oscillators[i].set({envelope: {attack: 0, decay: 0, sustain: 1, release: 0}});
        }
      }

      if (this.filterButton.state) {
        let mapping = p.map(this.filterKnob.output,0,1,100,10000);

        if (this.synth.fxChain.filter.frequency !== mapping) this.synth.fxChain.filter.frequency.value = mapping;

      } else if (this.synth.fxChain.filter.frequency) {
        this.synth.fxChain.filter.frequency.value = 20000;
      }

      if (this.distButton.state) {
        if (this.synth.fxChain.distortion.wet !== 0.5) this.synth.fxChain.distortion.wet.value = 0.5;
        if (this.synth.fxChain.distortion.distortion !== this.distKnob.value) this.synth.fxChain.distortion.distortion = this.distKnob.value;
      }
      else if (this.synth.fxChain.distortion.wet !== 0) {
        this.synth.fxChain.distortion.wet.value = 0;
        this.synth.fxChain.distortion.distortion = 0;
      }

      if (this.dlyButton.state) {
        //let dTime = session.loops[this.loopId].timeBtwSteps*(p.round(p.map(this.dlyKnobs[0].value,0,1,0,theory.delayTimes.length-1)));
        let dTime = this.dlyKnobs[0].output.split("/")[1]+"n";
        if (this.synth.fxChain.delay.delayTime !== dTime) this.synth.fxChain.delay.delayTime.value = dTime;

        if (this.synth.fxChain.delay.feedback !== this.dlyKnobs[1].value) this.synth.fxChain.delay.feedback.value = this.dlyKnobs[1].value;
        if (this.synth.fxChain.delay.wet !== this.dlyKnobs[2].value) this.synth.fxChain.delay.wet.value = this.dlyKnobs[2].value;
      }
      else if (this.synth.fxChain.delay.wet !== 0) {
        this.synth.fxChain.delay.wet.value = 0;
        this.synth.fxChain.delay.feedback.value = 0;
      }
      

      if (this.revButton.state) {
        if (this.synth.fxChain.reverb.decay !== this.revKnobs[0].output) this.synth.fxChain.reverb.decay = this.revKnobs[0].output;
        if (this.synth.fxChain.reverb.wet !== this.revKnobs[1].output) this.synth.fxChain.reverb.wet.value = this.revKnobs[1].output;
      }
      else {
        if (this.synth.fxChain.reverb.wet !== 0) {
          this.synth.fxChain.reverb.wet.value = 0;
          this.synth.fxChain.reverb.decay = 0.01;
        }
      } 
    } 

    draw() {
      if (session.loopDrawer === false && session.structDrawer === false) this.updateSynthParams();
      //for (let i=0; i<this.knobs.length; i++) this.knobs[i][1].knobAutomate(session.loops[this.loopId]);

      if (session.activeTab.selectedTrack !== null && session.activeTab.selectedTrack !== this) {
        if (this.opaLine - this.opaLineInc < 255/4) this.opaLine = 255/4;
        else this.opaLine -= this.opaLineInc;
      } else {
        if (this.opaLine + this.opaLineInc > 255) this.opaLine = 255;
        else this.opaLine += this.opaLineInc;
      }

      if (session.activeTab.selectedTrack === null) {
        p.noFill();
        //p.ambientMaterial(255, 0, 0);
        p.stroke(white[0], white[1], white[2], this.opaLine);
        p.strokeWeight(maxWeightLines / (this.id + 1));
        //p.strokeWeight(maxWeightLines);

        p.beginShape();
        for (let i = 0; i < this.particlesX.length; i++) {
          //let dif = session.loops[this.loopId].currentStep - i;
          //let aux = p.map(dif, -session.loops[this.loopId].nSteps, session.loops[this.loopId].nSteps, 0, 255);
          //p.stroke(255, 255, 255,aux);
          let dif = p.abs(session.activeTab.currentStep-i);
          if (session.activeTab.play === false) dif = 6;
          else if (dif > 6) dif = 6;
          p.stroke(white[0], white[1], white[2], this.opaLine/dif);
          p.vertex(this.particlesX[i], this.particlesY[i],-p.windowHeight/50*(maxTracks+2));
        }
        p.endShape();
      }

      //p.stroke(255, 0, 0);

      let n = p.noise(0, this.id * 0.3, p.frameCount * 0.002);
      let y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
      this.targetXexp[0] = 0;
      this.targetYexp[0] = p.windowHeight / 2 + y;

      let index = 1;

      //error with (nSteps-1) instead of nSteps
      for (let x = gridInitX; x <= gridInitX + (gridStepSizeX * nSteps); x += gridStepSizeX) {
        n = p.noise(x * 0.0005, this.id * 0.3, p.frameCount * 0.002);
        y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
        this.targetXexp[index] = x;
        this.targetYexp[index] = p.windowHeight / 2 + y;
        index++;
      }

      n = p.noise(p.windowWidth * 0.0005, this.id * 0.3, p.frameCount * 0.002);
      y = p.map(n, 0, 1, -p.windowHeight / 10, p.windowHeight / 10);
      this.targetXexp[this.targetXexp.length - 1] = p.windowWidth;
      this.targetYexp[this.targetXexp.length - 1] = p.windowHeight / 2 + y;

      //for (let i = 0; i<this.targetXexp.length;i++) p.point(this.targetXexp[i], this.targetYexp[i]);

      for (let i = 0; i < this.targetXexp.length; i++) {
        let a = p.createVector(0, -1).angleBetween(p.createVector(this.particlesX[i] - this.targetXexp[i], this.particlesY[i] - this.targetYexp[i]));
        let d = p.dist(this.particlesX[i], this.particlesY[i], this.targetXexp[i], this.targetYexp[i]);

        this.particlesX[i] -= p5.Vector.fromAngle(a, d / 15).y;
        this.particlesY[i] -= p5.Vector.fromAngle(p.PI - a, d / 15).x;
      }

      //update icon position
      let dif = this.iconTargetX - this.iconX;
      this.iconX += dif / 10;

      if (this.opaIcon + this.opaIconInc > this.opaIconMax) this.opaIcon = this.opaIconMax;
      else this.opaIcon += this.opaIconInc;

      //icon
      p.noStroke();
      p.textFont(fontLight);
      p.fill(white[0], white[1], white[2], this.opaLine);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(p.windowHeight / 65);

      p.push();
      if (this.menu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
      p.text(this.name, this.iconX + iconSize / 2, p.windowHeight - marginX);
      p.pop();

      if (this.id%2 === 0) this.ang += this.angInc;
      else this.ang -= this.angInc;

      //p.fill(this.color[0], this.color[1], this.color[2], this.opaIcon);
      if (this.muted && this.menu.state < 0) {
        p.textFont(fontLight);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(p.windowHeight / 65);
        p.fill(white[0], white[1], white[2], this.opaLine/2);
        p.text("MUTED",this.iconX + iconSize / 2, p.windowHeight - marginX -p.windowHeight / 40 - p.windowHeight/30);
        p.fill(this.color[0], this.color[1], this.color[2], this.opaLine/2);
      } else p.fill(this.color[0], this.color[1], this.color[2], this.opaLine);
      p.push();
      if (this.menu.state >= 0) p.translate(0,0, p.windowHeight / 30*2);
      p.translate(this.iconX + iconSize / 2, p.windowHeight - marginX -p.windowHeight / 40 - p.windowHeight/30,-p.windowHeight/30);
      p.scale(p.windowHeight/34 / petalModelSize);
      p.rotateX(p.PI/2);
      p.rotateY(this.ang);
      p.rotateZ(p.sin(this.ang)*p.PI/3);
      p.model(this.petal);
      p.pop();

      //hover and track select
      if (p.mouseX > this.iconX && p.mouseX < this.iconX+p.windowHeight/30*2 && p.mouseY > p.windowHeight - marginX -p.windowHeight / 45 - p.windowHeight/30*2 && p.mouseY < p.windowHeight - marginX -p.windowHeight / 45 && dragging === false && menuOpened === false) {
        document.body.style.cursor = 'pointer';
        if (this.iconHover === false) this.angInc = p.PI / 20;
        this.iconHover = true;
        
        if (p.mouseIsPressed) {
          if (p.mouseButton === p.LEFT) {
            if (session.activeTab.selectedTrack !== this) {
              if (session.activeTab.selectedTrack === null) {
                session.loops[this.loopId].blackOpa1 = 255;
                session.loops[this.loopId].blackOpa4 = 255;
              } else {
                if (session.activeTab.type === "loop") session.activeTab.selectedTrack.deselectAllNotes();
              }

              session.loops[this.loopId].blackOpa2 = 255;
              session.loops[this.loopId].blackOpa3 = 255;
              session.activeTab.selectedTrack = this;
              this.angInc = p.PI / 15;
            } else this.muted = !this.muted;
          } else if (p.mouseButton === p.RIGHT) {
            if (session.activeTab.type === "loop" && session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack.deselectAllNotes();
            this.menu.open();
            session.activeTab.play = false;
            Tone.Transport.stop();
            Tone.Transport.position = 0;
            synths.releaseAll();
            this.angInc = p.PI / 15;
          }

          p.mouseIsPressed = false;

        }
      }
      else this.iconHover = false;

      if (this.angInc > p.PI / 400) this.angInc -= 0.002;
      
      /*p.strokeWeight(1);
      p.stroke(255, 255, 255, this.opaIcon);
      p.rect(this.iconX, this.iconY, iconSize, iconSize, iconCorners);

      p.noStroke();
      p.textFont(font1);
      p.fill(255, 255, 255, this.opaIcon);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(p.windowHeight / 35);
      p.text('0' + (this.id + 1), this.iconX + iconSize / 2, this.iconY + iconSize / 7);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(p.windowHeight / 90);
      p.text(this.name, this.iconX + iconSize / 2, this.iconY + iconSize - iconSize / 5);*/
    }

    drawNotes() {
      for (let i = 0; i < this.notes.length; i++) {
        if (session.activeTab.selectedTrack !== null) {
          if (this.name === "DRUMS") this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11)/(this.nPitches-1));
          else {
            if (this.notes[i].octave === this.octaveScroll.value) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)));
            else if (this.notes[i].octave === this.octaveScroll.value+1) this.notes[i].draw(this.particlesX[this.notes[i].start+1], gridInitY + (this.nPitches-this.notes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4);
          }
        }
        else {
          this.notes[i].draw(this.particlesX[this.notes[i].start+1], this.particlesY[this.notes[i].start+1]);
        }
      }

      //loop ends and recorded notes are pending
      if (session.loops[this.loopId].currentStep === nSteps-1) {
        if (recordedNotes.length !== 0) {
          for (let i = 0; i < recordedNotes.length; i++) {
            if (recordedNotes[i].trackId === this.id) {
              recordedNotes[i].duration = session.loops[this.loopId].currentStep - recordedNotes[i].start+1;
              if (recordedNotes[i].duration === 0) recordedNotes[i].duration = 1;
              this.ajustNotes(recordedNotes[i]);
              this.notes.push(recordedNotes[i]);
              recordedNotes.splice(i,1);
              i--;
            }
          }
          //session.save();
        }
      } 

      //draw recording notes
      for (let i = 0; i < recordedNotes.length; i++) {
        if (recordedNotes[i].trackId === this.id) {
          recordedNotes[i].x = this.particlesX[recordedNotes[i].start+1];

          recordedNotes[i].duration = session.loops[this.loopId].currentStep - recordedNotes[i].start;
          
          if (recordedNotes[i].octave === this.octaveScroll.value) recordedNotes[i].y = gridInitY + (this.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1));
          else if (recordedNotes[i].octave === this.octaveScroll.value+1) recordedNotes[i].y = gridInitY + (this.nPitches-recordedNotes[i].pitch-1)*(gridStepSizeY*11/(this.nPitches-1)) - gridStepSizeY*11/2-gridStepSizeY/4;
      
          recordedNotes[i].draw(this.particlesX[recordedNotes[i].start+1], recordedNotes[i].y);
          if (session.loops[this.loopId].currentStep >= recordedNotes[i].start && session.loops[this.loopId].currentStep <= recordedNotes[i].start+recordedNotes[i].duration) recordedNotes[i].spawnParticles(gridInitX+session.loops[this.loopId].currentStep*gridStepSizeX, recordedNotes[i].y);
        }
      }
    }
  }

  class Note {

    constructor(pitch, loopId, trackId, start, duration, octave, color) {
      this.start = start;
      this.duration = duration;

      this.octave = octave;

      this.hover = false;
      this.dragging = false;
      this.selected = false;
      this.offsetDrag = 0;

      //this.pitch = theory.freqs[p.floor(p.random(0, theory.freqs.length))]*8;
      this.pitch = pitch;

      this.colorOrig = color;
      this.color = color;

      this.loopId = loopId;
      this.trackId = trackId;

      this.size = p.windowHeight / 60;

      this.x = p.random(0, p.windowWidth);
      this.y = p.random(0, p.windowHeight);

      this.opa = 255;
      this.opaInc = 10;

      this.opaInfo = 0;

      this.animOpa = 0;
      this.animR = 0;
      this.animOpaInc = 10;
      this.animRInc = p.windowHeight / 400;

      this.offset = p.windowHeight / 40;
      this.drawerAng = p.PI * p.random(0, 100);
      this.drawerAngInc = p.random(p.PI / 190,p.PI / 210);
      this.ang = p.PI * p.random(0, 100);
      this.angInc = p.random(p.PI / 190,p.PI / 210);

      //session.loops[this.loopId].tracks[this.trackId].notes.push(this);
      this.particles = [];
      this.pool = [];
    }

    spawnParticles(x,y) {
      var particle, theta, force;
      if ( this.particles.length >= playParticlesMax ) this.pool.push( this.particles.shift() );
      
      particle = new PlayParticle(x, y, p.random(playSize1,playSize2),this.color);
      particle.wander = p.random( wander1, wander2 );
      particle.drag = p.random( drag1, drag2 );
      theta = p.random( p.TWO_PI );
      force = p.random( force1, force2 );
      particle.velocity.x = p.sin( theta ) * force;
      particle.velocity.y = p.cos( theta ) * force;
      this.particles.push( particle );
    }
    
    updateParticles() {
      var i, particle;
      for ( i = this.particles.length - 1; i >= 0; i-- ) {
          particle = this.particles[i];
          if ( particle.alive ) particle.move();
          else this.pool.push(this.particles.splice( i, 1 )[0]);
      }
    } 

    stop(pitchOffset,time) {
      let pitch = this.pitch;
      let octave = this.octave;
      if (pitch > 11) pitch = pitch-12;

      pitch += pitchOffset;
      if (pitch > 11) {
        octave++;
        pitch = pitch-12;
      }
      else if (pitch < 0) {
        octave--;
        pitch = 12+pitch;
      }

      if (session.loops[this.loopId].tracks[this.trackId].name !== "DRUMS") {
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerRelease(theory.freqs[pitch]*p.pow(2,octave),time);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerRelease(theory.freqs[pitch]*p.pow(2,octave),time); 
    
      }
    }

    play(pitchOffset,time) {
      this.angInc = p.PI / 12;
      this.animOpa = 255;
      this.animR = this.size;
      this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];


      if (session.loops[this.loopId].tracks[this.trackId].name === "DRUMS") {
        session.loops[this.loopId].tracks[this.trackId].synth.parts[this.pitch].stop(time);
        session.loops[this.loopId].tracks[this.trackId].synth.parts[this.pitch].start(time);
        if (this.pitch === 2) session.loops[this.loopId].tracks[this.trackId].synth.parts[3].stop(time);
      }
      else {
        let pitch = this.pitch;
        let octave = this.octave;
        if (pitch > 11) pitch = pitch-12;

        pitch += pitchOffset;
        if (pitch > 11) {
          octave++;
          pitch = pitch-12;
        }
        else if (pitch < 0) {
          octave--;
          pitch = 12+pitch;
        }

        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerAttack(theory.freqs[pitch]*p.pow(2,octave),time);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerAttack(theory.freqs[pitch]*p.pow(2,octave),time);
      }
      //synths.melody.triggerAttackRelease(theory.freqs[this.pitch]*p.pow(2,this.octave), session.activeTab.timeBtwSteps);
    }

    playShort() {
      this.angInc = p.PI / 12;
      this.animOpa = 255;
      this.animR = this.size;
      this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
      //synth.triggerAttackRelease("C3", "16n");
      if (session.activeTab.tracks[this.trackId].name === "DRUMS") {
        session.activeTab.tracks[this.trackId].synth.parts[this.pitch].stop();
        session.activeTab.tracks[this.trackId].synth.parts[this.pitch].start();
      } else {
        let pitch = this.pitch;
        if (pitch > 11) pitch = pitch-12;
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerAttackRelease(theory.freqs[pitch]*p.pow(2,this.octave),0.1);
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerAttackRelease(theory.freqs[pitch]*p.pow(2,this.octave),0.1);
      }
      for (let i=0;i<10;i++) this.spawnParticles(this.x,this.y);
    }

    showInfo() {
      p.fill(white[0], white[1], white[2], this.opaInfo);

      if (this.opaInfo + this.opaInc > 255) this.opaInfo = 255;
      else this.opaInfo += this.opaInc;

      //let pitch = this.pitch;
      //if (pitch > 11) pitch = pitch-12;

      p.push();
      p.translate(0,0,p.windowHeight/30);
      if (this.x <= p.windowWidth / 2) {
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(p.windowHeight / 40);
        p.textFont(fontMedium);
        if (session.activeTab.selectedTrack.name === "DRUMS") p.text(theory.drumLabels[this.pitch], this.x+gridStepSizeX, this.y-gridStepSizeX*1.4);
        else p.text(theory.noteLabels[this.pitch] + this.octave, this.x+gridStepSizeX, this.y-gridStepSizeX*1.4);
        p.textFont(fontLight);
        p.textSize(p.windowHeight / 65);
        if (this.duration === 1) p.text("STEP "+(this.start), this.x+gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        else p.text("STEP "+(this.start)+"-"+(this.start+this.duration), this.x+gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        //p.fill(this.color[0], this.color[1], this.color[2], this.opaInfo);
        //p.text(session.activeTab.tracks[this.trackId].name, this.x+gridStepSizeX, this.y-gridStepSizeX*1.4+p.windowHeight / 42);
      } else {
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(p.windowHeight / 40);
        p.textFont(fontMedium);
        if (session.activeTab.selectedTrack.name === "DRUMS") p.text(theory.drumLabels[this.pitch], this.x-gridStepSizeX, this.y-gridStepSizeX*1.4);
        else p.text(theory.noteLabels[this.pitch] + this.octave, this.x-gridStepSizeX, this.y-gridStepSizeX*1.4);
        p.textFont(fontLight);
        p.textSize(p.windowHeight / 65);
        if (this.duration === 1) p.text("STEP "+(this.start), this.x-gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        else p.text("STEP "+(this.start)+"-"+(this.start+this.duration), this.x-gridStepSizeX, this.y-gridStepSizeX*1.4-p.windowHeight / 50);
        //p.fill(this.color[0], this.color[1], this.color[2], this.opaInfo);
        //p.text(session.activeTab.tracks[this.trackId].name, this.x-gridStepSizeX, this.y-gridStepSizeX*1.4+p.windowHeight / 42);
      }
      p.pop();
    }
    /*triggerRelease() {
      if (session.loops[this.loopId].currentStep === this.start+this.duration) {
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[0].triggerRelease(theory.freqs[this.pitch]*p.pow(2,this.octave));
        session.loops[this.loopId].tracks[this.trackId].synth.oscillators[1].triggerRelease(theory.freqs[this.pitch]*p.pow(2,this.octave));
      }
    }*/

    drawCollapsedDrawer(targetX, targetY,hover,radius) {
      if (hover) p.fill(this.colorOrig[0],this.colorOrig[1],this.colorOrig[2],255);
      else p.fill(this.colorOrig[0],this.colorOrig[1],this.colorOrig[2],255/2);
      
      this.drawerAng += this.drawerAngInc;

      p.noStroke();
      p.push();
      p.translate(targetX,targetY,p.windowHeight/60);
      p.scale(radius/4 / petalModelSize);
      p.rotateX(this.drawerAng );
      p.rotateY(this.drawerAng );
      p.model(session.loops[this.loopId].tracks[this.trackId].petal);
      p.pop();
    }

    drawCollapsed(loop,track,angles,targetX, targetY) {
      /*if (loop.play && this.start <= loop.currentStep && this.start+this.duration >= loop.currentStep) {
        this.angInc = p.PI / 12;
     //this.animOpa = 255;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
        //if(this.start+this.duration > session.loops[this.loopId].currentStep) this.spawnParticles(targetX,targetY);
      }*/

      for ( let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].alive) {
          this.particles[i].move();
          p.push();
          p.translate(0,0,1);
          this.particles[i].show();
          p.pop();
        } else this.pool.push(this.particles.splice( i, 1 )[0]);  
      } 

      for (let i = 0; i < this.color.length; i++) {
        if (this.color[i] - 5 < this.colorOrig[i]) this.color[i] = this.colorOrig[i];
        else this.color[i] -= 5;
      }
      if (session.activeTab !== null) {
        if (session.activeTab.type === "loop" && this.loopId !== session.activeTab.id || session.activeTab.type === "struct") {
          if (this.angInc > p.PI / 200) this.angInc -= 0.005;
          if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
          else this.animOpa -= this.animOpaInc;
          if (this.animR < p.windowHeight/15) this.animR += this.animRInc;
          this.ang += this.angInc;
        }
      } else {
        if (this.angInc > p.PI / 200) this.angInc -= 0.005;
        if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
        else this.animOpa -= this.animOpaInc;
        if (this.animR < p.windowHeight/15) this.animR += this.animRInc;
        this.ang += this.angInc;
      }

      //while is playing, set bright and rotatation to max
      if (this.start <= loop.currentStep && this.start+this.duration >= loop.currentStep) {
        //if (session.activeTab !== null) {
        //  if (this.loopId !== loop.id) this.angInc = p.PI / 12;
        //else 
        this.angInc = p.PI / 12;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];

        if(this.start+this.duration > loop.currentStep) {
          if (session.loopDrawer) this.spawnParticles(
          track.particlesPreviewX[track.particlesPreviewX.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(this.ang/2)*p.windowHeight/50).x,
          track.particlesPreviewY[track.particlesPreviewY.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(p.PI/2-this.ang/2)*p.windowHeight/50).y);

          else if (session.structDrawer) this.spawnParticles(
          track.particlesPreviewX[track.particlesPreviewX.length-loop.currentStep-1],
          track.particlesPreviewY[track.particlesPreviewY.length-loop.currentStep-1]);
        }
      }

      p.fill(this.color[0],this.color[1],this.color[2],previewOpa);
      p.noStroke();
      p.push();
      p.translate(targetX,targetY,p.windowHeight/60);
      if (session.loopDrawer) p.scale(p.windowHeight/50 / petalModelSize);
      else p.scale(p.windowHeight/80 / petalModelSize);
      p.rotateX(this.ang);
      p.rotateY(this.ang);
      p.model(session.loops[this.loopId].tracks[this.trackId].petal);
      p.pop();

      p.push();
      p.noFill();
      p.translate(0,0,2);
      p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
      p.strokeWeight(this.size / 12);
      if (this.animOpa > 0) p.circle(targetX,targetY, this.animR, this.animR);
      p.pop();
    }

    drawCollapsedStructure(loop,angles,targetX, targetY) {
      if (loop.play && this.start <= loop.currentStep && this.start+this.duration >= loop.currentStep) {
        //if (session.activeTab !== null) {
         // if (this.loopId !== loop.id) this.angInc = p.PI / 12;
        //} else 
        this.angInc = p.PI / 12;        //this.animOpa = 255;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
        if(this.start+this.duration > loop.currentStep && session.structDrawer === false) {
          this.spawnParticles(loop.tracks[this.trackId].particlesStructX[loop.tracks[this.trackId].particlesPreviewX.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(this.ang/2)*p.windowHeight/70).x,
          loop.tracks[this.trackId].particlesStructY[loop.tracks[this.trackId].particlesPreviewY.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(p.PI/2-this.ang/2)*p.windowHeight/70).y);
        }
      }

      for ( let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].alive) {
          this.particles[i].move();
          p.push();
          p.translate(0,0,1);
          this.particles[i].show();
          p.pop();
        } else this.pool.push(this.particles.splice( i, 1 )[0]);  
      } 

      for (let i = 0; i < this.color.length; i++) {
        if (this.color[i] - 5 < this.colorOrig[i]) this.color[i] = this.colorOrig[i];
        else this.color[i] -= 5;
      }
      if (session.structDrawer === false) {
        if (this.loopId === loop.id)  {
          if (this.angInc > p.PI / 200) this.angInc -= 0.005;
          if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
          else this.animOpa -= this.animOpaInc;
          if (this.animR < p.windowHeight/15) this.animR += this.animRInc;
          this.ang += this.angInc;
        } 
      }

      //while is playing, set bright and rotatation to max
      /*if (this.start <= loop.currentStep && this.start+this.duration >= loop.currentStep) {
        if (session.activeTab !== null) {
          if (this.loopId !== loop.id) this.angInc = p.PI / 12;
        } else this.angInc = p.PI / 12;
        this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
        if(this.start+this.duration >loop.currentStep) this.spawnParticles(
          loop.tracks[this.trackId].particlesPreviewX[loop.tracks[this.trackId].particlesPreviewX.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(this.ang/2)*p.windowHeight/70).x,
          loop.tracks[this.trackId].particlesPreviewY[loop.tracks[this.trackId].particlesPreviewY.length-loop.currentStep-1]+p5.Vector.fromAngle(angles[nSteps-this.start+1], p.sin(p.PI/2-this.ang/2)*p.windowHeight/70).y);
      }*/

      p.fill(this.color[0],this.color[1],this.color[2],255);
      p.noStroke();
      p.push();
      p.translate(targetX,targetY,p.windowHeight/60);
      p.scale(p.windowHeight/75 / petalModelSize);
      p.rotateX(this.ang);
      p.rotateY(this.ang);
      p.model(loop.tracks[this.trackId].petal);
      p.pop();

      p.push();
      p.noFill();
      p.translate(0,0,2);
      p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
      p.strokeWeight(this.size / 12);
      if (this.animOpa > 0) p.circle(targetX,targetY, this.animR, this.animR);
      p.pop();
    }

    draw(targetX, targetY) {

      //release
      /*if (session.loops[this.loopId].tracks[this.trackId].name !== "DRUMS") {
        //console.log(this.loopId,this.trackId);
        this.triggerRelease();
      }*/

      for (let i = 0; i < this.color.length; i++) {
        if (this.color[i] - 5 < this.colorOrig[i]) this.color[i] = this.colorOrig[i];
        else this.color[i] -= 5;
      }

      this.size = p.windowHeight / 60;
      let initialX = this.start;
      let initialY = this.pitch;

      if (p.mouseX > targetX - gridStepSizeX/2 && p.mouseX < targetX + gridStepSizeX*(this.duration-1) + gridStepSizeX/2 
        && p.mouseY > targetY - gridStepSizeX/2 && p.mouseY < targetY + gridStepSizeX/2
        && session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId] && session.activeTab.view === 0 && dragging === false && menuOpened === false && session.loopDrawer === false && session.structDrawer  === false) {
          document.body.style.cursor = 'grab';
          
          if (this.hover === false) {
            this.opaInfo = 0;
            this.angInc = p.PI / 12;
            this.offsetDrag = 1;
          }

          this.hover = true;

          if (p.mouseIsPressed && this.dragging === false) {
            if (this.selected === false) session.loops[this.loopId].tracks[this.trackId].deselectAllNotes();
            initialX = this.start;
            initialY = this.pitch;
            
            this.selected = true;
            this.dragging = true;
            dragging = true;
            
            this.playShort();
          }
          
      } else this.hover = false;

      if (p.mouseIsPressed === false && this.dragging === true) {
        this.dragging = false;
        dragging = false;
        this.hover = true;
        for (let n in session.loops[this.loopId].tracks[this.trackId].notes) {
          if (session.loops[this.loopId].tracks[this.trackId].notes[n].selected) {
            //console.log("ai");
            session.loops[this.loopId].tracks[this.trackId].ajustNotes(session.loops[this.loopId].tracks[this.trackId].notes[n]);
          }
        }

        //session.save();
      }

      if (this.dragging) {
        const auxX = p.round((p.mouseX - gridInitX) / gridStepSizeX);
        let auxY = 0;
        
        if (session.loops[this.loopId].tracks[this.trackId].name === "DRUMS") auxY = session.loops[this.loopId].tracks[this.trackId].nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(session.loops[this.loopId].tracks[this.trackId].nPitches-1)))-1;
        else auxY = session.loops[this.loopId].tracks[this.trackId].nPitches-p.round((p.mouseY - gridInitY) / ((gridStepSizeY*11)/(session.loops[this.loopId].tracks[this.trackId].nPitches-1)))-1;
        //console.log(auxX,auxY);

        //console.log(session.loops[this.loopId].tracks[this.trackId].nPitches,this.start,this.pitch,auxX,auxY);
        if (auxX >= 0 && auxX < nSteps && auxY >= 0 && auxY < session.loops[this.loopId].tracks[this.trackId].nPitches) {

          let blockMove = false;

          for (let n in session.loops[this.loopId].tracks[this.trackId].notes) {
            let note = session.loops[this.loopId].tracks[this.trackId].notes[n];
            
            if (note.selected === false) continue;
            
            //negative -> left
            if (note.start + auxX - initialX < 0) blockMove = true;

            //positive -> right
            if (note.start + auxX - initialX + note.duration > nSteps) blockMove = true;

            //negative -> bottom, positive -> top
            if (note.octave === session.loops[this.loopId].tracks[this.trackId].octaveScroll.value) {
              if (note.pitch + auxY - initialY < 0) blockMove = true;
              if (session.loops[this.loopId].tracks[this.trackId].name === "DRUMS" && note.pitch + auxY - initialY >= session.loops[this.loopId].tracks[this.trackId].nPitches) blockMove = true;
            } else {
              let aux = initialY;
              if (p.abs(auxY-aux) > 10) aux = aux+12;
              if (note.pitch + auxY - aux > 11) blockMove = true;  
            }
          }

          if (blockMove === false) {
            for (let n in session.loops[this.loopId].tracks[this.trackId].notes) {
              let note = session.loops[this.loopId].tracks[this.trackId].notes[n];
              let prevPitch = note.pitch;
              if (note.selected) {

                //console.log(auxY, initialY);
                
                note.start = note.start + (auxX - initialX);

                if (this.octave === session.loops[this.loopId].tracks[this.trackId].octaveScroll.value) {
                  if (this.octave === note.octave) {
                    if (note.pitch + (auxY - initialY) > 11) {
                      note.pitch = 0; 
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value+1;
                    }
                    else note.pitch = note.pitch + (auxY - initialY);
                  } else {
                    if (note.pitch + (auxY - initialY) < 0) {
                      note.pitch = 11; 
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value;
                    }
                    else note.pitch = note.pitch + (auxY - initialY);
                  }


                } else {
                  if (p.abs(auxY-initialY) > 10) initialY = initialY+12;

                  if (this.octave === note.octave) {

                    if (note.pitch + (auxY - initialY) < 0) {
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value;
                      note.pitch = 11;
                    }
                    else note.pitch = note.pitch + (auxY - initialY);
                  
                  } else {

                    if (note.pitch + (auxY - initialY) > 11) {
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value+1;
                      note.pitch = 0; 
                    }
                    else note.pitch = note.pitch + (auxY - initialY);
                  }

                  //if (auxY-initialY > 11) initialY = initialY+12;
                  //else if (auxY-initialY < 0) initialY = initialY-12;

                  /*if (this.octave === note.octave) {
                    if (note.pitch + (auxY - initialY) < 0) {
                      console.log("case 1");
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value;
                      note.pitch = 11;
                    }
                    else {
                      console.log("case 2");
                      note.pitch = note.pitch + (auxY - initialY);
                    }
                  } else {
                    if (note.pitch + (auxY - initialY) > 11) {
                      console.log("case 3");
                      note.octave = session.loops[this.loopId].tracks[this.trackId].octaveScroll.value+1;
                      note.pitch = 0; 
                    }
                    else {
                      console.log("case 4");
                      note.pitch = note.pitch + (auxY - initialY);
                    }
                  }*/
                }

                if (note === this && prevPitch !== note.pitch) this.playShort();
              }

              //if (note.selected && note === this) {

              //}
            }
          }
        }
        this.showInfo();
        document.body.style.cursor = 'grabbing';
      }

      if (this.hover) this.showInfo();

      if (session.activeTab.selectedTrack !== session.activeTab.tracks[this.trackId]) {
        if (this.opa - this.opaInc < 255/2) this.opa = 255/2;
        else this.opa -= this.opaInc;
      } else {
        if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
        else this.opa += this.opaInc;
      }

      if (this.angInc > p.PI / 200) this.angInc -= 0.005;

      if (this.animOpa - this.animOpaInc < 0) this.animOpa = 0;
      else this.animOpa -= this.animOpaInc;

      if (this.animR < p.windowHeight/15) this.animR += this.animRInc;

      //REVER ISTO
      if (session.activeTab.selectedTrack === null) targetY = targetY + p.sin(this.ang/2) * this.offset;
      this.ang += this.angInc;

      if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      else this.opa += this.opaInc;

      let a = p.createVector(0, -1).angleBetween(p.createVector(this.x - targetX, this.y - targetY));
      let d = p.dist(this.x, this.y, targetX, targetY);

      this.x -= p5.Vector.fromAngle(a, d / 15).y;
      this.y -= p5.Vector.fromAngle(p.PI - a, d / 15).x;

      //p.circle(this.x, this.y, this.size, this.size);
      //if (session.loops[this.loopId].tracks[this.trackId].notes.includes(this) === false) console.log("ai", this.octave);

      if (session.activeTab.selectedTrack === null || session.activeTab.selectedTrack !== null && session.activeTab.view === 0 && (session.activeTab.selectedTrack.octaveScroll.value === this.octave || session.activeTab.selectedTrack.octaveScroll.value+1 === this.octave) && session.activeTab.selectedTrack.id === this.trackId) {
        for ( let i = 0; i < this.particles.length; i++) {
          if (this.particles[i].alive) {
            this.particles[i].move();
            p.push();
            p.translate(0,0,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+2));
            this.particles[i].show();
            p.pop();
          } else this.pool.push(this.particles.splice( i, 1 )[0]);  
        }

        p.fill(this.color[0], this.color[1], this.color[2], this.opa);

        //while is playing, set bright and rotatation to max
        if (session.activeTab.play && this.start <= session.activeTab.currentStep && this.start+this.duration >= session.activeTab.currentStep) {
          this.angInc = p.PI / 12;
          //this.animOpa = 255;
          this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
          if(this.start+this.duration > session.activeTab.currentStep) this.spawnParticles(gridInitX+session.activeTab.currentStep*gridStepSizeX,this.y);
        }
        p.noStroke();

        //selected
        if (this.selected) {
          this.color = [this.colorOrig[0]+100,this.colorOrig[1]+100,this.colorOrig[2]+100];
          if (this.animOpa === 0) {
            this.animOpa = 255;
            this.animR = this.size;
          }
        } 
        
        p.push();
        if (session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId]) p.translate(this.x,this.y,-p.windowHeight/60);
        else p.translate(this.x,this.y,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+2));
        p.scale(p.windowHeight/60 / petalModelSize);
        p.rotateX(this.ang);
        p.rotateY(this.ang);
        p.model(session.activeTab.tracks[this.trackId].petal);
        p.pop();

        if (session.activeTab.selectedTrack !== null && session.activeTab.view === 0) {
          p.noFill();
          p.stroke(this.color[0], this.color[1], this.color[2], this.opa);
          p.strokeWeight(p.windowHeight/120);
          p.beginShape();
          for (let i = 0; i < this.duration+1; i++) {
            //p.stroke(this.color[0], this.color[1], this.color[2], (this.opa / this.duration)*(this.duration-i-1));
            p.stroke(this.color[0], this.color[1], this.color[2], 100);
            p.vertex(this.x+i*gridStepSizeX, this.y);
          }
          p.endShape();

          //p.noStroke();
          /*p.stroke(this.color[0], this.color[1], this.color[2], 100);

          p.push();
          p.translate(this.x+(this.duration)*gridStepSizeX,this.y,-p.windowHeight/60*(session.activeTab.tracks[this.trackId].id+1));
          p.scale(p.windowHeight/60 / petalModelSize);
          //p.rotateX(this.ang+p.PI);
          //p.rotateY(this.ang+p.PI);
          p.rotateX(this.ang);
          p.rotateY(this.ang);
          p.model(session.activeTab.tracks[this.trackId].petal);
          p.pop();*/
        }

          /*p.push();
          if (session.activeTab.selectedTrack === session.activeTab.tracks[this.trackId]) p.translate(this.x+this.duration*gridStepSize,this.y,p.windowHeight/60);
          else p.translate(this.x+this.duration*gridStepSizeX,this.y,-p.windowHeight/60 * (session.activeTab.tracks[this.trackId].id+1));
          p.scale(p.windowHeight/60 / petalModelSize);
          p.rotateX(this.ang);
          p.rotateY(this.ang);
          p.model(session.activeTab.tracks[this.trackId].petal);
          p.pop();*/
        
          p.noFill();
          p.stroke(this.color[0], this.color[1], this.color[2], this.animOpa);
          p.strokeWeight(this.size / 12);
          if (this.animOpa > 0) p.circle(this.x, this.y, this.animR, this.animR);
      }
    }
  }

  class Menu {

    constructor(tabId,trackId,label,options,mode) {
      this.tabId = tabId;
      this.trackId = trackId;

      this.label = label;
      this.mode = mode;

      this.trackHover = -1; //for generation selecting preview

      this.state = -1; //-1: ckosed, 0: opened, 1: opened and option selected, 2: ai generated selection, 3: confirm delete, 4:basic pitch, 5: about

      this.options = options;
      this.nOptions = options.length;

      this.lastInstant = 0;
      this.interval = 50;

      this.dark = 0;
      this.darkMax = 200;
      this.darkInc = 10;

      this.offsetValue = p.windowHeight / 25;
      this.offsetInc = p.windowHeight / 200;
      this.opaInc = 15;
      this.opaMax = 255;

      this.optionW = this.getWidestOption();
      this.optionH = p.windowHeight / 30;

      this.lastOption = "";

      this.optionsCheck = [];
      this.optionsOpa = [];
      this.optionsOffset = [];

      this.menuOpa = 0;

      //for generated tracks
      //this.octaveScroll = new Scrollable("OCTAVE",3,0,theory.octaves.length-1,"",1,1);
      this.soloButton = new Button("SOLO",false,white);

      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck.push(false);
        this.optionsOpa.push(0);
        this.optionsOffset.push(this.offsetValue);
      }
    }

    getWidestOption() {
      let widest = 0;
      p.textSize(p.windowHeight / 45);
      for (let i = 0; i < this.nOptions; i++) {
        if (p.textWidth(this.options[i]) > widest) widest = p.textWidth(this.options[i]);
      }
      return widest;
    }

    close() {
      menuOpened = false;
      this.state = -1;
    }

    open() {
      for (let i = 0; i < this.nOptions; i++) {
        this.optionsCheck[i] = false;
        this.optionsOpa[i] = 0;
        this.optionsOffset[i] = this.offsetValue;
      }

      menuOpened = true;
      this.state = 0;
    }

    drawOptions(x,y) {

      p.textSize(p.windowHeight / 45);
      p.textAlign(p.LEFT, p.TOP);
      p.noStroke();

      for (let i = 0; i < this.nOptions; i++) {
        if (this.optionsCheck[i]) {

          if (this.options[i] === "DELETE" || this.options[i] === "DELETE SECTION" || this.options[i] === "CLEAR SESSION") p.fill(225, 0, 0, this.optionsOpa[i]);
          else p.fill(white[0], white[1], white[2], this.optionsOpa[i]);
          p.textFont(fontLight);

          if (this.optionsOffset[i] - this.offsetInc < 0) this.optionsOffset[i] = 0;
          else this.optionsOffset[i] -= this.offsetInc;
          if (this.optionsOpa[i] + this.opaInc > this.opaMax) this.optionsOpa[i] = this.opaMax;
          else this.optionsOpa[i] += this.opaInc;

          //drop down menu
          if (this.mode === "DROPDOWN") {
            //Remove after dev
            if (this.options[i] === "RENAME") this.optionsOpa[i] = 50;

            if (p.mouseX > x && p.mouseX < x + this.optionW && p.mouseY > y  + this.optionH*2 + i * this.optionH && p.mouseY < y  +this.optionH*2 + i * this.optionH + this.optionH) {
              //Remove after dev
              if (this.options[i] === "RENAME") document.body.style.cursor = 'not-allowed';
              else document.body.style.cursor = 'pointer';

              for (let j = 0; j < this.nOptions; j++) if (j !== i) this.optionsOpa[j] = 50;

              if (p.mouseIsPressed) {
                //session.activeTab.addTrack(this.options[i]);
                if (this.label === "loopMenu" || this.label === "structMenu") {
                  switch (this.options[i]) {
                    case "RENAME":
                      this.optionsOpa[i] = 50;
                      //not developed yet
                      break;
                    case "DUPLICATE":
                      if (this.label === "loopMenu") session.duplicateLoop(this.tabId);
                      else if (this.label === "structMenu") session.duplicateStruct(this.tabId);
                      this.close();
                      break;
                    case "EXPORT":
                      if (this.label === "loopMenu") {
                        synths.exportLoopAudio(p,session.loops[this.tabId], setLoading);
                        setLoading(true);
                      }
                      else if (this.label === "structMenu") {
                        if (session.activeTab.sequence.length > 0) {
                          if (session.activeTab.play) {
                            session.activeTab.play = false;
                            session.activeTab.sequence[session.activeTab.currentLoop].play = false;
                           }
                          synths.exportStructAudio(p,session.structs[this.tabId], setLoading);
                          setLoading(true);
                        }
                      }
                     
                      session.activeTab.play = false;
                      Tone.Transport.stop();
                      Tone.Transport.seconds = 0;
                      synths.releaseAll();
                      this.close();
                      break;
                    case "STRUCT FROM":
                      if (session.structs.length < maxStructs) {
                        let name = "myStruct"+session.structs.length;
                        name = session.generateNameStruct(name);
                        let newStruct = new Structure(session.structs.length,name);
                        newStruct.createFromLoop(session.loops[this.tabId]);
                        session.structs.push(newStruct);
                        session.manageTabs(session.structs[session.structs.length-1]);
                      }
                      this.close();
                      break;
                    case "CLOSE TAB":
                      if (this.label === "loopMenu") session.closeTab("loop",this.tabId);
                      else if (this.label === "structMenu") session.closeTab("struct",this.tabId);
                      this.close();
                      break;
                    case "DELETE":
                      this.state = 3;
                      this.menuOpa = 0;
                      break;
                  }
                } else if (this.label === "sectionMenu") {
                  switch (this.options[i]) {
                    case "EDIT LOOP":
                      session.manageTabs(session.loops[session.structs[this.tabId].sequence[this.trackId].id]);
                      session.loops[session.structs[this.tabId].sequence[this.trackId].id].blackoutOpa = 255;
                      this.close();
                      break;
                    case "DELETE SECTION":
                      this.state = 3;
                      this.menuOpa = 0;
                      break;
                  }
                } else if (this.label === "sessionMenu") {
                  switch (this.options[i]) {
                    case "ABOUT":
                      this.state = 5;
                      this.menuOpa = 0;
                      break;
                    case "CLEAR SESSION":
                      this.state = 3;
                      this.menuOpa = 0;
                      break;
                  }
                }
                p.mouseIsPressed = false;
              }
            } 

            p.text(this.options[i], x, y +this.optionH*2 + i * this.optionH - this.optionsOffset[i]);
          
          //drop up menu
          } else {
            //check if the option is the same as an existing track
            let notAllowed = false;
            
            if (this.label === "plusMenu") {
              for (let j = 0; j < session.loops[this.tabId].tracks.length; j++) {
                if (this.options[i] === session.loops[this.tabId].tracks[j].name) notAllowed = true;
              }
            } else if (this.label === "trackMenu") {
              if (this.options[i] === "RENAME") notAllowed = true;
            }

            if (notAllowed) this.optionsOpa[i] = 50;

            if (p.mouseX > x && p.mouseX < x + this.optionW && p.mouseY > y  -this.optionH*2 - i * this.optionH && p.mouseY < y  -this.optionH*2 - i * this.optionH + this.optionH) {
              
              if (notAllowed) document.body.style.cursor = 'not-allowed';
              else document.body.style.cursor = 'pointer';

              for (let j = 0; j < this.nOptions; j++) if (j !== i) this.optionsOpa[j] = 50;

              if (p.mouseIsPressed) {
                //session.activeTab.addTrack(this.options[i]);
                //this.reset();
                if (notAllowed === false) {
                  if (this.label === "plusMenu") {
                    this.lastOption = this.options[i];
                    this.menuOpa = 0;
                    this.state = 1;
                  } else if (this.label === "trackMenu") {
                    switch (this.options[i]) {
                      case "DELETE":
                        this.state = 3;
                        this.menuOpa = 0;
                        break;
                    }
                  }
                }
                p.mouseIsPressed = false;
              }
            } 

            p.text(this.options[i], x, y -this.optionH*2 - i * this.optionH + this.optionsOffset[i]);
          }
        }
      }
    }

    drawModeOptions() {
      let icons = [];
      let labels = [];

      if (this.menuOpa + this.opaInc > 255) this.menuOpa = 255;
      else this.menuOpa += this.opaInc;

      if (this.label === "plusMenu") { 

          if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack = null;
          if (session.activeTab.view !== 0) session.activeTab.view = 0;
          if (session.activeTab.play) {
            session.activeTab.play = false;
            Tone.Transport.stop();
            Tone.Transport.seconds = 0;
          }

          if (this.lastOption === "MELODY") {
            icons = [scratch,ai,sing];
            labels = ["FROM SCRATCH","AI SUGGESTION","HUM/SING"];
          } else {
            icons = [scratch,ai];
            labels = ["FROM SCRATCH","AI SUGGESTION"];
          }

          p.textAlign(p.CENTER, p.TOP);
          p.textFont(fontLight);

          p.textSize(p.windowHeight / 50);
          if (p.mouseX > p.windowWidth/2-p.textWidth("CANCEL")/2 && p.mouseX < p.windowWidth/2+p.textWidth("CANCEL")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/8*2 && p.mouseY < p.windowHeight/2 + p.windowHeight/8*2 + p.windowHeight / 50) {
             p.fill(white[0], white[1], white[2], this.menuOpa);
             document.body.style.cursor = 'pointer';
          } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
          p.text("CANCEL", p.windowWidth/2, p.windowHeight/2 + p.windowHeight/8*2);

          p.textSize(p.windowHeight / 40);

          let textWidth = p.textWidth("NEW  ")/2+p.textWidth("  TRACK")/2+p.textWidth(this.lastOption);

          p.fill(white[0], white[1], white[2], this.menuOpa);
          p.text("NEW ", p.windowWidth/2-textWidth/2, p.windowHeight/2 - p.windowHeight/8*2.5);
          p.text(" TRACK",  p.windowWidth/2-textWidth/2+p.textWidth("NEW ")/2+p.textWidth(this.lastOption)+p.textWidth(" TRACK")/2, p.windowHeight/2 - p.windowHeight/8*2.5);
          
          let c = [0,0,0];
          if (this.lastOption === "MELODY") c = colors[3];
          else if (this.lastOption === "DRUMS") c = colors[1];
          else if (this.lastOption === "BASS") c = colors[0];
          else if (this.lastOption === "HARMONY") c = colors[2];
          
          p.fill(c[0],c[1],c[2], this.menuOpa);
          p.text(this.lastOption, p.windowWidth/2-textWidth/2+p.textWidth("NEW ")/2+p.textWidth(this.lastOption)/2, p.windowHeight/2 - p.windowHeight/8*2.5);

          let totalWidth = (icons.length-1)*(p.windowHeight/6*2);

          for (let i = 0; i < icons.length; i++) {
            let width = p.windowWidth/2 - totalWidth/2 + i*p.windowHeight/6*2;


            if (p.mouseX > width-p.windowHeight/7 && p.mouseX < width + p.windowHeight/7 && p.mouseY > p.windowHeight/2 - this.optionH*2 - p.windowHeight/7 && p.mouseY < p.windowHeight/2 - this.optionH*2 + p.windowHeight/7) {
              document.body.style.cursor = 'pointer';
              p.fill(white[0], white[1], white[2], this.menuOpa);
              p.tint(255, this.menuOpa);

              if (p.mouseIsPressed) {
                if (i === 0) {
                  session.activeTab.addTrack(this.lastOption);
                  this.close();
                } else if (i === 1) {
                  this.state = 2;
                  session.createTracksWithGeneratedNotes(session.activeTab.id,this.lastOption);
                  
                  //prevent to play imeadiatly
                  p.mouseX = p.windowWidth / 2;
                  p.mouseY = 0;

                  this.menuOpa = 0;
                } else {
                  synths.mic.open();
                  session.loops[this.tabId].recordVisual.fill(0);
                  this.state = 4;
                  this.menuOpa = 0;
                }

                p.mouseIsPressed = false;
              }

            } else {
              p.fill(white[0], white[1], white[2], this.menuOpa/3);
              p.tint(255, this.menuOpa/4);
            }
            if (i === 0) p.image(icons[i],  width, p.windowHeight/2 - this.optionH*2, p.windowHeight/8, p.windowHeight/8);
            else p.image(icons[i], width, p.windowHeight/2 - this.optionH*2, p.windowHeight/7, p.windowHeight/7);
            p.text(labels[i], width, p.windowHeight/2 - this.optionH*2 + p.windowHeight/8);
          }
      }
    }

    drawSelection() {
      let gap = p.windowWidth/150;
      let x = gridStepSizeX*nSteps-gap;
      let y = gridStepSizeY*11-gap;


      if (p.mouseX > gridInitX && p.mouseX < p.windowWidth - gridInitX && p.mouseY > gridInitY+gridInitY/2.6 && p.mouseY < gridInitY+gridInitY/2.6 + gridStepSizeY*11) {
        document.body.style.cursor = 'pointer';

        let prevHover = this.trackHover;

        if (this.trackHover === -1) {
          session.activeTab.currentStep = -1;
          session.activeTab.play = true;
          Tone.Transport.start();
        }

        if (p.mouseX < p.windowWidth/2) {
          if (p.mouseY < gridInitY+gridInitY/2.6 + gridStepSizeY*11/2) this.trackHover = 0; //top left: 0
          else this.trackHover = 2; //bottom left: 2 
        } else {
          if (p.mouseY < gridInitY+gridInitY/2.6 + gridStepSizeY*11/2) this.trackHover = 1; //top right: 1
          else this.trackHover = 3; //bottom right: 3
        }

        if (prevHover !== this.trackHover) {
          synths.releaseAll();
          session.activeTab.currentStep = -1;
        }
        
        if (p.mouseIsPressed) {
          session.activeTab.tracks.push(generatedTracks[this.trackHover]);
          generatedTracks = [];
          synths.setGeneratedTracks([]);
          synths.releaseAll();
          this.close();
          p.mouseIsPressed = false;
        }
      } else {
        if (session.activeTab.play) {
          session.activeTab.play = false;
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
        }
        this.trackHover = -1;
      }

      p.noFill();

      p.push();
      p.translate(0,0,p.windowHeight/60);
      if (this.trackHover === 0) p.stroke(white[0], white[1], white[2],this.menuOpa/2);
      else p.stroke(white[0], white[1], white[2],this.menuOpa/4);
      p.rect(gridInitX,gridInitY+gridInitY/2.6,x/2,y/2,p.windowHeight/200);
      if (this.trackHover === 1) p.stroke(white[0], white[1], white[2],this.menuOpa/2);
      else p.stroke(white[0], white[1], white[2],this.menuOpa/4);
      p.rect(gridInitX+x/2+gap,gridInitY+gridInitY/2.6,x/2,y/2,p.windowHeight/200);
      if (this.trackHover === 2) p.stroke(white[0], white[1], white[2],this.menuOpa/2);
      else p.stroke(white[0], white[1], white[2],this.menuOpa/4);
      p.rect(gridInitX,gridInitY+y/2+gap+gridInitY/2.6,x/2,y/2,p.windowHeight/200);
      if (this.trackHover === 3) p.stroke(white[0], white[1], white[2],this.menuOpa/2);
      else p.stroke(white[0], white[1], white[2],this.menuOpa/4);
      p.rect(gridInitX+x/2+gap,gridInitY+y/2+gap+gridInitY/2.6,x/2,y/2,p.windowHeight/200); 
      p.pop();

      //draw generated tracks
      if (generatedTracks.length === 4) {
        p.push();
        p.translate(0,0,p.windowHeight/60);
        generatedTracks[0].drawInGenMenu(gridInitX,gridInitY+gridInitY/2.6,x/2,y/2);
        generatedTracks[1].drawInGenMenu(gridInitX+x/2+gap,gridInitY+gridInitY/2.6,x/2,y/2);
        generatedTracks[2].drawInGenMenu(gridInitX,gridInitY+y/2+gap+gridInitY/2.6,x/2,y/2);
        generatedTracks[3].drawInGenMenu(gridInitX+x/2+gap,gridInitY+y/2+gap+gridInitY/2.6,x/2,y/2);
        p.pop();
      }

      //draw cursor 
      if (session.activeTab.currentStep !== -1) {
        p.strokeWeight(1);
        p.stroke(white[0], white[1], white[2],this.menuOpa/1);
        p.push();
        p.translate(0,0,p.windowHeight/60);
        if (this.trackHover === 0) p.line(gridInitX+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+gridInitY/2.6,gridInitX+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+gridInitY/2.6+y/2);
        else if (this.trackHover === 1) p.line(gridInitX+x/2+gap+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+gridInitY/2.6,gridInitX+x/2+gap+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+gridInitY/2.6+y/2);
        else if (this.trackHover === 2) p.line(gridInitX+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+y/2+gap+gridInitY/2.6,gridInitX+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+y/2+gap+gridInitY/2.6+y/2);
        else if (this.trackHover === 3) p.line(gridInitX+x/2+gap+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+y/2+gap+gridInitY/2.6,gridInitX+x/2+gap+((x/2)/nSteps)*session.activeTab.currentStep,gridInitY+y/2+gap+gridInitY/2.6+y/2);
        p.pop();
      }

      p.textAlign(p.CENTER, p.TOP);
      p.textSize(p.windowHeight / 60);
      p.noStroke();
      p.fill(white[0], white[1], white[2], this.menuOpa/2);
      p.text("Select one of the generated parts or regenerate them", p.windowWidth/2, gridInitY/1.05);

      let auxY = p.windowHeight-gridInitY/1.25;
      let auxX = (p.windowWidth - gridInitX*2 - p.windowWidth/150*7)/8/2;

      p.textSize(p.windowHeight / 65);
      p.textAlign(p.CENTER, p.BOTTOM);
      if (session.loops[this.tabId].click.state) p.fill(white[0], white[1], white[2]);
      else p.fill(white[0], white[1], white[2], 255/2);
      p.text("SOLO",gridInitX + auxX*5+p.windowWidth/150*2,auxY+p.windowHeight / 40);

      p.push();
      p.translate(0,0,p.windowHeight/60);
      session.loops[this.tabId].tempoScroll.draw(gridInitX + auxX,auxY);
      this.soloButton.draw(gridInitX + auxX*5+p.windowWidth/150*2,auxY-p.windowHeight / 120);
      if (generatedTracks.length > 0) generatedTracks[0].octaveScroll.draw(gridInitX + auxX*3+p.windowWidth/50,auxY);
      p.pop();

      if (generatedTracks.length > 0) {
        if (generatedTracks[0].octaveScroll.value !== generatedTracks[1].octaveScroll.value) {
          for (let i = 0; i < generatedTracks.length; i++) {
            for (let n in generatedTracks[i].notes) generatedTracks[i].notes[n].octave = generatedTracks[0].octaveScroll.value;
            generatedTracks[i].octaveScroll.value = generatedTracks[0].octaveScroll.value;
          }
          synths.releaseAll();
        }
      }

      p.textAlign(p.RIGHT, p.CENTER);
        
      p.textSize(p.windowHeight / 50);
      
      if (p.mouseX > p.windowWidth - gridInitX*6.6-p.textWidth("CANCEL") && p.mouseX < p.windowWidth - gridInitX*6.6 && p.mouseY > auxY-p.windowHeight / 50 /1.5 && p.mouseY < auxY + p.windowHeight / 50 /1.5) {
        if (session.loops[this.tabId].play) {
          document.body.style.cursor = 'not-allowed';
          p.fill(white[0], white[1], white[2], this.menuOpa/2);
        } else {
          document.body.style.cursor = 'pointer';
          p.fill(white[0], white[1], white[2], this.menuOpa);

          if (p.mouseIsPressed) {
            this.close();
            p.mouseIsPressed = false;
          }
        }

      } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
      
      p.text("CANCEL", p.windowWidth - gridInitX*6.6, auxY);

      p.textSize(p.windowHeight / 40);
      p.textFont(fontMedium);

      if (p.mouseX > p.windowWidth - gridInitX*1.7-p.textWidth("REGENERATE") && p.mouseX < p.windowWidth - gridInitX*1.7 && p.mouseY > auxY-p.windowHeight / 40 /1.5 && p.mouseY < auxY + p.windowHeight / 40 /1.5) {
        
        document.body.style.cursor = 'pointer';

        let c = 0;
        
        switch (this.lastOption) {
          case "BASS":
            c = 0;
            break;
          case "DRUMS":
            c = 1;
            break;
          case "HARMONY":
            c = 2;
            break;
          case "MELODY":
            c = 3;
            break;
        }

        p.fill(colors[c][0], colors[c][1], colors[c][2], this.menuOpa);

        if (p.mouseIsPressed) {
          session.createTracksWithGeneratedNotes(session.activeTab.id,this.lastOption);
          p.mouseIsPressed = false;
        }
        
      } else p.fill(white[0], white[1], white[2], this.menuOpa/3);


      p.text("REGENERATE", p.windowWidth - gridInitX*1.7, auxY);  
    }

    confirmDelete() {
      if (session.activeTab !== null) {
        if (session.activeTab.selectedTrack !== null) session.activeTab.selectedTrack = null;
        if (session.activeTab.view !== 0) session.activeTab.view = 0;
        if (session.activeTab.play) {
          session.activeTab.play = false;
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
        }
      }

      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(fontLight);
      p.textSize(p.windowHeight / 40);
      p.fill(white[0], white[1], white[2], this.menuOpa);

      if(this.label === "loopMenu") {
        p.text('Are you sure you want to delete "'+session.loops[this.tabId].name+'"?', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      } else if (this.label === "structMenu") {
        p.text('Are you sure you want to delete "'+session.structs[this.tabId].name+'"?', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      } else if (this.label === "sectionMenu") {
        p.text('Are you sure you want to delete "'+session.structs[this.tabId].sequence[this.trackId].name+'" from "'+session.structs[this.tabId].name+'"?\n"'+session.structs[this.tabId].sequence[this.trackId].name+'" will not be deleted from the Loops Drawer.', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      } else if (this.label === "trackMenu") {
        p.text('Are you sure you want to delete "'+session.loops[this.tabId].tracks[this.trackId].name+'" from "'+session.loops[this.tabId].name+'"?', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      } else if (this.label = "sessionMenu") {
        p.text('Are you sure you want to clear the Session?', p.windowWidth/2, p.windowHeight/2 - p.windowHeight/20);
      }

      p.textSize(p.windowHeight / 50);
      if (p.mouseX > p.windowWidth/2-p.windowHeight/10-p.textWidth("CANCEL")/2 && p.mouseX < p.windowWidth/2-p.windowHeight/10+p.textWidth("CANCEL")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/20-p.windowHeight / 50 /2 && p.mouseY < p.windowHeight/2 + p.windowHeight/20 + p.windowHeight / 50 /2) {
        document.body.style.cursor = 'pointer';
        p.fill(white[0], white[1], white[2], this.menuOpa);
      } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
      p.text("CANCEL", p.windowWidth/2-p.windowHeight/10, p.windowHeight/2 + p.windowHeight/20);
     
      p.textSize(p.windowHeight / 40);
      if (p.mouseX > p.windowWidth/2+p.windowHeight/10-p.textWidth("DELETE")/2 && p.mouseX < p.windowWidth/2+p.windowHeight/10+p.textWidth("DELETE")/2 && p.mouseY > p.windowHeight/2 + p.windowHeight/20-p.windowHeight / 40 /2 && p.mouseY < p.windowHeight/2 + p.windowHeight/20 + p.windowHeight / 40 /2) {
        document.body.style.cursor = 'pointer';
        p.fill(225,0,0, this.menuOpa);
        if (p.mouseIsPressed) {
          if (this.label === "loopMenu") session.deleteLoop(this.tabId);
          else if (this.label === "structMenu") session.deleteStruct(this.tabId);
          else if (this.label === "sectionMenu") session.structs[this.tabId].deleteSection(this.trackId);
          else if (this.label === "trackMenu") session.loops[this.tabId].deleteTrack(this.trackId);
          else if (this.label === "sessionMenu") {
            session = new Session();
            synths.setSession(session, saving);
            synths.setGeneratedTracks(generatedTracks);
          }
          this.close();
          p.mouseIsPressed = false;
        }
      } else p.fill(225,0,0, this.menuOpa/2);
      p.text("DELETE", p.windowWidth/2+p.windowHeight/10, p.windowHeight/2 + p.windowHeight/20);
    }

    recordingMenu() {

      if (checkMicPermition === false) navigator.permissions.query({ name: 'microphone' }).then(function(result) { checkMicPermition = result.state === 'granted';});

      if (checkMicPermition) {
        if (synths.micMeter.getValue() < micLevelTune && synths.micMeter.getValue() !== -Infinity) {
          micLevelTune = synths.micMeter.getValue();
          //console.log(micLevelTune);
        }
        //console.log(session.loops[this.tabId].recordVisual);

        if (session.loops[this.tabId].currentStep >= 0 && session.loops[this.tabId].play) {
          if (synths.recorder.state === "stopped") {
            session.activeTab.recordVisual.fill(0);
            synths.recorder.start();
          }
          session.loops[this.tabId].recordVisual[session.loops[this.tabId].currentStep] = p.abs(micLevelTune) - p.abs(synths.micMeter.getValue());
          //console.log(session.loops[this.tabId].recordVisual);
        }

        if (session.loops[this.tabId].currentStep >= nSteps-1 && session.loops[this.tabId].play) {
          session.loops[this.tabId].play = false;
          Tone.Transport.stop();
          Tone.Transport.seconds = 0;
          synths.releaseAll();
          session.resolveRecording();
        }

        for (let i = 0; i < session.loops[this.tabId].recordVisual.length; i++) {
          if (i < session.loops[this.tabId].currentStep && session.loops[this.tabId].play || synths.recorder.state === "stopped") {
            let mapping = p.map(session.loops[this.tabId].recordVisual[i], 0, p.abs(micLevelTune), gridStepSizeX/8, gridStepSizeY*3);
            if (session.loops[this.tabId].recordVisual[i] === 0) mapping = 0;
            if (synths.recorder.state === "stopped") p.fill(white[0], white[1], white[2], 255/2);
            else p.fill(225, 0, 0, 255/2);
            p.rect(gridInitX + gridStepSizeX * i, p.windowHeight/2-mapping/2, gridStepSizeX/4, mapping);
          }
        }

        let auxY = p.windowHeight-gridInitY/1.25;
        let auxX = (p.windowWidth - gridInitX*2 - p.windowWidth/150*7)/8/2;

        p.textSize(p.windowHeight / 65);
        p.textAlign(p.CENTER, p.BOTTOM);
        if (session.loops[this.tabId].click.state) p.fill(white[0], white[1], white[2]);
        else p.fill(white[0], white[1], white[2], 255/2);
        p.text("CLICK",gridInitX + auxX*3+p.windowWidth/150*1,auxY+p.windowHeight / 40);

        p.push();
        p.translate(0,0,p.windowHeight/60);
        session.loops[this.tabId].tempoScroll.draw(gridInitX + auxX,auxY);
        session.loops[this.tabId].click.draw(gridInitX + auxX*3+p.windowWidth/150*1,auxY-p.windowHeight / 120);
        p.pop();
        
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textFont(fontLight);
        p.textSize(p.windowHeight / 50);
        p.fill(white[0], white[1], white[2], this.menuOpa/2);
        
        if (session.loops[this.tabId].play) {
          if (session.loops[this.tabId].currentStep >= 0) p.text('Recording...', p.windowWidth/2,p.windowHeight/2 + p.windowHeight/8*1.8);
          else {
            let count = p.abs(p.floor(session.loops[this.tabId].currentStep/4));
            p.text('Recording starts in '+count, p.windowWidth/2,p.windowHeight/2 + p.windowHeight/8*1.8);
          }

        } else {
          if (session.loops[this.tabId].recordVisual[0] === 0) p.text('Press "spacebar" to start recording', p.windowWidth/2,p.windowHeight/2 + p.windowHeight/8*1.8);
          else p.text('Press "spacebar" to record again', p.windowWidth/2,p.windowHeight/2 + p.windowHeight/8*1.8);
        }

        p.textAlign(p.CENTER, p.TOP);
        p.textSize(p.windowHeight / 50);
        p.text("Sing/hum a Melody", p.windowWidth/2, p.windowHeight/2 - p.windowHeight/8*1.8);

        //let textWidth = p.textWidth("SING/HUM A ")/2+p.textWidth("MELODY")/2;

        /*p.fill(white[0], white[1], white[2], this.menuOpa);
        p.text("SING/HUM A ", p.windowWidth/2-textWidth/2, p.windowHeight/2 - p.windowHeight/8*1.8);
        
        let c = colors[3];
        
        p.fill(c[0],c[1],c[2], this.menuOpa);
        p.text(this.lastOption, p.windowWidth/2-textWidth/2+p.textWidth("SING/HUM A ")/2+p.textWidth("MELODY")/2, p.windowHeight/2 - p.windowHeight/8*1.8);*/

        p.textAlign(p.RIGHT, p.CENTER);
        
        p.textSize(p.windowHeight / 50);
        
        if (p.mouseX > p.windowWidth - gridInitX*6-p.textWidth("CANCEL") && p.mouseX < p.windowWidth - gridInitX*6 && p.mouseY > auxY-p.windowHeight / 50 /1.5 && p.mouseY < auxY + p.windowHeight / 50 /1.5) {
          if (session.loops[this.tabId].play) {
            document.body.style.cursor = 'not-allowed';
            p.fill(white[0], white[1], white[2], this.menuOpa/2);
          } else {
            document.body.style.cursor = 'pointer';
            p.fill(white[0], white[1], white[2], this.menuOpa);

            if (p.mouseIsPressed) {
              synths.mic.close();
              this.close();
              p.mouseIsPressed = false;
            }
          }

        } else p.fill(white[0], white[1], white[2], this.menuOpa/2);
        
        p.text("CANCEL", p.windowWidth - gridInitX*6, auxY);

        p.textSize(p.windowHeight / 40);
        p.textFont(fontMedium);

        if (p.mouseX > p.windowWidth - gridInitX*2-p.textWidth("GENERATE") && p.mouseX < p.windowWidth - gridInitX*2 && p.mouseY > auxY-p.windowHeight / 40 /1.5 && p.mouseY < auxY + p.windowHeight / 40 /1.5) {
          if (session.loops[this.tabId].recordVisual[0] === 0 || session.loops[this.tabId].play) {
            document.body.style.cursor = 'not-allowed';
            p.fill(white[0], white[1], white[2], this.menuOpa/3);
          } else {
            document.body.style.cursor = 'pointer';
            p.fill(colors[3][0], colors[3][1], colors[3][2], this.menuOpa);

            if (p.mouseIsPressed) {
              this.close();
              synths.mic.close();
              session.loops[this.tabId].addTrackByMelody();
              p.mouseIsPressed = false;
            }
          }
        } else p.fill(white[0], white[1], white[2], this.menuOpa/3);


        p.text("GENERATE", p.windowWidth - gridInitX*1.9, auxY);  
      }
    }

    drawAbout() {
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(fontLight);
      p.textSize(p.windowHeight / 50);
      p.fill(white[0], white[1], white[2], this.menuOpa);

      p.text("Made with (too much) love by Thomas Fresco.", p.windowWidth/2, p.windowHeight/2);
    }

    draw(x,y) {
      //update responsive
      this.optionW = this.getWidestOption();
      this.optionH = p.windowHeight / 30;

      if (this.menuOpa + this.opaInc > 255) this.menuOpa = 255;
      else this.menuOpa += this.opaInc;

      p.noStroke();
      p.fill(0, 0, 0, this.dark);
      p.rect(0, 0, p.windowWidth, p.windowHeight);

      if (this.state === -1) {
        if (this.dark - this.darkInc < 0) this.dark = 0;
        else this.dark -= this.darkInc;
      }
      else {

        if (this.state === 3) {
          if (this.dark + this.darkInc > 255) this.dark = 255;
          else this.dark += this.darkInc;
        } else {
          if (this.dark + this.darkInc > this.darkMax) this.dark = this.darkMax;
          else this.dark += this.darkInc;
        }

        if (p.millis() - this.lastInstant > this.interval) {
          this.lastInstant = p.millis();
          for (let i = 0; i < this.nOptions; i++) {
            if (this.optionsCheck[i] === false) {
              this.optionsCheck[i] = true;
              break;
            }
          }
        }

        if (this.state === 0) this.drawOptions(x,y);
        else if (this.state === 1) this.drawModeOptions();
        else if (this.state === 2) this.drawSelection();
        else if (this.state === 3) this.confirmDelete();
        else if (this.state === 4) this.recordingMenu();
        else if (this.state === 5) this.drawAbout();

        //if (p.mouseX < x || p.mouseX > x + this.optionW || p.mouseY < y  -this.optionH*2 - (this.options.length-1) * this.optionH || p.mouseY > y  -this.optionH*2 + this.optionH) {
        if (p.mouseIsPressed && this.state !== 4 && this.state !== 2) {
          this.close();
          p.mouseIsPressed = false;
        }
        //}
      }
    }
  }

  class Knob {
    constructor(label,value,options,unit) {
      this.label = label;
      
      this.radius = p.windowHeight / 15;

      this.lastY;

      this.value = value;
      this.tempValue = value;
      this.inc = 0.01;

      this.options = options;
      this.unit = unit;

      this.automation = new Array(nSteps).fill(0.5);
      this.automating = false;

      this.hover = false;
      this.dragging = false;

      this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
    }

    knobAutomate(loop) {
      if (this.automating && loop.currentStep > -1) {
        this.value = this.automation[loop.currentStep];
        if (typeof this.output === "string") this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))].toUpperCase();
        else this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
      }
    }

    findKnob() {
      for(let i=0;i<session.activeTab.selectedTrack.knobs.length;i++) {
        if (session.activeTab.selectedTrack.knobs[i][1] === this) return i;
      }
    }
 
    draw(x,y,opa) {
      this.radius = p.windowHeight / 15;
    
      if (this.automating === false) { 
        if (typeof this.output === "string") this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))].toUpperCase();
        else this.output = this.options[p.round(p.map(this.value,0,1,0,this.options.length-1))];
      }

      p.fill(white[0], white[1], white[2],opa);
      p.noStroke();
      p.textSize(p.windowHeight/65);
      p.textAlign(p.CENTER,p.BOTTOM);
      p.text(this.label,x,y-this.radius/1.7);
      p.textAlign(p.CENTER,p.TOP);
      p.textSize(p.windowHeight/55);
      if (this.label === "PITCH") p.text((this.output/100)+this.unit,x,y+this.radius/1.7);
      else p.text(this.output+this.unit,x,y+this.radius/1.7);

      if (this.automating) p.fill(session.activeTab.selectedTrack.color[0], session.activeTab.selectedTrack.color[1], session.activeTab.selectedTrack.color[2],opa/2);
      else p.noFill();
      p.stroke(white[0], white[1], white[2],opa);
      p.strokeWeight(1);
      p.push();
      p.translate(x,y);
      //console.log(this.value,p.PI/2+p.PI/4,p.PI+p.PI/4);
      p.rotate(p.map(this.value,0,1,-p.PI/2-p.PI/4, 3*(p.PI/2)-p.PI/2-p.PI/4));
      p.translate(-x,-y);
      p.push();
      p.translate(0,0,-1);
      p.circle(x, y, this.radius);
      p.pop();
      p.line(x,y,x,y-this.radius/2);
      p.pop();

      if (p.mouseX > x -this.radius/2 && p.mouseX < x+this.radius/2 && p.mouseY > y -this.radius/2 && p.mouseY < y +this.radius/2
        && dragging === false && menuOpened === false) {
          document.body.style.cursor = 'grab';
          
          this.hover = true;

          if (p.mouseIsPressed && this.dragging === false) {
            session.activeTab.selectedTrack.presetChanged = true;

            if (this.automating) {
              session.alertLog('Automation "'+this.label+'" disabled.');
              this.automating = false;
            }
            session.activeTab.selectedTrack.automationScroll.value = this.findKnob();
            this.lastY = p.mouseY;
            this.dragging = true;
            dragging = true;
            this.tempValue = this.value;
          }
          
      } else this.hover = false;

      if (p.mouseIsPressed === false && this.dragging === true) {
        this.dragging = false;
        dragging = false;
        this.hover = true;
        //session.save();
      }

      if (this.dragging) {
        document.body.style.cursor = 'grabbing';
        if (p.mouseY > this.lastY) {
          let d = p.dist(x,p.mouseY,x, this.lastY);
          this.value = p.round(this.tempValue - this.inc*p.round(d/(p.windowHeight/250)),2);
        }
        else if (p.mouseY < this.lastY)  {
          let d = p.dist(x,p.mouseY,x, this.lastY);
          this.value = p.round(this.tempValue + this.inc*p.round(d/(p.windowHeight/250)),2);
        }

        if (this.value > 1) this.value = 1;
        if (this.value < 0) this.value = 0;
      }
    }
  }

  //on/off button
  class Button {
    constructor(label,state,color) {
      this.label = label;
      this.state = state;
      this.color = color;
      this.radius = p.windowWidth / 100;

      this.clickOpa = 255;

      this.hover = false;

      if (state) this.opa = 255;
      else this.opa = 255/3;
    }

    draw(x,y) {
      this.radius = p.windowWidth / 100;

      if (this.state) this.opa = 255;
      else this.opa = 255/3;

      if (session.activeTab.currentStep%4 === 0) {
        this.clickOpa = 255;
        this.lastClick = session.activeTab.currentStep;
      }

      if (this.clickOpa - 50 < 0) this.clickOpa = 0;
      else this.clickOpa -= 50;

      p.noFill();
      p.strokeWeight(1);
      p.stroke(white[0], white[1], white[2],this.opa);
      p.circle(x, y, this.radius);
      if (this.state) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2],this.opa);
        p.circle(x, y, this.radius/1.8);
        if (this.label === "CLICK" && session.activeTab.play) {
          let c;
          if (session.activeTab.plusMenu.state === 4) c = colors[3];
          else c = session.activeTab.selectedTrack.color;
          p.fill(c[0], c[1], c[2],this.clickOpa);
          p.circle(x, y, this.radius/1.8);
        }
      }

      if (p.mouseX > x -this.radius/2 && p.mouseX < x+this.radius/2 && p.mouseY > y -this.radius/2 && p.mouseY < y +this.radius/2  && dragging === false && (menuOpened === false || menuOpened === true && session.activeTab.type === "loop" && (session.activeTab.plusMenu.state === 2 || session.activeTab.plusMenu.state === 4))) {
        document.body.style.cursor = 'pointer';

        this.hover = true;

        if (p.mouseIsPressed) {
          if (this.label !== "CLICK" && this.label !== "RECORD" && this.label !== "TEMPO" && this.label !== "TRANSPOSE" && this.label !== "SOLO") session.activeTab.selectedTrack.presetChanged = true;
          this.state = !this.state;
          p.mouseIsPressed = false;
          //session.save();
        }
      } else this.hover = false;
    }
  }

  class Scrollable {
    constructor(label,value,min,max,unit,inc,inc2) {
      this.label = label;
      this.unit = unit;

      this.value = value;
      this.min = min;
      this.max = max;

      this.opa = 0;

      this.inc = inc;
      this.inc2 = inc2;

      this.hover = false;
      this.hoverUp = false;
      this.hoverDown = false;
      this.pressing = false;
      this.timer = 0;

      this.w = p.windowWidth / 10;
      this.h = p.windowHeight / 20;
    }

    increment(inc) {
      if (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS") {
        if (this.value + inc <= this.max) this.value += inc;
        else this.value = this.max;
      } else {
        if (this.value - inc >= this.min) {
          this.value -= inc;
          if (this.label === "PRESET") session.activeTab.selectedTrack.presetChanged = false;

        }
        else this.value = this.min;
      }
    }

    decrement(inc) {
      if (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS") {
        if (this.value - inc >= this.min) this.value -= inc;
        else this.value = this.min;
      } else {
        if (this.value + inc <= this.max) {
          this.value += inc;
          if (this.label === "PRESET") session.activeTab.selectedTrack.presetChanged = false;
        }
        else this.value = this.max;
      }
    }

    draw(x,y) {
      this.w = p.windowWidth / 10;
      this.h = p.windowHeight / 20;
      //if (this.opa + this.opaInc > this.opaMax) this.opa = this.opaMax;
      //else this.opa += this.opaInc;

      //p.fill(255, 0, 0, this.opa/2);
      //p.rect(x-this.w/2,y-this.h/2,this.w,this.h);

      p.noStroke();
      
      p.fill(white[0], white[1], white[2]);
      p.textSize(p.windowHeight/40);
      p.textAlign(p.LEFT,p.TOP);
      if (this.label === "PRESET") {
        //console.log(session.activeTab.selectedTrack);
        if (session.activeTab.selectedTrack.presetChanged) {
          if (session.activeTab.selectedTrack.name === "DRUMS") p.text(synths.drumPresets[this.value].name+"*", x-this.w/3.2, y-this.h/2);
          else p.text(synths.synthPresets[this.value].name+"*", x-this.w/3.2, y-this.h/2);
        } else {
          if (session.activeTab.selectedTrack.name === "DRUMS") p.text(synths.drumPresets[this.value].name, x-this.w/3.2, y-this.h/2);
          else p.text(synths.synthPresets[this.value].name, x-this.w/3.2, y-this.h/2);
        }
      }
      else if (this.label === "PARAMETER") {
        let knob = session.activeTab.selectedTrack.knobs[this.value];
        p.text(knob[0] + " - " + knob[1].label, x-this.w/3.2, y-this.h/2);
      }
      else if (this.label === "OCTAVE") {
        if (session.activeTab.selectedTrack !== null) {
          if (session.activeTab.selectedTrack.name === "DRUMS") p.text("KICK-CRASH", x-this.w/3.2, y-this.h/2);
          else p.text(theory.octaves[this.value], x-this.w/3.2, y-this.h/2);
        } else {
          if (generatedTracks[0].name === "DRUMS") p.text("KICK-CRASH", x-this.w/3.2, y-this.h/2);
          else p.text(theory.octaves[this.value], x-this.w/3.2, y-this.h/2);
        }
        
      }
      else p.text(this.value + " " + this.unit, x-this.w/3.2, y-this.h/2);

      p.textAlign(p.LEFT,p.BOTTOM);
      p.fill(white[0], white[1], white[2], 255/2);
      p.textSize(p.windowHeight/65);
      p.text(this.label, x-this.w/3.2, y+this.h/2);

      p.push();
      if (p.mouseX > x - this.w/2 && p.mouseX < x+this.w/2 && p.mouseY > y -this.h/2 && p.mouseY < y +this.h/2
        && dragging === false && (menuOpened === false || menuOpened === true && session.activeTab.type === "loop" && (session.activeTab.plusMenu.state === 2 || session.activeTab.plusMenu.state === 4))) {

          if (this.opa + 15 < 255) this.opa += 15;
          else this.opa = 255;

          this.hover = true;
          if (p.mouseX < x - this.w/2 + this.h/2) {
            if (p.mouseY < y) {
              if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else p.tint(255,this.opa/4);

              p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
              if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
              else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
              else p.tint(255,this.opa/4);
              p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);

              if (p.mouseIsPressed) {
                if (this.pressing === false) {
                  this.increment(this.inc);
                  this.pressing = true;
                  this.timer = p.millis();
                } else if (p.millis() - this.timer > 500) this.increment(this.inc2);

              } else this.pressing = false;
              
            }
            else {
              if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") {
                p.tint(255,this.opa);
                document.body.style.cursor = 'pointer';
              } else p.tint(255,this.opa/4);

              p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
              if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
              else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
              else p.tint(255,this.opa/4);
              p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);

              if (p.mouseIsPressed) {
                if (this.pressing === false) {
                  this.decrement(this.inc);
                  this.pressing = true;
                  this.timer = p.millis();
                } else if (p.millis() - this.timer > 500) this.decrement(this.inc2);
            
              } else this.pressing = false;
              
            }
          } else {
            if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
            else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
            else p.tint(255,this.opa/4);
            p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
            if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
            else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
            else p.tint(255,this.opa/4);
            p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
          }
      } else {
        if (this.value < this.max && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
        else if (this.value > this.min && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
        else p.tint(255,this.opa/4);
        p.image(arrowUp, x-this.w/2+this.h/4, y-this.h/4, this.h/2, this.h/2);
        if (this.value > this.min && (this.label === "TEMPO" || this.label === "OCTAVE" || this.label === "TRANSPOSE" || this.label === "REPEATS")) p.tint(255,this.opa/2);
        else if (this.value < this.max && this.label !== "TEMPO" && this.label !== "OCTAVE" && this.label !== "TRANSPOSE" && this.label !== "REPEATS") p.tint(255,this.opa/2);
        else p.tint(255,this.opa/4);
        p.image(arrowDown, x-this.w/2+this.h/4, y+this.h/4, this.h/2, this.h/2);
        this.hover = false;
        if (this.opa - 15 > 0) this.opa -= 15;
        else this.opa = 0;
      }
      p.pop();

      if (session.activeTab.type === "struct") {
        if (session.activeTab.tempoButton.state === false && this.label === "TEMPO") {
          p.fill(0,0,0,255/2);
          p.rect(x-this.w/2,y-this.h/2,this.w,this.h);
        }
        if (session.activeTab.transposeButton.state === false && this.label === "TRANSPOSE") {
          p.fill(0,0,0,255/2);
          p.rect(x-this.w/2,y-this.h/2,this.w,this.h);
        }
      }
    }
  }

  // --------------------------------------------------------------------------------------

  p.preload = function () {
    fontLight = p.loadFont(poppinsLightFont);
    fontMedium = p.loadFont(poppinsMediumFont);
  }

  // --------------------------------------------------------------------------------------
  p.setup = function () {
    petal1 = p.loadModel(petalOBJ1);
    petal2 = p.loadModel(petalOBJ2);
    petal3 = p.loadModel(petalOBJ3);
    petal4 = p.loadModel(petalOBJ4);

    loopsIcon = p.loadImage(loopsPNG);
    structsIcon = p.loadImage(structsPNG);
    gridIcon = p.loadImage(gridPNG);
    studioIcon = p.loadImage(studioPNG);
    autoIcon = p.loadImage(autoPNG);

    plus = p.loadImage(plusPNG);
    arrowUp = p.loadImage(arrowUpPNG);
    arrowDown = p.loadImage(arrowDownPNG);

    ai = p.loadImage(aiPNG);
    sing = p.loadImage(singPNG);
    scratch = p.loadImage(scratchPNG);

    diceIcons.push(p.loadImage(dice1PNG));
    diceIcons.push(p.loadImage(dice2PNG));
    diceIcons.push(p.loadImage(dice3PNG));
    diceIcons.push(p.loadImage(dice4PNG));
    diceIcons.push(p.loadImage(dice5PNG));
    diceIcons.push(p.loadImage(dice6PNG));

    let cnv = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.frameRate(60);
    p.imageMode(p.CENTER);
    p.textFont(fontLight);

    cnv.mouseReleased(function() { 
      saving = true; 
      saveDebounceInstant = p.millis();
      if (session.activeTab === null) session.suggestionInstant = session.suggestionInstant - 15000;
    });

    //console.log(sesh);
    //p.pixelDensity(1);

    // Set up orthographic projection
    p.ortho(-p.windowWidth / 2, p.windowWidth / 2, -p.windowHeight / 2, p.windowHeight / 2, 0, 1000);

    //protect initial trigger of drawers
    p.mouseX = p.windowWidth / 2;
    p.mouseY = 0;

    //marginX = p.windowWidth / maxSteps;
    marginX = p.windowHeight / 30;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;
    
    playSize1 = p.windowHeight/150;
    playSize2 = p.windowHeight/100;

    gridStepSizeX = (p.windowWidth - p.windowHeight / 30 * 3) / (nSteps - 1);
    gridStepSizeY = ((p.windowHeight - p.windowHeight / 30) * 3.8) / (nSteps - 1);
    gridInitX = p.windowWidth / 2 - gridStepSizeX * (nSteps-1) / 2;
    //REVER
    gridInitY = p.windowHeight / 2 - (gridStepSizeY * (12-1)) / 2;

    session = new Session();
    session.loops.push(new Loop(0, "myLoop"+0, 120));
    session.loops[0].tracks.push(new Track(0, 0, "MELODY", p.windowWidth / 2));
    session.tabs.push(session.loops[0]);
    session.activeTab = session.loops[0];
    session.activeTab.selectedTrack = session.activeTab.tracks[0];
    session.activeTab.view = 1;
    /*for (let i = 0; i < 5; i++) {
      session.loops.push(new Loop(i, "myLoop"+i, 120));
      session.loops[i].tracks.push(new Track(0, i, "MELODY", p.windowWidth / 2));
      for (let j = 0; j < 5; j++) {
        let start = p.floor(p.random(0, nSteps));
        let pitch = p.floor(p.random(0,12));
        //let duration = p.random(1,4);
        let duration = 1;
        session.loops[i].tracks[0].notes.push(new Note(pitch, session.loops[i].id, 0, start, duration, 3, session.loops[i].tracks[0].color));
      }
    }*/


    //ref session to synth.js
    synths.setSession(session,saving);
    synths.setGeneratedTracks(generatedTracks);

    for (let i = 0; i < particles.length; i++) particles[i] = new Particle();
    for (let i = 0; i < petalParticles.length; i++) petalParticles[i] = new PetalParticle();
    diagonal = p.sqrt(p.windowWidth * p.windowWidth + p.windowHeight * p.windowHeight) / 2;
  }

  // --------------------------------------------------------------------------------------
  p.draw = function () {
    document.body.style.cursor = 'default';

    // Set up orthographic projection
    p.ortho(-p.windowWidth / 2, p.windowWidth / 2, -p.windowHeight / 2, p.windowHeight / 2, 0, 1000);

    petalModelSize = calculateBoundingBox(petal1).width;
    //p.lightFalloff(40,0,0);
    //p.spotLight(255, 255, 255, p.mouseX-p.windowWidth/2, p.mouseY-p.windowHeight/2, 10, 0, 0, -1); // Set spot light color, position, and direction
    //p.pointLight(255, 255, 255, p.mouseX-p.windowWidth/2, p.mouseY-p.windowHeight/2, 2);
    //p.translate(-p.windowWidth/2,-p.windowHeight/2);
    //update responsive values
    marginX = p.windowHeight / 30;
    iconSize = p.windowHeight / 15;
    iconCorners = p.windowHeight / 100;
    gridStepSizeX = (p.windowWidth - p.windowHeight / 30 * 3) / (nSteps);
    gridStepSizeY = ((p.windowHeight - p.windowHeight / 30) * 4.15) / (nSteps - 1);
    gridInitX = p.windowWidth / 2 - gridStepSizeX * (nSteps) / 2;
    gridInitY = p.windowHeight / 2 - (gridStepSizeY * 12.5) / 2;
    playSize1 = p.windowHeight/150;
    playSize2 = p.windowHeight/100;

    p.translate(-p.windowWidth/2,-p.windowHeight/2);
    p.background(0);

    /*p.push();
    p.translate(0,0,2);
    drawParticles();
    p.pop();*/

    session.draw();

    if (p.millis() - saveDebounceInstant > saveDebounceDelay && saving) {
      //console.log("saving...");
      //session.save();
      saving = false;
      saveDebounceInstant = p.millis(); 
    }

    /*if (session.activeTab !== null) {
      if (dragging === false && menuOpened === false && document.body.style.cursor === 'default') {
        if (p.mouseIsPressed) {
          if (session.activeTab.type === "loop") session.activeTab.selectedTrack = null;
          p.mouseIsPressed = false;
        }
      }
    }*/

    //p.fill(255, 255, 255);
    //p.circle(p.mouseX, p.mouseY, 10, 10); 
    //let bbox = calculateBoundingBox(petal1);
    //console.log("Bounding box dimensions:", bbox);
  }

  p.keyPressed = function () {

    if (session.activeTab !== null && session.activeTab.type === "loop" && inputNotes.length < maxInputNotes && session.loopDrawer === false && session.structDrawer === false && menuOpened === false) {
      let input = theory.keysDecode(p.key.toUpperCase());
      if (input !== -1 && inputNotes.indexOf(input) === -1) {
        inputNotes.push(input);
        if (session.activeTab.selectedTrack !== null) {
          session.activeTab.selectedTrack.playInputNote(input);
          if (session.activeTab.selectedTrack.name === "DRUMS") session.manageRecordedNotes(input, 0);
          else session.manageRecordedNotes(input, currentOctave);
        }
      }
    }
  }

  p.keyReleased = function () {

    if (session.activeTab !== null && menuOpened === false) {
    if (session.activeTab.type === "loop" && session.activeTab.selectedTrack !== null) {
      if (p.key.toUpperCase() === 'Z') if (currentOctave > minOctave) {
        for (let i = 0; i < inputNotes.length; i++) {
          session.activeTab.selectedTrack.releaseInputNote(inputNotes[i]);
          inputNotes.splice(i, 1);
          i--;
        }
        currentOctave--;
        session.alertLog("Current keyboard octave: "+currentOctave);

      }
      if (p.key.toUpperCase() === 'X') if (currentOctave < maxOctave) {
        for (let i = 0; i < inputNotes.length; i++) {
          session.activeTab.selectedTrack.releaseInputNote(inputNotes[i]);
          inputNotes.splice(i, 1);
          i--;
        }
        currentOctave++;
        session.alertLog("Current keyboard octave: "+currentOctave);

      }
    }
  }

    let input = theory.keysDecode(p.key.toUpperCase());
    if (input !== -1) {
      let index = inputNotes.indexOf(input);
      if (index !== -1) {
        inputNotes.splice(index, 1);
        if (session.activeTab.selectedTrack !== null) {
          session.activeTab.selectedTrack.releaseInputNote(input);
          if (session.activeTab.selectedTrack.name === "DRUMS") session.resolveRecordedNotes(input,0);
          else session.resolveRecordedNotes(input,currentOctave);
        }
      }
    }

    saving = true;
    saveDebounceInstant = p.millis();
  }

  //scrolling event
  p.mouseWheel = function (event) {
    if (session.activeTab !== null) {
      let s = session.activeTab.tempoScroll;
      if (s.hover) {
        if (event.delta > 0) s.increment(s.inc);
        else s.decrement(s.inc);
      } else {
        for (let n in session.activeTab.selectedTrack.notes) {
          let note = session.activeTab.selectedTrack.notes[n];
          if (note.selected) {
            if (event.delta > 0) {
              if (note.start+note.duration < nSteps) {
                note.duration++;
                session.activeTab.selectedTrack.ajustNotes(note);
              }
            } else {
              if (note.duration > 1) {
                note.duration--;
                session.activeTab.selectedTrack.ajustNotes(note);
              }
            }
          }
        }
      }
    }
  }

function calculateBoundingBox(model) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  // Iterate through all vertices of the model
  for (let i = 0; i < model.vertices.length; i++) {
    let v = model.vertices[i];
    minX = p.min(minX, v.x);
    minY = p.min(minY, v.y);
    minZ = p.min(minZ, v.z);
    maxX = p.max(maxX, v.x);
    maxY = p.max(maxY, v.y);
    maxZ = p.max(maxZ, v.z);
  }

  // Calculate dimensions
  let width = maxX - minX;
  let height = maxY - minY;
  let depth = maxZ - minZ;

  return {
    width: width,
    height: height,
    depth: depth
  };
}

}

// --------------------------------------------------------------------------------------

let loopSearch = '';
let prevLoopSearch = '';
let structSearch = '';
let prevStructSearch = '';
let maxNameLength = 15;

document.addEventListener('DOMContentLoaded', function() {
  // Variable to store typing status

  // Event listener for keydown event
  document.addEventListener('keydown', function(event) {
      const keyCode = event.keyCode;
      // Check if the pressed key is alphanumeric or space
      if ((keyCode >= 48 && keyCode <= 57) ||     // 0-9
          (keyCode >= 65 && keyCode <= 90) ||     // A-Z
          keyCode === 32) {                       // Space
          if (session.loopDrawer) {
            if (loopSearch.length < maxNameLength) {
              loopSearch += event.key;
            }
          } else if (session.structDrawer) {
            if (structSearch.length < maxNameLength) {
              structSearch += event.key;
            }
          }
      }
  });

});

export default sketch;