import React, { Component, useState }  from 'react';
import rubii from './img/rubii.png';

function Login() {

    // React States
    const [errorMessages, setErrorMessages] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // User Login info
    const database = [
        {
        email: "user1",
        password: "pass1"
        },
        {
        email: "user2",
        password: "pass2"
        }
    ];

    const errors = {
        uname: "Invalid email",
        pass: "Invalid password"
    };

    const handleSubmit = (event) => {
        //Prevent page reload
        event.preventDefault();
    
        var { uname, pass } = document.forms[0];
    
        // Find user login info
        const userData = database.find((user) => user.email === uname.value);
    
        // Compare user info
        if (userData) {
          if (userData.password !== pass.value) {
            // Invalid password
            setErrorMessages({ name: "pass", message: errors.pass });
          } else {
            setIsSubmitted(true);
          }
        } else {
          // Email not found
          setErrorMessages({ name: "uname", message: errors.uname });
        }
      };

    const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="error">{errorMessages.message}</div>
    );

    const renderForm = (
    <div className="form">
        <form onSubmit={handleSubmit}>
        <div className="input-container">
            <input type="text" name="uname" placeholder="Email" required />
            {renderErrorMessage("uname")}
        </div>
        <div className="input-container mt-20">
            <input type="password" name="pass" required placeholder="Password" />
            {renderErrorMessage("pass")}
        </div>
        <div className="extra-buttons">
            <div className="remember-me checkbox text-left">
                <input type="checkbox" value="lsRememberMe" id="rememberMe" /> <label for="rememberMe">Remember me</label>
            </div>
            <div classname="forgot-password text-right">
                <a href="https://rubii.com/app/forgot_password" target="_blank">Forgot Password?</a>
            </div>
        </div>
        <div className="button-container">
            <input type="submit" value="Login" />
        </div>
        </form>
    </div>
    );

    return (
    <div className="login">
      <div className="login-form">
        <img src={rubii} className="logo" />
        {isSubmitted ? <div>User is successfully logged in</div> : renderForm}
      </div>
    </div>
    )
}

export default Login;