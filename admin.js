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

function parseCards(text) {

    text = text.trim();

    const cards = [];

    /* -----------------------
       FORMAT 1
       spørsmål|svar
    ----------------------- */

    if (text.includes("|")) {

        text.split("\n").forEach(line => {

            const parts = line.split("|");

            if (parts.length >= 2) {

                cards.push({
                    left: parts[0].trim(),
                    right: parts.slice(1).join("|").trim()
                });
            }
        });

        if (cards.length > 0) {
            return cards;
        }
    }

    /* -----------------------
       FORMAT 2
       spørsmål - svar
    ----------------------- */

    const dashCards = [];

    text.split("\n").forEach(line => {

        if (line.includes(" - ")) {

            const parts = line.split(" - ");

            if (parts.length >= 2) {

                dashCards.push({
                    left: parts[0].trim(),
                    right: parts.slice(1).join(" - ").trim()
                });
            }
        }
    });

    if (dashCards.length > 0) {
        return dashCards;
    }

    /* -----------------------
       FORMAT 3
       Spørsmål:
       Svar:
    ----------------------- */

    const qaCards = [];

    const lines =
        text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line);

    let question = null;

    for (const line of lines) {

        const lower = line.toLowerCase();

        if (
            lower.startsWith("spørsmål:") ||
            lower.startsWith("question:")
        ) {

            question =
                line.substring(
                    line.indexOf(":") + 1
                ).trim();

            continue;
        }

        if (
            lower.startsWith("svar:") ||
            lower.startsWith("answer:")
        ) {

            const answer =
                line.substring(
                    line.indexOf(":") + 1
                ).trim();

            if (question) {

                qaCards.push({
                    left: question,
                    right: answer
                });

                question = null;
            }
        }
    }

    if (qaCards.length > 0) {
        return qaCards;
    }

    /* -----------------------
       FORMAT 4
       spørsmål

       svar

       spørsmål

       svar
    ----------------------- */

    const blocks =
        text
        .split(/\n\s*\n/)
        .map(b => b.trim())
        .filter(Boolean);

    const blockCards = [];

    for (let i = 0; i < blocks.length - 1; i += 2) {

        blockCards.push({
            left: blocks[i],
            right: blocks[i + 1]
        });
    }

    if (blockCards.length > 0) {
        return blockCards;
    }

    /* -----------------------
       FORMAT 5
       annenhver linje
    ----------------------- */

    const cleanLines =
        text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const pairCards = [];

    for (let i = 0; i < cleanLines.length - 1; i += 2) {

        pairCards.push({
            left: cleanLines[i],
            right: cleanLines[i + 1]
        });
    }

    return pairCards;
}

document
.getElementById("saveBtn")
.addEventListener("click", saveGame);

async function saveGame(){

    const gameId =
        document
        .getElementById("gameId")
        .value
        .trim()
        .toLowerCase();

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

function showPreview() {

    const text =
        document
            .getElementById("sourceText")
            .value;

    const cards =
        parseCards(text);

    const preview =
        document
            .getElementById("preview");

    preview.innerHTML = "";

    if (cards.length === 0) {

        preview.innerHTML =
            "<p>Fant ingen gyldige kort.</p>";

        return;
    }

    preview.innerHTML =
        `<h3>Fant ${cards.length} kort</h3>`;

    cards.forEach((card, index) => {

        preview.innerHTML += `
            <div class="preview-card">
                <div class="preview-question">
                    ${index + 1}. ${card.left}
                </div>

                <div class="preview-answer">
                    ${card.right}
                </div>
            </div>
        `;
    });
}

document
    .getElementById("sourceText")
    .addEventListener("input", showPreview);
