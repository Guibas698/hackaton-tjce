import { useStore } from './lib/store';
import { Sidebar, Topbar, ToastStack } from './components/Shell';
import IngestModal from './components/IngestModal';
import ProcessDrawer from './components/ProcessDrawer';

import Painel from './pages/Painel';
import Triagem from './pages/Triagem';
import Urgencias from './pages/Urgencias';
import Fila from './pages/Fila';
import Dossie from './pages/Dossie';
import Config from './pages/Config';

export default function App() {
  const { pagina } = useStore();

  const renderPagina = () => {
    switch (pagina) {
      case 'painel':
        return <Painel />;
      case 'triagem':
        return <Triagem />;
      case 'urgencias':
        return <Urgencias />;
      case 'fila':
        return <Fila />;
      case 'dossie':
        return <Dossie />;
      case 'config':
        return <Config />;
      default:
        return <Painel />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="content-area">
          {renderPagina()}
        </main>
      </div>

      <IngestModal />
      <ProcessDrawer />
      <ToastStack />
    </div>
  );
}
