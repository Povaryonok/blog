document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("modal");
    var loginForm = document.getElementById("login-form");
    var registrationForm = document.getElementById("registration-form");
    var showRegister = document.getElementById("show-register");
    var showLogin = document.getElementById("show-login");

    // Show the modal when the page loads
    modal.style.display = "block";

    // Show the registration form and hide the login form
    showRegister.onclick = function(event) {
        event.preventDefault();
        loginForm.style.display = "none";
        registrationForm.style.display = "block";
    }

    // Show the login form and hide the registration form
    showLogin.onclick = function(event) {
        event.preventDefault();
        registrationForm.style.display = "none";
        loginForm.style.display = "block";
    }

    // Handle login form submission
    loginForm.onsubmit = function(event) {
        event.preventDefault();
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = "main.html";
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Handle registration form submission
    registrationForm.onsubmit = function(event) {
        event.preventDefault();
        var username = document.getElementById("new-username").value;
        var email = document.getElementById("email").value;
        var password = document.getElementById("new-password").value;

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = "main.html";
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }
});
