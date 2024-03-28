
//#region Section 1 : "Declaration of global variables"

var excelData = [];
var apiDossier2Artikelen = [];
var apiStanden = [];
var finalDataArray = [];

const mySelect = document.getElementById('zoekDossiers');

//#endregion

//#region Section 2: vuld dossierSelect en add button when selected


//vul dossierselect, op basis van PM en huidige datum -1 maand
async function loadDossiers() {
    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);
    var select = mySelect;
    var fullName = localStorage.getItem('fullName');

    var today = new Date();
    var todayMin1M = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toLocaleDateString('en-US');
    var dateString = todayMin1M + "..";
    //console.log(dateString);

    var raw = JSON.stringify({
        "query": [
            {
                "projectleider1_ae": fullName, "dossiers_dossiersdataCreate::type": "beurs", "dossiers_dossiersdataCreate::datum_van": dateString
            }, {
                "projectleider2_ae": fullName, "dossiers_dossiersdataCreate::type": "beurs", "dossiers_dossiersdataCreate::datum_van": dateString
            }
        ],
        "sort": [
            {
                "fieldName": "dossiernaam",
                "sortOrder": "ascend"
            }
        ],
        "limit": "500"
    });
    //console.log (raw);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    try {
        const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_form_detail/_find", requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok' & response);
        }
        const data = await response.json();
        if (data && data.response && data.response.data && data.response.data.length > 0) {
            data.response.data.forEach(dossier => {
                const option = document.createElement('option');
                option.value = dossier.fieldData._k1_dossier_ID;
                option.text = dossier.fieldData.dossiernaam;
                select.appendChild(option);
            });
        } else {
            //("No data found or error fetching data");
        }

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }


}

//maak knop voor het gekozen dossier in SELECT
mySelect.addEventListener('change', async function () {

    var container = document.getElementById("btn-container");
    container.innerHTML = "";
    var select = mySelect;
    var selectValue = select.value;

    var selectedOption = select.options[select.selectedIndex].text;

    sessionStorage.setItem('dossierNaam', selectedOption);
    sessionStorage.setItem('dossierID', selectValue);


    // Create a button element
    var btn = document.createElement("button");
    btn.innerHTML = selectedOption;

    btn.className = "button1 button";
    btn.addEventListener('click', function () {
        document.getElementById('load-excel').style.display = 'block';
        document.getElementById('input-excel').style.display = 'block';
    });



    // Append the button to the container element
    container.appendChild(btn);


});

//#endregion

//#region Section 3 : ==> Load Excel Data Button ==> "Handle Excel upload / Get apiData / fill initial table / make new stands in Arnout"


document.getElementById('load-excel').addEventListener('click', function () {
    readExcelFile();
});


async function readExcelFile() {
    var input = document.getElementById('input-excel');
    var file = input.files[0];
    if (!file) {
        alert("Please select a file first.");
        return;
    }

    var reader = new FileReader();
    reader.onload = async function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var firstSheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[firstSheetName];
        excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract unique values from column 2 (index 1)
        var uniqueValues = getUniqueValuesFromColumn(excelData.slice(1), 2); // Excluding header


        // Fetch API data for select options
        apiDossier2Artikelen = await fetchapiDossier2Artikelen();
        apiStanden = await fetchapiStanden();

        // Generate Array with uniqueStanden and apiStanden
        var uniqueStanden = getUniqueValuesFromColumn(excelData.slice(1), 0); // Excluding header
        //console.log (apiStanden);
        if (apiStanden && apiStanden.response && apiStanden.response.data && apiStanden.response.data.length > 0) {
            var excludeSet = new Set(apiStanden.response.data.map(stand => +stand.fieldData.standNrT));
            uniqueStanden = uniqueStanden.filter(stand => !excludeSet.has(+stand));
        }


        const headerRow = excelData[0];
        const standnummerIndex = headerRow.indexOf('standnummer'); // Adjust 'standnummer' as needed
        const standnaamIndex = headerRow.indexOf('standnaam'); // Adjust 'standnaam' as needed

        const standnummerToStandnaam = new Map(excelData.slice(1).map(row => [row[standnummerIndex], row[standnaamIndex]]));

        uniqueStanden = uniqueStanden.map(standnummer => {
            return [standnummer, standnummerToStandnaam.get(standnummer) || 'Unknown'];
        });

        //console.log(uniqueStanden);

        processAllStands(uniqueStanden).then(() => {
            //console.log('Finished processing all stands.');
        });









        // Generate the initial table with unique values and select elements
        generateInitialTable(uniqueValues, apiDossier2Artikelen);

        // Show the button to generate the final table
        document.getElementById('create-final-table').style.display = 'block';
    };
    reader.readAsArrayBuffer(file);
}


