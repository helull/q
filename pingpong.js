import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    updateDoc,
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    where
}
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

//////////////////////////////////////////////////
//
// FIREBASE
//
//////////////////////////////////////////////////

const firebaseConfig = {

    apiKey: "AIzaSyBuBCzDutHiRaueQznBLUZV8gyX_KtPGko",
    authDomain: "quizletformeg.firebaseapp.com",
    projectId: "quizletformeg",
    storageBucket: "quizletformeg.firebasestorage.app",
    messagingSenderId: "9975084319",
    appId: "1:9975084319:web:7c0a0a6802161d1996ac2a"

};

const app =
initializeApp(firebaseConfig);

const db =
getFirestore(app);

//////////////////////////////////////////////////
//
// STATE
//
//////////////////////////////////////////////////

let userId = "";
let gameId = "";

let myMatchId = null;
let currentMatch = null;

//////////////////////////////////////////////////
//
// JOIN
//
//////////////////////////////////////////////////

document
.getElementById("joinBtn")
.addEventListener(
    "click",
    joinGame
);

async function joinGame(){

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

    setStatus(
        "Søker etter medspiller..."
    );

    await registerWaitingPlayer();

    await tryCreateMatch();

    searchForMatch();
}

//////////////////////////////////////////////////
//
// WAITING PLAYER
//
//////////////////////////////////////////////////

async function registerWaitingPlayer(){

    await setDoc(
        doc(
            db,
            "waitingPlayers",
            userId
        ),
        {
            userId,
            gameId,
            created: Date.now()
        }
    );
}

//////////////////////////////////////////////////
//
// MATCH AUTOMATISK
//
//////////////////////////////////////////////////

async function tryCreateMatch(){

    const waitingSnap =
    await getDocs(
        collection(
            db,
            "waitingPlayers"
        )
    );

    let opponent = null;

    waitingSnap.forEach(player=>{

        const data =
        player.data();

        if(
            data.gameId === gameId &&
            data.userId !== userId &&
            !opponent
        ){
            opponent = data;
        }

    });

    if(!opponent){
        return;
    }

    const cards =
    await loadCards();

    const match =
    {
        gameId,

        player1:userId,
        player2:opponent.userId,

        score1:0,
        score2:0,

        phase:"choose-question",

        questionOwner:userId,

        currentQuestion:null,

        cards,

        winner:null
    };

    const docRef =
    await addDoc(
        collection(
            db,
            "activeMatches"
        ),
        match
    );

    await deleteDoc(
        doc(
            db,
            "waitingPlayers",
            userId
        )
    );

    await deleteDoc(
        doc(
            db,
            "waitingPlayers",
            opponent.userId
        )
    );

    myMatchId =
    docRef.id;
}

//////////////////////////////////////////////////
//
// LOAD CARDS
//
//////////////////////////////////////////////////

function shuffle(arr){

    for(
        let i=arr.length-1;
        i>0;
        i--
    ){

        const j =
        Math.floor(
            Math.random()*(i+1)
        );

        [arr[i],arr[j]] =
        [arr[j],arr[i]];
    }

    return arr;
}

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

//////////////////////////////////////////////////
//
// FINN KAMP
//
//////////////////////////////////////////////////

function searchForMatch(){

    onSnapshot(
        collection(
            db,
            "activeMatches"
        ),
        snapshot=>{

            snapshot.forEach(docSnap=>{

                const data =
                docSnap.data();

                if(
                    data.player1===userId ||
                    data.player2===userId
                ){

                    myMatchId =
                    docSnap.id;

                    currentMatch =
                    data;

                    startRealtimeMatch();

                }

            });

        }
    );
}

//////////////////////////////////////////////////
//
// REALTIME
//
//////////////////////////////////////////////////

function startRealtimeMatch(){

    onSnapshot(

        doc(
            db,
            "activeMatches",
            myMatchId
        ),

        snap=>{

            if(!snap.exists()){
                return;
            }

            currentMatch =
            snap.data();

            renderGame();
        }
    );
}

//////////////////////////////////////////////////
//
// UI
//
//////////////////////////////////////////////////

function setStatus(text){

    document
    .getElementById("status")
    .textContent =
    text;
}

