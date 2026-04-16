import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './index.css';

const rootElement = document.querySelector<HTMLDivElement>('#root');

if (!rootElement) {
    throw new Error('Missing required node: #root');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App initialTitle={rootElement.dataset.appTitle ?? 'Steam Discovery Dashboard'} />
    </React.StrictMode>
);
