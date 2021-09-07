import React from 'react';
import './App.css';
import {WorkElements} from "./features/workelements/WorkElements";
import {SubmitBar} from "./features/submitbar/SubmitBar";
import {Suggestions} from "./features/suggestions/Suggestions";
import {History} from "./features/history/History";
import {SearchRules} from "./features/searchrules/SearchRules";

function App() {
  return (
    <div className="App">
        <SubmitBar />
        <Suggestions />
        <WorkElements />
        <History />
        <SearchRules />
    </div>
  );
}

export default App;
