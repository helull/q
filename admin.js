import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    collection,
    addDoc
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyBuBCzDutHiRaueQznBLUZV8gyX_KtPGko",
    authDomain: "quizletformeg.firebaseapp.com",
    projectId: "quizletformeg",
    storageBucket: "quizletformeg.firebasestorage.app",
    messagingSenderId: "9975084319",
    appId: "1:9975084319:web:7c0a0a6802161d1996ac2a"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

function parseCards(text){

    const cards = [];

    const rows = text
        .split("\n")
        .filter(row => row.trim());

    rows.forEach(row => {

        const parts = row.split("|");

        if(parts.length !== 2){
            return;
        }

        cards.push({
            left: parts[0].trim(),
            right: parts[1].trim()
        });
    });

    return cards;
}

document
.getElementById("saveBtn")
.addEventListener("click", saveGame);

async function saveGame(){

    const gameId =
        document
        .getElementById("gameId")
        .value
        .trim();

    const title =
        document
        .getElementById("title")
        .value
        .trim();

    const text =
        document
        .getElementById("sourceText")
        .value;

    if(!gameId){

        alert("Mangler spill-ID");

        return;
    }

    const cards =
        parseCards(text);

    if(cards.length === 0){

        alert(
          "Fant ingen gyldige kort."
        );

        return;
    }

    await setDoc(
        doc(
            db,
            "cardsets",
            gameId
        ),
        {
            title
        }
    );

    for(const card of cards){

        await addDoc(

            collection(
                db,
                "cardsets",
                gameId,
                "cards"
            ),

            {
                left: card.left,
                right: card.right
            }
        );
    }

    document
        .getElementById("status")
        .textContent =
        `✅ Lagret ${cards.length} kort i '${gameId}'`;
}
