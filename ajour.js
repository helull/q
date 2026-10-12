import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
}
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

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

let currentGameId = null;
let allCollections = [];

loadCollections();

document
    .getElementById("searchBox")
    .addEventListener(
        "input",
        renderCollections
    );

async function loadCollections(){

    allCollections = [];

    const snapshot =
        await getDocs(
            collection(db,"cardsets")
        );

    snapshot.forEach(docSnap => {

        allCollections.push({

            id: docSnap.id,

            title:
                docSnap.data().title
                || docSnap.id
        });

    });

    allCollections.sort(
        (a,b) =>
        a.title.localeCompare(b.title)
    );

    renderCollections();
}

function renderCollections(){

    const filter =

        document
        .getElementById("searchBox")
        .value
        .trim()
        .toLowerCase();

    const list =

        document
        .getElementById(
            "collectionsList"
        );

    list.innerHTML = "";

    allCollections

        .filter(set =>

            set.title
            .toLowerCase()
            .includes(filter)

            ||

            set.id
            .toLowerCase()
            .includes(filter)

        )

        .forEach(set => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "collection-item";

            div.innerHTML =
                `
                <strong>
                    ${set.title}
                </strong>
                <br>
                <small>
                    ${set.id}
                </small>
                `;

            div.onclick =
                () =>
                loadCards(set.id);

            list.appendChild(div);

        });
}

async function loadCards(gameId){

    currentGameId = gameId;

    const gameDoc =
        await getDoc(
            doc(
                db,
                "cardsets",
                gameId
            )
        );

    const title =

        gameDoc.exists()
            ? gameDoc.data().title
            : gameId;

    const header =

        document.getElementById(
            "datasetHeader"
        );

    header.innerHTML = `

        <h2>${title}</h2>

        <div class="header-buttons">

            <button
                class="pdf-btn"
                id="pdfBtn"
            >

                Last ned PDF av kortstokk

            </button>

            <button
                class="remove-set-btn"
                id="deleteSetBtn"
            >

                Slett  kortstokk

            </button>

        </div>
    `;

    document
        .getElementById("pdfBtn")
        .onclick =
        generatePdf;

    document
        .getElementById("deleteSetBtn")
        .onclick =
        deleteCollection;

    const container =
        document.getElementById(
            "cardContainer"
        );

    container.innerHTML = "";

    const cardsSnapshot =
        await getDocs(
            collection(
                db,
                "cardsets",
                gameId,
                "cards"
            )
        );

    cardsSnapshot.forEach(cardDoc => {

        const card =
            cardDoc.data();

        const cardDiv =
            document.createElement(
                "div"
            );

        cardDiv.className =
            "card";

        cardDiv.innerHTML = `

            <label>
                Forside
            </label>

            <textarea class="q">
${card.left}
            </textarea>

            <label>
                Bakside
            </label>

            <textarea class="a">
${card.right}
            </textarea>

            <div class="card-buttons">

                <button
                    class="save-btn"
                >
                    Lagre
                </button>

                <button
                    class="delete-btn"
                >
                    Slett
                </button>

            </div>
        `;

        container.appendChild(
            cardDiv
        );

        const saveBtn =
            cardDiv.querySelector(
                ".save-btn"
            );

        const deleteBtn =
            cardDiv.querySelector(
                ".delete-btn"
            );

        saveBtn.onclick =
            async () => {

            await updateDoc(

                doc(
                    db,
                    "cardsets",
                    gameId,
                    "cards",
                    cardDoc.id
                ),

                {

                    left:
                        cardDiv
                        .querySelector(".q")
                        .value
                        .trim(),

                    right:
                        cardDiv
                        .querySelector(".a")
                        .value
                        .trim()
                }
            );

            saveBtn.textContent =
                "Lagret";

            setTimeout(
                () =>
                saveBtn.textContent =
                    "Lagre",
                1000
            );
        };

        deleteBtn.onclick =
            async () => {

            if(
                !confirm(
                    "Slette kortet?"
                )
            ){
                return;
            }

            await deleteDoc(

                doc(
                    db,
                    "cardsets",
                    gameId,
                    "cards",
                    cardDoc.id
                )
            );

            loadCards(gameId);
        };
    });
}

async function deleteCollection(){

    if(!currentGameId){
        return;
    }

    if(
        !confirm(
            "Slette hele kortsettet?"
        )
    ){
        return;
    }

    const cardsSnapshot =
        await getDocs(
            collection(
                db,
                "cardsets",
                currentGameId,
                "cards"
            )
        );

    for(
        const cardDoc
        of cardsSnapshot.docs
    ){

        await deleteDoc(
            cardDoc.ref
        );
    }

    await deleteDoc(

        doc(
            db,
            "cardsets",
            currentGameId
        )
    );

    document
        .getElementById(
            "datasetHeader"
        )
        .innerHTML = "";

    document
        .getElementById(
            "cardContainer"
        )
        .innerHTML = "";

    loadCollections();
}

async function generatePdf(){

    if(!currentGameId){
        return;
    }

    const cardsSnapshot =
        await getDocs(
            collection(
                db,
                "cardsets",
                currentGameId,
                "cards"
            )
        );

    const cards = [];

    cardsSnapshot.forEach(doc => {

        cards.push(
            doc.data()
        );

    });

    if(cards.length === 0){

        alert(
            "Ingen kort."
        );

        return;
    }

    const { jsPDF } =
        window.jspdf;

    const pdf =
        new jsPDF({

            orientation:
                "landscape",

            unit:
                "mm",

            format:
                "a4"
        });

    const cardW = 95;
    const cardH = 90;

    const positions = [

        [5,10],
        [101,10],
        [197,10],

        [5,105],
        [101,105],
        [197,105]
    ];

    let index = 0;

    while(
        index < cards.length
    ){

        const pageCards =
            cards.slice(
                index,
                index + 6
            );

        if(index > 0){
            pdf.addPage();
        }

        pageCards.forEach(
            (card,i) => {

            const pos =
                positions[i];

            pdf.rect(
                pos[0],
                pos[1],
                cardW,
                cardH
            );

            pdf.setFontSize(16);

            pdf.text(

                pdf.splitTextToSize(
                    card.left,
                    80
                ),

                pos[0] + 8,
                pos[1] + 20
            );
        });

        pdf.addPage();

        const order =
            [2,1,0,5,4,3];

        order.forEach(
            (originalIndex,newIndex) => {

            if(
                !pageCards[
                    originalIndex
                ]
            ){
                return;
            }

            const card =
                pageCards[
                    originalIndex
                ];

            const pos =
                positions[
                    newIndex
                ];

            pdf.rect(
                pos[0],
                pos[1],
                cardW,
                cardH
            );

            pdf.setFontSize(16);

            pdf.text(

                pdf.splitTextToSize(
                    card.right,
                    80
                ),

                pos[0] + 8,
                pos[1] + 20
            );
        });

        index += 6;
    }

    pdf.save(
        currentGameId +
        ".pdf"
    );
}
