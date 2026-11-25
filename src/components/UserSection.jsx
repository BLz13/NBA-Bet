import Bee from '../assets/bee.svg?react';
import Egg from '../assets/egg.svg?react';
import Giraffe from '../assets/giraffe.svg?react';
import Tomato from '../assets/tomato.svg?react';
import { USER_DATA } from '../assets/userData';
import { useState } from 'react';
import teamLogos from '../assets/teamLogos';

const getTeamLogo = (teamName) => {
  // Normalize team name to match NBA API TeamName field (lowercase)
  const normalized = teamName.toLowerCase();
  return teamLogos[normalized] || '';
};

const ICON_COMPONENTS = {
  bruno: Egg,
  nicolas: Bee,
  lucas: Tomato,
  franco: Giraffe,
};

const ChevronDown = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// Helper: Find actual NBA team in standings by user's team name (abbreviation)
const findActualTeam = (predictedTeam, actualTeams) => {
  // Match by team name (e.g., "spurs" matches "Spurs", "lakers" matches "Lakers")
  const predictedLower = predictedTeam.toLowerCase();
  return actualTeams.find(t =>
    t.name.toLowerCase() === predictedLower ||
    t.city.toLowerCase() === predictedLower ||
    `${t.city} ${t.name}`.toLowerCase().replace(/\s+/g, '') === predictedLower.replace(/\s+/g, '')
  );
};

// Helper: Calculate points for a single team prediction
const calculateTeamPoints = (predictedTeam, predictedPosition, actualTeams) => {
  const actualTeam = findActualTeam(predictedTeam, actualTeams);
  if (!actualTeam) return { points: 0, actualTeam: null };

  const actualPosition = actualTeams.findIndex(t => t.id === actualTeam.id) + 1;
  let points = 0;

  // Regla 1: Category match (playoffs/play-in)
  const predictedInPlayoffs = predictedPosition <= 6;
  const predictedInPlayIn = predictedPosition >= 7 && predictedPosition <= 10;
  const actualInPlayoffs = actualPosition <= 6;
  const actualInPlayIn = actualPosition >= 7 && actualPosition <= 10;

  if (predictedInPlayoffs && actualInPlayoffs) points += 1;
  if (predictedInPlayIn && actualInPlayIn) points += 1;

  // Regla 2: Position accuracy
  const diff = Math.abs(predictedPosition - actualPosition);
  if (diff === 0) points += 4;
  else if (diff === 1) points += 2;
  else if (diff === 2) points += 1;

  return { points, actualTeam };
};

const UserSection = ({ title, isAccordion = true, westernTeams, easternTeams }) => {
  const userKey = title.toLowerCase();
  const data = USER_DATA[userKey];
  const [isOpen, setIsOpen] = useState(false);

  if (!data) {
    return (
      <div id={userKey} className="section user-section">
        <h2>{title}</h2>
        <p>No data available for this user.</p>
      </div>
    );
  }

  const IconComponent = ICON_COMPONENTS[userKey];

  // Render conference standings with points
  const renderConference = (conferenceName, predictedTeams, actualTeams) => (
    <div className={`subsection ${conferenceName.toLowerCase()}`}>
      <h3>{conferenceName} Conference</h3>
      <ol>
        {predictedTeams.map((team, index) => {
          const predictedPosition = index + 1;
          const { points, actualTeam } = calculateTeamPoints(team, predictedPosition, actualTeams);
          const logoName = actualTeam ? actualTeam.name : team;

          return (
            <li key={index} className="team-prediction">
              {getTeamLogo(logoName) && <img src={getTeamLogo(logoName)} alt={logoName} className="team-logo" />}
              <span>
                <span className="team-city">{actualTeam.city}</span>
                <span className="team-name">{actualTeam.name}</span>
              </span>
              <span className="team-points">{points} pts</span>
            </li>
          );
        })}
      </ol>
    </div>
  );

  return (
    <div id={userKey} className="section">

      <h2 onClick={() => isAccordion && setIsOpen(!isOpen)} style={{ cursor: isAccordion ? 'pointer' : 'default' }}>
        <span className="user-icon">
          {IconComponent && <IconComponent className="user-icon" />}
        </span>
        {title}
        {isAccordion && (
          <ChevronDown className={`chevron ${isOpen ? 'open' : 'closed'}`} />
        )}
      </h2>

      <div className={`accordion-content ${isOpen ? 'open' : 'closed'}`}>
        {renderConference('Western', data.west, westernTeams)}
        {renderConference('Eastern', data.east, easternTeams)}
      </div>
    </div>
  );
};

export default UserSection;