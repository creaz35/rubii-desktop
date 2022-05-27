import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login'

//const API_URL = 'https://todosapi.dev/api/todos';

class App extends Component {

  render() {
    return (
      <div className="App">
        <Login />
      </div>
    );
  }
}

export default App;
