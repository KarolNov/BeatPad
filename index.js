window.onload = loadData;
//global variables
var audio;
var pads;
var recButtons;
var recorders = [];
const shortcuts = {
    pads: ["q", "w", "e", "a", "s", "d", "z", "x", "c"],
    tracks: ["1", "2", "3", "4"]
}
const samples = ["./Samples/clap-808.wav", "./Samples/hihat-808.wav", "./Samples/cowbell-808.wav", "./Samples/kick-808.wav", "./Samples/kick-electro01.wav", "./Samples/openhat-808.wav", "./Samples/snare-big.wav", "./Samples/tom-808.wav", "./Samples/snare-punch.wav"]

function loadData() {
    //store pads divs as array of DOM elements
    let padsCollection = document.getElementsByClassName('pad');
    pads = Array.from(padsCollection);

    audio = [];
    //pushing samples as audio object and files
    samples.forEach((s, i) => {
        let request = new XMLHttpRequest();
        request.open('GET', s, true);
        request.responseType = 'arraybuffer';

        request.onload = function () {
            audio.push({
                audio: new Audio(s),
                file: request.response
            })
            if (i === samples.length - 1) {
                padsSamples();
            }
        }
        request.send();
    })

    //store record buttons as array of DOM elements
    let recButtonsColl = document.getElementsByClassName("notRec");
    recButtons = Array.from(recButtonsColl);

    //initializing recoders
    recButtons.forEach(el => {
        //pushing objects into global variable storing track id and media recorder object
        recorders.push({
            track: el.id,
            audio: null,
            audioCxt: null,
            audioBuffers: [],
            recording: false,
            start: startRecording,
            stop: stopRecording,
            getSounds: getSounds,
            play: playRecording
        });
    })
}

function instructions() {
    //showing shortcuts for pads
    pads.forEach((pad, i) => {
        pad.innerHTML = `<div class="shortcut"><h3> ${shortcuts.pads[i]} </h3></div>`
    })
}

function padsSamples() {
    //show keyboard shortcuts and etc
    instructions();
    //for each pad div click play other audiofile from array
    pads.forEach((pad, i) => {
        pad.onclick = (e) => {
            //play the sound and pass it to active recorders
            audio[i].audio.play();
            recorders.forEach(r => {
                if (r.recording) r.getSounds(audio[i].file.slice(0))
            })
        }
        //giving each div attribute 'shortcut' that stores key it is fired by
        pad.shortcut = shortcuts.pads[i];
    })
    //keyboard shortcuts
    document.addEventListener("keydown", e => {
        let keyName = e.key;
        //using variable storing shortcuts
        shortcuts.pads.forEach((shortcut, i) => {
            if (keyName === shortcut) {
                audio[i].audio.play();
                recorders.forEach(r => {
                    if (r.recording) r.getSounds(audio[i].file.slice(0))
                })
            }
        })
    })

    //allow to record tracks
    recordTracks()
}

function recordTracks() {
    recButtons.forEach(btn => {
        btn.onclick = (e) => {
            //switch class according to button state (recording or not)
            e.target.className = e.target.className === "notRec" ? "rec" : "notRec";
            //finding the right recorder to start/stop (with the same id as button pressed)
            let recorder = recorders.find(el => el.track === e.target.id);
            //if target new class is 'rec' start recording
            if (e.target.className === "rec") {
                recorder.start()
            } else {
                recorder.stop();
            }
        }
    })
}

function getSounds(sound) {
    if (this.recording) {
        let audioCxt = this.audioCxt;
        audioCxt.decodeAudioData(sound, function(buffer){
            //store array buffer and time its clicked, then when stopping save sum at times
            this.audioBuffers.push({
                time: audioCxt.currentTime, 
                audioBuffer: buffer
            });    
        }.bind(this))
    }
}

function startRecording() {
    this.recording = !this.recording;
    console.log(`Recording ${this.track}`)
    this.audioCxt = new AudioContext();
}

function stopRecording() {
    this.recording = !this.recording;
    let frameCount = this.audioCxt.sampleRate * this.audioCxt.currentTime;
    let newBuff = this.audioCxt.createBuffer(2, frameCount, this.audioCxt.sampleRate)
    for (var channel = 0; channel < 2; channel++) {
        var nowBuffering = newBuff.getChannelData(channel);
        console.log(nowBuffering);
        //fill array with zeros
        nowBuffering.fill(0);
        //for each stored audio replace zeros with array buffer corresponding to sound
        this.audioBuffers.forEach(el=>{
            let indexStart = el.time * this.audioCxt.sampleRate;
            //replace slice
            nowBuffering.splice(indexStart, el.audioBuffer.length, el.audioBuffer.getChannelData(channel));
        })
    }    
    this.play(newBuff);
}

function playRecording(buff) {
    console.log(buff.getChannelData(1));
    var source = this.audioCxt.createBufferSource();
    source.buffer = buff;
    source.connect(this.audioCxt.destination);
    source.start();
    console.log(`Playing ${this.track}`)
}