import { initializeApp } from
"https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs
}
from
"https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

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

const gameBoard =
    document.getElementById("gameBoard");

let cards = [];

let firstCard = null;
let secondCard = null;

let lockBoard = false;

let matches = 0;

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

        [arr[i],arr[j]] =
            [arr[j],arr[i]];
    }

    return arr;
}

async function loadGame(gameId){

    matches = 0;

    gameBoard.innerHTML = "";

    cards = [];

    const gameRef =
        doc(
            db,
            "cardsets",
            gameId
        );

    const gameDoc =
        await getDoc(gameRef);

    if(!gameDoc.exists()){

        alert("Fant ikke spill");

        return;
    }

    document
        .getElementById("gameTitle")
        .textContent =
        gameDoc.data().title;

    const cardsRef =
        collection(
            db,
            "cardsets",
            gameId,
            "cards"
        );

    const snapshot =
        await getDocs(cardsRef);

    let pairId = 1;

    snapshot.forEach(doc => {

        const data =
            doc.data();

        cards.push({
            pairId,
            type:"question",
            text:data.left
        });

        cards.push({
            pairId,
            type:"answer",
            text:data.right
        });

        pairId++;
    });

    cards = shuffle(cards);

    buildBoard();
}

function buildBoard(){

    gameBoard.innerHTML = "";

    cards.forEach(card => {

        const element =
            document.createElement("div");

        element.className =
            `memory-card ${card.type}`;

        element.innerHTML = `
            <div class="card-inner">

                <div class="card-front">
                    ❓
                </div>

                <div class="card-back">
                    ${card.text}
                </div>

            </div>
        `;

        card.element =
            element;

        element.addEventListener(
            "click",
            () => flipCard(card)
        );

        gameBoard.appendChild(
            element
        );
    });
}

function flipCard(card){

    if(lockBoard) return;

    if(
        card.element.classList.contains(
            "matched"
        )
    ){
        return;
    }

    card.element
        .classList
        .add("flipped");

    if(!firstCard){

        firstCard = card;

        return;
    }

    secondCard = card;

    lockBoard = true;

    checkMatch();
}

function checkMatch(){

    const correct =

        firstCard.pairId ===
        secondCard.pairId

        &&

        firstCard.type !==
        secondCard.type;

    if(correct){

        firstCard.element
            .classList
            .add("matched");

        secondCard.element
            .classList
            .add("matched");

        matches++;

        resetSelection();

        if(
            matches ===
            cards.length / 2
        ){

            document
                .getElementById(
                    "winner"
                )
                .textContent =
                "🎉 Gratulerer!";
        }

    }else{

        setTimeout(() => {

            firstCard.element
                .classList
                .remove("flipped");

            secondCard.element
                .classList
                .remove("flipped");

            resetSelection();

        },1000);
    }
}

function resetSelection(){

    firstCard = null;
    secondCard = null;

    lockBoard = false;
}

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        () => {

            const gameId =

                document
                .getElementById(
                    "gameId"
                )
                .value
                .trim()
                .toLowerCase();

            if(gameId){

                loadGame(gameId);
            }
        }
    );
