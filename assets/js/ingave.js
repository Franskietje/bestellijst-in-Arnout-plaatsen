//definieer gebruikte constantes en variabelen   
const dateInput = document.getElementById('dag');
dateInput.value = formatDate();
var terugButton = document.getElementById('Terug');
var registratieHist = document.getElementById('registratieHist');


//vul dossiernaam en wl in (uit session en localstorage)
document.getElementById("dossierNaam").innerHTML = sessionStorage.getItem('dossierNaam');
document.getElementById("WL").innerHTML = localStorage.getItem('userName');

//--------------------------------------------------------

//ADD EVENTLISTENERS

//keer terug naar beginpagina (verwijder dossierID)
terugButton.addEventListener('click', function () {
  document.location.href = 'index.html';
  sessionStorage.removeItem('dossier_id_');
});

//---------------------------------------------------------

//FUNCTIES

//

//function checkRegistratieHist() {
//if (sessionStorage.getItem("registratieHist") === "1") {
// registratieHist.innerHTML = "<h4>LET OP! ER BESTAAT AL EEN REGISTRATIE VOOR DEZE DATUM!!</h4>";
//} else {
//  registratieHist.innerHTML = "";
//}
//}

document.addEventListener('DOMContentLoaded', async () => {
  var bearerToken = await getBearerToken();
  var regToestand = await getRegToestand(bearerToken);
  registratieHist.innerHTML = regToestand;
  var oaList = document.getElementById("oaList");
  oaList.innerHTML = "";
  var myHeaders = new Headers();

  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + bearerToken);

  var raw = JSON.stringify({
    "query": [
      {
        "_postitdetails::datum": new Date(sessionStorage.getItem("date")).toLocaleDateString('en-US'),
        "_k2_type_ID_c": 2,
        "_k2_dossier_ID": sessionStorage.getItem("dossierID")
      }]
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/_find", requestOptions)

  const data = await response.json();


  var i = 0;
  data.response.data.forEach(OA => {
    var oaLi = document.createElement("li");
    
    
    var oaAantalDiv = document.createElement("div");
    var oaAantal = document.createElement("input");
    oaAantal.type = "number";
    oaAantal.value = OA.fieldData.aantal;
    oaAantal.setAttribute('id', "aantalOA");

    var oaLabel = document.createElement("label")
    oaLabel.setAttribute("for","aantalOA");
    oaLabel.textContent = OA.fieldData.type_info_ae;

    var incrementButton = document.createElement('button');
    incrementButton.textContent = '+';
    incrementButton.addEventListener('click', function () {
      oaAantal.value = parseInt(oaAantal.value) + 1;
    });

    var decrementButton = document.createElement('button');
    decrementButton.textContent = '-';
    decrementButton.addEventListener('click', function () {
      oaAantal.value = parseInt(oaAantal.value) - 1;
    });

    oaAantal.appendChild(incrementButton);
    oaAantal.appendChild(decrementButton);
    oaAantalDiv.appendChild(oaLabel);
    oaAantalDiv.appendChild(oaAantal);
    oaLi.appendChild(oaAantalDiv);

    
    var startUur = document.createElement("input");
    startUur.type = "time";
    startUur.value = "07:00";
    startUur.setAttribute("step", "900");
    startUur.setAttribute("id", "startUurOA" + i);

    var startUurLabel = document.createElement("label");
    startUurLabel.setAttribute("for", "startUurOA" + i);
    startUurLabel.textContent = "van";

    oaLi.appendChild(startUurLabel);
    oaLi.appendChild(startUur);

    var eindUur = document.createElement("input");
    eindUur.type = "time";
    eindUur.value = "16:00";
    eindUur.setAttribute("step", "900");
    eindUur.setAttribute("id", "eindUurOA" + i);

    var eindUurLabel = document.createElement("label");
    eindUurLabel.setAttribute("for", "eindUurOA" + i);
    eindUurLabel.textContent = "tot";

    oaLi.appendChild(eindUurLabel);
    oaLi.appendChild(eindUur);

    var postitButton = document.createElement("button");
    postitButton.classList.add("button", "button1");
    postitButton.innerHTML = "REGISTREER";
    postitButton.addEventListener("click", function () {
      console.log(OA.fieldData._k1_postitdetail_ID);
      registreerOA(OA.fieldData._k1_postitdetail_ID, startUur.value, eindUur.value, OA.fieldData._k2_onderaannemer_ID, oaAantal.value);
    })

    oaLi.appendChild(postitButton);



    oaList.appendChild(oaLi);
    i++;
  });




})

async function getRegToestand(bearerToken) {

  var regObject = {
    "query": [
      {
        "_postituren::_k2_werfleider_ID": sessionStorage.getItem('WL_ID'),
        "_k2_postitdetail_ID": sessionStorage.getItem('postitdetail')
      }]
  };
  const data = regObject;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearerToken
    },
    body: JSON.stringify(data)
  };
  var regToestand = "";
  var response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postituren/_find", options)
  if (response.ok) {
    regToestand = "<h4>LET OP! ER BESTAAT AL EEN REGISTRATIE VOOR DEZE DATUM!!</h4>";
  };
  console.log(regToestand);
  return regToestand;
};


//functies om de datum bij te houden
function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function formatDate(date = new Date(sessionStorage.getItem('date'))) {
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join('-');
}


