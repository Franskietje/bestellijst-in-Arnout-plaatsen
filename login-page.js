const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const loginErrorMsg = document.getElementById("login-error-msg");

//const form = document.querySelector('form');
const input = document.querySelector('input');

input.addEventListener('input', () => {
    loginErrorMsg.style.opacity = 0;
});


loginButton.addEventListener("click", async (e) => {
    e.preventDefault(); // Prevent form submission

    try {
        const bT = await getBearerToken(); // Await the promise resolved value
        if (bT) {
            sessionStorage.setItem('bearerToken', bT);
            localStorage.setItem('userName', loginForm.username.value);
            localStorage.setItem('passWord', loginForm.password.value);
            localStorage.setItem('fullName', await getFullName(bT));
            document.location.href = 'index.html';
            // Redirect user or show success message
        } else {
            // Handle login failure (e.g., show error message)
            loginErrorMsg.style.opacity = 1;
            loginErrorMsg.textContent = "Login failed. Please check your username and password.";
        }
    } catch (error) {
        console.error('Login error:', error);
        // Show a more generic error message in production use
        loginErrorMsg.style.opacity = 1;
        loginErrorMsg.textContent = "An error occurred. Please try again later.";
    }
});


async function getBearerToken() {

    const username = loginForm.username.value;
    const password = loginForm.password.value;
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

async function getFullName(bT) {
    const url = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/personen_form_details/_find';
    var raw = JSON.stringify({
        "query": [
            {
                "account_naam": loginForm.username.value
            }]}
       ) ;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + bT
        },
        body:raw
    };

    const response = await fetch(url, options);

    const data = await response.json();
    //console.log (data)
    const fullName = data.response.data[0].fieldData.voornaam_naam_c;

    return fullName;
}
