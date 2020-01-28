function getColorSpectrum(spectrumLength){
    function nmToRGB(wavelength){
        var Gamma = 0.80,
        IntensityMax = 255,
        factor, red, green, blue;
        if((wavelength >= 380) && (wavelength<440)){
        red = -(wavelength - 440) / (440 - 380);
        green = 0.0;
        blue = 1.0;
        }else if((wavelength >= 440) && (wavelength<490)){
        red = 0.0;
        green = (wavelength - 440) / (490 - 440);
        blue = 1.0;
        }else if((wavelength >= 490) && (wavelength<510)){
        red = 0.0;
        green = 1.0;
        blue = -(wavelength - 510) / (510 - 490);
        }else if((wavelength >= 510) && (wavelength<580)){
        red = (wavelength - 510) / (580 - 510);
        green = 1.0;
        blue = 0.0;
        }else if((wavelength >= 580) && (wavelength<645)){
        red = 1.0;
        green = -(wavelength - 645) / (645 - 580);
        blue = 0.0;
        }else if((wavelength >= 645) && (wavelength<781)){
        red = 1.0;
        green = 0.0;
        blue = 0.0;
        }else{
        red = 0.0;
        green = 0.0;
        blue = 0.0;
        };
        // Let the intensity fall off near the vision limits
        if((wavelength >= 380) && (wavelength<420)){
        factor = 0.3 + 0.7*(wavelength - 380) / (420 - 380);
        }else if((wavelength >= 420) && (wavelength<701)){
        factor = 1.0;
        }else if((wavelength >= 701) && (wavelength<781)){
        factor = 0.3 + 0.7*(780 - wavelength) / (780 - 700);
        }else{
        factor = 0.0;
        };
        if (red !== 0){
        red = Math.round(IntensityMax * Math.pow(red * factor, Gamma));
        }
        if (green !== 0){
        green = Math.round(IntensityMax * Math.pow(green * factor, Gamma));
        }
        if (blue !== 0){
        blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma));
        }
        return [red,green,blue];
    }

    var minWave = 380;
    var maxWave = 780;
    var colorList = [];
    for(var i=0;i<spectrumLength;i++){
        var diff = maxWave - minWave;
        var rgb = nmToRGB(minWave+diff/spectrumLength*i);
        colorList.push(rgb);
    }

    colorList.reverse();
    return colorList;
}

window.onload = function() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const distortion = audioCtx.createWaveShaper();
    
    const $audioEl = document.querySelector('audio');
    var $playBtn = document.querySelector('.playBtn');

    const source = audioCtx.createMediaElementSource($audioEl);
    

    source.connect(analyser);
    analyser.connect(distortion);
    distortion.connect(audioCtx.destination);

    analyser.fftSize = 512;

    let bufferLength = analyser.frequencyBinCount;


    function drawFrequency(bufferLength){

        bufferLength = bufferLength*3/4;
        let dataArray = new Uint8Array(bufferLength);
    
        const canvas = document.getElementById('frequency');
        const canvasCtx = canvas.getContext('2d');
        const colorList = getColorSpectrum(bufferLength);
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
    
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.lineWidth = 2;
    
        function draw() {
            var drawVisual = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
    
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
            
            
    
            var sliceWidth = WIDTH / bufferLength;
            var x = 0;
            var y = 0;
            for(var i = 0; i < bufferLength; i++) {
                canvasCtx.beginPath();
                if(i!==0)
                    canvasCtx.moveTo(x, y);
    
                
                var v = dataArray[i] / 128.0;
                y = HEIGHT - v * HEIGHT/2;
        
                x += sliceWidth;
                
                if(i!==0)
                    canvasCtx.lineTo(x, y);
                else
                    canvasCtx.moveTo(x, y);
                var color = colorList[i];
    
                
                canvasCtx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                canvasCtx.stroke();
            }
    
            
        }
    
        draw();
    }

    function drawTimeDomain(bufferLength){

        let dataArray = new Uint8Array(bufferLength);

        // bufferLength = bufferLength*3/4
        

        const canvas = document.getElementById('timeDomain');
        const canvasCtx = canvas.getContext('2d');
        const colorList = getColorSpectrum(bufferLength);
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
    
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.lineWidth = 2;
    
        function draw() {
            var drawVisual = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
    
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
            
            
    
            var sliceWidth = WIDTH / (bufferLength);
            var x = 0;
            var y = 0;
            
            for(var i = 0; i < bufferLength; i++) {
                canvasCtx.beginPath();
                if(i!==0)
                    canvasCtx.moveTo(x, y);
    
                
                var v = dataArray[i] / 128.0;
                y = HEIGHT - v * HEIGHT/2;
        
                x += sliceWidth;
                
                if(i!==0)
                    canvasCtx.lineTo(x, y);
                else
                    canvasCtx.moveTo(x, y);
                var color = colorList[i];
    
                
                canvasCtx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                canvasCtx.stroke();
            }
    
            
        }
    
        draw();
    }








    $playBtn.addEventListener('click',function(){
        if(audioCtx.state === 'suspended'){
            audioCtx.resume();
        }

        
        $audioEl.play();
        
        drawFrequency(bufferLength);
        drawTimeDomain(bufferLength);
    })
}


