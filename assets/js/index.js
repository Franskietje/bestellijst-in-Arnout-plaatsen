
//definieer gebruikte constantes en variabelen
const dateControl = document.querySelector('input[type="date"]');
dateControl.valueAsDate = new Date();
const mySelect = document.getElementById('zoekDossiers');
const clearLocalStorageButton = document.getElementById('clearLocalStorage');

//------------------------------------------------------------------
//ADD EVENTLISTENERS

//log uit (verwijder localstorage)
clearLocalStorageButton.addEventListener('click', function () {
    localStorage.clear();
    document.location.href = 'login-page.html';
});

//vul SELECT met dossiers (vandaag min3maanden en plus3maanden)
mySelect.addEventListener('click', async function () {
    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);

    var today = new Date();
    var todayMin3M = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toLocaleDateString('en-US');
    var todayPlus3M = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toLocaleDateString('en-US');
    var dateString = todayMin3M + ".." + todayPlus3M;

    var raw = JSON.stringify({
        "query": [
            {
                "datum_beurs_van": dateString
            }
        ],
        sort: [
            { fieldName: 'dossiernaam_c', sortOrder: 'ascend' }
        ]
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_list Kopie/_find", requestOptions)

    const data = await response.json();

    var select = document.getElementById("zoekDossiers");
    data.response.data.forEach(dossier => {
        const option = document.createElement('option');
        option.value = dossier.fieldData._k1_dossier_ID;
        option.text = dossier.fieldData.dossiernaam_c;
        select.appendChild(option);
    });
});

//maak knop voor het gekozen dossier in SELECT
mySelect.addEventListener('change', async function(){
    
    var container = document.getElementById("btn-container");
    container.innerHTML="";
    var select = mySelect;
    var selectValue = select.value;

    var selectedOption = select.options[select.selectedIndex].text;

    sessionStorage.setItem('dossierNaam', selectedOption);
    sessionStorage.setItem('dossierID',selectValue);


    // Create a button element
    var btn = document.createElement("button");
    btn.innerHTML = selectedOption;

    btn.className = "button1";
    btn.className += " button";
    btn.addEventListener('click', function () {
        sessionStorage.removeItem('postitdetail');
        document.location.href = 'ingave.html';
    });



    // Append the button to the container element
    container.appendChild(btn);


});

//------------------------------------------------------------------


//FUNCTIES

// open page: naar loginpage of vul pagina met gegevens voor deze gebruiker
function openPage() {
    if (localStorage.getItem('userName') && localStorage.getItem('passWord')) {
        haalDossiersOp();
        getWL_ID();
        
    } else {
        document.location.href = 'login-page.html';
    }
}

//haal dossier op uit postitdetail (planning) voor gebruiker + datum
async function haalDossiersOp() {

    var bearerToken = await getBearerToken();
    var buttonList = document.getElementById("buttonList");
        buttonList.innerHTML = '';
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);

    var date = dateControl.valueAsDate.toLocaleDateString('en-US');
    sessionStorage.setItem('date', date);

    var raw = JSON.stringify({
        "query": [
            {
                "_postitdetails::datum": date,
                "_postitdetails::type_info_ae": localStorage.getItem('userName')
            }
        ]
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/_find", requestOptions)

    const data = await response.json();

    if (!response.ok) {
        var geenDossier = document.getElementById("geenDossier");
        geenDossier.innerHTML = 'Geen dossiers gevonden voor deze datum';
        

    } else {
        var geenDossier = document.getElementById("geenDossier");
        geenDossier.innerHTML = '';
        
        
        data.response.data.forEach(dossier => {
            var dossierID = (dossier.fieldData._k2_dossier_ID);  
            var postitdetail_ID = (dossier.fieldData._k1_postitdetail_ID);
            var opmerking = (dossier.fieldData.opmerking);
            haalDossierNaamOp(dossierID, bearerToken,postitdetail_ID,opmerking);
            var WL_ID = (dossier.fieldData._k2_werfleider_ID);
            sessionStorage.setItem("WL_ID", WL_ID);
        })
    };
}
//haal WL_ID op voor gebruikersnaam
async function getWL_ID(){
    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);


    var raw = JSON.stringify({
        "query": [
            {
                "initialen": localStorage.getItem('userName')
            }
        ]
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Personen_form_details/_find", requestOptions)

    const data = await response.json();

    data.response.data.forEach(dossier => {
           var WL_ID = (dossier.fieldData._k1_contactPersoon_ID);
            sessionStorage.setItem("WL_ID", WL_ID);
        })
    };

//haal dossiernaam op voor gevonden dossier in 'haalDossiersOp' en maak de button hiermee
async function haalDossierNaamOp(dossierID, bearerToken,postitdetail, opmerking) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);

    var raw = JSON.stringify({
        "query": [
            {
                "_k1_dossier_ID": dossierID
            }
        ]
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_list Kopie/_find", requestOptions)

    const data = await response.json();

    var buttonList = document.getElementById("buttonList");
    
    data.response.data.forEach(dossier => {
        var regObject = {
            "query": [
              {
                "_postituren::_k2_werfleider_ID": sessionStorage.getItem('WL_ID'),
                "_k2_postitdetail_ID": postitdetail
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
          var button = document.createElement("button");
          fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postituren/_find", options)
            .then(response => {
              if (response.ok) {
                button.disabled=true;
                button.className = "button3";
                button.className += " button";
                var text = document.createElement('p'); 
                text.textContent = "Al Geregistreerd!"; 
                button.parentNode.appendChild(text); 

              } else {
                button.disabled =false;
                button.className = "button1";
                button.className += " button";
              }
            })
        var dossierNaam = (dossier.fieldData.dossiernaam_c);
        
        if(!opmerking){button.innerHTML = dossierNaam;}
        else{button.innerHTML = dossierNaam +" <em>("+opmerking+")</em>";}
        

        button.addEventListener('click', function () {
            var dossierID=dossier.fieldData._k1_dossier_ID;
            sessionStorage.setItem('dossierID',dossierID);
            sessionStorage.setItem('dossierNaam', dossierNaam);
            sessionStorage.setItem('postitdetail',postitdetail);
            document.location.href = 'ingave.html';
        });
        var buttonListItem = document.createElement("li");
        buttonListItem.appendChild(button);

        buttonList.appendChild(buttonListItem);
    });
    
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
