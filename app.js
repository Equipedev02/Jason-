// ============================================================
// DAVBOT BUSINESS
// APP.JS PARTIE 1/3
// Firebase Auth + Users + Parrainage
// ============================================================


// ================= FIREBASE =================


import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";


import {

    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail

}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";



import {

    getDatabase,
    ref,
    set,
    get,
    update,
    push,
    onValue,
    runTransaction,
    remove

}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";



import {

    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL

}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";




// ================= CONFIG =================


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





const app =
initializeApp(firebaseConfig);



const auth =
getAuth(app);



const db =
getDatabase(app);



const storage =
getStorage(app);




// ================= CONFIG BUSINESS =================


const WHATSAPP_SUPPORT =
"24390855444";



const REFERRAL_POINTS =
100;



const ADMIN_EMAIL =
"admin@davbot.com";





// ============================================================
// OUTILS
// ============================================================



function $(id){

return document.getElementById(id);

}



function money(value){

return Number(value || 0)
.toLocaleString("fr-FR");

}



function notify(msg){

alert(msg);

}



function createCode(){


let chars =
"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


let code="";


for(let i=0;i<8;i++){


code +=
chars[
Math.floor(
Math.random()*chars.length
)
];


}


return "DAVBOT-"+code;


}






// ============================================================
// INSCRIPTION
// ============================================================


const registerForm =
$("registerForm");



if(registerForm){


registerForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const name =
$("registerName").value;



const email =
$("registerEmail").value;



const password =
$("registerPassword").value;



const confirm =
$("registerConfirm").value;



const referral =
$("registerReferral").value
.trim();




const photo =
$("registerPhoto");




if(password !== confirm){

notify(
"Les mots de passe ne correspondent pas."
);

return;

}



try{


// Création compte Firebase Auth


const result =
await createUserWithEmailAndPassword(
auth,
email,
password
);



const user =
result.user;



let photoURL="";



// Upload photo


if(
photo.files.length > 0
){


const file =
photo.files[0];


const fileRef =
storageRef(
storage,
"users/"+user.uid
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




// Création code personnel


const myCode =
createCode();



// Recherche parrain


let inviter="";



if(referral){


const snap =
await get(
ref(
db,
"users"
)
);



if(snap.exists()){


const users =
snap.val();



for(
let id in users
){


if(
users[id].referralCode === referral
){


inviter=id;


break;


}


}


}



}





// Création profil


await set(

ref(
db,
"users/"+user.uid
),

{


uid:user.uid,


name:name,


email:email,


photoURL:photoURL,


balance:0,


points:0,


referralCode:myCode,


referredBy:inviter,


totalOrders:0,


totalRecharge:0,


totalWithdraw:0,


createdAt:
Date.now()


}


);





// Donner points au parrain


if(inviter){


await addPointsReferral(
inviter,
user.uid
);


}





notify(
"Compte créé avec succès."
);



location.href=
"dash.html";



}
catch(error){


console.log(error);


notify(
error.message
);



}



}
);



}








// ============================================================
// CONNEXION
// ============================================================



const loginForm =
$("loginForm");



if(loginForm){



loginForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{


await signInWithEmailAndPassword(

auth,

$("loginEmail").value,

$("loginPassword").value

);



location.href=
"dash.html";



}
catch(error){


notify(
"Email ou mot de passe incorrect."
);



}



}

);



}







// ============================================================
// DECONNEXION
// ============================================================



const logout =
$("logoutBtn");



if(logout){



logout.onclick =
async()=>{


await signOut(auth);


location.href=
"index.html";



};


}






// ============================================================
// MOT DE PASSE OUBLIE
// ============================================================



const forgot =
$("forgotPassword");



if(forgot){


forgot.onclick =
()=>{


let text =
encodeURIComponent(

"Bonjour, je veux réinitialiser mon mot de passe DAVBOT."

);



window.location.href =

"https://wa.me/"
+
WHATSAPP_SUPPORT
+
"?text="
+
text;



};


}







// ============================================================
// AUTH STATE
// ============================================================



onAuthStateChanged(
auth,
(user)=>{



if(!user){

return;

}




let page =
location.pathname;



if(
page.includes("dash")
){

loadDashboard(user.uid);

}



if(
page.includes("profil")
){

loadProfile(user.uid);

}



}

);







// ============================================================
// AJOUT POINTS PARRAINAGE
// ============================================================



