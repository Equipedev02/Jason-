// ============================================================
// DAVBOT BUSINESS
// APP.JS COMPLET
// Firebase Auth + Realtime Database + Storage
// ============================================================


// ============================================================
// FIREBASE
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    update,
    remove,
    onValue,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


// ============================================================
// CONFIGURATION FIREBASE
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyA24pBo8mBWiZssPtep--MMBd7c8_Lu4U",

    authDomain:
        "starlink-investit.firebaseapp.com",

    databaseURL:
        "https://starlink-investit-default-rtdb.firebaseio.com",

    projectId:
        "starlink-investit"

};


// ============================================================
// INITIALISATION
// ============================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);

const storage =
    getStorage(app);


// ============================================================
// CONFIGURATION BUSINESS
// ============================================================

// ⚠️ À MODIFIER

const ADMIN_EMAIL =
    "djesonaloma@gmail.com";


// Numéro sur lequel l'utilisateur effectue
// sa recharge.

const RECHARGE_NUMBER =
    "0847500590";


// Nombre de points accordés au parrain.

const REFERRAL_POINTS =
    100;


// ============================================================
// OUTILS
// ============================================================

function getPage(){

    return location.pathname
        .split("/")
        .pop()
        .toLowerCase();

}


function $(id){

    return document.getElementById(id);

}


function money(value){

    return Number(
        value || 0
    ).toLocaleString(
        "fr-FR"
    );

}


function dateFormat(timestamp){

    if(!timestamp)
        return "-";

    return new Date(timestamp)
        .toLocaleString("fr-FR");

}


function escapeHTML(value){

    return String(
        value ?? ""
    )
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


function generateReferralCode(){

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(
        let i = 0;
        i < 6;
        i++
    ){

        code +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }

    return "DAVBOT-" + code;

}


function notify(message){

    alert(message);

}


// ============================================================
// AUTHENTIFICATION
// ============================================================


// -----------------------------
// INSCRIPTION
// -----------------------------

const registerForm =
    $("registerForm");

if(registerForm){

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const name =
                $("registerName")?.value.trim();

            const email =
                $("registerEmail")?.value.trim();

            const password =
                $("registerPassword")?.value;

            const confirmation =
                $("registerConfirm")?.value;

            const referral =
                $("registerReferral")?.value
                .trim()
                .toUpperCase();

            const photoInput =
                $("registerPhoto");


            if(!name){

                notify(
                    "Veuillez entrer votre nom."
                );

                return;

            }


            if(!email){

                notify(
                    "Veuillez entrer votre adresse email."
                );

                return;

            }


            if(password.length < 6){

                notify(
                    "Le mot de passe doit contenir au moins 6 caractères."
                );

                return;

            }


            if(password !== confirmation){

                notify(
                    "Les mots de passe ne correspondent pas."
                );

                return;

            }


            try{

                // Création du compte

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    credential.user;


                // Photo

                let photoURL = "";


                if(
                    photoInput &&
                    photoInput.files &&
                    photoInput.files[0]
                ){

                    const file =
                        photoInput.files[0];

                    const fileRef =
                        storageRef(
                            storage,
                            `users/${user.uid}/profile.jpg`
                        );

                    await uploadBytes(
                        fileRef,
                        file
                    );

                    photoURL =
                        await getDownloadURL(
                            fileRef
                        );

                }


                // Code parrain personnel

                const myReferralCode =
                    generateReferralCode();


                // Vérification du parrain

                let referredBy = "";


                if(referral){

                    referredBy =
                        await findUserByReferralCode(
                            referral
                        );

                }


                // Profil

                const userData = {

                    uid:
                        user.uid,

                    name:
                        name,

                    email:
                        email,

                    photoURL:
                        photoURL,

                    referralCode:
                        myReferralCode,

                    referredBy:
                        referredBy || "",

                    balance:
                        0,

                    points:
                        0,

                    totalOrders:
                        0,

                    totalRecharges:
                        0,

                    totalWithdrawals:
                        0,

                    createdAt:
                        Date.now()

                };


                await set(
                    ref(
                        db,
                        `users/${user.uid}`
                    ),
                    userData
                );


                // Attribution des points
                // au propriétaire du code

                if(referredBy){

                    await addReferralPoints(
                        referredBy,
                        user.uid,
                        referral
                    );

                }


                notify(
                    "Compte créé avec succès."
                );


                location.href =
                    "dash.html";


            }catch(error){

                console.error(error);

                notify(
                    firebaseError(error)
                );

            }

        }
    );

}


