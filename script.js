const { shell } = require('electron');
const chatbox = document.getElementById('chat')
const textinput = document.getElementById('textinput')
const sendbtn = document.getElementById('sendbtn')
let iswritting = false
let lasterrormensaje = ''
let chatlenght = 0
let chatjson = localStorage.getItem("chat")
let chathistory = JSON.parse(chatjson) || []

//get saved data
let darklight;
if (localStorage.getItem("darklight")) {
  darklight = localStorage.getItem("darklight");
} else {
  darklight = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function ClearChat() {
    document.getElementById('presentation').style.display = 'block'
    document.getElementById('chat').style.display = 'none'
    document.getElementById('reload').style.display = 'none'
    document.getElementById('stop').style.display = 'none'
    chatbox.innerHTML = ''
    textinput.value = ''
    sendbtn.disabled = false
    chathistory = []
    let jsonChathistory = JSON.stringify(chathistory);
    localStorage.setItem("chat", jsonChathistory)
}

function SendMensaje() {
    text = textinput.value
    if(iswritting == true)
    return
    if (text.length >= 2) {
        document.getElementById('reload').style.display = 'none'
        document.getElementById('stop').style.display = 'none'
        document.getElementById('textinput').value = ''
        if (chatlenght == 0) {
            document.getElementById('presentation').style.display = 'none'
            document.getElementById('chat').style.display = 'block'
        }
        chatbox.innerHTML += '<div class="usermensaje"><div></div><p>'+text+'</p></div>'
        chatbox.innerHTML += '<div class="loadingmensaje"><div></div><p>Cargando...</p></div>'
        let miDiv = document.getElementById('chat');
        let ultimoElemento = miDiv.lastElementChild;
        ultimoElemento.scrollIntoView({ behavior: 'smooth' });
        let newMensaje = {"role": "user", "content": text}
        chathistory.push(newMensaje)
        let jsonChathistory = JSON.stringify(chathistory);
        document.getElementById('sendbtn').disabled = true;
        iswritting = true;
        //hace la peticion a OpenAI
        let ip
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                ip = data;
                fetch('https://oceanaiserver.onrender.com/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body:JSON.stringify({
                        'mensajes': chathistory || '',
                        'ip': ip || ''
                    })
                });
            });

        
        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': '88bca816afmsheec10f6037e665cp10974djsn7b5472f00fee',
                'X-RapidAPI-Host': 'openai80.p.rapidapi.com'
            },
            body: '{"model":"gpt-3.5-turbo","messages":'+jsonChathistory+'}'
        };
        
        fetch('https://openai80.p.rapidapi.com/chat/completions', options)
            .then(response => response.json())
            .then(response => {
                let lastElement = chatbox.lastElementChild
                chatbox.removeChild(lastElement)
                if (response.info) {
                    ShowErrorMensaje(response, text)
                }else if (response.message == 'You have exceeded the rate limit per second for your plan, BASIC, by the API provider'){
                    ShowErrorMensaje(response, text)
                }else{
                    ShowMensaje(response)
                }
            })
            .catch(err => {
                sendbtn.disabled = false;
                iswritting = false;
                ShowErrorMensaje(err, text)
            });

    }
}

function ShowMensaje(response) {
            document.getElementById('reload').style.display = 'none'
            document.getElementById('stop').style.display = 'flex'
            haserror = false
            let responseText = response.choices[0].message.content.trim()
            chatbox.innerHTML += '<div class="botmensaje"><div></div><p class="botmensaje-content"></p></div>'
            let botmensajecontent = document.querySelector(".botmensaje-content")
            let index = 0;
            let time = setInterval(function() {
            botmensajecontent.innerHTML += responseText[index];
            index++;
            if (index > responseText.length - 1) {
                clearInterval(time);
                botmensajecontent.classList.remove('botmensaje-content')
                sendbtn.disabled = false;
                iswritting = false;
                document.getElementById('reload').style.display = 'flex'
                document.getElementById('stop').style.display = 'none'
            }
            document.getElementById('stop').addEventListener("click", (event) => {
                clearInterval(time);
                botmensajecontent.classList.remove('botmensaje-content')
                sendbtn.disabled = false;
                iswritting = false;
                document.getElementById('reload').style.display = 'flex'
                document.getElementById('stop').style.display = 'none'
            })
            }, 50);
            let newMensaje = {"role": "assistant", "content": responseText}
            chathistory.push(newMensaje)
            let jsonChathistory = JSON.stringify(chathistory);
            localStorage.setItem("chat", jsonChathistory)
}
function ShowErrorMensaje(err, text) {
    document.getElementById('reload').style.display = 'flex'
    document.getElementById('stop').style.display = 'none'
    haserror = true
    lasterrormensaje = chathistory.pop()

    if (err == 'TypeError: Failed to fetch') {
        chatbox.innerHTML += '<div class="errmensaje"><div></div><p>Ha ocurrido un error de conexion</p></div>'
    }else if (err.message == 'You have exceeded the rate limit per second for your plan, BASIC, by the API provider'){
        chatbox.innerHTML += '<div class="errmensaje"><div></div><p>Estas enviando mensajes muy rapido, espera unos segundos y vuelve a intentarlo</p></div>'
    }else if(err.info){
        errInf = err.info
        chatbox.innerHTML += '<div class="errmensaje"><div></div><p>Ha ocurrido un error: '+errInf+'</p></div>'
    }else{
        chatbox.innerHTML += '<div class="errmensaje"><div></div><p>Ha ocurrido un error: ('+err+')</p></div>'
    }
    document.getElementById("errbtn").addEventListener("click", RetrySendMensaje);
    sendbtn.disabled = false;
    iswritting = false;
    let jsonChathistory = JSON.stringify(chathistory);
    localStorage.setItem("chat", jsonChathistory)
}

