import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './index.css';

// finds the html mount point that also carries the initial app title.
const rootElement = document.querySelector<HTMLDivElement>('#root');

// mounts react in strict mode so development catches unsafe render behavior.
ReactDOM.createRoot(rootElement!).render(
    <React.StrictMode>
        <App initialTitle={rootElement?.dataset.appTitle ?? 'Steam Discovery Dashboard'} />
    </React.StrictMode>
);