// -----------------------------
// CONNEXION
// -----------------------------

const loginForm =
    $("loginForm");

if(loginForm){

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                $("loginEmail")?.value.trim();

            const password =
                $("loginPassword")?.value;


            try{

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                location.href =
                    "dash.html";

            }catch(error){

                console.error(error);

                notify(
                    firebaseError(error)
                );

            }

        }
    );

}


// -----------------------------
// DÉCONNEXION
// -----------------------------

const logoutBtn =
    $("logoutBtn");

if(logoutBtn){

    logoutBtn.onclick =
        async () => {

            try{

                await signOut(auth);

                location.href =
                    "index.html";

            }catch(error){

                console.error(error);

            }

        };

}


// ============================================================
// MOT DE PASSE OUBLIÉ
// ============================================================

const forgotPassword =
    $("forgotPassword");

if(forgotPassword){

    forgotPassword.onclick =
        () => {

            const message =
                encodeURIComponent(
                    "Bonjour, j'ai oublié le mot de passe de mon compte. Merci de m'aider à le réinitialiser."
                );

            window.location.href =
                "https://wa.me/243847500590?text=" +
                message;

        };

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        const page =
            getPage();


        const protectedPages = [

            "dash.html",
            "shop.html",
            "profil.html",
            "admin.html"

        ];


        if(!user){

            if(
                protectedPages.includes(page)
            ){

                location.href =
                    "index.html";

            }

            return;

        }


        // Si connecté sur index

        if(
            page === "" ||
            page === "index.html"
        ){

            location.href =
                "dash.html";

            return;

        }


        // Dashboard

        if(
            page === "dash.html"
        ){

            loadDashboard(user);

        }


        // Profil

        if(
            page === "profil.html"
        ){

            loadProfile(user);

        }


        // Boutique

        if(
            page === "shop.html"
        ){

            loadShop(user);

        }


        // Admin

        if(
            page === "admin.html"
        ){

            if(
                user.email !== ADMIN_EMAIL
            ){

                notify(
                    "Accès administrateur refusé."
                );

                await signOut(auth);

                location.href =
                    "index.html";

                return;

            }


            loadAdmin();

        }

    }
);


// ============================================================
// RECHERCHE UTILISATEUR PAR CODE PARRAIN
// ============================================================

async function findUserByReferralCode(code){

    const snapshot =
        await get(
            ref(db,"users")
        );

    if(!snapshot.exists())
        return null;


    const users =
        snapshot.val();


    for(
        const uid in users
    ){

        if(
            users[uid].referralCode === code
        ){

            return uid;

        }

    }


    return null;

}


// ============================================================
// PARRAINAGE
// ============================================================

async function addReferralPoints(
    inviterId,
    newUserId,
    code
){

    if(
        !inviterId ||
        !newUserId
    ){

        return;

    }


    // Transaction pour éviter
    // les problèmes de concurrence.

    await runTransaction(
        ref(
            db,
            `users/${inviterId}/points`
        ),
        current => {

            return Number(
                current || 0
            ) + REFERRAL_POINTS;

        }
    );


    // Historique

    await push(
        ref(
            db,
            `referrals/${inviterId}`
        ),
        {

            referredUser:
                newUserId,

            code:
                code,

            points:
                REFERRAL_POINTS,

            createdAt:
                Date.now()

        }
    );

}


// ============================================================
// DASHBOARD
// ============================================================

function loadDashboard(user){

    const userRef =
        ref(
            db,
            `users/${user.uid}`
        );


    onValue(
        userRef,
        snapshot => {

            if(!snapshot.exists())
                return;


            const data =
                snapshot.val();


            if($("userName"))
                $("userName").textContent =
                    data.name || "Utilisateur";


            if($("balance"))
                $("balance").textContent =
                    money(data.balance);


            if($("points"))
                $("points").textContent =
                    money(data.points);


            if($("orders"))
                $("orders").textContent =
                    money(data.totalOrders);

        }
    );

}


// ============================================================
// PROFIL
// ============================================================

