import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    setDoc
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

    const gameData =  gameDoc.exists()  ? gameDoc.data()  : {};

    const title =
        gameData.title || "";

    const description =
        gameData.description || "";

    const header =
        document.getElementById(
            "datasetHeader"
        );

    header.innerHTML = `

<div class="dataset-meta">

    <label>Spill-ID</label>

    <input
        id="editGameId"
        value="${gameId}"
    >

    <label>Beskrivelse</label>

    <input
        id="editTitle"
        value="${title}"
    >

    <button id="saveMetaBtn">
        💾 Lagre
    </button>

</div>

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
        Slett kortstokk
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

    document
        .getElementById("saveMetaBtn")
        .onclick =
        saveCollectionInfo;
    
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

function drawCard(
    pdf,
    x,
    y,
    w,
    h,
    text,
    number,
    bannerColor,
    watermark
){

    // Skygge

    pdf.setFillColor(
        220,
        225,
        235
    );

    pdf.roundedRect(
        x + 1,
        y + 1,
        w,
        h,
        4,
        4,
        "F"
    );

    // Kort

    pdf.setFillColor(
        248,
        250,
        252
    );

    pdf.setDrawColor(
        37,
        99,
        235
    );

    pdf.setLineWidth(
        0.8
    );

    pdf.roundedRect(
        x,
        y,
        w,
        h,
        4,
        4,
        "FD"
    );

    // Banner

    pdf.setFillColor(
        ...bannerColor
    );

    pdf.roundedRect(
        x,
        y,
        w,
        8,
        4,
        4,
        "F"
    );

    // Nummer

    pdf.setTextColor(
        255,
        255,
        255
    );

    pdf.setFontSize(10);

/*    pdf.text(
        "#" + number,
        x + 4,
        y + 5.5
    );*/

    // Vannmerke

    pdf.setTextColor(
        235,
        235,
        235
    );

    pdf.setFontSize(24);

    pdf.text(
        watermark,
        x + 15,
        y + 50,
        {
            angle:45
        }
    );

    // Hovedtekst

    pdf.setTextColor(
    30,
    30,
    30
);

pdf.setFont(
    "helvetica",
    "bold"
);

let fontSize = 18;

if(text.length < 40){
    fontSize = 24;
}

if(text.length < 20){
    fontSize = 30;
}

if(text.length > 80){
    fontSize = 14;
}

pdf.setFontSize(fontSize);

const cleanedText =
    text
        .replaceAll("−", "-")
        .replaceAll("=", "  =  ");

const lines =
    pdf.splitTextToSize(
        cleanedText,
        82
    );

const totalHeight =
    lines.length *
    (fontSize * 0.45);

const startY =
    y +
    (h / 2) -
    (totalHeight / 2);

pdf.text(
    lines,
    x + (w / 2),
    startY,
    {
        align:"center"
    }
);
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
    const cardH = 58;

const positions = [

    [5,8],
    [101,8],
    [197,8],

    [5,72],
    [101,72],
    [197,72],

    [5,136],
    [101,136],
    [197,136]
];

    let index = 0;

    while(
        index < cards.length
    ){

        const pageCards =
            cards.slice(
                index,
                index + 9
            );

        if(index > 0){
            pdf.addPage();
        }

        pageCards.forEach(
            (card,i) => {

            const pos =
                positions[i];

            drawCard(
    pdf,
    pos[0],
    pos[1],
    cardW,
    cardH,
    card.left,
    index + i + 1,
    [37,99,235],       // blå
    "SPØRSMÅL"
);
        });

        pdf.addPage();

        const order =
            [2,1,0,5,4,3,8,7,6];

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

  drawCard(
    pdf,
    pos[0],
    pos[1],
    cardW,
    cardH,
    card.right,
    index + originalIndex + 1,
    [34,197,94],       // grønn
    "SVAR"
);

        });

        index += 9;
    }

    pdf.save(
        currentGameId +
        ".pdf"
    );
}

async function saveCollectionInfo(){

    const newGameId =
        document
        .getElementById("editGameId")
        .value
        .trim()
        .toLowerCase();

    const newTitle =
        document
        .getElementById("editTitle")
        .value
        .trim();

    if(!newGameId){

        alert("Spill-ID mangler");

        return;
    }

    //
    // Bare oppdatere beskrivelse
    //

    if(newGameId === currentGameId){

        await updateDoc(

            doc(
                db,
                "cardsets",
                currentGameId
            ),

            {
                title:newTitle
            }

        );

        alert("Lagret");

        loadCollections();

        return;
    }

    //
    // Flytte til ny Spill-ID
    //

    const oldDoc =
        await getDoc(
            doc(
                db,
                "cardsets",
                currentGameId
            )
        );

    if(!oldDoc.exists()){

        alert("Kortstokk finnes ikke");

        return;
    }

    const targetDoc =
        await getDoc(
            doc(
                db,
                "cardsets",
                newGameId
            )
        );

    if(targetDoc.exists()){

        alert(
            "Denne Spill-ID-en finnes allerede"
        );

        return;
    }

    //
    // Opprett nytt sett
    //

    await setDoc(

        doc(
            db,
            "cardsets",
            newGameId
        ),

        {
            ...oldDoc.data(),
            title:newTitle
        }

    );

    //
    // Kopier alle kort
    //

    const cardsSnapshot =
        await getDocs(

            collection(
                db,
                "cardsets",
                currentGameId,
                "cards"
            )

        );

    for(const cardDoc of cardsSnapshot.docs){

        await setDoc(

            doc(
                db,
                "cardsets",
                newGameId,
                "cards",
                cardDoc.id
            ),

            cardDoc.data()

        );

    }

    //
    // Slett gamle kort
    //

    for(const cardDoc of cardsSnapshot.docs){

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

    currentGameId =
        newGameId;

    alert(
        "Spill-ID oppdatert"
    );

    loadCollections();

    loadCards(newGameId);
}