function RetrySendMensaje() {
    if (lasterrormensaje != '') {
        textinput.value = lasterrormensaje.content
    } else {
        let length = chathistory.length
        textinput.value = chathistory[length-2].content
    }
    SendMensaje()
}

function ChangeTheme(change) {
        if (darklight == 'false' || darklight == false) {
            document.getElementById('thememode').href = 'css/darkmode.css'
            let miDiv = document.getElementById("reload");
            miDiv.querySelector("img").src = 'img/reload.png';
            miDiv = document.getElementById("stop");
            miDiv.querySelector("img").src = 'img/stop-button.png';
            miDiv = document.getElementById("mainlogo").src = 'img/logo.png';
            document.getElementById("modetheme").innerHTML = '<img src="img/sol.png"><p> Cambiar a Modo Luz</p>';
            darklight = true
            localStorage.setItem("darklight", true)
        } else {
            document.getElementById('thememode').href = 'css/lightmode.css'
            let miDiv = document.getElementById("reload");
            miDiv.querySelector("img").src = 'img/reload dark.png';
            miDiv = document.getElementById("stop");
            miDiv.querySelector("img").src = 'img/stop-button dark.png';
            miDiv = document.getElementById("mainlogo").src = 'img/logodark.png';
            document.getElementById("modetheme").innerHTML = '<img src="img/moon.png"><p> Cambiar a Modo Oscuro</p>';
            darklight = false
            localStorage.setItem("darklight", false)
        }
}

sendbtn.addEventListener("click", SendMensaje)
document.getElementById('clearchat').addEventListener("click", ClearChat)
document.getElementById('reload').addEventListener("click", RetrySendMensaje)
document.getElementById('modetheme').addEventListener("click", ChangeTheme)
document.getElementById('web').addEventListener("click", (event) => {
    shell.openExternal('https://oceangamer.github.io/AI');
})
document.addEventListener("keydown", (event) => { 
    if(event.key === 'Enter' && !event.shiftKey){
        event.preventDefault();
        SendMensaje()
    }
});



window.onload = function() {
    if (darklight == 'true' || darklight == true) {
        document.getElementById('thememode').href = 'css/darkmode.css'
    } else {
        document.getElementById('thememode').href = 'css/lightmode.css'
        let miDiv = document.getElementById("reload");
        miDiv.querySelector("img").src = 'img/reload dark.png';
        miDiv = document.getElementById("stop");
        miDiv.querySelector("img").src = 'img/stop-button dark.png';
        miDiv = document.getElementById("stop");
        miDiv.querySelector("img").src = 'img/stop-button dark.png';
        miDiv = document.getElementById("mainlogo").src = 'img/logodark.png';
        document.getElementById("modetheme").innerHTML = '<img src="img/moon.png"><p> Cambiar a Modo Oscuro</p>';
    }
    if(chatjson == '[]' || chatjson == null || chatjson == ""){
        document.getElementById('presentation').style.display = 'block'
        document.getElementById('chat').style.display = 'none'
        document.getElementById('reload').style.display = 'none'
        document.getElementById('stop').style.display = 'none'
        
    }else{
        document.getElementById('presentation').style.display = 'none'
        document.getElementById('chat').style.display = 'block'
        document.getElementById('stop').style.display = 'none'
        chathistory.forEach(chatmensaje => {
            if (chatmensaje.role == 'user') {
                chatbox.innerHTML += '<div class="usermensaje"><div></div><p>'+chatmensaje.content+'</p></div>'
            }else{
                chatbox.innerHTML += '<div class="botmensaje"><div></div><p>'+chatmensaje.content+'</p></div>'
            }
            let miDiv = document.getElementById('chat');
            let ultimoElemento = miDiv.lastElementChild;
            ultimoElemento.scrollIntoView({ behavior: 'smooth' });
        });
    }
};