import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* --------------------
   FIREBASE CONFIG
-------------------- */

const firebaseConfig = {
    apiKey: "DIN_API_KEY",
    authDomain: "DITT_PROSJEKT.firebaseapp.com",
    projectId: "DITT_PROSJEKT",
    storageBucket: "DITT_PROSJEKT.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "DIN_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* --------------------
   GAME VARIABLES
-------------------- */

let cardsData = [];

let selectedLeft = null;
let selectedRight = null;

let matches = 0;

let seconds = 0;
let timer = null;

let currentGameId = null;

const leftColumn = document.getElementById("leftColumn");
const rightColumn = document.getElementById("rightColumn");
const winner = document.getElementById("winner");

/* --------------------
   HELPERS
-------------------- */

function shuffle(array) {

    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function startTimer() {

    clearInterval(timer);

    seconds = 0;

    document.getElementById("timer").textContent =
        "Tid: 0 s";

    timer = setInterval(() => {

        seconds++;

        document.getElementById("timer").textContent =
            `Tid: ${seconds} s`;

    }, 1000);
}

/* --------------------
   LOAD GAME FROM FIREBASE
-------------------- */

async function loadGame(gameId) {

    try {

        currentGameId = gameId;

        matches = 0;

        selectedLeft = null;
        selectedRight = null;

        winner.textContent = "";

        const docRef = doc(db, "cardsets", gameId);

        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {

            alert("Fant ikke spill-ID");

            return;
        }

        const gameData = docSnap.data();

        cardsData = gameData.cards;

        buildBoard();

        startTimer();

    } catch (error) {

        console.error(error);

        alert("Kunne ikke laste spillet.");
    }
}

/* --------------------
   BUILD BOARD
-------------------- */

function buildBoard() {

    leftColumn.innerHTML = "";
    rightColumn.innerHTML = "";

    const leftCards = shuffle(cardsData);
    const rightCards = shuffle(cardsData);

    leftCards.forEach(item => {

        const card = document.createElement("div");

        card.className = "card";
        card.textContent = item.left;

        card.addEventListener("click", () => {
            selectLeft(card, item);
        });

        leftColumn.appendChild(card);
    });

    rightCards.forEach(item => {

        const card = document.createElement("div");

        card.className = "card";
        card.textContent = item.right;

        card.addEventListener("click", () => {
            selectRight(card, item);
        });

        rightColumn.appendChild(card);
    });
}

/* --------------------
   SELECTION
-------------------- */

function clearSelections() {

    document
        .querySelectorAll(".selected")
        .forEach(card =>
            card.classList.remove("selected")
        );

    selectedLeft = null;
    selectedRight = null;
}

function selectLeft(card, item) {

    document
        .querySelectorAll("#leftColumn .selected")
        .forEach(c =>
            c.classList.remove("selected")
        );

    card.classList.add("selected");

    selectedLeft = {
        card,
        item
    };

    checkMatch();
}

function selectRight(card, item) {

    document
        .querySelectorAll("#rightColumn .selected")
        .forEach(c =>
            c.classList.remove("selected")
        );

    card.classList.add("selected");

    selectedRight = {
        card,
        item
    };

    checkMatch();
}

/* --------------------
   MATCH CHECK
-------------------- */

function checkMatch() {

    if (!selectedLeft || !selectedRight) {
        return;
    }

    const correct =
        selectedLeft.item.left ===
        selectedRight.item.left;

    if (correct) {

        selectedLeft.card.classList.add("correct");
        selectedRight.card.classList.add("correct");

        setTimeout(() => {

            selectedLeft.card.classList.add("hidden");
            selectedRight.card.classList.add("hidden");

            matches++;

            if (matches === cardsData.length) {

                clearInterval(timer);

                winner.textContent =
                    `🎉 Ferdig! Tid: ${seconds} sekunder`;
            }

            clearSelections();

        }, 300);

    } else {

        setTimeout(() => {
            clearSelections();
        }, 300);
    }
}

/* --------------------
   BUTTONS
-------------------- */

document
    .getElementById("startBtn")
    .addEventListener("click", () => {

        const gameId =
            document.getElementById("gameId")
                .value
                .trim();

        if (!gameId) {

            alert("Skriv inn spill-ID");

            return;
        }

        loadGame(gameId);
    });

document
    .getElementById("restartBtn")
    .addEventListener("click", () => {

        if (currentGameId) {
            loadGame(currentGameId);
        }
    });