function loadProfile(user){

    const userRef =
        ref(
            db,
            `users/${user.uid}`
        );


    onValue(
        userRef,
        snapshot => {

            if(!snapshot.exists())
                return;


            const data =
                snapshot.val();


            if($("profileName"))
                $("profileName").textContent =
                    data.name || "";


            if($("profileEmail"))
                $("profileEmail").textContent =
                    data.email || "";


            if($("profileBalance"))
                $("profileBalance").textContent =
                    money(data.balance);


            if($("profilePoints"))
                $("profilePoints").textContent =
                    money(data.points);


            if($("referralCode"))
                $("referralCode").textContent =
                    data.referralCode || "";


            if(
                $("profilePhoto") &&
                data.photoURL
            ){

                $("profilePhoto").src =
                    data.photoURL;

            }

        }
    );

}


// ============================================================
// COPIER CODE PARRAIN
// ============================================================

const copyReferral =
    $("copyReferral");

if(copyReferral){

    copyReferral.onclick =
        async () => {

            const code =
                $("referralCode")
                ?.textContent
                ?.trim();


            if(!code)
                return;


            try{

                await navigator
                    .clipboard
                    .writeText(code);

                copyReferral.textContent =
                    "Code copié ✓";


                setTimeout(
                    () => {

                        copyReferral.textContent =
                            "Copier mon code";

                    },
                    1500
                );

            }catch{

                notify(code);

            }

        };

}


// ============================================================
// BOUTIQUE
// ============================================================

async function loadShop(user){

    const container =
        $("products");


    if(!container)
        return;


    onValue(
        ref(db,"products"),
        snapshot => {

            container.innerHTML = "";


            if(!snapshot.exists()){

                container.innerHTML =
                    `
                    <p>
                        Aucun produit disponible.
                    </p>
                    `;

                return;

            }


            const products =
                snapshot.val();


            for(
                const productId in products
            ){

                const product =
                    products[productId];


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "product";


                article.innerHTML = `

                    <img
                        src="${
                            product.image ||
                            "https://via.placeholder.com/500x300"
                        }"
                        alt=""
                    >

                    <div class="content">

                        <h3>
                            ${escapeHTML(
                                product.name
                            )}
                        </h3>

                        <p class="description">
                            ${escapeHTML(
                                product.description || ""
                            )}
                        </p>

                        <div class="price">

                            ${money(
                                product.price
                            )} FC

                        </div>

                        <button class="buy">

                            Commander

                        </button>

                    </div>

                `;


                article
                    .querySelector(".buy")
                    .onclick =
                    () => {

                        createOrder(
                            user.uid,
                            productId,
                            product
                        );

                    };


                container.appendChild(
                    article
                );

            }

        }
    );

}


// ============================================================
// CRÉATION COMMANDE
// ============================================================

async function createOrder(
    uid,
    productId,
    product
){

    try{

        const userSnapshot =
            await get(
                ref(
                    db,
                    `users/${uid}`
                )
            );


        if(!userSnapshot.exists()){

            notify(
                "Utilisateur introuvable."
            );

            return;

        }


        const user =
            userSnapshot.val();


        const price =
            Number(
                product.price || 0
            );


        const balance =
            Number(
                user.balance || 0
            );


        // On vérifie le solde avant
        // d'envoyer la commande.

        if(balance < price){

            notify(
                "Solde insuffisant."
            );

            return;

        }


        // IMPORTANT :
        // Le solde n'est PAS diminué ici.
        //
        // L'admin doit d'abord accepter
        // la commande.


        const orderRef =
            push(
                ref(db,"orders")
            );


        await set(
            orderRef,
            {

                userId:
                    uid,

                userName:
                    user.name || "",

                productId:
                    productId,

                productName:
                    product.name,

                price:
                    price,

                status:
                    "pending",

                createdAt:
                    Date.now()

            }
        );


        notify(
            "Commande envoyée à l'administration."
        );


    }catch(error){

        console.error(error);

        notify(
            "Erreur lors de l'envoi de la commande."
        );

    }

}


// ============================================================
// FORMULAIRE DE RECHARGE
// ============================================================

const rechargeBtn =
    $("rechargeBtn");


if(rechargeBtn){

    rechargeBtn.onclick =
        () => {

            openRechargeModal();

        };

}


// ============================================================
// MODAL RECHARGE
// ============================================================

