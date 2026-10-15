import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    collection,
    getDocs,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyBuBCzDutHiRaueQznBLUZV8gyX_KtPGko",
    authDomain: "quizletformeg.firebaseapp.com",
    projectId: "quizletformeg",
    storageBucket:
    "quizletformeg.firebasestorage.app",
    messagingSenderId: "9975084319",
    appId:
    "1:9975084319:web:7c0a0a6802161d1996ac2a"
};

const app =
initializeApp(firebaseConfig);

const db =
getFirestore(app);

let gameId;
let userId;
let matchId;
let currentMatch;

////////////////////////////////////////////////
// HJELPEFUNKSJONER
////////////////////////////////////////////////

function shuffle(arr){

    for(
        let i = arr.length - 1;
        i > 0;
        i--
    ){

        const j =
        Math.floor(
            Math.random() * (i + 1)
        );

        [arr[i],arr[j]]
        =
        [arr[j],arr[i]];
    }

    return arr;
}

////////////////////////////////////////////////
// REGISTRERING
////////////////////////////////////////////////

document
.getElementById("registerBtn")
.addEventListener(
"click",
registerPlayer
);

async function registerPlayer(){

    gameId =
    document
    .getElementById("gameId")
    .value
    .trim()
    .toLowerCase();

    userId =
    document
    .getElementById("userId")
    .value
    .trim()
    .toLowerCase();

    if(!gameId || !userId){

        alert("Fyll ut feltene");

        return;
    }

    await setDoc(
        doc(db,"players",userId),
        {
            userId,
            gameId,
            online:true
        }
    );

    loadPlayers();
}

////////////////////////////////////////////////
// LAST SPILLERE
////////////////////////////////////////////////

async function loadPlayers(){

    const select =
    document.getElementById(
    "opponentList"
    );

    select.innerHTML =
    "<option value=''>Velg motspiller</option>";

    const snap =
    await getDocs(
        collection(db,"players")
    );

    snap.forEach(player=>{

        const p = player.data();

        if(
            p.userId !== userId &&
            p.gameId === gameId
        ){

            const option =
            document.createElement(
            "option"
            );

            option.value =
            p.userId;

            option.textContent =
            p.userId;

            select.appendChild(
            option
            );
        }

    });
}

////////////////////////////////////////////////
// LAST KORT
////////////////////////////////////////////////

async function loadCards(){

    const cards = [];

    const snap =
    await getDocs(
        collection(
            db,
            "cardsets",
            gameId,
            "cards"
        )
    );

    snap.forEach(card=>{

        cards.push({
            id:card.id,
            ...card.data()
        });

    });

    shuffle(cards);

    return cards.slice(0,6);
}

////////////////////////////////////////////////
// START KAMP
////////////////////////////////////////////////

document
.getElementById("startBtn")
.addEventListener(
"click",
createMatch
);

async function createMatch(){

    const opponent =
    document
    .getElementById(
    "opponentList"
    )
    .value;

    if(!opponent){

        alert("Velg motspiller");

        return;
    }

    const cards =
    await loadCards();

    const docRef =
    await addDoc(
        collection(
            db,
            "matches"
        ),
        {
            player1:userId,
            player2:opponent,

            gameId,

            turn:userId,

            questionOwner:userId,

            score1:0,
            score2:0,

            currentQuestion:null,

            cards
        }
    );

    matchId =
    docRef.id;

    document
    .getElementById(
    "gameArea"
    ).style.display="block";

    listenMatch();
}

////////////////////////////////////////////////
// LISTEN
////////////////////////////////////////////////

function listenMatch(){

    onSnapshot(
        doc(
            db,
            "matches",
            matchId
        ),
        snap=>{

            if(!snap.exists()) return;

            currentMatch =
            snap.data();

            render();

        }
    );
}

////////////////////////////////////////////////
// VISNING
////////////////////////////////////////////////

function render(){

    document
    .getElementById("score1")
    .textContent =
    currentMatch.score1;

    document
    .getElementById("score2")
    .textContent =
    currentMatch.score2;

    const isQuestionPlayer =

    currentMatch.questionOwner
    ===
    userId;

    const questions =
    document.getElementById(
    "questions"
    );

    const answers =
    document.getElementById(
    "answers"
    );

    questions.innerHTML="";
    answers.innerHTML="";

    if(isQuestionPlayer){

        document
        .getElementById("status")
        .textContent =
        "Velg et spørsmål";

        currentMatch.cards
        .forEach(card=>{

            const div =
            makeCard(
                card.left,
                ()=>sendQuestion(card)
            );

            questions.appendChild(div);

        });

    }else{

        document
        .getElementById("status")
        .textContent =
        "Velg riktig svar";

        currentMatch.cards
        .forEach(card=>{

            const div =
            makeCard(
                card.right,
                ()=>answer(card)
            );

            answers.appendChild(div);

        });

    }

    document
    .getElementById(
    "currentQuestion"
    )
    .textContent =

    currentMatch.currentQuestion
        ? currentMatch.currentQuestion.left
        : "";
}

function makeCard(text,action){

    const div =
    document.createElement("div");

    div.className =
    "card";

    div.textContent =
    text;

    div.onclick =
    action;

    return div;
}

////////////////////////////////////////////////
// SEND SPØRSMÅL
////////////////////////////////////////////////

async function sendQuestion(card){

    if(
        currentMatch.questionOwner
        !== userId
    ){
        return;
    }

    await updateDoc(
        doc(
            db,
            "matches",
            matchId
        ),
        {
            currentQuestion:card
        }
    );
}

////////////////////////////////////////////////
// SVAR
////////////////////////////////////////////////

async function answer(card){

    if(
        currentMatch.questionOwner
        === userId
    ){
        return;
    }

    if(
        !currentMatch.currentQuestion
    ){
        return;
    }

    const question =
    currentMatch.currentQuestion;

    let score1 =
    currentMatch.score1;

    let score2 =
    currentMatch.score2;

    if(
        card.right ===
        question.right
    ){

        if(
            currentMatch.questionOwner
            ===
            currentMatch.player1
        ){
            score1++;
        }
        else{
            score2++;
        }
    }

    const remaining =

    currentMatch.cards.filter(
        c => c.id !== question.id
    );

    if(
        remaining.length === 0
    ){

        alert("Spillet er ferdig!");

    }

    const nextOwner =

    currentMatch.questionOwner ===
    currentMatch.player1
        ? currentMatch.player2
        : currentMatch.player1;

    await updateDoc(
        doc(
            db,
            "matches",
            matchId
        ),
        {
            score1,
            score2,

            currentQuestion:null,

            cards:remaining,

            questionOwner:
            nextOwner,

            turn:nextOwner
        }
    );
}
