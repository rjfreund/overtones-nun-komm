var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var fundamental = document.getElementById('fundamental');    
var overtonesTable = document.getElementById('overtonesTable');
var numOvertones = document.getElementById('numOvertones');
var wave = document.getElementById('wave');
var nextBtn = document.getElementById('nextNoteBtn');

var score = [32, 32, 30, 38, 36, 38, 36, 32]; 
var noteIndex = -1;
window.addEventListener('load', function(){ setOvertones([]); });

var oscillator = audioCtx.createOscillator();
oscillator.type = wave.value;
oscillator.frequency.setValueAtTime(0, audioCtx.currentTime); // value in hertz
oscillator.connect(audioCtx.destination);
oscillator.start();

fundamental.addEventListener('change', function(event){ setOvertones([]); });
numOvertones.addEventListener('change', function(event){ setOvertones([]); });
wave.addEventListener('change', function(event){ setOvertones([]); });
nextBtn.addEventListener('click', function(event){
    console.log(audioCtx.state);
    noteIndex++;
    setOvertones([score[noteIndex]]);
});

function setOvertones(overtones){
    var overtoneCountLimit = Number(numOvertones.value);
    for (var i=0; i<overtoneCountLimit; i++){
        (function(index){
            var row = overtonesTable.rows[index+1] || overtonesTable.insertRow(-1); /*inserts row at last position*/
            var overtoneNumberCell = row.getElementsByClassName('overtone-number')[0] || row.insertCell(-1);
            overtoneNumberCell.className='overtone-number';    
            overtoneNumberCell.innerHTML = (index===0) ? 'fundamental' : index+1;    
            var intervalCell = row.getElementsByClassName('interval')[0] || row.insertCell(-1);
            intervalCell.className='interval';
            intervalCell.innerHTML= (index===0) ? 'tonic' :
                (isDoubledMultipleOf(index+1, 02)) ? 'tonic' : 
                (isDoubledMultipleOf(index+1, 03)) ? 'P5' :
                (isDoubledMultipleOf(index+1, 05)) ? 'Maj 3' : 
                (isDoubledMultipleOf(index+1, 07)) ? 'flat 7' : 
                (isDoubledMultipleOf(index+1, 09)) ? 'Maj 2' : 
                (isDoubledMultipleOf(index+1, 11)) ? 'tritone / V of 5' : 
                (isDoubledMultipleOf(index+1, 13)) ? 'flat 6' : 
                (isDoubledMultipleOf(index+1, 15)) ? 'Maj 7' : 
                (isDoubledMultipleOf(index+1, 19)) ? 'min 3' : 
                (isDoubledMultipleOf(index+1, 21)) ? 'P4' : 
                (isDoubledMultipleOf(index+1, 27)) ? 'Maj 6' : 
                    '';
            var ratioCell = row.getElementsByClassName('ratio')[0] || row.insertCell(-1);
            ratioCell.className='ratio';
            ratioCell.innerHTML='1/'+(index+1);
            var frequencyCell = row.getElementsByClassName('frequency')[0] || row.insertCell(-1);
            frequencyCell.className='frequency';
            var frequencyValue = ((index+1) * Number(fundamental.value));
            frequencyCell.innerHTML=frequencyValue.toFixed(2);
            var isEnabledCell = row.getElementsByClassName('enabled')[0] || row.insertCell(-1);
            isEnabledCell.className='enabled';
            var isEnabledCheckbox = isEnabledCell.getElementsByTagName('input')[0] || document.createElement('input');
            isEnabledCheckbox.type = 'checkbox';
            isEnabledCheckbox.checked = overtones.includes(index+1);
            if (isEnabledCheckbox.checked){ 
                toggleOscillator(frequencyValue, isEnabledCheckbox.checked, oscillator); 
            }
            isEnabledCell.appendChild(isEnabledCheckbox);
            var oscilloscopeCell = row.getElementsByClassName('oscilloscope')[0] || row.insertCell(-1);
            oscilloscopeCell.className = 'oscilloscope';
            var canvas = oscilloscopeCell.getElementsByTagName('canvas')[0] || document.createElement('canvas');
            canvas.width = 0;
            canvas.height = 0;
            oscilloscopeCell.appendChild(canvas);
            isEnabledCheckbox.onchange = function(event){
                toggleOscillator(frequencyValue, event.target.checked, oscillator);
                toggleAnimateOscilloscope(oscillator, event.target.checked, canvas);
            };
        })(i);    
    }
}

function toggleOscillator(frequency, shouldRun, oscillator){
    if (shouldRun){
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime); // value in hertz
    } else {
        oscillator.frequency.setValueAtTime(0, audioCtx.currentTime);
    }
}

function isDoubledMultipleOf(dividend, something){    
    while(true){
        if (dividend % 2 !== 0) break;
        if (dividend <= something) break;
        dividend = dividend / 2;
    }
    return dividend === something;
}

function toggleAnimateOscilloscope(oscillator, shouldRun, canvas){
    if (!shouldRun){
        canvas.width = 0;
        canvas.height = 0;
        stop();
        return;
    }
    canvas.width = 300;
    canvas.height = 150;
    var ctx = canvas.getContext('2d');
    var analyser;
    var timeDomain;
    var drawRequest;
    if (oscillator instanceof window.AnalyserNode) {
        analyser = oscillator;
    } else {
        analyser = oscillator.context.createAnalyser();
        oscillator.connect(analyser);
    }

    timeDomain = new Uint8Array(analyser.frequencyBinCount);
    drawRequest = 0;

    //animate
    var x0 = 0;
    var y0 = 0;
    var width = ctx.canvas.width - x0;
    var height = ctx.canvas.height - y0;
    if (drawRequest) {
        throw new Error('Oscilloscope animation is already running')
    }        
    function drawLoop(){
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        //draw
        analyser.getByteTimeDomainData(timeDomain);
        var step = width / timeDomain.length;
        ctx.beginPath();
        // drawing loop (skipping every nth record)
        for (var i = 0; i < timeDomain.length; i += 1) {
            var percent = timeDomain[i] / 256;
            var x = x0 + (i * step);
            var y = y0 + (height * percent);
            ctx.lineTo(x, y);
        }
        ctx.stroke();        
        drawRequest = window.requestAnimationFrame(drawLoop)
    }
    drawLoop();
    

    // stop default signal animation
    function stop () {
        if (drawRequest) {
            window.cancelAnimationFrame(drawRequest)
            drawRequest = 0
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)    
        }   
    }
}