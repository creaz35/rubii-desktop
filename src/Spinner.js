import React, { Component, useState, useEffect }  from 'react';
import loadingSpinner from './img/loading.gif';

function Spinner() {

    return (
      <div>
        <img src={loadingSpinner} className="spinnerLoad" />
      </div>
    )
}

export default Spinner;