function getUniqueValuesFromColumn(data, columnIndex) {
    var values = data.map(row => row[columnIndex]);
    var uniqueValues = [...new Set(values)]; // Remove duplicates
    return uniqueValues.filter(Boolean); // Remove falsy values (e.g., empty strings, null)
}


function generateInitialTable(uniqueValues, apiOptions) {
    var container = document.getElementById('table-container');
    container.innerHTML = ''; // Clear previous content
    var table = document.createElement('table');
    uniqueValues.forEach(uniqueValue => {
        var row = table.insertRow();
        var cell = row.insertCell();
        cell.textContent = uniqueValue;
        var selectCell = row.insertCell();
        var select = document.createElement('select');
        // Set data attribute to associate select with its unique value from column 2
        select.setAttribute('data-column2-value', uniqueValue);
        apiOptions.response.data.forEach(option => {
            var optionElement = document.createElement('option');
            optionElement.value = option.fieldData._k1_dossier2artikel_ID;
            optionElement.textContent = option.fieldData.omschrijving_N_aec;
            optionElement.setAttribute('data-column1-value', option.fieldData._k1_dossier2artikel_ID);
            select.appendChild(optionElement);
        });
        selectCell.appendChild(select);
    });
    container.appendChild(table);
}

async function processAllStands(uniqueStanden) {
    for (let row of uniqueStanden) {
        const [standnummer, standnaam] = row;
        await makeNewStanden(standnummer, standnaam);
    }
    //console.log('All stands processed.');
}

//#endregion

//#region Section 4 : "Create finaldataArray "

document.getElementById('create-final-table').addEventListener('click', function () {
    generateFinalTable();
    mapDataArray();
});

function generateFinalTable() {
    //console.log(apiDossier2Artikelen);
    //console.log(apiStanden);
    finalDataArray = []; // Reset or initialize the array

    // Headers from Excel plus the new 'Artikel volgens AE' column
    var headers = [...excelData[0], 'Artikel volgens AE'];
    finalDataArray.push(headers); // Add headers as the first row in the array

    // Prepare to map selections to column 2 values
    var selects = document.querySelectorAll('#table-container select');
    var selectionsMap = new Map();
    selects.forEach(select => {
        let column2Value = select.getAttribute('data-column2-value');
        let chosenOption = select.options[select.selectedIndex].text;
        selectionsMap.set(column2Value, chosenOption);
    });

    // Iterate over each row in excelData to create new array rows
    excelData.slice(1).forEach(row => {
        var newRow = [...row]; // Clone the row
        var column2Value = row[2]; // Adjusted to 0-based index, assuming column 3 is the reference
        var selection = selectionsMap.get(column2Value) || "No Selection";
        newRow.push(selection); // Append the user's selection to the row
        finalDataArray.push(newRow); // Add the completed row to the final data array
    });

    // Log or further process finalDataArray as needed
    //console.log(finalDataArray);



}



//#endregion

//#region section 5: "manipulate finalDataArray ,send orders to Arnout and create controletabel"