async function addPointsReferral(
userId,
newUser
){



await runTransaction(

ref(
db,
"users/"+userId+"/points"
),

(points)=>{


return (
Number(points || 0)
+
REFERRAL_POINTS
);


}

);





await push(

ref(
db,
"referrals/"+userId
),

{


newUser:newUser,


points:REFERRAL_POINTS,


date:
Date.now()


}

);



}






// ============================================================
// CHARGER DASHBOARD
// ============================================================



function loadDashboard(uid){



onValue(

ref(
db,
"users/"+uid
),

(snapshot)=>{


if(!snapshot.exists())
return;



const data =
snapshot.val();




if($("userName"))

$("userName").innerText =
data.name;



if($("balance"))

$("balance").innerText =
money(data.balance);



if($("points"))

$("points").innerText =
money(data.points);



if($("orders"))

$("orders").innerText =
data.totalOrders || 0;



if($("profilePhoto")
&&
data.photoURL)

$("profilePhoto").src =
data.photoURL;



if($("referralCode"))

$("referralCode").innerText =
data.referralCode;



}



);



}








// ============================================================
// CHARGER PROFIL
// ============================================================



function loadProfile(uid){



onValue(

ref(
db,
"users/"+uid
),

(snapshot)=>{


if(!snapshot.exists())
return;



const data =
snapshot.val();



if($("profileName"))

$("profileName").innerText =
data.name;



if($("profileEmail"))

$("profileEmail").innerText =
data.email;



if($("profileBalance"))

$("profileBalance").innerText =
money(data.balance);



if($("profilePoints"))

$("profilePoints").innerText =
money(data.points);



if($("referralCode"))

$("referralCode").innerText =
data.referralCode;



if($("profilePhoto")
&&
data.photoURL)

$("profilePhoto").src =
data.photoURL;



}

);



}




// FIN PARTIE 1/3
// ============================================================
// DAVBOT BUSINESS
// APP.JS PARTIE 2/3
// SHOP + COMMANDES + RECHARGE + RETRAIT
// ============================================================



// ============================================================
// SHOP PRODUITS
// ============================================================


const productsBox =
$("products");



if(productsBox){


onValue(

ref(
db,
"products"
),

(snapshot)=>{


productsBox.innerHTML="";



if(!snapshot.exists()){


productsBox.innerHTML=
"<p>Aucun service disponible</p>";

return;

}




let products =
snapshot.val();



for(let id in products){


let p =
products[id];



productsBox.innerHTML += `

<div class="product">


${p.image ?
`
<img src="${p.image}">
`
:
""}



<div class="product-content">


<h3>
${p.name}
</h3>


<p>
${p.description}
</p>


<div class="price">

${money(p.price)} FC

</div>



<button 
class="buy"
onclick="buyProduct('${id}')">

Commander

</button>



</div>


</div>

`;



}



}

);



}






// ============================================================
// COMMANDER PRODUIT
// ============================================================


window.buyProduct =
async function(productId){



let user =
auth.currentUser;



if(!user){

notify(
"Connectez-vous d'abord."
);

return;

}



const productSnap =
await get(

ref(
db,
"products/"+productId
)

);



if(!productSnap.exists())
return;



let product =
productSnap.val();




const userSnap =
await get(

ref(
db,
"users/"+user.uid
)

);



let data =
userSnap.val();





if(
Number(data.balance)
<
Number(product.price)

){


notify(
"Solde insuffisant."
);


return;

}




// création commande


await push(

ref(
db,
"orders"
),

{


userId:user.uid,


userName:data.name,


productId:productId,


product:product.name,


price:product.price,


status:"pending",


date:Date.now()


}

);




notify(
"Commande envoyée à l'administration."
);



}





// ============================================================
// AFFICHER COMMANDES UTILISATEUR
// ============================================================


const ordersTable =
$("userOrders");



if(ordersTable){



onValue(

ref(
db,
"orders"
),

(snapshot)=>{


ordersTable.innerHTML="";



if(!snapshot.exists())
return;




let orders =
snapshot.val();




for(let id in orders){



let o =
orders[id];



if(
o.userId === auth.currentUser.uid
){



ordersTable.innerHTML += `

<tr>

<td>
${o.product}
</td>


<td>
${money(o.price)} FC
</td>


<td>
${o.status}
</td>


<td>
${new Date(o.date)
.toLocaleDateString()}
</td>


</tr>

`;



}



}



}



);



}






// ============================================================
// RECHARGE
// ============================================================



const rechargeBtn =
$("rechargeBtn");



if(rechargeBtn){



rechargeBtn.onclick =
()=>{


let montant =
prompt(
"Montant de recharge FC :"
);



if(!montant)
return;



let transaction =
prompt(
"ID de transaction :"
);



if(!transaction)
return;



sendRecharge(
montant,
transaction
);



};



}