function openRechargeModal(){

    closeModal();


    const modal =
        document.createElement("div");


    modal.id =
        "davbotRechargeModal";


    modal.innerHTML = `

        <div class="davbot-modal-overlay">

            <div class="davbot-modal">

                <div class="davbot-modal-header">

                    <h2>
                        💰 Recharger mon compte
                    </h2>

                    <button
                        id="closeRecharge"
                        class="davbot-close"
                    >
                        ×
                    </button>

                </div>


                <div class="davbot-number">

                    <small>
                        Numéro de recharge
                    </small>

                    <strong>
                        ${escapeHTML(
                            RECHARGE_NUMBER
                        )}
                    </strong>

                </div>


                <label>
                    Montant
                </label>

                <input
                    id="rechargeAmount"
                    type="number"
                    min="1"
                    placeholder="Ex: 5000"
                >


                <label>
                    ID de transaction
                </label>

                <input
                    id="rechargeTransaction"
                    type="text"
                    placeholder="Ex: TXN123456"
                >


                <p class="davbot-help">

                    Effectuez d'abord le paiement
                    sur le numéro indiqué puis
                    saisissez l'ID de transaction.

                </p>


                <button
                    id="sendRecharge"
                    class="davbot-submit"
                >

                    Envoyer la demande

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    addModalStyle();


    $("closeRecharge")
        .onclick =
        closeModal;


    modal
        .querySelector(
            ".davbot-modal-overlay"
        )
        .onclick =
        event => {

            if(
                event.target.classList
                    .contains(
                        "davbot-modal-overlay"
                    )
            ){

                closeModal();

            }

        };


    $("sendRecharge")
        .onclick =
        sendRechargeRequest;

}


// ============================================================
// ENVOYER RECHARGE
// ============================================================

async function sendRechargeRequest(){

    const amountInput =
        $("rechargeAmount");

    const transactionInput =
        $("rechargeTransaction");


    const amount =
        Number(
            amountInput?.value
        );


    const transactionId =
        transactionInput
            ?.value
            ?.trim();


    if(
        !amount ||
        amount <= 0
    ){

        notify(
            "Entrez un montant valide."
        );

        return;

    }


    if(!transactionId){

        notify(
            "Entrez l'ID de transaction."
        );

        return;

    }


    const user =
        auth.currentUser;


    if(!user){

        notify(
            "Vous devez être connecté."
        );

        return;

    }


    try{

        const requestRef =
            push(
                ref(db,"recharges")
            );


        await set(
            requestRef,
            {

                userId:
                    user.uid,

                email:
                    user.email || "",

                amount:
                    amount,

                rechargeNumber:
                    RECHARGE_NUMBER,

                transactionId:
                    transactionId,

                status:
                    "pending",

                createdAt:
                    Date.now()

            }
        );


        closeModal();


        notify(
            "Votre demande de recharge a été envoyée à l'administration."
        );


    }catch(error){

        console.error(error);

        notify(
            "Impossible d'envoyer la demande."
        );

    }

}


// ============================================================
// MODAL
// ============================================================

function closeModal(){

    const modal =
        $("davbotRechargeModal");


    if(modal){

        modal.remove();

    }

}


// ============================================================
// STYLE MODAL
// ============================================================

function addModalStyle(){

    if(
        $("davbotModalStyle")
    )
        return;


    const style =
        document.createElement("style");


    style.id =
        "davbotModalStyle";


    style.textContent = `

        .davbot-modal-overlay{

            position:fixed;
            inset:0;
            z-index:99999;

            display:flex;
            align-items:center;
            justify-content:center;

            padding:20px;

            background:
                rgba(0,0,0,.72);

            backdrop-filter:
                blur(8px);

        }


        .davbot-modal{

            width:100%;
            max-width:460px;

            background:#061329;

            border:1px solid #1c4b7e;

            border-radius:24px;

            padding:24px;

            color:white;

            box-shadow:
                0 30px 100px
                rgba(0,0,0,.55);

        }


        .davbot-modal-header{

            display:flex;
            align-items:center;
            justify-content:space-between;

            margin-bottom:20px;

        }


        .davbot-modal-header h2{

            font-size:20px;

        }


        .davbot-close{

            width:38px;
            height:38px;

            border:0;

            border-radius:10px;

            background:#132743;

            color:white;

            font-size:25px;

            cursor:pointer;

        }


        .davbot-number{

            padding:16px;

            border-radius:15px;

            background:#071b37;

            border:1px solid #194574;

            margin-bottom:18px;

        }


        .davbot-number small{

            display:block;

            color:#8fa6c7;

            margin-bottom:6px;

        }


        .davbot-number strong{

            color:#42a1ff;

            font-size:20px;

        }


        .davbot-modal label{

            display:block;

            margin:
                14px 0 7px;

            color:#a7bad5;

            font-size:13px;

        }


        .davbot-modal input{

            width:100%;

            padding:14px;

            border-radius:12px;

            border:
                1px solid #1a3b63;

            background:#030d1e;

            color:white;

            outline:none;

        }


        .davbot-modal input:focus{

            border-color:#087cff;

        }


        .davbot-help{

            color:#8fa6c7;

            font-size:12px;

            line-height:1.6;

            margin-top:15px;

        }


        .davbot-submit{

            width:100%;

            border:0;

            padding:15px;

            margin-top:18px;

            border-radius:13px;

            background:
                linear-gradient(
                    135deg,
                    #087cff,
                    #0054ca
                );

            color:white;

            font-weight:800;

            cursor:pointer;

        }

    `;


    document.head.appendChild(
        style
    );

}


// ============================================================
// ADMIN
// ============================================================

async function checkAdmin(){

    const user =
        auth.currentUser;


    if(!user)
        return false;


    return (
        user.email ===
        ADMIN_EMAIL
    );

}


// ============================================================
// CHARGEMENT ADMIN
// ============================================================

function loadAdmin(){

    loadAdminUsers();

    loadAdminOrders();

    loadAdminRecharges();

    loadAdminWithdrawals();

}


// ============================================================
// ADMIN USERS
// ============================================================

function loadAdminUsers(){

    onValue(
        ref(db,"users"),
        snapshot => {

            const table =
                $("usersTable");


            if(!table)
                return;


            table.innerHTML = "";


            let total =
                0;


            if(!snapshot.exists()){

                updateAdminCounter(
                    "adminUsers",
                    0
                );

                return;

            }


            const users =
                snapshot.val();


            for(
                const uid in users
            ){

                total++;


                const user =
                    users[uid];


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            user.name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.email
                        )}
                    </td>

                    <td>
                        ${money(
                            user.balance
                        )} FC
                    </td>

                    <td>
                        ${money(
                            user.points
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.referralCode
                        )}
                    </td>

                    <td>

                        <button
                            class="admin-reset-user"
                        >
                            Réinitialiser
                        </button>

                        <button
                            class="admin-delete-user"
                        >
                            Supprimer
                        </button>

                    </td>

                `;


                row
                    .querySelector(
                        ".admin-reset-user"
                    )
                    .onclick =
                    () => {

                        adminResetPassword(
                            user.email
                        );

                    };


                row
                    .querySelector(
                        ".admin-delete-user"
                    )
                    .onclick =
                    () => {

                        adminDeleteUser(
                            uid,
                            user
                        );

                    };


                table.appendChild(
                    row
                );

            }


            updateAdminCounter(
                "adminUsers",
                total
            );

        }
    );

}