async function mapDataArray() {
    var dossierNummer = sessionStorage.getItem('dossierID');
    apiStanden = await fetchapiStanden();
    const standnummerIndex = finalDataArray[0].findIndex(header => header.toLowerCase() === "standnummer");
    // Check if standnummer column exists
    if (standnummerIndex === -1) {
        console.error("standnummer column not found");
        return;
    }


    // Create a mapping from standnummer to standId for quick lookup
    const standMapping = new Map(apiStanden.response.data.map(item => 
        [
            isNaN(item.fieldData.standNrT) ? item.fieldData.standNrT : Number(item.fieldData.standNrT), 
            Number(item.fieldData._k1_stand_ID)
        ]
    ));
    console.log(standMapping);
    // Iterate over finalDataArray to replace standnummer with standId
    finalDataArray.forEach((row, rowIndex) => {
        if (rowIndex === 0) {
            // For header row, add the new column header
            row.push('Dossiernummer');
        } else {
            var standnummer = row[standnummerIndex];
            // Convert standnummer in the row to number for matching
            if (isNaN(row[standnummerIndex])) {
                standnummer = row[standnummerIndex];
                
            } else { standnummer = Number(row[standnummerIndex]);
                 }

            if (standMapping.has(standnummer)) {
                row[standnummerIndex] = standMapping.get(standnummer);
            } else {
                console.warn(`standId for standnummer "${standnummer}" not found`);
            }
            

            // Add dossiernummer to each row
            row.push(dossierNummer);
        }
    });
    console.log(finalDataArray);
    // Log or return the updated finalDataArray as needed

    const dossierArtikelIndex = finalDataArray[0].findIndex(header => header.toLowerCase() === "artikel volgens ae");
    if (dossierArtikelIndex === -1) {
        console.error("Artikel volgens AE column not found");
        return;
    }

    // Create a mapping from standnummer to standId for quick lookup
    const artikelMapping = new Map(apiDossier2Artikelen.response.data.map(item => [item.fieldData.omschrijving_N_aec, item.fieldData._k1_dossier2artikel_ID]));

    finalDataArray.forEach((row, rowIndex) => {
        if (rowIndex === 0) {
            return;
        } else {
            // Convert standnummer in the row to number for matching
            const dossierArtikel = row[dossierArtikelIndex];
            if (artikelMapping.has(dossierArtikel)) {
                row[dossierArtikelIndex] = artikelMapping.get(dossierArtikel);
            } else {
                console.warn(`dossierArtikelId for artikel "${dossierArtikel}" not found`);
            }

        }
    });

    const columnsToDelete = [1, 2]; // Example: Delete the 3rd and 5th columns (indexes are 0-based)
    deleteColumnsByIndex(finalDataArray, columnsToDelete);

    const newHeaderNames = {
        0: "standID",
        2: "dossier2artikelID",
        3: "dossierID"
    };
    renameHeadersByIndex(finalDataArray, newHeaderNames);



    //console.log(finalDataArray);

    //await readExcelFile(); // This should populate excelData and finalDataArray
    displayTableWithApiResponseColumn(); // Display table first
    await processAllOrdersAndUpdateTable(); // Then process data and update table



    //processAllOrders(finalDataArray).then(() => {
    //    console.log('Finished processing all orders.');
    //});

}

function deleteColumnsByIndex(finalDataArray, columnsToDelete) {
    // Sort columnsToDelete in descending order to avoid index shifting issues
    columnsToDelete.sort((a, b) => b - a);

    finalDataArray.forEach(row => {
        columnsToDelete.forEach(columnIndex => {
            row.splice(columnIndex, 1); // Remove the column from each row
        });
    });
}

function renameHeadersByIndex(finalDataArray, newHeaderNames) {
    // Assuming the first row of finalDataArray contains the headers
    const headerRow = finalDataArray[0];

    Object.entries(newHeaderNames).forEach(([index, newName]) => {
        const columnIndex = parseInt(index, 10); // Ensure the index is an integer
        if (columnIndex >= 0 && columnIndex < headerRow.length) {
            headerRow[columnIndex] = newName; // Rename the header
        }
    });
}




function displayTableWithApiResponseColumn() {
    const tableContainer = document.getElementById('final-table-container');
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create header row based on excelData, plus an additional header for API responses
    const headerRow = document.createElement('tr');
    excelData[0].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    const apiResponseHeader = document.createElement('th');
    apiResponseHeader.textContent = 'API Response';
    headerRow.appendChild(apiResponseHeader);
    thead.appendChild(headerRow);

    // Create data rows from excelData (skipping header row)
    excelData.slice(1).forEach((rowData, rowIndex) => {
        const row = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.textContent = cellData;
            row.appendChild(td);
        });
        // Placeholder cell for API response, to be filled later
        const apiResponseCell = document.createElement('td');
        apiResponseCell.textContent = 'Processing...'; // Temporary text
        apiResponseCell.setAttribute('id', `api-response-${rowIndex}`); // Unique ID for later reference
        row.appendChild(apiResponseCell);

        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.innerHTML = ''; // Clear previous content
    tableContainer.appendChild(table);
}

async function processAllOrdersAndUpdateTable() {
    // Assuming finalDataArray structure matches the rows in excelData
    for (let i = 0; i < finalDataArray.length; i++) {
        const [standID, aantal, dossier2artikelID] = finalDataArray[i];
        const apiResponse = await addDossier2Artikel(standID, aantal, dossier2artikelID);
        // Find the corresponding API response cell in the table and update it
        const apiResponseCell = document.getElementById(`api-response-${i}`);
        apiResponseCell.textContent = apiResponse || 'No response'; // Update with actual API response
    }
    //console.log('All orders processed and table updated.');
}


//#endregion

//#region Section 6 : "Handle all api calls"


