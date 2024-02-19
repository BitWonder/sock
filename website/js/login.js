function try_login() {
    const socket = new WebSocket (
        'ws://localhost:8080/user'
    );

    socket.onopen = () => {
        socket.send(
            JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        )
    }

    socket.onmessage = (message) => {
        if (message == "true") {
            // go onto next stuff
        }
        // the else
        socket.close();
        alert("Incorrect Username or Password? \n(We don't know which on it is)");
    }
}