// ============================================================
// ADMIN COMMANDES
// ============================================================

function loadAdminOrders(){

    onValue(
        ref(db,"orders"),
        snapshot => {

            const table =
                $("ordersTable");


            if(!table)
                return;


            table.innerHTML = "";


            let total =
                0;


            if(snapshot.exists()){

                const orders =
                    snapshot.val();


                for(
                    const id in orders
                ){

                    total++;


                    const order =
                        orders[id];


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHTML(
                                order.userName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.productName
                            )}
                        </td>

                        <td>
                            ${money(
                                order.price
                            )} FC
                        </td>

                        <td>
                            ${dateFormat(
                                order.createdAt
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.status
                            )}
                        </td>

                        <td>

                            ${
                                order.status ===
                                "pending"

                                ?

                                `

                                <button
                                    class="admin-approve-order"
                                >
                                    Accepter
                                </button>

                                <button
                                    class="admin-reject-order"
                                >
                                    Refuser
                                </button>

                                `

                                :

                                "-"

                            }

                        </td>

                    `;


                    const approve =
                        row.querySelector(
                            ".admin-approve-order"
                        );


                    const reject =
                        row.querySelector(
                            ".admin-reject-order"
                        );


                    if(approve){

                        approve.onclick =
                            () => {

                                approveOrder(
                                    id,
                                    order
                                );

                            };

                    }


                    if(reject){

                        reject.onclick =
                            () => {

                                rejectOrder(
                                    id
                                );

                            };

                    }


                    table.appendChild(
                        row
                    );

                }

            }


            updateAdminCounter(
                "adminOrders",
                total
            );

        }
    );

}


// ============================================================
// ACCEPTER COMMANDE
// ============================================================

async function approveOrder(
    orderId,
    order
){

    if(
        !confirm(
            "Accepter cette commande ?"
        )
    ){

        return;

    }


    try{

        const userRef =
            ref(
                db,
                `users/${order.userId}`
            );


        const result =
            await runTransaction(
                userRef,
                current => {

                    if(!current)
                        return;


                    const balance =
                        Number(
                            current.balance || 0
                        );


                    const price =
                        Number(
                            order.price || 0
                        );


                    // Solde insuffisant

                    if(
                        balance < price
                    ){

                        return;

                    }


                    current.balance =
                        balance - price;


                    current.totalOrders =
                        Number(
                            current.totalOrders || 0
                        );


                    return current;

                }
            );


        if(!result.committed){

            notify(
                "Commande refusée : solde insuffisant ou utilisateur introuvable."
            );

            return;

        }


        // Commande acceptée

        await update(
            ref(
                db,
                `orders/${orderId}`
            ),
            {

                status:
                    "approved",

                processedAt:
                    Date.now(),

                processedBy:
                    auth.currentUser.uid

            }
        );


        notify(
            "Commande acceptée."
        );


    }catch(error){

        console.error(error);

        notify(
            "Erreur lors de la validation."
        );

    }

}


// ============================================================
// REFUSER COMMANDE
// ============================================================

async function rejectOrder(
    orderId
){

    if(
        !confirm(
            "Refuser cette commande ?"
        )
    ){

        return;

    }


    try{

        await update(
            ref(
                db,
                `orders/${orderId}`
            ),
            {

                status:
                    "rejected",

                processedAt:
                    Date.now(),

                processedBy:
                    auth.currentUser.uid

            }
        );


        notify(
            "Commande refusée."
        );


    }catch(error){

        console.error(error);

    }

}


// ============================================================
// ADMIN RECHARGES
// ============================================================

function loadAdminRecharges(){

    onValue(
        ref(db,"recharges"),
        snapshot => {

            const table =
                $("rechargesTable");


            if(!table)
                return;


            table.innerHTML = "";


            let total =
                0;


            if(!snapshot.exists()){

                updateAdminCounter(
                    "adminRecharges",
                    0
                );

                return;

            }


            const requests =
                snapshot.val();


            for(
                const id in requests
            ){

                total++;


                const request =
                    requests[id];


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            request.email || "-"
                        )}
                    </td>

                    <td>
                        ${money(
                            request.amount
                        )} FC
                    </td>

                    <td>
                        ${escapeHTML(
                            request.rechargeNumber
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.transactionId
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.status
                        )}
                    </td>

                    <td>

                        ${
                            request.status ===
                            "pending"

                            ?

                            `

                            <button
                                class="admin-approve-recharge"
                            >
                                Accepter
                            </button>

                            <button
                                class="admin-reject-recharge"
                            >
                                Refuser
                            </button>

                            `

                            :

                            "-"

                        }

                    </td>

                `;


                const approve =
                    row.querySelector(
                        ".admin-approve-recharge"
                    );


                const reject =
                    row.querySelector(
                        ".admin-reject-recharge"
                    );


                if(approve){

                    approve.onclick =
                        () => {

                            approveRecharge(
                                id,
                                request
                            );

                        };

                }


                if(reject){

                    reject.onclick =
                        () => {

                            rejectRecharge(
                                id
                            );

                        };

                }


                table.appendChild(
                    row
                );

            }


            updateAdminCounter(
                "adminRecharges",
                total
            );

        }
    );

}