async function fetchapiDossier2Artikelen() {

    var dossierNummer = sessionStorage.getItem('dossierID');
    var raw2 = JSON.stringify({
        "query": [
            {
                "_k2_dossier_ID": dossierNummer
            }
        ],
        "sort": [
            {
                "fieldName": "omschrijving_N_aec",
                "sortOrder": "ascend"
            }
        ],
        "limit": "500"
    });
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + await getBearerToken());

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw2,
        redirect: 'follow'
    };


    const apiUrl = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_dossier2artikelen/_find'; // Replace with your actual API URL
    try {
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.json();
        //console.log (data);
        return data; // Assuming the API returns an array of objects with id and name
    } catch (error) {
        console.error('Error fetching API data:', error);
        return []; // Return an empty array in case of an error
    }
}

async function fetchapiStanden() {
    var dossierNummer = sessionStorage.getItem('dossierID');
    var raw2 = JSON.stringify({
        "query": [
            {
                "_k2_dossier_ID": dossierNummer
            }
        ],
        "sort": [
            {
                "fieldName": "_k2_dossier_ID",
                "sortOrder": "ascend"
            }
        ],
        "limit": "500"
    });
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + await getBearerToken());

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw2,
        redirect: 'follow'
    };


    const apiUrl = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_standen/_find'; // Replace with your actual API URL
    try {
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.json();
        if (data.messages[0].code == "0") {
            //console.log ("yow");
            return data;
        } else {
            //console.log("nieyow")
            return [];
        }// Assuming the API returns an array of objects with id and name
    } catch (error) {
        console.error('Error fetching API data:', error);
        return []; // Return an empty array in case of an error
    }
}

async function makeNewStanden(standNummer, standNaam) {
    var dossierNummer = sessionStorage.getItem('dossierID');
    var raw2 = JSON.stringify(
        {
            "fieldData":
            {
                "_k2_dossier_ID": dossierNummer,
                "standNrT": standNummer,
                "firmanaam_standhouder": standNaam
            }
        });
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + await getBearerToken());

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw2,
        redirect: 'follow'
    };


    const apiUrl = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_standen/records'; // Replace with your actual API URL
    try {
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.json();
        //console.log (data);
        return data; // Assuming the API returns an array of objects with id and name
    } catch (error) {
        console.error('Error fetching API data:', error);
        return []; // Return an empty array in case of an error
    }
}

async function addDossier2Artikel(standID, aantal, dossier2artikelID) {
    var dossierNummer = sessionStorage.getItem('dossierID');
    var raw2 = JSON.stringify(
        {
            "fieldData":
            {
                "_k2_dossier_ID": dossierNummer,
                "_k2_stand_ID": standID,
                "_k2_dossier2artikel_ID": dossier2artikelID,
                "aantal": aantal,
                "_org0_sth1_ae2_auto3": "0"
            }
        });
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + await getBearerToken());

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw2,
        redirect: 'follow'
    };


    const apiUrl = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/standen2artikelen_calc/records'; // Replace with your actual API URL
    try {
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.json();
        //console.log (data.messages[0]);
        return data.messages[0].message; // Assuming the API returns an array of objects with id and name
    } catch (error) {
        console.error('Error fetching API data:', error);
        return []; // Return an empty array in case of an error
    }
}

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

//#endregion

//#region Section 7 : "Misc. Functions"

//open pagina (check of User+PW ingevuld zijn)
function openPage() {
    if (localStorage.getItem('userName') && localStorage.getItem('passWord')) {
        loadDossiers();

    } else {
        document.location.href = 'login-page.html';
    }
}

//refresh pagina
const refreshButton = document.getElementById('refresh');

refreshButton.addEventListener('click', function () {
    location.reload()
})

//logout
const clearLocalStorageButton = document.getElementById('logout');


clearLocalStorageButton.addEventListener('click', function () {
    clearLocalStorageButton.disabled = true;

    // Clear specific local storage items related to user session
    localStorage.removeItem('userName');
    localStorage.removeItem('passWord');
    sessionStorage.clear(); // Clear session storage

    // Redirect to login page
    document.location.href = 'login-page.html';
});

//delete records button
document.getElementById('deleteRecordsBtn').addEventListener('click', async () => {
    const layout = 'standen2artikelen_calc';
    const baseURL = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout';

    try {
        // Assuming you have a way to securely get the token
        const token = await getBearerToken();

        // Find records to delete (adjust find query as needed)
        const findResponse = await fetch(`${baseURL}/layouts/${layout}/_find`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: [{ "_k2_dossier_ID": 4458 }]
            })
        });
        const findData = await findResponse.json();
        console.log(findData);
        // Delete records individually
        for (let record of findData.response.data) {
            const recordId = record.recordId;
            await fetch(`${baseURL}/layouts/${layout}/records/${recordId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            console.log(`Deleted record ID: ${recordId}`);
        }
    } catch (error) {
        console.error('There has been a problem with your operation:', error);
    }
});


//#endregion









