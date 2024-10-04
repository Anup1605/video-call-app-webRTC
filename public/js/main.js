const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const allUsersHtml = document.getElementById("allusers")
const socket = io();
const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const endCallBtn = document.getElementById("end-call-btn");
let localStream;
let caller=[];


// singleton method for peer connection.
const PeerConnection =(function(){
    let peerConnection;
    const createPeerConnection=()=>{
        const config = {
            iceServers:[
                {
                    urls:"stun:stun.l.google.com:19302"
                }
            ]
        };
        peerConnection = new RTCPeerConnection(config);
        //add local stream to peer connection

        localStream.getTracks().forEach(track=>{
            peerConnection.addTrack(track,localStream)
        })

        //listen to remote stream and add to peer connection
        peerConnection.ontrack = function(event){
            remoteVideo.srcObject = event.streams[0];
        }
        //listen for ice candidate

        peerConnection.onicecandidate = function(event){
            if(event.candidate){
                socket.emit("icecandidate",event.candidate);
            }
        }
        return peerConnection;
    }
    return{
        getInstance:()=>{
           if(!peerConnection){
            peerConnection = createPeerConnection();
           }
           return peerConnection; 
        }
    }

})();


// handel browser evensts 

createUserBtn.addEventListener("click",(e)=>{
   if(username.value !==""){
    const usernameContainer = document.querySelector(".username-input")
    socket.emit("join-user", username.value);
    usernameContainer.style.display ="none";
   }
})

endCallBtn.addEventListener("click",(e)=>{
    socket.emit("call-ended",caller)
})


// handel socket events

socket.on("joined",allusers=>{
    console.log({allusers});

    const createUserHtml =()=>{
        allUsersHtml.innerHTML = "";
    for(const user in allusers){
       const li = document.createElement("li");
       li.textContent =  `${user} ${user===username.value?"(You)":""}`;

       if(user!==username.value){
            const button = document.createElement("button");
            button.classList.add("call-btn");
            button.addEventListener("click",(e)=>{
                startCall(user);
            })
            // Create SVG element using createElementNS
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 512 512");
            svg.setAttribute("width", "20"); // Optional, set width/height as needed
            svg.setAttribute("height", "20");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z");

            svg.appendChild(path); // Append path to the svg
            button.appendChild(svg); // Append svg to the button
        
        

            li.appendChild(button)
            }
            allUsersHtml.appendChild(li);
    }
    }
    createUserHtml();
});

socket.on("offer",async({from,to,offer})=>{
    console.log(offer);
    const pc = PeerConnection.getInstance();
    //set remote description
await pc.setRemoteDescription(offer);
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);
console.log(pc.setLocalDescription(answer));
socket.emit("answer",{from,to,answer:pc.localDescription});
caller = [from,to];
});

socket.on("answer", async({from,to,answer})=>{
const pc = PeerConnection.getInstance();
await pc.setRemoteDescription(answer);

//show call-disconnect btn
endCallBtn.style.display="block";
socket.emit("end-call",{from,to});
caller = [from,to];
});

socket.on("icecandidate",async candidate=>{
    const pc = PeerConnection.getInstance();
    await pc.addIceCandidate (new RTCIceCandidate(candidate))

});

socket.on("end-call",({from,to})=>{
    endCallBtn.style.display="block";
});

socket.on("call-ended",(caller)=>{
    endcall();
})

// start calling method

const startCall=async(user)=>{
console.log({user});
const pc = PeerConnection.getInstance();
const offer = await pc.createOffer();
console.log({offer});
await pc.setLocalDescription(offer);
socket.emit("offer",{from:username.value,to:user,  offer:pc.localDescription});
}

// ending call method

const endcall =()=>{
    const pc = PeerConnection.getInstance();
    if(pc){
       pc.close();
       endCallBtn.style.display="none"; 
    }
}


// initialize app

 const startMyVideo = async ()=>{
    try{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true});
        console.log({stream});
        localStream= stream;
        localVideo.srcObject = stream;
    }catch(error){}
}
startMyVideo();