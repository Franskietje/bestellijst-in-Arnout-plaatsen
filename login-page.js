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
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const auth = username + ':' + password;
    const encodedAuth = btoa(auth);
    localStorage.setItem('userName', username);
    localStorage.setItem('passWord', password);

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
            document.location.href = 'index.html';

        })
        .catch(error => {
            // authentication failed
            console.error('Error fetching data: ', error);
            loginErrorMsg.style.opacity = 1;
        });
    


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