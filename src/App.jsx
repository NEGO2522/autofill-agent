import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login          from './pages/Login';
import Home           from './pages/Home';
import Form           from './pages/Form';
import ExtensionPopup from './pages/ExtensionPopup';
import Contact        from './components/Contact';

/**
 * Reliable extension detection:
 * chrome.runtime.id is only defined inside an actual extension context.
 * window.innerWidth is unreliable — the popup can be resized.
 */
const IS_EXTENSION =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  !!chrome.runtime.id;

function App() {
  // The extension popup always uses HashRouter and renders only ExtensionPopup.
  // The web app uses HashRouter too (for Vercel SPA compatibility) with full routes.
  if (IS_EXTENSION) {
    return (
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="*" element={<ExtensionPopup />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/"        element={<Login />}   />
          <Route path="/login"   element={<Login />}   />
          <Route path="/home"    element={<Home />}    />
          <Route path="/form"    element={<Form />}    />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