// ============================================================
// ACCEPTER RECHARGE
// ============================================================

async function approveRecharge(
    rechargeId,
    request
){

    if(
        !confirm(
            `Ajouter ${money(request.amount)} FC au solde ?`
        )
    ){

        return;

    }


    try{

        const userRef =
            ref(
                db,
                `users/${request.userId}`
            );


        // Transaction

        const result =
            await runTransaction(
                userRef,
                current => {

                    if(!current)
                        return;


                    current.balance =
                        Number(
                            current.balance || 0
                        ) +
                        Number(
                            request.amount || 0
                        );


                    current.totalRecharges =
                        Number(
                            current.totalRecharges || 0
                        ) +
                        Number(
                            request.amount || 0
                        );


                    return current;

                }
            );


        if(!result.committed){

            notify(
                "Utilisateur introuvable."
            );

            return;

        }


        // Important :
        // On change le statut SEULEMENT
        // après modification du solde.

        await update(
            ref(
                db,
                `recharges/${rechargeId}`
            ),
            {

                status:
                    "approved",

                processedAt:
                    Date.now(),

                processedBy:
                    auth.currentUser.uid

            }
        );


        notify(
            "Recharge acceptée. Solde augmenté."
        );


    }catch(error){

        console.error(error);

        notify(
            "Erreur lors de la validation."
        );

    }

}


