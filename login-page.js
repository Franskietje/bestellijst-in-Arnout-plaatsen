const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const loginErrorMsg = document.getElementById("login-error-msg");

const form = document.querySelector('form');
const input = document.querySelector('input');

input.addEventListener('input', () => {
    loginErrorMsg.style.opacity = 0;
});


loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    var bT = getBearerToken();
    sessionStorage.setItem('bearerToken', bT);
    

}) 




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