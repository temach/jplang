import React from 'react';
import './App.css';
import {WorkElements} from "./features/workelements/WorkElements";
import {SubmitBar} from "./features/submitbar/SubmitBar";
import {Suggestions} from "./features/suggestions/Suggestions";

function App() {
  return (
    <div className="App">
        <SubmitBar />
        <Suggestions />
        <WorkElements />
    </div>
  );
}

export default App;
