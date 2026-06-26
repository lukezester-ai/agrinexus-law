import { Theme } from './settings/types';
import { AgriNexusLanding } from './components/generated/AgriNexusLanding';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return <AgriNexusLanding />;
}

export default App;