async function sendRecharge(
amount,
transaction
){



let user =
auth.currentUser;



let snap =
await get(

ref(
db,
"users/"+user.uid
)

);



let data =
snap.val();





await push(

ref(
db,
"recharges"
),

{


userId:user.uid,


userName:data.name,


email:data.email,


amount:Number(amount),


transactionId:transaction,


status:"pending",


date:Date.now()


}

);



notify(
"Demande envoyée. Attente validation admin."
);



}







// ============================================================
// RETRAIT
// ============================================================


const withdrawBtn =
$("withdrawBtn");



if(withdrawBtn){



withdrawBtn.onclick =
()=>{


let amount =
prompt(
"Montant retrait FC :"
);



if(!amount)
return;



let method =
prompt(
"Méthode paiement : Airtel, Orange, Mpesa..."
);



if(!method)
return;



sendWithdraw(
amount,
method
);



};



}






async function sendWithdraw(
amount,
method
){



let user =
auth.currentUser;



let snap =
await get(

ref(
db,
"users/"+user.uid
)

);



let data =
snap.val();



if(
Number(data.balance)
<
Number(amount)

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


userId:user.uid,


userName:data.name,


amount:Number(amount),


method:method,


status:"pending",


date:Date.now()


}

);





notify(
"Demande de retrait envoyée."
);



}






// ============================================================
// COPIER CODE PARRAIN
// ============================================================


const copyReferral =
$("copyReferral");



if(copyReferral){



copyReferral.onclick =
()=>{


let code =
$("referralCode").innerText;



navigator.clipboard.writeText(code);



notify(
"Code copié."
);



};



}





// FIN PARTIE 2/3
// ============================================================
// DAVBOT BUSINESS
// APP.JS PARTIE 3/3
// ADMIN PANEL
// ============================================================



// ============================================================
// VERIFICATION ADMIN
// ============================================================


function checkAdmin(){

const user =
auth.currentUser;


if(!user)
return false;



return user.email === ADMIN_EMAIL;


}






// ============================================================
// CHARGEMENT ADMIN
// ============================================================


if(
location.pathname.includes("admin")
){


onAuthStateChanged(
auth,
(user)=>{


if(!user){

location.href="index.html";

return;

}



loadAdmin();


}



);



}







async function loadAdmin(){



if(!checkAdmin()){


notify(
"Accès administrateur refusé."
);


location.href="dash.html";

return;

}



// USERS

loadAdminUsers();


// COMMANDES

loadAdminOrders();


// RECHARGES

loadAdminRecharges();


// RETRAITS

loadAdminWithdrawals();



}









// ============================================================
// USERS ADMIN
// ============================================================



function loadAdminUsers(){



const table =
$("usersTable");



if(!table)
return;



onValue(

ref(
db,
"users"
),

(snapshot)=>{


table.innerHTML="";


let users =
snapshot.val() || {};



let count=0;



for(let id in users){



let u =
users[id];



count++;



table.innerHTML += `


<tr>


<td>

${u.name}

</td>



<td>

${u.email}

</td>



<td>

${money(u.balance)}
FC

</td>



<td>

${u.points || 0}

</td>



<td>

${u.referralCode}

</td>



<td>


<button 
class="delete"
onclick="deleteUser('${id}')">

Supprimer

</button>



<button
class="reset"
onclick="resetUserPassword('${u.email}')">

Reset MDP

</button>


</td>



</tr>


`;



}



if($("adminUsers"))

$("adminUsers").innerText=count;



}



);



}







// ============================================================
// SUPPRIMER UTILISATEUR
// ============================================================


window.deleteUser =
async function(uid){



if(!confirm(
"Supprimer cet utilisateur ?"
))

return;



await remove(

ref(
db,
"users/"+uid
)

);



notify(
"Utilisateur supprimé."
);



}









// ============================================================
// RESET MOT DE PASSE
// ============================================================


window.resetUserPassword =
async function(email){



try{


await sendPasswordResetEmail(
auth,
email
);



notify(
"Email de réinitialisation envoyé."
);



}

catch(e){


notify(
e.message
);


}



}








// ============================================================
// COMMANDES ADMIN
// ============================================================


