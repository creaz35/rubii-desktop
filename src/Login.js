import React, { Component, useState }  from 'react';
import rubii from './img/rubii.png';
import axios from 'axios';

function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const isSubmitted = useState(false);

    const handleSubmit = (event) => {

        //Prevent page reload
        event.preventDefault();

        axios({
          method: "POST",
          url: process.env.REACT_APP_API_URL + '/desktop/login',
          headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
          data: {
           email: email,
           password: password
         }
        })
        .then(result => {
            if(result.data.json.error == false) {
              // Ok the user was able to logged in with no issue
            } else {
              // Credentials are wrong
            }
        })
        .catch(
          // isSubmitted
        );

    };

    const renderForm = (
    <div className="form">
      <form onSubmit={handleSubmit}>
          <div className="input-container">
              <input type="text" value={email} required placeholder="Email" onInput={e => setEmail(e.target.value)}/>
          </div>
          <div className="input-container mt-20">
            <input type="password" value={password} required placeholder="Password" onInput={e => setPassword(e.target.value)}/>
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
        {renderForm}
      </div>
    </div>
    )
}

export default Login;