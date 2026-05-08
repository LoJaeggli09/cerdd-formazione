import React from 'react';
import { Monitor, Users, Zap, Wrench, Cog, ChefHat } from 'lucide-react';

const HomeScreen = ({ onSelectProfession }) => {
  const professions = [
    { id: 1, name: 'Informatico AFC', icon: Monitor },
    { id: 2, name: 'Impiegato di commercio', icon: Users },
    { id: 3, name: 'Elettricista', icon: Zap },
    { id: 4, name: 'Installatore sanitario', icon: Wrench },
    { id: 5, name: 'Meccanico auto', icon: Cog },
    { id: 6, name: 'Cuoco', icon: ChefHat },
  ];

  return (
    <div className="home-screen">
      <div className="home-container">
        <div className="home-header">
          <div className="logo-icon">
            <Monitor size={48} color="#1a3a52" />
          </div>
          <h1 className="home-title">Monitor formazione apprendistato</h1>
          <p className="home-subtitle">Seleziona la tua professione</p>
        </div>

        <div className="professions-grid">
          {professions.map((profession) => {
            const IconComponent = profession.icon;
            return (
              <div
                key={profession.id}
                className="profession-card"
                onClick={() => onSelectProfession(profession.name)}
              >
                <div className="profession-icon">
                  <IconComponent size={40} color="#1a3a52" />
                </div>
                <h3 className="profession-name">{profession.name}</h3>
                <button className="profession-button">Seleziona</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