function renderGame(){

    updateScoreboard();

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

    if(
      currentMatch.phase==="game-over"
    ){

        showWinner();

        return;
    }

    const iOwnQuestions =

        currentMatch.questionOwner
        ===
        userId;

    //////////////////////////////////////////////////
    // SPØRSMÅLSEIER
    //////////////////////////////////////////////////

    if(iOwnQuestions){

        setStatus(
            "Velg et spørsmål"
        );

        currentMatch.cards
        .forEach(card=>{

            const div =
            createCard(
                card.left,
                ()=>sendQuestion(card)
            );

            questions.appendChild(
                div
            );
        });

    }

    //////////////////////////////////////////////////
    // SVARSPILLER
    //////////////////////////////////////////////////

    else{

        setStatus(
            "Velg riktig svar"
        );

        currentMatch.cards
        .forEach(card=>{

            const div =
            createCard(
                card.right,
                ()=>sendAnswer(card)
            );

            answers.appendChild(
                div
            );
        });
    }

    document
    .getElementById(
        "selectedQuestion"
    )
    .textContent =

    currentMatch.currentQuestion
        ?
        currentMatch.currentQuestion.left
        :
        "";
}

function createCard(text,action){

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

//////////////////////////////////////////////////
//
// SPØRSMÅL
//
//////////////////////////////////////////////////

async function sendQuestion(card){

    if(
        currentMatch.phase
        !==
        "choose-question"
    ){
        return;
    }

    if(
        currentMatch.questionOwner
        !==
        userId
    ){
        return;
    }

    await updateDoc(

        doc(
            db,
            "activeMatches",
            myMatchId
        ),

        {
            currentQuestion:card,
            phase:"answer-question"
        }

    );
}

//////////////////////////////////////////////////
//
// SVAR
//
//////////////////////////////////////////////////

async function sendAnswer(card){

    if(
        currentMatch.phase
        !==
        "answer-question"
    ){
        return;
    }

    if(
        currentMatch.questionOwner
        === userId
    ){
        return;
    }

    const question =
    currentMatch.currentQuestion;

    if(!question){
        return;
    }

    let {
        score1,
        score2
    } = currentMatch;

    const correct =

        card.right
        ===
        question.right;

    if(correct){

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

    const remainingCards =

        currentMatch.cards.filter(
            c =>
            c.id !== question.id
        );

    if(
        remainingCards.length===0
    ){

        let winner = "Uavgjort";

        if(score1>score2){
            winner =
            currentMatch.player1;
        }

        if(score2>score1){
            winner =
            currentMatch.player2;
        }

        await updateDoc(
            doc(
                db,
                "activeMatches",
                myMatchId
            ),
            {
                score1,
                score2,
                phase:"game-over",
                winner
            }
        );

        return;
    }

    const nextOwner =

        currentMatch.questionOwner
        ===
        currentMatch.player1

        ?

        currentMatch.player2

        :

        currentMatch.player1;

    await updateDoc(

        doc(
            db,
            "activeMatches",
            myMatchId
        ),

        {
            score1,
            score2,

            cards:
            remainingCards,

            currentQuestion:null,

            phase:"choose-question",

            questionOwner:
            nextOwner
        }

    );
}

//////////////////////////////////////////////////
//
// SCORE
//
//////////////////////////////////////////////////

function updateScoreboard(){

    const myScoreEl =
    document.getElementById(
        "myScore"
    );

    const oppScoreEl =
    document.getElementById(
        "opponentScore"
    );

    if(
        currentMatch.player1
        ===
        userId
    ){

        myScoreEl.textContent =
        currentMatch.score1;

        oppScoreEl.textContent =
        currentMatch.score2;
    }
    else{

        myScoreEl.textContent =
        currentMatch.score2;

        oppScoreEl.textContent =
        currentMatch.score1;
    }
}

//////////////////////////////////////////////////
//
// WINNER
//
//////////////////////////////////////////////////

function showWinner(){

    if(
        currentMatch.winner
        ===
        "Uavgjort"
    ){

        setStatus(
            "🤝 Uavgjort"
        );

        return;
    }

    if(
        currentMatch.winner
        ===
        userId
    ){

        setStatus(
            "🏆 Du vant!"
        );
    }
    else{

        setStatus(
            "😢 Du tapte"
        );
    }
}