//zend de ingave naar Arnout (en creeer een postitdetailrecord indien nodig)
async function registreer() {
  var bearerToken = await getBearerToken();

  while (!sessionStorage.getItem('postitdetail')) { await createPostIt(); };

  var regObject = {
    "fieldData":
    {
      "_postituren::_k2_postitdetail_ID": sessionStorage.getItem('postitdetail'),
      "_postituren::_k2_dossier_ID": sessionStorage.getItem('dossierID'),
      "_postituren::datum": new Date(dateInput.value).toLocaleDateString('en-US'),
      "_postituren::van": document.getElementById("startUur").value,
      "_postituren::tot": document.getElementById("eindUur").value,
      "_postituren::pauzeT": "00:" + document.getElementById("pauze").value + ":00",
      "_postituren::pauze": document.getElementById("pauze").value,
      "_postituren::_k2_werfleider_ID": sessionStorage.getItem('WL_ID'),
      "_postituren::opmerking_administratie": document.getElementById("opmerking").value
    }
  };


  const data = regObject;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearerToken
    },
    body: JSON.stringify(data)
  };

  fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postituren/records", options)
    .then(response => {
      if (!response.ok) {
        throw new Error('network response was not ok');
      } else {
        window.alert('registratie is gelukt');
        document.location.href = 'index.html';
      }
      return response.json();
    })

    .catch(error => {
      console.error(error);
      window.alert('Registratie niet gelukt, met foutcode: ' + error.message)
    });

}

async function registreerOA(postitdetail, vanUur, totUur, oaID, aantal) {
  var bearerToken = await getBearerToken();

  var datum = new Date(dateInput.value).toLocaleDateString('en-GB', {
    month: '2-digit',day: '2-digit',year: 'numeric'});
  console.log(vanUur + " " + totUur);
  var vanUurNummArr = vanUur.split(':');
  var vanUurNummer = (+vanUurNummArr[0]) * 60 + (vanUurNummArr[1]);
  var totUurNummArr = totUur.split(':');
  var totUurNummer = (+totUurNummArr[0]) * 60 + (totUurNummArr[1]);

  console.log(vanUurNummer + " " + totUurNummer);

  var uren = (totUurNummer - vanUurNummer) / 60 / 100;
  var jsonREG = "{\"reg\" :["
  for (let i = 0; i < aantal - 1; i++) {
    jsonREG += "{\"startTS\" : \"" + datum + " " + vanUur + "\",\"stopTS\" : \"" + datum + " " + totUur + "\",\"uren\" : \"" + uren + "\"},"
  }
  jsonREG += "{\"startTS\" : \"" + datum + " " + vanUur + "\",\"stopTS\" : \"" + datum + " " + totUur + "\",\"uren\" : \"" + uren + "\"}]}";

  console.log(jsonREG);



  var regObject = {
    "fieldData":
    {
      "_postituren::_k2_postitdetail_ID": postitdetail,
      "_postituren::_k2_dossier_ID": sessionStorage.getItem('dossierID'),
      //"_postituren::datum": new Date(dateInput.value).toLocaleDateString('en-US'),
      //"_postituren::van": vanUur,
      //"_postituren::tot": totUur,
      //"_postituren::pauzeT": "00:" + document.getElementById("pauze").value + ":00",
      //"_postituren::pauze": document.getElementById("pauze").value,
      "_postituren::_k2_onderaannemer_ID": oaID,
      //"_postituren::opmerking_administratie": document.getElementById("opmerking").value,
      "JSONregistration": jsonREG
    }
  };


  const data = regObject;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearerToken
    },
    body: JSON.stringify(data)
  };

  fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postituren/records", options)
    .then(response => {
      if (!response.ok) {
        throw new Error('network response was not ok');
      } else {
        window.alert('registratie is gelukt');
        document.location.href = 'index.html';
      }
      return response.json();
    })

    .catch(error => {
      console.error(error);
      window.alert('Registratie niet gelukt, met foutcode: ' + error.message)
    });

}

//maak een postitdetailrecord aan en return de id naar sessionstorage
async function createPostIt() {
  var bearerToken = await getBearerToken();
  var WL_ID = sessionStorage.getItem('WL_ID');
  var date = new Date(dateInput.value).toLocaleDateString('en-US');
  sessionStorage.setItem('date', date);
  var dossierID = sessionStorage.getItem('dossierID');


  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + bearerToken);

  var raw = JSON.stringify(
    {
      "fieldData":
      {
        "_k2_werfleider_ID": WL_ID,
        "datum": date,
        "_k2_dossier_ID": dossierID,
        "flag_web": 0
      }
    }
  );

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/records", requestOptions)

  const data = await response.json();


  var raw = JSON.stringify({
    "query": [
      {
        "_postitdetails::datum": date,
        "_postitdetails::type_info_ae": localStorage.getItem('userName')
      }]

  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const response2 = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/_find", requestOptions)

  const data2 = await response2.json();

  data2.response.data.forEach(dossier => {
    sessionStorage.setItem('postitdetail', dossier.fieldData._k1_postitdetail_ID);
  })


}


//haal Bearertoken uit ARnout voor opgegegen user+pass
async function getBearerToken() {

  const username = localStorage.getItem('userName');
  const password = localStorage.getItem('passWord');
  const auth = username + ':' + password;
  const encodedAuth = btoa(auth);

  const url = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/sessions';

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + encodedAuth
    }
  };

  const response = await fetch(url, options);

  const data = await response.json();
  const token = data.response.token;

  return token;
}




