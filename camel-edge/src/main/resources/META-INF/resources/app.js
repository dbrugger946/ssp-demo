// Set constraints for the video stream
var constraints = { video: { facingMode: "user" }, audio: false };
var track = null;

// grab checkbox
var checkboxAlgo = document.getElementById("algo--checkbox");
// results algo textarea
var textareaResults = document.getElementById("algo--results");


//MQTT client Unique ID
let uid = Date.now().toString(36) + Math.random().toString(36).substr(2)
let mqttTopic         = "detection/" + uid;
let mqttTopicResponse =  "response/"+mqttTopic;

let clientMqtt;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),

    btnHttp = document.querySelector("#protocol--http"),
    btnMqtt = document.querySelector("#protocol--mqtt"),

    filePicker = document.querySelector("#fileInput");

// Access the device camera and stream to cameraView
function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
}

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;

    // fwidth = 400
    // factor = fwidth/cameraSensor.width
    // fheight = cameraSensor.height * factor

    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    // cameraSensor.getContext("2d").drawImage(cameraView, 0, 0, fwidth, fheight);
    cameraOutput.src = cameraSensor.toDataURL("image/jpeg");
    cameraOutput.classList.add("taken");

    btnHttp.hidden = false
    btnMqtt.hidden = false

    // sendHttp(cameraOutput.src)
    // track.stop();
};

function resizeImage(base64Str) {

    var img = new Image();
    img.src = base64Str;
    var canvas = document.createElement('canvas');
    var MAX_WIDTH = 400;
    var MAX_HEIGHT = 350;
    var width = img.width;
    var height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg");
  }


// check if checkbox for show algo results is selected
// show/hide results textarea
checkboxAlgo.onclick = function() {
    if (checkboxAlgo.checked == true) {
        textareaResults.style.display = "block";
    } else {
        textareaResults.style.display = "none";
     }
    
}

// Send via HTTP when the button is tapped
btnHttp.onclick = function() {
    sendHttp(cameraOutput.src)
};

// Send via MQTT when the button is tapped
btnMqtt.onclick = function() {
    sendMqtt(cameraOutput.src)
};


// called when the MQTT client connects
function onConnect() {
    console.log("MQTT: connected to broker");
    clientMqtt.onMessageArrived = onMessageArrived;
    clientMqtt.subscribe(mqttTopicResponse, 1);
}

function onConnectionLost(responseObject){
    console.log("MQTT: connection lost");
}

function onFailure(responseObject){
    console.log("MQTT: failure");
}

function onMessageArrived(msg){
    console.log("MQTT message: "+msg.payloadString);

    let process = JSON.parse(msg.payloadString)

    // let process = {
    //     origin: "mqtt",
    //     valid: true,
    //     // valid: false,
    //     price: 500
    // }

    //console.log("MQTT message: "+process.origin);

    displayPrice(process.item+": "+process.price)

    // always separate out the algo results
    // user desides if they want to see them
    pullAlgoResults(process.detections);

}


fileInput.onchange= function(event) {

	// var image = document.getElementById('outputHttp');
	// image.src = URL.createObjectURL(event.target.files[0]);
	
    file = event.target.files[0];

    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {


        cameraOutput.src = reader.result;
 
        cameraSensor.getContext("2d").drawImage(cameraOutput, 0, 0);


        cameraOutput.classList.add("taken");
    
        btnHttp.hidden = false
        btnMqtt.hidden = false

    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };

	// sendHttp(event.target.files[0]);

    // viaMqtt(event)
}


function sendHttp(srcImage) {
  
    const Http = new XMLHttpRequest();
    const url=window.origin+"/detection"

    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    reduced = resizeImage(srcImage)
    Http.send(JSON.stringify({ "image": reduced.replace("data:image/jpeg;base64,", "")}));

    Http.onreadystatechange = function() {
        textareaResults.innerHTML = "";
        textareaResults.scrollTop;
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseText)
            displayPrice(Http.responseText)
        }
    }	
}

  const formatter = Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function pullAlgoResults(algoResults){

    textareaResults.innerHTML = "";
    textareaResults.scrollTop;
    
    for (var i=0; i < algoResults.length ; i++ ) {
        var label = algoResults[i].label;
        var score = algoResults[i].score;

        //console.log(label);
        //console.log(score);

        textareaResults.innerHTML += formatter.format(score) + " : " + label + '\r\n';
    }
    //console.log("algoResults:" + algoResults);

}


function displayPrice(price){

    var tag = document.getElementById("price--tag")
    tag.innerHTML = price
    tag.classList.add("fade-out")

    var cleanfader=setInterval(removeFader, 5000);
    function removeFader()
    {
        tag.classList.remove("fade-out")
        clearInterval(cleanfader);
    }
}

function sendMqtt(srcImage) {
    reduced = resizeImage(srcImage)
    // jsonMsg = JSON.stringify({ "image": srcImage.replace("data:image/jpeg;base64,", "")})
    jsonMsg = JSON.stringify({ "image": reduced.replace("data:image/jpeg;base64,", "")})
    message = new Paho.MQTT.Message(jsonMsg);
    // message.destinationName = "detection/"+uid;
    message.destinationName = mqttTopic;
    clientMqtt.send(message);
    console.log("MQTT message sent.")
}


// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);



var brokerHost = window.location.hostname.replace("camel-edge", "broker-amq-mqtt")
var brokerPort = window.location.port 
const brokerUrl=window.location.href+"/test"

var brokerOptions = null

//For local testing: when loading the page directly on the browser
if (brokerHost == ""){
    brokerHost = "localhost"
    brokerPort = "8080"
}

//For local testing  -- or may need to set brokerPort = "1883"
if (brokerPort == "8080"){
	brokerPort = "61616"
	brokerOptions = {onSuccess:onConnect}
}
else{
	brokerPort = "443"
	brokerOptions = {useSSL:true,onSuccess:onConnect, onFailure:onFailure}
}


// let uid = Date.now().toString(36) + Math.random().toString(36).substr(2)

// Create a client instance
clientMqtt = new Paho.MQTT.Client(brokerHost, Number(brokerPort), "CameraClient-"+uid);

// set callback handlers
// client.onConnectionLost = onConnectionLost;
// client.onMessageArrived = onMessageArrived;

// connect the client
clientMqtt.connect(brokerOptions);

const interval = setInterval(function() {

    // console.log("checking connectivity")
    var status = document.querySelector("#mqtt-status");

    if(clientMqtt.isConnected()){
        status.style.color = 'lightgreen';
        status.parentElement.disabled=false
    }
    else{
        status.style.color = 'red';
        status.parentElement.disabled=true
        //somehow this field is automatically created on first connect
        //we need to remove it, otherwise it won't reconnect.
        delete brokerOptions.mqttVersionExplicit
        clientMqtt.connect(brokerOptions);
    }
    // method to be executed;
}, 1000);