// ============================================================
// REFUSER RECHARGE
// ============================================================

async function rejectRecharge(
    rechargeId
){

    if(
        !confirm(
            "Refuser cette recharge ?"
        )
    ){

        return;

    }


    try{

        // Aucun changement du solde.

        await update(
            ref(
                db,
                `recharges/${rechargeId}`
            ),
            {

                status:
                    "rejected",

                processedAt:
                    Date.now(),

                processedBy:
                    auth.currentUser.uid

            }
        );


        notify(
            "Recharge refusée. Aucun solde ajouté."
        );


    }catch(error){

        console.error(error);

    }

}


// ============================================================
// ADMIN RETRAITS
// ============================================================

function loadAdminWithdrawals(){

    onValue(
        ref(db,"withdrawals"),
        snapshot => {

            const table =
                $("withdrawalsTable");


            if(!table)
                return;


            table.innerHTML = "";


            let total =
                0;


            if(!snapshot.exists()){

                updateAdminCounter(
                    "adminWithdrawals",
                    0
                );

                return;

            }


            const requests =
                snapshot.val();


            for(
                const id in requests
            ){

                total++;


                const request =
                    requests[id];


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            request.userId
                        )}
                    </td>

                    <td>
                        ${money(
                            request.amount
                        )} FC
                    </td>

                    <td>
                        ${escapeHTML(
                            request.method
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.status
                        )}
                    </td>

                    <td>

                        ${
                            request.status ===
                            "pending"

                            ?

                            `

                            <button
                                class="admin-approve-withdraw"
                            >
                                Accepter
                            </button>

                            <button
                                class="admin-reject-withdraw"
                            >
                                Refuser
                            </button>

                            `

                            :

                            "-"

                        }

                    </td>

                `;


                const approve =
                    row.querySelector(
                        ".admin-approve-withdraw"
                    );


                const reject =
                    row.querySelector(
                        ".admin-reject-withdraw"
                    );


                if(approve){

                    approve.onclick =
                        () => {

                            approveWithdrawal(
                                id,
                                request
                            );

                        };

                }


                if(reject){

                    reject.onclick =
                        () => {

                            rejectWithdrawal(
                                id
                            );

                        };

                }


                table.appendChild(
                    row
                );

            }


            updateAdminCounter(
                "adminWithdrawals",
                total
            );

        }
    );

}


// ============================================================
// ACCEPTER RETRAIT
// ============================================================

async function approveWithdrawal(
    withdrawalId,
    request
){

    if(
        !confirm(
            "Accepter ce retrait ?"
        )
    ){

        return;

    }


    try{

        const userRef =
            ref(
                db,
                `users/${request.userId}`
            );


        const result =
            await runTransaction(
                userRef,
                current => {

                    if(!current)
                        return;


                    const balance =
                        Number(
                            current.balance || 0
                        );


                    const amount =
                        Number(
                            request.amount || 0
                        );


                    if(
                        balance < amount
                    ){

                        return;

                    }


                    current.balance =
                        balance - amount;


                    current.totalWithdrawals =
                        Number(
                            current.totalWithdrawals || 0
                        ) + amount;


                    return current;

                }
            );


        if(!result.committed){

            notify(
                "Retrait impossible : solde insuffisant."
            );

            return;

        }


        await update(
            ref(
                db,
                `withdrawals/${withdrawalId}`
            ),
            {

                status:
                    "approved",

                processedAt:
                    Date.now(),

                processedBy:
                    auth.currentUser.uid

            }
        );


        notify(
            "Retrait accepté."
        );


    }catch(error){

        console.error(error);

        notify(
            "Erreur lors du retrait."
        );

    }

}


// ============================================================
// REFUSER RETRAIT
// ============================================================

async function rejectWithdrawal(
    withdrawalId
){

    if(
        !confirm(
            "Refuser ce retrait ?"
        )
    ){

        return;

    }


    await update(
        ref(
            db,
            `withdrawals/${withdrawalId}`
        ),
        {

            status:
                "rejected",

            processedAt:
                Date.now(),

            processedBy:
                auth.currentUser.uid

        }
    );


    notify(
        "Retrait refusé."
    );

}


// ============================================================
// SUPPRIMER UTILISATEUR
// ============================================================

async function adminDeleteUser(
    uid,
    user
){

    if(
        !confirm(
            `Supprimer ${user.name || user.email} ?`
        )
    ){

        return;

    }


    if(
        uid ===
        auth.currentUser.uid
    ){

        notify(
            "Vous ne pouvez pas supprimer votre propre compte admin."
        );

        return;

    }


    try{

        // Suppression du profil
        // dans Realtime Database.

        await remove(
            ref(
                db,
                `users/${uid}`
            )
        );


        // Suppression des données
        // de parrainage.

        await remove(
            ref(
                db,
                `referrals/${uid}`
            )
        );


        // IMPORTANT :
        //
        // Depuis le navigateur, un admin Firebase
        // classique ne peut pas supprimer le compte
        // Authentication d'un autre utilisateur avec
        // deleteUser().
        //
        // Il faut Firebase Admin SDK / Cloud Functions
        // pour supprimer réellement le compte Auth.
        //
        // Ici, le profil Database est supprimé.


        notify(
            "Profil utilisateur supprimé de la base."
        );


    }catch(error){

        console.error(error);

        notify(
            "Impossible de supprimer l'utilisateur."
        );

    }

}


// ============================================================
// RÉINITIALISER MOT DE PASSE UTILISATEUR
// ============================================================

async function adminResetPassword(
    email
){

    if(!email){

        notify(
            "Adresse email introuvable."
        );

        return;

    }


    if(
        !confirm(
            `Envoyer un lien de réinitialisation à ${email} ?`
        )
    ){

        return;

    }


    try{

        await sendPasswordResetEmail(
            auth,
            email
        );


        notify(
            "Le lien de réinitialisation a été envoyé à l'adresse email de l'utilisateur."
        );


    }catch(error){

        console.error(error);

        notify(
            firebaseError(error)
        );

    }

}


// ============================================================
// COMPTEUR ADMIN
// ============================================================

function updateAdminCounter(
    id,
    value
){

    if($(id)){

        $(id).textContent =
            money(value);

    }

}


// ============================================================
// CRÉER UNE DEMANDE DE RETRAIT
// ============================================================

const withdrawBtn =
    $("withdrawBtn");


if(withdrawBtn){

    withdrawBtn.onclick =
        async () => {

            const user =
                auth.currentUser;


            if(!user){

                notify(
                    "Vous devez être connecté."
                );

                return;

            }


            const amount =
                Number(
                    prompt(
                        "Montant du retrait en FC :"
                    )
                );


            if(
                !amount ||
                amount <= 0
            ){

                return;

            }


            const method =
                prompt(
                    "Méthode de paiement : Airtel Money, Orange Money, M-Pesa..."
                );


            if(!method)
                return;


            const userSnapshot =
                await get(
                    ref(
                        db,
                        `users/${user.uid}`
                    )
                );


            if(!userSnapshot.exists())
                return;


            const data =
                userSnapshot.val();


            if(
                Number(
                    data.balance || 0
                ) < amount
            ){

                notify(
                    "Solde insuffisant."
                );

                return;

            }


            await push(
                ref(
                    db,
                    "withdrawals"
                ),
                {

                    userId:
                        user.uid,

                    email:
                        user.email,

                    amount:
                        amount,

                    method:
                        method,

                    status:
                        "pending",

                    createdAt:
                        Date.now()

                }
            );


            notify(
                "Demande de retrait envoyée à l'administration."
            );

        };

}


// ============================================================
// ERREURS FIREBASE
// ============================================================

function firebaseError(error){

    const code =
        error?.code || "";


    const messages = {

        "auth/email-already-in-use":
            "Cette adresse email est déjà utilisée.",

        "auth/invalid-email":
            "Adresse email invalide.",

        "auth/weak-password":
            "Mot de passe trop faible.",

        "auth/invalid-credential":
            "Email ou mot de passe incorrect.",

        "auth/user-not-found":
            "Utilisateur introuvable.",

        "auth/wrong-password":
            "Mot de passe incorrect.",

        "auth/network-request-failed":
            "Problème de connexion Internet.",

        "auth/too-many-requests":
            "Trop de tentatives. Réessayez plus tard.",

        "auth/user-disabled":
            "Ce compte est désactivé."

    };


    return (
        messages[code] ||
        error?.message ||
        "Une erreur est survenue."
    );

}


// ============================================================
// FIN APP.JS
// ============================================================