function loadAdminOrders(){



const table =
$("ordersTable");



if(!table)
return;



onValue(

ref(
db,
"orders"
),

(snapshot)=>{


table.innerHTML="";



let orders =
snapshot.val() || {};



let count=0;



for(let id in orders){



let o =
orders[id];

count++;



table.innerHTML += `


<tr>


<td>

${o.userName}

</td>



<td>

${o.product}

</td>



<td>

${money(o.price)} FC

</td>



<td>

${new Date(o.date)
.toLocaleDateString()}

</td>



<td>

${o.status}

</td>



<td>



<button 
class="approve"

onclick="acceptOrder('${id}')">

Accepter

</button>



<button

class="reject"

onclick="rejectOrder('${id}')">

Refuser

</button>



</td>


</tr>


`;



}



if($("adminOrders"))

$("adminOrders").innerText=count;



}



);



}








window.acceptOrder =
async function(id){



const snap =
await get(

ref(
db,
"orders/"+id
)

);



let order =
snap.val();



if(order.status !== "pending")
return;



await update(

ref(
db,
"orders/"+id
),

{

status:"accepted"

}

);



const userRef =
ref(
db,
"users/"+order.userId
);



await runTransaction(

userRef,

(user)=>{


if(user){


user.balance =
Number(user.balance)
-
Number(order.price);



user.totalOrders =
Number(user.totalOrders || 0)
+
1;



}



return user;


}

);




notify(
"Commande validée."
);



}








window.rejectOrder =
async function(id){



await update(

ref(
db,
"orders/"+id
),

{

status:"rejected"

}

);



notify(
"Commande refusée."
);



}









// ============================================================
// RECHARGES ADMIN
// ============================================================


function loadAdminRecharges(){



const table =
$("rechargesTable");



if(!table)
return;



onValue(

ref(
db,
"recharges"
),

(snapshot)=>{


table.innerHTML="";



let data =
snapshot.val() || {};

let count=0;



for(let id in data){



let r =
data[id];

count++;



table.innerHTML += `


<tr>


<td>
${r.userName}
</td>



<td>
${money(r.amount)} FC
</td>



<td>
${r.transactionId}
</td>



<td>
${r.status}
</td>



<td>


<button
class="approve"

onclick="acceptRecharge('${id}')">

Valider

</button>



<button
class="reject"

onclick="rejectRecharge('${id}')">

Refuser

</button>



</td>


</tr>


`;



}



if($("adminRecharges"))

$("adminRecharges").innerText=count;



}



);



}








window.acceptRecharge =
async function(id){



const snap =
await get(

ref(
db,
"recharges/"+id
)

);



let r =
snap.val();



if(r.status !== "pending")
return;





await update(

ref(
db,
"recharges/"+id
),

{

status:"accepted"

}

);






await runTransaction(

ref(
db,
"users/"+r.userId+"/balance"
),

(balance)=>{


return Number(balance || 0)
+
Number(r.amount);



}

);






await update(

ref(
db,
"users/"+r.userId
),

{

totalRecharge:
Date.now()

}

);





notify(
"Recharge acceptée."
);



}







window.rejectRecharge =
async function(id){



await update(

ref(
db,
"recharges/"+id
),

{

status:"rejected"

}

);



notify(
"Recharge refusée."
);



}









// ============================================================
// RETRAITS ADMIN
// ============================================================


function loadAdminWithdrawals(){



const table =
$("withdrawalsTable");



if(!table)
return;



onValue(

ref(
db,
"withdrawals"
),

(snapshot)=>{


table.innerHTML="";



let data =
snapshot.val() || {};



let count=0;



for(let id in data){



let w =
data[id];

count++;



table.innerHTML += `


<tr>


<td>

${w.userName}

</td>


<td>

${money(w.amount)} FC

</td>


<td>

${w.method}

</td>


<td>

${w.status}

</td>



<td>


<button
class="approve"

onclick="acceptWithdraw('${id}')">

Valider

</button>



<button
class="reject"

onclick="rejectWithdraw('${id}')">

Refuser

</button>


</td>


</tr>


`;



}



if($("adminWithdrawals"))

$("adminWithdrawals").innerText=count;



}



);



}







window.acceptWithdraw =
async function(id){



const snap =
await get(

ref(
db,
"withdrawals/"+id
)

);



let w =
snap.val();




await update(

ref(
db,
"withdrawals/"+id
),

{

status:"accepted"

}

);





await runTransaction(

ref(
db,
"users/"+w.userId+"/balance"
),

(balance)=>{


return Number(balance || 0)
-
Number(w.amount);



}

);



notify(
"Retrait validé."
);



}







window.rejectWithdraw =
async function(id){



await update(

ref(
db,
"withdrawals/"+id
),

{

status:"rejected"

}

);



notify(
"Retrait refusé."
);



}




// =================================
