
function checkCredentials() {

  var username = localStorage.getItem('userName');
  var password = localStorage.getItem('passWord');
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
  fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(result => {
      // authentication successful
      sessionStorage.setItem('bearerToken', (result.response.token));
    })
    .catch(error => {
      // authentication failed
      console.error('Error fetching data: ', error);
      loginErrorMsg.style.opacity = 1;
    })
}

const dateControl = document.querySelector('input[type="date"]');
dateControl.valueAsDate = new Date();



function getDossiers() {

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + sessionStorage.getItem('bearerToken'));

  var date = dateControl.valueAsDate.toLocaleDateString('en-us');

  var raw = JSON.stringify({
    "query": [
      {
        "_postitdetails::datum": date,
        "_postitdetails::type_info_ae": localStorage.getItem('userName')
      }
    ]
  });

  console.log(raw);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/_find", requestOptions)
    .then(response => response.json())
    .then(result => {
      var dossiersLijst = (result);
      var buttonList = document.getElementById("buttonList");
      dossiersLijst.response.data.forEach(dossier => {
        var button = document.createElement("button");
        var dossierID=(dossier.fieldData._k2_dossier_ID);
        var dossierNaam= getDossiersList(dossierID);
        button.innerHTML = dossierNaam;
        button.className = "button1";
        button.className += " button";
        button.addEventListener('click', function () {
          document.location.href = 'ingave.html';
          sessionStorage.setItem('dossierId', (dossier.fieldData._k2_dossier_ID));
          /*sessionStorage.setItem('dossierNaam', (dossier.fieldData.dossiernaam_c));*/
        });
        var buttonListItem = document.createElement("li");
        buttonListItem.appendChild(button);
        buttonList.appendChild(buttonListItem);
      });
      var body = document.getElementsByTagName("body")[0];
      body.appendChild(buttonList);
    })
    .catch(error => console.log('error', error));
}


function runAsyncFunctions() {
  // call the first async function and wait for it to complete
  checkCredentials();
  // call the second async function and wait for it to complete
  checkSessionStorage();
}

function openPage() {
  if (localStorage.getItem('userName') && localStorage.getItem('passWord')) {
    runAsyncFunctions();
  }
  else {
    document.location.href = 'login-page.html'
  }
}

function checkSessionStorage() {
  if (sessionStorage.getItem('bearerToken')) {
    // The value for 'myKey' is set in sessionStorage
    // Call your function here
    getDossiers();
  } else {
    // The value for 'myKey' is not set in sessionStorage yet
    // Check again in 100 milliseconds
    setTimeout(checkSessionStorage, 100);
  }
}



checkSessionStorage();

const clearLocalStorageButton = document.querySelector('#clearLocalStorageButton');

clearLocalStorageButton.addEventListener('click', function () {
  localStorage.clear();
  document.location.href = 'login-page.html';
});


let dossiersLijst;

async function getDossiersList(id) {

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + sessionStorage.getItem('bearerToken'));


  var raw = JSON.stringify({
    "query": [
      {
        "_k1_dossier_ID":id
      },

    ]
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_list Kopie/_find", requestOptions)
    .then(response => response.json())
    .then(result => {
      dossiersLijst=result;
      var lijst=(result);
      lijst.response.data.forEach(dossierNaam => {
        return dossierNaam.fieldData.dossiernaam_c})
    })
    .catch(error => console.log('error', error));
}