function getColorSpectrum(spectrumLength){
    function nmToRGB(wavelength){
        let Gamma = 0.80,
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

    let minWave = 380;
    let maxWave = 780;
    let colorList = [];
    for(let i=0;i<spectrumLength;i++){
        let diff = maxWave - minWave;
        let rgb = nmToRGB(minWave+diff/spectrumLength*i);
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
    let $playBtn = document.querySelector('.playBtn');

    const source = audioCtx.createMediaElementSource($audioEl);
    

    source.connect(analyser);
    analyser.connect(distortion);
    distortion.connect(audioCtx.destination);

    analyser.fftSize = 2048;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    const canvas = document.querySelector('canvas');
    const canvasCtx = canvas.getContext('2d');
    const colorList = getColorSpectrum(bufferLength);
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;

    // let minData = new Uint8Array(bufferLength);
    let barCount = 32;
    let minData = new Uint8Array(barCount);

    minData.fill(1024);

    function draw() {
        let drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        
       

        let sliceWidth = WIDTH / bufferLength;
        let x = 0;
        let y = 0;
        let barIndex = 0;
        for(let i = 0; i < bufferLength; i++) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, y);

            
            let v = dataArray[i] / 128.0;

            if(drawVisual%2 === 0){
                if(i%(bufferLength/barCount) === 0){
                    barIndex = i/bufferLength*barCount;

                    let beforeMin = minData[barIndex];
                    for(let j=0;j<bufferLength/barCount;j++){
                        if(minData[barIndex] > dataArray[i+j]){
                            minData[barIndex] = dataArray[i+j];
                        }
                    }

                    if(beforeMin <= minData[barIndex]){
                        minData[barIndex] += 5;
                    }
                }
            }

            y = v * HEIGHT/2;
    
            x += sliceWidth;
            
            canvasCtx.lineTo(x, y);
            
            let color = colorList[i];

            
            canvasCtx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            canvasCtx.stroke();
        }

        if(drawVisual%2 === 0){
            let barWidth = WIDTH / barCount;
            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            x=0;
            for(let i=0;i<barCount;i++) {
                let barHeight = (minData[i]/128) * HEIGHT/2;;
        
                
                

                canvasCtx.fillRect(x,barHeight,barWidth,2);
        
                x += barWidth;
            }
        }
    }

    $playBtn.addEventListener('click',function(){
        if(audioCtx.state === 'suspended'){
            audioCtx.resume();
        }

        $audioEl.play();
        draw();
        
    })

}